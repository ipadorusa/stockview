import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildArticle, buildFAQPage } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"

export const metadata: Metadata = {
  title: "ETF 투자 기초 — ETF 종류, 수수료, 분산투자 전략",
  description: "ETF란 무엇인지, ETF의 종류와 장점, 수수료 구조, 분산투자 전략까지. 초보자를 위한 ETF 투자 기초 가이드.",
  openGraph: {
    title: "ETF 투자 기초 - StockView",
    description: "ETF의 종류, 장점, 수수료, 분산투자 전략을 쉽게 설명합니다.",
  },
}

const faqs = [
  { question: "ETF와 일반 펀드의 차이점은 무엇인가요?", answer: "ETF는 주식처럼 거래소에서 실시간 매매가 가능하고, 일반 펀드보다 운용 수수료(총보수)가 낮습니다. 일반 펀드는 하루 1회 기준가로 거래되지만, ETF는 장중 언제든 시장가로 매수·매도할 수 있습니다." },
  { question: "ETF 투자 시 최소 금액은 얼마인가요?", answer: "ETF는 1주 단위로 거래되므로, ETF 1주 가격이 최소 투자 금액입니다. 한국 ETF는 보통 1만~5만원, 미국 ETF는 $50~$500 수준입니다." },
  { question: "ETF에서 배당도 받을 수 있나요?", answer: "네, 배당형 ETF는 보유 종목에서 발생하는 배당금을 투자자에게 분배합니다. 국내 ETF는 보통 연 1~4회, 미국 ETF는 분기별로 분배금을 지급합니다." },
]

export default function ETFBasicsPage() {
  return (
    <PageContainer>
      <JsonLd
        data={buildArticle(
          "ETF 투자 기초",
          "ETF의 종류, 장점, 수수료, 분산투자 전략을 쉽게 설명합니다",
          "/guide/etf-basics",
          "2026-03-22",
          "2026-03-22",
          "StockView"
        )}
      />
      <JsonLd data={buildFAQPage(faqs)} />
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>ETF 투자 기초</h1>
        <p>ETF(Exchange Traded Fund, 상장지수펀드)는 특정 지수나 자산군을 추종하도록 설계된 펀드를 주식처럼 거래소에서 자유롭게 매매할 수 있는 금융 상품입니다. 개별 종목 선정의 어려움 없이 시장 전체에 분산 투자할 수 있어, 투자 초보자부터 전문 투자자까지 폭넓게 활용되고 있습니다.</p>

        <h2>ETF의 장점</h2>
        <ul>
          <li><strong>분산 투자</strong>: 하나의 ETF에 수십~수백 개 종목이 포함되어 개별 기업 리스크를 줄일 수 있습니다.</li>
          <li><strong>낮은 수수료</strong>: 액티브 펀드 대비 운용 보수가 0.03%~0.5% 수준으로 매우 낮습니다.</li>
          <li><strong>실시간 거래</strong>: 주식처럼 장중 언제든 매매 가능하며, 일반 펀드처럼 환매를 기다릴 필요가 없습니다.</li>
          <li><strong>투명성</strong>: 보유 종목(PDF)이 매일 공개되어 어디에 투자하고 있는지 명확히 알 수 있습니다.</li>
        </ul>

        <h2>ETF의 종류</h2>
        <h3>추종 자산별 분류</h3>
        <ul>
          <li><strong>지수 추종 ETF</strong>: KOSPI 200, S&P 500 등 시장 지수를 그대로 따라가는 가장 기본적인 형태입니다.</li>
          <li><strong>섹터 ETF</strong>: 반도체, 2차전지, 헬스케어 등 특정 산업에 집중 투자합니다.</li>
          <li><strong>채권 ETF</strong>: 국채, 회사채 등 채권에 투자하여 안정적 이자 수익을 추구합니다.</li>
          <li><strong>원자재 ETF</strong>: 금, 은, 원유 등 실물 자산 가격을 추종합니다.</li>
          <li><strong>배당 ETF</strong>: 배당수익률이 높은 종목으로 구성되어 정기적인 분배금을 제공합니다.</li>
        </ul>

        <h3>운용 전략별 분류</h3>
        <ul>
          <li><strong>패시브 ETF</strong>: 지수를 그대로 추종하는 방식으로, 비용이 가장 낮습니다.</li>
          <li><strong>액티브 ETF</strong>: 펀드 매니저가 적극적으로 종목을 선정하여 지수 이상의 수익을 추구합니다.</li>
          <li><strong>레버리지/인버스 ETF</strong>: 지수의 2배 수익 또는 반대(-1배) 수익을 추구합니다. 단기 트레이딩용이며 장기 보유에는 부적합합니다.</li>
        </ul>

        <h2>ETF 수수료 이해하기</h2>
        <p>ETF 투자 시 발생하는 비용은 크게 두 가지입니다.</p>
        <ul>
          <li><strong>총보수(TER)</strong>: 운용사가 매일 순자산에서 차감하는 비용. 연 0.03%~0.5% 수준이 일반적입니다. NAV(순자산가치)에 이미 반영되어 별도 청구되지 않습니다.</li>
          <li><strong>매매 수수료</strong>: 증권사에 지불하는 거래 수수료. 국내 증권사 기준 0.015%~0.1% 수준입니다.</li>
        </ul>
        <p>장기 투자 시 총보수 차이가 복리 효과로 누적되므로, 유사한 ETF 중 총보수가 낮은 상품을 선택하는 것이 유리합니다.</p>

        <h2>ETF 분산 투자 전략</h2>
        <h3>코어-새틀라이트 전략</h3>
        <p>포트폴리오의 핵심(Core, 70-80%)은 시장 전체를 추종하는 지수 ETF로 구성하고, 나머지(Satellite, 20-30%)로 특정 섹터나 테마 ETF에 투자하는 전략입니다. 시장 평균 수익을 확보하면서도 추가 수익 기회를 잡을 수 있습니다.</p>

        <h3>자산 배분 전략</h3>
        <p>주식 ETF와 채권 ETF를 적절히 혼합하여 리스크를 관리합니다. 일반적으로 &quot;100 - 나이 = 주식 비중&quot; 공식이 참고됩니다. 예를 들어 30세 투자자는 주식 70%, 채권 30%로 시작할 수 있습니다.</p>

        <h2>자주 묻는 질문</h2>
        <h3>ETF와 일반 펀드의 차이점은?</h3>
        <p>ETF는 주식처럼 거래소에서 실시간 매매가 가능하고, 일반 펀드보다 운용 수수료가 낮습니다. 일반 펀드는 하루 1회 기준가로 거래되지만, ETF는 장중 언제든 시장가로 매수·매도할 수 있습니다.</p>

        <h3>ETF에서 배당도 받을 수 있나요?</h3>
        <p>네, 배당형 ETF는 보유 종목에서 발생하는 배당금을 투자자에게 분배합니다. 국내 ETF는 보통 연 1~4회, 미국 ETF는 분기별로 분배금을 지급합니다.</p>

        <div className="not-prose mt-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-semibold mb-2">StockView에서 ETF를 탐색하세요</p>
          <p className="text-sm text-muted-foreground mb-4">한국·미국 인기 ETF의 시세와 거래대금을 한눈에 확인할 수 있습니다.</p>
          <Link href="/etf" className="text-primary font-medium hover:underline">
            ETF 목록 바로가기 →
          </Link>
        </div>
      </article>
      <AdSlot slot="guide-bottom" format="responsive" className="mt-8" />
    </PageContainer>
  )
}
