import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildArticle, buildFAQPage } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"

export const metadata: Metadata = {
  title: "재무제표 읽는 법 — PER, PBR, ROE, 영업이익률 완전 가이드",
  description: "주식 투자에 필수적인 재무제표 핵심 지표를 쉽게 설명합니다. PER, PBR, ROE, EPS, 영업이익률의 의미와 활용법.",
  openGraph: {
    title: "재무제표 읽는 법 - StockView",
    description: "PER, PBR, ROE 등 핵심 재무 지표의 의미와 활용법을 쉽게 설명합니다.",
  },
}

const faqs = [
  { question: "PER이 낮으면 무조건 저평가인가요?", answer: "아닙니다. PER이 낮은 이유가 기업 실적 악화 전망이나 구조적 문제 때문일 수 있습니다. 같은 업종 내 다른 기업과 비교하고, PER이 낮은 이유를 반드시 확인해야 합니다." },
  { question: "ROE가 높으면 항상 좋은 기업인가요?", answer: "일반적으로 ROE가 높으면 자기자본을 효율적으로 활용한다는 의미이지만, 과도한 부채로 자기자본이 적어 ROE가 높아진 경우도 있습니다. 부채비율과 함께 확인하는 것이 중요합니다." },
  { question: "재무제표는 어디서 확인할 수 있나요?", answer: "한국 기업은 금융감독원 전자공시시스템(DART), 미국 기업은 SEC의 EDGAR에서 확인할 수 있습니다. StockView 종목 상세 페이지에서도 주요 재무 지표를 확인할 수 있습니다." },
]

export default function ReadingFinancialsPage() {
  return (
    <PageContainer>
      <JsonLd
        data={buildArticle(
          "재무제표 읽는 법",
          "PER, PBR, ROE 등 핵심 재무 지표의 의미와 활용법",
          "/guide/reading-financials",
          "2026-03-22",
          "2026-03-22",
          "StockView"
        )}
      />
      <JsonLd data={buildFAQPage(faqs)} />
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>재무제표 읽는 법</h1>
        <p>재무제표는 기업의 건강 상태를 보여주는 성적표입니다. 복잡해 보이지만, 핵심 지표 몇 가지만 이해하면 기업의 가치를 빠르게 판단할 수 있습니다. 이 가이드에서는 주식 투자에 가장 많이 사용되는 재무 지표를 알기 쉽게 설명합니다.</p>

        <h2>PER (주가수익비율)</h2>
        <p><strong>PER = 주가 ÷ EPS(주당순이익)</strong></p>
        <p>PER은 현재 주가가 기업의 1주당 순이익의 몇 배인지를 나타냅니다. &quot;이 기업의 1년 순이익으로 현재 주가를 회수하려면 몇 년 걸리는가&quot;로 이해할 수 있습니다.</p>
        <ul>
          <li><strong>PER 10배</strong>: 현재 이익 수준이 유지되면 10년간의 이익으로 투자 원금 회수</li>
          <li><strong>업종 평균 대비 낮은 PER</strong>: 상대적으로 저평가 가능성 (단, 실적 악화 전망일 수 있음)</li>
          <li><strong>업종 평균 대비 높은 PER</strong>: 성장 기대가 반영된 것 (성장주에 흔함)</li>
        </ul>
        <p>PER은 같은 업종 내 기업끼리 비교해야 의미가 있습니다. IT·바이오 같은 성장 업종은 PER 30~50배도 일반적이고, 금융·유틸리티는 5~15배가 보통입니다.</p>

        <h2>PBR (주가순자산비율)</h2>
        <p><strong>PBR = 주가 ÷ BPS(주당순자산)</strong></p>
        <p>PBR은 기업의 순자산(자산 - 부채) 대비 주가가 얼마나 평가받고 있는지를 보여줍니다.</p>
        <ul>
          <li><strong>PBR 1 미만</strong>: 기업을 청산했을 때의 가치(순자산)보다 시장 가격이 낮다는 의미. 이론적으로 저평가이지만, 수익성이 낮은 기업일 수 있습니다.</li>
          <li><strong>PBR 1 이상</strong>: 시장이 기업의 미래 가치를 순자산 이상으로 평가하고 있다는 뜻입니다.</li>
        </ul>

        <h2>ROE (자기자본이익률)</h2>
        <p><strong>ROE = 순이익 ÷ 자기자본 × 100</strong></p>
        <p>ROE는 주주가 투자한 돈으로 기업이 얼마나 효율적으로 이익을 창출하는지를 측정합니다. 워런 버핏이 가장 중시하는 지표로도 유명합니다.</p>
        <ul>
          <li><strong>ROE 15% 이상</strong>: 우수한 수익성으로 평가됩니다.</li>
          <li><strong>ROE 10~15%</strong>: 양호한 수준입니다.</li>
          <li><strong>ROE 5% 미만</strong>: 자본 효율성이 낮으며, 은행 예금 금리보다 못할 수 있습니다.</li>
        </ul>
        <p>단, ROE가 높더라도 부채비율이 과도하면(자기자본이 적으므로) 위험 신호일 수 있습니다. ROE는 부채비율과 함께 확인하세요.</p>

        <h2>EPS (주당순이익)</h2>
        <p><strong>EPS = 순이익 ÷ 발행주식수</strong></p>
        <p>EPS는 기업이 주당 얼마의 이익을 벌었는지를 나타내며, 기업의 수익성을 가장 직관적으로 보여주는 지표입니다. 분기·연간 실적 발표 시 가장 주목받는 숫자이며, 시장 예상치(컨센서스)와의 차이가 주가 변동의 핵심 요인이 됩니다.</p>

        <h2>영업이익률</h2>
        <p><strong>영업이익률 = 영업이익 ÷ 매출 × 100</strong></p>
        <p>영업이익률은 기업의 본업에서 얼마나 효율적으로 이익을 창출하는지를 보여줍니다. 일회성 이익이나 금융 비용을 제외한 순수한 사업 능력을 측정할 수 있습니다.</p>
        <ul>
          <li><strong>영업이익률 20% 이상</strong>: 매우 우수한 수익 구조 (반도체, 소프트웨어 등)</li>
          <li><strong>영업이익률 10~20%</strong>: 양호한 수준</li>
          <li><strong>영업이익률 5% 미만</strong>: 박리다매 구조이거나 경쟁이 치열한 업종</li>
        </ul>

        <h2>재무제표 분석 체크리스트</h2>
        <ol>
          <li>같은 업종의 PER과 비교하여 상대적 밸류에이션 확인</li>
          <li>PBR 1 미만 여부로 자산가치 대비 저평가 확인</li>
          <li>ROE가 3년 이상 꾸준히 10% 이상 유지되는지 확인</li>
          <li>영업이익률 추이가 개선되고 있는지 확인</li>
          <li>부채비율(부채÷자기자본)이 100% 이하인지 확인</li>
        </ol>

        <h2>자주 묻는 질문</h2>
        <h3>PER이 낮으면 무조건 저평가인가요?</h3>
        <p>아닙니다. PER이 낮은 이유가 기업 실적 악화 전망이나 구조적 문제 때문일 수 있습니다. 같은 업종 내 다른 기업과 비교하고, PER이 낮은 이유를 반드시 확인해야 합니다.</p>

        <h3>ROE가 높으면 항상 좋은 기업인가요?</h3>
        <p>일반적으로 ROE가 높으면 자기자본을 효율적으로 활용한다는 의미이지만, 과도한 부채로 자기자본이 적어 ROE가 높아진 경우도 있습니다. 부채비율과 함께 확인하는 것이 중요합니다.</p>

        <div className="not-prose mt-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-semibold mb-2">StockView에서 재무 지표를 확인하세요</p>
          <p className="text-sm text-muted-foreground mb-4">종목 상세 페이지에서 PER, PBR, ROE 등 주요 재무 지표를 한눈에 확인할 수 있습니다.</p>
          <Link href="/market" className="text-primary font-medium hover:underline">
            시장 개요 바로가기 →
          </Link>
        </div>
      </article>
      <AdSlot slot="guide-bottom" format="responsive" className="mt-8" />
    </PageContainer>
  )
}
