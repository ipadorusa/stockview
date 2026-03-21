import type { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildArticle } from "@/lib/seo"
import { PageContainer } from "@/components/layout/page-container"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { StockDataSnapshot } from "@/lib/ai-report"
import { SIGNAL_LABELS } from "@/lib/ai-report"

export const revalidate = 900

interface Props {
  params: Promise<{ slug: string }>
}

const getReport = cache(async (slug: string) => {
  return prisma.aiReport.findUnique({
    where: { slug },
    include: {
      stock: {
        include: {
          quotes: { take: 1, orderBy: { updatedAt: "desc" } },
        },
      },
    },
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

  const date = report.reportDate.toISOString().slice(0, 10).replace(/-/g, ".")
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

const VERDICT_STYLES: Record<string, { className: string }> = {
  "긍정": { className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "중립": { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "부정": { className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

function formatPrice(price: number, market: string): string {
  if (market === "KR") return price.toLocaleString("ko-KR") + "원"
  return "$" + price.toFixed(2)
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return String(v)
}

function formatMarketCap(v: number | null, market: string): string {
  if (v === null) return "-"
  if (market === "KR") {
    if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(0)}조원`
    if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(0)}억원`
    return `${v.toLocaleString()}원`
  }
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  return `$${v.toLocaleString()}`
}

export default async function ReportDetailPage({ params }: Props) {
  const { slug } = await params
  const report = await getReport(slug)

  if (!report) notFound()

  const quote = report.stock.quotes[0]
  const data = report.dataSnapshot as unknown as StockDataSnapshot
  const date = report.reportDate.toISOString().slice(0, 10).replace(/-/g, ".")
  const signalLabel = SIGNAL_LABELS[report.signal] ?? report.signal
  const verdictStyle = VERDICT_STYLES[report.verdict] ?? VERDICT_STYLES["중립"]
  const market = report.stock.market

  const currentPrice = quote ? Number(quote.price) : null
  const currentChange = quote ? Number(quote.change) : null
  const currentChangePercent = quote ? Number(quote.changePercent) : null
  const currentVolume = quote ? Number(quote.volume) : null
  const currentMarketCap = quote?.marketCap ? Number(quote.marketCap) : null

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
            <p className="text-base font-medium mb-3">&ldquo;{report.summary}&rdquo;</p>
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
          <h2 className="text-base font-semibold mb-3">시세 현황</h2>
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
                {report.content.split("\n\n").map((paragraph, i) => (
                  <p key={i} className={i > 0 ? "mt-3" : ""}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 기술적 지표 */}
        {data.technical && data.technical.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">기술적 지표</h2>
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
                      <span>{n.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 면책조항 */}
        <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground">
          본 리포트는 AI({report.model})가 생성한 참고 자료이며, 투자 권유가 아닙니다.
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
    </PageContainer>
  )
}

function MetricCard({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className={cn("text-sm font-semibold", valueClassName)}>{value}</div>
      </CardContent>
    </Card>
  )
}

function TechnicalCard({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: string
}) {
  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{status}</div>
      </CardContent>
    </Card>
  )
}

function ValuationRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 text-muted-foreground">{label}</td>
      <td className="py-1.5 text-right font-medium">{value}</td>
    </tr>
  )
}
