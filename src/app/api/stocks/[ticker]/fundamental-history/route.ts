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
      select: { id: true },
    })

    if (!stock) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })
    }

    const history = await prisma.fundamentalHistory.findMany({
      where: { stockId: stock.id },
      orderBy: { quarter: "asc" },
      take: 20, // max 5 years of quarterly data
    })

    return NextResponse.json({
      history: history.map((h) => ({
        quarter: h.quarter,
        eps: h.eps ? Number(h.eps) : null,
        forwardEps: h.forwardEps ? Number(h.forwardEps) : null,
        dividendYield: h.dividendYield ? Number(h.dividendYield) : null,
        roe: h.roe ? Number(h.roe) : null,
        debtToEquity: h.debtToEquity ? Number(h.debtToEquity) : null,
        beta: h.beta ? Number(h.beta) : null,
        revenue: h.revenue ? Number(h.revenue) : null,
        netIncome: h.netIncome ? Number(h.netIncome) : null,
        operatingIncome: h.operatingIncome ? Number(h.operatingIncome) : null,
      })),
    }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
