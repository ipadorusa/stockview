import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params

  try {
    const stock = await prisma.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      select: { sector: true, market: true, id: true },
    })

    if (!stock || !stock.sector) {
      return NextResponse.json({ peers: [] })
    }

    const peers = await prisma.stock.findMany({
      where: {
        sector: stock.sector,
        market: stock.market,
        isActive: true,
        id: { not: stock.id },
      },
      include: {
        quotes: {
          take: 1,
          orderBy: { updatedAt: "desc" },
          select: { price: true, changePercent: true, marketCap: true },
        },
      },
      take: 10,
    })

    const peersWithQuotes = peers
      .filter((p) => p.quotes.length > 0)
      .map((p) => ({
        ticker: p.ticker,
        name: p.name,
        price: Number(p.quotes[0].price),
        changePercent: Number(p.quotes[0].changePercent),
        marketCap: p.quotes[0].marketCap ? Number(p.quotes[0].marketCap) : null,
      }))
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))

    return NextResponse.json({ sector: stock.sector, peers: peersWithQuotes }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
