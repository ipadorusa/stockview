export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
  updatedAt: string
}

export interface ExchangeRate {
  pair: string
  rate: number
  change: number
  changePercent: number
  updatedAt: string
}

export interface MoverStock {
  ticker: string
  name: string
  price: number
  changePercent: number
}

export interface MarketMovers {
  gainers: MoverStock[]
  losers: MoverStock[]
}
