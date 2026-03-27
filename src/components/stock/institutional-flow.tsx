"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface FlowData {
  date: string
  foreignBuy: string
  foreignSell: string
  foreignNet: string
  institutionBuy: string
  institutionSell: string
  institutionNet: string
}

interface ApiResponse {
  ticker: string
  days: number
  data: FlowData[]
}

function formatVolume(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000_000) return (v / 1_000_000_000_000).toFixed(1) + "조"
  if (abs >= 100_000_000) return (v / 100_000_000).toFixed(0) + "억"
  if (abs >= 10_000) return (v / 10_000).toFixed(0) + "만"
  return v.toLocaleString("ko-KR")
}

function NetBar({ value, max }: { value: number; max: number }) {
  if (max === 0) return <div className="h-5" />
  const pct = Math.min(Math.abs(value) / max * 50, 50)
  const isPositive = value > 0

  return (
    <div className="relative h-5 w-full">
      {/* center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
      {isPositive ? (
        <div
          className="absolute top-0.5 bottom-0.5 rounded-r bg-[var(--color-stock-up)]"
          style={{ left: "50%", width: `${pct}%` }}
        />
      ) : (
        <div
          className="absolute top-0.5 bottom-0.5 rounded-l bg-[var(--color-stock-down)]"
          style={{ right: "50%", width: `${pct}%` }}
        />
      )}
    </div>
  )
}

export function InstitutionalFlow({ ticker }: { ticker: string }) {
  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["institutional", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/institutional?days=30`)
      if (!res.ok) throw new Error("수급 데이터를 불러올 수 없습니다")
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (error || !data || data.data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        수급 데이터가 없습니다.
      </div>
    )
  }

  // Sort ascending for chart display
  const sorted = [...data.data].sort((a, b) => a.date.localeCompare(b.date))
  const recent5 = [...data.data].slice(0, 5) // already desc from API

  // Max value for bar scaling
  const allNets = sorted.map((d) => Math.max(Math.abs(Number(d.foreignNet)), Math.abs(Number(d.institutionNet))))
  const maxNet = Math.max(...allNets, 1)

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">외국인·기관 순매수 추이 (30일)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-2 rounded bg-emerald-500" /> 외국인
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-2 rounded bg-amber-500" /> 기관
              </span>
              <span className="ml-auto">
                <span className="text-[var(--color-stock-up)]">▸ 순매수</span>
                {" / "}
                <span className="text-[var(--color-stock-down)]">◂ 순매도</span>
              </span>
            </div>
            {sorted.map((d) => {
              const fNet = Number(d.foreignNet)
              const iNet = Number(d.institutionNet)
              return (
                <div key={d.date} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 text-muted-foreground font-mono">
                    {d.date.slice(5)}
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="w-8 text-right text-emerald-600 dark:text-emerald-400 shrink-0">외</span>
                      <NetBar value={fNet} max={maxNet} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-8 text-right text-amber-600 dark:text-amber-400 shrink-0">기</span>
                      <NetBar value={iNet} max={maxNet} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent 5-day summary table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">최근 5일 수급 요약</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-2">날짜</th>
                <th className="text-right py-2 px-2">외국인 순매수</th>
                <th className="text-right py-2 px-2">기관 순매수</th>
              </tr>
            </thead>
            <tbody>
              {recent5.map((d) => {
                const fNet = Number(d.foreignNet)
                const iNet = Number(d.institutionNet)
                return (
                  <tr key={d.date} className="border-b last:border-0">
                    <td className="py-2 pr-2 font-mono">{d.date}</td>
                    <td className={`text-right py-2 px-2 font-mono ${fNet > 0 ? "text-[var(--color-stock-up)]" : fNet < 0 ? "text-[var(--color-stock-down)]" : ""}`}>
                      {fNet > 0 ? "+" : ""}{formatVolume(fNet)}
                    </td>
                    <td className={`text-right py-2 px-2 font-mono ${iNet > 0 ? "text-[var(--color-stock-up)]" : iNet < 0 ? "text-[var(--color-stock-down)]" : ""}`}>
                      {iNet > 0 ? "+" : ""}{formatVolume(iNet)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
