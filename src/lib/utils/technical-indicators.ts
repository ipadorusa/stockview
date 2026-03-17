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
 * ROC (Rate of Change) — 가격 변화율 %
 * @param closes 종가 배열
 * @param period 기간 (기본 12)
 */
export function calculateROC(closes: number[], period = 12): (number | null)[] {
  const len = closes.length
  const result: (number | null)[] = new Array(len).fill(null)
  for (let i = period; i < len; i++) {
    const past = closes[i - period]
    if (past === 0) continue
    result[i] = ((closes[i] - past) / past) * 100
  }
  return result
}

/**
 * MFI (Money Flow Index) — 자금 흐름 지수 (거래량 가중 RSI)
 * @param highs 고가 배열
 * @param lows 저가 배열
 * @param closes 종가 배열
 * @param volumes 거래량 배열
 * @param period 기간 (기본 14)
 */
export function calculateMFI(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  period = 14
): (number | null)[] {
  const len = closes.length
  const result: (number | null)[] = new Array(len).fill(null)
  if (len < period + 1) return result

  // 전형적 가격 (Typical Price)
  const tp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3)
  // 자금 흐름 (Money Flow)
  const mf = tp.map((t, i) => t * volumes[i])

  for (let i = period; i < len; i++) {
    let posFlow = 0
    let negFlow = 0
    for (let j = i - period + 1; j <= i; j++) {
      if (tp[j] > tp[j - 1]) posFlow += mf[j]
      else if (tp[j] < tp[j - 1]) negFlow += mf[j]
    }
    if (negFlow === 0) {
      result[i] = 100
    } else {
      result[i] = 100 - 100 / (1 + posFlow / negFlow)
    }
  }
  return result
}

/**
 * A/D Line (Accumulation/Distribution Line) — 매집/배분선
 * CLV = ((C-L) - (H-C)) / (H-L)
 * AD = prev AD + CLV * Volume
 */
export function calculateADLine(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[]
): number[] {
  const len = closes.length
  const result: number[] = new Array(len).fill(0)
  for (let i = 0; i < len; i++) {
    const hl = highs[i] - lows[i]
    const clv = hl === 0 ? 0 : ((closes[i] - lows[i]) - (highs[i] - closes[i])) / hl
    result[i] = (i === 0 ? 0 : result[i - 1]) + clv * volumes[i]
  }
  return result
}

/**
 * Pivot Points — 일일 지지/저항선
 * PP = (H+L+C)/3, S1=2*PP-H, R1=2*PP-L, S2=PP-(H-L), R2=PP+(H-L)
 */
export interface PivotPoint {
  index: number
  pp: number
  s1: number
  s2: number
  r1: number
  r2: number
}

export function calculatePivotPoints(
  highs: number[],
  lows: number[],
  closes: number[]
): PivotPoint[] {
  const len = closes.length
  const result: PivotPoint[] = []
  for (let i = 0; i < len; i++) {
    const pp = (highs[i] + lows[i] + closes[i]) / 3
    const range = highs[i] - lows[i]
    result.push({
      index: i,
      pp,
      s1: 2 * pp - highs[i],
      s2: pp - range,
      r1: 2 * pp - lows[i],
      r2: pp + range,
    })
  }
  return result
}

/**
 * ADX (Average Directional Index) — 추세 강도
 * +DI, -DI, ADX
 * @param period 기간 (기본 14)
 */
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): { adx: number | null; plusDI: number | null; minusDI: number | null }[] {
  const len = closes.length
  const result: { adx: number | null; plusDI: number | null; minusDI: number | null }[] =
    new Array(len).fill(null).map(() => ({ adx: null, plusDI: null, minusDI: null }))

  if (len < period * 2) return result

  // True Range, +DM, -DM
  const tr: number[] = [highs[0] - lows[0]]
  const plusDM: number[] = [0]
  const minusDM: number[] = [0]

  for (let i = 1; i < len; i++) {
    const trVal = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    )
    tr.push(trVal)

    const upMove = highs[i] - highs[i - 1]
    const downMove = lows[i - 1] - lows[i]
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
  }

  // Wilder's smoothed TR, +DM, -DM
  let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0)
  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0)
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0)

  const calcDI = (dm: number, t: number) => (t === 0 ? 0 : (dm / t) * 100)

  // 초기 DX
  let prevPlusDI = calcDI(smoothPlusDM, smoothTR)
  let prevMinusDI = calcDI(smoothMinusDM, smoothTR)
  const diSum = prevPlusDI + prevMinusDI
  let smoothDX = diSum === 0 ? 0 : (Math.abs(prevPlusDI - prevMinusDI) / diSum) * 100
  const dxArr: number[] = [smoothDX]

  result[period - 1] = { adx: null, plusDI: prevPlusDI, minusDI: prevMinusDI }

  for (let i = period; i < len; i++) {
    smoothTR = smoothTR - smoothTR / period + tr[i]
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i]
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i]

    const pDI = calcDI(smoothPlusDM, smoothTR)
    const mDI = calcDI(smoothMinusDM, smoothTR)
    const s = pDI + mDI
    const dx = s === 0 ? 0 : (Math.abs(pDI - mDI) / s) * 100
    dxArr.push(dx)

    // ADX = Wilder's smoothing of DX (starts after period*2 points)
    let adxVal: number | null = null
    if (dxArr.length >= period) {
      if (dxArr.length === period) {
        adxVal = dxArr.slice(0, period).reduce((a, b) => a + b, 0) / period
      } else {
        const prevResult = result[i - 1]
        if (prevResult.adx != null) {
          adxVal = (prevResult.adx * (period - 1) + dx) / period
        }
      }
    }

    result[i] = { adx: adxVal, plusDI: pDI, minusDI: mDI }
  }

  return result
}

/**
 * Parabolic SAR — 추세 반전 포인트
 * @param step 가속 인자 증가량 (기본 0.02)
 * @param max 가속 인자 최대값 (기본 0.2)
 */
export interface ParabolicSARPoint {
  index: number
  value: number
  isUpTrend: boolean
}

export function calculateParabolicSAR(
  highs: number[],
  lows: number[],
  step = 0.02,
  max = 0.2
): ParabolicSARPoint[] {
  const len = highs.length
  if (len < 2) return []

  const result: ParabolicSARPoint[] = []
  let isUpTrend = true
  let sar = lows[0]
  let ep = highs[0]   // Extreme Point
  let af = step       // Acceleration Factor

  for (let i = 1; i < len; i++) {
    // SAR 계산
    let newSar = sar + af * (ep - sar)

    if (isUpTrend) {
      // 상승 추세: SAR은 이전 2개 저점보다 낮아야 함
      newSar = Math.min(newSar, lows[i - 1])
      if (i >= 2) newSar = Math.min(newSar, lows[i - 2])

      if (lows[i] < newSar) {
        // 추세 전환: 하락
        isUpTrend = false
        newSar = ep
        ep = lows[i]
        af = step
      } else {
        if (highs[i] > ep) {
          ep = highs[i]
          af = Math.min(af + step, max)
        }
      }
    } else {
      // 하락 추세: SAR은 이전 2개 고점보다 높아야 함
      newSar = Math.max(newSar, highs[i - 1])
      if (i >= 2) newSar = Math.max(newSar, highs[i - 2])

      if (highs[i] > newSar) {
        // 추세 전환: 상승
        isUpTrend = true
        newSar = ep
        ep = highs[i]
        af = step
      } else {
        if (lows[i] < ep) {
          ep = lows[i]
          af = Math.min(af + step, max)
        }
      }
    }

    sar = newSar
    result.push({ index: i, value: sar, isUpTrend })
  }

  return result
}

/**
 * Keltner Channel — EMA 기반 변동성 채널
 * 중심: EMA(period), 상단/하단: EMA ± multiplier * ATR(atrPeriod)
 */
export function calculateKeltnerChannel(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 20,
  atrPeriod = 10,
  multiplier = 1.5
): {
  upper: (number | null)[]
  middle: (number | null)[]
  lower: (number | null)[]
} {
  const middle = calculateEMA(closes, period)
  const atr = calculateATR(highs, lows, closes, atrPeriod)
  const len = closes.length
  const upper: (number | null)[] = new Array(len).fill(null)
  const lower: (number | null)[] = new Array(len).fill(null)

  for (let i = 0; i < len; i++) {
    if (middle[i] != null && atr[i] != null) {
      upper[i] = (middle[i] as number) + multiplier * (atr[i] as number)
      lower[i] = (middle[i] as number) - multiplier * (atr[i] as number)
    }
  }

  return { upper, middle, lower }
}

// ─── 확장 캔들 패턴 ──────────────────────────────────────────────────────────

/**
 * Morning Star (샛별형) — 3봉 강세 반전 패턴
 * 1봉: 큰 음봉, 2봉: 작은 몸통(갭 하락), 3봉: 큰 양봉(갭 상승)
 */
export function detectMorningStar(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[]
): CandlePattern[] {
  const patterns: CandlePattern[] = []
  const len = closes.length
  for (let i = 2; i < len; i++) {
    const [o1, c1] = [opens[i - 2], closes[i - 2]]
    const [o2, c2] = [opens[i - 1], closes[i - 1]]
    const [o3, c3] = [opens[i], closes[i]]
    const body1 = Math.abs(c1 - o1)
    const body2 = Math.abs(c2 - o2)
    const body3 = Math.abs(c3 - o3)
    const range1 = highs[i - 2] - lows[i - 2]
    if (range1 === 0) continue
    // 1봉: 큰 음봉 (몸통이 전체 범위의 50% 이상)
    if (c1 >= o1) continue
    if (body1 / range1 < 0.5) continue
    // 2봉: 작은 몸통 (도지형)
    if (body2 >= body1 * 0.3) continue
    // 3봉: 큰 양봉, 첫 봉 몸통의 절반 이상 회복
    if (c3 <= o3) continue
    if (body3 < body1 * 0.5) continue
    if (c3 < (o1 + c1) / 2) continue
    patterns.push({ index: i, name: "Morning Star", nameKr: "샛별형", signal: "bullish" })
  }
  return patterns
}

/**
 * Evening Star (석별형) — 3봉 약세 반전 패턴
 * 1봉: 큰 양봉, 2봉: 작은 몸통(갭 상승), 3봉: 큰 음봉(갭 하락)
 */
export function detectEveningStar(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[]
): CandlePattern[] {
  const patterns: CandlePattern[] = []
  const len = closes.length
  for (let i = 2; i < len; i++) {
    const [o1, c1] = [opens[i - 2], closes[i - 2]]
    const [o2, c2] = [opens[i - 1], closes[i - 1]]
    const [o3, c3] = [opens[i], closes[i]]
    const body1 = Math.abs(c1 - o1)
    const body2 = Math.abs(c2 - o2)
    const body3 = Math.abs(c3 - o3)
    const range1 = highs[i - 2] - lows[i - 2]
    if (range1 === 0) continue
    // 1봉: 큰 양봉
    if (c1 <= o1) continue
    if (body1 / range1 < 0.5) continue
    // 2봉: 작은 몸통
    if (body2 >= body1 * 0.3) continue
    // 3봉: 큰 음봉
    if (c3 >= o3) continue
    if (body3 < body1 * 0.5) continue
    if (c3 > (o1 + c1) / 2) continue
    patterns.push({ index: i, name: "Evening Star", nameKr: "석별형", signal: "bearish" })
  }
  return patterns
}

/**
 * Harami (잉태형) — 2봉 반전 패턴
 * 이전 큰 봉이 현재 작은 봉을 완전히 감싸는 형태
 */
export function detectHarami(
  opens: number[],
  closes: number[]
): CandlePattern[] {
  const patterns: CandlePattern[] = []
  const len = closes.length
  for (let i = 1; i < len; i++) {
    const [o1, c1] = [opens[i - 1], closes[i - 1]]
    const [o2, c2] = [opens[i], closes[i]]
    const body1 = Math.abs(c1 - o1)
    const body2 = Math.abs(c2 - o2)
    if (body1 === 0) continue
    // 현재 봉의 몸통이 이전 봉 몸통보다 작고 내부에 포함
    const inner = Math.max(o2, c2) < Math.max(o1, c1) && Math.min(o2, c2) > Math.min(o1, c1)
    if (!inner || body2 >= body1 * 0.6) continue
    if (c1 < o1 && c2 > o2) {
      // 상승 잉태형: 이전 음봉 + 현재 양봉
      patterns.push({ index: i, name: "Bullish Harami", nameKr: "상승잉태형", signal: "bullish" })
    } else if (c1 > o1 && c2 < o2) {
      // 하락 잉태형: 이전 양봉 + 현재 음봉
      patterns.push({ index: i, name: "Bearish Harami", nameKr: "하락잉태형", signal: "bearish" })
    }
  }
  return patterns
}

/**
 * Three White Soldiers (적삼병) — 3연속 양봉 상승 패턴
 */
export function detectThreeWhiteSoldiers(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[]
): CandlePattern[] {
  const patterns: CandlePattern[] = []
  const len = closes.length
  for (let i = 2; i < len; i++) {
    const candles = [i - 2, i - 1, i]
    // 3봉 모두 양봉
    if (candles.some((j) => closes[j] <= opens[j])) continue
    // 각 봉이 이전 봉보다 높게 시가/종가
    if (opens[i - 1] <= closes[i - 2]) continue
    if (opens[i] <= closes[i - 1]) continue
    // 아래꼬리가 짧을 것 (몸통의 30% 이하)
    const bodies = candles.map((j) => closes[j] - opens[j])
    const lowerShadows = candles.map((j) => opens[j] - lows[j])
    if (lowerShadows.some((ls, k) => ls > bodies[k] * 0.3)) continue
    patterns.push({ index: i, name: "Three White Soldiers", nameKr: "적삼병", signal: "bullish" })
  }
  return patterns
}

/**
 * Three Black Crows (흑삼병) — 3연속 음봉 하락 패턴
 */
export function detectThreeBlackCrows(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[]
): CandlePattern[] {
  const patterns: CandlePattern[] = []
  const len = closes.length
  for (let i = 2; i < len; i++) {
    const candles = [i - 2, i - 1, i]
    // 3봉 모두 음봉
    if (candles.some((j) => closes[j] >= opens[j])) continue
    // 각 봉이 이전 봉보다 낮게 시가/종가
    if (opens[i - 1] >= closes[i - 2]) continue
    if (opens[i] >= closes[i - 1]) continue
    // 윗꼬리가 짧을 것
    const bodies = candles.map((j) => opens[j] - closes[j])
    const upperShadows = candles.map((j) => highs[j] - opens[j])
    if (upperShadows.some((us, k) => us > bodies[k] * 0.3)) continue
    patterns.push({ index: i, name: "Three Black Crows", nameKr: "흑삼병", signal: "bearish" })
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

/**
 * MFI 해석
 */
export function interpretMFI(mfi: number | null): { label: string; color: string } {
  if (mfi == null) return { label: "-", color: "text-muted-foreground" }
  if (mfi >= 80) return { label: "과매수", color: "text-stock-up" }
  if (mfi <= 20) return { label: "과매도", color: "text-stock-down" }
  return { label: "중립", color: "text-muted-foreground" }
}

/**
 * ADX 추세 강도 해석
 */
export function interpretADX(adx: number | null): { label: string; color: string } {
  if (adx == null) return { label: "-", color: "text-muted-foreground" }
  if (adx >= 50) return { label: "강한 추세", color: "text-stock-up" }
  if (adx >= 25) return { label: "추세 진행", color: "text-muted-foreground" }
  return { label: "약한 추세", color: "text-stock-down" }
}

/**
 * Parabolic SAR 해석
 */
export function interpretParabolicSAR(isUpTrend: boolean | null): { label: string; color: string } {
  if (isUpTrend == null) return { label: "-", color: "text-muted-foreground" }
  if (isUpTrend) return { label: "상승 추세", color: "text-stock-up" }
  return { label: "하락 추세", color: "text-stock-down" }
}
