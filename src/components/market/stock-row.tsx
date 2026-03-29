"use client"

import { memo } from "react"
import Link from "next/link"
import { PriceChangeText } from "@/components/common/price-change-text"
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

export const StockRow = memo(function StockRow({ ticker, name, price, change, changePercent, volume, tradingValue, market, stockType, rank, currency }: StockRowProps) {
  const cur = currency ?? (market === "KR" ? "KRW" : "USD")
  const href = stockType === "ETF" ? `/etf/${ticker}` : `/stock/${ticker}`
  const displayValue = tradingValue ?? volume
  const formattedPrice = cur === "KRW" ? formatKRW(price) + "원" : "$" + price.toFixed(2)
  return (
    <Link href={href}
      className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 active:bg-accent/70 transition-colors rounded-lg cursor-pointer">
      <div className="flex items-center gap-3">
        {rank !== undefined && <span className="w-5 text-center text-sm text-muted-foreground font-medium">{rank}</span>}
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground font-mono">{ticker}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono font-medium text-sm" suppressHydrationWarning>
          {formattedPrice}
        </p>
        <div className="flex items-center justify-end gap-2">
          <PriceChangeText value={change} changePercent={changePercent} format="percent" currency={cur} className="text-xs" />
          {displayValue != null && <span className="text-xs text-muted-foreground" suppressHydrationWarning>{fVol(displayValue)}</span>}
        </div>
      </div>
    </Link>
  )
})
