import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  fetchKrxDailyOhlcv,
  fetchKrxFundamentals,
  fetchKrxIndex,
  getLastTradingDate,
} from "@/lib/data-sources/krx"

const BATCH_SIZE = 100

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dateStr = getLastTradingDate()
  const dateObj = new Date(
    `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00.000Z`
  )

  console.log(`[cron-kr] Collecting KRX data for ${dateStr}`)

  // 1. 모든 데이터 병렬 수집 (실패해도 계속 진행)
  const [kospiOhlcv, kosdaqOhlcv, kospiFund, kosdaqFund, indexData] =
    await Promise.allSettled([
      fetchKrxDailyOhlcv(dateStr, "STK"),
      fetchKrxDailyOhlcv(dateStr, "KSQ"),
      fetchKrxFundamentals(dateStr, "STK"),
      fetchKrxFundamentals(dateStr, "KSQ"),
      fetchKrxIndex(dateStr),
    ])

  // 2. DB에 등록된 KR 종목 조회
  const dbStocks = await prisma.stock.findMany({
    where: { market: "KR", isActive: true },
    select: { id: true, ticker: true },
  })
  const tickerToId = new Map(dbStocks.map((s) => [s.ticker, s.id]))

  const stats = {
    date: dateStr,
    dailyPrice: 0,
    stockQuote: 0,
    marketIndex: 0,
    errors: [] as string[],
  }

  // 3. OHLCV 처리 (KOSPI + KOSDAQ 합산)
  if (
    kospiOhlcv.status === "fulfilled" &&
    kosdaqOhlcv.status === "fulfilled"
  ) {
    const allOhlcv = [...kospiOhlcv.value, ...kosdaqOhlcv.value]
    // DB에 없는 종목은 무시
    const filtered = allOhlcv.filter((o) => tickerToId.has(o.ticker))

    // Fundamentals 맵 생성
    const fundMap = new Map<
      string,
      { marketCap: bigint | null; per: number | null; pbr: number | null }
    >()
    if (kospiFund.status === "fulfilled") {
      for (const f of kospiFund.value) fundMap.set(f.ticker, f)
    }
    if (kosdaqFund.status === "fulfilled") {
      for (const f of kosdaqFund.value) fundMap.set(f.ticker, f)
    }

    // DailyPrice: 장마감 후 1회 수집 → createMany skipDuplicates로 멱등성 보장
    try {
      const result = await prisma.dailyPrice.createMany({
        data: filtered.map((o) => ({
          stockId: tickerToId.get(o.ticker)!,
          date: dateObj,
          open: o.open,
          high: o.high,
          low: o.low,
          close: o.close,
          volume: o.volume,
        })),
        skipDuplicates: true,
      })
      stats.dailyPrice = result.count
    } catch (e) {
      stats.errors.push(`DailyPrice: ${String(e)}`)
    }

    // StockQuote: 종가 기준 최신 스냅샷 upsert (배치 처리)
    const batches = chunk(filtered, BATCH_SIZE)
    for (const batch of batches) {
      try {
        await prisma.$transaction(
          batch.map((o) => {
            const stockId = tickerToId.get(o.ticker)!
            const fund = fundMap.get(o.ticker)
            const previousClose = o.close - o.change

            const quoteData = {
              price: o.close,
              previousClose,
              change: o.change,
              changePercent: o.changePercent,
              open: o.open,
              high: o.high,
              low: o.low,
              volume: o.volume,
              marketCap: fund?.marketCap ?? null,
              per: fund?.per ?? null,
              pbr: fund?.pbr ?? null,
            }

            return prisma.stockQuote.upsert({
              where: { stockId },
              update: quoteData,
              create: { stockId, ...quoteData },
            })
          })
        )
        stats.stockQuote += batch.length
      } catch (e) {
        stats.errors.push(`StockQuote batch: ${String(e)}`)
      }
    }
  } else {
    if (kospiOhlcv.status === "rejected") {
      stats.errors.push(`KOSPI OHLCV: ${String(kospiOhlcv.reason)}`)
    }
    if (kosdaqOhlcv.status === "rejected") {
      stats.errors.push(`KOSDAQ OHLCV: ${String(kosdaqOhlcv.reason)}`)
    }
  }

  // 4. MarketIndex upsert (KOSPI, KOSDAQ)
  if (indexData.status === "fulfilled") {
    for (const idx of indexData.value) {
      try {
        await prisma.marketIndex.upsert({
          where: { symbol: idx.symbol },
          update: {
            value: idx.value,
            change: idx.change,
            changePercent: idx.changePercent,
          },
          create: {
            symbol: idx.symbol,
            name: idx.name,
            value: idx.value,
            change: idx.change,
            changePercent: idx.changePercent,
          },
        })
        stats.marketIndex++
      } catch (e) {
        stats.errors.push(`MarketIndex ${idx.symbol}: ${String(e)}`)
      }
    }
  } else {
    stats.errors.push(`Index: ${String(indexData.reason)}`)
  }

  console.log(
    `[cron-kr] Done: date=${stats.date}, dailyPrice=${stats.dailyPrice}, stockQuote=${stats.stockQuote}, marketIndex=${stats.marketIndex}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-kr] Errors (${stats.errors.length}):`, stats.errors)
  }

  return NextResponse.json({ ok: true, ...stats })
}
