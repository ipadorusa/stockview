import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateMA, calculateRSI, calculateMACD, calculateBollingerBands } from "@/lib/utils/technical-indicators"

export const revalidate = 900

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

export async function GET(req: NextRequest) {
  const market = (req.nextUrl.searchParams.get("market") ?? "KR") as "KR" | "US"
  const signal = (req.nextUrl.searchParams.get("signal") ?? "golden_cross") as SignalType

  try {
    const stocks = await prisma.stock.findMany({
      where: { market, isActive: true },
      select: {
        ticker: true,
        name: true,
        quotes: {
          select: { price: true, changePercent: true, volume: true },
          take: 1,
        },
        dailyPrices: {
          select: { close: true, volume: true, date: true },
          orderBy: { date: "asc" },
          take: 60,
        },
      },
    })

    const results: {
      ticker: string
      name: string
      price: number
      changePercent: number
      volume: number
      signalLabel: string
    }[] = []

    for (const stock of stocks) {
      if (stock.dailyPrices.length < 26) continue
      if (stock.quotes.length === 0) continue

      const closes = stock.dailyPrices.map((d) => Number(d.close))
      const volumes = stock.dailyPrices.map((d) => Number(d.volume))
      const n = closes.length
      const price = Number(stock.quotes[0].price)
      const changePercent = Number(stock.quotes[0].changePercent)
      const volume = Number(stock.quotes[0].volume)

      let matched = false

      if (signal === "golden_cross") {
        const ma5 = calculateMA(closes, 5)
        const ma20 = calculateMA(closes, 20)
        const prev = n - 2
        const curr = n - 1
        if (
          ma5[prev] != null && ma20[prev] != null &&
          ma5[curr] != null && ma20[curr] != null &&
          (ma5[prev] as number) <= (ma20[prev] as number) &&
          (ma5[curr] as number) > (ma20[curr] as number)
        ) matched = true

      } else if (signal === "rsi_oversold") {
        const rsi = calculateRSI(closes, 14)
        const prev = n - 2
        const curr = n - 1
        if (
          rsi[prev] != null && rsi[curr] != null &&
          (rsi[prev] as number) < 35 &&
          (rsi[curr] as number) > (rsi[prev] as number)
        ) matched = true

      } else if (signal === "volume_surge") {
        if (volumes.length >= 21) {
          const avgVol = volumes.slice(n - 21, n - 1).reduce((a, b) => a + b, 0) / 20
          if (avgVol > 0 && volume > avgVol * 2) matched = true
        }

      } else if (signal === "bollinger_bounce") {
        const bb = calculateBollingerBands(closes, 20, 2)
        const prev = n - 2
        const curr = n - 1
        if (
          bb.lower[prev] != null && bb.lower[curr] != null &&
          closes[prev] <= (bb.lower[prev] as number) * 1.01 &&
          closes[curr] > closes[prev]
        ) matched = true

      } else if (signal === "macd_cross") {
        const { macdLine, signal: sig } = calculateMACD(closes, 12, 26, 9)
        const prev = n - 2
        const curr = n - 1
        if (
          macdLine[prev] != null && sig[prev] != null &&
          macdLine[curr] != null && sig[curr] != null &&
          (macdLine[prev] as number) <= (sig[prev] as number) &&
          (macdLine[curr] as number) > (sig[curr] as number)
        ) matched = true
      }

      if (matched) {
        results.push({
          ticker: stock.ticker,
          name: stock.name,
          price,
          changePercent,
          volume,
          signalLabel: SIGNAL_LABELS[signal],
        })
      }
    }

    // changePercent 내림차순, 최대 20개
    results.sort((a, b) => b.changePercent - a.changePercent)
    const top = results.slice(0, 20)

    return NextResponse.json({ stocks: top, signal, market, total: results.length }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
