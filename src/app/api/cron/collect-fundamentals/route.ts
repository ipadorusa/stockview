import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchYfFundamentals } from "@/lib/data-sources/yahoo-fundamentals"
import { fetchNaverFundamentals } from "@/lib/data-sources/naver-fundamentals"
import { logCronResult } from "@/lib/utils/cron-logger"
import { revalidatePath } from "next/cache"
import { sendTelegramAlert } from "@/lib/utils/telegram"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-fundamentals] Starting fundamentals collection")
  const cronStart = Date.now()

  const stats = { updated: 0, errors: [] as string[] }
  const updatedTickers: string[] = []
  const BATCH = 100

  // 우선순위 큐: 관심종목 우선 → 나머지 updatedAt ASC
  async function getStocksWithPriority(market: "US" | "KR") {
    const PRIORITY_TAKE = 30
    const watched = await prisma.stock.findMany({
      where: { market, isActive: true, watchlist: { some: {} } },
      select: { id: true, ticker: true },
      take: PRIORITY_TAKE,
    })
    const watchedIds = watched.map((s) => s.id)
    const remaining = await prisma.stock.findMany({
      where: { market, isActive: true, ...(watchedIds.length > 0 ? { id: { notIn: watchedIds } } : {}) },
      select: { id: true, ticker: true },
      orderBy: [{ fundamental: { updatedAt: "asc" } }, { id: "asc" }],
      take: BATCH - watched.length,
    })
    return [...watched, ...remaining]
  }

  // US stocks
  try {
    const usStocks = await getStocksWithPriority("US")

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
        // PBR → StockQuote에도 저장
        if (f.pbr != null) {
          await prisma.stockQuote.updateMany({
            where: { stockId },
            data: { pbr: f.pbr },
          })
        }
        stats.updated++
        updatedTickers.push(f.ticker)
      } catch (e) {
        stats.errors.push(`US ${f.ticker}: ${String(e)}`)
      }
    }
  } catch (e) {
    stats.errors.push(`US batch: ${String(e)}`)
  }

  // KR stocks
  try {
    const krStocks = await getStocksWithPriority("KR")

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
        // PBR → StockQuote에도 저장
        if (f.pbr != null) {
          await prisma.stockQuote.updateMany({
            where: { stockId },
            data: { pbr: f.pbr },
          })
        }
        stats.updated++
        updatedTickers.push(f.ticker)
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
    await sendTelegramAlert(
      "Fundamentals 크론 에러",
      `에러 ${stats.errors.length}건:\n${stats.errors.slice(0, 5).join("\n")}`,
      "warning"
    ).catch(() => {})
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-fundamentals", cronStart, result)
  for (const ticker of updatedTickers) {
    revalidatePath(`/stock/${ticker}`)
  }
  return NextResponse.json(result)
}
