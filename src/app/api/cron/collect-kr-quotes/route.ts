import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchNaverMarketData, fetchNaverIndices } from "@/lib/data-sources/naver"
import { getLastTradingDate } from "@/lib/data-sources/krx"
import { logCronResult } from "@/lib/utils/cron-logger"
import { revalidateTag, revalidatePath } from "next/cache"
import { isKrHoliday } from "@/lib/utils/trading-calendar"

// Vercel Pro: 최대 300초. Hobby는 60초 제한으로 종목 수가 많을 경우 일부만 처리됨.
export const maxDuration = 300

const BATCH_SIZE = 100

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (isKrHoliday()) {
    console.log("[cron-kr] Skipping: KR market holiday")
    return NextResponse.json({ ok: true, skipped: true, reason: "KR holiday" })
  }

  const dateStr = getLastTradingDate()
  const dateObj = new Date(
    `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00.000Z`
  )

  console.log(`[cron-kr] Collecting Naver Finance data for ${dateStr}`)
  const cronStart = Date.now()

  // 1. KOSPI + KOSDAQ + 지수 병렬 수집
  const [kospiResult, kosdaqResult, indexResult] = await Promise.allSettled([
    fetchNaverMarketData("KOSPI"),
    fetchNaverMarketData("KOSDAQ"),
    fetchNaverIndices(),
  ])

  // 2. DB에서 KR 종목 조회
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

  // 3. 시세 + 일봉 처리
  if (kospiResult.status === "fulfilled" || kosdaqResult.status === "fulfilled") {
    const allStocks = [
      ...(kospiResult.status === "fulfilled" ? kospiResult.value : []),
      ...(kosdaqResult.status === "fulfilled" ? kosdaqResult.value : []),
    ].filter((s) => tickerToId.has(s.ticker))

    if (kospiResult.status === "rejected")
      stats.errors.push(`KOSPI: ${String(kospiResult.reason)}`)
    if (kosdaqResult.status === "rejected")
      stats.errors.push(`KOSDAQ: ${String(kosdaqResult.reason)}`)

    // DailyPrice: Naver 시장요약은 OHLCV를 제공하지 않아 종가로 대체
    // (OHLCV 정밀 시딩은 scripts/seed-daily-prices.ts 사용)
    try {
      const result = await prisma.dailyPrice.createMany({
        data: allStocks.map((s) => ({
          stockId: tickerToId.get(s.ticker)!,
          date: dateObj,
          open: s.price,
          high: s.price,
          low: s.price,
          close: s.price,
          volume: s.volume,
        })),
        skipDuplicates: true,
      })
      stats.dailyPrice = result.count
    } catch (e) {
      stats.errors.push(`DailyPrice: ${String(e)}`)
    }

    // 52주 최고/최저 계산 (DailyPrice에서 최근 1년)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const stockIds = allStocks.map((s) => tickerToId.get(s.ticker)!).filter(Boolean)

    const fiftyTwoWeekData = await prisma.dailyPrice.groupBy({
      by: ["stockId"],
      where: { stockId: { in: stockIds }, date: { gte: oneYearAgo } },
      _max: { high: true },
      _min: { low: true },
    })
    const fiftyTwoWeekMap = new Map(
      fiftyTwoWeekData.map((d) => [d.stockId, { high52w: d._max.high, low52w: d._min.low }])
    )

    // StockQuote: 100건씩 병렬 upsert
    const batches = chunk(allStocks, BATCH_SIZE)
    for (const batch of batches) {
      const settled = await Promise.allSettled(
        batch.map(async (s) => {
          const stockId = tickerToId.get(s.ticker)!
          const w52 = fiftyTwoWeekMap.get(stockId)
          const quoteData = {
            price: s.price,
            previousClose: s.previousClose,
            change: s.change,
            changePercent: s.changePercent,
            open: s.price,
            high: s.price,
            low: s.price,
            volume: s.volume,
            marketCap: s.marketCap,
            per: s.per,
            pbr: null,
            high52w: w52?.high52w ?? null,
            low52w: w52?.low52w ?? null,
          }
          return prisma.stockQuote.upsert({
            where: { stockId },
            update: quoteData,
            create: { stockId, ...quoteData },
          })
        })
      )
      for (const r of settled) {
        if (r.status === "fulfilled") stats.stockQuote++
        else stats.errors.push(`StockQuote: ${String(r.reason).slice(0, 100)}`)
      }
    }
  }

  // 4. MarketIndex (KOSPI, KOSDAQ)
  if (indexResult.status === "fulfilled") {
    for (const idx of indexResult.value) {
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
        stats.marketIndex++
      } catch (e) {
        stats.errors.push(`MarketIndex ${idx.symbol}: ${String(e)}`)
      }
    }
  } else {
    stats.errors.push(`Index: ${String(indexResult.reason)}`)
  }

  console.log(
    `[cron-kr] Done: date=${stats.date}, dailyPrice=${stats.dailyPrice}, stockQuote=${stats.stockQuote}, marketIndex=${stats.marketIndex}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-kr] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-kr-quotes", cronStart, result)
  revalidateTag("quotes", { expire: 0 })
  for (const s of dbStocks) {
    revalidatePath(`/stock/${s.ticker}`)
  }
  return NextResponse.json(result)
}
