/**
 * Yahoo Finance 배당 이벤트 데이터
 */

import { withRetry } from "@/lib/utils/retry"

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
}

export interface YfDividend {
  ticker: string
  exDate: string // YYYY-MM-DD
  payDate: string | null
  amount: number
  currency: string
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
