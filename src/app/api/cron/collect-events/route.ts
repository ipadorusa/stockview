import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchYfDividends, fetchYfKrEtfDividends } from "@/lib/data-sources/yahoo-events"
import { fetchYfEarnings } from "@/lib/data-sources/yahoo-events"
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

  // KR ETF 분배금 — Yahoo Finance (.KS suffix)
  const krEtfStats = { dividends: 0, errors: [] as string[] }
  try {
    const krEtfStocks = await prisma.stock.findMany({
      where: { market: "KR", stockType: "ETF", isActive: true },
      select: { id: true, ticker: true },
      orderBy: { updatedAt: "asc" },
      take: BATCH,
    })

    for (const stock of krEtfStocks) {
      try {
        const divs = await fetchYfKrEtfDividends(stock.ticker)
        for (const d of divs) {
          try {
            await prisma.dividend.upsert({
              where: { stockId_exDate: { stockId: stock.id, exDate: new Date(d.exDate) } },
              update: { amount: d.amount, currency: d.currency, source: "yahoo" },
              create: {
                stockId: stock.id,
                exDate: new Date(d.exDate),
                payDate: null,
                amount: d.amount,
                currency: d.currency,
                source: "yahoo",
              },
            })
            krEtfStats.dividends++
          } catch {
            // skip duplicates
          }
        }
      } catch (e) {
        krEtfStats.errors.push(`KR ETF ${stock.ticker}: ${String(e)}`)
      }

      await new Promise((r) => setTimeout(r, 500))
    }
  } catch (e) {
    krEtfStats.errors.push(`KR ETF batch: ${String(e)}`)
  }

  stats.dividends += krEtfStats.dividends
  stats.errors.push(...krEtfStats.errors)

  console.log(`[cron-events] Done: dividends=${stats.dividends}, earnings=${stats.earnings}`)
  if (stats.errors.length > 0) {
    console.error(`[cron-events] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-events", cronStart, result)
  return NextResponse.json(result)
}
