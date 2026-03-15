import { cn } from "@/lib/utils"

interface ExchangeRateBadgeProps {
  rate: number
  change: number
  changePercent: number
  className?: string
}

export function ExchangeRateBadge({ rate, change, changePercent, className }: ExchangeRateBadgeProps) {
  const isUp = change >= 0
  const colorClass = isUp ? "text-stock-up" : "text-stock-down"
  const sign = isUp ? "▲" : "▼"
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      USD/KRW{" "}
      <span className="font-mono font-medium text-foreground">
        {rate.toLocaleString("ko-KR", { minimumFractionDigits: 2 })}
      </span>
      <span className={colorClass}>
        {sign}{Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
      </span>
    </span>
  )
}
