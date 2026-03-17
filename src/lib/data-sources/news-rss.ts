/**
 * 뉴스 RSS 수집 클라이언트
 * Google News RSS + Naver Finance RSS (인증 불필요)
 */

import { withRetry } from "@/lib/utils/retry"

const RSS_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
}

export type NewsCategory = "KR_MARKET" | "US_MARKET" | "INDUSTRY" | "ECONOMY"

export interface RssNewsItem {
  title: string
  url: string
  source: string
  summary: string | null
  publishedAt: Date
  category: NewsCategory
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

/** RSS XML → 아이템 배열 파싱 */
function parseRssItems(xml: string): Array<{
  title: string
  link: string
  description: string
  source: string
  pubDate: string
}> {
  const items: Array<{
    title: string
    link: string
    description: string
    source: string
    pubDate: string
  }> = []

  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)
  for (const match of itemMatches) {
    const item = match[1]
    const link = extractTag(item, "link") || extractTag(item, "guid")
    if (!link) continue
    items.push({
      title: extractTag(item, "title"),
      link,
      description: extractTag(item, "description"),
      source: extractTag(item, "source") || extractTag(item, "dc:creator") || "",
      pubDate: extractTag(item, "pubDate"),
    })
  }
  return items
}

/** 뉴스 카테고리 분류 */
function categorizeNews(title: string, isKorean: boolean): NewsCategory {
  const t = title.toLowerCase()
  if (isKorean) {
    if (/코스피|코스닥|한국.*증시|증시.*한국/.test(title)) return "KR_MARKET"
    if (/반도체|배터리|바이오|ai|sw|소프트웨어|전기차/.test(t)) return "INDUSTRY"
    if (/경제|금리|환율|인플레|gdp/.test(t)) return "ECONOMY"
    return "KR_MARKET"
  } else {
    if (/s&p|nasdaq|dow|nyse|wall street/.test(t)) return "US_MARKET"
    if (/tech|semiconductor|biotech|ev|ai|software/.test(t)) return "INDUSTRY"
    if (/economy|inflation|fed|interest rate|gdp/.test(t)) return "ECONOMY"
    return "US_MARKET"
  }
}

/** RSS URL fetch + 파싱 */
async function fetchRss(url: string, defaultSource: string, isKorean: boolean): Promise<RssNewsItem[]> {
  return withRetry(() => fetchRssRaw(url, defaultSource, isKorean), { label: `fetchRss(${url.split("?")[0]})` })
}

async function fetchRssRaw(url: string, defaultSource: string, isKorean: boolean): Promise<RssNewsItem[]> {
  const res = await fetch(url, {
    headers: RSS_HEADERS,
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}: ${url}`)

  const xml = await res.text()
  const items = parseRssItems(xml)

  return items
    .filter((item) => item.title && item.link)
    .map((item) => ({
      title: item.title,
      url: item.link,
      source: item.source || defaultSource,
      summary: item.description || null,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      category: categorizeNews(item.title, isKorean),
    }))
}

/** 한국 뉴스 수집 (Google News RSS) */
export async function fetchKoreanNews(maxItems = 30): Promise<RssNewsItem[]> {
  const queries = [
    "코스피 코스닥",
    "삼성전자 주식",
    "SK하이닉스",
    "한국 증시",
  ]

  const results = await Promise.allSettled(
    queries.map((q) =>
      fetchRss(
        `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`,
        "Google News",
        true
      )
    )
  )

  const allItems: RssNewsItem[] = []
  const seenUrls = new Set<string>()

  for (const r of results) {
    if (r.status !== "fulfilled") continue
    for (const item of r.value) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url)
        allItems.push(item)
      }
    }
  }

  // 최신 순 정렬 후 상위 N개
  return allItems
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, maxItems)
}

/** 미국 뉴스 수집 (Google News + Yahoo Finance RSS) */
export async function fetchUsNews(maxItems = 30): Promise<RssNewsItem[]> {
  const sources = [
    {
      url: "https://news.google.com/rss/search?q=stock+market+S%26P+500&hl=en&gl=US&ceid=US:en",
      source: "Google News",
    },
    {
      url: "https://news.google.com/rss/search?q=NASDAQ+stocks&hl=en&gl=US&ceid=US:en",
      source: "Google News",
    },
    {
      url: "https://finance.yahoo.com/news/rssindex",
      source: "Yahoo Finance",
    },
  ]

  const results = await Promise.allSettled(
    sources.map((s) => fetchRss(s.url, s.source, false))
  )

  const allItems: RssNewsItem[] = []
  const seenUrls = new Set<string>()

  for (const r of results) {
    if (r.status !== "fulfilled") continue
    for (const item of r.value) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url)
        allItems.push(item)
      }
    }
  }

  return allItems
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, maxItems)
}

/**
 * 뉴스 제목에서 종목명/티커 매핑
 * @param titles 뉴스 제목 목록
 * @param stockNames 종목명 → stockId 맵
 */
export function matchStockNews(
  title: string,
  stockNames: Map<string, string>
): string[] {
  const matched: string[] = []
  for (const [name, stockId] of stockNames) {
    if (title.includes(name)) {
      matched.push(stockId)
    }
  }
  return matched
}
