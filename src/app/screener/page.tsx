import type { Metadata } from "next"
import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { ScreenerClient } from "./screener-client"
import { getScreenerData } from "@/lib/screener"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"

export const metadata: Metadata = {
  title: "스크리너",
  description: "골든크로스, RSI 과매도 등 기술적 신호로 한국/미국 종목을 스크리닝하세요",
  openGraph: {
    title: "스크리너 - StockView",
    description: "골든크로스, RSI 과매도 등 기술적 신호로 한국/미국 종목을 스크리닝하세요",
  },
}

export default async function ScreenerPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["screener", "KR", "golden_cross"],
    queryFn: () => getScreenerData("KR", "golden_cross"),
  })

  return (
    <>
      <JsonLd data={buildWebPage("스크리너", "골든크로스, RSI 과매도 등 기술적 신호로 한국/미국 종목을 스크리닝하세요.", "/screener")} />
      <Breadcrumb items={[{ label: "스크리너", href: "/screener" }]} />
      <section className="max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 mb-6">
        <h2 className="text-lg font-semibold mb-2">스크리너란?</h2>
        <p className="text-sm text-muted-foreground mb-2">
          스크리너(Screener)는 수천 개의 종목 중에서 특정 기술적 조건을 충족하는 종목만 빠르게 필터링하는 도구입니다.
          골든크로스, RSI 과매도, 거래량 급증 등 검증된 기술적 분석 신호를 기반으로 매수·매도 타이밍을 포착할 수 있습니다.
        </p>
        <p className="text-sm text-muted-foreground">
          각 신호는 과거 주가 데이터에서 계산된 통계적 지표이며, 투자 판단의 보조 수단으로 활용됩니다. 단일 신호보다 여러 지표를 종합적으로 분석하는 것이 더 효과적입니다.
        </p>
      </section>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ScreenerClient />
      </HydrationBoundary>
      <AdSlot slot="screener-bottom" format="responsive" className="mx-4 md:mx-6 mt-6" />
    </>
  )
}
