import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function getTopByVolume(market: "KR" | "US", take: number) {
  return prisma.stockQuote.findMany({
    where: {
      stock: { market, isActive: true },
      volume: { gt: 0 },
    },
    orderBy: { volume: "desc" },
    take,
    select: {
      price: true,
      change: true,
      changePercent: true,
      volume: true,
      marketCap: true,
      stock: { select: { ticker: true, name: true, market: true } },
    },
  })
}

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get("market") ?? "all"

  try {
    let quotes

    if (market === "all") {
      const [krQuotes, usQuotes] = await Promise.all([
        getTopByVolume("KR", 5),
        getTopByVolume("US", 5),
      ])
      quotes = [...krQuotes, ...usQuotes]
    } else {
      quotes = await getTopByVolume(market as "KR" | "US", 10)
    }

    const results = quotes.map((q) => ({
      ticker: q.stock.ticker,
      name: q.stock.name,
      market: q.stock.market,
      price: Number(q.price),
      change: Number(q.change),
      changePercent: Number(q.changePercent),
      volume: q.volume ? Number(q.volume) : undefined,
      marketCap: q.marketCap ? Number(q.marketCap) : undefined,
    }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
