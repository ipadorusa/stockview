"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface MoverItem {
  ticker: string
  name: string
  changePercent: number
}

interface MomentumBarsProps {
  gainers: MoverItem[]
  losers: MoverItem[]
}

function MoverBar({ item, max, isUp }: { item: MoverItem; max: number; isUp: boolean }) {
  const barPct = max > 0 ? Math.min((Math.abs(item.changePercent) / max) * 100, 100) : 0

  return (
    <Link
      href={`/stock/${item.ticker}`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors group active:scale-[0.99]"
    >
      <span className="text-sm truncate w-24 shrink-0 text-[var(--fg-primary)] group-hover:text-[var(--fg-primary)]">
        {item.name}
      </span>
      <div className="flex-1 h-5 rounded-sm bg-[var(--border-subtle)] overflow-hidden">
        <div
          className="h-full rounded-sm"
          style={{
            width: `${barPct}%`,
            backgroundColor: isUp
              ? "color-mix(in oklch, var(--color-stock-up) 30%, transparent)"
              : "color-mix(in oklch, var(--color-stock-down) 30%, transparent)",
          }}
        />
      </div>
      <span
        className={cn(
          "text-sm font-mono w-14 text-right shrink-0",
          isUp ? "text-stock-up" : "text-stock-down"
        )}
      >
        {isUp ? "+" : ""}{item.changePercent.toFixed(2)}%
      </span>
    </Link>
  )
}

export function MomentumBars({ gainers, losers }: MomentumBarsProps) {
  const displayGainers = gainers.slice(0, 10)
  const displayLosers = losers.slice(0, 10)

  const maxGain = displayGainers.length > 0
    ? Math.max(...displayGainers.map((g) => Math.abs(g.changePercent)))
    : 1
  const maxLoss = displayLosers.length > 0
    ? Math.max(...displayLosers.map((l) => Math.abs(l.changePercent)))
    : 1

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 상승 종목 */}
      <div>
        <h3 className="text-sm font-semibold text-stock-up mb-2 px-1">
          상승 TOP {displayGainers.length}
        </h3>
        <div className="space-y-0.5">
          {displayGainers.map((item) => (
            <MoverBar key={item.ticker} item={item} max={maxGain} isUp={true} />
          ))}
          {displayGainers.length === 0 && (
            <p className="text-sm text-[var(--fg-muted)] px-3 py-2">데이터 없음</p>
          )}
        </div>
      </div>

      {/* 하락 종목 */}
      <div>
        <h3 className="text-sm font-semibold text-stock-down mb-2 px-1">
          하락 TOP {displayLosers.length}
        </h3>
        <div className="space-y-0.5">
          {displayLosers.map((item) => (
            <MoverBar key={item.ticker} item={item} max={maxLoss} isUp={false} />
          ))}
          {displayLosers.length === 0 && (
            <p className="text-sm text-[var(--fg-muted)] px-3 py-2">데이터 없음</p>
          )}
        </div>
      </div>
    </div>
  )
}
