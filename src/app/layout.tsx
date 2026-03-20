import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AppHeader } from "@/components/layout/app-header"
import { BottomTabBar } from "@/components/layout/bottom-tab-bar"
import { GoogleTagManagerScript, GoogleTagManagerNoscript } from "@/components/analytics/gtm"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: "StockView - 주식 분석 서비스",
    template: "%s | StockView",
  },
  description: "초보 투자자를 위한 한국/미국 주식 분석 서비스. 실시간 시세, 차트, 뉴스를 한눈에.",
  openGraph: {
    title: "StockView - 주식 분석 서비스",
    description: "초보 투자자를 위한 한국/미국 주식 분석 서비스. 실시간 시세, 차트, 뉴스를 한눈에.",
    type: "website",
    locale: "ko_KR",
    siteName: "StockView",
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
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleTagManagerNoscript />
        <Providers>
          <AppHeader />
          <div className="pb-14 md:pb-0">
            {children}
          </div>
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  )
}
