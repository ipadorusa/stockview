import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const limit = Math.min(Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 5)), 20)

  try {
    const [gainers, losers] = await Promise.all([
      prisma.stockQuote.findMany({
        where: { stock: { market: "KR", isActive: true }, changePercent: { gt: 0 } },
        orderBy: { changePercent: "desc" },
        take: limit,
        select: {
          price: true, change: true, changePercent: true,
          stock: { select: { ticker: true, name: true } },
        },
      }),
      prisma.stockQuote.findMany({
        where: { stock: { market: "KR", isActive: true }, changePercent: { lt: 0 } },
        orderBy: { changePercent: "asc" },
        take: limit,
        select: {
          price: true, change: true, changePercent: true,
          stock: { select: { ticker: true, name: true } },
        },
      }),
    ])

    return NextResponse.json({
      gainers: gainers.map((q) => ({
        ticker: q.stock.ticker,
        name: q.stock.name,
        price: Number(q.price),
        change: Number(q.change),
        changePercent: Number(q.changePercent),
      })),
      losers: losers.map((q) => ({
        ticker: q.stock.ticker,
        name: q.stock.name,
        price: Number(q.price),
        change: Number(q.change),
        changePercent: Number(q.changePercent),
      })),
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
