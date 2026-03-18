"use client"

import { cn } from "@/lib/utils"
import { interpretRSI, interpretMFI, interpretADX, interpretParabolicSAR, type HeikinAshiSignal, type CompositeSignal } from "@/lib/utils/technical-indicators"

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
  haSignal?: HeikinAshiSignal | null
  compositeSignal?: CompositeSignal | null
}

function fv(val: number | null, currency?: "KRW" | "USD") {
  if (val == null) return "-"
  if (currency === "KRW") return val.toLocaleString("ko-KR") + "원"
  if (currency === "USD") return "$" + val.toFixed(2)
  return val.toLocaleString()
}

export function IndicatorSummary({
  ma5, ma20, ma60, rsi14, avgVolume20, currentPrice, currentVolume, currency = "KRW",
  mfi14 = null, adx14 = null, sarIsUpTrend = null, haSignal = null, compositeSignal = null,
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
      {(mfi14 != null || adx14 != null || sarIsUpTrend != null) && (
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
        </div>
      )}

      {/* 하이킨아시 분석 */}
      {haSignal != null && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">하이킨아시 분석</h4>

          {/* Signal header row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={cn("text-sm font-semibold", haSignal.color)}>
                {haSignal.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {haSignal.streak > 0 ? `${haSignal.streak}봉 연속` : "—"}
              </span>
              {/* Strength dots (out of 3) */}
              <span className="flex gap-0.5" aria-label={`강도 ${haSignal.strength}/3`}>
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-sm leading-none",
                      i <= haSignal.strength ? haSignal.color : "text-muted-foreground/30"
                    )}
                  >
                    {i <= haSignal.strength ? "●" : "○"}
                  </span>
                ))}
              </span>
            </div>

            {/* Description */}
            {haSignal.description && (
              <p className="text-xs text-muted-foreground italic leading-snug">
                &ldquo;{haSignal.description}&rdquo;
              </p>
            )}
          </div>

          {/* Streak visualization */}
          {haSignal.streak > 0 && (
            <div className="bg-background/50 rounded-md p-2.5 space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">최근 추세</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      haSignal.type === "up" || haSignal.type === "strong_up"
                        ? "bg-stock-up"
                        : haSignal.type === "down" || haSignal.type === "strong_down"
                          ? "bg-stock-down"
                          : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min((haSignal.streak / 10) * 100, 100)}%` }}
                  />
                </div>
                <span className={cn("text-xs whitespace-nowrap", haSignal.color)}>
                  {haSignal.streak}봉 연속{" "}
                  {haSignal.type === "up" || haSignal.type === "strong_up"
                    ? "상승"
                    : haSignal.type === "down" || haSignal.type === "strong_down"
                      ? "하락"
                      : "중립"}
                </span>
              </div>
            </div>
          )}

          {/* Composite signal */}
          {compositeSignal != null && (
            <div className="bg-background/50 rounded-md p-2.5 space-y-2">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">복합 신호</span>

              {/* Action badge + confidence */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full border",
                  compositeSignal.action === "buy"
                    ? "bg-stock-up/10 text-stock-up border-stock-up/20"
                    : compositeSignal.action === "sell"
                      ? "bg-stock-down/10 text-stock-down border-stock-down/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                )}>
                  {compositeSignal.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  신뢰도 {compositeSignal.confidence}%
                </span>
              </div>

              {/* Confidence bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    compositeSignal.action === "buy"
                      ? "bg-stock-up"
                      : compositeSignal.action === "sell"
                        ? "bg-stock-down"
                        : "bg-amber-500"
                  )}
                  style={{ width: `${compositeSignal.confidence}%` }}
                />
              </div>

              {/* Reasons */}
              {compositeSignal.reasons && compositeSignal.reasons.length > 0 && (
                <ul className="space-y-0.5">
                  {compositeSignal.reasons.slice(0, 4).map((reason, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="mt-px shrink-0">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground/60 text-center">
            ⓘ 투자 참고용이며 투자 조언이 아닙니다
          </p>
        </div>
      )}
    </div>
  )
}
