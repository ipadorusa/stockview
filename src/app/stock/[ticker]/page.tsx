"use client"

import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/page-container"
import { PriceDisplay } from "@/components/stock/price-display"
import { StockInfoGrid } from "@/components/stock/stock-info-grid"
import { WatchlistButton } from "@/components/stock/watchlist-button"
import { NewsCard } from "@/components/news/news-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { StockChart } from "@/components/stock/stock-chart"
import type { StockDetail } from "@/types/stock"
import type { NewsItem } from "@/types/news"

export default function StockDetailPage() {
  const params = useParams()
  const ticker = params.ticker as string
  const queryClient = useQueryClient()

  const { data: stock, isLoading } = useQuery<StockDetail>({
    queryKey: ["stock", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}`)
      if (!res.ok) throw new Error("종목을 찾을 수 없습니다")
      return res.json()
    },
  })

  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist")
      if (!res.ok) return { watchlist: [] }
      return res.json()
    },
  })

  const { data: newsData } = useQuery({
    queryKey: ["stock-news", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/news?limit=5`)
      return res.json()
    },
  })

  const isWatched = watchlistData?.watchlist?.some((w: { ticker: string }) => w.ticker === ticker) ?? false

  const toggleWatchlist = async (t: string, watched: boolean) => {
    if (watched) {
      await fetch(`/api/watchlist/${t}`, { method: "DELETE" })
    } else {
      await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: t }) })
    }
    queryClient.invalidateQueries({ queryKey: ["watchlist"] })
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-12 w-64 mb-2" />
        <Skeleton className="h-6 w-40 mb-6" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    )
  }

  if (!stock) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-muted-foreground">종목을 찾을 수 없습니다.</p>
        </div>
      </PageContainer>
    )
  }

  const currency = stock.market === "KR" ? "KRW" : "USD"

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{stock.name}</h1>
            <Badge variant="outline" className="font-mono">{stock.ticker}</Badge>
            <Badge variant="secondary">{stock.exchange}</Badge>
          </div>
          {stock.sector && <p className="text-sm text-muted-foreground">{stock.sector}</p>}
        </div>
        <WatchlistButton ticker={ticker} isWatched={isWatched} onToggle={toggleWatchlist} />
      </div>

      {/* 가격 */}
      {stock.quote && (
        <div className="mb-8">
          <PriceDisplay
            price={stock.quote.price}
            change={stock.quote.change}
            changePercent={stock.quote.changePercent}
            currency={currency}
            preMarketPrice={stock.quote.preMarketPrice}
            postMarketPrice={stock.quote.postMarketPrice}
          />
          <p className="text-xs text-muted-foreground mt-2">
            업데이트: {new Date(stock.quote.updatedAt).toLocaleString("ko-KR")}
          </p>
        </div>
      )}

      {/* 탭 */}
      <Tabs defaultValue="chart">
        <TabsList className="mb-4">
          <TabsTrigger value="chart">차트</TabsTrigger>
          <TabsTrigger value="info">시세</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <StockChart ticker={ticker} />
        </TabsContent>

        <TabsContent value="info">
          {stock.quote && (
            <StockInfoGrid
              data={{
                open: stock.quote.open,
                high: stock.quote.high,
                low: stock.quote.low,
                volume: stock.quote.volume,
                high52w: stock.quote.high52w,
                low52w: stock.quote.low52w,
                marketCap: stock.quote.marketCap,
                per: stock.quote.per,
                pbr: stock.quote.pbr,
              }}
              currency={currency}
            />
          )}
        </TabsContent>

        <TabsContent value="news">
          <div className="flex flex-col divide-y">
            {newsData?.news?.length > 0 ? (
              newsData.news.map((item: NewsItem) => (
                <NewsCard key={item.id} news={item} variant="minimal" />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">관련 뉴스가 없습니다</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
