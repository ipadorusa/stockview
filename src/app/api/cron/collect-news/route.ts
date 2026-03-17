import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  fetchKoreanNews,
  fetchUsNews,
  matchStockNews,
} from "@/lib/data-sources/news-rss"
import { fetchNaverFinanceNews } from "@/lib/data-sources/naver"
import { fetchKrDirectNews } from "@/lib/data-sources/news-kr-direct"
import { classifySentiment } from "@/lib/utils/news-sentiment"
import { logCronResult } from "@/lib/utils/cron-logger"

/** 제목 정규화 후 앞 30자 → 중복 비교 키 */
function titleHash(title: string): string {
  return title
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣]/g, "")
    .slice(0, 30)
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
    errors: [] as string[],
  }

  // 1. 한국 + 미국 + Naver + 한경/매경 뉴스 병렬 수집
  const [krResult, usResult, naverResult, krDirectResult] = await Promise.allSettled([
    fetchKoreanNews(30),
    fetchUsNews(30),
    fetchNaverFinanceNews(30),
    fetchKrDirectNews(30),
  ])

  // Naver 뉴스를 RssNewsItem 형태로 변환
  const naverNews = naverResult.status === "fulfilled"
    ? naverResult.value.map((item) => ({
        title: item.title,
        url: item.url,
        source: item.source,
        summary: null,
        imageUrl: null as string | null,
        publishedAt: item.publishedAt ? new Date(item.publishedAt.replace(/\./g, "-")) : new Date(),
        category: "KR_MARKET" as const,
      }))
    : []

  const allNews = [
    ...(krResult.status === "fulfilled" ? krResult.value : []),
    ...(usResult.status === "fulfilled" ? usResult.value : []),
    ...naverNews,
    ...(krDirectResult.status === "fulfilled" ? krDirectResult.value : []),
  ]

  if (krResult.status === "rejected") {
    stats.errors.push(`KR RSS: ${String(krResult.reason)}`)
  }
  if (usResult.status === "rejected") {
    stats.errors.push(`US RSS: ${String(usResult.reason)}`)
  }
  if (naverResult.status === "rejected") {
    stats.errors.push(`Naver News: ${String(naverResult.reason)}`)
  }
  if (krDirectResult.status === "rejected") {
    stats.errors.push(`KR Direct News: ${String(krDirectResult.reason)}`)
  }

  // 2~4. 새 뉴스 수집 및 종목 매핑
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

        const sentiment = classifySentiment(item.title)
        const news = await prisma.news.upsert({
          where: { url: item.url },
          update: { sentiment },
          create: {
            title: item.title,
            summary: item.summary,
            source: item.source,
            url: item.url,
            imageUrl: item.imageUrl || null,
            category: item.category,
            sentiment,
            publishedAt: item.publishedAt,
          },
        })

        const allMatches = matchStockNews(item.title, stockNames)

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

  // 5. sentiment가 NULL인 기존 뉴스 백필
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
    `[cron-news] Done: krNews=${stats.krNews}, usNews=${stats.usNews}, stockNews=${stats.stockNews}, dupsSkipped=${stats.duplicatesSkipped}, backfilled=${backfilled}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-news] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats, backfilled }
  await logCronResult("collect-news", cronStart, result)
  return NextResponse.json(result)
}
