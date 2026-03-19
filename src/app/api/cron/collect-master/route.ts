import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchNaverMarketData } from "@/lib/data-sources/naver"
import { logCronResult } from "@/lib/utils/cron-logger"

export const maxDuration = 300

const BATCH_SIZE = 100

const NASDAQ_STOCKS = new Set([
  "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "GOOG", "TSLA", "AVGO", "COST",
  "NFLX", "AMD", "ADBE", "QCOM", "INTC", "CSCO", "PEP", "TXN", "INTU", "CMCSA",
  "HON", "AMGN", "AMAT", "BKNG", "ISRG", "ADP", "LRCX", "PANW", "MELI", "ADI",
  "REGN", "VRTX", "KLAC", "MU", "SNPS", "CDNS", "CRWD", "FTNT", "MRVL", "ABNB",
  "CTAS", "PAYX", "FAST", "ODFL", "ROST", "IDXX", "BIIB", "DXCM", "ILMN", "ALGN",
  "GEHC", "TTWO", "WBD", "ZS", "TEAM", "OKTA", "DDOG", "VRSK", "EXC", "XEL",
  "PCAR", "CPRT", "FANG", "CEG", "ON", "NXPI", "SIRI", "DLTR", "SPLK", "SBUX",
])

interface SP500Row {
  Symbol: string
  Security: string
  "GICS Sector": string
}

async function fetchSP500CSV(): Promise<SP500Row[]> {
  const url =
    "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`CSV download failed: HTTP ${res.status}`)

  const text = await res.text()
  const lines = text.trim().split("\n")
  const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

  return lines.slice(1).map((line) => {
    const values: string[] = []
    let inQuote = false
    let current = ""
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue }
      if (ch === "," && !inQuote) { values.push(current.trim()); current = ""; continue }
      current += ch
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    header.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row as unknown as SP500Row
  })
}

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

  console.log("[cron-master] Starting stock master sync")
  const cronStart = Date.now()

  const stats = {
    krUpserted: 0,
    usUpserted: 0,
    deactivated: 0,
    errors: [] as string[],
  }

  // 1. KR: KOSPI + KOSDAQ
  const [kospiResult, kosdaqResult] = await Promise.allSettled([
    fetchNaverMarketData("KOSPI"),
    fetchNaverMarketData("KOSDAQ"),
  ])

  const krStocks = [
    ...(kospiResult.status === "fulfilled" ? kospiResult.value : []),
    ...(kosdaqResult.status === "fulfilled" ? kosdaqResult.value : []),
  ]

  if (kospiResult.status === "rejected")
    stats.errors.push(`KOSPI: ${String(kospiResult.reason)}`)
  if (kosdaqResult.status === "rejected")
    stats.errors.push(`KOSDAQ: ${String(kosdaqResult.reason)}`)

  // KR upsert
  const krBatches = chunk(krStocks, BATCH_SIZE)
  for (const batch of krBatches) {
    const settled = await Promise.allSettled(
      batch.map((s) =>
        prisma.stock.upsert({
          where: { ticker: s.ticker },
          update: { name: s.name, market: "KR", exchange: s.exchange, isActive: true },
          create: { ticker: s.ticker, name: s.name, market: "KR", exchange: s.exchange, isActive: true },
        })
      )
    )
    for (const r of settled) {
      if (r.status === "fulfilled") stats.krUpserted++
      else stats.errors.push(`KR upsert: ${String(r.reason).slice(0, 100)}`)
    }
  }

  // KR 상장폐지 감지
  if (krStocks.length > 0) {
    const activeTickers = krStocks.map((s) => s.ticker)
    try {
      const result = await prisma.stock.updateMany({
        where: { market: "KR", isActive: true, stockType: "STOCK", ticker: { notIn: activeTickers } },
        data: { isActive: false },
      })
      stats.deactivated += result.count
    } catch (e) {
      stats.errors.push(`KR deactivate: ${String(e)}`)
    }
  }

  // 2. US: S&P 500 CSV
  try {
    const rows = await fetchSP500CSV()
    const usBatches = chunk(rows, BATCH_SIZE)
    for (const batch of usBatches) {
      const settled = await Promise.allSettled(
        batch.map((row) => {
          const ticker = row.Symbol.replace(".", "-")
          const exchange = NASDAQ_STOCKS.has(ticker) ? "NASDAQ" : "NYSE"
          return prisma.stock.upsert({
            where: { ticker },
            update: { name: row.Security, market: "US", exchange, sector: row["GICS Sector"] || null, isActive: true },
            create: { ticker, name: row.Security, market: "US", exchange, sector: row["GICS Sector"] || null, isActive: true },
          })
        })
      )
      for (const r of settled) {
        if (r.status === "fulfilled") stats.usUpserted++
        else stats.errors.push(`US upsert: ${String(r.reason).slice(0, 100)}`)
      }
    }
  } catch (e) {
    stats.errors.push(`US CSV: ${String(e)}`)
  }

  console.log(
    `[cron-master] Done: krUpserted=${stats.krUpserted}, usUpserted=${stats.usUpserted}, deactivated=${stats.deactivated}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-master] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("collect-master", cronStart, result)
  return NextResponse.json(result)
}
