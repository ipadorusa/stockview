"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import type { StockDetail } from "@/types/stock"
import type { IndicatorData } from "@/lib/queries/stock-queries"

const StockChart = dynamic(
  () => import("@/components/stock/stock-chart").then((m) => m.StockChart),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-lg" /> }
)

const IndicatorSummary = dynamic(
  () => import("@/components/stock/indicator-summary").then((m) => m.IndicatorSummary),
  { ssr: false }
)

interface Props {
  ticker: string
  stock: StockDetail
  indicatorData: IndicatorData | null
}

export function ChartTabClient({ ticker, stock, indicatorData }: Props) {
  const currency = stock.market === "KR" ? "KRW" : "USD"

  return (
    <>
      <StockChart ticker={ticker} />
      {indicatorData && stock.quote && (
        <div className="mt-6">
          <IndicatorSummary
            ma5={indicatorData.ma5}
            ma20={indicatorData.ma20}
            rsi14={indicatorData.rsi14}
            avgVolume20={indicatorData.avgVolume20}
            currentPrice={stock.quote.price}
            currentVolume={stock.quote.volume}
            currency={currency}
            mfi14={indicatorData.mfi14}
            adx14={indicatorData.adx14}
            sarIsUpTrend={indicatorData.sarIsUpTrend}
            haSignal={indicatorData.haSignal}
            compositeSignal={indicatorData.compositeSignal}
            macd={indicatorData.macd}
            bollingerBands={indicatorData.bollingerBands}
            stochastic={indicatorData.stochastic}
            obvTrend={indicatorData.obvTrend}
            atr14={indicatorData.atr14}
            candlePatterns={indicatorData.candlePatterns}
          />
        </div>
      )}
    </>
  )
}
