import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const market = req.nextUrl.searchParams.get("market") ?? "KR"
  const sector = decodeURIComponent(name)

  try {
    const stocks = await prisma.stock.findMany({
      where: { market: market as "KR" | "US", isActive: true, sector },
      select: {
        ticker: true,
        name: true,
        quotes: {
          select: { price: true, changePercent: true, volume: true },
          take: 1,
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    })

    const result = stocks
      .filter((s) => s.quotes.length > 0)
      .map((s) => ({
        ticker: s.ticker,
        name: s.name,
        price: Number(s.quotes[0].price),
        changePercent: Number(s.quotes[0].changePercent),
        volume: Number(s.quotes[0].volume),
      }))
      .sort((a, b) => b.changePercent - a.changePercent)

    return NextResponse.json({ stocks: result })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
