/**
 * 기술적 지표 계산 순수 함수
 */

/**
 * 이동평균 (Moving Average)
 * @param prices close 가격 배열 (시간순)
 * @param period 기간
 */
export function calculateMA(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null
    const slice = prices.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

/**
 * RSI (Relative Strength Index)
 * @param prices close 가격 배열 (시간순)
 * @param period 기간 (기본 14)
 */
export function calculateRSI(prices: number[], period = 14): (number | null)[] {
  if (prices.length < period + 1) return prices.map(() => null)

  const rsi: (number | null)[] = new Array(prices.length).fill(null)
  const gains: number[] = []
  const losses: number[] = []

  // 초기 변동 계산
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }

  let avgGain = gains.reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.reduce((a, b) => a + b, 0) / period

  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  // 이후 Wilder's smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }

  return rsi
}

/**
 * 평균 거래량
 * @param volumes 거래량 배열 (시간순)
 * @param period 기간 (기본 20)
 */
export function calculateAvgVolume(volumes: bigint[], period = 20): (bigint | null)[] {
  return volumes.map((_, i) => {
    if (i < period - 1) return null
    const slice = volumes.slice(i - period + 1, i + 1)
    const sum = slice.reduce((a, b) => a + b, 0n)
    return sum / BigInt(period)
  })
}

/**
 * MA 기반 매수/매도 신호 해석
 */
export function interpretMASignal(price: number, ma5: number | null, ma20: number | null, ma60: number | null): string {
  const signals: string[] = []

  if (ma5 != null && ma20 != null) {
    if (ma5 > ma20) signals.push("단기 골든크로스")
    else signals.push("단기 데드크로스")
  }

  if (ma20 != null && ma60 != null) {
    if (ma20 > ma60) signals.push("중기 상승 추세")
    else signals.push("중기 하락 추세")
  }

  if (ma20 != null) {
    if (price > ma20) signals.push("20일선 위")
    else signals.push("20일선 아래")
  }

  return signals.join(" · ") || "신호 없음"
}

/**
 * RSI 해석
 */
export function interpretRSI(rsi: number | null): { label: string; color: string } {
  if (rsi == null) return { label: "-", color: "text-muted-foreground" }
  if (rsi >= 70) return { label: "과매수", color: "text-stock-up" }
  if (rsi <= 30) return { label: "과매도", color: "text-stock-down" }
  return { label: "중립", color: "text-muted-foreground" }
}
