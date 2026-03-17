import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchYfDividends } from "@/lib/data-sources/yahoo-events"
import { fetchYfEarnings } from "@/lib/data-sources/yahoo-events"
import { fetchNaverDividends } from "@/lib/data-sources/naver-dividends"
import { logCronResult } from "@/lib/utils/cron-logger"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-events] Starting dividend/earnings collection")
  const cronStart = Date.now()

  const stats = { dividends: 0, earnings: 0, errors: [] as string[] }
  const BATCH = 50

  // US stocks — dividends + earnings
  try {
    const usStocks = await prisma.stock.findMany({
      where: { market: "US", isActive: true },
      select: { id: true, ticker: true },
      orderBy: { updatedAt: "asc" },
      take: BATCH,
    })

    for (const stock of usStocks) {
      try {
        const [divs, earns] = await Promise.allSettled([
          fetchYfDividends(stock.ticker),
          fetchYfEarnings(stock.ticker),
        ])

        if (divs.status === "fulfilled") {
          for (const d of divs.value) {
            try {
              await prisma.dividend.upsert({
                where: { stockId_exDate: { stockId: stock.id, exDate: new Date(d.exDate) } },
                update: { amount: d.amount, currency: d.currency },
                create: {
                  stockId: stock.id,
                  exDate: new Date(d.exDate),
                  payDate: d.payDate ? new Date(d.payDate) : null,
                  amount: d.amount,
                  currency: d.currency,
                },
              })
              stats.dividends++
            } catch {
              // skip duplicates
            }
          }
        }

        if (earns.status === "fulfilled") {
          for (const e of earns.value) {
            try {
              await prisma.earningsEvent.upsert({
                where: { stockId_quarter: { stockId: stock.id, quarter: e.quarter } },
                update: {
                  reportDate: new Date(e.reportDate),
                  epsEstimate: e.epsEstimate,
                  epsActual: e.epsActual,
                  revenueEstimate: e.revenueEstimate,
                  revenueActual: e.revenueActual,
                },
                create: {
                  stockId: stock.id,
                  reportDate: new Date(e.reportDate),
                  quarter: e.quarter,
                  epsEstimate: e.epsEstimate,
                  epsActual: e.epsActual,
                  revenueEstimate: e.revenueEstimate,
                  revenueActual: e.revenueActual,
                },
              })
              stats.earnings++
            } catch {
              // skip duplicates
            }
          }
        }
      } catch (e) {
        stats.errors.push(`US ${stock.ticker}: ${String(e)}`)
      }

      await new Promise((r) => setTimeout(r, 500))
    }
  } catch (e) {
    stats.errors.push(`US batch: ${String(e)}`)
  }

  // KR stocks — dividends only (from Naver)
  try {
    const krStocks = await prisma.stock.findMany({
      where: { market: "KR", isActive: true },
      select: { id: true, ticker: true },
      orderBy: { updatedAt: "asc" },
      take: BATCH,
    })

    for (const stock of krStocks) {
      try {
        const divs = await fetchNaverDividends(stock.ticker)
        for (const d of divs) {
          try {
            await prisma.dividend.upsert({
              where: { stockId_exDate: { stockId: stock.id, exDate: new Date(d.exDate) } },
              update: { amount: d.amount, currency: d.currency },
              create: {
                stockId: stock.id,
                exDate: new Date(d.exDate),
                amount: d.amount,
                currency: d.currency,
              },
            })
            stats.dividends++
          } catch {
            // skip
          }
        }
      } catch (e) {
        stats.errors.push(`KR ${stock.ticker}: ${String(e)}`)
      }

      await new Promise((r) => setTimeout(r, 200))
    }
  } catch (e) {
    stats.errors.push(`KR batch: ${String(e)}`)
  }

  console.log(`[cron-events] Done: dividends=${stats.dividends}, earnings=${stats.earnings}`)
  if (stats.errors.length > 0) {
    console.error(`[cron-events] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-events", cronStart, result)
  return NextResponse.json(result)
}
