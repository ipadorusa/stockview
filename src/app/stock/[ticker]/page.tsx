import type { Metadata } from "next"
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildFinancialProduct } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"
import { AdDisclaimer } from "@/components/ads/ad-disclaimer"
import { StockDetailClient } from "./stock-detail-client"
import type { StockDetail } from "@/types/stock"

export const dynamicParams = true
export const revalidate = 900

export async function generateStaticParams() {
  const stocks = await prisma.stock.findMany({
    where: { isActive: true, stockType: "STOCK" },
    select: { ticker: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  })
  return stocks.map((s) => ({ ticker: s.ticker }))
}

interface Props {
  params: Promise<{ ticker: string }>
}

const getStock = cache(async (ticker: string) => {
  return prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      quotes: { take: 1, orderBy: { updatedAt: "desc" } },
      fundamental: true,
    },
  })
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params
  const stock = await getStock(ticker)

  if (!stock) {
    return { title: `${ticker} - StockView` }
  }

  const quote = stock.quotes[0]
  const price = quote ? Number(quote.price) : null
  const currency = stock.market === "KR" ? "KRW" : "USD"
  const priceStr = price
    ? ` ${currency === "KRW" ? price.toLocaleString("ko-KR") + "원" : "$" + price.toFixed(2)}`
    : ""

  const title = `${stock.name} (${stock.ticker})${priceStr} - StockView`
  const description = `${stock.name} (${stock.ticker}) 실시간 시세, 차트, 뉴스 - StockView`

  return {
    title,
    description,
    alternates: { canonical: `/stock/${stock.ticker}` },
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}

export default async function StockDetailPage({ params }: Props) {
  const { ticker } = await params
  const stock = await getStock(ticker)

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
      <GtmPageView pageData={{ page_name: "stock_detail", ticker: stock?.ticker ?? ticker.toUpperCase(), market: stock?.market ?? "", stock_name: stock?.name ?? "" }} />
      {stock && (
        <JsonLd data={buildFinancialProduct({
          ticker: stock.ticker,
          name: stock.name,
          market: stock.market,
          quote: initialData?.quote ? { price: initialData.quote.price, changePercent: initialData.quote.changePercent, updatedAt: initialData.quote.updatedAt } : null,
          description: initialData?.fundamental?.description,
        })} />
      )}
      <Breadcrumb items={[
        { label: "주식", href: "/market" },
        { label: stock?.name ?? ticker.toUpperCase(), href: `/stock/${ticker.toUpperCase()}` },
      ]} />
      {initialData?.fundamental?.description && (
        <section className="px-4 md:px-6 mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-1">기업 개요</h2>
          <p className="text-sm leading-relaxed">{initialData.fundamental.description}</p>
        </section>
      )}
      <AdSlot slot="stock-detail-mid" format="rectangle" className="mx-4 md:mx-6 my-4" />
      <StockDetailClient ticker={ticker.toUpperCase()} initialData={initialData as StockDetail | null} />
      <AdDisclaimer />
    </>
  )
}
