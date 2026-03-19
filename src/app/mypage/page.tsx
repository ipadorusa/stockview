"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { StockRow } from "@/components/market/stock-row"
import { BookMarked, Settings, LogOut, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WatchlistItem } from "@/types/stock"

export default function MyPage() {
  const { data: session, status } = useSession()

  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: !!session,
    staleTime: 60 * 1000,
  })

  if (status === "loading") {
    return (
      <PageContainer>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
      </PageContainer>
    )
  }

  const watchlist: WatchlistItem[] = data?.watchlist ?? []
  const previewItems = watchlist.slice(0, 5)

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-6">마이페이지</h1>

      {/* Profile Card */}
      <Card className="mb-4">
        <CardContent className="flex items-center gap-4 py-5">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg font-semibold">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{session?.user?.name}</p>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Watchlist Preview */}
      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="font-semibold">관심종목</h2>
            <Link href="/watchlist" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2 px-4 pb-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : previewItems.length === 0 ? (
            <div className="px-4 pb-4 text-center py-8">
              <p className="text-sm text-muted-foreground">종목을 추가해보세요</p>
              <Link href="/" className="text-sm text-primary hover:underline mt-1 inline-block">종목 검색하기</Link>
            </div>
          ) : (
            <div className="divide-y">
              {previewItems.map((item) => (
                <StockRow
                  key={item.ticker}
                  ticker={item.ticker}
                  name={item.name}
                  price={item.price}
                  change={item.change}
                  changePercent={item.changePercent}
                  market={item.market}
                  stockType={item.stockType}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardContent className="p-0 divide-y">
          <Link href="/watchlist" className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors">
            <BookMarked className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">관심종목 관리</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">설정</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={cn("flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors w-full text-left", "text-destructive")}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">로그아웃</span>
          </button>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
