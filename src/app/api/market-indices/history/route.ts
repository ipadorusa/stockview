import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const revalidate = 900

const querySchema = z.object({
  symbol: z.string().min(1),
  days: z.coerce.number().int().min(1).max(365).default(30),
})

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    symbol: req.nextUrl.searchParams.get("symbol"),
    days: req.nextUrl.searchParams.get("days") ?? 30,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { symbol, days } = parsed.data

  const since = new Date()
  since.setDate(since.getDate() - days)

  const history = await prisma.marketIndexHistory.findMany({
    where: {
      symbol,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      open: true,
      high: true,
      low: true,
      close: true,
      change: true,
      changePercent: true,
      volume: true,
    },
  })

  return NextResponse.json(
    { symbol, days, count: history.length, data: history },
    {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    }
  )
}
