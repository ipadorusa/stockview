import type { MetadataRoute } from "next"
import { getBaseUrl } from "@/lib/get-base-url"

const BASE_URL = getBaseUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/settings/", "/watchlist/", "/admin/", "/mypage/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap-index.xml`,
  }
}
