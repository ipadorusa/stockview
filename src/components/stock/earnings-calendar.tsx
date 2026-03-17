"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

interface EarningsData {
  reportDate: string
  quarter: string
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: number | null
  revenueActual: number | null
}

interface EarningsCalendarProps {
  ticker: string
}

function fRev(v: number | null) {
  if (v == null) return "-"
  if (v >= 1_000_000_000_000) return (v / 1_000_000_000_000).toFixed(1) + "조"
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B"
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + "M"
  return v.toLocaleString()
}

export function EarningsCalendar({ ticker }: EarningsCalendarProps) {
  const { data, isLoading } = useQuery<{ earnings: EarningsData[] }>({
    queryKey: ["earnings", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/earnings`)
      return res.json()
    },
    staleTime: 24 * 60 * 60 * 1000,
  })

  if (isLoading) return <div className="text-sm text-muted-foreground py-4">로딩 중...</div>
  if (!data?.earnings?.length) {
    return <div className="text-center py-8 text-muted-foreground text-sm">실적 데이터가 없습니다</div>
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">분기</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">EPS 예상</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">EPS 실제</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">매출</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.earnings.map((e) => {
            const epsBeat = e.epsActual != null && e.epsEstimate != null && e.epsActual > e.epsEstimate
            const epsMiss = e.epsActual != null && e.epsEstimate != null && e.epsActual < e.epsEstimate
            return (
              <tr key={e.quarter} className="hover:bg-accent/30">
                <td className="px-3 py-2">
                  <p className="font-mono text-xs">{e.quarter}</p>
                  <p className="text-xs text-muted-foreground">{e.reportDate}</p>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {e.epsEstimate != null ? e.epsEstimate.toFixed(2) : "-"}
                </td>
                <td className={cn(
                  "px-3 py-2 text-right font-mono text-xs",
                  epsBeat && "text-stock-up",
                  epsMiss && "text-stock-down",
                )}>
                  {e.epsActual != null ? e.epsActual.toFixed(2) : "-"}
                  {epsBeat && " ✓"}
                  {epsMiss && " ✗"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fRev(e.revenueActual)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
