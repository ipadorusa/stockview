import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.yahoo.com" },
      { protocol: "https", hostname: "*.naver.com" },
      { protocol: "https", hostname: "*.naver.net" },
      { protocol: "https", hostname: "*.navercorp.com" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    optimizePackageImports: ["lucide-react", "sonner"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://*.google.com https://*.doubleclick.net https://pagead2.googlesyndication.com https://*.naver.net https://*.yahoo.com",
              "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
              "connect-src 'self' https://pagead2.googlesyndication.com https://www.google-analytics.com https://*.doubleclick.net",
              "font-src 'self' data:",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
