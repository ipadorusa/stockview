import type { Metadata } from "next"
import { Suspense } from "react"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"
import { IndexCard } from "@/components/market/index-card"
import { NewsCard } from "@/components/news/news-card"
import { PopularStocksTabs } from "@/components/market/popular-stocks-tabs"
import { IndexSparkline } from "@/components/market/index-sparkline"
import { Skeleton } from "@/components/ui/skeleton"
import { AdSlot } from "@/components/ads/ad-slot"
import { TickerTape } from "@/components/home/ticker-tape"
import { ExchangeRateWidget } from "@/components/home/exchange-rate-widget"
import { QuickActions } from "@/components/home/quick-actions"
import Link from "next/link"
import { getMarketIndices, getExchangeRates, getPopularStocks, getLatestNews } from "@/lib/queries"

export const metadata: Metadata = {
  title: "StockView - 한국/미국 주식 분석 서비스",
  description: "초보 투자자를 위한 한국/미국 주식 분석 서비스. 실시간 시세, 기술적 차트, 뉴스, AI 리포트를 한눈에.",
  openGraph: {
    title: "StockView - 한국/미국 주식 분석 서비스",
    description: "초보 투자자를 위한 한국/미국 주식 분석 서비스. 실시간 시세, 차트, 뉴스를 한눈에.",
  },
}

export const revalidate = 900 // 15분 ISR

const KR_SYMBOLS = new Set(["KOSPI", "KOSDAQ"])
const US_SYMBOLS = new Set(["SPX", "IXIC"])

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
  const mm = String(kst.getMonth() + 1).padStart(2, "0")
  const dd = String(kst.getDate()).padStart(2, "0")
  const hh = String(kst.getHours()).padStart(2, "0")
  const mi = String(kst.getMinutes()).padStart(2, "0")
  return `${mm}.${dd} ${hh}:${mi} 기준`
}

async function LatestNewsSection() {
  const news = await getLatestNews(6)
  return (
    <div className="flex flex-col gap-3">
      {news.length > 0 ? (
        news.map((item) => (
          <NewsCard key={item.id} news={item} variant="compact" />
        ))
      ) : (
        <div className="p-8 text-center text-sm text-muted-foreground border rounded-lg">뉴스가 없습니다</div>
      )}
    </div>
  )
}

function NewsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}

export default async function HomePage() {
  const [indices, exchangeRates, krPopular, usPopular] = await Promise.all([
    getMarketIndices(),
    getExchangeRates(),
    getPopularStocks("KR", 10),
    getPopularStocks("US", 10),
  ])

  const kr = indices.filter((idx) => KR_SYMBOLS.has(idx.symbol))
  const us = indices.filter((idx) => US_SYMBOLS.has(idx.symbol))
  const usdRate = exchangeRates.find((r) => r.pair === "USD/KRW")

  // 티커 테이프용 — 지수만
  const tickerIndices = indices.map((idx) => ({
    symbol: idx.symbol,
    name: idx.name,
    value: idx.value,
    change: idx.change,
    changePercent: idx.changePercent,
  }))

  return (
    <>
      {/* 티커 테이프 — PageContainer 밖, 전폭 */}
      {indices.length > 0 && (
        <TickerTape
          indices={tickerIndices}
          exchangeRate={usdRate ? { rate: usdRate.rate, change: usdRate.change, changePercent: usdRate.changePercent } : undefined}
        />
      )}

      <PageContainer>
        <JsonLd data={buildWebPage("StockView - 주식 분석 서비스", "초보 투자자를 위한 한국/미국 주식 분석 서비스", "/")} />
        <GtmPageView pageData={{ page_name: "home" }} />

        {/* 주요 지수 — 4등분 그리드 */}
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold">주요 지수</h2>
            <Link href="/market" className="text-sm text-primary hover:underline">전체 보기</Link>
          </div>

          {indices.length > 0 ? (
            <>
              <div className="flex items-center gap-4 text-xs text-[var(--fg-tertiary)] mb-2">
                {kr.length > 0 && <span>🇰🇷 {formatDateTime(kr[0].updatedAt)}</span>}
                {us.length > 0 && <span>🇺🇸 {formatDateTime(us[0].updatedAt)}</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...kr, ...us].map((idx) => (
                  <IndexCard
                    key={idx.symbol}
                    name={idx.name}
                    value={idx.value}
                    change={idx.change}
                    changePercent={idx.changePercent}
                    sparkline={<IndexSparkline symbol={idx.symbol} />}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`idx-sk-${i}`} className="h-28 rounded-xl" />
              ))}
            </div>
          )}
        </section>

        {/* 메인 대시보드 그리드: 좌(인기종목+뉴스) / 우(마켓 펄스) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측 2칼럼 영역 */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* 인기 종목 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">인기 종목</h2>
                <Link href="/market" className="text-sm text-primary hover:underline">전체 보기</Link>
              </div>
              <PopularStocksTabs
                krStocks={krPopular.results}
                usStocks={usPopular.results}
                krUpdatedAt={krPopular.updatedAt}
                usUpdatedAt={usPopular.updatedAt}
              />
            </section>

            {/* 최신 뉴스 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">최신 뉴스</h2>
                <Link href="/news" className="text-sm text-primary hover:underline">전체 보기</Link>
              </div>
              <Suspense fallback={<NewsSkeleton />}>
                <LatestNewsSection />
              </Suspense>
            </section>
          </div>

          {/* 우측 마켓 펄스 */}
          <div className="flex flex-col gap-6">
            {/* 환율 위젯 */}
            {exchangeRates.length > 0 && (
              <section>
                <div className="flex items-baseline gap-2 mb-3">
                  <h2 className="text-lg font-semibold">환율</h2>
                  {exchangeRates[0]?.updatedAt && (
                    <span className="text-xs text-muted-foreground">{formatDateTime(exchangeRates[0].updatedAt)}</span>
                  )}
                </div>
                <ExchangeRateWidget rates={exchangeRates} />
              </section>
            )}

            {/* 퀵 액션 */}
            <section>
              <h2 className="text-lg font-semibold mb-3">바로가기</h2>
              <QuickActions />
            </section>
          </div>
        </div>

        <AdSlot slot="home-bottom" format="leaderboard" className="mt-8" />
      </PageContainer>
    </>
  )
}
