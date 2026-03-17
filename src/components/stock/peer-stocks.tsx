"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { PriceChangeText } from "@/components/common/price-change-text"

interface Peer {
  ticker: string
  name: string
  price: number
  changePercent: number
  marketCap: number | null
}

interface PeerStocksProps {
  ticker: string
  market: "KR" | "US"
}

function fMCap(v: number | null) {
  if (!v) return "-"
  if (v >= 1_000_000_000_000) return (v / 1_000_000_000_000).toFixed(1) + "조"
  if (v >= 100_000_000) return (v / 100_000_000).toFixed(0) + "억"
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + "M"
  return v.toLocaleString()
}

export function PeerStocks({ ticker, market }: PeerStocksProps) {
  const { data, isError } = useQuery<{ sector: string; peers: Peer[] }>({
    queryKey: ["peers", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/peers`)
      return res.json()
    },
    staleTime: 30 * 60 * 1000,
  })

  if (isError) return <div className="text-sm text-destructive">동종 종목을 불러올 수 없습니다</div>
  if (!data?.peers?.length) return null

  const currency = market === "KR" ? "KRW" : "USD"

  return (
    <div>
      <h3 className="font-semibold text-sm mb-2">동종 종목 ({data.sector})</h3>
      <div className="divide-y border rounded-lg overflow-hidden">
        {data.peers.slice(0, 5).map((peer) => (
          <Link
            key={peer.ticker}
            href={`/stock/${peer.ticker}`}
            className="flex items-center justify-between px-3 py-2.5 hover:bg-accent/50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">{peer.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{peer.ticker}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono">
                {currency === "KRW" ? peer.price.toLocaleString("ko-KR") + "원" : "$" + peer.price.toFixed(2)}
              </p>
              <div className="flex items-center gap-2">
                <PriceChangeText value={peer.changePercent} changePercent={peer.changePercent} format="percent" className="text-xs" />
                <span className="text-xs text-muted-foreground">{fMCap(peer.marketCap)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
