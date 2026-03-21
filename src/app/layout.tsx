import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AppHeader } from "@/components/layout/app-header"
import { BottomTabBar } from "@/components/layout/bottom-tab-bar"
import { GoogleTagManagerScript, GoogleTagManagerNoscript } from "@/components/analytics/gtm"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { JsonLd } from "@/components/seo/json-ld"
import { buildOrganization, buildWebSite } from "@/lib/seo"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

const BASE_URL = process.env.APP_URL ?? "https://stockview.app"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: "./" },
  title: {
    default: "StockView - 주식 분석 서비스",
    template: "%s | StockView",
  },
  description: "초보 투자자를 위한 한국/미국 주식 분석 서비스. 실시간 시세, 차트, 뉴스를 한눈에.",
  applicationName: "StockView",
  authors: [{ name: "StockView" }],
  keywords: ["주식", "시세", "차트", "ETF", "미국주식", "한국주식", "코스피", "코스닥", "S&P500"],
  openGraph: {
    title: "StockView - 주식 분석 서비스",
    description: "초보 투자자를 위한 한국/미국 주식 분석 서비스. 실시간 시세, 차트, 뉴스를 한눈에.",
    type: "website",
    locale: "ko_KR",
    siteName: "StockView",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "StockView" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StockView - 주식 분석 서비스",
    description: "초보 투자자를 위한 한국/미국 주식 분석 서비스",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <GoogleTagManagerScript />
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleTagManagerNoscript />
        <JsonLd data={buildOrganization()} />
        <JsonLd data={buildWebSite()} />
        <Providers>
          <AppHeader />
          <div className="pb-14 md:pb-0">
            {children}
          </div>
          <BottomTabBar />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
