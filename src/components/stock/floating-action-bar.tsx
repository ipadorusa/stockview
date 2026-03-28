"use client"

import { Star, GitCompare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { trackEvent } from "@/lib/gtm"
import { toast } from "sonner"
import { useCompare } from "@/contexts/compare-context"

interface FloatingActionBarProps {
  ticker: string
  name: string
  market: string
  isWatched: boolean
  onToggleWatchlist: (ticker: string, isWatched: boolean) => Promise<void>
  reportCount?: number
}

export function FloatingActionBar({
  ticker,
  name,
  market,
  isWatched,
  onToggleWatchlist,
  reportCount,
}: FloatingActionBarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addToCompare, removeFromCompare, isInCompare, compareSlots } = useCompare()
  const inCompare = isInCompare(ticker)
  const hasCompareBar = compareSlots.length > 0

  const handleWatchlist = async () => {
    if (!session) {
      toast.info("로그인이 필요합니다", { description: "관심종목 기능을 사용하려면 로그인해주세요." })
      router.push("/auth/login")
      return
    }
    await onToggleWatchlist(ticker, isWatched)
    trackEvent(isWatched ? "watchlist_remove" : "watchlist_add", { ticker })
    toast.success(isWatched ? "관심종목에서 제거했습니다" : "관심종목에 추가했습니다")
  }

  const handleCompare = () => {
    if (inCompare) {
      removeFromCompare(ticker)
      toast.success(`${name} 비교에서 제거했습니다`)
    } else {
      addToCompare(ticker, name, market)
      toast.success(`${name} 비교에 추가했습니다`)
    }
  }

  const handleReport = () => {
    if (!session) {
      toast.info("로그인이 필요합니다", { description: "AI 분석 요청은 로그인 후 사용 가능합니다." })
      router.push("/auth/login")
      return
    }
    router.push(`/reports/request?ticker=${ticker}`)
  }

  return (
    <div
      className={cn(
        // Mobile: above bottom-tab-bar (h-14 = 56px + 8px gap = 64px → use 72px)
        // When compare bar is visible (≈60px tall), push FAB above it: 60+60=120px
        // lg+: bottom-tab-bar hidden, use bottom-6
        "fixed left-1/2 -translate-x-1/2 z-40",
        hasCompareBar ? "bottom-[128px] lg:bottom-[72px]" : "bottom-[72px] lg:bottom-6",
        "flex items-center gap-2 px-4 py-2",
        "rounded-full border bg-background/95 backdrop-blur-sm shadow-lg",
      )}
    >
      <Button
        variant={isWatched ? "default" : "outline"}
        size="sm"
        onClick={handleWatchlist}
        className={cn(
          "gap-1.5 rounded-full",
          isWatched && "bg-yellow-500 hover:bg-yellow-600 border-yellow-500 text-white",
        )}
      >
        <Star className={cn("h-3.5 w-3.5", isWatched && "fill-white")} />
        <span className="text-xs">{isWatched ? "관심종목" : "관심 추가"}</span>
      </Button>

      <Button
        variant={inCompare ? "default" : "outline"}
        size="sm"
        onClick={handleCompare}
        className={cn("gap-1.5 rounded-full", inCompare && "bg-primary/90")}
      >
        <GitCompare className="h-3.5 w-3.5" />
        <span className="text-xs">{inCompare ? "비교 중" : "비교 추가"}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleReport}
        className="gap-1.5 rounded-full"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-xs">
          {reportCount && reportCount > 0 ? `AI 리포트 (${reportCount})` : "AI 분석"}
        </span>
      </Button>
    </div>
  )
}
