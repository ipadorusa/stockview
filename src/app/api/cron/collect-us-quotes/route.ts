import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  fetchYfQuotes,
  fetchYfDailyOhlcv,
} from "@/lib/data-sources/yahoo"

const BATCH_SIZE = 20 // fetchYfQuotes 내부에서 5개씩 병렬 처리됨

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

/** 배치 사이 대기 (비공식 API rate limit 회피) */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log(`[cron-us] Starting (post-market-close)`)

  // 1. DB에서 US 종목 조회
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
    errors: [] as string[],
  }

  // 2. 시세 수집 (배치)
  const batches = chunk(tickers, BATCH_SIZE)
  const allQuotes: Awaited<ReturnType<typeof fetchYfQuotes>> = []

  for (let i = 0; i < batches.length; i++) {
    try {
      const quotes = await fetchYfQuotes(batches[i])
      allQuotes.push(...quotes)
    } catch (e) {
      stats.errors.push(`Batch ${i} quote: ${String(e)}`)
    }
    // 배치 간 1초 딜레이 (마지막 배치 제외)
    if (i < batches.length - 1) await sleep(1000)
  }

  // 3. StockQuote upsert
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

  // 4. DailyPrice 수집 (병렬 최대 5개)
  const today = new Date()
  const dateStr = today.toISOString().split("T")[0]
  const dateObj = new Date(`${dateStr}T00:00:00.000Z`)

  const ohlcvBatches = chunk(tickers, 5)
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
    await sleep(500)
  }

  console.log(
    `[cron-us] Done: total=${stats.total}, stockQuote=${stats.stockQuote}, dailyPrice=${stats.dailyPrice}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-us] Errors (${stats.errors.length}):`, stats.errors)
  }

  return NextResponse.json({ ok: true, ...stats })
}
