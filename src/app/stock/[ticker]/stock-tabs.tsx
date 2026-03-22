"use client"

import { useState, type ReactNode } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/page-container"
import { PriceDisplay } from "@/components/stock/price-display"
import { WatchlistButton } from "@/components/stock/watchlist-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import type { StockDetail } from "@/types/stock"
import { useSession } from "next-auth/react"

function getRealtimeUrl(ticker: string, market: string) {
  if (market === "KR") {
    return `https://finance.naver.com/item/main.naver?code=${ticker}`
  }
  return `https://finance.yahoo.com/quote/${ticker}`
}

interface StockTabsProps {
  ticker: string
  stock: StockDetail | null
  chartSlot: ReactNode
  infoSlot: ReactNode
  newsSlot: ReactNode
  disclosureSlot: ReactNode | null
  dividendSlot: ReactNode
  earningsSlot: ReactNode
}

export function StockTabs({
  ticker,
  stock: initialStock,
  chartSlot,
  infoSlot,
  newsSlot,
  disclosureSlot,
  dividendSlot,
  earningsSlot,
}: StockTabsProps) {
  const [descExpanded, setDescExpanded] = useState(false)
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
              href={getRealtimeUrl(ticker, stock.market)}
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
          <TabsTrigger value="info">시세</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          {stock.market === "KR" && <TabsTrigger value="disclosure">공시</TabsTrigger>}
          <TabsTrigger value="dividend">배당</TabsTrigger>
          <TabsTrigger value="earnings">실적</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">{chartSlot}</TabsContent>
        <TabsContent value="info">{infoSlot}</TabsContent>
        <TabsContent value="news">{newsSlot}</TabsContent>
        {stock.market === "KR" && (
          <TabsContent value="disclosure">{disclosureSlot}</TabsContent>
        )}
        <TabsContent value="dividend">{dividendSlot}</TabsContent>
        <TabsContent value="earnings">{earningsSlot}</TabsContent>
      </Tabs>
    </PageContainer>
  )
}
