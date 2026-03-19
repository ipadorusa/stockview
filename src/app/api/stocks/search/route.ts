import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await prisma.stock.findMany({
      where: {
        isActive: true,
        OR: [
          { ticker: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { nameEn: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { ticker: true, name: true, market: true, exchange: true, stockType: true },
      take: 10,
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: "검색 중 오류가 발생했습니다." }, { status: 500 })
  }
}
