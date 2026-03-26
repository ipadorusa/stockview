import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { z } from "zod"

const querySchema = z.object({
  market: z.enum(["KR", "US"]).default("KR"),
  perMin: z.coerce.number().optional(),
  perMax: z.coerce.number().optional(),
  pbrMin: z.coerce.number().optional(),
  pbrMax: z.coerce.number().optional(),
  dividendYieldMin: z.coerce.number().optional(),
  roeMin: z.coerce.number().optional(),
  marketCapMin: z.coerce.number().optional(),
  marketCapMax: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const revalidate = 900

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const raw = Object.fromEntries(sp.entries())
  const parsed = querySchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 })
  }

  const { market, perMin, perMax, pbrMin, pbrMax, dividendYieldMin, roeMin, marketCapMin, marketCapMax, page, limit } = parsed.data

  try {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`s."market" = ${market}`,
      Prisma.sql`s."isActive" = true`,
    ]

    if (perMin !== undefined) conditions.push(Prisma.sql`sq."per" >= ${perMin}`)
    if (perMax !== undefined) conditions.push(Prisma.sql`sq."per" <= ${perMax}`)
    if (pbrMin !== undefined) conditions.push(Prisma.sql`sq."pbr" >= ${pbrMin}`)
    if (pbrMax !== undefined) conditions.push(Prisma.sql`sq."pbr" <= ${pbrMax}`)
    if (dividendYieldMin !== undefined) conditions.push(Prisma.sql`sf."dividendYield" >= ${dividendYieldMin}`)
    if (roeMin !== undefined) conditions.push(Prisma.sql`sf."roe" >= ${roeMin}`)
    if (marketCapMin !== undefined) conditions.push(Prisma.sql`sq."marketCap" >= ${BigInt(Math.floor(marketCapMin))}`)
    if (marketCapMax !== undefined) conditions.push(Prisma.sql`sq."marketCap" <= ${BigInt(Math.floor(marketCapMax))}`)

    const where = Prisma.join(conditions, " AND ")
    const offset = (page - 1) * limit

    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Stock" s
      JOIN "StockQuote" sq ON sq."stockId" = s."id"
      LEFT JOIN "StockFundamental" sf ON sf."stockId" = s."id"
      WHERE ${where}`

    const total = Number(countResult[0]?.count ?? 0)

    const stocks = await prisma.$queryRaw<Array<{
      ticker: string
      name: string
      market: string
      sector: string | null
      price: number
      change: number
      changePercent: number
      marketCap: bigint | null
      per: number | null
      pbr: number | null
      dividendYield: number | null
      roe: number | null
      eps: number | null
    }>>`
      SELECT
        s."ticker", s."name", s."market", s."sector",
        sq."price"::float, sq."change"::float, sq."changePercent"::float,
        sq."marketCap", sq."per"::float, sq."pbr"::float,
        sf."dividendYield"::float, sf."roe"::float, sf."eps"::float
      FROM "Stock" s
      JOIN "StockQuote" sq ON sq."stockId" = s."id"
      LEFT JOIN "StockFundamental" sf ON sf."stockId" = s."id"
      WHERE ${where}
      ORDER BY sq."marketCap" DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}`

    const result = stocks.map((row) => ({
      ...row,
      marketCap: row.marketCap ? Number(row.marketCap) : null,
    }))

    return NextResponse.json(
      { stocks: result, market, total, page, limit },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } }
    )
  } catch (e) {
    console.error("Screener fundamental API error:", e)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
