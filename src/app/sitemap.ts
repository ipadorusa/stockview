import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

const BASE_URL = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://stockview.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: { ticker: true, updatedAt: true },
  })

  const stockEntries: MetadataRoute.Sitemap = stocks.map((s) => ({
    url: `${BASE_URL}/stock/${s.ticker}`,
    lastModified: s.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }))

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/market`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    ...stockEntries,
  ]
}
