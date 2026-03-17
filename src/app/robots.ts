import type { MetadataRoute } from "next"

const BASE_URL = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://stockview.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/settings/", "/watchlist/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
