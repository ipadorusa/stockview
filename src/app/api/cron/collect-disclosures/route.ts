import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchDisclosures } from "@/lib/data-sources/opendart"
import { logCronResult } from "@/lib/utils/cron-logger"

export const maxDuration = 120

const BATCH_SIZE = 50

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "")
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-disclosures] Starting disclosure collection")
  const cronStart = Date.now()

  const stats = {
    stocksProcessed: 0,
    disclosuresUpserted: 0,
    errors: [] as string[],
  }

  // corpCode가 있는 KR STOCK만 대상
  const stocks = await prisma.stock.findMany({
    where: { market: "KR", stockType: "STOCK", isActive: true, corpCode: { not: null } },
    select: { id: true, ticker: true, corpCode: true },
  })

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const beginDate = formatDate(sevenDaysAgo)
  const endDate = formatDate(now)

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE)

    for (const stock of batch) {
      try {
        const items = await fetchDisclosures(stock.corpCode!, {
          beginDate,
          endDate,
          pageCount: 50,
        })

        for (const item of items) {
          try {
            await prisma.disclosure.upsert({
              where: { rceptNo: item.rceptNo },
              update: {
                reportName: item.reportName,
                filerName: item.filerName || null,
                remark: item.remark || null,
              },
              create: {
                stockId: stock.id,
                rceptNo: item.rceptNo,
                reportName: item.reportName,
                filerName: item.filerName || null,
                rceptDate: new Date(
                  `${item.rceptDate.slice(0, 4)}-${item.rceptDate.slice(4, 6)}-${item.rceptDate.slice(6, 8)}`
                ),
                remark: item.remark || null,
              },
            })
            stats.disclosuresUpserted++
          } catch (e) {
            stats.errors.push(`Upsert ${item.rceptNo}: ${String(e).slice(0, 80)}`)
          }
        }

        stats.stocksProcessed++
      } catch (e) {
        stats.errors.push(`${stock.ticker}: ${String(e).slice(0, 100)}`)
      }
    }
  }

  console.log(
    `[cron-disclosures] Done: stocksProcessed=${stats.stocksProcessed}, disclosuresUpserted=${stats.disclosuresUpserted}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-disclosures] Errors (${stats.errors.length}):`, stats.errors.slice(0, 5))
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-disclosures", cronStart, result)
  return NextResponse.json(result)
}
