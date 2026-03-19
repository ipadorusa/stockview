"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { StockRow } from "@/components/market/stock-row"
import { EmptyState } from "@/components/common/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Bookmark, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { WatchlistItem } from "@/types/stock"

export default function WatchlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: !!session,
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
          <p className="text-muted-foreground mb-6">로그인하면 관심종목을 저장할 수 있어요</p>
          <Button onClick={() => router.push("/auth/login")}>로그인</Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-6">관심종목</h1>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : data?.watchlist?.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="아직 관심종목이 없어요"
          description="종목 페이지에서 별 아이콘을 눌러 추가해보세요"
          action={{ label: "종목 검색하기", onClick: () => router.push("/") }}
        />
      ) : (
        <div className="divide-y border rounded-lg overflow-hidden">
          {data?.watchlist?.map((item: WatchlistItem) => (
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
                className="p-3 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                title="관심종목 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
