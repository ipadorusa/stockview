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
  volume?: number
}

interface PopularStocksTabsProps {
  krStocks: PopularStock[]
  usStocks: PopularStock[]
  krUpdatedAt?: string | null
  usUpdatedAt?: string | null
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
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
          거래량 기준{krUpdatedAt ? ` · ${formatDate(krUpdatedAt)} 기준` : ""}
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
                volume={stock.volume}
              />
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="us">
        <p className="text-xs text-muted-foreground mb-2">
          거래량 기준{usUpdatedAt ? ` · ${formatDate(usUpdatedAt)} 기준` : ""}
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
                volume={stock.volume}
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
