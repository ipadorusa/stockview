import { prisma } from "@/lib/prisma"

export async function getUpcomingEarnings(market: "KR" | "US", limit = 30) {
  const events = await prisma.earningsEvent.findMany({
    where: {
      stock: { market, isActive: true },
      reportDate: { gte: new Date() },
    },
    orderBy: { reportDate: "asc" },
    take: limit,
    include: {
      stock: { select: { ticker: true, name: true, market: true } },
    },
  })

  return events.map((e) => ({
    ticker: e.stock.ticker,
    name: e.stock.name,
    market: e.stock.market,
    reportDate: e.reportDate.toISOString().split("T")[0],
    quarter: e.quarter,
    epsEstimate: e.epsEstimate ? Number(e.epsEstimate) : null,
    epsActual: e.epsActual ? Number(e.epsActual) : null,
    revenueEstimate: e.revenueEstimate ? Number(e.revenueEstimate) : null,
    revenueActual: e.revenueActual ? Number(e.revenueActual) : null,
  }))
}

export async function getRecentEarningsResults(market: "KR" | "US", limit = 30) {
  const events = await prisma.earningsEvent.findMany({
    where: {
      stock: { market, isActive: true },
      reportDate: { lt: new Date() },
      epsActual: { not: null },
    },
    orderBy: { reportDate: "desc" },
    take: limit,
    include: {
      stock: { select: { ticker: true, name: true, market: true } },
    },
  })

  return events.map((e) => {
    const beat = e.epsEstimate && e.epsActual
      ? Number(e.epsActual) > Number(e.epsEstimate)
        ? "beat"
        : Number(e.epsActual) < Number(e.epsEstimate)
          ? "miss"
          : "meet"
      : null

    return {
      ticker: e.stock.ticker,
      name: e.stock.name,
      market: e.stock.market,
      reportDate: e.reportDate.toISOString().split("T")[0],
      quarter: e.quarter,
      epsEstimate: e.epsEstimate ? Number(e.epsEstimate) : null,
      epsActual: e.epsActual ? Number(e.epsActual) : null,
      revenueEstimate: e.revenueEstimate ? Number(e.revenueEstimate) : null,
      revenueActual: e.revenueActual ? Number(e.revenueActual) : null,
      beat,
    }
  })
}
