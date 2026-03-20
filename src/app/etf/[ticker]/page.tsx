import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { StockDetailClient } from "@/app/stock/[ticker]/stock-detail-client"
import type { StockDetail } from "@/types/stock"

interface Props {
  params: Promise<{ ticker: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params

  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: { quotes: true },
  })

  if (!stock) {
    return { title: `${ticker} ETF - StockView` }
  }

  const quote = stock.quotes[0]
  const price = quote ? Number(quote.price) : null
  const currency = stock.market === "KR" ? "KRW" : "USD"
  const priceStr = price
    ? ` ${currency === "KRW" ? price.toLocaleString("ko-KR") + "원" : "$" + price.toFixed(2)}`
    : ""

  const title = `${stock.name} (${stock.ticker}) ETF${priceStr} - StockView`
  const description = `${stock.name} (${stock.ticker}) ETF 실시간 시세, 차트 - StockView`

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  }
}

export default async function ETFDetailPage({ params }: Props) {
  const { ticker } = await params

  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      quotes: { take: 1, orderBy: { updatedAt: "desc" } },
      fundamental: true,
    },
  })

  const q = stock?.quotes[0]
  const f = stock?.fundamental
  const initialData = stock
    ? {
        ticker: stock.ticker,
        name: stock.name,
        nameEn: stock.nameEn ?? undefined,
        market: stock.market,
        exchange: stock.exchange,
        sector: stock.sector ?? undefined,
        stockType: stock.stockType,
        quote: q
          ? {
              price: Number(q.price),
              previousClose: Number(q.previousClose),
              change: Number(q.change),
              changePercent: Number(q.changePercent),
              open: Number(q.open),
              high: Number(q.high),
              low: Number(q.low),
              volume: Number(q.volume),
              marketCap: q.marketCap ? Number(q.marketCap) : undefined,
              high52w: q.high52w ? Number(q.high52w) : undefined,
              low52w: q.low52w ? Number(q.low52w) : undefined,
              per: q.per ? Number(q.per) : undefined,
              pbr: q.pbr ? Number(q.pbr) : undefined,
              preMarketPrice: q.preMarketPrice ? Number(q.preMarketPrice) : undefined,
              postMarketPrice: q.postMarketPrice ? Number(q.postMarketPrice) : undefined,
              updatedAt: q.updatedAt.toISOString(),
            }
          : undefined,
        fundamental: f
          ? {
              eps: f.eps ? Number(f.eps) : null,
              forwardEps: f.forwardEps ? Number(f.forwardEps) : null,
              dividendYield: f.dividendYield ? Number(f.dividendYield) : null,
              roe: f.roe ? Number(f.roe) : null,
              debtToEquity: f.debtToEquity ? Number(f.debtToEquity) : null,
              beta: f.beta ? Number(f.beta) : null,
              revenue: f.revenue ? Number(f.revenue) : null,
              netIncome: f.netIncome ? Number(f.netIncome) : null,
              description: f.description,
              employeeCount: f.employeeCount,
            }
          : null,
      }
    : null

  return (
    <>
      <GtmPageView pageData={{ page_name: "etf_detail", ticker: stock?.ticker ?? ticker.toUpperCase() }} />
      <StockDetailClient ticker={ticker.toUpperCase()} initialData={initialData as StockDetail | null} />
    </>
  )
}
