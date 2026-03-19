/**
 * Shared data-access layer for server-side queries.
 * Used by both API routes and Server Components to avoid self-fetch anti-pattern.
 */
import { prisma } from "@/lib/prisma"

export async function getMarketIndices() {
  const indices = await prisma.marketIndex.findMany({
    orderBy: { symbol: "asc" },
  })

  return indices.map((idx) => ({
    symbol: idx.symbol,
    name: idx.name,
    value: Number(idx.value),
    change: Number(idx.change),
    changePercent: Number(idx.changePercent),
    updatedAt: idx.updatedAt.toISOString(),
  }))
}

export async function getExchangeRate() {
  const rate = await prisma.exchangeRate.findUnique({
    where: { pair: "USD/KRW" },
  })

  if (!rate) return null

  return {
    pair: rate.pair,
    rate: Number(rate.rate),
    change: Number(rate.change),
    changePercent: Number(rate.changePercent),
    updatedAt: rate.updatedAt.toISOString(),
  }
}

export async function getPopularStocks(market: "KR" | "US", limit: number = 10) {
  const quotes = await prisma.$queryRaw<
    {
      ticker: string
      name: string
      market: string
      stockType: string
      price: number
      change: number
      changePercent: number
      volume: bigint
      marketCap: bigint | null
      tradingValue: number
      updatedAt: Date
    }[]
  >`
    SELECT
      s."ticker", s."name", s."market"::text, s."stockType"::text AS "stockType",
      sq."price"::float8 AS "price",
      sq."change"::float8 AS "change",
      sq."changePercent"::float8 AS "changePercent",
      sq."volume",
      sq."marketCap",
      (sq."volume"::numeric * sq."price")::float8 AS "tradingValue",
      sq."updatedAt"
    FROM "StockQuote" sq
    JOIN "Stock" s ON s."id" = sq."stockId"
    WHERE s."market" = ${market}::"Market"
      AND s."isActive" = true
      AND s."stockType" = 'STOCK'::"StockType"
      AND sq."volume" > 0
    ORDER BY (sq."volume"::numeric * sq."price") DESC
    LIMIT ${limit}
  `

  const results = quotes.map((q) => ({
    ticker: q.ticker,
    name: q.name,
    market: q.market as "KR" | "US",
    stockType: q.stockType,
    price: q.price,
    change: q.change,
    changePercent: q.changePercent,
    tradingValue: q.tradingValue,
    marketCap: q.marketCap ? Number(q.marketCap) : undefined,
  }))

  const updatedAt = quotes.length > 0
    ? quotes.reduce((latest, q) => q.updatedAt > latest ? q.updatedAt : latest, quotes[0].updatedAt).toISOString()
    : null

  return { results, updatedAt }
}

export async function getPopularETFs(market: "KR" | "US", limit: number = 20) {
  const quotes = await prisma.$queryRaw<
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
    LIMIT ${limit}
  `

  const results = quotes.map((q) => ({
    ticker: q.ticker,
    name: q.name,
    market: q.market as "KR" | "US",
    stockType: "ETF" as const,
    price: q.price,
    change: q.change,
    changePercent: q.changePercent,
    tradingValue: q.tradingValue,
  }))

  const updatedAt = quotes.length > 0
    ? quotes.reduce((latest, q) => q.updatedAt > latest ? q.updatedAt : latest, quotes[0].updatedAt).toISOString()
    : null

  return { results, updatedAt }
}

export async function getLatestNews(limit: number = 5) {
  const news = await prisma.news.findMany({
    orderBy: { publishedAt: "desc" },
    take: limit,
  })

  return news.map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary ?? undefined,
    source: n.source,
    imageUrl: n.imageUrl ?? undefined,
    category: n.category,
    publishedAt: n.publishedAt.toISOString(),
    url: n.url,
  }))
}

export async function getMarketMovers(market: "KR" | "US", limit: number = 5) {
  const [gainers, losers] = await Promise.all([
    prisma.stockQuote.findMany({
      where: { stock: { market, isActive: true }, changePercent: { gt: 0 } },
      orderBy: { changePercent: "desc" },
      take: limit,
      select: {
        price: true, change: true, changePercent: true,
        stock: { select: { ticker: true, name: true } },
      },
    }),
    prisma.stockQuote.findMany({
      where: { stock: { market, isActive: true }, changePercent: { lt: 0 } },
      orderBy: { changePercent: "asc" },
      take: limit,
      select: {
        price: true, change: true, changePercent: true,
        stock: { select: { ticker: true, name: true } },
      },
    }),
  ])

  const mapQuote = (q: typeof gainers[number]) => ({
    ticker: q.stock.ticker,
    name: q.stock.name,
    price: Number(q.price),
    change: Number(q.change),
    changePercent: Number(q.changePercent),
  })

  return { gainers: gainers.map(mapQuote), losers: losers.map(mapQuote) }
}
