import { memo } from "react"
import { cn } from "@/lib/utils"

interface IndexCardProps {
  name: string
  label?: string
  value: number
  change: number
  changePercent: number
  updatedAt?: string
  variant?: "compact" | "expanded"
  sparkline?: React.ReactNode
}

export const IndexCard = memo(function IndexCard({ name, label, value, change, changePercent, updatedAt, variant = "compact", sparkline }: IndexCardProps) {
  const isUp = change >= 0
  const trend = isUp ? "up" : "down"
  const sign = isUp ? "▲" : "▼"

  return (
    <div
      className="card-stat h-full"
      data-trend={trend}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-[var(--fg-secondary)] font-medium tracking-wide">{label ?? name}</p>
          <p className={cn(
            "font-price mt-1",
            variant === "compact" ? "price-medium" : "price-large"
          )}>
            {value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className={cn(
            "change-pill mt-1.5",
            isUp ? "text-stock-up bg-stock-up-bg" : "text-stock-down bg-stock-down-bg"
          )}>
            <span>{sign}</span>
            <span className="font-mono">{Math.abs(change).toFixed(2)}</span>
            <span className="font-mono">({Math.abs(changePercent).toFixed(2)}%)</span>
          </div>
        </div>
        {sparkline && <div className="mt-2 shrink-0">{sparkline}</div>}
      </div>
    </div>
  )
})
