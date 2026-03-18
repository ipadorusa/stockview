"use client"

import { cn } from "@/lib/utils"
import { interpretRSI, interpretMFI, interpretADX, interpretParabolicSAR } from "@/lib/utils/technical-indicators"

interface IndicatorSummaryProps {
  ma5: number | null
  ma20: number | null
  ma60: number | null
  rsi14: number | null
  avgVolume20: number | null
  currentPrice: number
  currentVolume: number
  currency?: "KRW" | "USD"
  mfi14?: number | null
  adx14?: number | null
  sarIsUpTrend?: boolean | null
  haSignal?: { label: string; color: string; streak: number } | null
}

function fv(val: number | null, currency?: "KRW" | "USD") {
  if (val == null) return "-"
  if (currency === "KRW") return val.toLocaleString("ko-KR") + "원"
  if (currency === "USD") return "$" + val.toFixed(2)
  return val.toLocaleString()
}

export function IndicatorSummary({
  ma5, ma20, ma60, rsi14, avgVolume20, currentPrice, currentVolume, currency = "KRW",
  mfi14 = null, adx14 = null, sarIsUpTrend = null, haSignal = null,
}: IndicatorSummaryProps) {
  const rsiInfo = interpretRSI(rsi14)
  const mfiInfo = interpretMFI(mfi14)
  const adxInfo = interpretADX(adx14)
  const sarInfo = interpretParabolicSAR(sarIsUpTrend)

  const maItems = [
    { label: "MA5", value: ma5, period: 5 },
    { label: "MA20", value: ma20, period: 20 },
    { label: "MA60", value: ma60, period: 60 },
  ]

  // 골든/데드크로스 판단
  let crossSignal: string | null = null
  if (ma5 != null && ma20 != null) {
    crossSignal = ma5 > ma20 ? "골든크로스 (5>20)" : "데드크로스 (5<20)"
  }

  const volumeRatio = avgVolume20 && avgVolume20 > 0
    ? (currentVolume / Number(avgVolume20) * 100).toFixed(0) + "%"
    : null

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">기술적 지표</h3>

      {/* MA 지표 */}
      <div className="grid grid-cols-3 gap-2">
        {maItems.map((item) => {
          const isAbove = item.value != null && currentPrice > item.value
          return (
            <div key={item.label} className="bg-muted/50 rounded-lg p-2.5">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <p className="font-mono text-sm mt-0.5">{fv(item.value, currency)}</p>
              {item.value != null && (
                <span className={cn("text-xs", isAbove ? "text-stock-up" : "text-stock-down")}>
                  {isAbove ? "▲ 위" : "▼ 아래"}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* RSI + 크로스 신호 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/50 rounded-lg p-2.5">
          <span className="text-xs text-muted-foreground">RSI(14)</span>
          <p className="font-mono text-sm mt-0.5">{rsi14 != null ? rsi14.toFixed(1) : "-"}</p>
          <span className={cn("text-xs", rsiInfo.color)}>{rsiInfo.label}</span>
        </div>
        <div className="bg-muted/50 rounded-lg p-2.5">
          <span className="text-xs text-muted-foreground">거래량 비율</span>
          <p className="font-mono text-sm mt-0.5">{volumeRatio ?? "-"}</p>
          <span className="text-xs text-muted-foreground">vs 20일 평균</span>
        </div>
      </div>

      {crossSignal && (
        <div className={cn(
          "text-xs px-3 py-1.5 rounded-md",
          ma5! > ma20! ? "bg-stock-up/10 text-stock-up" : "bg-stock-down/10 text-stock-down"
        )}>
          {crossSignal}
        </div>
      )}

      {/* 추가 지표 */}
      {(mfi14 != null || adx14 != null || sarIsUpTrend != null || haSignal != null) && (
        <div className="grid grid-cols-3 gap-2">
          {mfi14 != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <span className="text-xs text-muted-foreground">MFI(14)</span>
              <p className="font-mono text-sm mt-0.5">{mfi14.toFixed(1)}</p>
              <span className={cn("text-xs", mfiInfo.color)}>{mfiInfo.label}</span>
            </div>
          )}
          {adx14 != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <span className="text-xs text-muted-foreground">ADX(14)</span>
              <p className="font-mono text-sm mt-0.5">{adx14.toFixed(1)}</p>
              <span className={cn("text-xs", adxInfo.color)}>{adxInfo.label}</span>
            </div>
          )}
          {sarIsUpTrend != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <span className="text-xs text-muted-foreground">Parabolic SAR</span>
              <p className="font-mono text-sm mt-0.5">{sarIsUpTrend ? "↑" : "↓"}</p>
              <span className={cn("text-xs", sarInfo.color)}>{sarInfo.label}</span>
            </div>
          )}
          {haSignal != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <span className="text-xs text-muted-foreground">하이킨아시</span>
              <p className="font-mono text-sm mt-0.5">{haSignal.streak > 0 ? `${haSignal.streak}봉` : "—"}</p>
              <span className={cn("text-xs", haSignal.color)}>{haSignal.label}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
