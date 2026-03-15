import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  price: number
  change: number
  changePercent: number
  currency: "KRW" | "USD"
  preMarketPrice?: number | null
  postMarketPrice?: number | null
}

export function PriceDisplay({ price, change, changePercent, currency, preMarketPrice, postMarketPrice }: PriceDisplayProps) {
  const colorClass = change > 0 ? "text-stock-up" : change < 0 ? "text-stock-down" : "text-stock-flat"
  const sign = change > 0 ? "▲" : change < 0 ? "▼" : "-"
  const formatPrice = (p: number) => currency === "KRW" ? p.toLocaleString("ko-KR") + "원" : "$" + p.toFixed(2)
  const ext = postMarketPrice || preMarketPrice
  const extLabel = postMarketPrice ? "장후" : "장전"
  const extChange = ext ? ((ext - price) / price) * 100 : null

  return (
    <div>
      <p className="text-3xl font-bold font-mono">{formatPrice(price)}</p>
      <p className={cn("text-lg font-medium mt-1", colorClass)}>
        {sign} {Math.abs(change).toLocaleString()} ({Math.abs(changePercent).toFixed(2)}%)
      </p>
      {ext && extChange !== null && (
        <p className="text-sm text-muted-foreground mt-1">
          {extLabel} <span className="font-mono">{formatPrice(ext)}</span>{" "}
          <span className={extChange >= 0 ? "text-stock-up" : "text-stock-down"}>
            ({extChange >= 0 ? "+" : ""}{extChange.toFixed(2)}%)
          </span>
        </p>
      )}
    </div>
  )
}
