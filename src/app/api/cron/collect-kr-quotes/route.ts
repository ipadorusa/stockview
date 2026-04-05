import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchKrxDailyOhlcv, fetchKrxFundamentals, fetchKrxIndex, getLastTradingDate } from "@/lib/data-sources/krx"
import { fetchNaverMarketData, fetchNaverIndices } from "@/lib/data-sources/naver"
import { logCronResult } from "@/lib/utils/cron-logger"
import { revalidateTag } from "next/cache"
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

  // KR 장 마감(15:30 KST) 전이면 skip
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

  console.log(`[cron-kr] Collecting KRX data for ${dateStr}${exchangeParam ? ` (exchange=${exchangeParam})` : ""}`)
  const cronStart = Date.now()

  // 1. KRX API로 OHLCV + 시가총액/PER/PBR 수집 (정규장 종가, NXT 제외)
  const fetchKospi = !exchangeParam || exchangeParam === "KOSPI"
  const fetchKosdaq = !exchangeParam || exchangeParam === "KOSDAQ"

  const [kospiOhlcv, kosdaqOhlcv, kospiFund, kosdaqFund, krxIndex] = await Promise.allSettled([
    fetchKospi ? fetchKrxDailyOhlcv(dateStr, "STK") : Promise.resolve([]),
    fetchKosdaq ? fetchKrxDailyOhlcv(dateStr, "KSQ") : Promise.resolve([]),
    fetchKospi ? fetchKrxFundamentals(dateStr, "STK") : Promise.resolve([]),
    fetchKosdaq ? fetchKrxFundamentals(dateStr, "KSQ") : Promise.resolve([]),
    fetchKrxIndex(dateStr),
  ])

  // KRX 실패 시 Naver fallback — 요청한 exchange 중 성공한 게 하나도 없으면 fallback
  const anyKrxOk = (fetchKospi && kospiOhlcv.status === "fulfilled") ||
                   (fetchKosdaq && kosdaqOhlcv.status === "fulfilled")
  const useNaverFallback = !anyKrxOk
  if (useNaverFallback) {
    console.warn("[cron-kr] KRX API failed, falling back to Naver")
  }

  // 2. DB에서 KR 종목 조회
  const dbStocks = await prisma.stock.findMany({
    where: { market: "KR", isActive: true, ...(exchangeParam ? { exchange: exchangeParam } : {}) },
    select: { id: true, ticker: true },
  })
  const tickerToId = new Map(dbStocks.map((s) => [s.ticker, s.id]))

  const stats = {
    date: dateStr,
    source: "KRX" as string,
    dailyPrice: 0,
    stockQuote: 0,
    marketIndex: 0,
    errors: [] as string[],
  }

  if (useNaverFallback) {
    // ── Naver fallback (기존 로직) ──
    stats.source = "Naver(fallback)"
    const [naverKospi, naverKosdaq, naverIndex] = await Promise.allSettled([
      fetchKospi ? fetchNaverMarketData("KOSPI") : Promise.resolve([]),
      fetchKosdaq ? fetchNaverMarketData("KOSDAQ") : Promise.resolve([]),
      fetchNaverIndices(),
    ])

    const allNaver = [
      ...(naverKospi.status === "fulfilled" ? naverKospi.value : []),
      ...(naverKosdaq.status === "fulfilled" ? naverKosdaq.value : []),
    ].filter((s) => tickerToId.has(s.ticker))

    if (naverKospi.status === "rejected") stats.errors.push(`Naver KOSPI: ${String(naverKospi.reason)}`)
    if (naverKosdaq.status === "rejected") stats.errors.push(`Naver KOSDAQ: ${String(naverKosdaq.reason)}`)

    // DailyPrice (Naver는 OHLCV 없으므로 종가 대체)
    try {
      const result = await prisma.dailyPrice.createMany({
        data: allNaver.map((s) => ({
          stockId: tickerToId.get(s.ticker)!,
          date: dateObj,
          open: s.price, high: s.price, low: s.price, close: s.price,
          volume: s.volume,
        })),
        skipDuplicates: true,
      })
      stats.dailyPrice = result.count
    } catch (e) {
      stats.errors.push(`DailyPrice(Naver): ${String(e)}`)
    }

    // StockQuote
    const batches = chunk(allNaver, BATCH_SIZE)
    for (const batch of batches) {
      const settled = await Promise.allSettled(
        batch.map(async (s) => {
          const stockId = tickerToId.get(s.ticker)!
          return prisma.stockQuote.upsert({
            where: { stockId },
            update: {
              price: s.price, previousClose: s.previousClose,
              change: s.change, changePercent: s.changePercent,
              open: s.price, high: s.price, low: s.price,
              volume: s.volume, marketCap: s.marketCap, per: s.per,
            },
            create: {
              stockId,
              price: s.price, previousClose: s.previousClose,
              change: s.change, changePercent: s.changePercent,
              open: s.price, high: s.price, low: s.price,
              volume: s.volume, marketCap: s.marketCap, per: s.per, pbr: null,
            },
          })
        })
      )
      for (const r of settled) {
        if (r.status === "fulfilled") stats.stockQuote++
        else stats.errors.push(`StockQuote(Naver): ${String(r.reason).slice(0, 100)}`)
      }
    }

    // MarketIndex (Naver)
    if (naverIndex.status === "fulfilled") {
      for (const idx of naverIndex.value) {
        try {
          await prisma.marketIndex.upsert({
            where: { symbol: idx.symbol },
            update: { value: idx.value, change: idx.change, changePercent: idx.changePercent },
            create: { symbol: idx.symbol, name: idx.name, value: idx.value, change: idx.change, changePercent: idx.changePercent },
          })
          await prisma.marketIndexHistory.upsert({
            where: { symbol_date: { symbol: idx.symbol, date: dateObj } },
            update: { close: idx.value, change: idx.change, changePercent: idx.changePercent },
            create: { symbol: idx.symbol, date: dateObj, close: idx.value, change: idx.change, changePercent: idx.changePercent },
          })
          stats.marketIndex++
        } catch (e) {
          stats.errors.push(`MarketIndex(Naver) ${idx.symbol}: ${String(e)}`)
        }
      }
    }
  } else {
    // ── KRX 기본 경로 (정규장 종가) ──
    const allOhlcv = [
      ...(kospiOhlcv.status === "fulfilled" ? kospiOhlcv.value : []),
      ...(kosdaqOhlcv.status === "fulfilled" ? kosdaqOhlcv.value : []),
    ].filter((s) => tickerToId.has(s.ticker))

    if (kospiOhlcv.status === "rejected") stats.errors.push(`KRX KOSPI OHLCV: ${String(kospiOhlcv.reason)}`)
    if (kosdaqOhlcv.status === "rejected") stats.errors.push(`KRX KOSDAQ OHLCV: ${String(kosdaqOhlcv.reason)}`)

    // 시가총액/PER/PBR 맵 구성
    const fundMap = new Map<string, { marketCap: bigint | null; per: number | null; pbr: number | null }>()
    for (const result of [kospiFund, kosdaqFund]) {
      if (result.status === "fulfilled") {
        for (const f of result.value) fundMap.set(f.ticker, f)
      }
    }

    // 3. DailyPrice upsert (정확한 OHLCV)
    for (const batch of chunk(allOhlcv, BATCH_SIZE)) {
      const settled = await Promise.allSettled(
        batch.map((s) =>
          prisma.dailyPrice.upsert({
            where: { stockId_date: { stockId: tickerToId.get(s.ticker)!, date: dateObj } },
            update: { open: s.open, high: s.high, low: s.low, close: s.close, volume: s.volume },
            create: {
              stockId: tickerToId.get(s.ticker)!,
              date: dateObj,
              open: s.open, high: s.high, low: s.low, close: s.close, volume: s.volume,
            },
          })
        )
      )
      for (const r of settled) {
        if (r.status === "fulfilled") stats.dailyPrice++
        else stats.errors.push(`DailyPrice: ${String(r.reason).slice(0, 100)}`)
      }
    }

    // 4. 52주 최고/최저 계산
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const stockIds = allOhlcv.map((s) => tickerToId.get(s.ticker)!).filter(Boolean)

    const fiftyTwoWeekData = await prisma.dailyPrice.groupBy({
      by: ["stockId"],
      where: { stockId: { in: stockIds }, date: { gte: oneYearAgo } },
      _max: { high: true },
      _min: { low: true },
    })
    const fiftyTwoWeekMap = new Map(
      fiftyTwoWeekData.map((d) => [d.stockId, { high52w: d._max.high, low52w: d._min.low }])
    )

    // 5. StockQuote upsert (KRX 종가 + 시가총액/PER/PBR)
    for (const batch of chunk(allOhlcv, BATCH_SIZE)) {
      const settled = await Promise.allSettled(
        batch.map(async (s) => {
          const stockId = tickerToId.get(s.ticker)!
          const w52 = fiftyTwoWeekMap.get(stockId)
          const fund = fundMap.get(s.ticker)
          const prevClose = s.close - s.change
          const baseData = {
            price: s.close,
            previousClose: prevClose > 0 ? prevClose : s.close,
            change: s.change,
            changePercent: s.changePercent,
            open: s.open,
            high: s.high,
            low: s.low,
            volume: s.volume,
            marketCap: fund?.marketCap ?? null,
            per: fund?.per ?? null,
            pbr: fund?.pbr ?? null,
            high52w: w52?.high52w ?? null,
            low52w: w52?.low52w ?? null,
          }
          return prisma.stockQuote.upsert({
            where: { stockId },
            update: baseData,
            create: { stockId, ...baseData },
          })
        })
      )
      for (const r of settled) {
        if (r.status === "fulfilled") stats.stockQuote++
        else stats.errors.push(`StockQuote: ${String(r.reason).slice(0, 100)}`)
      }
    }

    // 6. MarketIndex (KRX → Naver fallback)
    let indexData = krxIndex.status === "fulfilled" ? krxIndex.value : []
    let indexSource = "KRX"
    if (indexData.length === 0) {
      if (krxIndex.status === "rejected") {
        stats.errors.push(`KRX Index: ${String(krxIndex.reason)}`)
      }
      console.warn("[cron-kr] KRX Index empty, falling back to Naver")
      indexSource = "Naver(fallback)"
      try {
        indexData = await fetchNaverIndices()
      } catch (e) {
        stats.errors.push(`Naver Index fallback: ${String(e)}`)
      }
    }
    for (const idx of indexData) {
      try {
        await prisma.marketIndex.upsert({
          where: { symbol: idx.symbol },
          update: { value: idx.value, change: idx.change, changePercent: idx.changePercent },
          create: { symbol: idx.symbol, name: idx.name, value: idx.value, change: idx.change, changePercent: idx.changePercent },
        })
        await prisma.marketIndexHistory.upsert({
          where: { symbol_date: { symbol: idx.symbol, date: dateObj } },
          update: { close: idx.value, change: idx.change, changePercent: idx.changePercent },
          create: { symbol: idx.symbol, date: dateObj, close: idx.value, change: idx.change, changePercent: idx.changePercent },
        })
        stats.marketIndex++
      } catch (e) {
        stats.errors.push(`MarketIndex(${indexSource}) ${idx.symbol}: ${String(e)}`)
      }
    }
  }

  console.log(
    `[cron-kr] Done: source=${stats.source}, date=${stats.date}, dailyPrice=${stats.dailyPrice}, stockQuote=${stats.stockQuote}, marketIndex=${stats.marketIndex}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-kr] Errors (${stats.errors.length}):`, stats.errors)
    await sendTelegramAlert(
      `KR Quotes 크론 에러 (${exchangeParam ?? "ALL"})`,
      `source=${stats.source}, 에러 ${stats.errors.length}건:\n${stats.errors.slice(0, 5).join("\n")}`,
      "warning"
    ).catch(() => {})
  }

  if (stats.stockQuote === 0 && stats.errors.length === 0) {
    await sendTelegramAlert(
      `KR Quotes 0건 수집 (${exchangeParam ?? "ALL"})`,
      `source=${stats.source}, date=${stats.date}, dbStocks=${dbStocks.length}, stockQuote=0\nKRX/Naver 데이터 수집 실패 또는 DB 종목 매칭 실패`,
      "warning"
    ).catch(() => {})
  }

  if (stats.marketIndex === 0) {
    await sendTelegramAlert(
      `KR 지수 0건 수집 (${exchangeParam ?? "ALL"})`,
      `date=${stats.date}, KRX+Naver 지수 모두 실패\n메인페이지 '기준' 시각이 갱신되지 않음`,
      "warning"
    ).catch(() => {})
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-kr-quotes", cronStart, result)
  revalidateTag("quotes", { expire: 0 })
  return NextResponse.json(result)
}
