"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"

interface Sector {
  name: string
  avgChangePercent: number
  stockCount: number
}

interface SectorStock {
  ticker: string
  name: string
  price: number
  changePercent: number
  volume: number
}

interface SectorPerformanceProps {
  market: "KR" | "US"
}

function SectorStockList({ sector, market }: { sector: string; market: "KR" | "US" }) {
  const { data, isLoading, isError } = useQuery<{ stocks: SectorStock[] }>({
    queryKey: ["sector-stocks", market, sector],
    queryFn: async () => {
      const res = await fetch(
        `/api/market/sectors/${encodeURIComponent(sector)}/stocks?market=${market}`
      )
      return res.json()
    },
    staleTime: 15 * 60 * 1000,
  })

  if (isLoading) return (
    <div className="space-y-2 mt-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 rounded bg-muted animate-pulse" />
      ))}
    </div>
  )
  if (isError) return <p className="text-sm text-destructive mt-4">데이터를 불러올 수 없습니다</p>
  if (!data?.stocks?.length) return <p className="text-sm text-muted-foreground mt-4">종목 없음</p>

  return (
    <div className="mt-4 space-y-1 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 pb-1 text-xs text-muted-foreground border-b">
        <span>종목</span>
        <span className="text-right w-20">현재가</span>
        <span className="text-right w-16">등락률</span>
      </div>
      {data.stocks.map((s) => {
        const isUp = s.changePercent > 0
        const isDown = s.changePercent < 0
        return (
          <Link
            key={s.ticker}
            href={`/stock/${s.ticker}`}
            className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 py-1.5 rounded hover:bg-muted/60 transition-colors"
          >
            <span className="text-sm truncate">{s.name}</span>
            <span className="text-sm font-mono text-right w-20">
              {s.price.toLocaleString()}
            </span>
            <span className={cn(
              "text-sm font-mono text-right w-16",
              isUp && "text-stock-up",
              isDown && "text-stock-down",
            )}>
              {isUp ? "+" : ""}{s.changePercent.toFixed(2)}%
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export function SectorPerformance({ market }: SectorPerformanceProps) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

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
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {data.sectors.map((sector) => {
          const isUp = sector.avgChangePercent > 0
          const isDown = sector.avgChangePercent < 0
          return (
            <button
              key={sector.name}
              onClick={() => setSelectedSector(sector.name)}
              className={cn(
                "rounded-lg p-3 border text-left transition-opacity hover:opacity-80 cursor-pointer",
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
            </button>
          )
        })}
      </div>

      <Dialog open={!!selectedSector} onOpenChange={(open) => !open && setSelectedSector(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedSector}</DialogTitle>
          </DialogHeader>
          {selectedSector && (
            <SectorStockList sector={selectedSector} market={market} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
