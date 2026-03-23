import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type SignalType =
  | "golden_cross"
  | "rsi_oversold"
  | "volume_surge"
  | "bollinger_bounce"
  | "macd_cross"

const SIGNAL_LABELS: Record<SignalType, string> = {
  golden_cross: "골든크로스",
  rsi_oversold: "RSI 과매도 반등",
  volume_surge: "거래량 급증",
  bollinger_bounce: "볼린저밴드 반등",
  macd_cross: "MACD 골든크로스",
}

export const VALID_SIGNALS = Object.keys(SIGNAL_LABELS) as SignalType[]

interface SignalMatch {
  stockId: string
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === "object" && "toNumber" in (v as object)) {
    return (v as Prisma.Decimal).toNumber()
  }
  return Number(v)
}

async function findGoldenCross(market: string): Promise<SignalMatch[]> {
  return prisma.$queryRaw<SignalMatch[]>`
    WITH ranked AS (
      SELECT ti."stockId", ti.ma5, ti.ma20,
             LAG(ti.ma5) OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_ma5,
             LAG(ti.ma20) OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_ma20,
             ROW_NUMBER() OVER (PARTITION BY ti."stockId" ORDER BY ti.date DESC) as rn
      FROM "TechnicalIndicator" ti
      JOIN "Stock" s ON s.id = ti."stockId"
      WHERE s.market = ${market}::"Market" AND s."isActive" = true
        AND ti.ma5 IS NOT NULL AND ti.ma20 IS NOT NULL
        AND ti.date >= CURRENT_DATE - INTERVAL '7 days'
    )
    SELECT "stockId" FROM ranked
    WHERE rn = 1
      AND prev_ma5 IS NOT NULL AND prev_ma20 IS NOT NULL
      AND prev_ma5 <= prev_ma20
      AND ma5 > ma20
  `
}

async function findRsiOversold(market: string): Promise<SignalMatch[]> {
  return prisma.$queryRaw<SignalMatch[]>`
    WITH ranked AS (
      SELECT ti."stockId", ti.rsi14,
             LAG(ti.rsi14) OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_rsi14,
             ROW_NUMBER() OVER (PARTITION BY ti."stockId" ORDER BY ti.date DESC) as rn
      FROM "TechnicalIndicator" ti
      JOIN "Stock" s ON s.id = ti."stockId"
      WHERE s.market = ${market}::"Market" AND s."isActive" = true
        AND ti.rsi14 IS NOT NULL
        AND ti.date >= CURRENT_DATE - INTERVAL '7 days'
    )
    SELECT "stockId" FROM ranked
    WHERE rn = 1
      AND prev_rsi14 IS NOT NULL
      AND prev_rsi14 < 35
      AND rsi14 > prev_rsi14
  `
}

async function findVolumeSurge(market: string): Promise<SignalMatch[]> {
  return prisma.$queryRaw<SignalMatch[]>`
    SELECT ti."stockId"
    FROM "TechnicalIndicator" ti
    JOIN "Stock" s ON s.id = ti."stockId"
    JOIN "StockQuote" sq ON sq."stockId" = s.id
    WHERE s.market = ${market}::"Market" AND s."isActive" = true
      AND ti."avgVolume20" IS NOT NULL AND ti."avgVolume20" > 0
      AND ti.date = (
        SELECT MAX(t2.date) FROM "TechnicalIndicator" t2
        JOIN "Stock" s2 ON s2.id = t2."stockId"
        WHERE s2.market = ${market}::"Market" AND s2."isActive" = true
      )
      AND sq.volume > ti."avgVolume20" * 2
  `
}

async function findBollingerBounce(market: string): Promise<SignalMatch[]> {
  return prisma.$queryRaw<SignalMatch[]>`
    WITH bb AS (
      SELECT ti."stockId", ti."bbLower",
             dp.close,
             LAG(ti."bbLower") OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_bb_lower,
             LAG(dp.close) OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_close,
             ROW_NUMBER() OVER (PARTITION BY ti."stockId" ORDER BY ti.date DESC) as rn
      FROM "TechnicalIndicator" ti
      JOIN "Stock" s ON s.id = ti."stockId"
      JOIN "DailyPrice" dp ON dp."stockId" = ti."stockId" AND dp.date = ti.date
      WHERE s.market = ${market}::"Market" AND s."isActive" = true
        AND ti."bbLower" IS NOT NULL
        AND ti.date >= CURRENT_DATE - INTERVAL '7 days'
    )
    SELECT "stockId" FROM bb
    WHERE rn = 1
      AND prev_close IS NOT NULL AND prev_bb_lower IS NOT NULL
      AND prev_close <= prev_bb_lower * 1.01
      AND close > prev_close
  `
}

async function findMacdCross(market: string): Promise<SignalMatch[]> {
  return prisma.$queryRaw<SignalMatch[]>`
    WITH ranked AS (
      SELECT ti."stockId", ti."macdLine", ti."macdSignal",
             LAG(ti."macdLine") OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_macd_line,
             LAG(ti."macdSignal") OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_macd_signal,
             ROW_NUMBER() OVER (PARTITION BY ti."stockId" ORDER BY ti.date DESC) as rn
      FROM "TechnicalIndicator" ti
      JOIN "Stock" s ON s.id = ti."stockId"
      WHERE s.market = ${market}::"Market" AND s."isActive" = true
        AND ti."macdLine" IS NOT NULL AND ti."macdSignal" IS NOT NULL
        AND ti.date >= CURRENT_DATE - INTERVAL '7 days'
    )
    SELECT "stockId" FROM ranked
    WHERE rn = 1
      AND prev_macd_line IS NOT NULL AND prev_macd_signal IS NOT NULL
      AND prev_macd_line <= prev_macd_signal
      AND "macdLine" > "macdSignal"
  `
}

const SIGNAL_FINDERS: Record<SignalType, (market: string) => Promise<SignalMatch[]>> = {
  golden_cross: findGoldenCross,
  rsi_oversold: findRsiOversold,
  volume_surge: findVolumeSurge,
  bollinger_bounce: findBollingerBounce,
  macd_cross: findMacdCross,
}

export interface ScreenerStock {
  ticker: string
  name: string
  price: number
  changePercent: number
  volume: number
  signalLabel: string
}

export interface ScreenerResult {
  stocks: ScreenerStock[]
  signal: SignalType
  market: "KR" | "US"
  total: number
  message?: string
  updatedAt?: string
}

export async function getScreenerData(market: "KR" | "US", signal: SignalType): Promise<ScreenerResult> {
  // Check if TechnicalIndicator data exists for this market
  const indicatorCount = await prisma.technicalIndicator.count({
    where: {
      stock: { market, isActive: true },
      date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  })

  if (indicatorCount === 0) {
    return {
      stocks: [],
      signal,
      market,
      total: 0,
      message: "기술지표 데이터가 아직 계산되지 않았습니다.",
    }
  }

  // Find matching stockIds using DB-level signal detection
  const matches = await SIGNAL_FINDERS[signal](market)
  const matchedIds = matches.map((m) => m.stockId)

  if (matchedIds.length === 0) {
    return { stocks: [], signal, market, total: 0 }
  }

  // Fetch stock details for matched IDs, sorted by changePercent DESC, limit 20
  const stockResults = await prisma.$queryRaw<Array<{
    ticker: string
    name: string
    price: unknown
    changePercent: unknown
    volume: bigint
    updatedAt: Date
  }>>`
    SELECT s.ticker, s.name, sq.price, sq."changePercent", sq.volume, sq."updatedAt"
    FROM "Stock" s
    JOIN "StockQuote" sq ON sq."stockId" = s.id
    WHERE s.id IN (${Prisma.join(matchedIds)})
    ORDER BY sq."changePercent" DESC
    LIMIT 20
  `

  const stocks = stockResults.map((r) => ({
    ticker: r.ticker,
    name: r.name,
    price: toNumber(r.price),
    changePercent: toNumber(r.changePercent),
    volume: Number(r.volume),
    signalLabel: SIGNAL_LABELS[signal],
  }))

  const updatedAt = stockResults.length > 0 ? stockResults[0].updatedAt.toISOString() : undefined

  return { stocks, signal, market, total: matchedIds.length, updatedAt }
}
