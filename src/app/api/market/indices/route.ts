import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const indices = await prisma.marketIndex.findMany({
      orderBy: { symbol: "asc" },
    })

    return NextResponse.json({
      indices: indices.map((idx) => ({
        symbol: idx.symbol,
        name: idx.name,
        value: Number(idx.value),
        change: Number(idx.change),
        changePercent: Number(idx.changePercent),
        updatedAt: idx.updatedAt.toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
