import { getStockIndicators } from "@/lib/queries/stock-queries"
import { ChartTabClient } from "./chart-tab-client"
import type { StockDetail } from "@/types/stock"

interface Props {
  ticker: string
  stock: StockDetail
}

export async function ChartTabServer({ ticker, stock }: Props) {
  const indicatorData = await getStockIndicators(ticker)

  return (
    <ChartTabClient
      ticker={ticker}
      stock={stock}
      indicatorData={indicatorData}
    />
  )
}
