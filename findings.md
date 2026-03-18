# 하이킨아시 기능 고도화 — Research & Findings

## 1. 하이킨아시(Heikin-Ashi)란?

일본어로 "평균 막대"를 의미. 전통 캔들차트를 평균화하여 시장 노이즈를 줄이고 추세를 명확하게 시각화하는 기술적 분석 도구.

### 계산 공식
- **HA Close** = (Open + High + Low + Close) / 4
- **HA Open** = (이전 HA Open + 이전 HA Close) / 2 (첫 봉: (Open + Close) / 2)
- **HA High** = max(High, HA Open, HA Close)
- **HA Low** = min(Low, HA Open, HA Close)

### 핵심 특성
- 연속된 같은 색 캔들 → 추세 지속 확인
- 색상 전환 → 추세 전환 신호
- 도지(작은 몸통 + 양쪽 꼬리) → 추세 피로/전환 경고
- 아래꼬리 없는 양봉 → 강한 상승 (매수 유지)
- 위꼬리 없는 음봉 → 강한 하락 (매도 유지)

## 2. 보조지표와의 복합 전략 (리서치 결과)

### HA + RSI 복합 신호
| 조건 | 신호 | 신뢰도 |
|------|------|--------|
| HA 양봉 전환 + RSI < 30 탈출 | 강한 매수 신호 | 높음 |
| HA 음봉 전환 + RSI > 70 탈출 | 강한 매도 신호 | 높음 |
| HA 강한 상승 + RSI < 70 | 상승 여력 있음 | 보통 |
| HA 강한 하락 + RSI > 30 | 하락 여력 있음 | 보통 |

### HA + MACD 복합 신호
| 조건 | 신호 | 신뢰도 |
|------|------|--------|
| HA 양봉 + MACD 골든크로스 | 강한 상승 확인 | 높음 |
| HA 음봉 + MACD 데드크로스 | 강한 하락 확인 | 높음 |
| HA 도지 + MACD 히스토그램 축소 | 추세 전환 임박 | 보통 |

### HA + Bollinger Bands 복합 신호
| 조건 | 신호 | 신뢰도 |
|------|------|--------|
| HA 양봉 + 상단밴드 돌파 | 강한 상승 모멘텀 | 보통 |
| HA 음봉 + 하단밴드 이탈 | 강한 하락 모멘텀 | 보통 |
| HA 도지 + 밴드 수축 | 큰 변동 임박 | 높음 |

### HA + MA 크로스
| 조건 | 신호 | 신뢰도 |
|------|------|--------|
| HA 양봉 + 골든크로스(MA5 > MA20) | 상승 추세 확정 | 높음 |
| HA 음봉 + 데드크로스(MA5 < MA20) | 하락 추세 확정 | 높음 |

## 3. 현재 코드베이스 현황

### 이미 구현된 것 (✅)
- `calculateHeikinAshi()` — 기본 HA 캔들 계산 (technical-indicators.ts:897-912)
- `interpretHeikinAshi()` — 기본 추세 해석 (streak, 도지, 강한추세) (technical-indicators.ts:918-953)
- `IndicatorSummary` — haSignal 카드 표시 (indicator-summary.tsx:122-128)
- `stock-detail-client.tsx` — 3개월 데이터로 HA 계산 후 IndicatorSummary에 전달

### 구현되지 않은 것 (❌)
- StockChart에 HA 캔들 오버레이/토글 없음
- HA + 보조지표 복합 신호 없음
- HA 패턴 세부 분류 부족 (현재: 강한상승/하락, 상승/하락추세, 도지 5가지만)
- HA 연속 봉 히스토리 시각화 없음
- 추세 전환 알림/강조 없음

### StockChart 기존 토글 패턴 (참고)
- `showBB`, `showFib`, `showSAR`, `showKC`, `showPatterns`, `showPivot` — boolean 상태
- `panels` — Set<IndicatorPanel> 로 하위 패널 관리
- 오버레이: candlestickSeries 위에 lineSeries/markers 추가
- 하위 패널: 별도 createChart() + container ref

## 4. lightweight-charts에서 HA 렌더링 방식

lightweight-charts는 네이티브 HA 차트 타입 미지원. 두 가지 접근법:
1. **오버레이 방식**: 기존 캔들 위에 HA 캔들을 반투명 오버레이 → 복잡하고 가독성 저하
2. **전환 방식 (권장)**: 토글 시 기존 캔들 데이터를 HA 데이터로 교체 → 깔끔하고 구현 간단
   - candlestickSeries.setData(haData) 호출로 전환
   - 토글 해제 시 원본 OHLC 데이터로 복원

## 5. 한계 및 주의사항

- HA 캔들은 평균값이므로 **실제 가격과 다름** — 정밀한 진입/청산 시점에는 부적합
- 짧은 기간(1주일 등)에서는 데이터 부족으로 신뢰도 낮음
- **투자 조언이 아닌 참고 지표**로 표시해야 함 (면책 문구 필요)

## Sources
- [OANDA — Heikin-Ashi Candles Explained](https://www.oanda.com/us-en/trade-tap-blog/trading-knowledge/heikin-ashi-candles-explained/)
- [Britannica Money — Heikin-Ashi Calculation & Strategies](https://www.britannica.com/money/heikin-ashi-candlestick-chart)
- [HighStrike — Complete Heikin Ashi Guide 2025](https://highstrike.com/heikin-ashi-candles/)
- [Capital.com — Heikin-Ashi Trading Strategy](https://capital.com/en-int/learn/technical-analysis/heikin-ashi-trading-strategy)
- [Charles Schwab — Heikin-Ashi Reversals and Strategies](https://www.schwab.com/learn/story/heikin-ashi-candles-reversals-and-strategies)
- [XS — Best Heikin Ashi Strategies and Indicators](https://www.xs.com/en/blog/heikin-ashi/)
- [LuxAlgo — Heikin-Ashi Clear Strategies](https://www.luxalgo.com/blog/heikin-ashi-charts-clear-strategies-for-traders/)
- [EBC Financial Group — 하이킨아시 캔들 해석법](https://www.ebc.com/kr/forex/268054.html)
- [Medium — Heikin-Ashi 13 Strategies Analysis](https://medium.com/@jsgastoniriartecabrera/heikin-ashi-strategies-02a62f10754f)
