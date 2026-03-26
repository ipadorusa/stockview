import type { Metadata } from "next"
import { Suspense } from "react"
import { BarChart3, FileText, GitCompareArrows, BookOpen } from "lucide-react"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"
import { IndexCard } from "@/components/market/index-card"
import { NewsCard } from "@/components/news/news-card"
import { PopularStocksTabs } from "@/components/market/popular-stocks-tabs"
import { QuickLinkCard, QuickLinkGrid } from "@/components/ui/quick-link-card"
import { HeroSection } from "@/components/home/hero-section"
import { CompactIndexBar } from "@/components/home/compact-index-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { AdSlot } from "@/components/ads/ad-slot"
import Link from "next/link"
import { getMarketIndices, getExchangeRates, getPopularStocks, getLatestNews } from "@/lib/queries"

export const metadata: Metadata = {
  title: "StockView - 한국/미국 주식 분석 서비스",
  description: "초보 투자자를 위한 한국/미국 주식 분석 서비스. 실시간 시세, 기술적 차트, 뉴스, AI 리포트를 한눈에.",
  openGraph: {
    title: "StockView - 한국/미국 주식 분석 서비스",
    description: "초보 투자자를 위한 한국/미국 주식 분석 서비스. 실시간 시세, 차트, 뉴스를 한눈에.",
  },
}

export const revalidate = 900 // 15분 ISR

const KR_SYMBOLS = new Set(["KOSPI", "KOSDAQ"])
const US_SYMBOLS = new Set(["SPX", "IXIC"])

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
  const mm = String(kst.getMonth() + 1).padStart(2, "0")
  const dd = String(kst.getDate()).padStart(2, "0")
  const hh = String(kst.getHours()).padStart(2, "0")
  const mi = String(kst.getMinutes()).padStart(2, "0")
  return `${mm}.${dd} ${hh}:${mi} 기준`
}

function IndexGroups({ indices }: { indices: Array<{ symbol: string; name: string; value: number; change: number; changePercent: number; updatedAt: string }> }) {
  const kr = indices.filter((idx) => KR_SYMBOLS.has(idx.symbol))
  const us = indices.filter((idx) => US_SYMBOLS.has(idx.symbol))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {kr.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">{formatDateTime(kr[0].updatedAt)}</p>
          <div className="grid grid-cols-2 gap-3">
            {kr.map((idx) => (
              <IndexCard key={idx.symbol} name={idx.name} value={idx.value} change={idx.change} changePercent={idx.changePercent} />
            ))}
          </div>
        </div>
      )}
      {us.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">{formatDateTime(us[0].updatedAt)}</p>
          <div className="grid grid-cols-2 gap-3">
            {us.map((idx) => (
              <IndexCard key={idx.symbol} name={idx.name} value={idx.value} change={idx.change} changePercent={idx.changePercent} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const EXCHANGE_RATE_LABELS: Record<string, string> = {
  "USD/KRW": "달러",
  "EUR/KRW": "유로",
  "JPY/KRW": "엔(100)",
  "CNY/KRW": "위안",
  "GBP/KRW": "파운드",
}

async function LatestNewsSection() {
  const news = await getLatestNews(4)
  return (
    <div className="flex flex-col gap-3">
      {news.length > 0 ? (
        news.map((item) => (
          <NewsCard key={item.id} news={item} variant="compact" />
        ))
      ) : (
        <div className="p-8 text-center text-sm text-muted-foreground border rounded-lg">뉴스가 없습니다</div>
      )}
    </div>
  )
}

function NewsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  )
}

export default async function HomePage() {
  const [indices, exchangeRates, krPopular, usPopular] = await Promise.all([
    getMarketIndices(),
    getExchangeRates(),
    getPopularStocks("KR", 10),
    getPopularStocks("US", 10),
  ])

  return (
    <PageContainer>
      <JsonLd data={buildWebPage("StockView - 주식 분석 서비스", "초보 투자자를 위한 한국/미국 주식 분석 서비스", "/")} />
      <GtmPageView pageData={{ page_name: "home" }} />
      <HeroSection />

      <h1 className="text-2xl font-bold mb-4">한국/미국 주식 시세</h1>

      {/* 컴팩트 지수+환율 바 */}
      {indices.length > 0 && (
        <CompactIndexBar indices={indices} exchangeRates={exchangeRates} />
      )}

      {/* 주요 지수 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">주요 지수</h2>
        {indices.length > 0 ? (
          <IndexGroups indices={indices} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`idx-sk-${i}`} className="h-24 rounded-xl" />
            ))}
          </div>
        )}
      </section>

      {/* 환율 */}
      <section className="mb-8">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-lg font-semibold">환율</h2>
          {exchangeRates.length > 0 && exchangeRates[0].updatedAt && (
            <span className="text-xs text-muted-foreground">{formatDateTime(exchangeRates[0].updatedAt)}</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {exchangeRates.length > 0 ? (
            exchangeRates.map((rate) => (
              <IndexCard
                key={rate.pair}
                name={rate.pair}
                label={EXCHANGE_RATE_LABELS[rate.pair] ?? rate.pair}
                value={rate.rate}
                change={rate.change}
                changePercent={rate.changePercent}
              />
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`fx-sk-${i}`} className="h-24 rounded-xl" />
            ))
          )}
        </div>
      </section>

      {/* 퀵 링크 */}
      <section className="mb-8">
        <QuickLinkGrid>
          <QuickLinkCard href="/screener" icon={BarChart3} label="스크리너" description="기술적 시그널로 종목 발굴" />
          <QuickLinkCard href="/reports" icon={FileText} label="AI 리포트" description="AI 기반 종목 분석" />
          <QuickLinkCard href="/compare" icon={GitCompareArrows} label="종목 비교" description="최대 5종목 비교 분석" />
          <QuickLinkCard href="/guide" icon={BookOpen} label="투자 가이드" description="초보 투자자를 위한 가이드" />
        </QuickLinkGrid>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 인기 종목 (거래대금 기준) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">인기 종목</h2>
            <Link href="/market" className="text-sm text-primary hover:underline">전체 보기</Link>
          </div>
          <PopularStocksTabs
            krStocks={krPopular.results}
            usStocks={usPopular.results}
            krUpdatedAt={krPopular.updatedAt}
            usUpdatedAt={usPopular.updatedAt}
          />
        </section>

        {/* 최신 뉴스 — Suspense로 스트리밍 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">최신 뉴스</h2>
            <Link href="/news" className="text-sm text-primary hover:underline">전체 보기</Link>
          </div>
          <Suspense fallback={<NewsSkeleton />}>
            <LatestNewsSection />
          </Suspense>
        </section>
      </div>

      <AdSlot slot="home-bottom" format="leaderboard" className="mt-8" />
    </PageContainer>
  )
}
