import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { getBaseUrl } from "@/lib/get-base-url"

export const revalidate = 3600
export const maxDuration = 30

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = getBaseUrl()
  const today = new Date()
  const staticDate = new Date("2025-01-01T00:00:00Z")

  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: today, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/market`, lastModified: today, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/news`, lastModified: today, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/etf`, lastModified: today, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/dividends`, lastModified: today, changeFrequency: "daily", priority: 0.8 },
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
        take: 500,
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
