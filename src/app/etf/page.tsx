import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { StockRow } from "@/components/market/stock-row"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPopularETFs } from "@/lib/queries"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { AdSlot } from "@/components/ads/ad-slot"

export const revalidate = 900 // 15분 ISR

export const metadata: Metadata = {
  title: "ETF - StockView",
  description: "한국/미국 ETF 목록과 시세를 확인하세요",
  openGraph: {
    title: "ETF - StockView",
    description: "한국/미국 ETF 목록과 시세를 확인하세요",
  },
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(d)
}

export default async function ETFPage() {
  const [krData, usData] = await Promise.all([getPopularETFs("KR", 30), getPopularETFs("US", 30)])

  return (
    <PageContainer>
      <GtmPageView pageData={{ page_name: "etf_list" }} />
      <Breadcrumb items={[{ label: "ETF", href: "/etf" }]} />
      <h1 className="text-2xl font-bold mb-4">ETF</h1>

      <section className="mb-6 text-sm text-muted-foreground space-y-2">
        <p>
          ETF(Exchange Traded Fund, 상장지수펀드)는 특정 지수, 섹터, 원자재 등을 추종하도록 설계된 펀드를 주식처럼 거래소에서 매매할 수 있는 금융 상품입니다. 개별 종목 선정의 부담 없이 시장 전체 또는 특정 테마에 분산 투자할 수 있어, 초보 투자자부터 전문 투자자까지 폭넓게 활용됩니다.
        </p>
        <p>
          거래대금이 높은 ETF일수록 유동성이 풍부하여 원하는 가격에 매매하기 쉽고, 매수·매도 호가 차이(스프레드)도 작습니다. 아래 목록은 거래대금 기준으로 정렬된 인기 ETF입니다.
        </p>
      </section>

      <Tabs defaultValue="kr">
        <TabsList className="mb-4">
          <TabsTrigger value="kr">한국 ETF</TabsTrigger>
          <TabsTrigger value="us">미국 ETF</TabsTrigger>
        </TabsList>

        <TabsContent value="kr">
          <p className="text-xs text-muted-foreground mb-2">
            거래대금 기준{krData.updatedAt ? ` · ${formatDate(krData.updatedAt)} 기준` : ""}
          </p>
          <div className="divide-y rounded-lg border overflow-hidden">
            {krData.results.length > 0 ? (
              krData.results.map((etf, i: number) => (
                <StockRow
                  key={etf.ticker}
                  ticker={etf.ticker}
                  name={etf.name}
                  price={etf.price}
                  change={etf.change}
                  changePercent={etf.changePercent}
                  market={etf.market as "KR" | "US"}
                  stockType="ETF"
                  rank={i + 1}
                  tradingValue={etf.tradingValue}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="us">
          <p className="text-xs text-muted-foreground mb-2">
            거래대금 기준{usData.updatedAt ? ` · ${formatDate(usData.updatedAt)} 기준` : ""}
          </p>
          <div className="divide-y rounded-lg border overflow-hidden">
            {usData.results.length > 0 ? (
              usData.results.map((etf, i: number) => (
                <StockRow
                  key={etf.ticker}
                  ticker={etf.ticker}
                  name={etf.name}
                  price={etf.price}
                  change={etf.change}
                  changePercent={etf.changePercent}
                  market={etf.market as "KR" | "US"}
                  stockType="ETF"
                  rank={i + 1}
                  tradingValue={etf.tradingValue}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AdSlot slot="etf-bottom" format="leaderboard" className="mt-8" />
    </PageContainer>
  )
}
