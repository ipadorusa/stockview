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
 * 지수이동평균 (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): (number | null)[] {
  if (prices.length < period) return prices.map(() => null)
  const result: (number | null)[] = new Array(prices.length).fill(null)
  const k = 2 / (period + 1)

  // 첫 EMA = 첫 period개의 SMA
  let sum = 0
  for (let i = 0; i < period; i++) sum += prices[i]
  result[period - 1] = sum / period

  for (let i = period; i < prices.length; i++) {
    result[i] = prices[i] * k + (result[i - 1] as number) * (1 - k)
  }
  return result
}

/**
 * MACD (Moving Average Convergence Divergence)
 * @returns { macdLine, signal, histogram } 각각 배열
 */
export function calculateMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macdLine: (number | null)[]
  signal: (number | null)[]
  histogram: (number | null)[]
} {
  const emaFast = calculateEMA(prices, fastPeriod)
  const emaSlow = calculateEMA(prices, slowPeriod)

  const macdLine: (number | null)[] = prices.map((_, i) => {
    if (emaFast[i] == null || emaSlow[i] == null) return null
    return (emaFast[i] as number) - (emaSlow[i] as number)
  })

  // MACD 값만 추출하여 signal EMA 계산
  const macdValues: number[] = []
  const macdStartIdx: number[] = []
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] != null) {
      macdValues.push(macdLine[i] as number)
      macdStartIdx.push(i)
    }
  }

  const signalRaw = calculateEMA(macdValues, signalPeriod)
  const signal: (number | null)[] = new Array(prices.length).fill(null)
  const histogram: (number | null)[] = new Array(prices.length).fill(null)

  for (let j = 0; j < macdValues.length; j++) {
    const idx = macdStartIdx[j]
    signal[idx] = signalRaw[j]
    if (signalRaw[j] != null && macdLine[idx] != null) {
      histogram[idx] = (macdLine[idx] as number) - (signalRaw[j] as number)
    }
  }

  return { macdLine, signal, histogram }
}

/**
 * Bollinger Bands
 * @returns { upper, middle, lower } 각각 배열
 */
export function calculateBollingerBands(
  prices: number[],
  period = 20,
  stdDev = 2
): {
  upper: (number | null)[]
  middle: (number | null)[]
  lower: (number | null)[]
} {
  const middle = calculateMA(prices, period)
  const upper: (number | null)[] = new Array(prices.length).fill(null)
  const lower: (number | null)[] = new Array(prices.length).fill(null)

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = middle[i] as number
    const variance = slice.reduce((sum, p) => sum + (p - mean) ** 2, 0) / period
    const sd = Math.sqrt(variance)
    upper[i] = mean + stdDev * sd
    lower[i] = mean - stdDev * sd
  }

  return { upper, middle, lower }
}

/**
 * Stochastic Oscillator
 * @returns { k, d } 각각 배열
 */
export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod = 14,
  dPeriod = 3
): {
  k: (number | null)[]
  d: (number | null)[]
} {
  const len = closes.length
  const kValues: (number | null)[] = new Array(len).fill(null)
  const dValues: (number | null)[] = new Array(len).fill(null)

  for (let i = kPeriod - 1; i < len; i++) {
    const highSlice = highs.slice(i - kPeriod + 1, i + 1)
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1)
    const hh = Math.max(...highSlice)
    const ll = Math.min(...lowSlice)
    kValues[i] = hh === ll ? 50 : ((closes[i] - ll) / (hh - ll)) * 100
  }

  // %D = SMA of %K
  for (let i = kPeriod - 1 + dPeriod - 1; i < len; i++) {
    let sum = 0
    let count = 0
    for (let j = i - dPeriod + 1; j <= i; j++) {
      if (kValues[j] != null) { sum += kValues[j] as number; count++ }
    }
    dValues[i] = count === dPeriod ? sum / dPeriod : null
  }

  return { k: kValues, d: dValues }
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
