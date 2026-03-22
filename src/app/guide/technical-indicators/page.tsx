import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildArticle } from "@/lib/seo"

export const metadata: Metadata = {
  title: "기술적 지표 완전 가이드 — RSI, MACD, 골든크로스, 볼린저밴드",
  description: "주식 투자에 필수적인 기술적 지표를 쉽게 설명합니다. RSI, MACD, 골든크로스, 데드크로스, 볼린저밴드, MFI, ADX, 하이킨아시 캔들 등 핵심 지표의 원리와 실전 활용법.",
  openGraph: {
    title: "기술적 지표 완전 가이드 - StockView",
    description: "RSI, MACD, 골든크로스, 볼린저밴드 등 핵심 기술적 지표의 원리와 실전 활용법.",
  },
}

export default function TechnicalIndicatorsPage() {
  return (
    <PageContainer>
      <JsonLd
        data={buildArticle(
          "기술적 지표 완전 가이드",
          "RSI, MACD, 골든크로스, 볼린저밴드 등 핵심 기술적 지표의 원리와 실전 활용법",
          "/guide/technical-indicators",
          "2026-03-22",
          "2026-03-22",
          "StockView"
        )}
      />
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>기술적 지표 완전 가이드</h1>
        <p>주식 투자에서 기술적 분석(Technical Analysis)은 과거 가격과 거래량 데이터를 기반으로 향후 주가 움직임을 예측하려는 분석 방법입니다. 기본적 분석이 기업의 재무제표와 가치를 분석한다면, 기술적 분석은 차트 패턴과 수학적 지표를 통해 매매 타이밍을 찾는 데 초점을 맞춥니다. 이 가이드에서는 StockView 스크리너에서 활용할 수 있는 핵심 기술적 지표를 하나씩 살펴보겠습니다.</p>

        <h2>RSI (Relative Strength Index, 상대강도지수)</h2>
        <p>RSI는 J. Welles Wilder Jr.가 1978년 개발한 모멘텀 오실레이터로, 가격의 상승 압력과 하락 압력의 상대적 강도를 0~100 사이의 수치로 나타냅니다. 일반적으로 14일 기간을 사용합니다.</p>
        <h3>해석 방법</h3>
        <ul>
          <li><strong>RSI 70 이상</strong>: 과매수(overbought) 구간 — 단기 조정 가능성이 높아 매도 시점을 고려할 수 있습니다.</li>
          <li><strong>RSI 30 이하</strong>: 과매도(oversold) 구간 — 반등 가능성이 높아 매수 기회를 탐색할 수 있습니다.</li>
          <li><strong>RSI 50 전후</strong>: 추세의 전환점으로, 50 위로 돌파하면 상승 추세, 아래로 떨어지면 하락 추세로 해석합니다.</li>
        </ul>
        <h3>다이버전스(Divergence)</h3>
        <p>RSI 다이버전스는 주가와 RSI 방향이 반대로 움직일 때 발생합니다. 주가가 신고가를 경신하는데 RSI는 이전 고점보다 낮으면 &quot;약세 다이버전스&quot;로 하락 반전 신호입니다. 반대로 주가가 신저가인데 RSI는 이전 저점보다 높으면 &quot;강세 다이버전스&quot;로 상승 반전 신호입니다.</p>
        <p>
          <Link href="/screener/rsi-oversold" className="text-primary font-medium">
            지금 RSI 과매도 종목 확인하기 →
          </Link>
        </p>

        <h2>MACD (Moving Average Convergence Divergence)</h2>
        <p>MACD는 Gerald Appel이 개발한 추세 추종형 지표로, 두 개의 지수이동평균(EMA) 간의 차이를 이용합니다. 기본 설정은 12일 EMA에서 26일 EMA를 뺀 값이 MACD 선이 되고, MACD 선의 9일 EMA가 시그널 선이 됩니다.</p>
        <h3>매매 신호</h3>
        <ul>
          <li><strong>골든크로스</strong>: MACD 선이 시그널 선을 아래에서 위로 돌파 → 매수 신호</li>
          <li><strong>데드크로스</strong>: MACD 선이 시그널 선을 위에서 아래로 돌파 → 매도 신호</li>
          <li><strong>히스토그램</strong>: MACD와 시그널의 차이를 막대그래프로 표시. 양수이면 상승 모멘텀, 음수이면 하락 모멘텀</li>
          <li><strong>제로라인 돌파</strong>: MACD가 0선을 상향 돌파하면 강한 상승 추세 진입, 하향 돌파하면 하락 추세 진입</li>
        </ul>
        <p>MACD는 추세가 뚜렷한 시장에서 효과적이며, 횡보장에서는 잦은 거짓 신호가 발생할 수 있으므로 다른 지표와 함께 활용하는 것이 좋습니다.</p>
        <p>
          <Link href="/screener/macd-cross" className="text-primary font-medium">
            MACD 골든크로스 종목 보기 →
          </Link>
        </p>

        <h2>골든크로스와 데드크로스 (이동평균선)</h2>
        <p>이동평균선(Moving Average)은 일정 기간 동안의 종가 평균을 연결한 선입니다. 단기 이동평균선(5일, 20일)이 장기 이동평균선(60일, 120일)을 돌파하는 현상을 기반으로 추세 전환을 판단합니다.</p>
        <ul>
          <li><strong>골든크로스(Golden Cross)</strong>: 단기 이동평균선이 장기 이동평균선을 상향 돌파 → 상승 추세 전환 신호. 50일선이 200일선을 돌파하는 것이 가장 신뢰도가 높습니다.</li>
          <li><strong>데드크로스(Dead Cross)</strong>: 단기 이동평균선이 장기 이동평균선을 하향 돌파 → 하락 추세 전환 신호.</li>
        </ul>
        <p>골든크로스 이후에도 &quot;속임수 돌파(Fake Breakout)&quot;가 발생할 수 있으므로, 거래량 증가 여부를 함께 확인하는 것이 중요합니다. 거래량이 동반된 골든크로스가 더 신뢰할 수 있습니다.</p>
        <p>
          <Link href="/screener/golden-cross" className="text-primary font-medium">
            지금 골든크로스 종목 확인하기 →
          </Link>
        </p>

        <h2>볼린저밴드 (Bollinger Bands)</h2>
        <p>볼린저밴드는 John Bollinger가 개발한 변동성 지표로, 20일 이동평균선을 중심으로 상단밴드(+2 표준편차)와 하단밴드(-2 표준편차)를 표시합니다. 통계적으로 주가의 약 95%가 밴드 안에서 움직입니다.</p>
        <h3>핵심 활용법</h3>
        <ul>
          <li><strong>밴드 터치</strong>: 주가가 하단밴드에 닿으면 과매도, 상단밴드에 닿으면 과매수 신호</li>
          <li><strong>밴드 수축(Squeeze)</strong>: 밴드 폭이 좁아지면 변동성이 감소한 것으로, 곧 큰 움직임(돌파)이 예상됩니다</li>
          <li><strong>밴드 워킹(Walking the Bands)</strong>: 강한 추세에서는 주가가 상단 또는 하단밴드를 타고 이동. 이때는 밴드 터치를 반전 신호로 해석하면 안 됩니다</li>
          <li><strong>볼린저 바운스</strong>: 주가가 하단밴드에서 반등하면 중앙선(20일 이동평균)까지의 수익을 기대할 수 있습니다</li>
        </ul>
        <p>
          <Link href="/screener/bollinger-bounce" className="text-primary font-medium">
            볼린저밴드 바운스 종목 보기 →
          </Link>
        </p>

        <h2>MFI (Money Flow Index, 자금흐름지수)</h2>
        <p>MFI는 RSI와 유사하지만 거래량을 함께 반영하는 지표입니다. &quot;거래량 가중 RSI&quot;라고도 불리며, 가격 변동에 자금 유입/유출 강도를 더한 0~100 범위의 오실레이터입니다.</p>
        <ul>
          <li><strong>MFI 80 이상</strong>: 과매수 — 대량의 자금이 유입된 후 매도 압력이 증가할 수 있음</li>
          <li><strong>MFI 20 이하</strong>: 과매도 — 자금 유출이 과도하여 반등 가능성</li>
        </ul>
        <p>MFI는 RSI와 함께 사용하면 서로 보완적입니다. RSI와 MFI가 동시에 과매도/과매수를 나타내면 신뢰도가 높아집니다.</p>

        <h2>ADX (Average Directional Index, 평균방향지수)</h2>
        <p>ADX는 추세의 &quot;강도&quot;를 측정하는 지표입니다. 방향(상승/하락)이 아닌 추세의 힘을 0~100으로 나타냅니다.</p>
        <ul>
          <li><strong>ADX 25 이상</strong>: 뚜렷한 추세 존재 → 추세 추종 전략 유효</li>
          <li><strong>ADX 20 이하</strong>: 추세 약함 → 횡보/박스권. 추세 추종 전략은 비효율적</li>
          <li><strong>ADX 상승</strong>: 추세가 강해지는 중 (상승이든 하락이든)</li>
          <li><strong>ADX 하락</strong>: 추세 약화. 추세 전환 가능성</li>
        </ul>
        <p>ADX 자체는 방향을 알려주지 않으므로, +DI/-DI 선과 함께 보면 상승 추세인지 하락 추세인지 구분할 수 있습니다. +DI가 -DI 위에 있으면 상승 추세, 반대면 하락 추세입니다.</p>

        <h2>하이킨아시 (Heikin-Ashi) 캔들</h2>
        <p>하이킨아시 캔들은 일반 캔들스틱을 평균값으로 변환하여 노이즈를 줄이고 추세를 더 명확하게 보여주는 차트 기법입니다. 일본어로 &quot;평균 막대&quot;라는 뜻입니다.</p>
        <h3>계산법</h3>
        <ul>
          <li><strong>종가</strong>: (시가 + 고가 + 저가 + 종가) / 4</li>
          <li><strong>시가</strong>: 이전 하이킨아시 캔들의 (시가 + 종가) / 2</li>
          <li><strong>고가</strong>: 해당 기간의 최고값</li>
          <li><strong>저가</strong>: 해당 기간의 최저값</li>
        </ul>
        <h3>해석법</h3>
        <ul>
          <li><strong>아래꼬리 없는 양봉</strong>: 강한 상승 추세</li>
          <li><strong>위꼬리 없는 음봉</strong>: 강한 하락 추세</li>
          <li><strong>작은 몸통 + 양쪽 꼬리</strong>: 추세 전환 가능성 (도지 유사)</li>
        </ul>
        <p>하이킨아시 캔들은 추세의 시작과 끝을 파악하기에 유용하지만, 실제 가격 정보가 아닌 가공된 값이므로 정확한 진입/청산 가격 결정에는 일반 캔들을 함께 참고해야 합니다.</p>

        <h2>기술적 지표 활용 시 주의사항</h2>
        <ul>
          <li><strong>단일 지표에 의존하지 마세요</strong>: 최소 2~3개 지표가 같은 방향을 가리킬 때 신뢰도가 높아집니다.</li>
          <li><strong>시장 상황을 고려하세요</strong>: 추세장에서는 MACD, 골든크로스가, 횡보장에서는 RSI, 볼린저밴드가 더 유효합니다.</li>
          <li><strong>거래량을 함께 확인하세요</strong>: 거래량이 동반되지 않은 신호는 속임수일 가능성이 높습니다.</li>
          <li><strong>기본적 분석과 병행하세요</strong>: 기술적 지표만으로 투자를 결정하는 것은 위험합니다. PER, PBR, ROE 등 재무지표도 함께 확인하세요.</li>
          <li><strong>과거 성과가 미래를 보장하지 않습니다</strong>: 기술적 지표는 확률적 도구이지, 예측의 정답이 아닙니다.</li>
        </ul>

        <div className="not-prose mt-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-semibold mb-2">StockView 스크리너에서 바로 활용해 보세요</p>
          <p className="text-sm text-muted-foreground mb-4">위에서 배운 기술적 지표를 실제 종목에 적용하여 매매 신호를 확인할 수 있습니다.</p>
          <Link href="/screener" className="text-primary font-medium hover:underline">
            스크리너 바로가기 →
          </Link>
        </div>
      </article>
    </PageContainer>
  )
}
