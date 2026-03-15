import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params

  try {
    const stock = await prisma.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      include: { quotes: true },
    })

    if (!stock) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })
    }

    const quote = stock.quotes[0]

    return NextResponse.json({
      ticker: stock.ticker,
      name: stock.name,
      nameEn: stock.nameEn,
      market: stock.market,
      exchange: stock.exchange,
      sector: stock.sector,
      quote: quote
        ? {
            price: Number(quote.price),
            previousClose: Number(quote.previousClose),
            change: Number(quote.change),
            changePercent: Number(quote.changePercent),
            open: Number(quote.open),
            high: Number(quote.high),
            low: Number(quote.low),
            volume: Number(quote.volume),
            marketCap: quote.marketCap ? Number(quote.marketCap) : null,
            high52w: quote.high52w ? Number(quote.high52w) : null,
            low52w: quote.low52w ? Number(quote.low52w) : null,
            per: quote.per ? Number(quote.per) : null,
            pbr: quote.pbr ? Number(quote.pbr) : null,
            preMarketPrice: quote.preMarketPrice ? Number(quote.preMarketPrice) : null,
            postMarketPrice: quote.postMarketPrice ? Number(quote.postMarketPrice) : null,
            updatedAt: quote.updatedAt.toISOString(),
          }
        : null,
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
