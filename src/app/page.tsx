import { Suspense } from "react"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { PageContainer } from "@/components/layout/page-container"
import { IndexCard } from "@/components/market/index-card"
import { NewsCard } from "@/components/news/news-card"
import { PopularStocksTabs } from "@/components/market/popular-stocks-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AdSlot } from "@/components/ads/ad-slot"
import Link from "next/link"
import { getMarketIndices, getExchangeRates, getPopularStocks, getLatestNews } from "@/lib/queries"

export const revalidate = 900 // 15분 ISR

const EXCHANGE_RATE_LABELS: Record<string, string> = {
  "USD/KRW": "달러",
  "EUR/KRW": "유로",
  "JPY/KRW": "엔(100)",
  "CNY/KRW": "위안",
}

async function LatestNewsSection() {
  const news = await getLatestNews(4)
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
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-lg" />
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

  return (
    <PageContainer>
      <GtmPageView pageData={{ page_name: "home" }} />
      <h1 className="text-2xl font-bold mb-4">한국/미국 주식 시세</h1>

      {/* 주요 지수 + 환율 그리드 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">주요 지수</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {indices.length > 0 ? (
            indices.map((idx) => (
              <IndexCard
                key={idx.symbol}
                name={idx.name}
                value={idx.value}
                change={idx.change}
                changePercent={idx.changePercent}
              />
            ))
          ) : (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={`idx-sk-${i}`} className="h-24 rounded-xl" />
            ))
          )}
          {exchangeRates.length > 0 ? (
            exchangeRates.map((rate) => (
              <IndexCard
                key={rate.pair}
                name={rate.pair}
                label={EXCHANGE_RATE_LABELS[rate.pair] ?? rate.pair}
                value={rate.rate}
                change={rate.change}
                changePercent={rate.changePercent}
              />
            ))
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`fx-sk-${i}`} className="h-24 rounded-xl" />
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 인기 종목 (거래대금 기준) */}
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

        {/* 최신 뉴스 — Suspense로 스트리밍 */}
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

      <AdSlot slot="home-bottom" format="leaderboard" className="mt-8" />
    </PageContainer>
  )
}
