import type { Metadata } from "next"
import { Suspense } from "react"
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildFinancialProduct } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"
import { AdDisclaimer } from "@/components/ads/ad-disclaimer"
import { Skeleton } from "@/components/ui/skeleton"
import { StockTabs } from "./stock-tabs"
import { ChartTabServer } from "./tabs/chart-tab-server"
import { InfoTabServer } from "./tabs/info-tab-server"
import { NewsTabServer } from "./tabs/news-tab-server"
import { DisclosureTabServer } from "./tabs/disclosure-tab-server"
import { DividendTabServer } from "./tabs/dividend-tab-server"
import { EarningsTabServer } from "./tabs/earnings-tab-server"
import { EventsTabWrapper } from "@/components/stock/events-tab-wrapper"
import { getChartData } from "@/lib/queries/stock-queries"
import type { StockDetail } from "@/types/stock"

export const dynamicParams = true
export const revalidate = 900

export async function generateStaticParams() {
  const stocks = await prisma.stock.findMany({
    where: { isActive: true, stockType: "STOCK" },
    select: { ticker: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
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

  const reportCount = stock
    ? await prisma.aiReport.count({ where: { stockId: stock.id } })
    : 0

  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ["chart", ticker.toUpperCase(), "3M"],
    queryFn: () => getChartData(ticker.toUpperCase(), "3M"),
  })

  const q = stock?.quotes[0]
  const f = stock?.fundamental
  const initialData: StockDetail | null = stock
    ? {
        ticker: stock.ticker,
        name: stock.name,
        nameEn: stock.nameEn ?? undefined,
        market: stock.market as "KR" | "US",
        exchange: stock.exchange,
        sector: stock.sector ?? undefined,
        stockType: (stock.stockType as "STOCK" | "ETF") ?? undefined,
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
          : (undefined as unknown as StockDetail["quote"]),
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
      <GtmPageView
        pageData={{
          page_name: "stock_detail",
          ticker: stock?.ticker ?? ticker.toUpperCase(),
          market: stock?.market ?? "",
          stock_name: stock?.name ?? "",
        }}
      />
      {stock && (
        <JsonLd
          data={buildFinancialProduct({
            ticker: stock.ticker,
            name: stock.name,
            market: stock.market,
            quote: initialData?.quote
              ? {
                  price: initialData.quote.price,
                  changePercent: initialData.quote.changePercent,
                  updatedAt: initialData.quote.updatedAt,
                }
              : null,
            description: initialData?.fundamental?.description,
          })}
        />
      )}
      <Breadcrumb
        items={[
          { label: "주식", href: "/market" },
          { label: stock?.name ?? ticker.toUpperCase(), href: `/stock/${ticker.toUpperCase()}` },
        ]}
      />
      <AdSlot slot="stock-detail-mid" format="rectangle" className="mx-4 md:mx-6 my-4" />

      <StockTabs
        ticker={ticker.toUpperCase()}
        stock={initialData}
        reportCount={reportCount}
        chartSlot={
          initialData ? (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
                <ChartTabServer ticker={ticker.toUpperCase()} stock={initialData} />
              </Suspense>
            </HydrationBoundary>
          ) : null
        }
        infoSlot={
          initialData ? (
            <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
              <InfoTabServer ticker={ticker.toUpperCase()} stock={initialData} />
            </Suspense>
          ) : null
        }
        newsSlot={
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
            <NewsTabServer ticker={ticker.toUpperCase()} />
          </Suspense>
        }
        eventsSlot={
          <EventsTabWrapper
            market={(stock?.market as "KR" | "US") ?? "KR"}
            dividendSlot={
              <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                <DividendTabServer ticker={ticker.toUpperCase()} />
              </Suspense>
            }
            earningsSlot={
              <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                <EarningsTabServer ticker={ticker.toUpperCase()} market={stock?.market as "KR" | "US" | undefined} />
              </Suspense>
            }
            disclosureSlot={
              stock?.market === "KR" ? (
                <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                  <DisclosureTabServer ticker={ticker.toUpperCase()} />
                </Suspense>
              ) : null
            }
          />
        }
      />

      <AdDisclaimer />
    </>
  )
}
