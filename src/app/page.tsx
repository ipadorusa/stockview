export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { PageContainer } from "@/components/layout/page-container"
import { IndexCard } from "@/components/market/index-card"
import { StockRow } from "@/components/market/stock-row"
import { NewsCard } from "@/components/news/news-card"
import { ExchangeRateBadge } from "@/components/common/exchange-rate-badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

async function getIndices() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/market/indices`, { next: { revalidate: 900 } })
    if (!res.ok) return { indices: [] }
    return res.json()
  } catch { return { indices: [] } }
}

async function getExchangeRate() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/market/exchange-rate`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

async function getPopularStocks() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/stocks/popular?market=all`, { next: { revalidate: 900 } })
    if (!res.ok) return { results: [] }
    return res.json()
  } catch { return { results: [] } }
}

async function getLatestNews() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/news/latest?limit=4`, { next: { revalidate: 1800 } })
    if (!res.ok) return { news: [] }
    return res.json()
  } catch { return { news: [] } }
}

export default async function HomePage() {
  const [indicesData, exchangeRate, popularData, newsData] = await Promise.all([
    getIndices(),
    getExchangeRate(),
    getPopularStocks(),
    getLatestNews(),
  ])

  return (
    <PageContainer>
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
        {indicesData.indices.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {indicesData.indices.map((idx: { symbol: string; name: string; value: number; change: number; changePercent: number }) => (
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
        {/* 인기 종목 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">인기 종목</h2>
            <Link href="/market" className="text-sm text-primary hover:underline">전체 보기</Link>
          </div>
          <div className="divide-y rounded-lg border overflow-hidden">
            {popularData.results.length > 0 ? (
              popularData.results.map((stock: { ticker: string; name: string; price: number; change: number; changePercent: number; market: "KR" | "US"; volume?: number; marketCap?: number }, i: number) => (
                <StockRow
                  key={stock.ticker}
                  ticker={stock.ticker}
                  name={stock.name}
                  price={stock.price}
                  change={stock.change}
                  changePercent={stock.changePercent}
                  market={stock.market}
                  rank={i + 1}
                  volume={stock.volume}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
            )}
          </div>
        </section>

        {/* 최신 뉴스 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">최신 뉴스</h2>
            <Link href="/news" className="text-sm text-primary hover:underline">전체 보기</Link>
          </div>
          <div className="flex flex-col gap-3">
            {newsData.news.length > 0 ? (
              newsData.news.map((item: { id: string; title: string; summary?: string; source: string; imageUrl?: string; category: "KR_MARKET" | "US_MARKET" | "INDUSTRY" | "ECONOMY"; publishedAt: string; url: string }) => (
                <NewsCard key={item.id} news={item} variant="compact" />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground border rounded-lg">뉴스가 없습니다</div>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
