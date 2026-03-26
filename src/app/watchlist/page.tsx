"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { PageContainer } from "@/components/layout/page-container"
import { StockRow } from "@/components/market/stock-row"
import { EmptyState } from "@/components/common/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary"
import { PortfolioRow } from "@/components/portfolio/portfolio-row"
import { AddPortfolioDialog } from "@/components/portfolio/add-portfolio-dialog"
import { Bookmark, Briefcase, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { WatchlistItem } from "@/types/stock"
import type { PortfolioItem, PortfolioSummary as Summary } from "@/types/portfolio"

export default function WatchlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: watchlistData, isLoading: watchlistLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: !!session,
    staleTime: 60 * 1000,
  })

  const { data: portfolioData, isLoading: portfolioLoading } = useQuery<{ portfolio: PortfolioItem[]; summary: Summary }>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: !!session,
    staleTime: 60 * 1000,
  })

  const removeMutation = useMutation({
    mutationFn: async (ticker: string) => {
      const res = await fetch(`/api/watchlist/${ticker}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: (_, ticker) => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] })
      toast.success(`${ticker} 관심종목에서 제거했습니다`)
    },
  })

  if (status === "unauthenticated") {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">관심종목</h2>
          <p className="text-muted-foreground mb-6">로그인하면 관심종목과 포트폴리오를 관리할 수 있어요</p>
          <Button onClick={() => router.push("/auth/login")}>로그인</Button>
        </div>
      </PageContainer>
    )
  }

  const portfolio = portfolioData?.portfolio ?? []
  const summary = portfolioData?.summary
  const krItems = portfolio.filter((p) => p.market === "KR")
  const usItems = portfolio.filter((p) => p.market === "US")

  function groupSubtotal(items: PortfolioItem[]) {
    return {
      totalValue: items.reduce((s, p) => s + p.totalValue, 0),
      totalCost: items.reduce((s, p) => s + p.totalCost, 0),
      totalProfitLoss: items.reduce((s, p) => s + p.totalProfitLoss, 0),
    }
  }

  return (
    <PageContainer>
      <GtmPageView pageData={{ page_name: "watchlist" }} />

      <Tabs defaultValue="watchlist">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="watchlist" className="gap-1.5">
              <Bookmark className="h-4 w-4" />관심종목
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-1.5">
              <Briefcase className="h-4 w-4" />포트폴리오
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 관심종목 탭 */}
        <TabsContent value="watchlist">
          {watchlistLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : watchlistData?.watchlist?.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="아직 관심종목이 없어요"
              description="종목 페이지에서 별 아이콘을 눌러 추가해보세요"
              action={{ label: "종목 검색하기", onClick: () => router.push("/") }}
            />
          ) : (
            <div className="divide-y border rounded-lg overflow-hidden">
              {watchlistData?.watchlist?.map((item: WatchlistItem) => (
                <div key={item.ticker} className="flex items-center group">
                  <div className="flex-1">
                    <StockRow
                      ticker={item.ticker}
                      name={item.name}
                      price={item.price}
                      change={item.change}
                      changePercent={item.changePercent}
                      market={item.market}
                      stockType={item.stockType}
                    />
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(item.ticker)}
                    className="p-3 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    title="관심종목 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 포트폴리오 탭 */}
        <TabsContent value="portfolio">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">보유 종목의 수익률을 한눈에 확인하세요</p>
            <AddPortfolioDialog />
          </div>

          {portfolioLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-28 rounded-xl" />
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : portfolio.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="아직 포트폴리오가 비어있어요"
              description="종목을 추가해서 수익률을 한눈에 확인해보세요"
            />
          ) : (
            <>
              {summary && <PortfolioSummary summary={summary} />}

              {krItems.length > 0 && (
                <section className="mb-6">
                  <MarketGroupHeader label="한국 주식" items={krItems} subtotal={groupSubtotal(krItems)} currency="KRW" />
                  <div className="divide-y border rounded-lg overflow-hidden">
                    {krItems.map((item) => <PortfolioRow key={item.id} item={item} />)}
                  </div>
                </section>
              )}

              {usItems.length > 0 && (
                <section className="mb-6">
                  <MarketGroupHeader label="미국 주식" items={usItems} subtotal={groupSubtotal(usItems)} currency="USD" />
                  <div className="divide-y border rounded-lg overflow-hidden">
                    {usItems.map((item) => <PortfolioRow key={item.id} item={item} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}

function MarketGroupHeader({ label, items, subtotal, currency }: {
  label: string
  items: PortfolioItem[]
  subtotal: { totalValue: number; totalCost: number; totalProfitLoss: number }
  currency: "KRW" | "USD"
}) {
  const isUp = subtotal.totalProfitLoss > 0
  const isDown = subtotal.totalProfitLoss < 0
  const pct = subtotal.totalCost > 0 ? ((subtotal.totalProfitLoss / subtotal.totalCost) * 100).toFixed(2) : "0.00"
  const fmt = (v: number) => currency === "KRW"
    ? v.toLocaleString("ko-KR") + "원"
    : "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-semibold">{label} <span className="text-muted-foreground font-normal">({items.length})</span></h2>
      <span className={cn("text-xs font-mono", isUp && "text-stock-up", isDown && "text-stock-down", !isUp && !isDown && "text-muted-foreground")}>
        {isUp ? "+" : ""}{fmt(subtotal.totalProfitLoss)} ({isUp ? "+" : ""}{pct}%)
      </span>
    </div>
  )
}
