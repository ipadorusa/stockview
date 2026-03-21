import { prisma } from "@/lib/prisma"

export async function getSectorList() {
  const sectors = await prisma.stock.groupBy({
    by: ["sector"],
    where: { isActive: true, stockType: "STOCK", sector: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  })

  return sectors
    .filter((s): s is typeof s & { sector: string } => s.sector !== null)
    .map((s) => ({
      name: s.sector,
      stockCount: s._count.id,
    }))
}

export async function getSectorStocks(
  sectorName: string,
  _sortBy: "marketCap" | "changePercent" = "marketCap",
  limit = 50
) {
  const stocks = await prisma.stock.findMany({
    where: { sector: sectorName, isActive: true, stockType: "STOCK" },
    include: {
      quotes: { select: { price: true, change: true, changePercent: true, marketCap: true, per: true } },
      fundamental: { select: { dividendYield: true } },
    },
    take: limit,
  })

  const mapped = stocks.map((s) => {
    const q = s.quotes[0]
    return {
      ticker: s.ticker,
      name: s.name,
      market: s.market,
      price: q ? Number(q.price) : null,
      change: q ? Number(q.change) : null,
      changePercent: q ? Number(q.changePercent) : null,
      marketCap: q?.marketCap ? Number(q.marketCap) : null,
      per: q?.per ? Number(q.per) : null,
      dividendYield: s.fundamental?.dividendYield ? Number(s.fundamental.dividendYield) : null,
    }
  })

  return mapped.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
}

export async function getSectorSummary(sectorName: string) {
  const stocks = await prisma.stock.findMany({
    where: { sector: sectorName, isActive: true, stockType: "STOCK" },
    include: {
      quotes: { select: { per: true } },
      fundamental: { select: { dividendYield: true } },
    },
  })

  const pers = stocks
    .map((s) => s.quotes[0]?.per ? Number(s.quotes[0].per) : null)
    .filter((v): v is number => v !== null && v > 0)

  const yields = stocks
    .map((s) => s.fundamental?.dividendYield ? Number(s.fundamental.dividendYield) : null)
    .filter((v): v is number => v !== null && v > 0)

  return {
    stockCount: stocks.length,
    avgPer: pers.length > 0 ? pers.reduce((a, b) => a + b, 0) / pers.length : null,
    avgDividendYield: yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : null,
  }
}
