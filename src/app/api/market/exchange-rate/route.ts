import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const rate = await prisma.exchangeRate.findUnique({
      where: { pair: "USD/KRW" },
    })

    if (!rate) {
      return NextResponse.json({ error: "환율 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({
      pair: rate.pair,
      rate: Number(rate.rate),
      change: Number(rate.change),
      changePercent: Number(rate.changePercent),
      updatedAt: rate.updatedAt.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
