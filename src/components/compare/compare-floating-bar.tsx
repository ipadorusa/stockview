"use client"

import { useRouter } from "next/navigation"
import { X, GitCompare } from "lucide-react"
import { useCompare } from "@/contexts/compare-context"
import { Button } from "@/components/ui/button"

export function CompareFloatingBar() {
  const router = useRouter()
  const { compareSlots, removeFromCompare, clearCompare } = useCompare()

  if (compareSlots.length === 0) return null

  function handleCompare() {
    const tickers = compareSlots.map((s) => s.ticker).join(",")
    router.push(`/compare?tickers=${tickers}`)
  }

  return (
    <div
      className={[
        "fixed left-1/2 -translate-x-1/2 z-40",
        "bottom-[60px] lg:bottom-4",
        "w-[calc(100%-2rem)] max-w-2xl",
        "bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg",
        "px-3 py-2 flex items-center gap-2",
        "transition-all duration-200 ease-out",
        "animate-in slide-in-from-bottom-4",
      ].join(" ")}
    >
      {/* 슬롯 칩들 */}
      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
        {compareSlots.map((slot) => (
          <span
            key={slot.ticker}
            className="inline-flex items-center gap-1 bg-muted rounded-md px-2 py-1 text-xs font-medium max-w-[120px]"
          >
            <span className="truncate">{slot.name}</span>
            <button
              onClick={() => removeFromCompare(slot.ticker)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-0.5"
              aria-label={`${slot.name} 제거`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* 우측 액션 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {compareSlots.length}/4
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={clearCompare}
          aria-label="비교 초기화"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs px-3"
          onClick={handleCompare}
          disabled={compareSlots.length < 2}
        >
          <GitCompare className="h-3.5 w-3.5 mr-1" />
          비교하기
        </Button>
      </div>
    </div>
  )
}
