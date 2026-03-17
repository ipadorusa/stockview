/**
 * Naver Finance KR 배당 데이터 스크래핑
 */

import { withRetry } from "@/lib/utils/retry"

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Referer: "https://finance.naver.com/",
}

function parseKrNum(s: string): number {
  return parseFloat(s.replace(/,/g, "").replace(/[^\d.+-]/g, "")) || 0
}

export interface NaverDividend {
  ticker: string
  exDate: string // YYYY-MM-DD
  amount: number
  currency: string
}

async function fetchEucKrRaw(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`Naver HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  return new TextDecoder("euc-kr").decode(buf)
}

/**
 * Naver Finance 배당 페이지에서 배당 이력 추출
 */
export async function fetchNaverDividends(ticker: string): Promise<NaverDividend[]> {
  try {
    const html = await withRetry(
      () => fetchEucKrRaw(`https://finance.naver.com/item/coinfo.naver?code=${ticker}&target=finsum_more`),
      { label: `fetchNaverDividends(${ticker})` }
    )

    const results: NaverDividend[] = []

    // 배당 관련 행 추출 — Naver 형식은 변할 수 있어 최선의 파싱
    const divRegex = /(\d{4}\/\d{2}\/\d{2})\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d,.]+)/g
    let m: RegExpExecArray | null

    // 배당 섹션 찾기
    const divSection = html.indexOf("배당")
    if (divSection === -1) return results

    const sectionHtml = html.slice(divSection, divSection + 5000)

    while ((m = divRegex.exec(sectionHtml)) !== null) {
      const dateStr = m[1].replace(/\//g, "-")
      const amount = parseKrNum(m[2])
      if (amount > 0) {
        results.push({ ticker, exDate: dateStr, amount, currency: "KRW" })
      }
    }

    return results
  } catch (e) {
    console.error(`[naver-dividends] Error fetching ${ticker}:`, e)
    return []
  }
}
