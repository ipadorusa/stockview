"use client"

import { useQuery } from "@tanstack/react-query"
import { Sparkline } from "./sparkline"

interface HistoryPoint {
  date: string
  close: number
}

async function fetchIndexHistory(symbol: string, days: number): Promise<number[]> {
  const res = await fetch(`/api/market-indices/history?symbol=${encodeURIComponent(symbol)}&days=${days}`)
  if (!res.ok) return []
  const json = await res.json()
  return (json.data as HistoryPoint[]).map((d) => d.close)
}

const SYMBOL_MAP: Record<string, string> = {
  KOSPI: "^KS11",
  KOSDAQ: "^KQ11",
  SPX: "^GSPC",
  IXIC: "^IXIC",
}

interface IndexSparklineProps {
  symbol: string
  width?: number
  height?: number
  days?: number
}

export function IndexSparkline({ symbol, width = 80, height = 32, days = 30 }: IndexSparklineProps) {
  const apiSymbol = SYMBOL_MAP[symbol] ?? symbol

  const { data } = useQuery({
    queryKey: ["index-history", apiSymbol, days],
    queryFn: () => fetchIndexHistory(apiSymbol, days),
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  if (!data || data.length < 2) return null

  return <Sparkline data={data} width={width} height={height} />
}
