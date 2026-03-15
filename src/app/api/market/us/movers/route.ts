import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 5)

  try {
    const stocks = await prisma.stock.findMany({
      where: { market: "US", isActive: true },
      include: {
        quotes: {
          select: { price: true, changePercent: true },
        },
      },
    })

    const withQuotes = stocks
      .filter((s) => s.quotes.length > 0)
      .map((s) => ({
        ticker: s.ticker,
        name: s.name,
        price: Number(s.quotes[0].price),
        changePercent: Number(s.quotes[0].changePercent),
      }))

    const sorted = [...withQuotes].sort((a, b) => b.changePercent - a.changePercent)

    return NextResponse.json({
      gainers: sorted.filter((s) => s.changePercent > 0).slice(0, limit),
      losers: sorted.filter((s) => s.changePercent < 0).slice(-limit).reverse(),
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
