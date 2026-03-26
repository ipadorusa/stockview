import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/board-permissions"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
  }

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    totalStocks,
    activeStocks,
    krStocks,
    usStocks,
    totalNews,
    recentNews,
    dailyPriceCount,
    recentDailyPrices,
    quotesUpdatedToday,
    cronLogs,
  ] = await Promise.all([
    prisma.stock.count(),
    prisma.stock.count({ where: { isActive: true } }),
    prisma.stock.count({ where: { market: "KR", isActive: true } }),
    prisma.stock.count({ where: { market: "US", isActive: true } }),
    prisma.news.count(),
    prisma.news.count({ where: { publishedAt: { gte: oneDayAgo } } }),
    prisma.dailyPrice.count(),
    prisma.dailyPrice.count({ where: { date: { gte: oneDayAgo } } }),
    prisma.stockQuote.count({ where: { updatedAt: { gte: oneDayAgo } } }),
    prisma.cronLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  return NextResponse.json({
    stocks: {
      total: totalStocks,
      active: activeStocks,
      kr: krStocks,
      us: usStocks,
    },
    news: {
      total: totalNews,
      last24h: recentNews,
    },
    dailyPrices: {
      total: dailyPriceCount,
      last24h: recentDailyPrices,
    },
    quotes: {
      updatedLast24h: quotesUpdatedToday,
    },
    cronLogs,
    checkedAt: now.toISOString(),
  })
}
