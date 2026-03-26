import { cn } from "@/lib/utils"

interface IndexItem {
  name: string
  label?: string
  value: number
  change: number
  changePercent: number
}

function formatValue(v: number) {
  return v >= 100 ? v.toLocaleString("ko-KR", { maximumFractionDigits: 2 }) : v.toFixed(2)
}

function CompactItem({ name, label, value, changePercent }: IndexItem) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
      <span className="text-xs font-medium">{label ?? name}</span>
      <span className="text-xs tabular-nums">{formatValue(value)}</span>
      <span
        className={cn(
          "text-xs tabular-nums",
          changePercent > 0 && "text-stock-up",
          changePercent < 0 && "text-stock-down",
          changePercent === 0 && "text-muted-foreground"
        )}
      >
        {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
      </span>
    </div>
  )
}

const EXCHANGE_LABELS: Record<string, string> = {
  "USD/KRW": "USD",
  "EUR/KRW": "EUR",
  "JPY/KRW": "JPY",
  "CNY/KRW": "CNY",
  "GBP/KRW": "GBP",
}

export function CompactIndexBar({
  indices,
  exchangeRates,
}: {
  indices: IndexItem[]
  exchangeRates: Array<{ pair: string; rate: number; change: number; changePercent: number }>
}) {
  const usdRate = exchangeRates.find((r) => r.pair === "USD/KRW")

  return (
    <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-2 mb-6 border-b">
      {indices.map((idx) => (
        <CompactItem key={idx.name} {...idx} />
      ))}
      {usdRate && (
        <>
          <div className="w-px h-4 bg-border shrink-0" />
          <CompactItem
            name={usdRate.pair}
            label={EXCHANGE_LABELS[usdRate.pair]}
            value={usdRate.rate}
            change={usdRate.change}
            changePercent={usdRate.changePercent}
          />
        </>
      )}
    </div>
  )
}
