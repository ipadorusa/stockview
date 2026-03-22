"use client"

import { useState } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { PageContainer } from "@/components/layout/page-container"
import { PriceDisplay } from "@/components/stock/price-display"
import { StockInfoGrid } from "@/components/stock/stock-info-grid"
import { WatchlistButton } from "@/components/stock/watchlist-button"
import { NewsCard } from "@/components/news/news-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import type { StockDetail } from "@/types/stock"
import type { NewsItem } from "@/types/news"
import { useSession } from "next-auth/react"

const StockChart = dynamic(
  () => import("@/components/stock/stock-chart").then((m) => m.StockChart),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-lg" /> }
)
const IndicatorSummary = dynamic(
  () => import("@/components/stock/indicator-summary").then((m) => m.IndicatorSummary),
  { ssr: false }
)
const PeerStocks = dynamic(
  () => import("@/components/stock/peer-stocks").then((m) => m.PeerStocks),
  { ssr: false, loading: () => <Skeleton className="h-32 w-full rounded-lg" /> }
)
const DividendHistory = dynamic(
  () => import("@/components/stock/dividend-history").then((m) => m.DividendHistory),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-lg" /> }
)
const DisclosureList = dynamic(
  () => import("@/components/stock/disclosure-list").then((m) => m.DisclosureList),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-lg" /> }
)
const EarningsCalendar = dynamic(
  () => import("@/components/stock/earnings-calendar").then((m) => m.EarningsCalendar),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-lg" /> }
)

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
  const [descExpanded, setDescExpanded] = useState(false)
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const { data: stock, isLoading } = useQuery<StockDetail>({
    queryKey: ["stock", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}`)
      if (!res.ok) throw new Error("종목을 찾을 수 없습니다")
      return res.json()
    },
    initialData: initialData ?? undefined,
    staleTime: 5 * 60 * 1000,
  })

  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist")
      if (!res.ok) return { watchlist: [] }
      return res.json()
    },
    enabled: !!session,
    staleTime: 60 * 1000,
  })

  const { data: newsData } = useQuery({
    queryKey: ["stock-news", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/news?limit=10`)
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
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
        calculateMACD, calculateBollingerBands, calculateStochastic,
        calculateOBV, calculateATR, detectCandlePatterns,
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

      const opens = chart.data.map((d: { open: number }) => d.open)

      const ma5 = calculateMA(closes, 5)[lastIdx] ?? null
      const ma20 = calculateMA(closes, 20)[lastIdx] ?? null
      const rsi14 = calculateRSI(closes)[lastIdx] ?? null

      // MACD (최소 26+9=35개 필요)
      const macdResult = closes.length >= 35 ? calculateMACD(closes) : null
      const macd = macdResult ? {
        macdLine: macdResult.macdLine[lastIdx],
        signal: macdResult.signal[lastIdx],
        histogram: macdResult.histogram[lastIdx],
      } : null

      // 볼린저 밴드 (최소 20개 필요)
      const bbResult = closes.length >= 20 ? calculateBollingerBands(closes) : null
      const bollingerBands = bbResult ? {
        upper: bbResult.upper[lastIdx],
        middle: bbResult.middle[lastIdx],
        lower: bbResult.lower[lastIdx],
      } : null

      // 스토캐스틱 (최소 14+3=17개 필요)
      const stochResult = closes.length >= 17 ? calculateStochastic(highs, lows, closes) : null
      const stochastic = stochResult ? {
        k: stochResult.k[lastIdx],
        d: stochResult.d[lastIdx],
      } : null

      // OBV
      const obvArr = calculateOBV(closes, volumeNums)
      const obvTrend = obvArr.length >= 5
        ? (obvArr[lastIdx] > obvArr[lastIdx - 5] ? "up" as const : "down" as const)
        : null

      // ATR (최소 15개 필요)
      const atrArr = closes.length >= 15 ? calculateATR(highs, lows, closes) : []
      const atr14 = atrArr.length > 0 ? (atrArr[lastIdx] ?? null) : null

      // 캔들 패턴 (최근 5봉 내 감지)
      const candlePatterns = closes.length >= 3
        ? detectCandlePatterns(opens, highs, lows, closes).filter(p => p.index >= lastIdx - 4)
        : []

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
        macd,
        bollingerBands,
        stochastic,
        obvTrend,
        atr14,
        candlePatterns,
      }
    },
    staleTime: 24 * 60 * 60 * 1000,
  })

  const isWatched = watchlistData?.watchlist?.some((w: { ticker: string }) => w.ticker === ticker) ?? false

  const toggleMutation = useMutation({
    mutationFn: async ({ ticker: t, watched }: { ticker: string; watched: boolean }) => {
      if (watched) {
        await fetch(`/api/watchlist/${t}`, { method: "DELETE" })
      } else {
        await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: t }) })
      }
    },
    onMutate: async ({ ticker: t, watched }) => {
      await queryClient.cancelQueries({ queryKey: ["watchlist"] })
      const previous = queryClient.getQueryData(["watchlist"])
      queryClient.setQueryData(["watchlist"], (old: { watchlist: { ticker: string }[] } | undefined) => {
        if (!old) return old
        if (watched) {
          return { ...old, watchlist: old.watchlist.filter((w) => w.ticker !== t) }
        } else {
          return { ...old, watchlist: [...old.watchlist, { ticker: t }] }
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["watchlist"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] })
    },
  })

  const toggleWatchlist = async (t: string, watched: boolean) => {
    toggleMutation.mutate({ ticker: t, watched })
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
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
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

      {/* 기업 개요 */}
      {stock.fundamental?.description && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-1">기업 개요</h2>
          <p className={`text-sm leading-relaxed text-muted-foreground ${descExpanded ? "" : "line-clamp-3"}`}>
            {stock.fundamental.description}
          </p>
          <button
            onClick={() => setDescExpanded(!descExpanded)}
            className="text-xs text-primary hover:underline mt-1 cursor-pointer"
          >
            {descExpanded ? "접기" : "더 보기"}
          </button>
        </div>
      )}

      {/* 탭 */}
      <Tabs defaultValue="chart">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="chart">차트</TabsTrigger>
          <TabsTrigger value="info" onMouseEnter={() => { void import("@/components/stock/peer-stocks") }}>시세</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          {stock.market === "KR" && <TabsTrigger value="disclosure" onMouseEnter={() => { void import("@/components/stock/disclosure-list") }}>공시</TabsTrigger>}
          <TabsTrigger value="dividend" onMouseEnter={() => { void import("@/components/stock/dividend-history") }}>배당</TabsTrigger>
          <TabsTrigger value="earnings" onMouseEnter={() => { void import("@/components/stock/earnings-calendar") }}>실적</TabsTrigger>
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
                macd={indicatorData.macd}
                bollingerBands={indicatorData.bollingerBands}
                stochastic={indicatorData.stochastic}
                obvTrend={indicatorData.obvTrend}
                atr14={indicatorData.atr14}
                candlePatterns={indicatorData.candlePatterns}
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
                employeeCount: stock.fundamental.employeeCount,
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

        {stock.market === "KR" && (
          <TabsContent value="disclosure">
            <DisclosureList ticker={ticker} />
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
