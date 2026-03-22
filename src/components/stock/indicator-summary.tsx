"use client"

import { cn } from "@/lib/utils"
import { TooltipHelper } from "@/components/common/tooltip-helper"
import { interpretRSI, interpretMFI, interpretADX, interpretParabolicSAR, type HeikinAshiSignal, type CompositeSignal, type CandlePattern } from "@/lib/utils/technical-indicators"

const INDICATOR_TERMS: Record<string, string> = {
  MA: "이동평균선(MA)은 일정 기간 동안 종가의 평균값이에요. 현재가가 이동평균선 위에 있으면 상승 추세, 아래에 있으면 하락 추세로 해석해요.",
  "RSI(14)": "상대강도지수(RSI)는 14일간 주가 상승/하락 폭을 비교한 지표에요. 70 이상이면 과매수(매도 고려), 30 이하면 과매도(매수 고려) 구간이에요.",
  "거래량 비율": "현재 거래량을 20일 평균 거래량과 비교한 비율이에요. 100% 이상이면 평소보다 거래가 활발한 것을 의미해요.",
  "MFI(14)": "자금흐름지수(MFI)는 거래량을 반영한 RSI에요. 80 이상이면 과매수, 20 이하면 과매도 신호로 해석해요.",
  "ADX(14)": "평균방향지수(ADX)는 추세의 강도를 나타내요. 25 이상이면 뚜렷한 추세, 20 이하면 횡보장으로 해석해요.",
  "Parabolic SAR": "포물선 SAR은 추세 전환점을 찾는 지표에요. 상승 추세(↑)에서는 매수 유지, 하락 추세(↓)에서는 매도 신호로 해석해요.",
  "하이킨아시": "하이킨아시는 캔들차트를 평활화하여 추세를 명확하게 보여주는 기법이에요. 양봉 연속이면 상승 추세, 음봉 연속이면 하락 추세를 의미해요.",
  "크로스 신호": "단기 이동평균(MA5)이 장기 이동평균(MA20)을 상향 돌파하면 골든크로스(매수 신호), 하향 돌파하면 데드크로스(매도 신호)에요.",
  MACD: "MACD는 단기(12일)와 장기(26일) 이동평균의 차이로 추세 전환을 감지해요. MACD선이 시그널선을 상향 돌파하면 매수, 하향 돌파하면 매도 신호에요.",
  "볼린저 밴드": "볼린저 밴드는 이동평균 ± 표준편차 2배로 구성된 밴드에요. 주가가 상단에 가까우면 과매수, 하단에 가까우면 과매도 가능성이 있어요.",
  스토캐스틱: "스토캐스틱은 일정 기간의 최고가/최저가 대비 현재 종가 위치를 나타내요. 80 이상이면 과매수, 20 이하면 과매도 구간이에요.",
  OBV: "OBV(거래량 균형)는 거래량의 누적 흐름을 보여줘요. OBV 상승은 매집(매수세 유입), 하락은 분산(매도세 유출)을 의미해요.",
  ATR: "ATR(평균진폭)은 14일간 주가 변동폭의 평균이에요. ATR이 클수록 변동성이 높아 위험과 기회가 모두 큰 상태에요.",
  "캔들 패턴": "캔들 패턴은 주가 봉차트의 모양으로 향후 방향을 예측하는 기법이에요. 특정 패턴이 나타나면 추세 전환 가능성을 시사해요.",
}

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
  macd?: { macdLine: number | null; signal: number | null; histogram: number | null } | null
  bollingerBands?: { upper: number | null; middle: number | null; lower: number | null } | null
  stochastic?: { k: number | null; d: number | null } | null
  obvTrend?: "up" | "down" | null
  atr14?: number | null
  candlePatterns?: CandlePattern[]
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
  macd = null, bollingerBands = null, stochastic = null, obvTrend = null, atr14 = null, candlePatterns = [],
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
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <TooltipHelper term={item.label} description={INDICATOR_TERMS.MA} />
              </div>
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
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">RSI(14)</span>
            <TooltipHelper term="RSI(14)" description={INDICATOR_TERMS["RSI(14)"]} />
          </div>
          <p className="font-mono text-sm mt-0.5">{rsi14 != null ? rsi14.toFixed(1) : "-"}</p>
          <span className={cn("text-xs", rsiInfo.color)}>{rsiInfo.label}</span>
        </div>
        <div className="bg-muted/50 rounded-lg p-2.5">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">거래량 비율</span>
            <TooltipHelper term="거래량 비율" description={INDICATOR_TERMS["거래량 비율"]} />
          </div>
          <p className="font-mono text-sm mt-0.5">{volumeRatio ?? "-"}</p>
          <span className="text-xs text-muted-foreground">vs 20일 평균</span>
        </div>
      </div>

      {crossSignal && (
        <div className={cn(
          "text-xs px-3 py-1.5 rounded-md flex items-center gap-1",
          ma5! > ma20! ? "bg-stock-up/10 text-stock-up" : "bg-stock-down/10 text-stock-down"
        )}>
          {crossSignal}
          <TooltipHelper term="크로스 신호" description={INDICATOR_TERMS["크로스 신호"]} />
        </div>
      )}

      {/* 추가 지표 */}
      {(mfi14 != null || adx14 != null || sarIsUpTrend != null) && (
        <div className="grid grid-cols-3 gap-2">
          {mfi14 != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">MFI(14)</span>
                <TooltipHelper term="MFI(14)" description={INDICATOR_TERMS["MFI(14)"]} />
              </div>
              <p className="font-mono text-sm mt-0.5">{mfi14.toFixed(1)}</p>
              <span className={cn("text-xs", mfiInfo.color)}>{mfiInfo.label}</span>
            </div>
          )}
          {adx14 != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">ADX(14)</span>
                <TooltipHelper term="ADX(14)" description={INDICATOR_TERMS["ADX(14)"]} />
              </div>
              <p className="font-mono text-sm mt-0.5">{adx14.toFixed(1)}</p>
              <span className={cn("text-xs", adxInfo.color)}>{adxInfo.label}</span>
            </div>
          )}
          {sarIsUpTrend != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Parabolic SAR</span>
                <TooltipHelper term="Parabolic SAR" description={INDICATOR_TERMS["Parabolic SAR"]} />
              </div>
              <p className="font-mono text-sm mt-0.5">{sarIsUpTrend ? "↑" : "↓"}</p>
              <span className={cn("text-xs", sarInfo.color)}>{sarInfo.label}</span>
            </div>
          )}
        </div>
      )}

      {/* MACD · 볼린저 · 스토캐스틱 */}
      {(macd || bollingerBands || stochastic) && (
        <div className="grid grid-cols-3 gap-2">
          {macd && macd.macdLine != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">MACD</span>
                <TooltipHelper term="MACD" description={INDICATOR_TERMS.MACD} />
              </div>
              <p className="font-mono text-sm mt-0.5">{macd.macdLine.toFixed(2)}</p>
              <span className={cn("text-xs",
                macd.histogram != null && macd.histogram > 0 ? "text-stock-up" : "text-stock-down"
              )}>
                {macd.histogram != null && macd.histogram > 0 ? "매수 우위" : "매도 우위"}
              </span>
            </div>
          )}
          {bollingerBands && bollingerBands.upper != null && bollingerBands.lower != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">볼린저 밴드</span>
                <TooltipHelper term="볼린저 밴드" description={INDICATOR_TERMS["볼린저 밴드"]} />
              </div>
              <p className="font-mono text-sm mt-0.5">
                {(() => {
                  const range = bollingerBands.upper! - bollingerBands.lower!
                  const pos = range > 0 ? ((currentPrice - bollingerBands.lower!) / range * 100).toFixed(0) : "50"
                  return `${pos}%`
                })()}
              </p>
              <span className={cn("text-xs",
                currentPrice >= bollingerBands.upper! * 0.98 ? "text-stock-up" :
                currentPrice <= bollingerBands.lower! * 1.02 ? "text-stock-down" :
                "text-muted-foreground"
              )}>
                {currentPrice >= bollingerBands.upper! * 0.98 ? "상단 근처" :
                 currentPrice <= bollingerBands.lower! * 1.02 ? "하단 근처" :
                 "중심 근처"}
              </span>
            </div>
          )}
          {stochastic && stochastic.k != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">스토캐스틱</span>
                <TooltipHelper term="스토캐스틱" description={INDICATOR_TERMS["스토캐스틱"]} />
              </div>
              <p className="font-mono text-sm mt-0.5">
                %K {stochastic.k.toFixed(0)}
                {stochastic.d != null && <span className="text-muted-foreground"> / %D {stochastic.d.toFixed(0)}</span>}
              </p>
              <span className={cn("text-xs",
                stochastic.k > 80 ? "text-stock-up" :
                stochastic.k < 20 ? "text-stock-down" :
                "text-muted-foreground"
              )}>
                {stochastic.k > 80 ? "과매수" : stochastic.k < 20 ? "과매도" : "중립"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* OBV · ATR */}
      {(obvTrend != null || atr14 != null) && (
        <div className="grid grid-cols-2 gap-2">
          {obvTrend != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">OBV</span>
                <TooltipHelper term="OBV" description={INDICATOR_TERMS.OBV} />
              </div>
              <p className="font-mono text-sm mt-0.5">{obvTrend === "up" ? "↑" : "↓"}</p>
              <span className={cn("text-xs", obvTrend === "up" ? "text-stock-up" : "text-stock-down")}>
                {obvTrend === "up" ? "매집 (유입)" : "분산 (유출)"}
              </span>
            </div>
          )}
          {atr14 != null && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">ATR(14)</span>
                <TooltipHelper term="ATR" description={INDICATOR_TERMS.ATR} />
              </div>
              <p className="font-mono text-sm mt-0.5">{fv(atr14, currency)}</p>
              <span className="text-xs text-muted-foreground">
                {currentPrice > 0 ? `변동률 ${(atr14 / currentPrice * 100).toFixed(1)}%` : "-"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 캔들 패턴 */}
      {candlePatterns && candlePatterns.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">캔들 패턴 감지</h4>
            <TooltipHelper term="캔들 패턴" description={INDICATOR_TERMS["캔들 패턴"]} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candlePatterns.slice(0, 5).map((p, idx) => (
              <span
                key={idx}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  p.signal === "bullish"
                    ? "bg-stock-up/10 text-stock-up border-stock-up/20"
                    : "bg-stock-down/10 text-stock-down border-stock-down/20"
                )}
              >
                {p.nameKr} {p.signal === "bullish" ? "↑" : "↓"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 하이킨아시 분석 */}
      {haSignal != null && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">하이킨아시 분석</h4>
            <TooltipHelper term="하이킨아시" description={INDICATOR_TERMS["하이킨아시"]} />
          </div>

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
