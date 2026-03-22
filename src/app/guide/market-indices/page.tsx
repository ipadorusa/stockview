import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildArticle, buildFAQPage } from "@/lib/seo"
import { AdSlot } from "@/components/ads/ad-slot"

export const metadata: Metadata = {
  title: "주요 지수 이해하기 — KOSPI, KOSDAQ, S&P 500, NASDAQ",
  description: "KOSPI, KOSDAQ, S&P 500, NASDAQ 등 주요 주식시장 지수의 의미와 차이점, 지수를 활용한 투자 전략을 쉽게 설명합니다.",
  openGraph: {
    title: "주요 지수 이해하기 - StockView",
    description: "KOSPI, KOSDAQ, S&P 500, NASDAQ 등 주요 지수의 의미와 활용법을 알기 쉽게 설명합니다.",
  },
}

const faqs = [
  { question: "KOSPI와 KOSDAQ의 차이점은 무엇인가요?", answer: "KOSPI는 유가증권시장에 상장된 대형 우량기업 중심의 지수이고, KOSDAQ은 기술 혁신형 중소·벤처기업 중심의 시장입니다. KOSPI가 안정적인 대기업 위주라면, KOSDAQ은 성장 잠재력이 큰 기업이 많지만 변동성도 더 큽니다." },
  { question: "S&P 500과 NASDAQ의 차이점은 무엇인가요?", answer: "S&P 500은 미국 대형주 500개를 포함하는 광범위한 시장 대표 지수이고, NASDAQ은 기술주 중심의 거래소 지수입니다. S&P 500이 미국 경제 전반을 반영한다면, NASDAQ은 기술·성장주 동향을 더 잘 반영합니다." },
  { question: "지수에 직접 투자할 수 있나요?", answer: "지수 자체에는 직접 투자할 수 없지만, 해당 지수를 추종하는 ETF를 통해 간접적으로 투자할 수 있습니다. 예를 들어 KODEX 200은 KOSPI 200을, SPY는 S&P 500을 추종합니다." },
]

export default function MarketIndicesPage() {
  return (
    <PageContainer>
      <JsonLd
        data={buildArticle(
          "주요 지수 이해하기",
          "KOSPI, KOSDAQ, S&P 500, NASDAQ 등 주요 지수의 의미와 활용법",
          "/guide/market-indices",
          "2026-03-22",
          "2026-03-22",
          "StockView"
        )}
      />
      <JsonLd data={buildFAQPage(faqs)} />
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>주요 지수 이해하기</h1>
        <p>주식시장 지수는 시장 전체 또는 특정 그룹의 주가 움직임을 하나의 숫자로 요약한 것입니다. 마치 체온계가 몸의 전반적인 상태를 알려주듯, 지수는 시장의 건강 상태를 한눈에 파악할 수 있게 해줍니다. 개별 종목에 투자하기 전에 시장 전체의 흐름을 먼저 확인하는 것이 성공적인 투자의 첫걸음입니다.</p>

        <h2>한국 시장 지수</h2>

        <h3>KOSPI (코스피)</h3>
        <p>KOSPI는 유가증권시장에 상장된 모든 종목의 시가총액을 기준으로 산출되는 한국 대표 주가지수입니다. 1980년 1월 4일의 시가총액을 기준(100)으로 합니다.</p>
        <ul>
          <li><strong>구성</strong>: 삼성전자, SK하이닉스, 현대자동차 등 대형 우량기업 약 800여 개</li>
          <li><strong>특징</strong>: 한국 경제를 대표하며, 반도체·자동차·금융 등 전통 산업 비중이 큼</li>
          <li><strong>참고 지수</strong>: KOSPI 200은 시가총액 상위 200종목으로 구성된 핵심 지수로, 대부분의 ETF와 선물·옵션이 이를 기준으로 합니다</li>
        </ul>

        <h3>KOSDAQ (코스닥)</h3>
        <p>KOSDAQ은 기술 혁신형 중소·벤처기업을 위한 시장으로, 1996년에 개설되었습니다.</p>
        <ul>
          <li><strong>구성</strong>: 바이오, IT, 엔터테인먼트 등 성장 산업 중심 약 1,600여 개 종목</li>
          <li><strong>특징</strong>: KOSPI 대비 변동성이 크지만, 성장 잠재력이 높은 기업이 많음</li>
          <li><strong>주의</strong>: 시가총액이 작은 종목이 많아 유동성 리스크에 주의 필요</li>
        </ul>

        <h2>미국 시장 지수</h2>

        <h3>S&P 500</h3>
        <p>S&P 500은 미국 대형주 500개를 포함하는 시가총액 가중 지수로, 전 세계에서 가장 중요한 주가지수로 여겨집니다.</p>
        <ul>
          <li><strong>구성</strong>: 시가총액, 유동성, 업종 대표성 등을 기준으로 S&P 위원회가 선정</li>
          <li><strong>특징</strong>: 미국 주식시장 시가총액의 약 80%를 포괄하여 미국 경제 전체를 대변</li>
          <li><strong>대표 ETF</strong>: SPY, VOO, IVV — 전 세계에서 가장 많이 거래되는 ETF</li>
        </ul>

        <h3>NASDAQ Composite</h3>
        <p>NASDAQ Composite은 나스닥 거래소에 상장된 모든 종목(약 3,000여 개)을 포함하는 지수입니다.</p>
        <ul>
          <li><strong>구성</strong>: Apple, Microsoft, Amazon, Nvidia 등 글로벌 기술 기업 중심</li>
          <li><strong>특징</strong>: 기술·성장주 비중이 높아 기술 산업의 바로미터 역할</li>
          <li><strong>참고 지수</strong>: NASDAQ 100은 비금융 대형주 100개로 구성된 핵심 지수 (대표 ETF: QQQ)</li>
        </ul>

        <h2>지수를 활용한 투자 전략</h2>
        <h3>시장 분위기 판단</h3>
        <p>주요 지수의 추세를 통해 현재 시장이 상승장(강세장)인지 하락장(약세장)인지 판단할 수 있습니다. 지수가 200일 이동평균선 위에 있으면 강세, 아래에 있으면 약세로 해석하는 것이 일반적입니다.</p>

        <h3>지수 간 비교</h3>
        <ul>
          <li><strong>KOSPI vs KOSDAQ</strong>: KOSDAQ이 KOSPI보다 강하면 성장주·중소형주 선호 장세</li>
          <li><strong>S&P 500 vs NASDAQ</strong>: NASDAQ이 더 강하면 기술주 중심의 위험 선호 장세</li>
          <li><strong>한국 vs 미국</strong>: 글로벌 자금 흐름과 환율 영향 파악 가능</li>
        </ul>

        <h3>지수 ETF 투자</h3>
        <p>개별 종목 선정이 어렵다면, 지수를 추종하는 ETF에 투자하는 것이 가장 쉬운 분산 투자 방법입니다. 역사적으로 S&P 500 지수는 연 평균 약 10%의 수익률을 기록해 왔으며, 대부분의 액티브 펀드매니저보다 우수한 성과를 보여왔습니다.</p>

        <h2>자주 묻는 질문</h2>
        <h3>KOSPI와 KOSDAQ의 차이점은?</h3>
        <p>KOSPI는 대형 우량기업 중심의 유가증권시장 지수이고, KOSDAQ은 기술 혁신형 중소·벤처기업 중심의 시장입니다. KOSPI가 안정적이라면 KOSDAQ은 성장 잠재력이 크지만 변동성도 높습니다.</p>

        <h3>지수에 직접 투자할 수 있나요?</h3>
        <p>지수 자체에는 직접 투자할 수 없지만, 해당 지수를 추종하는 ETF(예: KODEX 200, SPY)를 통해 간접 투자가 가능합니다.</p>

        <div className="not-prose mt-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-semibold mb-2">StockView 시장 개요에서 지수를 확인하세요</p>
          <p className="text-sm text-muted-foreground mb-4">KOSPI, KOSDAQ, S&P 500, NASDAQ 지수의 실시간 동향과 상승·하락 종목을 확인할 수 있습니다.</p>
          <Link href="/market" className="text-primary font-medium hover:underline">
            시장 개요 바로가기 →
          </Link>
        </div>
      </article>
      <AdSlot slot="guide-bottom" format="responsive" className="mt-8" />
    </PageContainer>
  )
}
