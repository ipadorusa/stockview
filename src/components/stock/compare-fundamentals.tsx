"use client"

import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface FundamentalHistoryItem {
  quarter: string
  eps: number | null
  revenue: number | null
  netIncome: number | null
  operatingIncome: number | null
}

interface CompareFundamentalsProps {
  tickers: string[]
  names: string[]
}

const COLORS = ["text-blue-600", "text-red-600", "text-emerald-600", "text-amber-600"]

async function fetchFundamentalHistory(ticker: string): Promise<FundamentalHistoryItem[]> {
  const res = await fetch(`/api/stocks/${ticker}/fundamental-history`)
  if (!res.ok) return []
  const json = await res.json()
  return json.history ?? []
}

function formatLargeNumber(value: number | null): string {
  if (value == null) return "-"
  const abs = Math.abs(value)
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1)}조`
  if (abs >= 1e8) return `${(value / 1e8).toFixed(0)}억`
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  return value.toLocaleString()
}

const METRICS: { key: keyof FundamentalHistoryItem; label: string; format: (v: number | null) => string }[] = [
  { key: "eps", label: "EPS", format: (v) => (v == null ? "-" : v.toLocaleString()) },
  { key: "revenue", label: "매출", format: formatLargeNumber },
  { key: "operatingIncome", label: "영업이익", format: formatLargeNumber },
  { key: "netIncome", label: "순이익", format: formatLargeNumber },
]

export function CompareFundamentals({ tickers, names }: CompareFundamentalsProps) {
  const queries = tickers.map((ticker, i) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: ["fundamental-history", ticker],
      queryFn: () => fetchFundamentalHistory(ticker),
      enabled: !!ticker,
      staleTime: 24 * 60 * 60 * 1000,
    })
  )

  const allLoaded = queries.every((q) => !q.isLoading)
  const allData = queries.map((q) => q.data ?? [])

  if (!allLoaded) {
    return <Skeleton className="h-48 w-full rounded-lg" />
  }

  // Find common quarters (recent 8 quarters max)
  const quarterSets = allData.map((data) => new Set(data.map((d) => d.quarter)))
  const allQuarters = [...new Set(allData.flatMap((d) => d.map((item) => item.quarter)))]
    .sort()
    .slice(-8)

  if (allQuarters.length === 0) {
    return null
  }

  // Build lookup maps
  const lookups = allData.map((data) => {
    const map = new Map<string, FundamentalHistoryItem>()
    for (const item of data) map.set(item.quarter, item)
    return map
  })

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">펀더멘탈 비교</h2>
      <p className="text-xs text-muted-foreground">분기별 주요 재무지표</p>

      {METRICS.map((metric) => (
        <div key={metric.key} className="rounded-lg border overflow-x-auto">
          <div className="bg-muted/40 px-4 py-2 border-b">
            <span className="text-sm font-semibold">{metric.label}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium w-24">분기</th>
                  {tickers.map((ticker, i) => (
                    <th key={ticker} className={cn("px-3 py-2 text-right text-xs font-medium", COLORS[i])}>
                      {names[i] ?? ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allQuarters.map((quarter) => (
                  <tr key={quarter} className="border-b last:border-0">
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{quarter}</td>
                    {tickers.map((ticker, i) => {
                      const item = lookups[i].get(quarter)
                      const value = item ? item[metric.key] : null
                      return (
                        <td key={ticker} className="px-3 py-2 text-right text-xs font-mono">
                          {metric.format(value as number | null)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
