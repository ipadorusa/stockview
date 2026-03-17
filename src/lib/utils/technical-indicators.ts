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
 * OBV (On Balance Volume)
 * 상승일 +volume, 하락일 -volume 누적
 */
export function calculateOBV(closes: number[], volumes: number[]): number[] {
  const obv: number[] = [0]
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv.push(obv[i - 1] + volumes[i])
    else if (closes[i] < closes[i - 1]) obv.push(obv[i - 1] - volumes[i])
    else obv.push(obv[i - 1])
  }
  return obv
}

/**
 * ATR (Average True Range)
 * TR = max(H-L, |H-prevC|, |L-prevC|), ATR = TR의 period일 이동평균
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): (number | null)[] {
  const len = closes.length
  if (len < 2) return closes.map(() => null)

  const tr: number[] = [highs[0] - lows[0]]
  for (let i = 1; i < len; i++) {
    tr.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    )
  }

  const atr: (number | null)[] = new Array(len).fill(null)
  if (len < period) return atr

  let sum = 0
  for (let i = 0; i < period; i++) sum += tr[i]
  atr[period - 1] = sum / period

  for (let i = period; i < len; i++) {
    atr[i] = ((atr[i - 1] as number) * (period - 1) + tr[i]) / period
  }
  return atr
}

/**
 * 피보나치 되돌림 수준 계산
 * 주어진 고점/저점 기준 23.6%, 38.2%, 50%, 61.8%, 78.6% 레벨 반환
 */
export function calculateFibonacciLevels(
  highs: number[],
  lows: number[]
): { level: number; price: number; label: string }[] {
  const high = Math.max(...highs)
  const low = Math.min(...lows)
  const diff = high - low

  const levels = [
    { ratio: 0, label: "0%" },
    { ratio: 0.236, label: "23.6%" },
    { ratio: 0.382, label: "38.2%" },
    { ratio: 0.5, label: "50%" },
    { ratio: 0.618, label: "61.8%" },
    { ratio: 0.786, label: "78.6%" },
    { ratio: 1, label: "100%" },
  ]

  return levels.map(({ ratio, label }) => ({
    level: ratio,
    price: high - diff * ratio,
    label,
  }))
}

/**
 * 캔들 패턴 인식
 * @returns 패턴이 감지된 인덱스와 패턴 이름/신호 배열
 */
export interface CandlePattern {
  index: number
  name: string
  nameKr: string
  signal: "bullish" | "bearish"
}

export function detectCandlePatterns(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[]
): CandlePattern[] {
  const patterns: CandlePattern[] = []
  const len = closes.length

  for (let i = 1; i < len; i++) {
    const o = opens[i], h = highs[i], l = lows[i], c = closes[i]
    const body = Math.abs(c - o)
    const range = h - l
    if (range === 0) continue

    const upperShadow = h - Math.max(o, c)
    const lowerShadow = Math.min(o, c) - l
    const bodyRatio = body / range

    // 도지 (Doji): 몸통이 전체 범위의 10% 미만
    if (bodyRatio < 0.1 && range > 0) {
      patterns.push({ index: i, name: "Doji", nameKr: "도지", signal: "bearish" })
      continue
    }

    // 망치형 (Hammer): 하락 추세 후, 아래꼬리 몸통의 2배 이상, 윗꼬리 작음
    if (
      closes[i - 1] > closes[i - 1] * 0 && // always true guard
      lowerShadow >= body * 2 &&
      upperShadow <= body * 0.3 &&
      i >= 2 &&
      closes[i - 1] < closes[i - 2] // 이전 하락
    ) {
      patterns.push({ index: i, name: "Hammer", nameKr: "망치형", signal: "bullish" })
      continue
    }

    // 교수형 (Hanging Man): 상승 추세 후, 아래꼬리 몸통의 2배 이상
    if (
      lowerShadow >= body * 2 &&
      upperShadow <= body * 0.3 &&
      i >= 2 &&
      closes[i - 1] > closes[i - 2] // 이전 상승
    ) {
      patterns.push({ index: i, name: "Hanging Man", nameKr: "교수형", signal: "bearish" })
      continue
    }

    // 장악형 (Engulfing)
    if (i >= 1) {
      const prevO = opens[i - 1], prevC = closes[i - 1]
      const prevBody = Math.abs(prevC - prevO)

      // 상승 장악형: 이전 음봉 + 현재 양봉이 이전 몸통을 완전히 감싸
      if (prevC < prevO && c > o && body > prevBody && o <= prevC && c >= prevO) {
        patterns.push({ index: i, name: "Bullish Engulfing", nameKr: "상승장악형", signal: "bullish" })
        continue
      }
      // 하락 장악형: 이전 양봉 + 현재 음봉이 이전 몸통을 완전히 감싸
      if (prevC > prevO && c < o && body > prevBody && o >= prevC && c <= prevO) {
        patterns.push({ index: i, name: "Bearish Engulfing", nameKr: "하락장악형", signal: "bearish" })
        continue
      }
    }

    // 유성형 (Shooting Star): 상승 추세 후, 윗꼬리 몸통의 2배 이상, 아래꼬리 작음
    if (
      upperShadow >= body * 2 &&
      lowerShadow <= body * 0.3 &&
      i >= 2 &&
      closes[i - 1] > closes[i - 2]
    ) {
      patterns.push({ index: i, name: "Shooting Star", nameKr: "유성형", signal: "bearish" })
    }
  }

  return patterns
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
