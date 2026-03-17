# Phase 7 Progress — 기술지표 확장

**완료일**: 2026-03-18

## 구현 내용

### 7-1. 새 지표 계산 함수 (`technical-indicators.ts`)
- `calculateROC(closes, period=12)` — Rate of Change %
- `calculateMFI(highs, lows, closes, volumes, period=14)` — Money Flow Index
- `calculateADLine(highs, lows, closes, volumes)` — A/D Line (누적)
- `calculatePivotPoints(highs, lows, closes)` — Pivot Points (PP, S1, S2, R1, R2)
- `calculateADX(highs, lows, closes, period=14)` — ADX + +DI/-DI (Wilder's smoothing)
- `calculateParabolicSAR(highs, lows, step=0.02, max=0.2)` — Parabolic SAR with isUpTrend flag

해석 함수 추가:
- `interpretMFI(mfi)` — 과매수(>80) / 과매도(<20) / 중립
- `interpretADX(adx)` — 강한 추세(≥50) / 추세 진행(≥25) / 약한 추세
- `interpretParabolicSAR(isUpTrend)` — 상승/하락 추세

### 7-2. 캔들패턴 확장 (`technical-indicators.ts`)
5개 새 패턴 함수 추가 (별도 export):
- `detectMorningStar` — 샛별형 (3봉 강세 반전)
- `detectEveningStar` — 석별형 (3봉 약세 반전)
- `detectHarami` — 상승/하락 잉태형 (2봉)
- `detectThreeWhiteSoldiers` — 적삼병 (3연속 양봉)
- `detectThreeBlackCrows` — 흑삼병 (3연속 음봉)

### 7-3. 차트 업데이트 (`stock-chart.tsx`)
**새 서브패널** (4개):
- ROC (14px, 0 기준선 포함)
- MFI (20/80 과매도/과매수 기준선 포함)
- A/D Line
- ADX (+DI 빨강 / -DI 파랑 / ADX 황색 / 25 기준선)

**메인 차트 오버레이** (2개):
- Pivot Points — 최신 봉 기준 5개 수평선 (PP 실선, R1/S1 점선, R2/S2 점점선)
- Parabolic SAR — 추세 방향별 원형 마커

**패턴 마커**: 기존 + 5개 새 패턴 합산, 같은 인덱스 중복 제거

**UI 버튼**: 오버레이(BB/Pivot/Fib/SAR/패턴) + 서브패널(MACD/RSI/Stoch/OBV/ATR/ROC/MFI/A/D/ADX)

### 7-4. 지표 요약 (`indicator-summary.tsx`)
Props 추가: `mfi14?`, `adx14?`, `sarIsUpTrend?`
조건부로 MFI/ADX/Parabolic SAR 섹션 표시

### 7-5. 서버사이드 배치 (`compute-indicators/route.ts`)
ROC, MFI, A/D Line, ADX 계산 추가.
**주의**: TechnicalIndicator 스키마에 해당 컬럼이 없어 계산만 하고 저장하지 않음.
향후 스키마 마이그레이션(roc12, mfi14, adLine, adx14 컬럼 추가) 후 저장 가능.

### 7-6. 종목 상세 페이지 (`stock-detail-client.tsx`)
indicatorData 쿼리에서 MFI, ADX, SAR 클라이언트 계산 추가 → IndicatorSummary에 전달.

## 파일 수정 목록
- `/Volumes/www/stockview/src/lib/utils/technical-indicators.ts` — 지표 함수 + 해석 함수 추가
- `/Volumes/www/stockview/src/components/stock/stock-chart.tsx` — 새 패널/오버레이/UI 추가
- `/Volumes/www/stockview/src/components/stock/indicator-summary.tsx` — 새 지표 표시
- `/Volumes/www/stockview/src/app/stock/[ticker]/stock-detail-client.tsx` — 새 지표 계산 및 전달
- `/Volumes/www/stockview/src/app/api/cron/compute-indicators/route.ts` — 새 지표 계산 추가

## 결정 사항
- Parabolic SAR: lightweight-charts LineSeries(투명선) + createSeriesMarkers 원형 마커로 표현
- ADX: Wilder's smoothing 방식, 첫 period개의 DX 평균으로 초기 ADX 계산
- 새 지표는 DB 저장 없이 클라이언트 계산 방식 유지 (스키마 변경 최소화)
- 캔들 패턴 중복 제거: 같은 인덱스에 여러 패턴 감지 시 첫 번째 우선

## 미구현 (향후 작업)
- TechnicalIndicator 스키마에 ROC/MFI/ADX 컬럼 추가 마이그레이션
- Keltner Channel (ATR 기반 변동성 채널)
- 지표 파라미터 커스터마이징 UI
- 지표 설명 툴팁
