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

    const earnings = await prisma.earningsEvent.findMany({
      where: { stockId: stock.id },
      orderBy: { reportDate: "desc" },
      take: 12,
    })

    return NextResponse.json({
      earnings: earnings.map((e) => ({
        reportDate: e.reportDate.toISOString().split("T")[0],
        quarter: e.quarter,
        epsEstimate: e.epsEstimate ? Number(e.epsEstimate) : null,
        epsActual: e.epsActual ? Number(e.epsActual) : null,
        revenueEstimate: e.revenueEstimate ? Number(e.revenueEstimate) : null,
        revenueActual: e.revenueActual ? Number(e.revenueActual) : null,
      })),
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
