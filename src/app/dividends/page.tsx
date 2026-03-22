import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"
import { AdDisclaimer } from "@/components/ads/ad-disclaimer"
import { getUpcomingDividends, getRecentDividends, getHighDividendStocks } from "@/lib/queries/dividends"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "배당 캘린더",
  description: "한국/미국 주식 배당금 일정, 배당락일, 고배당 종목을 확인하세요. 배당수익률 TOP 10 종목 정보 제공.",
  openGraph: {
    title: "배당 캘린더 - StockView",
    description: "한국/미국 주식 배당금 일정, 배당락일, 고배당 종목을 확인하세요.",
  },
}

function DividendTable({ dividends }: { dividends: Awaited<ReturnType<typeof getUpcomingDividends>> }) {
  if (dividends.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">배당 일정이 없습니다</p>
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 text-xs text-muted-foreground bg-muted/40 border-b">
        <span>종목</span>
        <span className="text-right w-20">배당락일</span>
        <span className="text-right w-20">배당금</span>
        <span className="text-right w-16">수익률</span>
      </div>
      {dividends.map((d, i) => (
        <Link
          key={`${d.ticker}-${d.exDate}-${i}`}
          href={`/stock/${d.ticker}`}
          className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
        >
          <div>
            <span className="text-sm font-medium">{d.name}</span>
            <span className="ml-2 text-xs text-muted-foreground font-mono">{d.ticker}</span>
          </div>
          <span className="text-sm text-right w-20">{d.exDate}</span>
          <span className="text-sm font-mono text-right w-20">
            {d.currency === "KRW" ? `${d.amount.toLocaleString()}원` : `$${d.amount.toFixed(2)}`}
          </span>
          <span className="text-sm text-right w-16">
            {d.dividendYield ? `${d.dividendYield.toFixed(2)}%` : "-"}
          </span>
        </Link>
      ))}
    </div>
  )
}

function HighDividendSection({ stocks, title }: { stocks: Awaited<ReturnType<typeof getHighDividendStocks>>; title: string }) {
  if (stocks.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-2 text-xs text-muted-foreground bg-muted/40 border-b">
          <span className="w-6">#</span>
          <span>종목</span>
          <span className="text-right w-20">현재가</span>
          <span className="text-right w-16">배당률</span>
        </div>
        {stocks.map((s, i) => (
          <Link
            key={s.ticker}
            href={`/stock/${s.ticker}`}
            className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
          >
            <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
            <div>
              <span className="text-sm font-medium">{s.name}</span>
              <span className="ml-2 text-xs text-muted-foreground font-mono">{s.ticker}</span>
            </div>
            <span className="text-sm font-mono text-right w-20">
              {s.price ? s.price.toLocaleString() : "-"}
            </span>
            <span className="text-sm font-semibold text-primary text-right w-16">
              {s.dividendYield.toFixed(2)}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function DividendsPage() {
  const [krUpcoming, usUpcoming, krRecent, usRecent, krHigh, usHigh] = await Promise.all([
    getUpcomingDividends("KR", 20),
    getUpcomingDividends("US", 20),
    getRecentDividends("KR", 20),
    getRecentDividends("US", 20),
    getHighDividendStocks("KR", 10),
    getHighDividendStocks("US", 10),
  ])

  return (
    <PageContainer>
      <JsonLd data={buildWebPage("배당 캘린더", "한국/미국 주식 배당금 일정, 배당락일, 고배당 종목을 확인하세요.", "/dividends")} />
      <Breadcrumb items={[{ label: "배당 캘린더", href: "/dividends" }]} />
      <h1 className="text-2xl font-bold mb-4">배당 캘린더</h1>

      <section className="mb-6 text-sm text-muted-foreground space-y-2">
        <p>
          배당(Dividend)이란 기업이 영업으로 벌어들인 이익의 일부를 주주에게 돌려주는 것을 말합니다. 배당 투자는 주가 상승에 따른 시세 차익 외에도 정기적인 현금 수입을 기대할 수 있어 장기 투자자에게 인기 있는 전략입니다.
        </p>
        <p>
          배당수익률(Dividend Yield)은 현재 주가 대비 연간 배당금의 비율로, 높을수록 주가 대비 많은 배당을 받는다는 의미입니다. 배당락일(Ex-Dividend Date)은 이 날 이후 매수 시 해당 배당을 받을 수 없는 날짜이므로, 배당을 받으려면 배당락일 전날까지 주식을 보유해야 합니다.
        </p>
      </section>

      {/* 한국 배당 일정 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">한국 주식 배당 일정</h2>
        {krUpcoming.length > 0 ? (
          <>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">예정된 배당</h3>
            <DividendTable dividends={krUpcoming} />
          </>
        ) : (
          <>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">최근 배당</h3>
            <DividendTable dividends={krRecent} />
          </>
        )}
      </section>

      <AdSlot slot="dividends-mid" format="leaderboard" className="my-6" />

      {/* 미국 배당 일정 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">미국 주식 배당 일정</h2>
        {usUpcoming.length > 0 ? (
          <>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">예정된 배당</h3>
            <DividendTable dividends={usUpcoming} />
          </>
        ) : (
          <>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">최근 배당</h3>
            <DividendTable dividends={usRecent} />
          </>
        )}
      </section>

      {/* 고배당 종목 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <HighDividendSection stocks={krHigh} title="한국 고배당 종목 TOP 10" />
        <HighDividendSection stocks={usHigh} title="미국 고배당 종목 TOP 10" />
      </div>

      <AdSlot slot="dividends-bottom" format="leaderboard" className="my-6" />
      <AdDisclaimer />
    </PageContainer>
  )
}
