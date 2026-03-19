import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 10)

  try {
    const stock = await prisma.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
    })

    if (!stock) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })
    }

    const stockNews = await prisma.stockNews.findMany({
      where: { stockId: stock.id },
      include: { news: true },
      orderBy: { news: { publishedAt: "desc" } },
      take: limit,
    })

    return NextResponse.json({
      news: stockNews.map(({ news }) => ({
        id: news.id,
        title: news.title,
        summary: news.summary,
        content: news.content,
        source: news.source,
        imageUrl: news.imageUrl,
        category: news.category,
        sentiment: news.sentiment,
        publishedAt: news.publishedAt.toISOString(),
        url: news.url,
      })),
    }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
