import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchDividendDetail } from "@/lib/data-sources/opendart"
import { logCronResult } from "@/lib/utils/cron-logger"

export const maxDuration = 300

const BATCH_SIZE = 100

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-dart-dividends] Starting DART dividend collection")
  const cronStart = Date.now()

  const stats = {
    stocksProcessed: 0,
    dividendsUpdated: 0,
    dividendsCreated: 0,
    errors: [] as string[],
  }

  const stocks = await prisma.stock.findMany({
    where: { market: "KR", stockType: "STOCK", isActive: true, corpCode: { not: null } },
    select: { id: true, ticker: true, corpCode: true },
  })

  // 최근 사업연도 (사업보고서는 보통 3월에 나옴)
  const now = new Date()
  const bsnsYear = String(now.getMonth() >= 3 ? now.getFullYear() - 1 : now.getFullYear() - 2)

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE)

    for (const stock of batch) {
      try {
        const details = await fetchDividendDetail(stock.corpCode!, bsnsYear)

        // 보통주만
        const common = details.find((d) => d.stockKind === "보통주")
        if (!common || common.dividendAmount <= 0) {
          stats.stocksProcessed++
          continue
        }

        // 해당 연도 12월 31일을 exDate로 사용 (배당락일 미제공 시)
        const exDate = new Date(`${bsnsYear}-12-31`)

        const existing = await prisma.dividend.findUnique({
          where: { stockId_exDate: { stockId: stock.id, exDate } },
        })

        if (existing) {
          await prisma.dividend.update({
            where: { id: existing.id },
            data: {
              amount: common.dividendAmount,
              dividendYield: common.dividendYield,
              payoutRatio: common.payoutRatio,
              faceValue: common.faceValue,
              source: "opendart",
            },
          })
          stats.dividendsUpdated++
        } else {
          await prisma.dividend.create({
            data: {
              stockId: stock.id,
              exDate,
              amount: common.dividendAmount,
              currency: "KRW",
              dividendYield: common.dividendYield,
              payoutRatio: common.payoutRatio,
              faceValue: common.faceValue,
              source: "opendart",
            },
          })
          stats.dividendsCreated++
        }

        stats.stocksProcessed++
      } catch (e) {
        stats.errors.push(`${stock.ticker}: ${String(e).slice(0, 100)}`)
      }
    }
  }

  console.log(
    `[cron-dart-dividends] Done: stocksProcessed=${stats.stocksProcessed}, updated=${stats.dividendsUpdated}, created=${stats.dividendsCreated}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-dart-dividends] Errors (${stats.errors.length}):`, stats.errors.slice(0, 5))
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-dart-dividends", cronStart, result)
  return NextResponse.json(result)
}
