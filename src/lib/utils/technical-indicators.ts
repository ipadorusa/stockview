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

/**
 * 하이킨아시 (Heikin-Ashi) 캔들 계산
 * 평균화된 OHLC 값으로 노이즈를 제거하여 추세를 명확하게 표현
 */
export function calculateHeikinAshi(
  data: { open: number; high: number; low: number; close: number }[]
): { open: number; high: number; low: number; close: number }[] {
  if (data.length === 0) return []
  const result: { open: number; high: number; low: number; close: number }[] = []
  for (let i = 0; i < data.length; i++) {
    const haClose = (data[i].open + data[i].high + data[i].low + data[i].close) / 4
    const haOpen = i === 0
      ? (data[i].open + data[i].close) / 2
      : (result[i - 1].open + result[i - 1].close) / 2
    const haHigh = Math.max(data[i].high, haOpen, haClose)
    const haLow = Math.min(data[i].low, haOpen, haClose)
    result.push({ open: haOpen, high: haHigh, low: haLow, close: haClose })
  }
  return result
}

export interface HeikinAshiSignal {
  label: string
  color: string
  streak: number
  type: 'strong_up' | 'strong_down' | 'up' | 'down' | 'reversal_warning'
      | 'trend_start' | 'trend_weakening' | 'strong_reversal'
      | 'acceleration' | 'whipsaw' | 'consolidation' | 'trend_confirmed'
  strength: 1 | 2 | 3
  description: string
}

/**
 * 하이킨아시 추세 해석
 * 최근 HA 캔들의 형태와 연속성으로 추세 방향/강도 판단
 */
export function interpretHeikinAshi(
  haData: { open: number; high: number; low: number; close: number }[]
): HeikinAshiSignal {
  if (haData.length < 2) {
    return { label: "데이터 부족", color: "text-muted-foreground", streak: 0, type: 'consolidation', strength: 1, description: "데이터가 부족하여 분석할 수 없습니다" }
  }

  const last = haData[haData.length - 1]
  const isBullish = last.close > last.open
  const bodySize = Math.abs(last.close - last.open)
  const totalRange = last.high - last.low

  // Helper: is candle a doji?
  const isDoji = (c: { open: number; high: number; low: number; close: number }) => {
    const b = Math.abs(c.close - c.open)
    const r = c.high - c.low
    return r > 0 && b / r < 0.1
  }

  // Helper: body size
  const body = (c: { open: number; high: number; low: number; close: number }) =>
    Math.abs(c.close - c.open)

  // 연속 봉 수 계산 (현재 방향 기준)
  let streak = 1
  for (let i = haData.length - 2; i >= 0; i--) {
    if ((haData[i].close > haData[i].open) === isBullish) streak++
    else break
  }

  // 직전 반대 방향 streak 계산
  const prevDirection = !isBullish
  let prevStreak = 0
  const colorChangeIdx = haData.length - 1 - streak // index where current streak started
  if (colorChangeIdx >= 0) {
    for (let i = colorChangeIdx; i >= 0; i--) {
      if ((haData[i].close > haData[i].open) === prevDirection) prevStreak++
      else break
    }
  }

  // 강한 추세: 꼬리 없음 판정
  const noLowerWick = Math.abs(last.low - Math.min(last.open, last.close)) < bodySize * 0.05
  const noUpperWick = Math.abs(last.high - Math.max(last.open, last.close)) < bodySize * 0.05

  // === Pattern detection ===

  // 1. consolidation: 최근 5봉 중 도지 2개 이상
  const recent5 = haData.slice(-5)
  const dojiCount = recent5.filter(isDoji).length
  if (dojiCount >= 2) {
    return {
      label: "횡보 / 방향성 없음",
      color: "text-muted-foreground",
      streak,
      type: 'consolidation',
      strength: 2,
      description: `최근 5봉 중 도지 ${dojiCount}개 출현. 뚜렷한 방향성 없이 횡보 중`,
    }
  }

  // 2. strong_reversal: 도지 + 직전 5봉 이상 같은 방향 streak (현재 봉 이전 streak)
  const lastIsDoji = isDoji(last)
  if (lastIsDoji && prevStreak >= 5) {
    const dir = isBullish ? "하락" : "상승"
    return {
      label: "강한 반전 경고",
      color: "text-amber-500",
      streak: 0,
      type: 'strong_reversal',
      strength: 3,
      description: `${prevStreak}봉 연속 ${dir} 후 도지 출현. 강한 추세 전환 가능성`,
    }
  }

  // 3. reversal_warning: 도지형 (몸통이 전체 범위의 10% 미만)
  if (totalRange > 0 && bodySize / totalRange < 0.1) {
    return {
      label: "추세 전환 가능",
      color: "text-amber-500",
      streak: 0,
      type: 'reversal_warning',
      strength: 2,
      description: "도지 캔들 출현. 추세 전환 가능성이 있으므로 다음 봉 방향을 확인하세요",
    }
  }

  // 4. trend_start: 색상 전환 후 1~2봉 + 이전 반대색 3봉 이상
  if (streak <= 2 && prevStreak >= 3) {
    const fromDir = isBullish ? "하락" : "상승"
    const toDir = isBullish ? "상승" : "하락"
    return {
      label: `${toDir} 전환 시작 (${streak}봉)`,
      color: isBullish ? "text-stock-up" : "text-stock-down",
      streak,
      type: 'trend_start',
      strength: 2,
      description: `${fromDir}에서 ${toDir}으로 전환 시작. 추세 변화 초기 단계로 확인 필요`,
    }
  }

  // 5. whipsaw: 반대 방향 전환 후 2봉 이내 다시 원래 방향 (최소 2봉 확인 위해 prevStreak <= 2)
  if (streak >= 2 && prevStreak >= 1 && prevStreak <= 2) {
    const dir = isBullish ? "상승" : "하락"
    return {
      label: `단기 되돌림 (${streak}봉)`,
      color: "text-amber-500",
      streak,
      type: 'whipsaw',
      strength: 1,
      description: `짧은 반전 후 다시 ${dir} 재개. 휩쏘(Whipsaw) 가능성. 추세 신뢰도 낮음`,
    }
  }

  // 6. acceleration: 몸통 크기가 점점 커지는 3연속 봉 + 한쪽 꼬리 없음
  if (haData.length >= 3) {
    const c1 = haData[haData.length - 3]
    const c2 = haData[haData.length - 2]
    const c3 = last
    const bodiesGrowing = body(c1) < body(c2) && body(c2) < body(c3)
    const sameDir3 = (c1.close > c1.open) === isBullish && (c2.close > c2.open) === isBullish
    const noWick = isBullish ? noLowerWick : noUpperWick
    if (bodiesGrowing && sameDir3 && noWick) {
      const dir = isBullish ? "상승" : "하락"
      const side = isBullish ? "매수" : "매도"
      return {
        label: `${dir} 가속 (${streak}봉)`,
        color: isBullish ? "text-stock-up" : "text-stock-down",
        streak,
        type: 'acceleration',
        strength: 3,
        description: `${dir} 몸통이 점점 확대. ${side}세 가속 중`,
      }
    }
  }

  // 7. trend_confirmed: 같은 방향 5봉 이상 + 몸통 증가 추세
  if (streak >= 5) {
    // Check if recent 3 bodies have growth trend (not strictly, just last > average of prior)
    if (haData.length >= 3) {
      const recentBodies = haData.slice(-3).map(body)
      const avgPrev2 = (recentBodies[0] + recentBodies[1]) / 2
      const bodyIncreasing = recentBodies[2] > avgPrev2
      if (bodyIncreasing) {
        const dir = isBullish ? "상승" : "하락"
        return {
          label: `${dir} 추세 확정 (${streak}봉)`,
          color: isBullish ? "text-stock-up" : "text-stock-down",
          streak,
          type: 'trend_confirmed',
          strength: 3,
          description: `${streak}봉 연속 ${dir} + 몸통 증가 추세. 강한 ${dir} 추세가 확정됨`,
        }
      }
    }
  }

  // 8. trend_weakening: 몸통 크기가 점점 줄어드는 3연속 봉
  if (haData.length >= 3) {
    const c1 = haData[haData.length - 3]
    const c2 = haData[haData.length - 2]
    const c3 = last
    const sameDir3 = (c1.close > c1.open) === isBullish && (c2.close > c2.open) === isBullish
    if (sameDir3 && body(c1) > body(c2) && body(c2) > body(c3)) {
      const dir = isBullish ? "상승" : "하락"
      return {
        label: `${dir} 추세 약화 (${streak}봉)`,
        color: isBullish ? "text-stock-up" : "text-stock-down",
        streak,
        type: 'trend_weakening',
        strength: 1,
        description: `연속 3봉 몸통 축소. ${dir} 추세가 약화되고 있으므로 주의 필요`,
      }
    }
  }

  // 9. strong_up / strong_down
  if (isBullish && noLowerWick) {
    return {
      label: `강한 상승 (${streak}봉)`,
      color: "text-stock-up",
      streak,
      type: 'strong_up',
      strength: 3,
      description: `아래꼬리 없는 강한 상승 캔들 ${streak}봉 연속. 강력한 매수 우위`,
    }
  }
  if (!isBullish && noUpperWick) {
    return {
      label: `강한 하락 (${streak}봉)`,
      color: "text-stock-down",
      streak,
      type: 'strong_down',
      strength: 3,
      description: `위꼬리 없는 강한 하락 캔들 ${streak}봉 연속. 강력한 매도 우위`,
    }
  }

  // 10. up / down
  if (isBullish) {
    return {
      label: `상승 추세 (${streak}봉)`,
      color: "text-stock-up",
      streak,
      type: 'up',
      strength: 1,
      description: `상승 캔들 ${streak}봉 연속. 매수 우위 지속 중`,
    }
  }
  return {
    label: `하락 추세 (${streak}봉)`,
    color: "text-stock-down",
    streak,
    type: 'down',
    strength: 1,
    description: `하락 캔들 ${streak}봉 연속. 매도 우위 지속 중`,
  }
}

// ─── 복합 신호 (Composite Signal) ────────────────────────────────────────────

export interface CompositeSignal {
  action: 'buy' | 'hold' | 'sell'
  confidence: number       // 0~100
  label: string            // 한글 라벨
  color: string            // Tailwind class
  reasons: string[]        // 판단 근거 배열 (최대 4개)
  indicators: {
    ha: { type: string; streak: number; strength: number }
    rsi?: { value: number; condition: string }
    maCross?: { type: 'golden' | 'dead' | null; label: string }
    adx?: { value: number; trendStrength: string }
  }
}

/**
 * HA + 보조 지표 복합 신호 생성
 * 사전 계산된 값을 받아 3단계(매수/관망/매도) 신호와 신뢰도를 반환
 */
export function generateCompositeSignal(params: {
  haSignal: HeikinAshiSignal
  rsi14?: number | null
  ma5?: number | null
  ma20?: number | null
  adx14?: number | null
  currentPrice?: number
}): CompositeSignal {
  const { haSignal, rsi14, ma5, ma20, adx14 } = params

  // RSI 조건 분류
  const getRsiCondition = (rsi: number): string => {
    if (rsi <= 30) return 'oversold'
    if (rsi >= 70) return 'overbought'
    if (rsi < 50) return 'below_mid'
    return 'above_mid'
  }

  // MA 크로스 판단
  const maCrossType: 'golden' | 'dead' | null =
    ma5 != null && ma20 != null
      ? ma5 > ma20 ? 'golden' : 'dead'
      : null

  const maCrossLabel =
    maCrossType === 'golden' ? '골든크로스(MA5>MA20)' :
    maCrossType === 'dead'   ? '데드크로스(MA5<MA20)' :
    '이평 정보 없음'

  // ADX 추세 강도 분류
  const getAdxStrength = (adx: number): string => {
    if (adx >= 50) return 'very_strong'
    if (adx >= 25) return 'strong'
    return 'weak'
  }

  const haType = haSignal.type
  const isBullishHA = ['strong_up', 'up', 'trend_start', 'acceleration', 'trend_confirmed'].includes(haType)
  const isBearishHA = ['strong_down', 'down'].includes(haType)
  // trend_start can be either bullish or bearish — check streak direction via label
  const isBullishTrendStart = haType === 'trend_start' && haSignal.color === 'text-stock-up'
  const isBearishTrendStart = haType === 'trend_start' && haSignal.color === 'text-stock-down'

  const reasons: string[] = []
  let action: 'buy' | 'hold' | 'sell' = 'hold'
  let confidence = 40

  // ── Strong Buy 조건 ──────────────────────────────────────────────────────
  // 1. HA 양봉 전환 + RSI < 30
  if (
    (isBullishTrendStart || haType === 'strong_up' || haType === 'acceleration') &&
    rsi14 != null && rsi14 < 30
  ) {
    action = 'buy'
    confidence = 88
    reasons.push('과매도 탈출 + 상승 전환')
    reasons.push(`RSI ${rsi14.toFixed(1)} (과매도 구간)`)
    reasons.push(haSignal.label)
  }
  // 2. HA strong_up/acceleration + 골든크로스
  else if (
    (haType === 'strong_up' || haType === 'acceleration') &&
    maCrossType === 'golden'
  ) {
    action = 'buy'
    confidence = 85
    reasons.push('강한 상승 + 이평 정배열')
    reasons.push(maCrossLabel)
    reasons.push(haSignal.label)
  }
  // 3. HA trend_confirmed + RSI 40~60 + ADX > 25
  else if (
    haType === 'trend_confirmed' && haSignal.color === 'text-stock-up' &&
    rsi14 != null && rsi14 >= 40 && rsi14 <= 60 &&
    adx14 != null && adx14 > 25
  ) {
    action = 'buy'
    confidence = 82
    reasons.push('확정 추세 + 강한 방향성')
    reasons.push(`ADX ${adx14.toFixed(1)} (추세 강함)`)
    reasons.push(`RSI ${rsi14.toFixed(1)} (중립 구간)`)
  }

  // ── Strong Sell 조건 ─────────────────────────────────────────────────────
  // 4. HA 음봉 전환 + RSI > 70
  else if (
    (isBearishTrendStart || haType === 'strong_down' || haType === 'acceleration') &&
    haSignal.color === 'text-stock-down' &&
    rsi14 != null && rsi14 > 70
  ) {
    action = 'sell'
    confidence = 87
    reasons.push('과매수 탈출 + 하락 전환')
    reasons.push(`RSI ${rsi14.toFixed(1)} (과매수 구간)`)
    reasons.push(haSignal.label)
  }
  // 5. HA strong_down + 데드크로스
  else if (haType === 'strong_down' && maCrossType === 'dead') {
    action = 'sell'
    confidence = 84
    reasons.push('강한 하락 + 이평 역배열')
    reasons.push(maCrossLabel)
    reasons.push(haSignal.label)
  }

  // ── Buy 조건 ────────────────────────────────────────────────────────────
  // 6. HA up/trend_start(상승) 단독
  else if (isBullishHA && !isBearishTrendStart) {
    // 상충: HA up + RSI > 70 → hold
    if (rsi14 != null && rsi14 > 70) {
      action = 'hold'
      confidence = 48
      reasons.push('과매수 경계')
      reasons.push(`RSI ${rsi14.toFixed(1)} — 추가 상승 제한 가능`)
      reasons.push(haSignal.label)
    } else {
      action = 'buy'
      confidence = rsi14 != null && rsi14 < 50 ? 68 : 58
      if (rsi14 != null && rsi14 < 50) {
        reasons.push('매수 여력 있음')
        reasons.push(`RSI ${rsi14.toFixed(1)} (50 미만)`)
      } else {
        reasons.push('상승 신호')
      }
      reasons.push(haSignal.label)
      if (maCrossType === 'golden') reasons.push(maCrossLabel)
    }
  }

  // ── Sell 조건 ────────────────────────────────────────────────────────────
  // 7. HA down/trend_start(하락) 단독
  else if (isBearishHA || isBearishTrendStart) {
    action = 'sell'
    confidence = rsi14 != null && rsi14 > 50 ? 67 : 57
    if (rsi14 != null && rsi14 > 50) {
      reasons.push('매도 압력')
      reasons.push(`RSI ${rsi14.toFixed(1)} (50 초과)`)
    } else {
      reasons.push('하락 신호')
    }
    reasons.push(haSignal.label)
    if (maCrossType === 'dead') reasons.push(maCrossLabel)
  }

  // ── Hold 조건 (기본) ─────────────────────────────────────────────────────
  else {
    action = 'hold'
    if (haType === 'whipsaw') {
      confidence = 38
      reasons.push('변동성 주의')
      reasons.push(haSignal.label)
    } else if (haType === 'consolidation') {
      confidence = 35
      reasons.push('방향성 불분명')
      reasons.push(haSignal.label)
    } else if (adx14 != null && adx14 < 20) {
      confidence = 42
      reasons.push('추세 약화')
      reasons.push(`ADX ${adx14.toFixed(1)} (추세 없음)`)
      reasons.push(haSignal.label)
    } else {
      confidence = 40
      reasons.push(haSignal.label)
    }
    if (rsi14 != null) reasons.push(`RSI ${rsi14.toFixed(1)}`)
  }

  // ADX 보강: 강한 추세가 있으면 신뢰도 소폭 상향
  if (adx14 != null && adx14 >= 25 && action !== 'hold') {
    confidence = Math.min(confidence + 5, 95)
  }

  // reasons 최대 4개로 제한
  const trimmedReasons = reasons.slice(0, 4)

  const labelMap: Record<'buy' | 'hold' | 'sell', string> = {
    buy: '매수 관심',
    hold: '관망',
    sell: '매도 관심',
  }
  const colorMap: Record<'buy' | 'hold' | 'sell', string> = {
    buy: 'text-stock-up',
    hold: 'text-amber-500',
    sell: 'text-stock-down',
  }

  // indicators 서브 객체 구성
  const indicatorsObj: CompositeSignal['indicators'] = {
    ha: { type: haType, streak: haSignal.streak, strength: haSignal.strength },
  }
  if (rsi14 != null) {
    indicatorsObj.rsi = { value: rsi14, condition: getRsiCondition(rsi14) }
  }
  if (ma5 != null || ma20 != null) {
    indicatorsObj.maCross = { type: maCrossType, label: maCrossLabel }
  }
  if (adx14 != null) {
    indicatorsObj.adx = { value: adx14, trendStrength: getAdxStrength(adx14) }
  }

  return {
    action,
    confidence,
    label: labelMap[action],
    color: colorMap[action],
    reasons: trimmedReasons,
    indicators: indicatorsObj,
  }
}
