import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 5)

  try {
    const news = await prisma.news.findMany({
      orderBy: { publishedAt: "desc" },
      take: limit,
    })

    return NextResponse.json({
      news: news.map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        source: n.source,
        imageUrl: n.imageUrl,
        category: n.category,
        publishedAt: n.publishedAt.toISOString(),
        url: n.url,
      })),
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
