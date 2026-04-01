import { prisma } from "@/lib/prisma"
import { getBaseUrl } from "@/lib/get-base-url"

export const revalidate = 3600
export const maxDuration = 30

export async function GET() {
  const BASE_URL = getBaseUrl()

  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const reports = await prisma.aiReport.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${reports.map((r) => `  <url>
    <loc>${BASE_URL}/reports/${r.slug}</loc>
    <lastmod>${r.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n")}
</urlset>`

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("[sitemap-reports] Failed to generate:", error)
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`, {
      headers: { "Content-Type": "application/xml" },
    })
  }
}
