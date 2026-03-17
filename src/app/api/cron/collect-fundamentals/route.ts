import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchYfFundamentals } from "@/lib/data-sources/yahoo-fundamentals"
import { fetchNaverFundamentals } from "@/lib/data-sources/naver-fundamentals"
import { logCronResult } from "@/lib/utils/cron-logger"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-fundamentals] Starting fundamentals collection")
  const cronStart = Date.now()

  const stats = { updated: 0, errors: [] as string[] }
  const BATCH = 100

  // US stocks
  try {
    const usStocks = await prisma.stock.findMany({
      where: { market: "US", isActive: true },
      select: { id: true, ticker: true },
      orderBy: [{ fundamental: { updatedAt: "asc" } }, { id: "asc" }],
      take: BATCH,
    })

    const usFundamentals = await fetchYfFundamentals(usStocks.map((s) => s.ticker))
    const tickerToId = new Map(usStocks.map((s) => [s.ticker, s.id]))

    for (const f of usFundamentals) {
      const stockId = tickerToId.get(f.ticker)
      if (!stockId) continue

      try {
        await prisma.stockFundamental.upsert({
          where: { stockId },
          update: {
            eps: f.eps,
            forwardEps: f.forwardEps,
            dividendYield: f.dividendYield,
            roe: f.roe,
            debtToEquity: f.debtToEquity,
            beta: f.beta,
            revenue: f.revenue,
            netIncome: f.netIncome,
            description: f.description,
            employeeCount: f.employeeCount,
          },
          create: {
            stockId,
            eps: f.eps,
            forwardEps: f.forwardEps,
            dividendYield: f.dividendYield,
            roe: f.roe,
            debtToEquity: f.debtToEquity,
            beta: f.beta,
            revenue: f.revenue,
            netIncome: f.netIncome,
            description: f.description,
            employeeCount: f.employeeCount,
          },
        })
        stats.updated++
      } catch (e) {
        stats.errors.push(`US ${f.ticker}: ${String(e)}`)
      }
    }
  } catch (e) {
    stats.errors.push(`US batch: ${String(e)}`)
  }

  // KR stocks
  try {
    const krStocks = await prisma.stock.findMany({
      where: { market: "KR", isActive: true },
      select: { id: true, ticker: true },
      orderBy: [{ fundamental: { updatedAt: "asc" } }, { id: "asc" }],
      take: BATCH,
    })

    const krFundamentals = await fetchNaverFundamentals(krStocks.map((s) => s.ticker))
    const tickerToId = new Map(krStocks.map((s) => [s.ticker, s.id]))

    for (const f of krFundamentals) {
      const stockId = tickerToId.get(f.ticker)
      if (!stockId) continue

      try {
        await prisma.stockFundamental.upsert({
          where: { stockId },
          update: {
            eps: f.eps,
            dividendYield: f.dividendYield,
            roe: f.roe,
            debtToEquity: f.debtToEquity,
            revenue: f.revenue,
            netIncome: f.netIncome,
            description: f.description,
          },
          create: {
            stockId,
            eps: f.eps,
            dividendYield: f.dividendYield,
            roe: f.roe,
            debtToEquity: f.debtToEquity,
            revenue: f.revenue,
            netIncome: f.netIncome,
            description: f.description,
          },
        })
        stats.updated++
      } catch (e) {
        stats.errors.push(`KR ${f.ticker}: ${String(e)}`)
      }
    }
  } catch (e) {
    stats.errors.push(`KR batch: ${String(e)}`)
  }

  console.log(`[cron-fundamentals] Done: updated=${stats.updated}`)
  if (stats.errors.length > 0) {
    console.error(`[cron-fundamentals] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-fundamentals", cronStart, result)
  return NextResponse.json(result)
}
