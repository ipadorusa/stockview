import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "종목 비교",
  description: "두 종목의 주요 지표(PER, PBR, 배당률, ROE 등)를 나란히 비교해 보세요.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "종목 비교 - StockView",
    description: "두 종목의 주요 지표를 나란히 비교해 보세요.",
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
