"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StockTableRow {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  market: "KR" | "US"
}

interface StockTableProps {
  stocks: StockTableRow[]
}

type SortKey = "name" | "price" | "changePercent" | "volume" | "marketCap"
type SortDir = "asc" | "desc"

const PAGE_SIZE = 20

function formatNumber(n: number, market: "KR" | "US"): string {
  if (market === "KR") {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }
  return n.toFixed(2)
}

function formatMarketCap(n: number): string {
  if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1) + "조"
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + "억"
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  return n.toLocaleString()
}

function formatVolume(n: number): string {
  if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1) + "조"
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + "억"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 10_000) return (n / 10_000).toFixed(1) + "만"
  return n.toLocaleString()
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 opacity-40" />
  if (sortDir === "asc") return <ChevronUp className="w-3 h-3" />
  return <ChevronDown className="w-3 h-3" />
}

export function StockTable({ stocks }: StockTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("marketCap")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
    setPage(1)
  }

  const sorted = useMemo(() => {
    return [...stocks].sort((a, b) => {
      let av: number | string = 0
      let bv: number | string = 0
      switch (sortKey) {
        case "name":
          av = a.name; bv = b.name
          return sortDir === "asc"
            ? String(av).localeCompare(String(bv), "ko")
            : String(bv).localeCompare(String(av), "ko")
        case "price":
          av = a.price; bv = b.price; break
        case "changePercent":
          av = a.changePercent; bv = b.changePercent; break
        case "volume":
          av = a.volume; bv = b.volume; break
        case "marketCap":
          av = a.marketCap ?? 0; bv = b.marketCap ?? 0; break
      }
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av
      }
      return 0
    })
  }, [stocks, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(0, page * PAGE_SIZE)
  const hasMore = page < totalPages

  const thCls = "px-3 py-2.5 text-xs font-medium text-[var(--fg-secondary)] cursor-pointer select-none hover:text-[var(--fg-primary)] transition-colors"

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] z-10">
          <tr>
            <th
              className={cn(thCls, "text-left sticky left-0 bg-[var(--bg-elevated)] z-20 min-w-[140px]")}
              onClick={() => handleSort("name")}
            >
              <span className="flex items-center gap-1">
                종목명
                <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </th>
            <th className={cn(thCls, "text-right min-w-[90px]")} onClick={() => handleSort("price")}>
              <span className="flex items-center justify-end gap-1">
                현재가
                <SortIcon col="price" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </th>
            <th className={cn(thCls, "text-right min-w-[80px]")} onClick={() => handleSort("changePercent")}>
              <span className="flex items-center justify-end gap-1">
                등락률
                <SortIcon col="changePercent" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </th>
            <th className={cn(thCls, "text-right min-w-[80px]")} onClick={() => handleSort("volume")}>
              <span className="flex items-center justify-end gap-1">
                거래량
                <SortIcon col="volume" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </th>
            <th className={cn(thCls, "text-right min-w-[90px]")} onClick={() => handleSort("marketCap")}>
              <span className="flex items-center justify-end gap-1">
                시가총액
                <SortIcon col="marketCap" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {paged.map((stock) => {
            const isUp = stock.changePercent > 0
            const isDown = stock.changePercent < 0
            const cur = stock.market === "KR" ? "KRW" : "USD"

            return (
              <tr
                key={stock.ticker}
                className="hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                onClick={() => window.location.href = `/stock/${stock.ticker}`}
              >
                <td className="px-3 py-2.5 sticky left-0 bg-[var(--bg-surface)] group-hover:bg-[var(--bg-elevated)] z-10 min-w-[140px]">
                  <Link
                    href={`/stock/${stock.ticker}`}
                    className="flex flex-col hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-medium text-[var(--fg-primary)] truncate max-w-[130px]">{stock.name}</span>
                    <span className="text-xs text-[var(--fg-muted)] font-mono">{stock.ticker}</span>
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--fg-primary)]">
                  {cur === "KRW"
                    ? formatNumber(stock.price, "KR") + "원"
                    : "$" + formatNumber(stock.price, "US")}
                </td>
                <td className={cn(
                  "px-3 py-2.5 text-right font-mono tabular-nums",
                  isUp && "text-stock-up",
                  isDown && "text-stock-down",
                  !isUp && !isDown && "text-[var(--fg-muted)]"
                )}>
                  {isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--fg-secondary)]">
                  {formatVolume(stock.volume)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--fg-secondary)]">
                  {stock.marketCap ? formatMarketCap(stock.marketCap) : "-"}
                </td>
              </tr>
            )
          })}
          {paged.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-[var(--fg-muted)] text-sm">
                데이터가 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {hasMore && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-3 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors font-medium active:scale-[0.98]"
          >
            더 보기 ({sorted.length - paged.length}개 남음)
          </button>
        </div>
      )}
    </div>
  )
}
