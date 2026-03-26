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

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  // Intl.DateTimeFormat 대신 수동 포맷 (SSR/CSR 일관성)
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000 - d.getTimezoneOffset() * 60 * 1000)
  const m = kst.getUTCMonth() + 1
  const day = kst.getUTCDate()
  const hh = String(kst.getUTCHours()).padStart(2, "0")
  const mm = String(kst.getUTCMinutes()).padStart(2, "0")
  return `${m}.${day} ${hh}:${mm}`
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
          거래대금 기준{krUpdatedAt ? ` · ${formatDate(krUpdatedAt)} 기준` : ""}
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
          거래대금 기준{usUpdatedAt ? ` · ${formatDate(usUpdatedAt)} 기준` : ""}
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
