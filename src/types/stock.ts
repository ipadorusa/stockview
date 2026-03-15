export type Market = "KR" | "US"

export interface StockSearchResult {
  ticker: string
  name: string
  market: Market
  exchange: string
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

export interface StockDetail {
  ticker: string
  name: string
  nameEn?: string
  market: Market
  exchange: string
  sector?: string
  quote: StockQuote
}

export interface OHLCV {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ChartData {
  ticker: string
  period: "1W" | "2W" | "3W"
  data: OHLCV[]
}

export interface WatchlistItem {
  ticker: string
  name: string
  market: Market
  price: number
  change: number
  changePercent: number
  addedAt: string
}
