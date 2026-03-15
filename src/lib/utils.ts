import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: "KRW" | "USD" = "KRW"): string {
  if (currency === "KRW") {
    return price.toLocaleString("ko-KR") + "원"
  }
  return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatChange(change: number, changePercent: number, currency: "KRW" | "USD" = "KRW"): string {
  const sign = change >= 0 ? "▲" : "▼"
  const absChange = Math.abs(change)
  const absPercent = Math.abs(changePercent)
  const formattedChange = currency === "KRW"
    ? absChange.toLocaleString("ko-KR")
    : absChange.toFixed(2)
  return `${sign} ${formattedChange} (${absPercent.toFixed(2)}%)`
}

export function formatVolume(volume: number): string {
  if (volume >= 100000000) return (volume / 100000000).toFixed(1) + "억"
  if (volume >= 10000) return (volume / 10000).toFixed(1) + "만"
  return volume.toLocaleString("ko-KR")
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1000000000000) return (marketCap / 1000000000000).toFixed(1) + "조"
  if (marketCap >= 100000000) return (marketCap / 100000000).toFixed(0) + "억"
  return marketCap.toLocaleString("ko-KR")
}
