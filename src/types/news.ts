export type NewsCategory = "KR_MARKET" | "US_MARKET" | "INDUSTRY" | "ECONOMY"

export type NewsSentiment = "positive" | "negative" | "neutral"

export interface NewsItem {
  id: string
  title: string
  summary?: string
  source: string
  imageUrl?: string
  category: NewsCategory
  sentiment?: NewsSentiment | null
  publishedAt: string
  url: string
  relatedTickers?: string[]
}

export interface NewsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface NewsResponse {
  news: NewsItem[]
  pagination: NewsPagination
}
