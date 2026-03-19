export type Market = "KR" | "US"
export type StockType = "STOCK" | "ETF"

export interface StockSearchResult {
  ticker: string
  name: string
  market: Market
  exchange: string
  stockType: StockType
}

export interface StockQuote {
  price: number
  previousClose: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  marketCap?: number
  high52w?: number
  low52w?: number
  per?: number
  pbr?: number
  preMarketPrice?: number
  postMarketPrice?: number
  updatedAt: string
}

export interface StockFundamental {
  eps: number | null
  forwardEps: number | null
  dividendYield: number | null
  roe: number | null
  debtToEquity: number | null
  beta: number | null
  revenue: number | null
  netIncome: number | null
  description: string | null
  employeeCount: number | null
}

export interface StockDetail {
  ticker: string
  name: string
  nameEn?: string
  market: Market
  exchange: string
  sector?: string
  stockType?: StockType
  quote: StockQuote
  fundamental?: StockFundamental | null
}

export interface OHLCV {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type ChartPeriod = "1W" | "2W" | "3W" | "1M" | "3M" | "6M" | "1Y"

export interface ChartData {
  ticker: string
  period: ChartPeriod
  data: OHLCV[]
}

export interface WatchlistItem {
  ticker: string
  name: string
  market: Market
  stockType: StockType
  price: number
  change: number
  changePercent: number
  addedAt: string
}
