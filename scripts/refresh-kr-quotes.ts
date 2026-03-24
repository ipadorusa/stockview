/**
 * 일회성 스크립트: Naver에서 KR 시세를 fetch하여 StockQuote를 업데이트합니다.
 * Usage: npx tsx scripts/refresh-kr-quotes.ts
 */
import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import { fetchNaverMarketData, fetchNaverETFData } from "../src/lib/data-sources/naver"

const BATCH_SIZE = 100

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

async function main() {
  console.log("[refresh] Fetching KR stock data from Naver...")

  // 1. Fetch KOSPI + KOSDAQ + ETF
  const [kospiResult, kosdaqResult, etfResult] = await Promise.allSettled([
    fetchNaverMarketData("KOSPI"),
    fetchNaverMarketData("KOSDAQ"),
    fetchNaverETFData(),
  ])

  const allStocks = [
    ...(kospiResult.status === "fulfilled" ? kospiResult.value : []),
    ...(kosdaqResult.status === "fulfilled" ? kosdaqResult.value : []),
  ]
  const allETFs = etfResult.status === "fulfilled" ? etfResult.value : []

  console.log(`[refresh] Fetched: ${allStocks.length} stocks, ${allETFs.length} ETFs`)
  if (kospiResult.status === "rejected") console.error("[refresh] KOSPI failed:", kospiResult.reason)
  if (kosdaqResult.status === "rejected") console.error("[refresh] KOSDAQ failed:", kosdaqResult.reason)
  if (etfResult.status === "rejected") console.error("[refresh] ETF failed:", etfResult.reason)

  // 2. DB에서 KR 종목 조회
  const dbStocks = await prisma.stock.findMany({
    where: { market: "KR", isActive: true },
    select: { id: true, ticker: true },
  })
  const tickerToId = new Map(dbStocks.map((s) => [s.ticker, s.id]))

  // 3. Stock quotes 업데이트
  const matchedStocks = allStocks.filter((s) => tickerToId.has(s.ticker))
  let updated = 0
  let errors = 0

  const batches = chunk(matchedStocks, BATCH_SIZE)
  for (const batch of batches) {
    const settled = await Promise.allSettled(
      batch.map(async (s) => {
        const stockId = tickerToId.get(s.ticker)!
        return prisma.stockQuote.upsert({
          where: { stockId },
          update: {
            price: s.price,
            previousClose: s.previousClose,
            change: s.change,
            changePercent: s.changePercent,
            open: s.price,
            high: s.price,
            low: s.price,
            volume: s.volume,
            marketCap: s.marketCap,
            per: s.per,
          },
          create: {
            stockId,
            price: s.price,
            previousClose: s.previousClose,
            change: s.change,
            changePercent: s.changePercent,
            open: s.price,
            high: s.price,
            low: s.price,
            volume: s.volume,
            marketCap: s.marketCap,
            per: s.per,
            pbr: null,
          },
        })
      })
    )
    for (const r of settled) {
      if (r.status === "fulfilled") updated++
      else { errors++; console.error(String(r.reason).slice(0, 100)) }
    }
  }

  console.log(`[refresh] Stocks updated: ${updated}, errors: ${errors}`)

  // 4. ETF quotes 업데이트
  const matchedETFs = allETFs.filter((e) => tickerToId.has(e.ticker))
  let etfUpdated = 0
  let etfErrors = 0

  const etfBatches = chunk(matchedETFs, BATCH_SIZE)
  for (const batch of etfBatches) {
    const settled = await Promise.allSettled(
      batch.map(async (e) => {
        const stockId = tickerToId.get(e.ticker)!
        return prisma.stockQuote.upsert({
          where: { stockId },
          update: {
            price: e.price,
            previousClose: e.previousClose,
            change: e.change,
            changePercent: e.changePercent,
            open: e.price,
            high: e.price,
            low: e.price,
            volume: e.volume,
          },
          create: {
            stockId,
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
          },
        })
      })
    )
    for (const r of settled) {
      if (r.status === "fulfilled") etfUpdated++
      else { etfErrors++; console.error(String(r.reason).slice(0, 100)) }
    }
  }

  console.log(`[refresh] ETFs updated: ${etfUpdated}, errors: ${etfErrors}`)
  console.log(`[refresh] Total: ${updated + etfUpdated} updated, ${errors + etfErrors} errors`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
