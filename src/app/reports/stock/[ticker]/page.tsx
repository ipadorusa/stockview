import type { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { PageContainer } from "@/components/layout/page-container"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { SIGNAL_LABELS, VERDICT_STYLES } from "@/lib/ai-report"

export const revalidate = 900

interface Props {
  params: Promise<{ ticker: string }>
}

const getStockWithReports = cache(async (ticker: string) => {
  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { id: true, name: true, ticker: true, market: true },
  })
  if (!stock) return null

  const reports = await prisma.aiReport.findMany({
    where: { stockId: stock.id },
    select: {
      slug: true,
      signal: true,
      verdict: true,
      summary: true,
      reportDate: true,
    },
    orderBy: { reportDate: "desc" },
  })

  return { stock, reports }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params
  const result = await getStockWithReports(ticker)

  if (!result) {
    return { title: "종목을 찾을 수 없습니다" }
  }

  return {
    title: `${result.stock.name} AI 분석 리포트 히스토리`,
    description: `${result.stock.name}(${result.stock.ticker})의 AI 분석 리포트 ${result.reports.length}건을 확인하세요.`,
    alternates: { canonical: `/reports/stock/${result.stock.ticker}` },
  }
}

export default async function StockReportsPage({ params }: Props) {
  const { ticker } = await params
  const result = await getStockWithReports(ticker)

  if (!result) notFound()

  const { stock, reports } = result

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "AI 리포트", href: "/reports" },
          { label: `${stock.name} 리포트`, href: `/reports/stock/${stock.ticker}` },
        ]}
      />

      <div className="space-y-6 mt-2">
        {/* 헤더 */}
        <header>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {stock.market}
            </Badge>
            <span className="text-sm text-muted-foreground">{stock.ticker}</span>
          </div>
          <h1 className="text-xl font-bold">{stock.name} AI 분석 리포트</h1>
          <p className="text-sm text-muted-foreground mt-1">
            총 {reports.length}건의 분석 리포트
          </p>
        </header>

        {/* 판정 타임라인 */}
        {reports.length > 1 && (
          <Card>
            <CardContent className="pt-4">
              <h2 className="text-sm font-medium mb-3">판정 변화</h2>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {[...reports].reverse().map((r, i) => {
                  const rDate = r.reportDate.toISOString().slice(0, 10)
                  const dotColor =
                    r.verdict === "긍정"
                      ? "bg-green-500"
                      : r.verdict === "부정"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                  return (
                    <Link
                      key={r.slug}
                      href={`/reports/${r.slug}`}
                      className="flex flex-col items-center gap-1 min-w-[3.5rem] group"
                      title={`${rDate} · ${r.verdict}`}
                    >
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full transition-transform group-hover:scale-125",
                          dotColor
                        )}
                      />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {rDate.slice(5)}
                      </span>
                      {i < reports.length - 1 && (
                        <div className="absolute" />
                      )}
                    </Link>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> 긍정
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> 중립
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> 부정
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 리포트 리스트 */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
              아직 생성된 리포트가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">날짜</th>
                    <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">시그널</th>
                    <th className="px-3 py-2 text-left font-medium">의견</th>
                    <th className="px-3 py-2 text-left font-medium hidden md:table-cell">요약</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map((r) => {
                    const rDate = r.reportDate.toISOString().slice(0, 10).replace(/-/g, ".")
                    const rVerdict = VERDICT_STYLES[r.verdict] ?? VERDICT_STYLES["중립"]
                    return (
                      <tr key={r.slug} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/reports/${r.slug}`}
                            className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                          >
                            {rDate}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell">
                          <Badge variant="secondary" className="text-xs">
                            {SIGNAL_LABELS[r.signal] ?? r.signal}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge className={cn("text-xs", rVerdict.className)}>
                            {rVerdict.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground max-w-xs truncate">
                          <Link
                            href={`/reports/${r.slug}`}
                            className="hover:text-foreground transition-colors"
                          >
                            {r.summary}
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 하단 링크 */}
        <div className="flex items-center gap-3">
          <Link
            href={`/stock/${stock.ticker}`}
            className="text-sm text-primary hover:underline"
          >
            종목 상세 보기 →
          </Link>
          <Link
            href="/reports"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← AI 리포트 목록
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
