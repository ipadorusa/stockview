/**
 * US 시세 수집 스크립트
 * GitHub Actions에서 직접 실행 (Vercel 서버리스 타임아웃 회피)
 *
 * 사용법:
 *   npx tsx scripts/collect-us-quotes.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import {
  fetchYfQuotes,
  fetchYfDailyOhlcv,
  fetchYfIndices,
} from "../src/lib/data-sources/yahoo"
import { isUsHoliday } from "../src/lib/utils/trading-calendar"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const BATCH_SIZE = 20

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  if (isUsHoliday()) {
    console.log("[collect-us-quotes] Skipping: US market holiday")
    return
  }

  console.log("[collect-us-quotes] Starting (post-market-close)")
  const start = Date.now()

  const dbStocks = await prisma.stock.findMany({
    where: { market: "US", isActive: true },
    select: { id: true, ticker: true },
  })
  const tickerToId = new Map(dbStocks.map((s) => [s.ticker, s.id]))
  const tickers = dbStocks.map((s) => s.ticker)

  const stats = {
    total: tickers.length,
    stockQuote: 0,
    dailyPrice: 0,
    marketIndex: 0,
    errors: [] as string[],
  }

  // 시세 수집 (배치)
  const batches = chunk(tickers, BATCH_SIZE)
  const allQuotes: Awaited<ReturnType<typeof fetchYfQuotes>> = []

  for (let i = 0; i < batches.length; i++) {
    try {
      const quotes = await fetchYfQuotes(batches[i])
      allQuotes.push(...quotes)
    } catch (e) {
      stats.errors.push(`Batch ${i} quote: ${String(e)}`)
    }
    if (i < batches.length - 1) await sleep(1000)
  }

  // StockQuote upsert
  for (const q of allQuotes) {
    const stockId = tickerToId.get(q.ticker)
    if (!stockId) continue
    try {
      const quoteData = {
        price: q.price,
        previousClose: q.previousClose,
        change: q.change,
        changePercent: q.changePercent,
        open: q.open,
        high: q.high,
        low: q.low,
        volume: q.volume,
        marketCap: q.marketCap,
        high52w: q.high52w,
        low52w: q.low52w,
        per: q.per,
        preMarketPrice: q.preMarketPrice,
        postMarketPrice: q.postMarketPrice,
      }
      await prisma.stockQuote.upsert({
        where: { stockId },
        update: quoteData,
        create: { stockId, ...quoteData },
      })
      stats.stockQuote++
    } catch (e) {
      stats.errors.push(`StockQuote ${q.ticker}: ${String(e)}`)
    }
  }

  // DailyPrice 수집
  const today = new Date()
  const dateStr = today.toISOString().split("T")[0]
  const dateObj = new Date(`${dateStr}T00:00:00.000Z`)

  const ohlcvBatches = chunk(tickers, 10)
  for (const batch of ohlcvBatches) {
    await Promise.allSettled(
      batch.map(async (ticker) => {
        const stockId = tickerToId.get(ticker)
        if (!stockId) return
        try {
          const data = await fetchYfDailyOhlcv(ticker, 2)
          const todayData = data.find((d) => d.time === dateStr) ?? data[data.length - 1]
          if (!todayData) return
          await prisma.dailyPrice.upsert({
            where: { stockId_date: { stockId, date: dateObj } },
            update: {
              open: todayData.open,
              high: todayData.high,
              low: todayData.low,
              close: todayData.close,
              adjClose: todayData.adjClose,
              volume: todayData.volume,
            },
            create: {
              stockId,
              date: dateObj,
              open: todayData.open,
              high: todayData.high,
              low: todayData.low,
              close: todayData.close,
              adjClose: todayData.adjClose,
              volume: todayData.volume,
            },
          })
          stats.dailyPrice++
        } catch (e) {
          stats.errors.push(`DailyPrice ${ticker}: ${String(e)}`)
        }
      })
    )
    await sleep(300)
  }

  // MarketIndex (S&P 500, NASDAQ) + History
  try {
    const usIndices = await fetchYfIndices()
    for (const idx of usIndices) {
      try {
        await prisma.marketIndex.upsert({
          where: { symbol: idx.symbol },
          update: { value: idx.value, change: idx.change, changePercent: idx.changePercent },
          create: {
            symbol: idx.symbol,
            name: idx.name,
            value: idx.value,
            change: idx.change,
            changePercent: idx.changePercent,
          },
        })
        // MarketIndexHistory upsert (당일 이력)
        await prisma.marketIndexHistory.upsert({
          where: { symbol_date: { symbol: idx.symbol, date: dateObj } },
          update: {
            close: idx.value,
            change: idx.change,
            changePercent: idx.changePercent,
          },
          create: {
            symbol: idx.symbol,
            date: dateObj,
            close: idx.value,
            change: idx.change,
            changePercent: idx.changePercent,
          },
        })
        stats.marketIndex++
      } catch (e) {
        stats.errors.push(`MarketIndex ${idx.symbol}: ${String(e)}`)
      }
    }
  } catch (e) {
    stats.errors.push(`Index fetch: ${String(e)}`)
  }

  const duration = Date.now() - start
  console.log(
    `[collect-us-quotes] Done in ${duration}ms: total=${stats.total}, stockQuote=${stats.stockQuote}, dailyPrice=${stats.dailyPrice}, marketIndex=${stats.marketIndex}`
  )
  if (stats.errors.length > 0) {
    console.error(`[collect-us-quotes] Errors (${stats.errors.length}):`, stats.errors)
  }

  // CronLog 기록
  try {
    await prisma.cronLog.create({
      data: {
        jobName: "collect-us-quotes",
        status: stats.stockQuote === 0 ? "error" : stats.errors.length > 0 ? "partial" : "success",
        duration,
        details: JSON.stringify(stats),
      },
    })
  } catch (e) {
    console.error("[collect-us-quotes] Failed to log:", e)
  }

  await prisma.$disconnect()

  if (stats.stockQuote === 0 && stats.total > 0) {
    process.exit(1)
  }
}

main()
