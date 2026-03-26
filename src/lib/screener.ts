import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { computeIndicators, type DailyPriceInput } from "@/lib/indicators"

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

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === "object" && "toNumber" in (v as object)) {
    return (v as Prisma.Decimal).toNumber()
  }
  return Number(v)
}

interface StockWithPrices {
  id: string
  dailyPrices: DailyPriceInput[]
  currentVolume: bigint | null
}

async function loadStocksWithPrices(market: string): Promise<StockWithPrices[]> {
  const stocks = await prisma.stock.findMany({
    where: { market: market as "KR" | "US", isActive: true },
    select: {
      id: true,
      quotes: { select: { volume: true }, take: 1 },
      dailyPrices: {
        orderBy: { date: "asc" },
        take: 100,
        select: { date: true, close: true, high: true, low: true, volume: true },
      },
    },
  })

  return stocks
    .filter((s) => s.dailyPrices.length >= 5)
    .map((s) => ({
      id: s.id,
      dailyPrices: s.dailyPrices.map((p) => ({
        date: p.date,
        close: toNumber(p.close),
        high: toNumber(p.high),
        low: toNumber(p.low),
        volume: p.volume,
      })),
      currentVolume: s.quotes[0]?.volume ?? null,
    }))
}

function findSignalMatches(stocks: StockWithPrices[], signal: SignalType): string[] {
  const matchedIds: string[] = []

  for (const stock of stocks) {
    const indicators = computeIndicators(stock.dailyPrices)
    if (indicators.length < 2) continue

    const latest = indicators[indicators.length - 1]
    const prev = indicators[indicators.length - 2]

    let matched = false

    switch (signal) {
      case "golden_cross":
        matched =
          prev.ma5 !== null && prev.ma20 !== null && latest.ma5 !== null && latest.ma20 !== null &&
          prev.ma5 <= prev.ma20 && latest.ma5 > latest.ma20
        break

      case "rsi_oversold":
        matched =
          prev.rsi14 !== null && latest.rsi14 !== null &&
          prev.rsi14 < 35 && latest.rsi14 > prev.rsi14
        break

      case "volume_surge":
        matched =
          latest.avgVolume20 !== null && latest.avgVolume20 > 0n &&
          stock.currentVolume !== null &&
          stock.currentVolume > latest.avgVolume20 * 2n
        break

      case "bollinger_bounce": {
        const prevClose = stock.dailyPrices[stock.dailyPrices.length - 2]
        const latestClose = stock.dailyPrices[stock.dailyPrices.length - 1]
        matched =
          prev.bbLower !== null && prevClose !== undefined && latestClose !== undefined &&
          toNumber(prevClose.close) <= prev.bbLower * 1.01 &&
          toNumber(latestClose.close) > toNumber(prevClose.close)
        break
      }

      case "macd_cross":
        matched =
          prev.macdLine !== null && prev.macdSignal !== null &&
          latest.macdLine !== null && latest.macdSignal !== null &&
          prev.macdLine <= prev.macdSignal && latest.macdLine > latest.macdSignal
        break
    }

    if (matched) matchedIds.push(stock.id)
  }

  return matchedIds
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

export async function findSignalStockIds(market: string, signal: SignalType, limit?: number): Promise<string[]> {
  const stocks = await loadStocksWithPrices(market)
  const ids = findSignalMatches(stocks, signal)
  return limit ? ids.slice(0, limit) : ids
}

export async function getScreenerData(market: "KR" | "US", signal: SignalType): Promise<ScreenerResult> {
  const stocks = await loadStocksWithPrices(market)

  if (stocks.length === 0) {
    return {
      stocks: [],
      signal,
      market,
      total: 0,
      message: "가격 데이터가 아직 수집되지 않았습니다.",
    }
  }

  const matchedIds = findSignalMatches(stocks, signal)

  if (matchedIds.length === 0) {
    return { stocks: [], signal, market, total: 0 }
  }

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

  const result = stockResults.map((r) => ({
    ticker: r.ticker,
    name: r.name,
    price: toNumber(r.price),
    changePercent: toNumber(r.changePercent),
    volume: Number(r.volume),
    signalLabel: SIGNAL_LABELS[signal],
  }))

  const updatedAt = stockResults.length > 0 ? stockResults[0].updatedAt.toISOString() : undefined

  return { stocks: result, signal, market, total: matchedIds.length, updatedAt }
}
