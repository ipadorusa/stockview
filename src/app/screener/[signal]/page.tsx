import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { AdSlot } from "@/components/ads/ad-slot"
import { AdDisclaimer } from "@/components/ads/ad-disclaimer"
import { getScreenerData, VALID_SIGNALS, type SignalType } from "@/lib/screener"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ signal: string }>
}

const SIGNAL_SLUGS: Record<string, SignalType> = {
  "golden-cross": "golden_cross",
  "rsi-oversold": "rsi_oversold",
  "volume-surge": "volume_surge",
  "bollinger-bounce": "bollinger_bounce",
  "macd-cross": "macd_cross",
}

const SIGNAL_META: Record<SignalType, { title: string; description: string; explanation: string }> = {
  golden_cross: {
    title: "골든크로스 종목",
    description: "단기 이동평균선(MA5)이 장기 이동평균선(MA20)을 상향 돌파한 종목을 확인하세요.",
    explanation: "골든크로스란? 단기 이동평균선(MA5)이 장기 이동평균선(MA20)을 상향 돌파하는 기술적 매수 신호입니다. 단기적인 상승 추세 전환을 의미할 수 있으나, 다른 지표와 함께 종합적으로 판단해야 합니다.",
  },
  rsi_oversold: {
    title: "RSI 과매도 반등 종목",
    description: "RSI 14가 35 이하에서 반등 전환한 종목을 확인하세요.",
    explanation: "RSI(상대강도지수) 과매도란? RSI 14 값이 35 이하로 하락한 후 다시 상승 전환하는 패턴입니다. 과도한 매도 이후 반등 가능성을 시사하지만, 추세 하락 중에는 추가 하락도 가능합니다.",
  },
  volume_surge: {
    title: "거래량 급증 종목",
    description: "당일 거래량이 20일 평균의 2배 이상인 종목을 확인하세요.",
    explanation: "거래량 급증이란? 당일 거래량이 최근 20일 평균 거래량의 2배를 초과하는 현상입니다. 주가 변동의 시작점이 될 수 있으며, 상승/하락 방향과 함께 판단해야 합니다.",
  },
  bollinger_bounce: {
    title: "볼린저밴드 반등 종목",
    description: "볼린저밴드 하단에서 반등 전환한 종목을 확인하세요.",
    explanation: "볼린저밴드 반등이란? 주가가 볼린저밴드 하단(20일 이평 - 2σ)에 근접한 후 상승 전환하는 패턴입니다. 통계적으로 밴드 내 회귀 경향이 있으나, 밴드 이탈 시 추세 지속도 가능합니다.",
  },
  macd_cross: {
    title: "MACD 골든크로스 종목",
    description: "MACD 라인이 시그널 라인을 상향 돌파한 종목을 확인하세요.",
    explanation: "MACD 골든크로스란? MACD 라인(12일 EMA - 26일 EMA)이 시그널 라인(MACD의 9일 EMA)을 상향 돌파하는 기술적 매수 신호입니다. 추세 전환의 초기 신호일 수 있습니다.",
  },
}

export function generateStaticParams() {
  return Object.keys(SIGNAL_SLUGS).map((signal) => ({ signal }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { signal: slug } = await params
  const signalType = SIGNAL_SLUGS[slug]
  if (!signalType) return { title: "스크리너" }

  const meta = SIGNAL_META[signalType]
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/screener/${slug}` },
    openGraph: { title: `${meta.title} - StockView`, description: meta.description },
  }
}

export const dynamicParams = false
export const revalidate = 900

export default async function ScreenerSignalPage({ params }: Props) {
  const { signal: slug } = await params
  const signalType = SIGNAL_SLUGS[slug]
  if (!signalType) notFound()

  const meta = SIGNAL_META[signalType]

  const krData = await getScreenerData("KR", signalType)

  return (
    <PageContainer>
      <Breadcrumb items={[
        { label: "스크리너", href: "/screener" },
        { label: meta.title, href: `/screener/${slug}` },
      ]} />

      <h1 className="text-2xl font-bold mb-2">{meta.title}</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">{meta.explanation}</p>

      <section className="mb-8">
        <SignalResultTable stocks={krData.stocks} total={krData.total} message={krData.message} />
      </section>

      <AdSlot slot="screener-signal-bottom" format="responsive" className="my-6" />
      <AdDisclaimer />
    </PageContainer>
  )
}

function SignalResultTable({ stocks, total, message }: {
  stocks: { ticker: string; name: string; price: number; changePercent: number; volume: number }[]
  total: number
  message?: string
}) {
  if (message) {
    return <p className="text-sm text-muted-foreground py-4">{message}</p>
  }
  if (stocks.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">조건에 해당하는 종목이 없습니다</p>
  }

  return (
    <>
      <p className="text-xs text-muted-foreground mb-2">총 {total}개 종목</p>
      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs text-muted-foreground bg-muted/40 border-b">
          <span>종목</span>
          <span className="text-right w-24">현재가</span>
          <span className="text-right w-16">등락률</span>
          <span className="text-right w-20 hidden sm:block">거래량</span>
        </div>
        {stocks.map((stock) => {
          const isUp = stock.changePercent > 0
          const isDown = stock.changePercent < 0
          return (
            <Link
              key={stock.ticker}
              href={`/stock/${stock.ticker}`}
              className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
            >
              <div>
                <span className="text-sm font-medium">{stock.name}</span>
                <span className="ml-2 text-xs text-muted-foreground font-mono">{stock.ticker}</span>
              </div>
              <span className="text-sm font-mono text-right w-24">{stock.price.toLocaleString()}</span>
              <span className={cn(
                "text-sm font-mono text-right w-16",
                isUp && "text-stock-up",
                isDown && "text-stock-down",
              )}>
                {isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
              </span>
              <span className="text-xs text-muted-foreground text-right w-20 hidden sm:block">
                {stock.volume.toLocaleString()}
              </span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
