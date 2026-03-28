"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { StockDetail } from "@/types/stock"

interface StickyPriceHeaderProps {
  stock: StockDetail
  currency: "KRW" | "USD"
}

function formatPrice(price: number, currency: "KRW" | "USD") {
  return currency === "KRW" ? price.toLocaleString("ko-KR") + "원" : "$" + price.toFixed(2)
}

export function StickyPriceHeader({ stock, currency }: StickyPriceHeaderProps) {
  const [isCompact, setIsCompact] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsCompact(!entry.isIntersecting),
      // Fire when sentinel fully leaves viewport top
      { threshold: 0, rootMargin: "-56px 0px 0px 0px" },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const quote = stock.quote
  const change = quote?.change ?? 0
  const changePercent = quote?.changePercent ?? 0
  const colorClass = change > 0 ? "text-stock-up" : change < 0 ? "text-stock-down" : "text-muted-foreground"
  const sign = change > 0 ? "▲" : change < 0 ? "▼" : "-"

  return (
    <>
      {/* Sentinel: sits at the top of the page content area */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden="true" />

      {/* Compact sticky bar — slides in from top when sentinel leaves viewport */}
      <div
        className={cn(
          "fixed top-14 left-0 right-0 z-40",
          "border-b bg-background/95 backdrop-blur-sm",
          "transition-transform duration-200",
          isCompact ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold truncate">{stock.name}</span>
            <Badge variant="outline" className="font-mono text-xs hidden sm:inline-flex">
              {stock.ticker}
            </Badge>
          </div>
          {quote && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono font-bold">{formatPrice(quote.price, currency)}</span>
              <span className={cn("text-sm font-medium", colorClass)}>
                {sign} {Math.abs(changePercent).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
