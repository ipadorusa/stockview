import { cn } from "@/lib/utils"

interface PriceChangeTextProps {
  value: number
  changePercent?: number
  format?: "price" | "percent" | "both"
  currency?: "KRW" | "USD"
  showSign?: boolean
  className?: string
}

export function PriceChangeText({
  value,
  changePercent,
  format = "both",
  currency = "KRW",
  showSign = true,
  className,
}: PriceChangeTextProps) {
  const isUp = value > 0
  const isDown = value < 0
  const colorClass = isUp ? "text-stock-up" : isDown ? "text-stock-down" : "text-stock-flat"
  const sign = isUp ? "▲ " : isDown ? "▼ " : ""
  const absValue = Math.abs(value)
  const absPercent = changePercent !== undefined ? Math.abs(changePercent) : 0
  const formattedPrice = currency === "KRW" ? absValue.toLocaleString("ko-KR") : absValue.toFixed(2)

  if (format === "price") {
    return <span className={cn(colorClass, className)}>{showSign && sign}{formattedPrice}</span>
  }
  if (format === "percent") {
    return <span className={cn(colorClass, className)}>{showSign && sign}{absPercent.toFixed(2)}%</span>
  }
  return (
    <span className={cn(colorClass, className)}>
      {showSign && sign}{formattedPrice} ({absPercent.toFixed(2)}%)
    </span>
  )
}
