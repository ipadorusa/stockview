/**
 * Yahoo Finance quoteSummary API for fundamentals
 * modules: defaultKeyStatistics, financialData, assetProfile
 */

import { withRetry } from "@/lib/utils/retry"

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
}

function parseNum(val: unknown): number | null {
  if (val == null) return null
  if (typeof val === "object" && val !== null && "raw" in val) {
    return parseNum((val as { raw?: unknown }).raw)
  }
  const n = typeof val === "number" ? val : parseFloat(String(val))
  return isNaN(n) ? null : n
}

function parseBigNum(val: unknown): bigint | null {
  if (val == null) return null
  if (typeof val === "object" && val !== null && "raw" in val) {
    return parseBigNum((val as { raw?: unknown }).raw)
  }
  const n = typeof val === "number" ? val : parseFloat(String(val))
  return isNaN(n) ? null : BigInt(Math.round(n))
}

export interface YfFundamental {
  ticker: string
  eps: number | null
  forwardEps: number | null
  pbr: number | null
  dividendYield: number | null
  roe: number | null
  debtToEquity: number | null
  beta: number | null
  revenue: bigint | null
  netIncome: bigint | null
  description: string | null
  employeeCount: number | null
}

async function fetchYfFundamentalRaw(ticker: string): Promise<YfFundamental | null> {
  const modules = "defaultKeyStatistics,financialData,assetProfile"
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`

  const res = await fetch(url, {
    headers: YF_HEADERS,
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`Yahoo quoteSummary HTTP ${res.status}`)

  const json = await res.json()
  const result = json?.quoteSummary?.result?.[0]
  if (!result) return null

  const keyStats = result.defaultKeyStatistics ?? {}
  const financial = result.financialData ?? {}
  const profile = result.assetProfile ?? {}

  return {
    ticker,
    eps: parseNum(financial.earningsPerShare ?? keyStats.trailingEps),
    forwardEps: parseNum(keyStats.forwardEps),
    pbr: parseNum(keyStats.priceToBook),
    dividendYield: parseNum(keyStats.dividendYield),
    roe: parseNum(financial.returnOnEquity),
    debtToEquity: parseNum(financial.debtToEquity),
    beta: parseNum(keyStats.beta),
    revenue: parseBigNum(financial.totalRevenue),
    netIncome: parseBigNum(financial.netIncomeToCommon ?? financial.netIncome),
    description: profile.longBusinessSummary ?? null,
    employeeCount: parseNum(profile.fullTimeEmployees) != null
      ? Math.round(parseNum(profile.fullTimeEmployees)!)
      : null,
  }
}

export async function fetchYfFundamental(ticker: string): Promise<YfFundamental | null> {
  return withRetry(() => fetchYfFundamentalRaw(ticker), { label: `fetchYfFundamental(${ticker})` })
}

export async function fetchYfFundamentals(tickers: string[]): Promise<YfFundamental[]> {
  if (tickers.length === 0) return []

  const results: YfFundamental[] = []
  const CONCURRENT = 3

  for (let i = 0; i < tickers.length; i += CONCURRENT) {
    const batch = tickers.slice(i, i + CONCURRENT)
    const settled = await Promise.allSettled(batch.map(fetchYfFundamental))
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) results.push(r.value)
    }
    if (i + CONCURRENT < tickers.length) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  return results
}
