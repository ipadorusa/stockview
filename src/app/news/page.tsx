import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"
import { NewsClient } from "./news-client"
import { getLatestNews } from "@/lib/queries"

export const revalidate = 300

export const metadata: Metadata = {
  title: "뉴스",
  description: "한국/미국 주식시장 뉴스를 실시간으로 확인하세요. 경제, 산업, 시장 뉴스를 카테고리별로 제공합니다.",
  openGraph: {
    title: "뉴스 - StockView",
    description: "한국/미국 주식시장 뉴스를 실시간으로 확인하세요.",
  },
}

export default async function NewsPage() {
  const initialNews = await getLatestNews(10)

  return (
    <PageContainer>
      <JsonLd data={buildWebPage("뉴스", "한국/미국 주식시장 뉴스를 실시간으로 확인하세요.", "/news")} />
      <Breadcrumb items={[{ label: "뉴스", href: "/news" }]} />
      <NewsClient initialNews={initialNews} />
    </PageContainer>
  )
}
