"use client"

import { cn } from "@/lib/utils"
import type { PortfolioSummary as Summary } from "@/types/portfolio"

function formatKRW(v: number) {
  if (Math.abs(v) >= 100_000_000) return (v / 100_000_000).toFixed(1) + "억"
  if (Math.abs(v) >= 10_000) return (v / 10_000).toFixed(1) + "만"
  return v.toLocaleString("ko-KR")
}

export function PortfolioSummary({ summary }: { summary: Summary }) {
  const profitPercent = summary.totalCost > 0
    ? ((summary.totalProfitLoss / summary.totalCost) * 100).toFixed(2)
    : "0.00"
  const isUp = summary.totalProfitLoss > 0
  const isDown = summary.totalProfitLoss < 0

  return (
    <div className="rounded-xl border p-4 md:p-6 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">총 평가금액</p>
          <p className="text-lg font-bold font-mono">{formatKRW(summary.totalValue)}원</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">총 투자금액</p>
          <p className="text-lg font-bold font-mono">{formatKRW(summary.totalCost)}원</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">총 수익</p>
          <p className={cn("text-lg font-bold font-mono", isUp && "text-stock-up", isDown && "text-stock-down")}>
            {isUp ? "+" : ""}{formatKRW(summary.totalProfitLoss)}원
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">수익률</p>
          <p className={cn("text-lg font-bold font-mono", isUp && "text-stock-up", isDown && "text-stock-down")}>
            {isUp ? "+" : ""}{profitPercent}%
          </p>
        </div>
      </div>
    </div>
  )
}
