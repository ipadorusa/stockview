import type { Metadata } from "next"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { PageContainer } from "@/components/layout/page-container"
import { IndexCard } from "@/components/market/index-card"
import { ExchangeRateBadge } from "@/components/common/exchange-rate-badge"
import { MarketFilterChips } from "@/components/market/market-filter-chips"
import { SectorHeatmap } from "@/components/market/sector-heatmap"
import { MarketBreadthBar } from "@/components/market/market-breadth-bar"
import { MomentumBars } from "@/components/market/momentum-bars"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"
import {
  getMarketIndices,
  getExchangeRate,
  getMarketMovers,
  getSectorPerformance,
  getMarketBreadth,
  getTopMovers,
} from "@/lib/queries"

export const revalidate = 900 // 15분 ISR

export const metadata: Metadata = {
  title: "시장 개요",
  description: "한국/미국 주식시장 지수, 상승/하락 종목, 환율 정보를 한눈에 확인하세요",
  alternates: { canonical: "/market" },
  openGraph: {
    title: "시장 개요 - StockView",
    description: "한국/미국 주식시장 지수, 상승/하락 종목, 환율 정보를 한눈에 확인하세요",
  },
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
  const mm = String(kst.getMonth() + 1).padStart(2, "0")
  const dd = String(kst.getDate()).padStart(2, "0")
  const hh = String(kst.getHours()).padStart(2, "0")
  const mi = String(kst.getMinutes()).padStart(2, "0")
  return `${mm}.${dd} ${hh}:${mi} 기준`
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>
}) {
  const params = await searchParams
  const activeMarket: "KR" | "US" =
    params.market?.toUpperCase() === "US" ? "US" : "KR"

  const [
    indices,
    exchangeRate,
    krMovers,
    usMovers,
    krSectors,
    usSectors,
    krBreadth,
    usBreadth,
    krTopMovers,
    usTopMovers,
  ] = await Promise.all([
    getMarketIndices(),
    getExchangeRate(),
    getMarketMovers("KR"),
    getMarketMovers("US"),
    getSectorPerformance("KR"),
    getSectorPerformance("US"),
    getMarketBreadth("KR"),
    getMarketBreadth("US"),
    getTopMovers("KR", 10),
    getTopMovers("US", 10),
  ])

  // KOSPI, KOSDAQ, S&P 500(SPX), NASDAQ(IXIC) 순으로 정렬
  const orderedSymbols = ["KOSPI", "KOSDAQ", "SPX", "IXIC"]
  const allIndices = orderedSymbols
    .map((sym) => indices.find((i) => i.symbol === sym))
    .filter(Boolean) as typeof indices

  const latestUpdatedAt = allIndices.length > 0
    ? allIndices.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b)).updatedAt
    : null

  const sectors = activeMarket === "KR" ? krSectors : usSectors
  const breadth = activeMarket === "KR" ? krBreadth : usBreadth
  const topMovers = activeMarket === "KR" ? krTopMovers : usTopMovers

  return (
    <PageContainer>
      <JsonLd data={buildWebPage("시장 현황", "한국/미국 주식시장 지수, 상승/하락 종목, 환율 정보를 한눈에 확인하세요.", "/market")} />
      <GtmPageView pageData={{ page_name: "market" }} />
      <Breadcrumb items={[{ label: "시장 개요", href: "/market" }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">시장 개요</h1>
        {exchangeRate && (
          <ExchangeRateBadge rate={exchangeRate.rate} change={exchangeRate.change} changePercent={exchangeRate.changePercent} />
        )}
      </div>

      {/* 4열 지수 Overview (KR + US 동시) */}
      <section className="mb-8">
        {latestUpdatedAt && (
          <p className="text-xs text-muted-foreground mb-2">{formatDateTime(latestUpdatedAt)}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allIndices.map((idx) => (
            <IndexCard key={idx.symbol} name={idx.name} value={idx.value} change={idx.change} changePercent={idx.changePercent} variant="expanded" />
          ))}
        </div>
      </section>

      {/* 섹터 히트맵 */}
      {sectors.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--fg-primary)]">
              섹터 현황
            </h2>
            <MarketTabLinks activeMarket={activeMarket} />
          </div>
          <SectorHeatmap sectors={sectors} />
        </section>
      )}

      {/* 시장 너비 */}
      {breadth.total > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--fg-primary)] mb-3">
            시장 너비
          </h2>
          <div className="card-default p-4 rounded-xl">
            <MarketBreadthBar
              advancing={breadth.advancing}
              declining={breadth.declining}
              flat={breadth.flat}
              limitUp={breadth.limitUp}
              limitDown={breadth.limitDown}
              total={breadth.total}
            />
          </div>
        </section>
      )}

      {/* 모멘텀 바 (상승/하락 TOP 10) */}
      {(topMovers.gainers.length > 0 || topMovers.losers.length > 0) && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--fg-primary)] mb-3">
            모멘텀 순위
          </h2>
          <div className="card-default p-4 rounded-xl">
            <MomentumBars
              gainers={topMovers.gainers}
              losers={topMovers.losers}
            />
          </div>
        </section>
      )}

      {/* 필터 칩 + 동적 콘텐츠 (기존 유지) */}
      <section className="mb-8">
        <MarketFilterChips krMovers={krMovers} usMovers={usMovers} />
      </section>

      <AdSlot slot="market-bottom" format="leaderboard" className="mt-8" />
    </PageContainer>
  )
}

function MarketTabLinks({ activeMarket }: { activeMarket: "KR" | "US" }) {
  return (
    <div className="flex gap-1 text-xs">
      <a
        href="/market?market=kr"
        className={`px-3 py-1 rounded-full font-medium transition-colors ${
          activeMarket === "KR"
            ? "bg-primary text-primary-foreground"
            : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
        }`}
      >
        한국
      </a>
      <a
        href="/market?market=us"
        className={`px-3 py-1 rounded-full font-medium transition-colors ${
          activeMarket === "US"
            ? "bg-primary text-primary-foreground"
            : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
        }`}
      >
        미국
      </a>
    </div>
  )
}
