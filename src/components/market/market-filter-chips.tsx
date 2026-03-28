"use client"

import { useState } from "react"
import { StockRow } from "@/components/market/stock-row"
import { SectorPerformance } from "@/components/market/sector-performance"

type Market = "KR" | "US"
type Filter = "all" | "gainers" | "losers" | "sector"

interface Mover {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface MarketFilterChipsProps {
  krMovers: { gainers: Mover[]; losers: Mover[] }
  usMovers: { gainers: Mover[]; losers: Mover[] }
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "gainers", label: "상승 TOP" },
  { value: "losers", label: "하락 TOP" },
  { value: "sector", label: "섹터" },
]

const MARKETS: { value: Market; label: string }[] = [
  { value: "KR", label: "한국" },
  { value: "US", label: "미국" },
]

export function MarketFilterChips({ krMovers, usMovers }: MarketFilterChipsProps) {
  const [filter, setFilter] = useState<Filter>("all")
  const [market, setMarket] = useState<Market>("KR")

  const movers = market === "KR" ? krMovers : usMovers

  return (
    <div>
      {/* Market tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {MARKETS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMarket(m.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              market === m.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {filter === "sector" ? (
        <SectorPerformance market={market} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(filter === "all" || filter === "gainers") && (
            <div>
              <h2 className="font-semibold mb-2 text-stock-up">상승 종목 TOP 5</h2>
              <div className="divide-y border rounded-lg overflow-hidden">
                {movers.gainers.map((s, i) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={s.change} changePercent={s.changePercent} market={market} rank={i + 1} />
                ))}
              </div>
            </div>
          )}
          {(filter === "all" || filter === "losers") && (
            <div>
              <h2 className="font-semibold mb-2 text-stock-down">하락 종목 TOP 5</h2>
              <div className="divide-y border rounded-lg overflow-hidden">
                {movers.losers.map((s, i) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={s.change} changePercent={s.changePercent} market={market} rank={i + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
