import { cn } from "@/lib/utils"

interface ExchangeRate {
  pair: string
  rate: number
  change: number
  changePercent: number
}

interface ExchangeRateWidgetProps {
  rates: ExchangeRate[]
}

const PAIR_LABELS: Record<string, string> = {
  "USD/KRW": "달러",
  "EUR/KRW": "유로",
  "JPY/KRW": "엔(100)",
  "CNY/KRW": "위안",
  "GBP/KRW": "파운드",
}

function formatRate(v: number) {
  return v >= 100
    ? v.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
    : v.toFixed(2)
}

export function ExchangeRateWidget({ rates }: ExchangeRateWidgetProps) {
  if (!rates.length) return null

  return (
    <div className="flex flex-col gap-2">
      {rates.map((rate) => {
        const trend = rate.changePercent > 0 ? "up" : rate.changePercent < 0 ? "down" : "flat"

        return (
          <div
            key={rate.pair}
            className="card-stat"
            data-trend={trend === "flat" ? undefined : trend}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--fg-tertiary)]">
                  {PAIR_LABELS[rate.pair] ?? rate.pair}
                </p>
                <p className="font-mono font-bold tabular-nums text-sm text-[var(--fg-primary)] mt-0.5">
                  {formatRate(rate.rate)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "font-mono text-xs tabular-nums font-medium",
                    trend === "up" && "text-stock-up",
                    trend === "down" && "text-stock-down",
                    trend === "flat" && "text-[var(--fg-muted)]"
                  )}
                >
                  {rate.change >= 0 ? "+" : ""}
                  {formatRate(rate.change)}
                </p>
                <p
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    trend === "up" && "text-stock-up",
                    trend === "down" && "text-stock-down",
                    trend === "flat" && "text-[var(--fg-muted)]"
                  )}
                >
                  {rate.changePercent >= 0 ? "+" : ""}
                  {rate.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
