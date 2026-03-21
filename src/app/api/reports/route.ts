import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const market = searchParams.get("market")?.toUpperCase()
  const signal = searchParams.get("signal")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))

  const where: Record<string, unknown> = {}
  if (market === "KR" || market === "US") {
    where.stock = { market }
  }
  if (signal) {
    where.signal = signal
  }

  const [reports, total] = await Promise.all([
    prisma.aiReport.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        verdict: true,
        signal: true,
        reportDate: true,
        createdAt: true,
        stock: {
          select: { ticker: true, name: true, market: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aiReport.count({ where }),
  ])

  return NextResponse.json(
    {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    }
  )
}
