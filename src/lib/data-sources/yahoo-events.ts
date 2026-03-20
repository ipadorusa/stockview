/**
 * Yahoo Finance 배당/실적 이벤트 데이터
 */

import { withRetry } from "@/lib/utils/retry"

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
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

export interface YfDividend {
  ticker: string
  exDate: string // YYYY-MM-DD
  payDate: string | null
  amount: number
  currency: string
}

export interface YfEarningsEvent {
  ticker: string
  reportDate: string // YYYY-MM-DD
  quarter: string
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: bigint | null
  revenueActual: bigint | null
}

/**
 * 배당 이력 가져오기 (v8 chart API events)
 */
async function fetchYfDividendsRaw(ticker: string): Promise<YfDividend[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=div`
  const res = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`Yahoo chart HTTP ${res.status}`)

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) return []

  const divEvents = result.events?.dividends ?? {}
  const currency = result.meta?.currency ?? "USD"

  return Object.values(divEvents).map((d: unknown) => {
    const div = d as { date: number; amount: number }
    const exDate = new Date(div.date * 1000).toISOString().split("T")[0]
    return {
      ticker,
      exDate,
      payDate: null,
      amount: div.amount,
      currency,
    }
  })
}

export async function fetchYfDividends(ticker: string): Promise<YfDividend[]> {
  return withRetry(() => fetchYfDividendsRaw(ticker), { label: `fetchYfDividends(${ticker})` })
}

/**
 * 실적 이벤트 가져오기 (quoteSummary earnings)
 */
async function fetchYfEarningsRaw(ticker: string): Promise<YfEarningsEvent[]> {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=earnings,earningsHistory`
  const res = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`Yahoo quoteSummary HTTP ${res.status}`)

  const json = await res.json()
  const result = json?.quoteSummary?.result?.[0]
  if (!result) return []

  const events: YfEarningsEvent[] = []

  // earningsHistory — past earnings
  const history = result.earningsHistory?.history ?? []
  for (const h of history) {
    const quarter = h.quarter?.fmt ?? h.period ?? ""
    const dateStr = h.quarter?.raw
      ? new Date(h.quarter.raw * 1000).toISOString().split("T")[0]
      : null
    if (!dateStr) continue

    events.push({
      ticker,
      reportDate: dateStr,
      quarter,
      epsEstimate: parseNum(h.epsEstimate),
      epsActual: parseNum(h.epsActual),
      revenueEstimate: null,
      revenueActual: null,
    })
  }

  // earnings.earningsChart.quarterly — recent quarters with revenue
  const quarterly = result.earnings?.earningsChart?.quarterly ?? []
  for (const q of quarterly) {
    const quarter = q.date ?? ""
    if (!quarter) continue
    // Don't duplicate if already in history
    if (events.some((e) => e.quarter === quarter)) continue

    events.push({
      ticker,
      reportDate: new Date().toISOString().split("T")[0],
      quarter,
      epsEstimate: parseNum(q.estimate),
      epsActual: parseNum(q.actual),
      revenueEstimate: null,
      revenueActual: null,
    })
  }

  // financialData for revenue
  const financials = result.earnings?.financialsChart?.yearly ?? []
  for (const f of financials) {
    const year = f.date
    if (!year) continue
    // Find matching events to annotate revenue
    for (const e of events) {
      if (e.quarter.includes(String(year))) {
        e.revenueActual = parseBigNum(f.revenue)
      }
    }
  }

  return events
}

export async function fetchYfEarnings(ticker: string): Promise<YfEarningsEvent[]> {
  return withRetry(() => fetchYfEarningsRaw(ticker), { label: `fetchYfEarnings(${ticker})` })
}

export interface YfKrEtfDividend {
  exDate: string // YYYY-MM-DD
  amount: number
  currency: "KRW"
}

/**
 * KR ETF 분배금 가져오기 (v8 chart API, .KS suffix)
 */
async function fetchYfKrEtfDividendsRaw(ticker: string): Promise<YfKrEtfDividend[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}.KS?range=3y&interval=1mo&events=dividends`
  const res = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`Yahoo chart HTTP ${res.status}`)

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) return []

  const divEvents = result.events?.dividends ?? {}

  return Object.values(divEvents).map((d: unknown) => {
    const div = d as { date: number; amount: number }
    const exDate = new Date(div.date * 1000).toISOString().split("T")[0]
    return {
      exDate,
      amount: div.amount,
      currency: "KRW" as const,
    }
  })
}

export async function fetchYfKrEtfDividends(ticker: string): Promise<YfKrEtfDividend[]> {
  return withRetry(() => fetchYfKrEtfDividendsRaw(ticker), {
    label: `fetchYfKrEtfDividends(${ticker})`,
  })
}
