import { getStockPeers } from "@/lib/queries/stock-queries"
import { StockInfoGrid } from "@/components/stock/stock-info-grid"
import { CompanyOverview } from "@/components/stock/company-overview"
import Link from "next/link"
import { PriceChangeText } from "@/components/common/price-change-text"
import type { StockDetail } from "@/types/stock"

interface Props {
  ticker: string
  stock: StockDetail
}

function fMCap(v: number | null) {
  if (!v) return "-"
  if (v >= 1_000_000_000_000) return (v / 1_000_000_000_000).toFixed(1) + "조"
  if (v >= 100_000_000) return (v / 100_000_000).toFixed(0) + "억"
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + "M"
  return v.toLocaleString()
}

export async function InfoTabServer({ ticker, stock }: Props) {
  const peersData = await getStockPeers(ticker)
  const currency = stock.market === "KR" ? "KRW" : "USD"

  return (
    <>
      {stock.quote && (
        <StockInfoGrid
          data={{
            open: stock.quote.open,
            high: stock.quote.high,
            low: stock.quote.low,
            volume: stock.quote.volume,
            high52w: stock.quote.high52w,
            low52w: stock.quote.low52w,
            marketCap: stock.quote.marketCap,
            per: stock.quote.per,
            pbr: stock.quote.pbr,
          }}
          fundamental={
            stock.fundamental
              ? {
                  eps: stock.fundamental.eps,
                  dividendYield: stock.fundamental.dividendYield,
                  roe: stock.fundamental.roe,
                  debtToEquity: stock.fundamental.debtToEquity,
                  beta: stock.fundamental.beta,
                  revenue: stock.fundamental.revenue,
                  netIncome: stock.fundamental.netIncome,
                  employeeCount: stock.fundamental.employeeCount,
                }
              : null
          }
          currency={currency}
          stockType={stock.stockType}
        />
      )}

      {stock.fundamental?.description && (
        <CompanyOverview description={stock.fundamental.description} />
      )}

      {peersData.peers.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-sm mb-2">동종 종목 ({peersData.sector})</h3>
          <div className="divide-y border rounded-lg overflow-hidden">
            {peersData.peers.slice(0, 5).map((peer) => (
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
                    {currency === "KRW"
                      ? peer.price.toLocaleString("ko-KR") + "원"
                      : "$" + peer.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2">
                    <PriceChangeText
                      value={peer.changePercent}
                      changePercent={peer.changePercent}
                      format="percent"
                      className="text-xs"
                    />
                    <span className="text-xs text-muted-foreground">{fMCap(peer.marketCap)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
