import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logCronResult } from "@/lib/utils/cron-logger"
import { sendDiscordAlert } from "@/lib/utils/discord"
import {
  calculateMA,
  calculateRSI,
  calculateAvgVolume,
  calculateEMA,
  calculateMACD,
  calculateBollingerBands,
  calculateROC,
  calculateMFI,
  calculateADLine,
  calculateADX,
} from "@/lib/utils/technical-indicators"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const marketParam = req.nextUrl.searchParams.get("market")
  const marketFilter = marketParam === "KR" || marketParam === "US" ? marketParam : undefined

  console.log(`[cron-indicators] Starting technical indicator computation${marketFilter ? ` (market=${marketFilter})` : ""}`)

  const stats = { computed: 0, batches: 0, errors: [] as string[] }
  const BATCH = 100
  const TIME_LIMIT = 50_000 // 50초
  const start = Date.now()
  let cursor: string | undefined

  while (Date.now() - start < TIME_LIMIT) {
    const stocks = await prisma.stock.findMany({
      where: { isActive: true, ...(marketFilter ? { market: marketFilter } : {}) },
      select: { id: true, ticker: true },
      orderBy: { updatedAt: "asc" },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })

    if (stocks.length === 0) break
    stats.batches++
    cursor = stocks[stocks.length - 1].id

    for (const stock of stocks) {
      if (Date.now() - start >= TIME_LIMIT) break

      try {
        // 최근 100일 데이터 (BB20, MA60, ADX28 + 여유)
        const prices = await prisma.dailyPrice.findMany({
          where: { stockId: stock.id },
          orderBy: { date: "asc" },
          take: 100,
          select: { date: true, close: true, high: true, low: true, volume: true },
        })

        if (prices.length < 5) continue

        // 마지막 저장된 지표 날짜 확인
        const lastIndicator = await prisma.technicalIndicator.findFirst({
          where: { stockId: stock.id },
          orderBy: { date: "desc" },
          select: { date: true },
        })

        const closes = prices.map((p) => Number(p.close))
        const highs = prices.map((p) => Number(p.high))
        const lows = prices.map((p) => Number(p.low))
        const volumes = prices.map((p) => p.volume)
        const volumeNums = prices.map((p) => Number(p.volume))

        const ma5 = calculateMA(closes, 5)
        const ma20 = calculateMA(closes, 20)
        const ma60 = calculateMA(closes, 60)
        const ema12 = calculateEMA(closes, 12)
        const ema26 = calculateEMA(closes, 26)
        const rsi14 = calculateRSI(closes)
        const avgVol20 = calculateAvgVolume(volumes)
        const macd = calculateMACD(closes)
        const bb = calculateBollingerBands(closes)
        // 추가 지표
        const roc12 = calculateROC(closes)
        const mfi14 = calculateMFI(highs, lows, closes, volumeNums)
        const adLine = calculateADLine(highs, lows, closes, volumeNums)
        const adxArr = calculateADX(highs, lows, closes)

        // 미계산 날짜들 bulk insert
        const newRecords: Array<{
          stockId: string
          date: Date
          ma5: number | null
          ma20: number | null
          ma60: number | null
          ema12: number | null
          ema26: number | null
          rsi14: number | null
          avgVolume20: bigint | null
          macdLine: number | null
          macdSignal: number | null
          macdHistogram: number | null
          bbUpper: number | null
          bbMiddle: number | null
          bbLower: number | null
        }> = []

        for (let i = 0; i < prices.length; i++) {
          const date = prices[i].date
          // 이미 저장된 날짜 이전은 스킵
          if (lastIndicator && date <= lastIndicator.date) continue

          newRecords.push({
            stockId: stock.id,
            date,
            ma5: ma5[i] ?? null,
            ma20: ma20[i] ?? null,
            ma60: ma60[i] ?? null,
            ema12: ema12[i] != null ? (ema12[i] as number) : null,
            ema26: ema26[i] != null ? (ema26[i] as number) : null,
            rsi14: rsi14[i] ?? null,
            avgVolume20: avgVol20[i] ?? null,
            macdLine: macd.macdLine[i] ?? null,
            macdSignal: macd.signal[i] ?? null,
            macdHistogram: macd.histogram[i] ?? null,
            bbUpper: bb.upper[i] ?? null,
            bbMiddle: bb.middle[i] != null ? (bb.middle[i] as number) : null,
            bbLower: bb.lower[i] ?? null,
          })
        }

        if (newRecords.length > 0) {
          await prisma.technicalIndicator.createMany({
            data: newRecords,
            skipDuplicates: true,
          })
        }

        stats.computed++
      } catch (e) {
        stats.errors.push(`${stock.ticker}: ${String(e)}`)
      }
    }
  }

  console.log(
    `[cron-indicators] Done: computed=${stats.computed}, batches=${stats.batches}, elapsed=${Date.now() - start}ms`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-indicators] Errors (${stats.errors.length}):`, stats.errors.slice(0, 10))
    await sendDiscordAlert(
      `Indicators 크론 에러${marketFilter ? ` (${marketFilter})` : ""}`,
      `에러 ${stats.errors.length}건:\n${stats.errors.slice(0, 5).join("\n")}`,
      "warning"
    ).catch(() => {})
  }

  const result = { ok: true, ...stats }
  await logCronResult("compute-indicators", start, result)
  return NextResponse.json(result)
}
