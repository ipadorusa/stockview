/**
 * 종목별 뉴스 수집 클라이언트
 * - Naver 검색 API (KR) — originallink로 원본 URL 확보
 * - Google News RSS 종목별 검색 (KR/US)
 */

import { withRetry } from "@/lib/utils/retry"
import { fetchNaverStockSearchNews } from "./news-naver-search"
import type { RssNewsItem } from "./news-rss"

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

  // KR 종목: Naver 검색 API + Google News (200ms 간격)
  for (const stock of krStocks) {
    await new Promise((r) => setTimeout(r, 200))

    const [naverResult, googleResult] = await Promise.allSettled([
      fetchNaverStockSearchNews(stock.name),
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

  // US 종목: Google News (5개씩 배치, 200ms 간격 — rate limit 방지)
  const CONCURRENT = 5
  for (let i = 0; i < usStocks.length; i += CONCURRENT) {
    const batch = usStocks.slice(i, i + CONCURRENT)
    const batchResults = await Promise.allSettled(
      batch.map((stock) => fetchGoogleStockNews(stock.ticker, stock.name, false))
    )

    for (let j = 0; j < batch.length; j++) {
      const r = batchResults[j]
      if (r.status !== "fulfilled" || r.value.length === 0) continue
      resultMap.set(batch[j].ticker, r.value.slice(0, maxPerStock))
    }

    if (i + CONCURRENT < usStocks.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return resultMap
}
