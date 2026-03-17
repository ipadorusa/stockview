"use client"

import Link from "next/link"
import { PriceChangeText } from "@/components/common/price-change-text"
import type { Market } from "@/types/stock"

interface StockRowProps {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  market: Market
  rank?: number
  currency?: "KRW" | "USD"
}

function fVol(v: number) {
  if (v >= 100_000_000) return (v / 100_000_000).toFixed(1) + "억"
  if (v >= 10_000) return (v / 10_000).toFixed(1) + "만"
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K"
  return v.toLocaleString()
}

export function StockRow({ ticker, name, price, change, changePercent, volume, market, rank, currency }: StockRowProps) {
  const cur = currency ?? (market === "KR" ? "KRW" : "USD")
  return (
    <Link href={`/stock/${ticker}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors rounded-lg cursor-pointer">
      <div className="flex items-center gap-3">
        {rank !== undefined && <span className="w-5 text-center text-sm text-muted-foreground font-medium">{rank}</span>}
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground font-mono">{ticker}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono font-medium text-sm">
          {cur === "KRW" ? price.toLocaleString("ko-KR") + "원" : "$" + price.toFixed(2)}
        </p>
        <div className="flex items-center justify-end gap-2">
          <PriceChangeText value={change} changePercent={changePercent} format="percent" currency={cur} className="text-xs" />
          {volume != null && <span className="text-xs text-muted-foreground">{fVol(volume)}</span>}
        </div>
      </div>
    </Link>
  )
}
