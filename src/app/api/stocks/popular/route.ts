import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get("market") ?? "all"

  try {
    const where = market !== "all" ? { market: market as "KR" | "US", isActive: true } : { isActive: true }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        quotes: {
          select: {
            price: true,
            change: true,
            changePercent: true,
          },
        },
      },
      take: 10,
    })

    const results = stocks
      .filter((s) => s.quotes)
      .map((s) => ({
        ticker: s.ticker,
        name: s.name,
        market: s.market,
        price: Number(s.quotes[0]?.price ?? 0),
        change: Number(s.quotes[0]?.change ?? 0),
        changePercent: Number(s.quotes[0]?.changePercent ?? 0),
      }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
