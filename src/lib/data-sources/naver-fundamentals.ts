/**
 * Naver Finance 기업개요/재무 페이지 HTML 스크래핑
 */

import { withRetry } from "@/lib/utils/retry"

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Referer: "https://finance.naver.com/",
  "Accept-Language": "ko-KR,ko;q=0.9",
}

const RE_COMMA = /,/g
const RE_NON_NUM = /[^\d.+-]/g
const RE_SUMMARY_INFO = /class="summary_info"[^>]*>([\s\S]*?)<\/div>/
const RE_HTML_TAG = /<[^>]+>/g
const RE_WHITESPACE = /\s+/g
const RE_EPS = /EPS\s*<[^>]*>[\s\S]*?<em[^>]*>([\d,.-]+)<\/em>/
const RE_PBR = /PBR[\s\S]*?<td[^>]*>\s*([\d,.]+)\s*<\/td>/
const RE_ROE = /ROE\s*<[^>]*>[\s\S]*?<em[^>]*>([\d,.-]+)<\/em>/
const RE_DIV = /배당수익률\s*<[^>]*>[\s\S]*?<em[^>]*>([\d,.-]+)<\/em>/

function parseKrNum(s: string): number | null {
  const cleaned = s.replace(RE_COMMA, "").replace(RE_NON_NUM, "").trim()
  if (!cleaned) return null
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

async function fetchNaverHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`Naver HTTP ${res.status}: ${url}`)
  const buf = await res.arrayBuffer()
  const ct = res.headers.get("content-type") ?? ""
  const encoding = ct.toLowerCase().includes("utf-8") ? "utf-8" : "euc-kr"
  return new TextDecoder(encoding).decode(buf)
}

async function fetchNaver(url: string): Promise<string> {
  return withRetry(() => fetchNaverHtml(url), { label: `fetchNaver(${url.split("?")[0]})` })
}

export interface NaverFundamental {
  ticker: string
  eps: number | null
  pbr: number | null
  dividendYield: number | null
  roe: number | null
  debtToEquity: number | null
  revenue: bigint | null
  netIncome: bigint | null
  description: string | null
}

/**
 * Naver Finance 종목 상세에서 펀더멘탈 추출
 */
export async function fetchNaverFundamental(ticker: string): Promise<NaverFundamental | null> {
  try {
    const html = await fetchNaver(
      `https://finance.naver.com/item/main.naver?code=${ticker}`
    )

    // 기업개요 추출
    const descMatch = html.match(RE_SUMMARY_INFO)
    const description = descMatch
      ? descMatch[1].replace(RE_HTML_TAG, "").replace(RE_WHITESPACE, " ").trim()
      : null

    // 재무 테이블에서 데이터 추출
    let eps: number | null = null
    let pbr: number | null = null
    let roe: number | null = null
    let dividendYield: number | null = null

    // EPS 추출
    const epsMatch = html.match(RE_EPS)
    if (epsMatch) eps = parseKrNum(epsMatch[1])

    // PBR 추출
    const pbrMatch = html.match(RE_PBR)
    if (pbrMatch) pbr = parseKrNum(pbrMatch[1])

    // ROE 추출
    const roeMatch = html.match(RE_ROE)
    if (roeMatch) roe = parseKrNum(roeMatch[1])

    // 배당수익률 추출
    const divMatch = html.match(RE_DIV)
    if (divMatch) dividendYield = parseKrNum(divMatch[1])
    if (dividendYield != null) dividendYield = dividendYield / 100 // percent to ratio

    return {
      ticker,
      eps,
      pbr,
      dividendYield,
      roe: roe != null ? roe / 100 : null, // percent to ratio
      debtToEquity: null, // not easily available from main page
      revenue: null,
      netIncome: null,
      description,
    }
  } catch (e) {
    console.error(`[naver-fundamentals] Error fetching ${ticker}:`, e)
    return null
  }
}

export async function fetchNaverFundamentals(tickers: string[]): Promise<NaverFundamental[]> {
  if (tickers.length === 0) return []

  const results: NaverFundamental[] = []
  const CONCURRENT = 3

  for (let i = 0; i < tickers.length; i += CONCURRENT) {
    const batch = tickers.slice(i, i + CONCURRENT)
    const settled = await Promise.allSettled(batch.map(fetchNaverFundamental))
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) results.push(r.value)
    }
    if (i + CONCURRENT < tickers.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return results
}
