import { prisma } from "@/lib/prisma"

export async function getUpcomingDividends(market: "KR" | "US", limit = 30) {
  const dividends = await prisma.dividend.findMany({
    where: {
      stock: { market, isActive: true },
      exDate: { gte: new Date() },
    },
    orderBy: { exDate: "asc" },
    take: limit,
    include: {
      stock: { select: { ticker: true, name: true, market: true } },
    },
  })

  return dividends.map((d) => ({
    ticker: d.stock.ticker,
    name: d.stock.name,
    market: d.stock.market,
    exDate: d.exDate.toISOString().split("T")[0],
    payDate: d.payDate?.toISOString().split("T")[0] ?? null,
    amount: Number(d.amount),
    currency: d.currency,
    dividendYield: d.dividendYield ? Number(d.dividendYield) : null,
  }))
}

export async function getHighDividendStocks(market: "KR" | "US", limit = 10) {
  const stocks = await prisma.stock.findMany({
    where: {
      market,
      isActive: true,
      stockType: "STOCK",
      fundamental: { dividendYield: { gt: 0 } },
    },
    include: {
      fundamental: { select: { dividendYield: true } },
      quotes: { take: 1, select: { price: true, changePercent: true } },
    },
    orderBy: { fundamental: { dividendYield: "desc" } },
    take: limit,
  })

  return stocks.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    market: s.market,
    dividendYield: s.fundamental?.dividendYield ? Number(s.fundamental.dividendYield) : 0,
    price: s.quotes[0] ? Number(s.quotes[0].price) : null,
    changePercent: s.quotes[0] ? Number(s.quotes[0].changePercent) : null,
  }))
}

export async function getRecentDividends(market: "KR" | "US", limit = 30) {
  const dividends = await prisma.dividend.findMany({
    where: {
      stock: { market, isActive: true },
      exDate: { lt: new Date() },
    },
    orderBy: { exDate: "desc" },
    take: limit,
    include: {
      stock: { select: { ticker: true, name: true, market: true } },
    },
  })

  return dividends.map((d) => ({
    ticker: d.stock.ticker,
    name: d.stock.name,
    market: d.stock.market,
    exDate: d.exDate.toISOString().split("T")[0],
    payDate: d.payDate?.toISOString().split("T")[0] ?? null,
    amount: Number(d.amount),
    currency: d.currency,
    dividendYield: d.dividendYield ? Number(d.dividendYield) : null,
  }))
}
