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
      updatedAt: true,
      stock: { select: { ticker: true, name: true, market: true } },
    },
  })
}

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get("market") ?? "all"

  const take = Math.min(Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 10)), 50)

  try {
    let quotes

    if (market === "all") {
      const [krQuotes, usQuotes] = await Promise.all([
        getTopByVolume("KR", take),
        getTopByVolume("US", take),
      ])
      quotes = [...krQuotes, ...usQuotes]
    } else {
      quotes = await getTopByVolume(market as "KR" | "US", take)
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

    // 가장 최근 시세 업데이트 시각
    const latestUpdatedAt = quotes.length > 0
      ? quotes.reduce((latest, q) => q.updatedAt > latest ? q.updatedAt : latest, quotes[0].updatedAt).toISOString()
      : null

    return NextResponse.json({ results, updatedAt: latestUpdatedAt })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
