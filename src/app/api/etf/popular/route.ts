import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function getTopETFByTradingValue(market: "KR" | "US", take: number) {
  return prisma.$queryRaw<
    {
      ticker: string
      name: string
      market: string
      price: number
      change: number
      changePercent: number
      volume: bigint
      tradingValue: number
      updatedAt: Date
    }[]
  >`
    SELECT
      s."ticker", s."name", s."market"::text,
      sq."price"::float8 AS "price",
      sq."change"::float8 AS "change",
      sq."changePercent"::float8 AS "changePercent",
      sq."volume",
      (sq."volume"::numeric * sq."price")::float8 AS "tradingValue",
      sq."updatedAt"
    FROM "StockQuote" sq
    JOIN "Stock" s ON s."id" = sq."stockId"
    WHERE s."market" = ${market}::"Market"
      AND s."isActive" = true
      AND s."stockType" = 'ETF'::"StockType"
      AND sq."volume" > 0
    ORDER BY (sq."volume"::numeric * sq."price") DESC
    LIMIT ${take}
  `
}

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get("market") ?? "all"
  const take = Math.min(Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 20)), 50)

  try {
    let quotes

    if (market === "all") {
      const [krQuotes, usQuotes] = await Promise.all([
        getTopETFByTradingValue("KR", take),
        getTopETFByTradingValue("US", take),
      ])
      quotes = [...krQuotes, ...usQuotes]
    } else {
      quotes = await getTopETFByTradingValue(market as "KR" | "US", take)
    }

    const results = quotes.map((q) => ({
      ticker: q.ticker,
      name: q.name,
      market: q.market,
      stockType: "ETF",
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      tradingValue: q.tradingValue,
    }))

    const latestUpdatedAt = quotes.length > 0
      ? quotes.reduce((latest, q) => q.updatedAt > latest ? q.updatedAt : latest, quotes[0].updatedAt).toISOString()
      : null

    return NextResponse.json({ results, updatedAt: latestUpdatedAt })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
