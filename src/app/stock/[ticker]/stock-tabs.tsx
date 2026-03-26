"use client"

import { useState, useTransition, type ReactNode } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/page-container"
import { PriceDisplay } from "@/components/stock/price-display"
import { WatchlistButton } from "@/components/stock/watchlist-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, FileText } from "lucide-react"
import Link from "next/link"
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
  const [activeTab, setActiveTab] = useState("chart")
  const [isPending, startTransition] = useTransition()
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
            {reportCount !== undefined && reportCount > 0 && (
              <Link
                href={`/reports/stock/${ticker}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                AI 리포트 ({reportCount}) <FileText className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={(v) => startTransition(() => setActiveTab(v))}>
        <TabsList className="mb-4">
          <TabsTrigger value="chart">차트</TabsTrigger>
          <TabsTrigger value="info">정보</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          <TabsTrigger value="events">이벤트</TabsTrigger>
        </TabsList>

        <div className={isPending ? "opacity-70 transition-opacity" : ""}>
          <TabsContent value="chart">{chartSlot}</TabsContent>
          <TabsContent value="info">{infoSlot}</TabsContent>
          <TabsContent value="news">{newsSlot}</TabsContent>
          <TabsContent value="events">{eventsSlot}</TabsContent>
        </div>
      </Tabs>
    </PageContainer>
  )
}
