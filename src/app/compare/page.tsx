"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AdSlot } from "@/components/ads/ad-slot"
import { cn } from "@/lib/utils"

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
      if (value >= 1e8) return `${(value / 1e8).toFixed(0)}억`
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
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

export default function ComparePage() {
  const [ticker1, setTicker1] = useState("")
  const [ticker2, setTicker2] = useState("")
  const [searchTicker1, setSearchTicker1] = useState("")
  const [searchTicker2, setSearchTicker2] = useState("")

  const { data: stock1, isLoading: loading1 } = useQuery({
    queryKey: ["compare", searchTicker1],
    queryFn: () => fetchStock(searchTicker1),
    enabled: !!searchTicker1,
  })

  const { data: stock2, isLoading: loading2 } = useQuery({
    queryKey: ["compare", searchTicker2],
    queryFn: () => fetchStock(searchTicker2),
    enabled: !!searchTicker2,
  })

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchTicker1(ticker1.trim().toUpperCase())
    setSearchTicker2(ticker2.trim().toUpperCase())
  }

  const isLoading = loading1 || loading2
  const hasResults = stock1 && stock2

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-2">종목 비교</h1>
      <p className="text-sm text-muted-foreground mb-6">두 종목의 주요 지표를 비교해 보세요</p>

      <form onSubmit={handleCompare} className="flex flex-col sm:flex-row gap-3 mb-8">
        <Input
          placeholder="종목코드 (예: 005930)"
          value={ticker1}
          onChange={(e) => setTicker1(e.target.value)}
          className="flex-1"
        />
        <span className="self-center text-muted-foreground font-bold">vs</span>
        <Input
          placeholder="종목코드 (예: 000660)"
          value={ticker2}
          onChange={(e) => setTicker2(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!ticker1 || !ticker2}>비교</Button>
      </form>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {hasResults && (
        <div className="rounded-lg border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-0 bg-muted/40 border-b">
            <div className="px-4 py-3 text-sm font-semibold">지표</div>
            <div className="px-4 py-3 text-sm font-semibold text-center border-l">
              <Link href={`/stock/${stock1.ticker}`} className="hover:text-primary">
                {stock1.name}
                <span className="ml-1 text-xs text-muted-foreground font-mono">({stock1.ticker})</span>
              </Link>
            </div>
            <div className="px-4 py-3 text-sm font-semibold text-center border-l">
              <Link href={`/stock/${stock2.ticker}`} className="hover:text-primary">
                {stock2.name}
                <span className="ml-1 text-xs text-muted-foreground font-mono">({stock2.ticker})</span>
              </Link>
            </div>
          </div>

          {/* Rows */}
          {COMPARE_ROWS.map((row) => {
            const v1 = getNestedValue(stock1, row.key)
            const v2 = getNestedValue(stock2, row.key)
            return (
              <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr] gap-0 border-b last:border-0">
                <div className="px-4 py-3 text-sm text-muted-foreground">{row.label}</div>
                <div className={cn("px-4 py-3 text-sm font-mono text-center border-l",
                  row.key === "quote.changePercent" && v1 != null && (v1 > 0 ? "text-stock-up" : v1 < 0 ? "text-stock-down" : ""),
                )}>
                  {formatValue(v1, row.format)}
                </div>
                <div className={cn("px-4 py-3 text-sm font-mono text-center border-l",
                  row.key === "quote.changePercent" && v2 != null && (v2 > 0 ? "text-stock-up" : v2 < 0 ? "text-stock-down" : ""),
                )}>
                  {formatValue(v2, row.format)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && searchTicker1 && !stock1 && (
        <p className="text-sm text-destructive">"{searchTicker1}" 종목을 찾을 수 없습니다</p>
      )}
      {!isLoading && searchTicker2 && !stock2 && (
        <p className="text-sm text-destructive">"{searchTicker2}" 종목을 찾을 수 없습니다</p>
      )}

      <AdSlot slot="compare-bottom" format="rectangle" className="my-6" />
    </PageContainer>
  )
}
