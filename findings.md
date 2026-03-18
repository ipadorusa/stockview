# 하이킨아시 구현 — Research & Findings

## 하이킨아시(Heikin-Ashi) 리서치

### 개요
- 일본어로 "평균 봉"을 뜻하는 캔들차트 변형 기법
- 일반 캔들차트 대비 노이즈가 줄어 추세 방향과 강도가 명확
- 스윙 트레이딩, 추세 추종 전략에 적합
- 횡보장(choppy market)에서는 false signal 발생 가능

### 공식
| 항목 | 공식 |
|------|------|
| HA Close | (Open + High + Low + Close) / 4 |
| HA Open | (prev HA Open + prev HA Close) / 2, 첫 봉: (Open + Close) / 2 |
| HA High | max(High, HA Open, HA Close) |
| HA Low | min(Low, HA Open, HA Close) |

### 매매 시그널
- **강한 상승**: 연속 빨간봉 + 아래꼬리 없음
- **강한 하락**: 연속 파란봉 + 위꼬리 없음
- **추세 전환**: 짧은 몸통 + 양쪽 긴 꼬리 (도지형)

## 현재 기술적 지표 섹션 분석

### IndicatorSummary 컴포넌트 (`src/components/stock/indicator-summary.tsx`)
- 차트 탭 하단에 위치 (stock-detail-client.tsx line 189~208)
- 기존 지표: MA(5,20,60), RSI(14), 거래량 비율, 골든/데드크로스, MFI(14), ADX(14), Parabolic SAR
- 3-column 그리드 레이아웃 (MFI, ADX, SAR이 같은 행)
- `interpret*()` 함수로 수치 → 한국어 라벨 변환 (과매수/과매도/중립 등)
- 색상: `text-stock-up` (빨강), `text-stock-down` (파랑), `text-amber-500` (중립/경고)

### 데이터 플로우
1. `stock-detail-client.tsx`에서 3개월 차트 데이터 fetch
2. dynamic import로 `technical-indicators.ts` 함수 호출
3. 계산된 값을 `IndicatorSummary` props로 전달

### 기존 패턴 (interpret 함수들)
- `interpretRSI()` → `{ label: "과매수"|"과매도"|"중립", color: "text-stock-up"|... }`
- `interpretADX()` → `{ label: "강한 추세"|"추세 진행"|"약한 추세", color: ... }`
- `interpretParabolicSAR()` → `{ label: "상승 추세"|"하락 추세", color: ... }`
- → 하이킨아시도 동일 패턴으로 `interpretHeikinAshi()` 구현
