import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { getSectorList } from "@/lib/queries/sectors"
import { SectorList } from "@/components/market/sector-list"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "섹터별 종목",
  description: "한국/미국 주식을 섹터별로 분류하여 확인하세요. 반도체, 2차전지, 금융 등 섹터별 종목 리스트.",
  openGraph: {
    title: "섹터별 종목 - StockView",
    description: "한국/미국 주식을 섹터별로 분류하여 확인하세요.",
  },
}

export default async function SectorsPage() {
  const sectors = await getSectorList()

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "섹터", href: "/sectors" }]} />
      <h1 className="text-2xl font-bold mb-6">섹터별 종목</h1>
      <SectorList initialKrSectors={sectors} />
    </PageContainer>
  )
}
