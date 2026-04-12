import { cn } from "@/lib/utils"

type Market = "KR" | "US" | "NXT" | "ETF"
type Size = "xs" | "sm"

interface TickerBadgeProps {
  market: Market
  size?: Size
  children?: React.ReactNode
  className?: string
}

const marketStyles: Record<Market, string> = {
  KR: "bg-stock-up-bg text-stock-up",
  US: "bg-stock-down-bg text-stock-down",
  NXT: "bg-warning/15 text-warning",
  ETF: "bg-[var(--accent-color)]/15 text-[var(--accent-color)]",
}

const defaultLabels: Record<Market, string> = {
  KR: "KR",
  US: "US",
  NXT: "NXT",
  ETF: "ETF",
}

const sizeStyles: Record<Size, string> = {
  xs: "h-4 px-1.5 text-[10px]",
  sm: "h-5 px-2 text-xs",
}

export function TickerBadge({
  market,
  size = "sm",
  children,
  className,
}: TickerBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-4xl font-medium",
        sizeStyles[size],
        marketStyles[market],
        className,
      )}
    >
      {children ?? defaultLabels[market]}
    </span>
  )
}
