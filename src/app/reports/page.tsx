import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"
import { AdDisclaimer } from "@/components/ads/ad-disclaimer"
import { ReportsClient } from "./reports-client"
import { prisma } from "@/lib/prisma"

export const revalidate = 900

const description = "AI가 기술적 시그널을 감지한 종목을 분석합니다. 골든크로스, RSI 반등, MACD 크로스 등 주요 시그널 기반 매일 업데이트되는 종목 분석 리포트."

export const metadata: Metadata = {
  title: "AI 종목 분석 리포트",
  description,
  keywords: ["AI 주식 분석", "종목 리포트", "골든크로스", "기술적 분석", "주식 시그널"],
  openGraph: {
    title: "AI 종목 분석 리포트 - StockView",
    description: "AI가 기술적 시그널을 감지한 종목을 분석합니다.",
  },
  alternates: { canonical: "/reports" },
}

async function getInitialReports() {
  const reports = await prisma.aiReport.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      verdict: true,
      signal: true,
      reportDate: true,
      createdAt: true,
      stock: {
        select: { ticker: true, name: true, market: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return reports.map((r) => ({
    ...r,
    reportDate: r.reportDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }))
}

export default async function ReportsPage() {
  const initialReports = await getInitialReports()

  return (
    <PageContainer>
      <JsonLd data={buildWebPage("AI 종목 분석 리포트", description, "/reports")} />
      <Breadcrumb items={[{ label: "AI 리포트", href: "/reports" }]} />
      <ReportsClient initialReports={initialReports} />
      <p className="text-[11px] text-muted-foreground/60 text-center mt-4 px-4">
        본 리포트는 인공지능(AI)이 자동 생성한 분석 자료입니다 (인공지능기본법 제31조에 따른 고지).
        분석 내용의 정확성을 보장하지 않으며, 오류가 포함될 수 있습니다.
      </p>
      <AdDisclaimer />
    </PageContainer>
  )
}
