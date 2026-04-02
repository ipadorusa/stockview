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

function formatUpdatedAt(iso: string | null | undefined) {
  if (!iso) return ""
  const d = new Date(iso)
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
  const m = kst.getMonth() + 1
  const dd = kst.getDate()
  return `${m}.${dd} 장마감`
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
          거래대금 기준 · {formatUpdatedAt(krUpdatedAt)}
        </p>
        <div className="divide-y rounded-lg border overflow-hidden">
          {krStocks.length > 0 ? (
            krStocks.map((stock, i) => (
              <StockRow
                key={stock.ticker}
                ticker={stock.ticker}
                name={stock.name}
                price={stock.price}
                change={stock.change}
                changePercent={stock.changePercent}
                market={stock.market}
                rank={i + 1}
                tradingValue={stock.tradingValue}
              />
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="us">
        <p className="text-xs text-muted-foreground mb-2">
          거래대금 기준 · {formatUpdatedAt(usUpdatedAt)}
        </p>
        <div className="divide-y rounded-lg border overflow-hidden">
          {usStocks.length > 0 ? (
            usStocks.map((stock, i) => (
              <StockRow
                key={stock.ticker}
                ticker={stock.ticker}
                name={stock.name}
                price={stock.price}
                change={stock.change}
                changePercent={stock.changePercent}
                market={stock.market}
                rank={i + 1}
                tradingValue={stock.tradingValue}
              />
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
