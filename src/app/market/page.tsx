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

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${mm}.${dd} ${hh}:${mi} 기준`
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

      <section className="mb-6 text-sm text-muted-foreground space-y-2">
        <p>
          시장 개요 페이지에서는 한국(KOSPI·KOSDAQ)과 미국(S&P 500·NASDAQ) 주요 지수의 실시간 동향을 한눈에 파악할 수 있습니다.
          지수는 시장 전체의 건강 상태를 나타내는 체온계 같은 역할을 하며, 개별 종목 투자 전 시장 흐름을 먼저 확인하는 것이 중요합니다.
        </p>
        <p>
          상승·하락 종목 TOP 5와 섹터별 성과를 통해 현재 시장에서 어떤 업종이 주목받고 있는지, 자금이 어디로 흐르고 있는지 파악할 수 있습니다.
        </p>
      </section>

      <Tabs defaultValue="kr">
        <TabsList className="mb-6">
          <TabsTrigger value="kr">한국 시장</TabsTrigger>
          <TabsTrigger value="us">미국 시장</TabsTrigger>
        </TabsList>

        <TabsContent value="kr">
          {krIndices.length > 0 && (
            <p className="text-xs text-muted-foreground mb-2">{formatDateTime(krIndices[0].updatedAt)}</p>
          )}
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
          {usIndices.length > 0 && (
            <p className="text-xs text-muted-foreground mb-2">{formatDateTime(usIndices[0].updatedAt)}</p>
          )}
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
