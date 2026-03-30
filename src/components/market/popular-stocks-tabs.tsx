"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockRow } from "@/components/market/stock-row"

interface PopularStock {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  market: "KR" | "US"
  tradingValue?: number
}

interface PopularStocksTabsProps {
  krStocks: PopularStock[]
  usStocks: PopularStock[]
  krUpdatedAt?: string | null
  usUpdatedAt?: string | null
}

function formatTradingDate(market: "KR" | "US") {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000

  if (market === "KR") {
    const kst = new Date(utc + 9 * 60 * 60 * 1000)
    const h = kst.getUTCHours()
    // 16:00 KST 이전이면 전 거래일, 이후면 당일
    const candidate = new Date(kst)
    if (h < 16) candidate.setUTCDate(candidate.getUTCDate() - 1)
    // 주말 건너뛰기
    while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
      candidate.setUTCDate(candidate.getUTCDate() - 1)
    }
    const m = candidate.getUTCMonth() + 1
    const d = candidate.getUTCDate()
    return `${m}.${d} 장마감`
  } else {
    const est = new Date(utc - 5 * 60 * 60 * 1000)
    const h = est.getUTCHours()
    const candidate = new Date(est)
    if (h < 18) candidate.setUTCDate(candidate.getUTCDate() - 1)
    while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
      candidate.setUTCDate(candidate.getUTCDate() - 1)
    }
    const m = candidate.getUTCMonth() + 1
    const d = candidate.getUTCDate()
    return `${m}.${d} 장마감`
  }
}

export function PopularStocksTabs({ krStocks, usStocks, krUpdatedAt, usUpdatedAt }: PopularStocksTabsProps) {
  return (
    <Tabs defaultValue="kr">
      <TabsList className="mb-3">
        <TabsTrigger value="kr">한국</TabsTrigger>
        <TabsTrigger value="us">미국</TabsTrigger>
      </TabsList>

      <TabsContent value="kr">
        <p className="text-xs text-muted-foreground mb-2">
          거래대금 기준 · {formatTradingDate("KR")}
        </p>
        <div className="space-y-1">
          {krStocks.length > 0 ? (
            krStocks.map((stock, i) => {
              const maxCp = Math.max(...krStocks.map((s) => Math.abs(s.changePercent)), 1)
              return (
                <div key={stock.ticker} className={i < 3 ? "card-gradient-border" : ""}>
                  <StockRow
                    ticker={stock.ticker}
                    name={stock.name}
                    price={stock.price}
                    change={stock.change}
                    changePercent={stock.changePercent}
                    market={stock.market}
                    rank={i + 1}
                    tradingValue={stock.tradingValue}
                    showVolumeBar
                    maxChangePercent={maxCp}
                  />
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="us">
        <p className="text-xs text-muted-foreground mb-2">
          거래대금 기준 · {formatTradingDate("US")}
        </p>
        <div className="space-y-1">
          {usStocks.length > 0 ? (
            usStocks.map((stock, i) => {
              const maxCp = Math.max(...usStocks.map((s) => Math.abs(s.changePercent)), 1)
              return (
                <div key={stock.ticker} className={i < 3 ? "card-gradient-border" : ""}>
                  <StockRow
                    ticker={stock.ticker}
                    name={stock.name}
                    price={stock.price}
                    change={stock.change}
                    changePercent={stock.changePercent}
                    market={stock.market}
                    rank={i + 1}
                    tradingValue={stock.tradingValue}
                    showVolumeBar
                    maxChangePercent={maxCp}
                  />
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
