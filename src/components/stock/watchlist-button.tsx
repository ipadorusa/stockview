"use client"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface WatchlistButtonProps {
  ticker: string
  isWatched: boolean
  onToggle: (ticker: string, isWatched: boolean) => Promise<void>
  className?: string
}

export function WatchlistButton({ ticker, isWatched, onToggle, className }: WatchlistButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleClick = async () => {
    if (!session) {
      toast.info("로그인이 필요합니다", { description: "관심종목 기능을 사용하려면 로그인해주세요." })
      router.push("/auth/login")
      return
    }
    await onToggle(ticker, isWatched)
    toast.success(isWatched ? "관심종목에서 제거했습니다" : "관심종목에 추가했습니다")
  }

  return (
    <Button variant="outline" size="icon" onClick={handleClick}
      className={cn(className, isWatched && "text-yellow-500 border-yellow-500")}>
      <Star className={cn("h-4 w-4", isWatched && "fill-yellow-500")} />
      <span className="sr-only">{isWatched ? "관심종목 제거" : "관심종목 추가"}</span>
    </Button>
  )
}
