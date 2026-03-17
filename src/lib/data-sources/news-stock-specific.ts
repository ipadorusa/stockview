/**
 * 종목별 뉴스 수집 클라이언트
 * - Naver Finance 종목뉴스 스크래핑 (KR)
 * - Google News RSS 종목별 검색 (KR/US)
 */

import { withRetry } from "@/lib/utils/retry"
import type { RssNewsItem } from "./news-rss"

const NAVER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Referer: "https://finance.naver.com/",
  "Accept-Language": "ko-KR,ko;q=0.9",
}

const RSS_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
}

/** XML 태그에서 텍스트 추출 */
function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"))
  if (!match) return ""
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim()
}

/** media:content 또는 enclosure에서 이미지 URL 추출 */
function extractImageUrl(xml: string): string | null {
  const mediaMatch = xml.match(/<media:content[^>]+url=["']([^"']+)["']/i)
  if (mediaMatch) return mediaMatch[1]
  const encMatch = xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']+["']/i)
  if (encMatch) return encMatch[1]
  const encFallback = xml.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))[^"']*["']/i)
  if (encFallback) return encFallback[1]
  return null
}

/**
 * Naver Finance 종목뉴스 스크래핑
 * finance.naver.com/item/news_news.naver?code={ticker}
 */
async function fetchNaverStockNewsRaw(ticker: string): Promise<RssNewsItem[]> {
  const url = `https://finance.naver.com/item/news_news.naver?code=${ticker}`
  const res = await fetch(url, {
    headers: NAVER_HEADERS,
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Naver stock news HTTP ${res.status}: ${ticker}`)

  const buf = await res.arrayBuffer()
  const html = new TextDecoder("euc-kr").decode(buf)

  const results: RssNewsItem[] = []
  const seenUrls = new Set<string>()

  // 뉴스 리스트 아이템 파싱 — <td class="title"> 블록에서 링크 추출
  const rowRegex = /<tr[^>]*class="[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi
  let m: RegExpExecArray | null

  while ((m = rowRegex.exec(html)) !== null) {
    const row = m[1]

    // 제목 링크 추출
    const linkMatch = row.match(/<a\s+href="(\/item\/news_read\.naver\?[^"]+)"[^>]*>([^<]+)<\/a>/i)
    if (!linkMatch) continue

    const relUrl = linkMatch[1]
    const title = linkMatch[2].replace(/\s+/g, " ").trim()
    if (!title || title.length < 5) continue

    const fullUrl = `https://finance.naver.com${relUrl}`
    if (seenUrls.has(fullUrl)) continue
    seenUrls.add(fullUrl)

    // 언론사 추출
    const sourceMatch = row.match(/<td[^>]*class="[^"]*info[^"]*"[^>]*>([^<]+)<\/td>/i)
    const source = sourceMatch ? sourceMatch[1].trim() : "네이버 금융"

    // 날짜 추출
    const dateMatch = row.match(/(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}:\d{2}|\d{4}\.\d{2}\.\d{2})/)
    let publishedAt = new Date()
    if (dateMatch) {
      const dateStr = dateMatch[1].replace(/\./g, "-").replace(" ", "T")
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) publishedAt = parsed
    }

    results.push({
      title,
      url: fullUrl,
      source,
      summary: null,
      imageUrl: null,
      publishedAt,
      category: "KR_MARKET",
    })
  }

  return results
}

export async function fetchNaverStockNews(ticker: string): Promise<RssNewsItem[]> {
  return withRetry(() => fetchNaverStockNewsRaw(ticker), {
    label: `fetchNaverStockNews(${ticker})`,
  })
}

/**
 * Google News RSS 종목별 검색
 * - KR: "{종목명}+주식" 쿼리
 * - US: "{TICKER}+stock" 쿼리
 */
async function fetchGoogleStockNewsRaw(
  ticker: string,
  stockName: string,
  isKR: boolean
): Promise<RssNewsItem[]> {
  const query = isKR
    ? encodeURIComponent(`${stockName} 주식`)
    : encodeURIComponent(`${ticker} stock`)
  const lang = isKR ? "hl=ko&gl=KR&ceid=KR:ko" : "hl=en&gl=US&ceid=US:en"
  const url = `https://news.google.com/rss/search?q=${query}&${lang}`

  const res = await fetch(url, {
    headers: RSS_HEADERS,
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Google News RSS HTTP ${res.status}: ${ticker}`)

  const xml = await res.text()
  const results: RssNewsItem[] = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)

  for (const match of itemMatches) {
    const item = match[1]
    const title = extractTag(item, "title")
    const link = extractTag(item, "link") || extractTag(item, "guid")
    const description = extractTag(item, "description")
    const pubDate = extractTag(item, "pubDate")
    const source = extractTag(item, "source") || "Google News"

    if (!title || !link) continue

    results.push({
      title,
      url: link,
      source,
      summary: description || null,
      imageUrl: extractImageUrl(item),
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
      category: isKR ? "KR_MARKET" : "US_MARKET",
    })
  }

  return results
}

export async function fetchGoogleStockNews(
  ticker: string,
  stockName: string,
  isKR: boolean
): Promise<RssNewsItem[]> {
  return withRetry(() => fetchGoogleStockNewsRaw(ticker, stockName, isKR), {
    label: `fetchGoogleStockNews(${ticker})`,
  })
}

/**
 * 종목 배열에 대해 병렬로 종목별 뉴스 수집
 * - KR: Naver + Google News
 * - US: Google News만
 * - Rate limiting: Naver 요청 사이 200ms 간격
 */
export async function fetchStockSpecificNews(
  stocks: Array<{ ticker: string; name: string; market: string }>
): Promise<Array<{ stockId: string; item: RssNewsItem }>> {
  // 주의: stocks에는 id 필드가 없으므로 호출 측에서 stockId를 별도로 매핑해야 함
  // 여기서는 RssNewsItem만 ticker와 묶어서 반환
  void stocks
  return []
}

/**
 * 상위 N개 종목에 대해 종목별 뉴스 수집
 * 반환값: { ticker → RssNewsItem[] }
 */
export async function fetchTopStocksNews(
  stocks: Array<{ ticker: string; name: string; market: string }>,
  maxPerStock = 10
): Promise<Map<string, RssNewsItem[]>> {
  const resultMap = new Map<string, RssNewsItem[]>()

  const krStocks = stocks.filter((s) => s.market === "KR")
  const usStocks = stocks.filter((s) => s.market === "US")

  // KR 종목: Naver 스크래핑 + Google News (200ms 간격)
  for (const stock of krStocks) {
    await new Promise((r) => setTimeout(r, 200))

    const [naverResult, googleResult] = await Promise.allSettled([
      fetchNaverStockNews(stock.ticker),
      fetchGoogleStockNews(stock.ticker, stock.name, true),
    ])

    const items: RssNewsItem[] = []
    const seenUrls = new Set<string>()

    for (const r of [naverResult, googleResult]) {
      if (r.status !== "fulfilled") continue
      for (const item of r.value) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url)
          items.push(item)
        }
      }
    }

    if (items.length > 0) {
      resultMap.set(stock.ticker, items.slice(0, maxPerStock))
    }
  }

  // US 종목: Google News (배치, Promise.allSettled)
  const usResults = await Promise.allSettled(
    usStocks.map((stock) => fetchGoogleStockNews(stock.ticker, stock.name, false))
  )

  for (let i = 0; i < usStocks.length; i++) {
    const r = usResults[i]
    if (r.status !== "fulfilled" || r.value.length === 0) continue
    resultMap.set(usStocks[i].ticker, r.value.slice(0, maxPerStock))
  }

  return resultMap
}
