import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { getSectorList } from "@/lib/queries/sectors"

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

      {sectors.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">섹터 데이터가 없습니다</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectors.map((sector) => (
            <Link
              key={sector.name}
              href={`/sectors/${encodeURIComponent(sector.name)}`}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/40 transition-colors"
            >
              <span className="text-sm font-medium">{sector.name}</span>
              <span className="text-xs text-muted-foreground">{sector.stockCount}개 종목</span>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
