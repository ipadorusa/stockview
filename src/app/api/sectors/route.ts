import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const revalidate = 3600

const querySchema = z.object({
  market: z.enum(["KR", "US"]).default("KR"),
})

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    market: req.nextUrl.searchParams.get("market") ?? "KR",
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { market } = parsed.data

  const sectors = await prisma.sector.findMany({
    where: { market },
    select: {
      id: true,
      name: true,
      market: true,
      _count: { select: { stocks: { where: { isActive: true } } } },
    },
    orderBy: { name: "asc" },
  })

  const data = sectors.map((s) => ({
    id: s.id,
    name: s.name,
    market: s.market,
    stockCount: s._count.stocks,
  }))

  return NextResponse.json(
    { market, count: data.length, data },
    {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    }
  )
}
