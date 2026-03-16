/**
 * Yahoo Finance 비공식 HTTP 클라이언트
 * SLA 없음 — 모든 호출은 try/catch로 감싸서 사용할 것
 */

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
}

// 모듈 스코프 crumb 캐시 (프로세스 생존 동안 유지)
let _crumb: string | null = null
let _cookie: string | null = null

async function ensureCrumb(): Promise<void> {
  if (_crumb && _cookie) return

  // 쿠키 획득
  const initRes = await fetch("https://finance.yahoo.com/", {
    headers: YF_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  })
  const setCookies = initRes.headers.getSetCookie
    ? initRes.headers.getSetCookie()
    : [initRes.headers.get("set-cookie") ?? ""]
  _cookie = setCookies.filter(Boolean).join("; ")

  // crumb 획득
  const crumbRes = await fetch(
    "https://query2.finance.yahoo.com/v1/test/getcrumb",
    {
      headers: { ...YF_HEADERS, Cookie: _cookie },
      signal: AbortSignal.timeout(10_000),
    }
  )
  const text = await crumbRes.text()
  if (!text || text.includes("Not Found")) {
    throw new Error("Yahoo Finance crumb 획득 실패")
  }
  _crumb = text.trim()
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

/**
 * 배치 시세 조회 (최대 20개 티커)
 * @param tickers Yahoo Finance 티커 배열 (예: ["AAPL", "MSFT"])
 */
export async function fetchYfQuotes(tickers: string[]): Promise<YfQuote[]> {
  if (tickers.length === 0) return []
  await ensureCrumb()

  const symbolStr = tickers.join(",")
  const url = new URL("https://query1.finance.yahoo.com/v7/finance/quote")
  url.searchParams.set("symbols", symbolStr)
  url.searchParams.set("crumb", _crumb!)
  url.searchParams.set("formatted", "false")
  url.searchParams.set("lang", "en-US")
  url.searchParams.set("region", "US")

  const res = await fetch(url.toString(), {
    headers: { ...YF_HEADERS, Cookie: _cookie! },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`)

  const json = await res.json()
  const results: Record<string, unknown>[] =
    json?.quoteResponse?.result ?? []

  return results.map((r) => ({
    ticker: String(r.symbol ?? ""),
    price: parseNum(r.regularMarketPrice),
    previousClose: parseNum(r.regularMarketPreviousClose),
    change: parseNum(r.regularMarketChange),
    changePercent: parseNum(r.regularMarketChangePercent),
    open: parseNum(r.regularMarketOpen),
    high: parseNum(r.regularMarketDayHigh),
    low: parseNum(r.regularMarketDayLow),
    volume: parseBigNum(r.regularMarketVolume),
    marketCap: r.marketCap != null ? parseBigNum(r.marketCap) : null,
    high52w: r.fiftyTwoWeekHigh != null ? parseNum(r.fiftyTwoWeekHigh) : null,
    low52w: r.fiftyTwoWeekLow != null ? parseNum(r.fiftyTwoWeekLow) : null,
    per: r.trailingPE != null ? parseNum(r.trailingPE) : null,
    preMarketPrice:
      r.preMarketPrice != null ? parseNum(r.preMarketPrice) : null,
    postMarketPrice:
      r.postMarketPrice != null ? parseNum(r.postMarketPrice) : null,
  }))
}

/**
 * 일별 OHLCV 수집 (장마감 후 사용)
 * @param ticker Yahoo Finance 티커
 * @param days 최근 N일 (기본 30)
 */
export interface YfDailyOhlcv {
  time: string // YYYY-MM-DD
  open: number
  high: number
  low: number
  close: number
  adjClose: number
  volume: bigint
}

export async function fetchYfDailyOhlcv(
  ticker: string,
  days = 30
): Promise<YfDailyOhlcv[]> {
  const range = days <= 7 ? "5d" : days <= 30 ? "1mo" : "3mo"
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

/**
 * USD/KRW 환율 조회
 */
export async function fetchUsdKrwRate(): Promise<YfExchangeRate | null> {
  try {
    await ensureCrumb()
    const results = await fetchYfQuotes(["KRW=X"])
    const r = results[0]
    if (!r) return null
    return {
      pair: "USD/KRW",
      rate: r.price,
      change: r.change,
      changePercent: r.changePercent,
    }
  } catch {
    return null
  }
}

