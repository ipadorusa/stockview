/**
 * 한국 금융 뉴스 직접 RSS 수집
 * 한국경제, 매일경제 RSS
 */

import { withRetry } from "@/lib/utils/retry"
import type { RssNewsItem, NewsCategory } from "./news-rss"

const RSS_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
}

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

function categorizeKrNews(title: string): NewsCategory {
  if (/코스피|코스닥|증시|주가/.test(title)) return "KR_MARKET"
  if (/반도체|배터리|바이오|전기차|AI|SW/.test(title)) return "INDUSTRY"
  if (/경제|금리|환율|인플레|GDP|물가/.test(title)) return "ECONOMY"
  return "KR_MARKET"
}

async function fetchRssRaw(url: string, defaultSource: string): Promise<RssNewsItem[]> {
  const res = await fetch(url, {
    headers: RSS_HEADERS,
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}: ${url}`)

  const xml = await res.text()
  const items: RssNewsItem[] = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)

  for (const match of itemMatches) {
    const item = match[1]
    const title = extractTag(item, "title")
    const link = extractTag(item, "link") || extractTag(item, "guid")
    const description = extractTag(item, "description")
    const pubDate = extractTag(item, "pubDate")

    if (!title || !link) continue

    items.push({
      title,
      url: link,
      source: defaultSource,
      summary: description || null,
      imageUrl: extractImageUrl(item),
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
      category: categorizeKrNews(title),
    })
  }

  return items
}

async function fetchRss(url: string, source: string): Promise<RssNewsItem[]> {
  return withRetry(() => fetchRssRaw(url, source), { label: `fetchKrRss(${url.split("?")[0]})` })
}

/**
 * 한국 금융 뉴스 소스 수집
 */
export async function fetchKrDirectNews(maxItems = 30): Promise<RssNewsItem[]> {
  const sources = [
    { url: "https://www.hankyung.com/feed/stock", source: "한국경제" },
    { url: "https://www.mk.co.kr/rss/30000001/", source: "매일경제" },
    { url: "https://www.yna.co.kr/rss/economy.xml", source: "연합뉴스" },
    { url: "https://www.edaily.co.kr/rss/news_stock.xml", source: "이데일리" },
    { url: "https://www.sedaily.com/Rss/Stock", source: "서울경제" },
    { url: "https://news.mt.co.kr/rss/stock.xml", source: "머니투데이" },
    { url: "https://biz.chosun.com/rss/finance/", source: "조선비즈" },
    { url: "https://kr.investing.com/rss/news.rss", source: "Investing.com" },
  ]

  const results = await Promise.allSettled(
    sources.map((s) => fetchRss(s.url, s.source))
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
