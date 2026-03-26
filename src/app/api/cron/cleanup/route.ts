import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logCronResult } from "@/lib/utils/cron-logger"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-cleanup] Starting data cleanup")
  const cronStart = Date.now()

  const stats = {
    newsDeleted: 0,
    dailyPriceDeleted: 0,
    stocksDeactivated: 0,
    disclosuresDeleted: 0,
    aiReportsDeleted: 0,
    errors: [] as string[],
  }

  const now = new Date()
  const days60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // 1. 60일 이전 뉴스 삭제 (StockNews는 CASCADE)
  try {
    const result = await prisma.news.deleteMany({
      where: { publishedAt: { lt: days60Ago } },
    })
    stats.newsDeleted = result.count
  } catch (e) {
    stats.errors.push(`News cleanup: ${String(e)}`)
  }

  // 2. 365일 이전 일봉 삭제
  const days365Ago = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  try {
    const result = await prisma.dailyPrice.deleteMany({
      where: { date: { lt: days365Ago } },
    })
    stats.dailyPriceDeleted = result.count
  } catch (e) {
    stats.errors.push(`DailyPrice cleanup: ${String(e)}`)
  }

  // 3. 90일 이상 시세 미갱신 종목 비활성화
  try {
    const staleQuotes = await prisma.stockQuote.findMany({
      where: { updatedAt: { lt: days90Ago } },
      select: { stockId: true },
    })
    if (staleQuotes.length > 0) {
      const result = await prisma.stock.updateMany({
        where: { id: { in: staleQuotes.map((q) => q.stockId) }, isActive: true },
        data: { isActive: false },
      })
      stats.stocksDeactivated = result.count
    }
  } catch (e) {
    stats.errors.push(`Stale stock cleanup: ${String(e)}`)
  }

  // 4. 1년 이전 공시 삭제
  try {
    const result = await prisma.disclosure.deleteMany({
      where: { rceptDate: { lt: days365Ago } },
    })
    stats.disclosuresDeleted = result.count
  } catch (e) {
    stats.errors.push(`Disclosure cleanup: ${String(e)}`)
  }

  // 5. 180일 이전 AI 리포트 삭제
  const days180Ago = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
  try {
    const result = await prisma.aiReport.deleteMany({
      where: { createdAt: { lt: days180Ago } },
    })
    stats.aiReportsDeleted = result.count
  } catch (e) {
    stats.errors.push(`AiReport cleanup: ${String(e)}`)
  }

  console.log(
    `[cron-cleanup] Done: newsDeleted=${stats.newsDeleted}, dailyPriceDeleted=${stats.dailyPriceDeleted}, stocksDeactivated=${stats.stocksDeactivated}, disclosuresDeleted=${stats.disclosuresDeleted}, aiReportsDeleted=${stats.aiReportsDeleted}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-cleanup] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("cleanup", cronStart, result)
  return NextResponse.json(result)
}
