import { cache } from "react"
import { prisma } from "@/lib/prisma"
import type { ChartData, ChartPeriod } from "@/types/stock"
import {
  calculateMA,
  calculateRSI,
  calculateAvgVolume,
  calculateMFI,
  calculateADX,
  calculateParabolicSAR,
  calculateHeikinAshi,
  interpretHeikinAshi,
  generateCompositeSignal,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  calculateOBV,
  calculateATR,
  detectCandlePatterns,
  type HeikinAshiSignal,
  type CompositeSignal,
  type CandlePattern,
} from "@/lib/utils/technical-indicators"

export const getStockDetail = cache(async (ticker: string) => {
  return prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: {
      id: true,
      ticker: true,
      name: true,
      nameEn: true,
      market: true,
      exchange: true,
      sector: true,
      stockType: true,
      isActive: true,
      corpCode: true,
      updatedAt: true,
      quotes: {
        take: 1,
        orderBy: { updatedAt: "desc" },
        select: {
          price: true,
          previousClose: true,
          change: true,
          changePercent: true,
          open: true,
          high: true,
          low: true,
          volume: true,
          marketCap: true,
          high52w: true,
          low52w: true,
          per: true,
          pbr: true,
          preMarketPrice: true,
          postMarketPrice: true,
          updatedAt: true,
        },
      },
      fundamental: {
        select: {
          eps: true,
          forwardEps: true,
          dividendYield: true,
          roe: true,
          debtToEquity: true,
          beta: true,
          revenue: true,
          netIncome: true,
          description: true,
          employeeCount: true,
        },
      },
    },
  })
})

export const getStockNews = cache(async (ticker: string, limit = 10) => {
  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { id: true },
  })
  if (!stock) return []

  const stockNews = await prisma.stockNews.findMany({
    where: { stockId: stock.id },
    select: {
      news: {
        select: {
          id: true,
          title: true,
          summary: true,
          content: true,
          source: true,
          imageUrl: true,
          category: true,
          sentiment: true,
          publishedAt: true,
          url: true,
        },
      },
    },
    orderBy: { news: { publishedAt: "desc" } },
    take: limit,
  })

  return stockNews.map(({ news }) => ({
    id: news.id,
    title: news.title,
    summary: news.summary,
    content: news.content,
    source: news.source,
    imageUrl: news.imageUrl,
    category: news.category as "KR_MARKET" | "US_MARKET" | "INDUSTRY" | "ECONOMY",
    sentiment: news.sentiment as "positive" | "negative" | "neutral" | null,
    publishedAt: news.publishedAt.toISOString(),
    url: news.url,
  }))
})

export const getStockDividends = cache(async (ticker: string) => {
  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { id: true },
  })
  if (!stock) return []

  const dividends = await prisma.dividend.findMany({
    where: { stockId: stock.id },
    orderBy: { exDate: "desc" },
    take: 20,
    select: {
      exDate: true,
      payDate: true,
      amount: true,
      currency: true,
      dividendYield: true,
      payoutRatio: true,
      faceValue: true,
      source: true,
    },
  })

  return dividends.map((d) => ({
    exDate: d.exDate.toISOString().split("T")[0],
    payDate: d.payDate?.toISOString().split("T")[0] ?? null,
    amount: Number(d.amount),
    currency: d.currency,
    dividendYield: d.dividendYield != null ? Number(d.dividendYield) : null,
    payoutRatio: d.payoutRatio != null ? Number(d.payoutRatio) : null,
    faceValue: d.faceValue != null ? Number(d.faceValue) : null,
    source: d.source ?? null,
  }))
})

export const getStockDisclosures = cache(async (ticker: string) => {
  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { id: true, market: true },
  })
  if (!stock || stock.market !== "KR") return []

  const disclosures = await prisma.disclosure.findMany({
    where: { stockId: stock.id },
    orderBy: { rceptDate: "desc" },
    take: 30,
    select: {
      rceptNo: true,
      reportName: true,
      filerName: true,
      rceptDate: true,
      remark: true,
    },
  })

  return disclosures.map((d) => ({
    rceptNo: d.rceptNo,
    reportName: d.reportName,
    filerName: d.filerName,
    rceptDate: d.rceptDate.toISOString().split("T")[0],
    remark: d.remark,
    viewerUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${d.rceptNo}`,
  }))
})

export const getStockPeers = cache(async (ticker: string) => {
  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { sector: true, market: true, id: true },
  })

  if (!stock || !stock.sector) return { sector: null, peers: [] }

  const peers = await prisma.stock.findMany({
    where: {
      sector: stock.sector,
      market: stock.market,
      isActive: true,
      id: { not: stock.id },
    },
    select: {
      ticker: true,
      name: true,
      quotes: {
        take: 1,
        orderBy: { updatedAt: "desc" },
        select: { price: true, changePercent: true, marketCap: true },
      },
    },
    take: 10,
  })

  const peersWithQuotes = peers
    .filter((p) => p.quotes.length > 0)
    .map((p) => ({
      ticker: p.ticker,
      name: p.name,
      price: Number(p.quotes[0].price),
      changePercent: Number(p.quotes[0].changePercent),
      marketCap: p.quotes[0].marketCap ? Number(p.quotes[0].marketCap) : null,
    }))
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))

  return { sector: stock.sector, market: stock.market as "KR" | "US", peers: peersWithQuotes }
})

export interface IndicatorData {
  ma5: number | null
  ma20: number | null
  rsi14: number | null
  avgVolume20: number | null
  mfi14: number | null
  adx14: number | null
  sarIsUpTrend: boolean | null
  haSignal: HeikinAshiSignal | null
  compositeSignal: CompositeSignal | null
  macd: { macdLine: number | null; signal: number | null; histogram: number | null } | null
  bollingerBands: { upper: number | null; middle: number | null; lower: number | null } | null
  stochastic: { k: number | null; d: number | null } | null
  obvTrend: "up" | "down" | null
  atr14: number | null
  candlePatterns: CandlePattern[]
}

export const getStockIndicators = cache(async (ticker: string): Promise<IndicatorData | null> => {
  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { id: true },
  })
  if (!stock) return null

  const since = new Date()
  since.setDate(since.getDate() - 90)

  const prices = await prisma.dailyPrice.findMany({
    where: { stockId: stock.id, date: { gte: since } },
    orderBy: { date: "asc" },
  })

  if (!prices.length) return null

  const data = prices.map((p) => ({
    open: Number(p.open),
    high: Number(p.high),
    low: Number(p.low),
    close: Number(p.close),
    volume: Number(p.volume),
  }))

  const closes = data.map((d) => d.close)
  const highs = data.map((d) => d.high)
  const lows = data.map((d) => d.low)
  const opens = data.map((d) => d.open)
  const volumes = data.map((d) => BigInt(d.volume))
  const volumeNums = data.map((d) => d.volume)
  const lastIdx = closes.length - 1

  const mfiArr = closes.length >= 15 ? calculateMFI(highs, lows, closes, volumeNums) : []
  const mfi14 = mfiArr.length > 0 ? (mfiArr[lastIdx] ?? null) : null

  const adxArr = closes.length >= 28 ? calculateADX(highs, lows, closes) : []
  const adx14 = adxArr.length > 0 ? (adxArr[lastIdx]?.adx ?? null) : null

  const sarArr = closes.length >= 2 ? calculateParabolicSAR(highs, lows) : []
  const sarLast = sarArr.length > 0 ? sarArr[sarArr.length - 1] : null
  const sarIsUpTrend = sarLast ? sarLast.isUpTrend : null

  const haData = calculateHeikinAshi(data.map((d) => ({ open: d.open, high: d.high, low: d.low, close: d.close })))
  const haSignal = haData.length >= 2 ? interpretHeikinAshi(haData) : null

  const ma5 = calculateMA(closes, 5)[lastIdx] ?? null
  const ma20 = calculateMA(closes, 20)[lastIdx] ?? null
  const rsi14 = calculateRSI(closes)[lastIdx] ?? null

  const macdResult = closes.length >= 35 ? calculateMACD(closes) : null
  const macd = macdResult
    ? {
        macdLine: macdResult.macdLine[lastIdx],
        signal: macdResult.signal[lastIdx],
        histogram: macdResult.histogram[lastIdx],
      }
    : null

  const bbResult = closes.length >= 20 ? calculateBollingerBands(closes) : null
  const bollingerBands = bbResult
    ? {
        upper: bbResult.upper[lastIdx],
        middle: bbResult.middle[lastIdx],
        lower: bbResult.lower[lastIdx],
      }
    : null

  const stochResult = closes.length >= 17 ? calculateStochastic(highs, lows, closes) : null
  const stochastic = stochResult
    ? {
        k: stochResult.k[lastIdx],
        d: stochResult.d[lastIdx],
      }
    : null

  const obvArr = calculateOBV(closes, volumeNums)
  const obvTrend =
    obvArr.length >= 5 ? (obvArr[lastIdx] > obvArr[lastIdx - 5] ? ("up" as const) : ("down" as const)) : null

  const atrArr = closes.length >= 15 ? calculateATR(highs, lows, closes) : []
  const atr14 = atrArr.length > 0 ? (atrArr[lastIdx] ?? null) : null

  const candlePatterns =
    closes.length >= 3
      ? detectCandlePatterns(opens, highs, lows, closes).filter((p) => p.index >= lastIdx - 4)
      : []

  const compositeSignal = haSignal ? generateCompositeSignal({ haSignal, rsi14, ma5, ma20, adx14 }) : null

  const avgVolVol = calculateAvgVolume(volumes)[lastIdx]

  return {
    ma5,
    ma20,
    rsi14,
    avgVolume20: avgVolVol != null ? Number(avgVolVol) : null,
    mfi14,
    adx14,
    sarIsUpTrend,
    haSignal,
    compositeSignal,
    macd,
    bollingerBands,
    stochastic,
    obvTrend,
    atr14,
    candlePatterns,
  }
})

const periodDays: Record<string, number> = {
  "1W": 7,
  "2W": 14,
  "3W": 21,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
}

export async function getChartData(ticker: string, period: string): Promise<ChartData | null> {
  const days = periodDays[period] ?? 21

  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { id: true, ticker: true },
  })

  if (!stock) return null

  const since = new Date()
  since.setDate(since.getDate() - days)

  const prices = await prisma.dailyPrice.findMany({
    where: { stockId: stock.id, date: { gte: since } },
    orderBy: { date: "asc" },
    select: { date: true, open: true, high: true, low: true, close: true, volume: true },
  })

  return {
    ticker: stock.ticker,
    period: period as ChartPeriod,
    data: prices.map((p) => ({
      time: p.date.toISOString().split("T")[0],
      open: Number(p.open),
      high: Number(p.high),
      low: Number(p.low),
      close: Number(p.close),
      volume: Number(p.volume),
    })),
  }
}
