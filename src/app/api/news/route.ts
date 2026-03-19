import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category")
  const sentiment = req.nextUrl.searchParams.get("sentiment")
  const q = req.nextUrl.searchParams.get("q")
  const page = Number(req.nextUrl.searchParams.get("page") ?? 1)
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 10)
  const skip = (page - 1) * limit

  try {
    const where: Record<string, unknown> = {}
    if (category && category !== "all") {
      where.category = category as "KR_MARKET" | "US_MARKET" | "INDUSTRY" | "ECONOMY"
    }
    if (sentiment && sentiment !== "all") {
      where.sentiment = sentiment
    }
    if (q && q.trim()) {
      where.title = { contains: q.trim(), mode: "insensitive" }
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: {
          stocks: { include: { stock: { select: { ticker: true } } } },
        },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.news.count({ where }),
    ])

    return NextResponse.json({
      news: news.map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        source: n.source,
        imageUrl: n.imageUrl,
        category: n.category,
        sentiment: n.sentiment,
        publishedAt: n.publishedAt.toISOString(),
        url: n.url,
        relatedTickers: n.stocks.map((sn) => sn.stock.ticker),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
