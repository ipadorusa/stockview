export const dynamic = "force-dynamic"

import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

const BASE_URL = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://stockview.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stocks, etfs, sectors] = await Promise.all([
    prisma.stock.findMany({
      where: { isActive: true, stockType: "STOCK" },
      select: { ticker: true, updatedAt: true },
    }),
    prisma.stock.findMany({
      where: { isActive: true, stockType: "ETF" },
      select: { ticker: true, updatedAt: true },
    }),
    prisma.stock.groupBy({
      by: ["sector"],
      where: { isActive: true, stockType: "STOCK", sector: { not: null } },
    }),
  ])

  const stockEntries: MetadataRoute.Sitemap = stocks.map((s) => ({
    url: `${BASE_URL}/stock/${s.ticker}`,
    lastModified: s.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }))

  const etfEntries: MetadataRoute.Sitemap = etfs.map((s) => ({
    url: `${BASE_URL}/etf/${s.ticker}`,
    lastModified: s.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }))

  const sectorEntries: MetadataRoute.Sitemap = sectors
    .filter((s): s is typeof s & { sector: string } => s.sector !== null)
    .map((s) => ({
      url: `${BASE_URL}/sectors/${encodeURIComponent(s.sector)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))

  const signalSlugs = ["golden-cross", "rsi-oversold", "volume-surge", "bollinger-bounce", "macd-cross"]
  const screenerSignalEntries: MetadataRoute.Sitemap = signalSlugs.map((slug) => ({
    url: `${BASE_URL}/screener/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }))

  const now = new Date()

  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/market`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/news`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/etf`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/dividends`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/earnings`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/screener`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/sectors`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...stockEntries,
    ...etfEntries,
    ...sectorEntries,
    ...screenerSignalEntries,
  ]
}
