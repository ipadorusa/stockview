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

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 24
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ")
  return (
    <svg width={w} height={h} className="mt-1">
      <polyline fill="none" stroke={up ? "var(--color-stock-up)" : "var(--color-stock-down)"} strokeWidth="1.5" points={points} />
    </svg>
  )
}

export function IndexWidgetCard({
  index,
  value,
  change,
  changePercent,
  sparkline,
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
        {sparkline && <Sparkline data={sparkline} up={change >= 0} />}
      </CardContent>
    </Card>
  )
}
