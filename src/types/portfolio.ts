import type { Market, StockType } from "./stock"

export interface PortfolioItem {
  id: string
  ticker: string
  name: string
  market: Market
  stockType: StockType
  buyPrice: number
  quantity: number
  buyDate: string | null
  memo: string | null
  groupName: string | null
  currentPrice: number
  change: number
  changePercent: number
  profitLoss: number
  profitLossPercent: number
  totalValue: number
  totalCost: number
  totalProfitLoss: number
  addedAt: string
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalProfitLoss: number
  count: number
}
