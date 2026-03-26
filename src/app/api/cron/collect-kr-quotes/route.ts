import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchNaverMarketData, fetchNaverIndices } from "@/lib/data-sources/naver"
import { getLastTradingDate } from "@/lib/data-sources/krx"
import { logCronResult } from "@/lib/utils/cron-logger"
import { revalidateTag, revalidatePath } from "next/cache"
import { isKrHoliday } from "@/lib/utils/trading-calendar"
import { sendTelegramAlert } from "@/lib/utils/telegram"

// Hobby 60초 제한 내 운영. ?exchange=KOSPI 또는 ?exchange=KOSDAQ 으로 분할 실행 권장.
export const maxDuration = 55

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

  // KR 장 마감(15:30 KST) 전이면 skip — 장전 Naver 데이터는 change=0, volume=0
  // ?force=true 로 우회 가능
  const exchangeParam = req.nextUrl.searchParams.get("exchange") as "KOSPI" | "KOSDAQ" | null
  const force = req.nextUrl.searchParams.get("force") === "true"
  if (!force) {
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const kstHour = nowKst.getUTCHours()
    const kstMin = nowKst.getUTCMinutes()
    if (kstHour < 15 || (kstHour === 15 && kstMin < 30)) {
      console.log(`[cron-kr] Skipping: KR market not yet closed (KST ${kstHour}:${String(kstMin).padStart(2, "0")})`)
      return NextResponse.json({ ok: true, skipped: true, reason: "KR market not yet closed" })
    }
  }

  const dateStr = getLastTradingDate()
  const dateObj = new Date(
    `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00.000Z`
  )

  console.log(`[cron-kr] Collecting Naver Finance data for ${dateStr}${exchangeParam ? ` (exchange=${exchangeParam})` : ""}`)
  const cronStart = Date.now()

  // 1. exchange 파라미터에 따라 선택적 수집
  const fetchKospi = !exchangeParam || exchangeParam === "KOSPI"
  const fetchKosdaq = !exchangeParam || exchangeParam === "KOSDAQ"
  const [kospiResult, kosdaqResult, indexResult] = await Promise.allSettled([
    fetchKospi ? fetchNaverMarketData("KOSPI") : Promise.resolve([]),
    fetchKosdaq ? fetchNaverMarketData("KOSDAQ") : Promise.resolve([]),
    fetchNaverIndices(),
  ])

  // 2. DB에서 KR 종목 조회 (exchange 필터 적용)
  const dbStocks = await prisma.stock.findMany({
    where: { market: "KR", isActive: true, ...(exchangeParam ? { exchange: exchangeParam } : {}) },
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
          const baseData = {
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
            high52w: w52?.high52w ?? null,
            low52w: w52?.low52w ?? null,
          }
          return prisma.stockQuote.upsert({
            where: { stockId },
            update: baseData,
            create: { stockId, ...baseData, pbr: null },
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
    await sendTelegramAlert(
      `KR Quotes 크론 에러 (${exchangeParam ?? "ALL"})`,
      `에러 ${stats.errors.length}건:\n${stats.errors.slice(0, 5).join("\n")}`,
      "warning"
    ).catch(() => {})
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-kr-quotes", cronStart, result)
  revalidateTag("quotes", { expire: 0 })
  for (const s of dbStocks) {
    revalidatePath(`/stock/${s.ticker}`)
  }
  return NextResponse.json(result)
}
