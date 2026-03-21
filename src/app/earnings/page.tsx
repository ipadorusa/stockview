import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { AdSlot } from "@/components/ads/ad-slot"
import { AdDisclaimer } from "@/components/ads/ad-disclaimer"
import { getUpcomingEarnings, getRecentEarningsResults } from "@/lib/queries/earnings"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "실적 캘린더",
  description: "한국/미국 기업 실적 발표 일정과 어닝 서프라이즈 결과를 확인하세요.",
  openGraph: {
    title: "실적 캘린더 - StockView",
    description: "한국/미국 기업 실적 발표 일정과 어닝 서프라이즈 결과를 확인하세요.",
  },
}

type EarningsItemBase = {
  ticker: string
  name: string
  market: string
  reportDate: string
  quarter: string
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: number | null
  revenueActual: number | null
  beat?: string | null
}

function BeatBadge({ beat }: { beat: string | null }) {
  if (!beat) return null
  const styles = {
    beat: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    miss: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    meet: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  }
  const labels = { beat: "Beat", miss: "Miss", meet: "Meet" }
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${styles[beat as keyof typeof styles]}`}>
      {labels[beat as keyof typeof labels]}
    </span>
  )
}

function EarningsTable({ events, showBeat }: { events: EarningsItemBase[]; showBeat?: boolean }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">실적 일정이 없습니다</p>
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 text-xs text-muted-foreground bg-muted/40 border-b">
        <span>종목</span>
        <span className="text-right w-20">발표일</span>
        <span className="text-right w-16">분기</span>
        <span className="text-right w-20">{showBeat ? "결과" : "EPS 예상"}</span>
      </div>
      {events.map((e, i) => (
        <Link
          key={`${e.ticker}-${e.quarter}-${i}`}
          href={`/stock/${e.ticker}`}
          className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
        >
          <div>
            <span className="text-sm font-medium">{e.name}</span>
            <span className="ml-2 text-xs text-muted-foreground font-mono">{e.ticker}</span>
          </div>
          <span className="text-sm text-right w-20">{e.reportDate}</span>
          <span className="text-xs text-muted-foreground text-right w-16">{e.quarter}</span>
          <span className="text-sm text-right w-20">
            {showBeat ? (
              <BeatBadge beat={e.beat ?? null} />
            ) : (
              e.epsEstimate ? `$${e.epsEstimate.toFixed(2)}` : "-"
            )}
          </span>
        </Link>
      ))}
    </div>
  )
}

export default async function EarningsPage() {
  const [krUpcoming, usUpcoming, krRecent, usRecent] = await Promise.all([
    getUpcomingEarnings("KR", 20),
    getUpcomingEarnings("US", 20),
    getRecentEarningsResults("KR", 20),
    getRecentEarningsResults("US", 20),
  ])

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "실적 캘린더", href: "/earnings" }]} />
      <h1 className="text-2xl font-bold mb-6">실적 캘린더</h1>

      {/* 예정된 실적 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">예정된 실적 발표</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">한국</h3>
            <EarningsTable events={krUpcoming} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">미국</h3>
            <EarningsTable events={usUpcoming} />
          </div>
        </div>
      </section>

      <AdSlot slot="earnings-mid" format="leaderboard" className="my-6" />

      {/* 최근 실적 결과 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">최근 실적 결과</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">한국</h3>
            <EarningsTable events={krRecent} showBeat />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">미국</h3>
            <EarningsTable events={usRecent} showBeat />
          </div>
        </div>
      </section>

      <AdSlot slot="earnings-bottom" format="leaderboard" className="my-6" />
      <AdDisclaimer />
    </PageContainer>
  )
}
