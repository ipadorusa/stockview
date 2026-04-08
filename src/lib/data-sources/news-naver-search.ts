/**
 * Naver 검색 API 뉴스 수집
 * https://developers.naver.com/docs/serviceapi/search/news/news.md
 *
 * 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 * 무료 25,000건/일
 */

import { withRetry } from "@/lib/utils/retry"
import type { RssNewsItem, NewsCategory } from "./news-rss"

const NAVER_API_URL = "https://openapi.naver.com/v1/search/news.json"

interface NaverNewsResult {
  title: string
  originallink: string
  link: string
  description: string
  pubDate: string
}

interface NaverNewsResponse {
  items: NaverNewsResult[]
  total: number
  display: number
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim()
}

function categorize(title: string): NewsCategory {
  if (/코스피|코스닥|증시|주가|상장/.test(title)) return "KR_MARKET"
  if (/반도체|배터리|바이오|AI|전기차|SW|IT/.test(title)) return "INDUSTRY"
  if (/경제|금리|환율|인플레|GDP|물가|기준금리/.test(title)) return "ECONOMY"
  return "KR_MARKET"
}

async function searchNaverNews(
  query: string,
  display = 20,
  sort: "sim" | "date" = "date"
): Promise<RssNewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) return []

  const params = new URLSearchParams({
    query,
    display: String(display),
    sort,
  })

  const data: NaverNewsResponse = await withRetry(async () => {
    const res = await fetch(`${NAVER_API_URL}?${params}`, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Naver API ${res.status}`)
    return res.json()
  }, { label: `searchNaverNews(${query})` })

  return data.items.map((item) => {
    const title = stripHtml(item.title)
    return {
      title,
      url: item.originallink || item.link,
      source: "Naver검색",
      summary: stripHtml(item.description) || null,
      imageUrl: null,
      publishedAt: new Date(item.pubDate),
      category: categorize(title),
    }
  })
}

/**
 * Naver 검색 API로 주식 관련 뉴스 수집
 * API 키 미설정 시 빈 배열 반환 (graceful skip)
 */
export async function fetchNaverSearchNews(maxItems = 40): Promise<RssNewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID
  if (!clientId) {
    console.log("[naver-search] NAVER_CLIENT_ID not set, skipping")
    return []
  }

  const queries = [
    "주식 시장",
    "코스피 코스닥",
    "증권 투자",
    "미국 주식",
    "증시 전망",
    "주식 테마",
    "반도체 주가",
    "배터리 주식",
  ]

  const results = await Promise.allSettled(
    queries.map((q) => withRetry(() => searchNaverNews(q, 20), { label: `naverSearch(${q})` }))
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
 * 특정 종목명으로 Naver 뉴스 검색
 */
export async function fetchNaverStockSearchNews(
  stockName: string,
  display = 10
): Promise<RssNewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID
  if (!clientId) return []

  return withRetry(
    () => searchNaverNews(`${stockName} 주식`, display),
    { label: `naverStockSearch(${stockName})` }
  )
}
