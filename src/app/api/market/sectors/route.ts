import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get("market") ?? "KR"

  try {
    const stocks = await prisma.stock.findMany({
      where: { market: market as "KR" | "US", isActive: true, sector: { not: null } },
      select: {
        sector: true,
        quotes: { select: { changePercent: true } },
      },
    })

    const sectorMap = new Map<string, { total: number; count: number }>()

    for (const s of stocks) {
      if (!s.sector || s.quotes.length === 0) continue
      const cp = Number(s.quotes[0].changePercent)
      const existing = sectorMap.get(s.sector)
      if (existing) {
        existing.total += cp
        existing.count++
      } else {
        sectorMap.set(s.sector, { total: cp, count: 1 })
      }
    }

    const sectors = [...sectorMap.entries()]
      .map(([name, { total, count }]) => ({
        name,
        avgChangePercent: Math.round((total / count) * 100) / 100,
        stockCount: count,
      }))
      .sort((a, b) => b.avgChangePercent - a.avgChangePercent)

    return NextResponse.json({ sectors })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
