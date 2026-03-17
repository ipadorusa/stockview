"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

interface Sector {
  name: string
  avgChangePercent: number
  stockCount: number
}

interface SectorPerformanceProps {
  market: "KR" | "US"
}

export function SectorPerformance({ market }: SectorPerformanceProps) {
  const { data, isLoading, isError } = useQuery<{ sectors: Sector[] }>({
    queryKey: ["sectors", market],
    queryFn: async () => {
      const res = await fetch(`/api/market/sectors?market=${market}`)
      return res.json()
    },
    staleTime: 15 * 60 * 1000,
  })

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[72px] rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
  if (isError) return <div className="text-sm text-destructive">섹터 데이터를 불러올 수 없습니다</div>
  if (!data?.sectors?.length) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {data.sectors.map((sector) => {
        const isUp = sector.avgChangePercent > 0
        const isDown = sector.avgChangePercent < 0
        return (
          <div
            key={sector.name}
            className={cn(
              "rounded-lg p-3 border",
              isUp && "border-stock-up/20 bg-stock-up/5",
              isDown && "border-stock-down/20 bg-stock-down/5",
              !isUp && !isDown && "border-border bg-muted/30"
            )}
          >
            <p className="text-xs font-medium truncate">{sector.name}</p>
            <p className={cn(
              "text-sm font-mono font-semibold mt-0.5",
              isUp && "text-stock-up",
              isDown && "text-stock-down",
            )}>
              {isUp ? "+" : ""}{sector.avgChangePercent.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">{sector.stockCount}종목</p>
          </div>
        )
      })}
    </div>
  )
}
