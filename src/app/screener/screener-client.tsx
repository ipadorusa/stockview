"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { trackEvent } from "@/lib/gtm"
import { cn } from "@/lib/utils"
import type { SignalType, ScreenerStock } from "@/lib/screener"

const SIGNALS: { id: SignalType; label: string; desc: string }[] = [
  { id: "golden_cross", label: "골든크로스", desc: "MA5가 MA20을 상향 돌파" },
  { id: "rsi_oversold", label: "RSI 과매도", desc: "RSI < 35 이후 반등 전환" },
  { id: "volume_surge", label: "거래량 급증", desc: "당일 거래량 > 20일 평균 × 2" },
  { id: "bollinger_bounce", label: "볼린저 반등", desc: "하단밴드 근접 후 상승 전환" },
  { id: "macd_cross", label: "MACD 크로스", desc: "MACD가 시그널선 상향 돌파" },
]

const fetchScreener = (m: string, s: string) =>
  fetch(`/api/screener?market=${m}&signal=${s}`).then((r) => r.json())

export function ScreenerClient() {
  const [market, setMarket] = useState<"KR" | "US">("KR")
  const [signal, setSignal] = useState<SignalType>("golden_cross")
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery<{
    stocks: ScreenerStock[]
    total: number
  }>({
    queryKey: ["screener", market, signal],
    queryFn: () => fetchScreener(market, signal),
    staleTime: 15 * 60 * 1000,
  })

  const handleMarketChange = (m: "KR" | "US") => {
    setMarket(m)
    trackEvent("screener_filter", { market: m, signal })
    queryClient.prefetchQuery({
      queryKey: ["screener", m, signal],
      queryFn: () => fetchScreener(m, signal),
      staleTime: 15 * 60 * 1000,
    })
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => {
        SIGNALS.filter((s) => s.id !== signal).forEach((s) => {
          queryClient.prefetchQuery({
            queryKey: ["screener", m, s.id],
            queryFn: () => fetchScreener(m, s.id),
            staleTime: 15 * 60 * 1000,
          })
        })
      })
    }
  }

  return (
    <div className="space-y-6">
      <GtmPageView pageData={{ page_name: "screener" }} />
      <div>
        <h1 className="text-2xl font-bold">스크리너</h1>
        <p className="text-sm text-muted-foreground mt-1">기술적 분석 기반 종목 선별</p>
      </div>

      {/* 마켓 토글 */}
      <div className="flex gap-2">
        {(["KR", "US"] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleMarketChange(m)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              market === m
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground border-border hover:bg-accent/50"
            )}
          >
            {m === "KR" ? "한국" : "미국"}
          </button>
        ))}
      </div>

      {/* 시그널 탭 */}
      <div className="flex flex-wrap gap-2">
        {SIGNALS.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSignal(s.id); trackEvent("screener_filter", { market, signal: s.id }) }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm border transition-colors text-left",
              signal === s.id
                ? "bg-primary/10 border-primary/30 text-primary font-medium"
                : "text-muted-foreground border-border hover:bg-accent/50"
            )}
          >
            <span className="block font-medium">{s.label}</span>
            <span className="block text-xs opacity-70">{s.desc}</span>
          </button>
        ))}
      </div>

      {/* 결과 */}
      <div>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive">데이터를 불러올 수 없습니다</p>
        )}
        {!isLoading && !isError && (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              조건 충족 종목 {data?.total ?? 0}개 중 상위 {data?.stocks.length ?? 0}개
            </p>
            {data?.stocks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">조건에 해당하는 종목이 없습니다</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs text-muted-foreground bg-muted/40 border-b">
                  <span>종목</span>
                  <span className="text-right w-24">현재가</span>
                  <span className="text-right w-16">등락률</span>
                  <span className="text-right w-20 hidden sm:block">거래량</span>
                </div>
                {data?.stocks.map((stock) => {
                  const isUp = stock.changePercent > 0
                  const isDown = stock.changePercent < 0
                  return (
                    <Link
                      key={stock.ticker}
                      href={`/stock/${stock.ticker}`}
                      className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium">{stock.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">{stock.ticker}</span>
                      </div>
                      <span className="text-sm font-mono text-right w-24">
                        {stock.price.toLocaleString()}
                      </span>
                      <span className={cn(
                        "text-sm font-mono text-right w-16",
                        isUp && "text-stock-up",
                        isDown && "text-stock-down",
                      )}>
                        {isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
                      </span>
                      <span className="text-xs text-muted-foreground text-right w-20 hidden sm:block">
                        {stock.volume.toLocaleString()}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
