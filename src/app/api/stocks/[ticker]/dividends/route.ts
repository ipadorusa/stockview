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

    const dividends = await prisma.dividend.findMany({
      where: { stockId: stock.id },
      orderBy: { exDate: "desc" },
      take: 20,
    })

    return NextResponse.json({
      dividends: dividends.map((d) => ({
        exDate: d.exDate.toISOString().split("T")[0],
        payDate: d.payDate?.toISOString().split("T")[0] ?? null,
        amount: Number(d.amount),
        currency: d.currency,
      })),
    }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
