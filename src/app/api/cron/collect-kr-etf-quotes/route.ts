import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchNaverETFData } from "@/lib/data-sources/naver"
import { getLastTradingDate } from "@/lib/data-sources/krx"
import { logCronResult } from "@/lib/utils/cron-logger"
import { revalidatePath } from "next/cache"

export const maxDuration = 300

const BATCH_SIZE = 100

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dateStr = getLastTradingDate()
  const dateObj = new Date(
    `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00.000Z`
  )

  console.log(`[cron-kr-etf] Collecting KR ETF data for ${dateStr}`)
  const cronStart = Date.now()

  const stats = {
    date: dateStr,
    dailyPrice: 0,
    stockQuote: 0,
    errors: [] as string[],
  }

  const updatedTickers: string[] = []

  try {
    const etfData = await fetchNaverETFData()

    // DB에서 KR ETF 종목 조회
    const dbStocks = await prisma.stock.findMany({
      where: { market: "KR", stockType: "ETF", isActive: true },
      select: { id: true, ticker: true },
    })
    const tickerToId = new Map(dbStocks.map((s) => [s.ticker, s.id]))

    const matched = etfData.filter((e) => tickerToId.has(e.ticker))
    updatedTickers.push(...matched.map((e) => e.ticker))

    // DailyPrice
    try {
      const result = await prisma.dailyPrice.createMany({
        data: matched.map((e) => ({
          stockId: tickerToId.get(e.ticker)!,
          date: dateObj,
          open: e.price,
          high: e.price,
          low: e.price,
          close: e.price,
          volume: e.volume,
        })),
        skipDuplicates: true,
      })
      stats.dailyPrice = result.count
    } catch (e) {
      stats.errors.push(`DailyPrice: ${String(e)}`)
    }

    // StockQuote upsert
    const batches = chunk(matched, BATCH_SIZE)
    for (const batch of batches) {
      const settled = await Promise.allSettled(
        batch.map(async (e) => {
          const stockId = tickerToId.get(e.ticker)!
          const quoteData = {
            price: e.price,
            previousClose: e.previousClose,
            change: e.change,
            changePercent: e.changePercent,
            open: e.price,
            high: e.price,
            low: e.price,
            volume: e.volume,
            marketCap: null,
            per: null,
            pbr: null,
          }
          return prisma.stockQuote.upsert({
            where: { stockId },
            update: quoteData,
            create: { stockId, ...quoteData },
          })
        })
      )
      for (const r of settled) {
        if (r.status === "fulfilled") stats.stockQuote++
        else stats.errors.push(`StockQuote: ${String(r.reason).slice(0, 100)}`)
      }
    }
  } catch (e) {
    stats.errors.push(`ETF fetch: ${String(e)}`)
  }

  console.log(
    `[cron-kr-etf] Done: date=${stats.date}, dailyPrice=${stats.dailyPrice}, stockQuote=${stats.stockQuote}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-kr-etf] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-kr-etf-quotes", cronStart, result)
  for (const ticker of updatedTickers) {
    revalidatePath(`/stock/${ticker}`)
  }
  return NextResponse.json(result)
}
