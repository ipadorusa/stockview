"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Plus, X } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { StockSearchInput } from "@/components/search/stock-search-input"
import { Button } from "@/components/ui/button"
import { AdSlot } from "@/components/ads/ad-slot"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useCompare } from "@/contexts/compare-context"
import type { StockSearchResult } from "@/types/stock"

const CompareChart = dynamic(
  () => import("@/components/stock/compare-chart").then((m) => m.CompareChart),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-lg" /> }
)

const CompareFundamentals = dynamic(
  () => import("@/components/stock/compare-fundamentals").then((m) => m.CompareFundamentals),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-lg" /> }
)

interface StockCompareData {
  ticker: string
  name: string
  market: string
  quote?: {
    price: number
    changePercent: number
    marketCap?: number
    per?: number
    pbr?: number
  }
  fundamental?: {
    dividendYield?: number | null
    roe?: number | null
    eps?: number | null
    revenue?: number | null
    netIncome?: number | null
  } | null
}

async function fetchStock(ticker: string): Promise<StockCompareData | null> {
  const res = await fetch(`/api/stocks/${ticker}`)
  if (!res.ok) return null
  return res.json()
}

function formatValue(value: number | null | undefined, format: "price" | "percent" | "number" | "cap"): string {
  if (value == null) return "-"
  switch (format) {
    case "price": return value.toLocaleString()
    case "percent": return `${value.toFixed(2)}%`
    case "number": return value.toLocaleString()
    case "cap": {
      if (value >= 1e12) return `${(value / 1e12).toFixed(1)}조`
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
      if (value >= 1e8) return `${(value / 1e8).toFixed(0)}억`
      if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`
      return value.toLocaleString()
    }
  }
}

const COMPARE_ROWS: { label: string; key: string; format: "price" | "percent" | "number" | "cap" }[] = [
  { label: "현재가", key: "quote.price", format: "price" },
  { label: "등락률", key: "quote.changePercent", format: "percent" },
  { label: "시가총액", key: "quote.marketCap", format: "cap" },
  { label: "PER", key: "quote.per", format: "number" },
  { label: "PBR", key: "quote.pbr", format: "number" },
  { label: "배당률", key: "fundamental.dividendYield", format: "percent" },
  { label: "ROE", key: "fundamental.roe", format: "percent" },
  { label: "EPS", key: "fundamental.eps", format: "number" },
]

function getNestedValue(obj: StockCompareData, path: string): number | null | undefined {
  const parts = path.split(".")
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current as number | null | undefined
}

const MAX_SLOTS = 4

export default function ComparePage() {
  const [slots, setSlots] = useState<(StockSearchResult | null)[]>([null, null])
  const { compareSlots, addToCompare, removeFromCompare } = useCompare()

  // 컨텍스트에 담긴 종목으로 초기화 (플로팅 바 → 비교 페이지 이동)
  useEffect(() => {
    if (compareSlots.length > 0) {
      const initial: (StockSearchResult | null)[] = compareSlots.map((s) => ({
        ticker: s.ticker,
        name: s.name,
        market: s.market as StockSearchResult["market"],
        exchange: s.market === "KR" ? "KRX" : "NASDAQ",
        stockType: "STOCK" as StockSearchResult["stockType"],
      }))
      while (initial.length < 2) initial.push(null)
      setSlots(initial)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tickers = slots.map((s) => s?.ticker ?? "")

  // Fetch data for each selected stock
  const queries = [
    useQuery({ queryKey: ["compare", tickers[0]], queryFn: () => fetchStock(tickers[0]), enabled: !!tickers[0] }),
    useQuery({ queryKey: ["compare", tickers[1]], queryFn: () => fetchStock(tickers[1]), enabled: !!tickers[1] }),
    useQuery({ queryKey: ["compare", tickers[2]], queryFn: () => fetchStock(tickers[2] ?? ""), enabled: !!tickers[2] }),
    useQuery({ queryKey: ["compare", tickers[3]], queryFn: () => fetchStock(tickers[3] ?? ""), enabled: !!tickers[3] }),
  ]

  const activeSlotCount = slots.length
  const activeQueries = queries.slice(0, activeSlotCount)
  const isLoading = activeQueries.some((q) => q.isLoading && q.fetchStatus !== "idle")
  const stocks = activeQueries.map((q) => q.data).filter(Boolean) as StockCompareData[]
  const hasResults = stocks.length >= 2

  function updateSlot(index: number, stock: StockSearchResult | null) {
    const old = slots[index]
    if (old?.ticker) removeFromCompare(old.ticker)
    if (stock) addToCompare(stock.ticker, stock.name, stock.market)
    setSlots((prev) => {
      const next = [...prev]
      next[index] = stock
      return next
    })
  }

  function addSlot() {
    if (slots.length < MAX_SLOTS) {
      setSlots((prev) => [...prev, null])
    }
  }

  function removeSlot(index: number) {
    if (slots.length <= 2) return
    const removed = slots[index]
    if (removed?.ticker) removeFromCompare(removed.ticker)
    setSlots((prev) => prev.filter((_, i) => i !== index))
  }

  // Grid columns based on active slot count: label + N stock columns
  const gridCols = activeSlotCount === 2
    ? "grid-cols-[1fr_1fr_1fr]"
    : activeSlotCount === 3
      ? "grid-cols-[1fr_1fr_1fr_1fr]"
      : "grid-cols-[1fr_1fr_1fr_1fr_1fr]"

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-2">종목 비교</h1>
      <p className="text-sm text-muted-foreground mb-6">
        최대 {MAX_SLOTS}개 종목의 주요 지표를 비교해 보세요
      </p>

      {/* Search Slots */}
      <div className="space-y-3 mb-8">
        {slots.map((slot, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-6 shrink-0 text-center font-mono">
              {index + 1}
            </span>
            <StockSearchInput
              value={slot}
              onChange={(stock) => updateSlot(index, stock)}
              placeholder={`종목 ${index + 1} 검색...`}
              className="flex-1"
            />
            {slots.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSlot(index)}
                className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {slots.length < MAX_SLOTS && (
          <Button variant="outline" size="sm" onClick={addSlot} className="ml-8">
            <Plus className="h-4 w-4 mr-1" />
            종목 추가
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Comparison Table */}
      {hasResults && (
        <div className="rounded-lg border overflow-x-auto">
          {/* Header */}
          <div className={cn("grid gap-0 bg-muted/40 border-b min-w-fit", gridCols)}>
            <div className="px-4 py-3 text-sm font-semibold">지표</div>
            {stocks.map((stock) => (
              <div key={stock.ticker} className="px-4 py-3 text-sm font-semibold text-center border-l">
                <Link href={`/stock/${stock.ticker}`} className="hover:text-primary">
                  {stock.name}
                  <span className="ml-1 text-xs text-muted-foreground font-mono">({stock.ticker})</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Rows */}
          {COMPARE_ROWS.map((row) => (
            <div key={row.key} className={cn("grid gap-0 border-b last:border-0 min-w-fit", gridCols)}>
              <div className="px-4 py-3 text-sm text-muted-foreground">{row.label}</div>
              {stocks.map((stock) => {
                const v = getNestedValue(stock, row.key)
                return (
                  <div
                    key={stock.ticker}
                    className={cn(
                      "px-4 py-3 text-sm font-mono text-center border-l",
                      row.key === "quote.changePercent" && v != null && (v > 0 ? "text-stock-up" : v < 0 ? "text-stock-down" : ""),
                    )}
                  >
                    {formatValue(v, row.format)}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Price Overlay Chart */}
      {hasResults && (
        <div className="mt-8">
          <CompareChart
            tickers={stocks.map((s) => s.ticker)}
            names={stocks.map((s) => s.name)}
          />
        </div>
      )}

      {/* Fundamental Comparison */}
      {hasResults && (
        <div className="mt-8">
          <CompareFundamentals
            tickers={stocks.map((s) => s.ticker)}
            names={stocks.map((s) => s.name)}
          />
        </div>
      )}

      {/* Error messages */}
      {!isLoading && slots.map((slot, index) => {
        if (!slot) return null
        const q = queries[index]
        if (q.data === null) {
          return (
            <p key={slot.ticker} className="text-sm text-destructive mt-2">
              &quot;{slot.name}&quot; 종목 데이터를 불러올 수 없습니다
            </p>
          )
        }
        return null
      })}

      <AdSlot slot="compare-bottom" format="rectangle" className="my-6" />
    </PageContainer>
  )
}
