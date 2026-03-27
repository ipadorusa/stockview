import { getBaseUrl } from "@/lib/get-base-url"

export const revalidate = 3600

export async function GET() {
  const BASE_URL = getBaseUrl()

  const sitemaps = [
    `${BASE_URL}/sitemap.xml`,
    `${BASE_URL}/sitemap-stocks.xml`,
    `${BASE_URL}/sitemap-etf.xml`,
    `${BASE_URL}/sitemap-reports.xml`,
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((loc) => `  <sitemap>
    <loc>${loc}</loc>
  </sitemap>`).join("\n")}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
