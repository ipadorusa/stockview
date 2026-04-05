import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  market: z.enum(["KR", "US"]).optional(),
  signal: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = querySchema.safeParse({
    market: searchParams.get("market")?.toUpperCase() || undefined,
    signal: searchParams.get("signal") || undefined,
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 파라미터입니다." }, { status: 400 })
  }

  const { market, signal, page, limit } = parsed.data

  const where: Prisma.AiReportWhereInput = {}
  if (market) {
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
