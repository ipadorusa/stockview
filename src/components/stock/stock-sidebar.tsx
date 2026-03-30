"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import type { StockDetail } from "@/types/stock"
import { PriceChangeText } from "@/components/common/price-change-text"

interface Peer {
  ticker: string
  name: string
  price: number
  changePercent: number
  marketCap: number | null
}

interface StockSidebarProps {
  stock: StockDetail
}

function formatMarketCap(v: number, market: "KR" | "US"): string {
  if (market === "KR") {
    if (v >= 1_000_000_000_000) return (v / 1_000_000_000_000).toFixed(1) + "조"
    if (v >= 100_000_000) return (v / 100_000_000).toFixed(0) + "억"
    return v.toLocaleString("ko-KR") + "원"
  } else {
    if (v >= 1_000_000_000_000) return "$" + (v / 1_000_000_000_000).toFixed(2) + "T"
    if (v >= 1_000_000_000) return "$" + (v / 1_000_000_000).toFixed(1) + "B"
    if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M"
    return "$" + v.toLocaleString()
  }
}

function StatItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null) return null
  return (
    <div className="flex flex-col gap-0.5 p-3">
      <span className="text-xs text-[var(--fg-tertiary)]">{label}</span>
      <span className="font-mono font-medium text-sm text-[var(--fg-primary)]">{value}</span>
    </div>
  )
}

export function StockSidebar({ stock }: StockSidebarProps) {
  const { quote, fundamental, market, ticker } = stock
  const currency = market === "KR" ? "KRW" : "USD"

  const { data: peersData } = useQuery<{ sector: string; peers: Peer[] }>({
    queryKey: ["peers", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/peers`)
      return res.json()
    },
    staleTime: 30 * 60 * 1000,
  })

  // 52주 레인지 계산
  const range52w =
    quote?.high52w != null && quote?.low52w != null && quote?.price != null
      ? {
          low: quote.low52w,
          high: quote.high52w,
          current: quote.price,
          pct: Math.max(
            0,
            Math.min(
              100,
              ((quote.price - quote.low52w) / (quote.high52w - quote.low52w)) * 100
            )
          ),
        }
      : null

  // 핵심 지표 목록
  const stats: { label: string; value: string | null | undefined }[] = [
    {
      label: "시가총액",
      value:
        quote?.marketCap != null
          ? formatMarketCap(quote.marketCap, market)
          : null,
    },
    {
      label: "PER",
      value: quote?.per != null ? quote.per.toFixed(2) + "x" : null,
    },
    {
      label: "PBR",
      value: quote?.pbr != null ? quote.pbr.toFixed(2) + "x" : null,
    },
    {
      label: "EPS",
      value:
        fundamental?.eps != null
          ? currency === "KRW"
            ? fundamental.eps.toLocaleString("ko-KR") + "원"
            : "$" + fundamental.eps.toFixed(2)
          : null,
    },
    {
      label: "배당수익률",
      value:
        fundamental?.dividendYield != null
          ? fundamental.dividendYield.toFixed(2) + "%"
          : null,
    },
    {
      label: "ROE",
      value: fundamental?.roe != null ? fundamental.roe.toFixed(1) + "%" : null,
    },
    {
      label: "베타",
      value: fundamental?.beta != null ? fundamental.beta.toFixed(2) : null,
    },
    {
      label: "부채비율",
      value:
        fundamental?.debtToEquity != null
          ? fundamental.debtToEquity.toFixed(1) + "%"
          : null,
    },
  ].filter((s) => s.value != null)

  return (
    <aside className="lg:sticky lg:top-[80px] space-y-4">
      {/* 핵심 지표 그리드 */}
      {stats.length > 0 && (
        <div className="card-default rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--fg-primary)]">핵심 지표</h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border-subtle)]">
            {stats.map((s) => (
              <StatItem key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </div>
      )}

      {/* 52주 레인지 */}
      {range52w && (
        <div className="card-default rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-3">52주 범위</h3>
          <div className="relative h-2 bg-[var(--border-subtle)] rounded-full">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 shadow-sm border-2 border-white dark:border-gray-900 z-10"
              style={{ left: `calc(${range52w.pct}% - 6px)` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-blue-200 dark:bg-blue-900/40"
              style={{ width: `${range52w.pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <div className="text-left">
              <p className="text-xs text-[var(--fg-tertiary)]">52주 저가</p>
              <p className="text-sm font-mono font-medium text-[var(--fg-primary)]">
                {currency === "KRW"
                  ? range52w.low.toLocaleString("ko-KR") + "원"
                  : "$" + range52w.low.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--fg-tertiary)]">52주 고가</p>
              <p className="text-sm font-mono font-medium text-[var(--fg-primary)]">
                {currency === "KRW"
                  ? range52w.high.toLocaleString("ko-KR") + "원"
                  : "$" + range52w.high.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 관련 종목 */}
      {peersData?.peers && peersData.peers.length > 0 && (
        <div className="card-default rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--fg-primary)]">
              관련 종목
              {peersData.sector && (
                <span className="ml-1 text-xs font-normal text-[var(--fg-tertiary)]">
                  ({peersData.sector})
                </span>
              )}
            </h3>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {peersData.peers.slice(0, 5).map((peer) => (
              <Link
                key={peer.ticker}
                href={`/stock/${peer.ticker}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="min-w-0 mr-2">
                  <p className="text-sm font-medium truncate text-[var(--fg-primary)]">{peer.name}</p>
                  <p className="text-xs text-[var(--fg-tertiary)] font-mono">{peer.ticker}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono text-[var(--fg-primary)]">
                    {currency === "KRW"
                      ? peer.price.toLocaleString("ko-KR") + "원"
                      : "$" + peer.price.toFixed(2)}
                  </p>
                  <PriceChangeText
                    value={peer.changePercent}
                    changePercent={peer.changePercent}
                    format="percent"
                    className="text-xs"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
