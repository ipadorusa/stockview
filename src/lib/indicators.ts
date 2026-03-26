/**
 * 온디맨드 기술적 지표 계산
 * DailyPrice[] → 최신 날짜의 지표 값 반환
 */
import {
  calculateMA,
  calculateRSI,
  calculateAvgVolume,
  calculateEMA,
  calculateMACD,
  calculateBollingerBands,
} from "@/lib/utils/technical-indicators"

export interface DailyPriceInput {
  date: Date
  close: number | { toNumber(): number }
  high: number | { toNumber(): number }
  low: number | { toNumber(): number }
  volume: bigint | number
}

export interface IndicatorRow {
  date: Date
  ma5: number | null
  ma20: number | null
  ma60: number | null
  ema12: number | null
  ema26: number | null
  rsi14: number | null
  avgVolume20: bigint | null
  macdLine: number | null
  macdSignal: number | null
  macdHistogram: number | null
  bbUpper: number | null
  bbMiddle: number | null
  bbLower: number | null
}

function toNum(v: number | { toNumber(): number }): number {
  if (typeof v === "number") return v
  return v.toNumber()
}

/**
 * DailyPrice 배열(시간순 ASC)로부터 모든 날짜의 지표 계산
 */
export function computeIndicators(prices: DailyPriceInput[]): IndicatorRow[] {
  if (prices.length < 5) return []

  const closes = prices.map((p) => toNum(p.close))
  const volumes = prices.map((p) => (typeof p.volume === "bigint" ? p.volume : BigInt(p.volume)))

  const ma5 = calculateMA(closes, 5)
  const ma20 = calculateMA(closes, 20)
  const ma60 = calculateMA(closes, 60)
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  const rsi14 = calculateRSI(closes)
  const avgVol20 = calculateAvgVolume(volumes)
  const macd = calculateMACD(closes)
  const bb = calculateBollingerBands(closes)

  return prices.map((p, i) => ({
    date: p.date,
    ma5: ma5[i] ?? null,
    ma20: ma20[i] ?? null,
    ma60: ma60[i] ?? null,
    ema12: ema12[i] ?? null,
    ema26: ema26[i] ?? null,
    rsi14: rsi14[i] ?? null,
    avgVolume20: avgVol20[i] ?? null,
    macdLine: macd.macdLine[i] ?? null,
    macdSignal: macd.signal[i] ?? null,
    macdHistogram: macd.histogram[i] ?? null,
    bbUpper: bb.upper[i] ?? null,
    bbMiddle: bb.middle[i] ?? null,
    bbLower: bb.lower[i] ?? null,
  }))
}

/**
 * 최근 N개 날짜의 지표만 반환 (가장 최신 먼저, DESC)
 */
export function computeLatestIndicators(prices: DailyPriceInput[], count: number): IndicatorRow[] {
  const all = computeIndicators(prices)
  return all.slice(-count).reverse()
}
