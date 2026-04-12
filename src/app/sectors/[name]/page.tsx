import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"
import { getSectorList, getSectorStocks, getSectorSummary } from "@/lib/queries/sectors"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ name: string }>
}

export async function generateStaticParams() {
  try {
    const sectors = await getSectorList()
    return sectors.map((s) => ({ name: encodeURIComponent(s.name) }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  const sectorName = decodeURIComponent(name)
  const title = `${sectorName} 관련주`
  const description = `${sectorName} 섹터 종목 리스트, 시가총액, PER, 배당률 정보를 확인하세요.`

  return {
    title,
    description,
    alternates: { canonical: `/sectors/${encodeURIComponent(sectorName)}` },
    openGraph: { title: `${title} - StockView`, description },
  }
}

export const dynamicParams = true
export const revalidate = 3600

export default async function SectorDetailPage({ params }: Props) {
  const { name } = await params
  const sectorName = decodeURIComponent(name)

  const [stocks, summary] = await Promise.all([
    getSectorStocks(sectorName, "marketCap", 50),
    getSectorSummary(sectorName),
  ])

  return (
    <PageContainer>
      <JsonLd data={buildWebPage(`${sectorName} 관련주`, `${sectorName} 섹터 종목 리스트, 시가총액, PER, 배당률 정보를 확인하세요.`, `/sectors/${encodeURIComponent(sectorName)}`)} />
      <Breadcrumb items={[
        { label: "섹터", href: "/sectors" },
        { label: sectorName, href: `/sectors/${encodeURIComponent(sectorName)}` },
      ]} />

      <h1 className="text-2xl font-bold mb-2">{sectorName} 관련 종목</h1>

      {/* 섹터 요약 */}
      <div className="flex gap-4 text-sm text-muted-foreground mb-6">
        <span>종목 수: {summary.stockCount}개</span>
        {summary.avgPer && <span>평균 PER: {summary.avgPer.toFixed(1)}</span>}
        {summary.avgDividendYield && <span>평균 배당률: {summary.avgDividendYield.toFixed(2)}%</span>}
      </div>

      {stocks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">종목 데이터가 없습니다</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 text-xs text-muted-foreground bg-muted/40 border-b">
            <span>종목</span>
            <span className="text-right w-24">현재가</span>
            <span className="text-right w-16">등락률</span>
            <span className="text-right w-20 hidden sm:block">시가총액</span>
            <span className="text-right w-14 hidden sm:block">PER</span>
          </div>
          {stocks.map((s) => {
            const isUp = (s.changePercent ?? 0) > 0
            const isDown = (s.changePercent ?? 0) < 0
            return (
              <Link
                key={s.ticker}
                href={`/stock/${s.ticker}`}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground font-mono">{s.ticker}</span>
                </div>
                <span className="text-sm font-mono text-right w-24">
                  {s.price ? s.price.toLocaleString() : "-"}
                </span>
                <span className={cn(
                  "text-sm font-mono text-right w-16",
                  isUp && "text-stock-up",
                  isDown && "text-stock-down",
                )}>
                  {s.changePercent != null ? `${isUp ? "+" : ""}${s.changePercent.toFixed(2)}%` : "-"}
                </span>
                <span className="text-xs text-muted-foreground text-right w-20 hidden sm:block">
                  {s.marketCap ? formatMarketCap(s.marketCap) : "-"}
                </span>
                <span className="text-xs text-muted-foreground text-right w-14 hidden sm:block">
                  {s.per ? s.per.toFixed(1) : "-"}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      <AdSlot slot="sector-bottom" format="rectangle" className="my-6" />
    </PageContainer>
  )
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}조`
  if (value >= 1e8) return `${(value / 1e8).toFixed(0)}억`
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`
  return value.toLocaleString()
}
