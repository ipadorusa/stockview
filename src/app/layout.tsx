import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AppHeader } from "@/components/layout/app-header"
import { BottomTabBar } from "@/components/layout/bottom-tab-bar"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StockView - 주식 분석 서비스",
  description: "초보 투자자를 위한 한국/미국 주식 분석 서비스",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
