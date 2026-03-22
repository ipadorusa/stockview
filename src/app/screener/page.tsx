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
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ScreenerClient />
      </HydrationBoundary>
      <AdSlot slot="screener-bottom" format="responsive" className="mx-4 md:mx-6 mt-6" />
    </>
  )
}
