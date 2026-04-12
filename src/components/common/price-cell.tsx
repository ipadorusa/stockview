"use client"

import { cn } from "@/lib/utils"

type Currency = "KRW" | "USD"

interface PriceCellProps {
  value: number
  changePercent?: number
  currency: Currency
  align?: "left" | "right"
  className?: string
}

const formatters: Record<Currency, (v: number) => string> = {
  KRW: (v) =>
    new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: v >= 1000 ? 0 : 1,
      minimumFractionDigits: v >= 1000 ? 0 : 1,
    }).format(v),
  USD: (v) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v),
}

function getDirectionColor(cp?: number) {
  if (cp === undefined || cp === 0) return "text-stock-flat"
  return cp > 0 ? "text-stock-up" : "text-stock-down"
}

export function PriceCell({
  value,
  changePercent,
  currency,
  align = "right",
  className,
}: PriceCellProps) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums text-sm",
        align === "right" ? "text-right" : "text-left",
        getDirectionColor(changePercent),
        className,
      )}
    >
      {formatters[currency](value)}
    </span>
  )
}
