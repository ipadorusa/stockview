import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"

export const metadata: Metadata = {
  title: "투자 가이드",
  description: "주식 투자 초보자를 위한 기술적 지표, 배당 투자, 차트 분석 가이드. RSI, MACD, 골든크로스 등 핵심 지표를 알기 쉽게 설명합니다.",
  openGraph: {
    title: "투자 가이드 - StockView",
    description: "주식 투자 초보자를 위한 기술적 지표, 배당 투자, 차트 분석 가이드.",
  },
}

const guides = [
  {
    title: "기술적 지표 완전 가이드",
    description: "RSI, MACD, 볼린저밴드, 골든크로스 등 주요 기술적 지표의 원리와 활용법을 알기 쉽게 설명합니다.",
    href: "/guide/technical-indicators",
    linkText: "스크리너에서 바로 활용 →",
    featureHref: "/screener",
  },
  {
    title: "배당 투자 시작하기",
    description: "배당수익률 계산법, 배당주 선별 기준, 배당 캘린더 활용법까지. 안정적인 배당 수익을 위한 기초 가이드.",
    href: "/guide/dividend-investing",
    linkText: "배당 캘린더 확인 →",
    featureHref: "/dividends",
  },
]

export default function GuidePage() {
  return (
    <PageContainer>
      <JsonLd data={buildWebPage("투자 가이드", "주식 투자 초보자를 위한 기술적 지표, 배당 투자 가이드", "/guide")} />
      <h1 className="text-2xl font-bold mb-2">투자 가이드</h1>
      <p className="text-muted-foreground mb-8">주식 투자에 필요한 핵심 개념을 알기 쉽게 정리했습니다.</p>

      <div className="grid gap-6 md:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="group block rounded-lg border p-6 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              {guide.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{guide.description}</p>
            <span className="text-sm text-primary font-medium">{guide.linkText}</span>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
