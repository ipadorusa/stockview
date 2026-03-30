"use client"

import { useState, useTransition, type ReactNode } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/page-container"
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { PriceDisplay } from "@/components/stock/price-display"
import { WatchlistButton } from "@/components/stock/watchlist-button"
import { StockSidebar } from "@/components/stock/stock-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, FileText, Sparkles } from "lucide-react"
import Link from "next/link"
import type { StockDetail } from "@/types/stock"
import { useSession } from "next-auth/react"
import { InstitutionalFlow } from "@/components/stock/institutional-flow"
import { StickyPriceHeader } from "@/components/stock/sticky-price-header"
import { FloatingActionBar } from "@/components/stock/floating-action-bar"

function getRealtimeUrl(ticker: string, market: string) {
  if (market === "KR") {
    return `https://finance.naver.com/item/main.naver?code=${ticker}`
  }
  return `https://finance.yahoo.com/quote/${ticker}`
}

interface StockTabsProps {
  ticker: string
  stock: StockDetail | null
  reportCount?: number
  chartSlot: ReactNode
  infoSlot: ReactNode
  newsSlot: ReactNode
  eventsSlot: ReactNode
}

export function StockTabs({
  ticker,
  stock: initialStock,
  reportCount,
  chartSlot,
  infoSlot,
  newsSlot,
  eventsSlot,
}: StockTabsProps) {
  const [mobileTab, setMobileTab] = useState("chart")
  const [desktopTab, setDesktopTab] = useState("news")
  const [isMobilePending, startMobileTransition] = useTransition()
  const [isDesktopPending, startDesktopTransition] = useTransition()
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const { data: stock } = useQuery<StockDetail>({
    queryKey: ["stock", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}`)
      if (!res.ok) throw new Error("종목을 찾을 수 없습니다")
      return res.json()
    },
    initialData: initialStock ?? undefined,
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

  const isWatched = watchlistData?.watchlist?.some((w: { ticker: string }) => w.ticker === ticker) ?? false

  const toggleMutation = useMutation({
    mutationFn: async ({ ticker: t, watched }: { ticker: string; watched: boolean }) => {
      if (watched) {
        await fetch(`/api/watchlist/${t}`, { method: "DELETE" })
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: t }),
        })
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

  const toggleWatchlist = async (t: string, watched: boolean): Promise<void> => {
    toggleMutation.mutate({ ticker: t, watched })
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
  const isUp = (stock.quote?.changePercent ?? 0) >= 0

  const priceLinks = (
    <div className="flex items-center gap-3 mt-2 flex-wrap">
      {stock.quote && (
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          업데이트: {new Date(stock.quote.updatedAt).toLocaleString("ko-KR")}
        </p>
      )}
      <a
        href={getRealtimeUrl(ticker, stock.market)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        실시간 시세 <ExternalLink className="h-3 w-3" />
      </a>
      {reportCount !== undefined && reportCount > 0 && (
        <Link
          href={`/reports/stock/${ticker}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          AI 리포트 ({reportCount}) <FileText className="h-3 w-3" />
        </Link>
      )}
      {session && (
        <Link
          href={`/reports/request?ticker=${ticker}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          AI 분석 요청 <Sparkles className="h-3 w-3" />
        </Link>
      )}
    </div>
  )

  return (
    <PageContainer>
      {/* Sticky compact bar (slides in on scroll) */}
      <StickyPriceHeader stock={stock} currency={currency} />

      {/* ── 브레드크럼 ── */}
      <BreadcrumbNav
        items={[
          { label: "주식", href: "/market" },
          { label: stock.name },
        ]}
      />

      {/* ══════════════════════════════════════════════
          데스크톱 레이아웃 (lg 이상): CSS Grid
          areas: "header header" / "chart sidebar" / "tabs tabs"
         ══════════════════════════════════════════════ */}
      <div className="hidden lg:grid lg:gap-6" style={{ gridTemplateColumns: "1fr 320px", gridTemplateAreas: '"header header" "chart sidebar" "tabs tabs"' }}>

        {/* header area */}
        <div style={{ gridArea: "header" }} className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{stock.name}</h1>
              <Badge variant="outline" className="font-mono">{stock.ticker}</Badge>
              <Badge variant="secondary">{stock.exchange}</Badge>
            </div>
            {stock.sector && (
              <p className="text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs mr-1">{stock.sector}</Badge>
              </p>
            )}
            {stock.quote && (
              <div className="mt-3">
                {/* 가격: font-price + 방향 색상 */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span
                    className={`font-price text-3xl lg:text-4xl ${isUp ? "text-[var(--color-stock-up)]" : "text-[var(--color-stock-down)]"}`}
                  >
                    {currency === "KRW"
                      ? stock.quote.price.toLocaleString("ko-KR") + "원"
                      : "$" + stock.quote.price.toFixed(2)}
                  </span>
                  <span
                    className="change-pill"
                    style={{
                      color: isUp ? "var(--color-stock-up)" : "var(--color-stock-down)",
                      background: isUp ? "var(--color-stock-up-bg)" : "var(--color-stock-down-bg)",
                    }}
                  >
                    {isUp ? "▲" : "▼"}{" "}
                    {currency === "KRW"
                      ? Math.abs(stock.quote.change).toLocaleString("ko-KR")
                      : Math.abs(stock.quote.change).toFixed(2)}{" "}
                    ({Math.abs(stock.quote.changePercent).toFixed(2)}%)
                  </span>
                </div>
                {/* OHLV 컴팩트 수평 라인 */}
                <div className="flex items-center gap-4 mt-2 text-sm font-mono text-[var(--fg-secondary)] flex-wrap">
                  <span><span className="text-[var(--fg-tertiary)] text-xs mr-1">시가</span>
                    {currency === "KRW" ? stock.quote.open.toLocaleString("ko-KR") : "$" + stock.quote.open.toFixed(2)}
                  </span>
                  <span><span className="text-[var(--fg-tertiary)] text-xs mr-1">고가</span>
                    {currency === "KRW" ? stock.quote.high.toLocaleString("ko-KR") : "$" + stock.quote.high.toFixed(2)}
                  </span>
                  <span><span className="text-[var(--fg-tertiary)] text-xs mr-1">저가</span>
                    {currency === "KRW" ? stock.quote.low.toLocaleString("ko-KR") : "$" + stock.quote.low.toFixed(2)}
                  </span>
                  <span><span className="text-[var(--fg-tertiary)] text-xs mr-1">거래량</span>
                    {stock.quote.volume >= 1_000_000
                      ? (stock.quote.volume / 1_000_000).toFixed(1) + "M"
                      : stock.quote.volume.toLocaleString("ko-KR")}
                  </span>
                </div>
                {priceLinks}
              </div>
            )}
          </div>
          <WatchlistButton ticker={ticker} isWatched={isWatched} onToggle={toggleWatchlist} />
        </div>

        {/* chart area — 차트 히어로 영역 */}
        <div style={{ gridArea: "chart" }} className="min-h-[400px] h-[60vh] max-h-[600px] min-w-0">
          <div className="card-chart h-full">
            {chartSlot}
          </div>
        </div>

        {/* sidebar area */}
        <div style={{ gridArea: "sidebar" }} className="min-w-0">
          <StockSidebar stock={stock} />
        </div>

        {/* tabs area (뉴스/수급/이벤트) */}
        <div style={{ gridArea: "tabs" }} className="min-w-0">
          <Tabs
            value={desktopTab}
            onValueChange={(v) => startDesktopTransition(() => setDesktopTab(v))}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="news">뉴스</TabsTrigger>
              {stock.market === "KR" && <TabsTrigger value="institutional">수급</TabsTrigger>}
              <TabsTrigger value="events">이벤트</TabsTrigger>
              <TabsTrigger value="info">기업정보</TabsTrigger>
            </TabsList>

            <div className={isDesktopPending ? "opacity-70 transition-opacity duration-150" : "transition-opacity duration-150"}>
              <TabsContent value="news">{newsSlot}</TabsContent>
              {stock.market === "KR" && (
                <TabsContent value="institutional">
                  <InstitutionalFlow ticker={ticker} />
                </TabsContent>
              )}
              <TabsContent value="events">{eventsSlot}</TabsContent>
              <TabsContent value="info">{infoSlot}</TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* ── Floating Action Bar ── */}
      <FloatingActionBar
        ticker={ticker}
        name={stock?.name ?? ticker}
        market={stock?.market ?? "KR"}
        isWatched={isWatched}
        onToggleWatchlist={toggleWatchlist}
        reportCount={reportCount}
      />

      {/* ══════════════════════════════════════════════
          태블릿 레이아웃 (md ~ lg): 1칼럼, 사이드바 차트 아래
         ══════════════════════════════════════════════ */}
      <div className="hidden md:block lg:hidden">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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

        {stock.quote && (
          <div className="mb-4">
            <PriceDisplay
              price={stock.quote.price}
              change={stock.quote.change}
              changePercent={stock.quote.changePercent}
              currency={currency}
              preMarketPrice={stock.quote.preMarketPrice}
              postMarketPrice={stock.quote.postMarketPrice}
            />
            {priceLinks}
          </div>
        )}

        {/* 차트 */}
        <div className="mb-4 min-h-[400px] h-[50vh] max-h-[500px]">
          <div className="card-chart h-full">{chartSlot}</div>
        </div>

        {/* 사이드바 (차트 아래) */}
        <div className="mb-6">
          <StockSidebar stock={stock} />
        </div>

        {/* 탭 (뉴스/수급/이벤트/정보) */}
        <Tabs
          value={desktopTab}
          onValueChange={(v) => startDesktopTransition(() => setDesktopTab(v))}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="news">뉴스</TabsTrigger>
            {stock.market === "KR" && <TabsTrigger value="institutional">수급</TabsTrigger>}
            <TabsTrigger value="events">이벤트</TabsTrigger>
            <TabsTrigger value="info">기업정보</TabsTrigger>
          </TabsList>

          <div className={isDesktopPending ? "opacity-70 transition-opacity duration-150" : "transition-opacity duration-150"}>
            <TabsContent value="news">{newsSlot}</TabsContent>
            {stock.market === "KR" && (
              <TabsContent value="institutional">
                <InstitutionalFlow ticker={ticker} />
              </TabsContent>
            )}
            <TabsContent value="events">{eventsSlot}</TabsContent>
            <TabsContent value="info">{infoSlot}</TabsContent>
          </div>
        </Tabs>
      </div>

      {/* ══════════════════════════════════════════════
          모바일 레이아웃 (md 미만): 기존 단일 컬럼 탭 (차트 탭 포함)
         ══════════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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

        {stock.quote && (
          <div className="mb-4">
            <PriceDisplay
              price={stock.quote.price}
              change={stock.quote.change}
              changePercent={stock.quote.changePercent}
              currency={currency}
              preMarketPrice={stock.quote.preMarketPrice}
              postMarketPrice={stock.quote.postMarketPrice}
            />
            {priceLinks}
          </div>
        )}

        <Tabs
          value={mobileTab}
          onValueChange={(v) => startMobileTransition(() => setMobileTab(v))}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="chart">차트</TabsTrigger>
            <TabsTrigger value="info">정보</TabsTrigger>
            {stock.market === "KR" && <TabsTrigger value="institutional">수급</TabsTrigger>}
            <TabsTrigger value="news">뉴스</TabsTrigger>
            <TabsTrigger value="events">이벤트</TabsTrigger>
          </TabsList>

          <div className={isMobilePending ? "opacity-70 transition-opacity duration-150" : "transition-opacity duration-150"}>
            {/* 모바일 차트: 풀 블리드 */}
            <TabsContent value="chart">
              <div className="-mx-4 w-[calc(100%+32px)]">
                {chartSlot}
              </div>
            </TabsContent>
            <TabsContent value="info">{infoSlot}</TabsContent>
            {stock.market === "KR" && (
              <TabsContent value="institutional">
                <InstitutionalFlow ticker={ticker} />
              </TabsContent>
            )}
            <TabsContent value="news">{newsSlot}</TabsContent>
            <TabsContent value="events">{eventsSlot}</TabsContent>
          </div>
        </Tabs>
      </div>
    </PageContainer>
  )
}
