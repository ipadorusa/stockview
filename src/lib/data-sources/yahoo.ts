/**
 * Yahoo Finance 비공식 HTTP 클라이언트 (v8 chart API, crumb 불필요)
 * SLA 없음 — 모든 호출은 try/catch로 감싸서 사용할 것
 */

import { withRetry } from "@/lib/utils/retry"

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
}

function parseNum(val: unknown): number {
  if (val == null) return 0
  return typeof val === "number" ? val : parseFloat(String(val)) || 0
}

function parseBigNum(val: unknown): bigint {
  if (val == null) return 0n
  const n = typeof val === "number" ? val : parseFloat(String(val))
  return isNaN(n) ? 0n : BigInt(Math.round(n))
}

export interface YfQuote {
  ticker: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: bigint
  marketCap: bigint | null
  high52w: number | null
  low52w: number | null
  per: number | null
  preMarketPrice: number | null
  postMarketPrice: number | null
}

export interface YfExchangeRate {
  pair: string
  rate: number
  change: number
  changePercent: number
}

export interface YfDailyOhlcv {
  time: string // YYYY-MM-DD
  open: number
  high: number
  low: number
  close: number
  adjClose: number
  volume: bigint
}

/**
 * 단일 종목 시세 조회 (v8 chart API, crumb 불필요)
 */
async function fetchYfChart(ticker: string): Promise<YfQuote | null> {
  return withRetry(() => fetchYfChartRaw(ticker), { label: `fetchYfChart(${ticker})` })
}

async function fetchYfChartRaw(ticker: string): Promise<YfQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: YF_HEADERS,
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`Yahoo Finance chart HTTP ${res.status}`)

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) return null

  const meta = result.meta ?? {}
  const price = parseNum(meta.regularMarketPrice)
  if (!price) return null

  const previousClose = parseNum(
    meta.regularMarketPreviousClose ?? meta.chartPreviousClose ?? 0
  )
  const change = price - previousClose
  const changePercent = previousClose ? (change / previousClose) * 100 : 0

  return {
    ticker,
    price,
    previousClose,
    change,
    changePercent,
    open: parseNum(meta.regularMarketOpen),
    high: parseNum(meta.regularMarketDayHigh),
    low: parseNum(meta.regularMarketDayLow),
    volume: parseBigNum(meta.regularMarketVolume),
    marketCap: meta.marketCap != null ? parseBigNum(meta.marketCap) : null,
    high52w:
      meta.fiftyTwoWeekHigh != null ? parseNum(meta.fiftyTwoWeekHigh) : null,
    low52w:
      meta.fiftyTwoWeekLow != null ? parseNum(meta.fiftyTwoWeekLow) : null,
    per: meta.trailingPE != null ? parseNum(meta.trailingPE) : null,
    // v8 chart API는 프리/포스트 마켓 가격 미제공
    preMarketPrice: null,
    postMarketPrice: null,
  }
}

/**
 * 배치 시세 조회 (v8 chart API, 5개씩 병렬)
 * @param tickers Yahoo Finance 티커 배열
 */
export async function fetchYfQuotes(tickers: string[]): Promise<YfQuote[]> {
  if (tickers.length === 0) return []

  const results: YfQuote[] = []
  const CONCURRENT = 5

  for (let i = 0; i < tickers.length; i += CONCURRENT) {
    const batch = tickers.slice(i, i + CONCURRENT)
    const settled = await Promise.allSettled(batch.map(fetchYfChart))
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) results.push(r.value)
    }
    if (i + CONCURRENT < tickers.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return results
}

/**
 * 일별 OHLCV 수집 (v8 chart API, crumb 불필요)
 * @param ticker Yahoo Finance 티커
 * @param days 최근 N일 (기본 30)
 */
export async function fetchYfDailyOhlcv(
  ticker: string,
  days = 30
): Promise<YfDailyOhlcv[]> {
  const range = days <= 7 ? "5d" : days <= 30 ? "1mo" : days <= 90 ? "3mo" : days <= 180 ? "6mo" : "1y"
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=${range}`

  const res = await fetch(url, {
    headers: YF_HEADERS,
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`Yahoo Finance chart HTTP ${res.status}`)

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) return []

  const timestamps: number[] = result.timestamp ?? []
  const quote = result.indicators?.quote?.[0] ?? {}
  const adjclose = result.indicators?.adjclose?.[0]?.adjclose ?? []

  return timestamps
    .map((ts, i) => {
      const date = new Date(ts * 1000)
      const open = parseNum(quote.open?.[i])
      const close = parseNum(quote.close?.[i])
      if (!open && !close) return null
      return {
        time: date.toISOString().split("T")[0],
        open,
        high: parseNum(quote.high?.[i]),
        low: parseNum(quote.low?.[i]),
        close,
        adjClose: parseNum(adjclose[i]) || close,
        volume: parseBigNum(quote.volume?.[i]),
      }
    })
    .filter((x): x is YfDailyOhlcv => x !== null)
}

/** 주요 미국 ETF 티커 목록 (~30종) */
export const US_ETF_LIST = [
  // 주식형
  "SPY", "QQQ", "IWM", "VTI", "VOO", "DIA", "RSP",
  // 섹터
  "XLF", "XLK", "XLE", "XLV", "XLI", "XLC", "XLY", "XLP", "XLU", "XLB", "XLRE",
  // 채권
  "BND", "TLT", "SHY", "AGG",
  // 원자재
  "GLD", "SLV", "USO",
  // 글로벌
  "EFA", "EEM", "VEA", "VWO",
]

/**
 * USD/KRW 환율 조회 (v8 chart API, KRW=X)
 */
export async function fetchUsdKrwRate(): Promise<YfExchangeRate | null> {
  try {
    const url =
      "https://query1.finance.yahoo.com/v8/finance/chart/KRW%3DX?interval=1d&range=1d"
    const res = await fetch(url, {
      headers: YF_HEADERS,
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`Yahoo Finance chart HTTP ${res.status}`)

    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) return null

    const rate = parseNum(meta.regularMarketPrice)
    if (!rate) return null

    const previousClose = parseNum(
      meta.regularMarketPreviousClose ?? meta.chartPreviousClose ?? 0
    )
    const change = rate - previousClose
    const changePercent = previousClose ? (change / previousClose) * 100 : 0

    return { pair: "USD/KRW", rate, change, changePercent }
  } catch {
    return null
  }
}

const EXCHANGE_RATE_SYMBOLS: { symbol: string; pair: string; multiplier: number }[] = [
  { symbol: "KRW=X", pair: "USD/KRW", multiplier: 1 },
  { symbol: "EURKRW=X", pair: "EUR/KRW", multiplier: 1 },
  { symbol: "JPYKRW=X", pair: "JPY/KRW", multiplier: 100 },
  { symbol: "CNYKRW=X", pair: "CNY/KRW", multiplier: 1 },
  { symbol: "GBPKRW=X", pair: "GBP/KRW", multiplier: 1 },
]

/**
 * 5개 기초통화 환율 일괄 조회 (USD, EUR, JPY, CNY, GBP → KRW)
 * JPY는 100엔 기준으로 변환
 */
export async function fetchExchangeRates(): Promise<YfExchangeRate[]> {
  const results: YfExchangeRate[] = []

  const settled = await Promise.allSettled(
    EXCHANGE_RATE_SYMBOLS.map(async ({ symbol, pair, multiplier }) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
      const res = await fetch(url, {
        headers: YF_HEADERS,
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) throw new Error(`Yahoo Finance chart HTTP ${res.status}`)

      const json = await res.json()
      const meta = json?.chart?.result?.[0]?.meta
      if (!meta) return null

      const rawRate = parseNum(meta.regularMarketPrice)
      if (!rawRate) return null

      const rawPrevClose = parseNum(
        meta.regularMarketPreviousClose ?? meta.chartPreviousClose ?? 0
      )

      const rate = rawRate * multiplier
      const previousClose = rawPrevClose * multiplier
      const change = rate - previousClose
      const changePercent = previousClose ? (change / previousClose) * 100 : 0

      return { pair, rate, change, changePercent }
    })
  )

  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) results.push(r.value)
  }

  return results
}
