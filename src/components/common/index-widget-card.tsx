"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type IndexName = "KOSPI" | "KOSDAQ" | "SP500" | "NASDAQ" | "USDKRW"

interface IndexWidgetCardProps {
  index: IndexName
  value: number
  change: number
  changePercent: number
  sparkline?: number[]
  className?: string
}

const indexVarMap: Record<IndexName, string> = {
  KOSPI: "index-kospi",
  KOSDAQ: "index-kosdaq",
  SP500: "index-sp500",
  NASDAQ: "index-nasdaq",
  USDKRW: "index-usdkrw",
}

function getDirectionColor(v: number) {
  if (v > 0) return "text-stock-up"
  if (v < 0) return "text-stock-down"
  return "text-stock-flat"
}

function formatValue(v: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

export function IndexWidgetCard({
  index,
  value,
  change,
  changePercent,
  className,
}: IndexWidgetCardProps) {
  const sign = change > 0 ? "+" : ""

  return (
    <Card
      className={cn("border-l-[3px]", className)}
      style={{ borderLeftColor: `var(--${indexVarMap[index]})` }}
    >
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {index}
        </span>
        <span className="font-mono text-2xl font-bold tabular-nums">
          {formatValue(value)}
        </span>
        <span className={cn("font-mono text-sm tabular-nums", getDirectionColor(change))}>
          {sign}{formatValue(change)} ({sign}{changePercent.toFixed(2)}%)
        </span>
      </CardContent>
    </Card>
  )
}
