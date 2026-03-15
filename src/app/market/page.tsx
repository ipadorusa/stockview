export const dynamic = "force-dynamic"

import { PageContainer } from "@/components/layout/page-container"
import { IndexCard } from "@/components/market/index-card"
import { StockRow } from "@/components/market/stock-row"
import { ExchangeRateBadge } from "@/components/common/exchange-rate-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

async function getData() {
  try {
    const [indicesRes, exchangeRes, krMoversRes, usMoversRes] = await Promise.all([
      fetch(`${BASE}/api/market/indices`, { next: { revalidate: 900 } }),
      fetch(`${BASE}/api/market/exchange-rate`, { next: { revalidate: 3600 } }),
      fetch(`${BASE}/api/market/kr/movers`, { next: { revalidate: 900 } }),
      fetch(`${BASE}/api/market/us/movers`, { next: { revalidate: 900 } }),
    ])
    return {
      indices: indicesRes.ok ? (await indicesRes.json()).indices : [],
      exchangeRate: exchangeRes.ok ? await exchangeRes.json() : null,
      krMovers: krMoversRes.ok ? await krMoversRes.json() : { gainers: [], losers: [] },
      usMovers: usMoversRes.ok ? await usMoversRes.json() : { gainers: [], losers: [] },
    }
  } catch {
    return { indices: [], exchangeRate: null, krMovers: { gainers: [], losers: [] }, usMovers: { gainers: [], losers: [] } }
  }
}

export default async function MarketPage() {
  const { indices, exchangeRate, krMovers, usMovers } = await getData()

  const krIndices = indices.filter((i: { symbol: string }) => ["KOSPI", "KOSDAQ"].includes(i.symbol))
  const usIndices = indices.filter((i: { symbol: string }) => ["SPX", "IXIC"].includes(i.symbol))

  return (
    <PageContainer>
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
            {krIndices.map((idx: { symbol: string; name: string; value: number; change: number; changePercent: number }) => (
              <IndexCard key={idx.symbol} name={idx.name} value={idx.value} change={idx.change} changePercent={idx.changePercent} variant="expanded" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-stock-up">상승 종목 TOP 5</h3>
              <div className="divide-y border rounded-lg overflow-hidden">
                {krMovers.gainers.map((s: { ticker: string; name: string; price: number; changePercent: number }, i: number) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={0} changePercent={s.changePercent} market="KR" rank={i + 1} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-stock-down">하락 종목 TOP 5</h3>
              <div className="divide-y border rounded-lg overflow-hidden">
                {krMovers.losers.map((s: { ticker: string; name: string; price: number; changePercent: number }, i: number) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={0} changePercent={s.changePercent} market="KR" rank={i + 1} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="us">
          <div className="grid grid-cols-2 gap-3 mb-8">
            {usIndices.map((idx: { symbol: string; name: string; value: number; change: number; changePercent: number }) => (
              <IndexCard key={idx.symbol} name={idx.name} value={idx.value} change={idx.change} changePercent={idx.changePercent} variant="expanded" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-stock-up">상승 종목 TOP 5</h3>
              <div className="divide-y border rounded-lg overflow-hidden">
                {usMovers.gainers.map((s: { ticker: string; name: string; price: number; changePercent: number }, i: number) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={0} changePercent={s.changePercent} market="US" rank={i + 1} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-stock-down">하락 종목 TOP 5</h3>
              <div className="divide-y border rounded-lg overflow-hidden">
                {usMovers.losers.map((s: { ticker: string; name: string; price: number; changePercent: number }, i: number) => (
                  <StockRow key={s.ticker} ticker={s.ticker} name={s.name} price={s.price} change={0} changePercent={s.changePercent} market="US" rank={i + 1} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
