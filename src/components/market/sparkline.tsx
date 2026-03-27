"use client"

import { cn } from "@/lib/utils"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  strokeWidth?: number
}

export function Sparkline({ data, width = 80, height = 32, className, strokeWidth = 1.5 }: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  const isUp = data[data.length - 1] >= data[0]
  const strokeColor = isUp ? "var(--color-stock-up)" : "var(--color-stock-down)"

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
