import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const periodDays: Record<string, number> = {
  "1W": 7,
  "2W": 14,
  "3W": 21,
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params
  const period = req.nextUrl.searchParams.get("period") ?? "3W"
  const days = periodDays[period] ?? 21

  try {
    const stock = await prisma.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
    })

    if (!stock) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })
    }

    const since = new Date()
    since.setDate(since.getDate() - days)

    const prices = await prisma.dailyPrice.findMany({
      where: { stockId: stock.id, date: { gte: since } },
      orderBy: { date: "asc" },
    })

    return NextResponse.json({
      ticker: stock.ticker,
      period,
      data: prices.map((p) => ({
        time: p.date.toISOString().split("T")[0],
        open: Number(p.open),
        high: Number(p.high),
        low: Number(p.low),
        close: Number(p.close),
        volume: Number(p.volume),
      })),
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
