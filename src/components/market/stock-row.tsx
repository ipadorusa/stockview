"use client"

import { memo } from "react"
import Link from "next/link"
import { PriceChangeText } from "@/components/common/price-change-text"
import { cn } from "@/lib/utils"
import type { Market, StockType } from "@/types/stock"

interface StockRowProps {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  tradingValue?: number
  market: Market
  stockType?: StockType
  rank?: number
  currency?: "KRW" | "USD"
  showVolumeBar?: boolean
  maxChangePercent?: number
}

/** toLocaleString 대신 수동 콤마 포맷 (SSR/CSR 일관성) */
function formatKRW(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function fVol(v: number) {
  if (v >= 1_000_000_000_000) return (v / 1_000_000_000_000).toFixed(1) + "조"
  if (v >= 100_000_000) return (v / 100_000_000).toFixed(1) + "억"
  if (v >= 10_000) return (v / 10_000).toFixed(1) + "만"
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K"
  return formatKRW(v)
}

export const StockRow = memo(function StockRow({
  ticker, name, price, change, changePercent, volume, tradingValue, market, stockType, rank, currency,
  showVolumeBar = false, maxChangePercent,
}: StockRowProps) {
  const cur = currency ?? (market === "KR" ? "KRW" : "USD")
  const href = stockType === "ETF" ? `/etf/${ticker}` : `/stock/${ticker}`
  const displayValue = tradingValue ?? volume
  const formattedPrice = cur === "KRW" ? formatKRW(price) + "원" : "$" + price.toFixed(2)
  const isUp = change >= 0

  const barWidth = showVolumeBar && maxChangePercent
    ? Math.min(Math.abs(changePercent) / maxChangePercent * 100, 100)
    : 0

  return (
    <Link href={href}
      className="card-interactive flex items-center justify-between px-4 py-3 !rounded-lg !border-0 !shadow-none hover:!shadow-none hover:bg-[var(--bg-elevated)]">
      <div className="flex items-center gap-3">
        {rank !== undefined && (
          <span className={cn(
            "w-5 text-center text-sm font-medium font-mono",
            rank <= 3 ? "text-[var(--fg-primary)] font-bold" : "text-[var(--fg-muted)]"
          )}>
            {rank}
          </span>
        )}
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-[var(--fg-muted)] font-mono">{ticker}</p>
        </div>
      </div>
      <div className="text-right flex items-center gap-3">
        {showVolumeBar && barWidth > 0 && (
          <div className="w-16 h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden hidden sm:block">
            <div
              className={cn("h-full rounded-full", isUp ? "bg-stock-up/30" : "bg-stock-down/30")}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        )}
        <div>
          <p className="font-price text-sm" suppressHydrationWarning>
            {formattedPrice}
          </p>
          <div className="flex items-center justify-end gap-2">
            <PriceChangeText value={change} changePercent={changePercent} format="percent" currency={cur} className="text-xs" />
            {displayValue != null && <span className="text-xs text-[var(--fg-muted)]" suppressHydrationWarning>{fVol(displayValue)}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
})
