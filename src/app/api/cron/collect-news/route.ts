import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  fetchKoreanNews,
  fetchUsNews,
  matchStockNews,
} from "@/lib/data-sources/news-rss"
import { fetchKrDirectNews } from "@/lib/data-sources/news-kr-direct"
import { fetchNaverSearchNews } from "@/lib/data-sources/news-naver-search"
import { fetchTopStocksNews } from "@/lib/data-sources/news-stock-specific"
import { classifySentiment } from "@/lib/utils/news-sentiment"
import { extractArticleContent } from "@/lib/utils/article-extractor"
import { logCronResult } from "@/lib/utils/cron-logger"
import { revalidateTag, revalidatePath } from "next/cache"
import type { RssNewsItem } from "@/lib/data-sources/news-rss"

/** 제목 정규화 → djb2 해시 (전체 문자열 사용) */
function titleHash(title: string): string {
  const normalized = title.replace(/\s+/g, "").replace(/[^\w가-힣]/g, "")
  let hash = 5381
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) >>> 0
  }
  return hash.toString(36)
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-news] Starting news collection")
  const cronStart = Date.now()

  const stats = {
    krNews: 0,
    usNews: 0,
    stockNews: 0,
    duplicatesSkipped: 0,
    contentExtracted: 0,
    errors: [] as string[],
  }

  // 1. 한국 + 미국 + 한경/매경/연합/이데일리 + Naver검색 뉴스 병렬 수집
  // Note: fetchNaverFinanceNews 제거 — Naver 래퍼 URL 대신 originallink 제공하는 Naver 검색 API로 대체
  const [krResult, usResult, krDirectResult, naverSearchResult] = await Promise.allSettled([
    fetchKoreanNews(30),
    fetchUsNews(30),
    fetchKrDirectNews(30),
    fetchNaverSearchNews(60),
  ])

  let allNews: RssNewsItem[] = [
    ...(krResult.status === "fulfilled" ? krResult.value : []),
    ...(usResult.status === "fulfilled" ? usResult.value : []),
    ...(krDirectResult.status === "fulfilled" ? krDirectResult.value : []),
    ...(naverSearchResult.status === "fulfilled" ? naverSearchResult.value : []),
  ]

  if (krResult.status === "rejected") {
    stats.errors.push(`KR RSS: ${String(krResult.reason)}`)
  }
  if (usResult.status === "rejected") {
    stats.errors.push(`US RSS: ${String(usResult.reason)}`)
  }
  if (krDirectResult.status === "rejected") {
    stats.errors.push(`KR Direct News: ${String(krDirectResult.reason)}`)
  }
  if (naverSearchResult.status === "rejected") {
    stats.errors.push(`Naver Search: ${String(naverSearchResult.reason)}`)
  }

  // 2. 종목별 뉴스 수집 (상위 50개 종목)
  try {
    const topStocks = await prisma.stock.findMany({
      where: { isActive: true },
      select: { ticker: true, name: true, market: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    })

    const stockNewsMap = await fetchTopStocksNews(
      topStocks.map((s) => ({ ticker: s.ticker, name: s.name, market: s.market }))
    )

    for (const items of stockNewsMap.values()) {
      for (const item of items) {
        allNews.push(item)
      }
    }
  } catch (e) {
    stats.errors.push(`Stock-specific news: ${String(e)}`)
  }

  // 3. 새 뉴스 수집 및 종목 매핑
  if (allNews.length > 0) {
    // 24시간 내 기존 뉴스 제목 해시 로드 (중복 비교용)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentNews = await prisma.news.findMany({
      where: { publishedAt: { gte: oneDayAgo } },
      select: { title: true },
    })
    const existingHashes = new Set(recentNews.map((n) => titleHash(n.title)))

    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      select: { id: true, name: true, ticker: true },
    })

    const stockNames = new Map<string, string>()
    for (const s of stocks) {
      stockNames.set(s.name, s.id)
      if (s.ticker) stockNames.set(s.ticker, s.id)
    }

    for (const item of allNews) {
      try {
        // 중복 뉴스 건너뛰기 (24시간 내 유사 제목)
        const hash = titleHash(item.title)
        if (existingHashes.has(hash)) {
          stats.duplicatesSkipped++
          continue
        }
        existingHashes.add(hash)

        // Google News RSS 리다이렉트 URL → 실제 기사 URL로 해석
        let finalUrl = item.url
        if (finalUrl.includes("news.google.com/rss/articles")) {
          try {
            const redirectRes = await fetch(finalUrl, {
              method: "HEAD",
              redirect: "follow",
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
              signal: AbortSignal.timeout(5_000),
            })
            if (redirectRes.url && !redirectRes.url.includes("news.google.com")) {
              finalUrl = redirectRes.url
            }
          } catch {
            // 리다이렉트 해석 실패 시 원본 URL 유지
          }
        }

        const sentiment = classifySentiment(item.title)

        // 기사 본문 추출 (첫 300자, 실패 시 null)
        let content: string | null = null
        try {
          const extracted = await extractArticleContent(finalUrl)
          if (extracted?.content) {
            content = extracted.content
            stats.contentExtracted++
          }
        } catch {
          // 추출 실패 시 무시
        }

        const news = await prisma.news.upsert({
          where: { url: finalUrl },
          update: { sentiment, ...(content ? { content } : {}) },
          create: {
            title: item.title,
            summary: item.summary,
            content,
            source: item.source,
            url: finalUrl,
            imageUrl: item.imageUrl || null,
            category: item.category,
            sentiment,
            publishedAt: item.publishedAt,
          },
        })

        const allMatches = matchStockNews(item.title, stockNames, item.summary, content)

        if (allMatches.length > 0) {
          await prisma.stockNews.createMany({
            data: allMatches.map((stockId) => ({
              stockId,
              newsId: news.id,
            })),
            skipDuplicates: true,
          })
          stats.stockNews += allMatches.length
        }

        if (item.category.startsWith("KR")) stats.krNews++
        else stats.usNews++
      } catch (e) {
        stats.errors.push(`News "${item.title.slice(0, 30)}": ${String(e)}`)
      }
    }
  }

  // 4. sentiment가 NULL인 기존 뉴스 백필
  let backfilled = 0
  const nullSentimentNews = await prisma.news.findMany({
    where: { sentiment: null },
    select: { id: true, title: true },
  })
  if (nullSentimentNews.length > 0) {
    for (const n of nullSentimentNews) {
      await prisma.news.update({
        where: { id: n.id },
        data: { sentiment: classifySentiment(n.title) },
      })
      backfilled++
    }
  }

  console.log(
    `[cron-news] Done: krNews=${stats.krNews}, usNews=${stats.usNews}, stockNews=${stats.stockNews}, dupsSkipped=${stats.duplicatesSkipped}, contentExtracted=${stats.contentExtracted}, backfilled=${backfilled}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-news] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats, backfilled }
  await logCronResult("collect-news", cronStart, result)
  revalidateTag("news", { expire: 0 })
  // Revalidate pages for stocks that received new news in the last hour
  const recentStockNews = await prisma.stockNews.findMany({
    where: { news: { publishedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } },
    select: { stockId: true },
    distinct: ["stockId"],
  })
  if (recentStockNews.length > 0) {
    const stockIds = recentStockNews.map((sn) => sn.stockId)
    const stocksToRevalidate = await prisma.stock.findMany({
      where: { id: { in: stockIds } },
      select: { ticker: true },
    })
    for (const s of stocksToRevalidate) {
      revalidatePath(`/stock/${s.ticker}`)
    }
  }
  return NextResponse.json(result)
}
