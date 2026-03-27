import { getBaseUrl } from "@/lib/get-base-url"
import { generateSitemaps } from "../sitemap"

export const revalidate = 3600

export async function GET() {
  const BASE_URL = getBaseUrl()
  const sitemaps = await generateSitemaps()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap>
    <loc>${BASE_URL}/sitemap/${s.id}.xml</loc>
  </sitemap>`).join("\n")}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
