import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchNaverInstitutional } from "@/lib/data-sources/naver"
import { logCronResult } from "@/lib/utils/cron-logger"
import { sendTelegramAlert } from "@/lib/utils/telegram"
import { isKrHoliday } from "@/lib/utils/trading-calendar"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (isKrHoliday()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "KR holiday" })
  }

  const cronStart = Date.now()
  const stats = { processed: 0, saved: 0, errors: [] as string[] }

  try {
    // 시총 상위 200 KR 종목 (StockQuote JOIN으로 marketCap DESC 정렬)
    const topStocks = await prisma.$queryRaw<{ id: string; ticker: string }[]>`
      SELECT s.id, s.ticker
      FROM "Stock" s
      JOIN "StockQuote" q ON q."stockId" = s.id
      WHERE s.market = 'KR' AND s."isActive" = true AND q."marketCap" IS NOT NULL
      ORDER BY q."marketCap" DESC
      LIMIT 200
    `

    console.log(`[cron-institutional] Processing ${topStocks.length} stocks`)

    for (const stock of topStocks) {
      try {
        const data = await fetchNaverInstitutional(stock.ticker)
        stats.processed++

        if (data) {
          const dateObj = new Date(
            `${data.date.slice(0, 4)}-${data.date.slice(4, 6)}-${data.date.slice(6, 8)}T00:00:00.000Z`
          )

          await prisma.institutionalFlow.upsert({
            where: {
              stockId_date: { stockId: stock.id, date: dateObj },
            },
            update: {
              foreignBuy: data.foreignBuy,
              foreignSell: data.foreignSell,
              foreignNet: data.foreignNet,
              institutionBuy: data.institutionBuy,
              institutionSell: data.institutionSell,
              institutionNet: data.institutionNet,
            },
            create: {
              stockId: stock.id,
              date: dateObj,
              foreignBuy: data.foreignBuy,
              foreignSell: data.foreignSell,
              foreignNet: data.foreignNet,
              institutionBuy: data.institutionBuy,
              institutionSell: data.institutionSell,
              institutionNet: data.institutionNet,
            },
          })
          stats.saved++
        }
      } catch (e) {
        stats.errors.push(`${stock.ticker}: ${String(e).slice(0, 100)}`)
      }

      // 200ms 딜레이 (200 × 200ms = 40초)
      await new Promise((r) => setTimeout(r, 200))
    }
  } catch (e) {
    stats.errors.push(`Fatal: ${String(e).slice(0, 200)}`)
  }

  console.log(
    `[cron-institutional] Done: processed=${stats.processed}, saved=${stats.saved}, errors=${stats.errors.length}`
  )

  if (stats.errors.length > 0) {
    console.error(`[cron-institutional] Errors:`, stats.errors.slice(0, 5))
    await sendTelegramAlert(
      "수급 크론 에러",
      `에러 ${stats.errors.length}건:\n${stats.errors.slice(0, 5).join("\n")}`,
      "warning"
    ).catch(() => {})
  }

  const result = {
    ok: stats.errors.length === 0,
    itemsProcessed: stats.processed,
    itemsFailed: stats.errors.length,
    errors: stats.errors,
  }
  await logCronResult("collect-institutional", cronStart, result)
  return NextResponse.json({ ok: true, ...stats })
}
