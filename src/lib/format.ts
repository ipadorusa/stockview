/**
 * Market-aware formatting utilities for stock data display.
 * Consolidates duplicate formatPrice/formatVolume/formatMarketCap across the codebase.
 */

export function formatPrice(price: number, market: string): string {
  if (market === "KR") return price.toLocaleString("ko-KR") + "원"
  return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return String(v)
}

export function formatMarketCap(v: number | null, market: string): string {
  if (v === null) return "-"
  if (market === "KR") {
    if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(0)}조원`
    if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(0)}억원`
    return `${v.toLocaleString()}원`
  }
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  return `$${v.toLocaleString()}`
}
