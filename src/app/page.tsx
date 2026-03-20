import { Suspense } from "react"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { PageContainer } from "@/components/layout/page-container"
import { IndexCard } from "@/components/market/index-card"
import { NewsCard } from "@/components/news/news-card"
import { ExchangeRateBadge } from "@/components/common/exchange-rate-badge"
import { PopularStocksTabs } from "@/components/market/popular-stocks-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { getMarketIndices, getExchangeRate, getPopularStocks, getLatestNews } from "@/lib/queries"

export const revalidate = 900 // 15분 ISR

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
  const [indices, exchangeRate, krPopular, usPopular] = await Promise.all([
    getMarketIndices(),
    getExchangeRate(),
    getPopularStocks("KR", 10),
    getPopularStocks("US", 10),
  ])

  return (
    <PageContainer>
      <GtmPageView pageData={{ page_name: "home" }} />
      {/* 환율 */}
      {exchangeRate && (
        <div className="mb-4">
          <ExchangeRateBadge
            rate={exchangeRate.rate}
            change={exchangeRate.change}
            changePercent={exchangeRate.changePercent}
          />
        </div>
      )}

      {/* 지수 그리드 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">주요 지수</h2>
        {indices.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {indices.map((idx) => (
              <IndexCard
                key={idx.symbol}
                name={idx.name}
                value={idx.value}
                change={idx.change}
                changePercent={idx.changePercent}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}
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
    </PageContainer>
  )
}
