"use client"

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
import { PeerStocks } from "@/components/stock/peer-stocks"
import { IndicatorSummary } from "@/components/stock/indicator-summary"
import { DividendHistory } from "@/components/stock/dividend-history"
import { EarningsCalendar } from "@/components/stock/earnings-calendar"
import { ExternalLink } from "lucide-react"
import type { StockDetail } from "@/types/stock"
import type { NewsItem } from "@/types/news"

function getRealtimeUrl(ticker: string, market: string, exchange?: string) {
  if (market === "KR") {
    return `https://finance.naver.com/item/main.naver?code=${ticker}`
  }
  return `https://finance.yahoo.com/quote/${ticker}`
}

interface Props {
  ticker: string
  initialData?: StockDetail | null
}

export function StockDetailClient({ ticker, initialData }: Props) {
  const queryClient = useQueryClient()

  const { data: stock, isLoading } = useQuery<StockDetail>({
    queryKey: ["stock", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}`)
      if (!res.ok) throw new Error("종목을 찾을 수 없습니다")
      return res.json()
    },
    initialData: initialData ?? undefined,
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
      const res = await fetch(`/api/stocks/${ticker}/news?limit=10`)
      return res.json()
    },
  })

  // 기술적 지표 (최신 1건)
  const { data: indicatorData } = useQuery({
    queryKey: ["indicators", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/chart?period=3M`)
      if (!res.ok) return null
      const chart = await res.json()
      if (!chart?.data?.length) return null
      // 클라이언트에서 계산 (API에 별도 엔드포인트 추가 없이)
      const {
        calculateMA, calculateRSI, calculateAvgVolume,
        calculateMFI, calculateADX, calculateParabolicSAR,
        calculateHeikinAshi, interpretHeikinAshi, generateCompositeSignal,
      } = await import("@/lib/utils/technical-indicators")
      const closes = chart.data.map((d: { close: number }) => d.close)
      const highs = chart.data.map((d: { high: number }) => d.high)
      const lows = chart.data.map((d: { low: number }) => d.low)
      const volumes = chart.data.map((d: { volume: number }) => BigInt(d.volume))
      const volumeNums = chart.data.map((d: { volume: number }) => d.volume)
      const lastIdx = closes.length - 1

      // MFI (14일, 최소 15개 필요)
      const mfiArr = closes.length >= 15
        ? calculateMFI(highs, lows, closes, volumeNums)
        : []
      const mfi14 = mfiArr.length > 0 ? (mfiArr[lastIdx] ?? null) : null

      // ADX (14일, 최소 28개 필요)
      const adxArr = closes.length >= 28
        ? calculateADX(highs, lows, closes)
        : []
      const adx14 = adxArr.length > 0 ? (adxArr[lastIdx]?.adx ?? null) : null

      // Parabolic SAR
      const sarArr = closes.length >= 2
        ? calculateParabolicSAR(highs, lows)
        : []
      const sarLast = sarArr.length > 0 ? sarArr[sarArr.length - 1] : null
      const sarIsUpTrend = sarLast ? sarLast.isUpTrend : null

      // 하이킨아시 추세 분석
      const haData = calculateHeikinAshi(chart.data.map((d: { open: number; high: number; low: number; close: number }) => ({
        open: d.open, high: d.high, low: d.low, close: d.close,
      })))
      const haSignal = haData.length >= 2 ? interpretHeikinAshi(haData) : null

      const ma5 = calculateMA(closes, 5)[lastIdx] ?? null
      const ma20 = calculateMA(closes, 20)[lastIdx] ?? null
      const rsi14 = calculateRSI(closes)[lastIdx] ?? null

      const compositeSignal = haSignal
        ? generateCompositeSignal({ haSignal, rsi14, ma5, ma20, adx14 })
        : null

      return {
        ma5,
        ma20,
        ma60: calculateMA(closes, 60)[lastIdx],
        rsi14,
        avgVolume20: calculateAvgVolume(volumes)[lastIdx],
        mfi14,
        adx14,
        sarIsUpTrend,
        haSignal,
        compositeSignal,
      }
    },
    staleTime: 24 * 60 * 60 * 1000,
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
          {stock.sector && (
            <p className="text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs mr-1">{stock.sector}</Badge>
            </p>
          )}
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
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-muted-foreground">
              업데이트: {new Date(stock.quote.updatedAt).toLocaleString("ko-KR")}
            </p>
            <a
              href={getRealtimeUrl(ticker, stock.market, stock.exchange)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              실시간 시세 <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* 탭 */}
      <Tabs defaultValue="chart">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="chart">차트</TabsTrigger>
          <TabsTrigger value="info">시세</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          {stock.fundamental?.description && <TabsTrigger value="about">기업정보</TabsTrigger>}
          <TabsTrigger value="dividend">배당</TabsTrigger>
          <TabsTrigger value="earnings">실적</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <StockChart ticker={ticker} />
          {/* 기술적 지표 요약 */}
          {indicatorData && stock.quote && (
            <div className="mt-6">
              <IndicatorSummary
                ma5={indicatorData.ma5}
                ma20={indicatorData.ma20}
                ma60={indicatorData.ma60}
                rsi14={indicatorData.rsi14}
                avgVolume20={indicatorData.avgVolume20 != null ? Number(indicatorData.avgVolume20) : null}
                currentPrice={stock.quote.price}
                currentVolume={stock.quote.volume}
                currency={currency}
                mfi14={indicatorData.mfi14}
                adx14={indicatorData.adx14}
                sarIsUpTrend={indicatorData.sarIsUpTrend}
                haSignal={indicatorData.haSignal}
                compositeSignal={indicatorData.compositeSignal}
              />
            </div>
          )}
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
              fundamental={stock.fundamental ? {
                eps: stock.fundamental.eps,
                dividendYield: stock.fundamental.dividendYield,
                roe: stock.fundamental.roe,
                debtToEquity: stock.fundamental.debtToEquity,
                beta: stock.fundamental.beta,
                revenue: stock.fundamental.revenue,
                netIncome: stock.fundamental.netIncome,
              } : null}
              currency={currency}
              stockType={stock.stockType}
            />
          )}
          {/* 동종 종목 */}
          <div className="mt-6">
            <PeerStocks ticker={ticker} market={stock.market} />
          </div>
        </TabsContent>

        <TabsContent value="news">
          <div className="flex flex-col divide-y">
            {newsData?.news?.length > 0 ? (
              newsData.news.map((item: NewsItem) => (
                <NewsCard key={item.id} news={item} variant="minimal" />
              ))
            ) : (
              <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-sm">관련 뉴스가 없습니다</p>
                <p className="text-xs">뉴스는 매일 자동으로 수집됩니다</p>
              </div>
            )}
          </div>
        </TabsContent>

        {stock.fundamental?.description && (
          <TabsContent value="about">
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2">기업 개요</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{stock.fundamental.description}</p>
              </div>
              {stock.fundamental.employeeCount && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <span className="text-xs text-muted-foreground">직원수</span>
                  <p className="font-mono font-medium text-sm mt-0.5">
                    {stock.fundamental.employeeCount.toLocaleString()}명
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        <TabsContent value="dividend">
          <DividendHistory ticker={ticker} />
        </TabsContent>

        <TabsContent value="earnings">
          <EarningsCalendar ticker={ticker} market={stock.market as "KR" | "US"} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
