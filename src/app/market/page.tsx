import type { Metadata } from "next"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { PageContainer } from "@/components/layout/page-container"
import { IndexCard } from "@/components/market/index-card"
import { StockRow } from "@/components/market/stock-row"
import { ExchangeRateBadge } from "@/components/common/exchange-rate-badge"
import { SectorPerformance } from "@/components/market/sector-performance"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMarketIndices, getExchangeRate, getMarketMovers } from "@/lib/queries"

export const revalidate = 900 // 15분 ISR

export const metadata: Metadata = {
  title: "시장 개요 - StockView",
  description: "한국/미국 주식시장 지수, 상승/하락 종목, 환율 정보를 한눈에 확인하세요",
  openGraph: {
    title: "시장 개요 - StockView",
    description: "한국/미국 주식시장 지수, 상승/하락 종목, 환율 정보를 한눈에 확인하세요",
  },
}

export default async function MarketPage() {
  const [indices, exchangeRate, krMovers, usMovers] = await Promise.all([
    getMarketIndices(),
    getExchangeRate(),
    getMarketMovers("KR"),
    getMarketMovers("US"),
  ])

  const krIndices = indices.filter((i) => ["KOSPI", "KOSDAQ"].includes(i.symbol))
  const usIndices = indices.filter((i) => ["SPX", "IXIC"].includes(i.symbol))

  return (
    <PageContainer>
      <JsonLd data={buildWebPage("시장 현황", "한국/미국 주식시장 지수, 상승/하락 종목, 환율 정보를 한눈에 확인하세요.", "/market")} />
      <GtmPageView pageData={{ page_name: "market" }} />
      <Breadcrumb items={[{ label: "시장 개요", href: "/market" }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">시장 개요</h1>
        {exchangeRate && (
          <ExchangeRateBadge rate={exchangeRate.rate} change={exchangeRate.change} changePercent={exchangeRate.changePercent} />
        )}
      </div>

      <Tabs defaultValue="kr">
        <TabsList className="mb-6">
          <TabsTrigger value="kr">한국 시장</TabsTrigger>
          <TabsTrigger value="us">미국 시장</TabsTrigger>
        </TabsList>

        <TabsContent value="kr">
          <div className="grid grid-cols-2 gap-3 mb-8">
            {krIndices.map((idx) => (
              <IndexCard key={idx.symbol} name={idx.name} value={idx.value} change={idx.change} changePercent={idx.changePercent} variant="expanded" />
            ))}
          </div>
          {/* 섹터별 성과 */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">섹터별 성과</h2>
            <SectorPerformance market="KR" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-semibold mb-2 text-stock-up">상승 종목 TOP 5</h2>
              <div className="divide-y border rounded-lg overflow-hidden">
                {krMovers.gainers.map((s, i: number) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={s.change} changePercent={s.changePercent} market="KR" rank={i + 1} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-2 text-stock-down">하락 종목 TOP 5</h2>
              <div className="divide-y border rounded-lg overflow-hidden">
                {krMovers.losers.map((s, i: number) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={s.change} changePercent={s.changePercent} market="KR" rank={i + 1} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="us">
          <div className="grid grid-cols-2 gap-3 mb-8">
            {usIndices.map((idx) => (
              <IndexCard key={idx.symbol} name={idx.name} value={idx.value} change={idx.change} changePercent={idx.changePercent} variant="expanded" />
            ))}
          </div>
          {/* 섹터별 성과 */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">섹터별 성과</h2>
            <SectorPerformance market="US" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-semibold mb-2 text-stock-up">상승 종목 TOP 5</h2>
              <div className="divide-y border rounded-lg overflow-hidden">
                {usMovers.gainers.map((s, i: number) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={s.change} changePercent={s.changePercent} market="US" rank={i + 1} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-2 text-stock-down">하락 종목 TOP 5</h2>
              <div className="divide-y border rounded-lg overflow-hidden">
                {usMovers.losers.map((s, i: number) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={s.change} changePercent={s.changePercent} market="US" rank={i + 1} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AdSlot slot="market-bottom" format="leaderboard" className="mt-8" />
    </PageContainer>
  )
}
