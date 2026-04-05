import type { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildArticle } from "@/lib/seo"
import { PageContainer } from "@/components/layout/page-container"
import { AdDisclaimer } from "@/components/ads/ad-disclaimer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type StockDataSnapshot, stripReportHeaders, getKSTDateString } from "@/lib/ai-report"
import { SIGNAL_LABELS, VERDICT_STYLES } from "@/lib/ai-report"
import { formatPrice, formatVolume, formatMarketCap } from "@/lib/format"
import { MetricCard, TechnicalCard, ValuationRow } from "@/components/report/report-cards"

export const revalidate = 900

interface Props {
  params: Promise<{ slug: string }>
}

const getReport = cache(async (slug: string) => {
  return prisma.aiReport.findUnique({
    where: { slug },
    include: { stock: true },
  })
})

export async function generateStaticParams() {
  const reports = await prisma.aiReport.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    select: { slug: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return reports.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const report = await getReport(slug)

  if (!report) {
    return { title: "리포트를 찾을 수 없습니다" }
  }

  const date = getKSTDateString(report.reportDate).replace(/-/g, ".")
  const signalName = SIGNAL_LABELS[report.signal] ?? report.signal

  return {
    title: `${report.stock.name} AI 분석 - ${signalName} (${date})`,
    description: report.summary,
    openGraph: {
      title: `${report.stock.name} AI 분석 리포트 - StockView`,
      description: report.summary,
      type: "article",
      publishedTime: report.createdAt.toISOString(),
      modifiedTime: report.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary",
      title: `${report.stock.name} AI 분석 - ${signalName}`,
      description: report.summary,
    },
    alternates: { canonical: `/reports/${report.slug}` },
  }
}

function isStockDataSnapshot(v: unknown): v is StockDataSnapshot {
  if (!v || typeof v !== "object") return false
  const obj = v as Record<string, unknown>
  return "stock" in obj && "prices" in obj && Array.isArray(obj.prices)
}

export default async function ReportDetailPage({ params }: Props) {
  const { slug } = await params
  const [report, session] = await Promise.all([getReport(slug), auth()])

  if (!report) notFound()

  // 같은 종목의 다른 리포트 조회
  const isLoggedIn = !!session?.user
  const [otherReports, totalOtherReports] = await Promise.all([
    prisma.aiReport.findMany({
      where: { stockId: report.stockId, id: { not: report.id } },
      select: { slug: true, signal: true, verdict: true, reportDate: true, summary: true },
      orderBy: { reportDate: "desc" },
      take: isLoggedIn ? 5 : 2,
    }),
    prisma.aiReport.count({
      where: { stockId: report.stockId, id: { not: report.id } },
    }),
  ])

  const rawSnapshot = report.dataSnapshot
  const data = isStockDataSnapshot(rawSnapshot) ? rawSnapshot : null
  if (!data) notFound()
  const date = getKSTDateString(report.reportDate).replace(/-/g, ".")
  const signalLabel = SIGNAL_LABELS[report.signal] ?? report.signal
  const verdictStyle = VERDICT_STYLES[report.verdict] ?? VERDICT_STYLES["중립"]
  const market = report.stock.market

  const snapshotQuote = data?.quote ?? null
  const currentPrice = snapshotQuote?.price ?? null
  const currentChange = snapshotQuote?.change ?? null
  const currentChangePercent = snapshotQuote?.changePercent ?? null
  const currentVolume = snapshotQuote?.volume ?? null
  const currentMarketCap = snapshotQuote?.marketCap ?? null

  return (
    <PageContainer>
      <JsonLd
        data={buildArticle(
          report.title,
          report.summary,
          `/reports/${report.slug}`,
          report.createdAt.toISOString(),
          report.updatedAt.toISOString(),
          report.stock.name
        )}
      />
      <Breadcrumb
        items={[
          { label: "AI 리포트", href: "/reports" },
          { label: `${report.stock.name} 분석 (${date})`, href: `/reports/${report.slug}` },
        ]}
      />

      <article className="space-y-6 mt-2">
        {/* 리포트 헤더 */}
        <header>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <time dateTime={report.reportDate.toISOString()}>{date}</time>
            <span>·</span>
            <span>{report.stock.ticker}</span>
          </div>
          <h1 className="text-xl font-bold mb-2">
            {report.stock.name} AI 분석 리포트
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{signalLabel}</Badge>
            <Badge className={cn(verdictStyle.className)} aria-label={`투자의견: ${report.verdict}`}>
              {report.verdict}
            </Badge>
          </div>
        </header>

        {/* 핵심 요약 카드 */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-base font-medium mb-3">&ldquo;{stripReportHeaders(report.summary)}&rdquo;</p>
            <div className="flex items-center gap-4 text-sm">
              {currentPrice !== null && (
                <span className="font-semibold">
                  {formatPrice(currentPrice, market)}
                </span>
              )}
              {currentChangePercent !== null && (
                <span
                  className={cn(
                    "font-medium",
                    currentChangePercent > 0 && "text-stock-up",
                    currentChangePercent < 0 && "text-stock-down"
                  )}
                >
                  {currentChange !== null && currentChange >= 0 ? "+" : ""}
                  {currentChangePercent}%
                </span>
              )}
              <span className="text-muted-foreground">
                투자의견: <strong>{report.verdict}</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 시세 현황 */}
        <section>
          <h2 className="text-base font-semibold mb-3">시세 현황 ({date} 기준)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="현재가" value={currentPrice !== null ? formatPrice(currentPrice, market) : "-"} />
            <MetricCard
              label="등락률"
              value={currentChangePercent !== null ? `${currentChangePercent >= 0 ? "+" : ""}${currentChangePercent}%` : "-"}
              valueClassName={cn(
                currentChangePercent !== null && currentChangePercent > 0 && "text-stock-up",
                currentChangePercent !== null && currentChangePercent < 0 && "text-stock-down"
              )}
            />
            <MetricCard label="거래량" value={currentVolume !== null ? formatVolume(currentVolume) : "-"} />
            <MetricCard label="시가총액" value={formatMarketCap(currentMarketCap, market)} />
          </div>
        </section>

        {/* AI 분석 본문 */}
        <section>
          <h2 className="text-base font-semibold mb-3">AI 분석</h2>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm leading-relaxed">
                {stripReportHeaders(report.content).split("\n\n").map((paragraph, i) => (
                  <p key={i} className={i > 0 ? "mt-3" : ""}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 이 종목의 다른 리포트 */}
        {otherReports.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">
              {report.stock.name} 분석 기록
            </h2>
            <Card className="border-l-2 border-l-primary/40">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {otherReports.map((r) => {
                    const rDate = getKSTDateString(r.reportDate).replace(/-/g, ".")
                    const rVerdict = VERDICT_STYLES[r.verdict] ?? VERDICT_STYLES["중립"]
                    return (
                      <Link
                        key={r.slug}
                        href={`/reports/${r.slug}`}
                        className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded hover:bg-muted/50 transition-colors text-sm"
                      >
                        <span className="text-muted-foreground shrink-0 w-16">{rDate}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {SIGNAL_LABELS[r.signal] ?? r.signal}
                        </Badge>
                        <Badge className={cn("text-xs shrink-0", rVerdict.className)}>
                          {rVerdict.label}
                        </Badge>
                        <span className="text-muted-foreground truncate hidden sm:inline">
                          {r.summary}
                        </span>
                      </Link>
                    )
                  })}
                </div>
                {!isLoggedIn && totalOtherReports > 2 && (
                  <div className="mt-3 pt-3 border-t text-center">
                    <Link
                      href="/auth/login"
                      className="text-sm text-primary hover:underline"
                    >
                      로그인하면 {totalOtherReports}건의 분석을 모두 확인할 수 있습니다
                    </Link>
                  </div>
                )}
                {isLoggedIn && totalOtherReports > 5 && (
                  <div className="mt-3 pt-3 border-t text-center">
                    <Link
                      href={`/reports/stock/${report.stock.ticker}`}
                      className="text-sm text-primary hover:underline"
                    >
                      전체 리포트 보기 ({totalOtherReports}건) →
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* 기술적 지표 */}
        {data.technical && data.technical.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">기술적 지표 ({data.technical[0].date} 기준)</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <TechnicalCard
                label="RSI"
                value={data.technical[0].rsi14 !== null ? String(data.technical[0].rsi14) : "-"}
                status={
                  data.technical[0].rsi14 !== null
                    ? data.technical[0].rsi14 > 70 ? "과매수" : data.technical[0].rsi14 < 30 ? "과매도" : "중립"
                    : "-"
                }
              />
              <TechnicalCard
                label="MACD"
                value={data.technical[0].macdLine !== null ? String(data.technical[0].macdLine) : "-"}
                status={
                  data.technical[0].macdHistogram !== null
                    ? data.technical[0].macdHistogram > 0 ? "양전환" : "음전환"
                    : "-"
                }
              />
              <TechnicalCard
                label="볼린저밴드"
                value={data.technical[0].bbMiddle !== null ? String(Math.round(data.technical[0].bbMiddle)) : "-"}
                status={
                  data.technical[0].bbUpper !== null && data.technical[0].bbLower !== null && data.quote?.price
                    ? (() => {
                        const price = data.quote.price
                        if (price >= data.technical[0].bbUpper!) return "상단 근처"
                        if (price <= data.technical[0].bbLower!) return "하단 근처"
                        return "중심 근처"
                      })()
                    : "-"
                }
              />
            </div>
          </section>
        )}

        {/* 밸류에이션 */}
        {data.fundamental && (
          <section>
            <h2 className="text-base font-semibold mb-3">밸류에이션</h2>
            <Card>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1.5 font-medium">지표</th>
                        <th className="text-right py-1.5 font-medium">값</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.quote?.per !== null && data.quote?.per !== undefined && (
                        <ValuationRow label="PER" value={`${data.quote.per}배`} />
                      )}
                      {data.quote?.pbr !== null && data.quote?.pbr !== undefined && (
                        <ValuationRow label="PBR" value={`${data.quote.pbr}배`} />
                      )}
                      {data.fundamental.roe !== null && (
                        <ValuationRow label="ROE" value={`${(data.fundamental.roe * 100).toFixed(1)}%`} />
                      )}
                      {data.fundamental.debtToEquity !== null && (
                        <ValuationRow label="부채비율" value={`${data.fundamental.debtToEquity}%`} />
                      )}
                      {data.fundamental.dividendYield !== null && (
                        <ValuationRow label="배당수익률" value={`${(data.fundamental.dividendYield * 100).toFixed(1)}%`} />
                      )}
                      {data.fundamental.beta !== null && (
                        <ValuationRow label="베타" value={String(data.fundamental.beta)} />
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 관련 뉴스 */}
        {data.news && data.news.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">관련 뉴스</h2>
            <Card>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {data.news.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className={cn(
                          "mt-0.5 shrink-0",
                          n.sentiment === "positive" && "text-green-500",
                          n.sentiment === "negative" && "text-red-500",
                          (!n.sentiment || n.sentiment === "neutral") && "text-yellow-500"
                        )}
                      >
                        {n.sentiment === "positive" ? "🟢" : n.sentiment === "negative" ? "🔴" : "🟡"}
                      </span>
                      {n.url ? (
                        <a href={n.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                          {n.title}
                        </a>
                      ) : (
                        <span>{n.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 면책조항 */}
        <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground">
          본 리포트는 인공지능({report.model})이 자동 생성한 분석 자료입니다 (인공지능기본법 제31조에 따른 고지).
          분석 내용의 정확성을 보장하지 않으며, 투자 권유가 아닙니다.
          실제 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
        </div>

        {/* 하단 링크 */}
        <div className="flex items-center gap-3">
          <Link
            href={`/stock/${report.stock.ticker}`}
            className="text-sm text-primary hover:underline"
          >
            종목 상세 보기 →
          </Link>
          <Link
            href="/reports"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 목록으로
          </Link>
        </div>
      </article>
      <AdDisclaimer />
    </PageContainer>
  )
}

