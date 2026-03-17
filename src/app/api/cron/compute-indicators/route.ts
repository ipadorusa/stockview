import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateMA, calculateRSI, calculateAvgVolume } from "@/lib/utils/technical-indicators"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-indicators] Starting technical indicator computation")

  const stats = { computed: 0, errors: [] as string[] }
  const BATCH = 100

  const stocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: { id: true, ticker: true },
    orderBy: { updatedAt: "asc" },
    take: BATCH,
  })

  for (const stock of stocks) {
    try {
      // 최근 70일 데이터 (MA60 + 10일 여유)
      const prices = await prisma.dailyPrice.findMany({
        where: { stockId: stock.id },
        orderBy: { date: "asc" },
        take: 70,
        select: { date: true, close: true, volume: true },
      })

      if (prices.length < 5) continue

      const closes = prices.map((p) => Number(p.close))
      const volumes = prices.map((p) => p.volume)

      const ma5 = calculateMA(closes, 5)
      const ma20 = calculateMA(closes, 20)
      const ma60 = calculateMA(closes, 60)
      const rsi14 = calculateRSI(closes)
      const avgVol20 = calculateAvgVolume(volumes)

      // 가장 최근 날짜의 지표만 저장
      const lastIdx = prices.length - 1
      const lastDate = prices[lastIdx].date

      await prisma.technicalIndicator.upsert({
        where: { stockId_date: { stockId: stock.id, date: lastDate } },
        update: {
          ma5: ma5[lastIdx],
          ma20: ma20[lastIdx],
          ma60: ma60[lastIdx],
          rsi14: rsi14[lastIdx],
          avgVolume20: avgVol20[lastIdx],
        },
        create: {
          stockId: stock.id,
          date: lastDate,
          ma5: ma5[lastIdx],
          ma20: ma20[lastIdx],
          ma60: ma60[lastIdx],
          rsi14: rsi14[lastIdx],
          avgVolume20: avgVol20[lastIdx],
        },
      })

      stats.computed++
    } catch (e) {
      stats.errors.push(`${stock.ticker}: ${String(e)}`)
    }
  }

  console.log(`[cron-indicators] Done: computed=${stats.computed}`)
  if (stats.errors.length > 0) {
    console.error(`[cron-indicators] Errors (${stats.errors.length}):`, stats.errors)
  }

  return NextResponse.json({ ok: true, ...stats })
}
