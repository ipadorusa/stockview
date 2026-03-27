export const revalidate = 3600
export const maxDuration = 30

import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { getBaseUrl } from "@/lib/get-base-url"

const URLS_PER_SITEMAP = 1000

export async function generateSitemaps() {
  try {
    const [stockCount, etfCount, reportCount, sectorCount] = await Promise.all([
      prisma.stock.count({ where: { isActive: true, stockType: "STOCK" } }),
      prisma.stock.count({ where: { isActive: true, stockType: "ETF" } }),
      prisma.aiReport.count({
        where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.stock.groupBy({
        by: ["sector"],
        where: { isActive: true, stockType: "STOCK", sector: { not: null } },
      }).then((s) => s.length),
    ])

    // id=0: static pages + sectors
    // id=1~N: stocks (1000 per sitemap)
    // id=N+1~M: ETFs (1000 per sitemap)
    // id=M+1~: AI reports (1000 per sitemap)
    const stockSitemaps = Math.ceil(stockCount / URLS_PER_SITEMAP)
    const etfSitemaps = Math.ceil(etfCount / URLS_PER_SITEMAP)
    const reportSitemaps = Math.ceil(reportCount / URLS_PER_SITEMAP)

    const total = 1 + stockSitemaps + etfSitemaps + reportSitemaps
    return Array.from({ length: total }, (_, i) => ({ id: i }))
  } catch {
    return [{ id: 0 }]
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = getBaseUrl()
  const today = new Date()
  const staticDate = new Date("2025-01-01T00:00:00Z")

  // id=0: static pages + sectors
  if (id === 0) {
    const staticEntries: MetadataRoute.Sitemap = [
      { url: BASE_URL, lastModified: today, changeFrequency: "hourly", priority: 1 },
      { url: `${BASE_URL}/market`, lastModified: today, changeFrequency: "hourly", priority: 0.9 },
      { url: `${BASE_URL}/news`, lastModified: today, changeFrequency: "hourly", priority: 0.8 },
      { url: `${BASE_URL}/etf`, lastModified: today, changeFrequency: "daily", priority: 0.8 },
      { url: `${BASE_URL}/dividends`, lastModified: today, changeFrequency: "daily", priority: 0.8 },
      { url: `${BASE_URL}/earnings`, lastModified: today, changeFrequency: "daily", priority: 0.8 },
      { url: `${BASE_URL}/screener`, lastModified: today, changeFrequency: "daily", priority: 0.7 },
      { url: `${BASE_URL}/sectors`, lastModified: today, changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/compare`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/privacy`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.3 },
      { url: `${BASE_URL}/terms`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.3 },
      { url: `${BASE_URL}/about`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.4 },
      { url: `${BASE_URL}/guide`, lastModified: staticDate, changeFrequency: "weekly", priority: 0.6 },
      { url: `${BASE_URL}/guide/technical-indicators`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/guide/dividend-investing`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/guide/etf-basics`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/guide/reading-financials`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/guide/market-indices`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/contact`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.4 },
      { url: `${BASE_URL}/board`, lastModified: today, changeFrequency: "daily", priority: 0.6 },
      { url: `${BASE_URL}/reports`, lastModified: today, changeFrequency: "daily", priority: 0.7 },
      ...["golden-cross", "rsi-oversold", "volume-surge", "bollinger-bounce", "macd-cross"].map((slug) => ({
        url: `${BASE_URL}/screener/${slug}`,
        lastModified: today,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ]

    try {
      const [sectors, boardPosts] = await Promise.all([
        prisma.stock.groupBy({
          by: ["sector"],
          where: { isActive: true, stockType: "STOCK", sector: { not: null } },
        }),
        prisma.boardPost.findMany({
          where: { isPrivate: false },
          select: { id: true, updatedAt: true },
          orderBy: { createdAt: "desc" },
          take: URLS_PER_SITEMAP,
        }),
      ])

      return [
        ...staticEntries,
        ...sectors
          .filter((s): s is typeof s & { sector: string } => s.sector !== null)
          .map((s) => ({
            url: `${BASE_URL}/sectors/${encodeURIComponent(s.sector)}`,
            lastModified: today,
            changeFrequency: "weekly" as const,
            priority: 0.6,
          })),
        ...boardPosts.map((p) => ({
          url: `${BASE_URL}/board/${p.id}`,
          lastModified: p.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.5,
        })),
      ]
    } catch {
      return staticEntries
    }
  }

  // Dynamic sitemaps: determine which segment this id belongs to
  try {
    const stockCount = await prisma.stock.count({ where: { isActive: true, stockType: "STOCK" } })
    const stockSitemaps = Math.ceil(stockCount / URLS_PER_SITEMAP)

    const etfCount = await prisma.stock.count({ where: { isActive: true, stockType: "ETF" } })
    const etfSitemaps = Math.ceil(etfCount / URLS_PER_SITEMAP)

    if (id <= stockSitemaps) {
      // Stock sitemaps: id 1 ~ stockSitemaps
      const page = id - 1
      const stocks = await prisma.stock.findMany({
        where: { isActive: true, stockType: "STOCK" },
        select: { ticker: true, updatedAt: true },
        orderBy: { ticker: "asc" },
        skip: page * URLS_PER_SITEMAP,
        take: URLS_PER_SITEMAP,
      })
      return stocks.map((s) => ({
        url: `${BASE_URL}/stock/${s.ticker}`,
        lastModified: s.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }))
    }

    if (id <= stockSitemaps + etfSitemaps) {
      // ETF sitemaps
      const page = id - stockSitemaps - 1
      const etfs = await prisma.stock.findMany({
        where: { isActive: true, stockType: "ETF" },
        select: { ticker: true, updatedAt: true },
        orderBy: { ticker: "asc" },
        skip: page * URLS_PER_SITEMAP,
        take: URLS_PER_SITEMAP,
      })
      return etfs.map((s) => ({
        url: `${BASE_URL}/etf/${s.ticker}`,
        lastModified: s.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      }))
    }

    // AI Report sitemaps
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const page = id - stockSitemaps - etfSitemaps - 1
    const reports = await prisma.aiReport.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      skip: page * URLS_PER_SITEMAP,
      take: URLS_PER_SITEMAP,
    })
    return reports.map((r) => ({
      url: `${BASE_URL}/reports/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  } catch {
    return []
  }
}
