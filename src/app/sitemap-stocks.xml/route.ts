import { prisma } from "@/lib/prisma"
import { getBaseUrl } from "@/lib/get-base-url"

export const revalidate = 3600

export async function GET() {
  const BASE_URL = getBaseUrl()

  try {
    const stocks = await prisma.stock.findMany({
      where: { isActive: true, stockType: "STOCK" },
      select: { ticker: true, updatedAt: true },
      orderBy: { ticker: "asc" },
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${stocks.map((s) => `  <url>
    <loc>${BASE_URL}/stock/${s.ticker}</loc>
    <lastmod>${s.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n")}
</urlset>`

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`, {
      headers: { "Content-Type": "application/xml" },
    })
  }
}
