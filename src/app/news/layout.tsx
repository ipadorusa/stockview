import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "뉴스 - StockView",
  description: "한국/미국 주식시장 뉴스, 산업/경제 뉴스를 확인하세요",
  openGraph: {
    title: "뉴스 - StockView",
    description: "한국/미국 주식시장 뉴스, 산업/경제 뉴스를 확인하세요",
  },
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children
}
