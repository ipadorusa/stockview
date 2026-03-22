import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildArticle } from "@/lib/seo"

export const metadata: Metadata = {
  title: "배당 투자 시작하기 — 배당수익률, 배당주 선별, 배당 캘린더 활용법",
  description: "배당 투자 초보자를 위한 완전 가이드. 배당이란 무엇인지, 배당수익률 계산법, 우량 배당주 선별 기준, 배당 캘린더 활용법까지 쉽게 설명합니다.",
  openGraph: {
    title: "배당 투자 시작하기 - StockView",
    description: "배당수익률, 배당주 선별, 배당 캘린더 활용법을 쉽게 설명합니다.",
  },
}

export default function DividendInvestingPage() {
  return (
    <PageContainer>
      <JsonLd
        data={buildArticle(
          "배당 투자 시작하기",
          "배당수익률 계산법, 배당주 선별 기준, 배당 캘린더 활용법",
          "/guide/dividend-investing",
          "2026-03-22",
          "2026-03-22",
          "StockView"
        )}
      />
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>배당 투자 시작하기</h1>
        <p>배당 투자는 주식 투자의 가장 안정적인 전략 중 하나로, 기업이 이익의 일부를 주주에게 현금으로 돌려주는 &quot;배당금&quot;을 통해 정기적인 수익을 얻는 방법입니다. 주가 상승으로 인한 시세 차익(캐피탈 게인)과 함께 배당 수익(인컴 게인)까지 이중으로 수익을 기대할 수 있어, 장기 투자자들에게 특히 인기 있는 전략입니다.</p>

        <h2>배당이란?</h2>
        <p>배당(Dividend)은 기업이 영업활동으로 벌어들인 순이익 중 일부를 주주에게 분배하는 것을 말합니다. 배당은 기업의 이익 환원 정책에 따라 결정되며, 모든 기업이 배당을 지급하는 것은 아닙니다.</p>
        <h3>배당의 종류</h3>
        <ul>
          <li><strong>현금 배당</strong>: 가장 일반적인 형태로, 주당 일정 금액을 현금으로 지급합니다.</li>
          <li><strong>주식 배당</strong>: 현금 대신 신규 주식을 배분합니다. 주식 수는 늘어나지만 총 가치는 동일합니다.</li>
          <li><strong>중간 배당</strong>: 결산기 이전에 실시하는 배당입니다. 연 2회 이상 배당하는 기업에서 발생합니다.</li>
          <li><strong>특별 배당</strong>: 비정기적으로 대규모 이익이 발생했을 때 추가로 지급하는 배당입니다.</li>
        </ul>

        <h3>한국 vs 미국 배당 문화</h3>
        <p>한국 기업은 연 1회(기말 배당) 배당이 일반적이지만, 최근 분기 배당(연 4회)을 도입하는 기업이 증가하고 있습니다. 미국 기업은 분기 배당이 표준이며, &quot;배당귀족(Dividend Aristocrats)&quot;으로 불리는 25년 이상 연속 배당 인상 기업도 많습니다.</p>

        <h2>배당수익률 계산법</h2>
        <p>배당수익률(Dividend Yield)은 현재 주가 대비 연간 배당금의 비율로, 배당 투자의 수익성을 평가하는 핵심 지표입니다.</p>
        <p><strong>배당수익률(%) = (주당 연간 배당금 ÷ 현재 주가) × 100</strong></p>

        <h3>예시</h3>
        <ul>
          <li>A 기업: 주가 50,000원, 연간 배당금 2,000원 → 배당수익률 4.0%</li>
          <li>B 기업: 주가 100,000원, 연간 배당금 3,000원 → 배당수익률 3.0%</li>
        </ul>
        <p>단순히 배당금 금액이 큰 기업보다, 주가 대비 배당수익률이 높은 기업이 배당 투자에서는 더 매력적입니다.</p>

        <h3>배당수익률 해석 시 주의점</h3>
        <ul>
          <li><strong>지나치게 높은 배당수익률(8% 이상)</strong>은 주가 급락으로 인한 일시적 현상일 수 있습니다. 기업 실적을 반드시 확인하세요.</li>
          <li><strong>배당성향</strong>(순이익 대비 배당금 비율)이 80%를 넘으면 배당 지속성에 의문이 생깁니다.</li>
          <li>과거 배당이 미래 배당을 보장하지 않습니다. 기업 실적 악화 시 배당이 축소되거나 중단될 수 있습니다.</li>
        </ul>

        <h2>배당주 선별 기준</h2>
        <p>좋은 배당주를 찾기 위한 핵심 기준을 소개합니다.</p>

        <h3>1. 배당 연속성</h3>
        <p>최근 5년 이상 꾸준히 배당을 지급한 기업을 선택하세요. 배당을 지속적으로 지급한 기업은 재무 안정성이 높고, 주주 환원 의지가 강합니다. 특히 배당금을 매년 인상해 온 기업은 더욱 우수합니다.</p>

        <h3>2. 적정 배당수익률</h3>
        <p>시장 평균 이상의 배당수익률을 기준으로 합니다. 한국 시장 KOSPI 평균 배당수익률은 약 2~3%, 미국 S&amp;P 500 평균은 약 1.5~2%입니다. 이보다 높으면 고배당주로 분류할 수 있습니다.</p>

        <h3>3. 배당성향 (Payout Ratio)</h3>
        <p>배당성향은 순이익 대비 배당금의 비율입니다. 적정 범위는 30~60%이며, 이 범위 안에 있으면 배당을 유지하면서도 기업 성장에 재투자할 여력이 있다는 의미입니다.</p>

        <h3>4. 재무 건전성</h3>
        <ul>
          <li><strong>부채비율</strong>: 100% 이하가 바람직합니다.</li>
          <li><strong>영업이익률</strong>: 안정적으로 흑자를 유지하는지 확인합니다.</li>
          <li><strong>잉여현금흐름(FCF)</strong>: 배당금을 충당할 수 있는 현금 창출 능력이 있는지 확인합니다.</li>
        </ul>

        <h3>5. 업종 특성</h3>
        <p>전통적으로 배당 투자에 적합한 업종이 있습니다.</p>
        <ul>
          <li><strong>금융/은행</strong>: 안정적 수익 구조, 높은 배당 전통</li>
          <li><strong>통신</strong>: 현금흐름이 풍부하고 설비 투자 안정화</li>
          <li><strong>유틸리티(전력/가스)</strong>: 규제 산업 특성상 안정적 수익</li>
          <li><strong>리츠(REITs)</strong>: 법적으로 이익의 90% 이상을 배당해야 하므로 높은 배당수익률</li>
        </ul>

        <h2>배당 캘린더 활용법</h2>
        <p>배당 투자에서 &quot;일정&quot;은 매우 중요합니다. 주요 날짜를 이해하고 배당 캘린더를 활용하면 효과적으로 배당을 받을 수 있습니다.</p>

        <h3>핵심 배당 일정</h3>
        <ul>
          <li><strong>배당 기준일(Record Date)</strong>: 이 날 주주명부에 기재된 주주가 배당을 받을 자격이 있습니다.</li>
          <li><strong>배당락일(Ex-Dividend Date)</strong>: 이 날부터 주식을 매수하면 배당을 받을 수 없습니다. 배당을 받으려면 배당락일 전날까지 주식을 보유해야 합니다.</li>
          <li><strong>배당 지급일(Payment Date)</strong>: 실제로 배당금이 계좌로 입금되는 날입니다.</li>
        </ul>

        <h3>StockView 배당 캘린더 활용 팁</h3>
        <ol>
          <li>예정된 배당 일정을 확인하여 배당락일 이전에 매수 계획을 세우세요.</li>
          <li>고배당 종목 TOP 10 리스트에서 배당수익률 상위 종목을 확인하세요.</li>
          <li>한국과 미국 배당 일정을 비교하여 배당 수령 시기를 분산할 수 있습니다.</li>
        </ol>

        <h2>배당 투자 시 세금</h2>
        <ul>
          <li><strong>한국 주식 배당</strong>: 배당소득세 15.4% (소득세 14% + 지방소득세 1.4%)가 원천징수됩니다.</li>
          <li><strong>미국 주식 배당</strong>: 미국에서 15% 원천징수 후, 한미 조세조약에 따라 한국에서 추가 과세되지 않습니다.</li>
          <li>연간 금융소득(이자 + 배당)이 2,000만원을 초과하면 금융소득종합과세 대상이 됩니다.</li>
        </ul>

        <h2>배당 투자 전략</h2>
        <h3>배당 재투자(DRIP) 전략</h3>
        <p>받은 배당금으로 같은 주식을 추가 매수하는 전략입니다. 복리 효과로 장기적으로 큰 자산 증식 효과를 기대할 수 있습니다. 특히 주가가 하락했을 때 배당 재투자를 하면 더 많은 주식을 매수할 수 있어 평균 단가를 낮추는 효과가 있습니다.</p>

        <h3>배당 성장주 전략</h3>
        <p>현재 배당수익률이 높은 기업보다, 매년 배당을 꾸준히 인상하는 기업에 투자하는 전략입니다. 초기 배당수익률은 낮을 수 있지만, 배당 성장과 함께 시간이 지날수록 원금 대비 수익률(YOC, Yield on Cost)이 높아집니다.</p>

        <div className="not-prose mt-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-semibold mb-2">StockView 배당 캘린더에서 확인하세요</p>
          <p className="text-sm text-muted-foreground mb-4">예정된 배당 일정, 최근 배당 내역, 고배당 종목 TOP 10을 한눈에 확인할 수 있습니다.</p>
          <Link href="/dividends" className="text-primary font-medium hover:underline">
            배당 캘린더 바로가기 →
          </Link>
        </div>
      </article>
    </PageContainer>
  )
}
