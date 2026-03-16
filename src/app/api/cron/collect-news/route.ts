import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  fetchKoreanNews,
  fetchUsNews,
  matchStockNews,
} from "@/lib/data-sources/news-rss"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-news] Starting news collection")

  const stats = {
    krNews: 0,
    usNews: 0,
    stockNews: 0,
    errors: [] as string[],
  }

  // 1. 한국 + 미국 뉴스 병렬 수집
  const [krResult, usResult] = await Promise.allSettled([
    fetchKoreanNews(30),
    fetchUsNews(30),
  ])

  const allNews = [
    ...(krResult.status === "fulfilled" ? krResult.value : []),
    ...(usResult.status === "fulfilled" ? usResult.value : []),
  ]

  if (krResult.status === "rejected") {
    stats.errors.push(`KR RSS: ${String(krResult.reason)}`)
  }
  if (usResult.status === "rejected") {
    stats.errors.push(`US RSS: ${String(usResult.reason)}`)
  }

  if (allNews.length === 0) {
    return NextResponse.json({ ok: true, ...stats })
  }

  // 2. 종목 매핑용 데이터 로드 (상위 100개 활성 종목)
  const stocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: { id: true, name: true, ticker: true },
    take: 100,
  })
  // name → stockId, ticker → stockId
  const stockNames = new Map<string, string>()
  for (const s of stocks) {
    stockNames.set(s.name, s.id)
    if (s.ticker) stockNames.set(s.ticker, s.id)
  }

  // 3. 뉴스 DB 저장 (url UNIQUE → 중복 skip)
  for (const item of allNews) {
    try {
      const news = await prisma.news.upsert({
        where: { url: item.url },
        update: {}, // 이미 있으면 skip (업데이트 없음)
        create: {
          title: item.title,
          summary: item.summary,
          source: item.source,
          url: item.url,
          category: item.category,
          publishedAt: item.publishedAt,
        },
      })

      // 4. 종목 연결 (StockNews)
      const matchedStockIds = matchStockNews(item.title, stockNames)
      if (matchedStockIds.length > 0) {
        await prisma.stockNews.createMany({
          data: matchedStockIds.map((stockId) => ({
            stockId,
            newsId: news.id,
          })),
          skipDuplicates: true,
        })
        stats.stockNews += matchedStockIds.length
      }

      if (item.category.startsWith("KR")) stats.krNews++
      else stats.usNews++
    } catch (e) {
      stats.errors.push(`News "${item.title.slice(0, 30)}": ${String(e)}`)
    }
  }

  console.log(
    `[cron-news] Done: krNews=${stats.krNews}, usNews=${stats.usNews}, stockNews=${stats.stockNews}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-news] Errors (${stats.errors.length}):`, stats.errors)
  }

  return NextResponse.json({ ok: true, ...stats })
}
