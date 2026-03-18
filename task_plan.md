# 하이킨아시(Heikin-Ashi) 분석 결과 표시 구현 계획

## Context
StockView 종목 상세 페이지 하단의 "기술적 지표" 섹션(IndicatorSummary)에 하이킨아시 분석 결과를 추가한다. 차트 토글 버튼이 아닌, 다른 지표(RSI, ADX, SAR 등)와 동일하게 **분석 결과값**으로 표시하는 것이 목표.

### 하이킨아시 공식
- HA Close = (Open + High + Low + Close) / 4
- HA Open = (prev HA Open + prev HA Close) / 2
- HA High = max(High, HA Open, HA Close)
- HA Low = min(Low, HA Open, HA Close)

### 표시할 분석 결과
하이킨아시 캔들 패턴을 분석하여 추세 상태를 판단:
- **강한 상승** — 연속 양봉(close > open) + 아래꼬리 없음(low ≈ open)
- **강한 하락** — 연속 음봉(close < open) + 위꼬리 없음(high ≈ open)
- **추세 전환 가능** — 짧은 몸통 + 양쪽 꼬리 (도지형)
- **상승 추세** / **하락 추세** — 일반적인 양봉/음봉
- 연속 봉 수도 함께 표시 (예: "강한 상승 (5봉 연속)")

---

## 수정 파일 (3개)

### Phase 1: 계산 + 해석 함수 추가
- **Status**: ⬜ Not started
- **File**: `src/lib/utils/technical-indicators.ts`

#### 1a) `calculateHeikinAshi()` — HA OHLC 계산
```typescript
export function calculateHeikinAshi(
  data: { open: number; high: number; low: number; close: number }[]
): { open: number; high: number; low: number; close: number }[] {
  if (data.length === 0) return []
  const result: { open: number; high: number; low: number; close: number }[] = []
  for (let i = 0; i < data.length; i++) {
    const haClose = (data[i].open + data[i].high + data[i].low + data[i].close) / 4
    const haOpen = i === 0
      ? (data[i].open + data[i].close) / 2
      : (result[i - 1].open + result[i - 1].close) / 2
    const haHigh = Math.max(data[i].high, haOpen, haClose)
    const haLow = Math.min(data[i].low, haOpen, haClose)
    result.push({ open: haOpen, high: haHigh, low: haLow, close: haClose })
  }
  return result
}
```

#### 1b) `interpretHeikinAshi()` — HA 추세 해석
기존 `interpretRSI()`, `interpretADX()` 등과 동일한 패턴으로 `{ label, color }` 반환:
```typescript
export function interpretHeikinAshi(
  haData: { open: number; high: number; low: number; close: number }[]
): { label: string; color: string; streak: number } {
  if (haData.length < 2) return { label: "데이터 부족", color: "text-muted-foreground", streak: 0 }
  const last = haData[haData.length - 1]
  const isBullish = last.close > last.open
  const bodySize = Math.abs(last.close - last.open)
  const totalRange = last.high - last.low

  // 연속 봉 수 계산
  let streak = 1
  for (let i = haData.length - 2; i >= 0; i--) {
    const prev = haData[i]
    if ((prev.close > prev.open) === isBullish) streak++
    else break
  }

  // 도지형 (몸통이 전체 범위의 10% 미만)
  if (totalRange > 0 && bodySize / totalRange < 0.1) {
    return { label: "추세 전환 가능", color: "text-amber-500", streak: 0 }
  }

  // 강한 추세: 꼬리 없음 판정
  const noLowerWick = Math.abs(last.low - Math.min(last.open, last.close)) < bodySize * 0.05
  const noUpperWick = Math.abs(last.high - Math.max(last.open, last.close)) < bodySize * 0.05

  if (isBullish && noLowerWick) {
    return { label: `강한 상승 (${streak}봉)`, color: "text-stock-up", streak }
  }
  if (!isBullish && noUpperWick) {
    return { label: `강한 하락 (${streak}봉)`, color: "text-stock-down", streak }
  }
  if (isBullish) {
    return { label: `상승 추세 (${streak}봉)`, color: "text-stock-up", streak }
  }
  return { label: `하락 추세 (${streak}봉)`, color: "text-stock-down", streak }
}
```

### Phase 2: IndicatorSummary에 HA 결과 표시
- **Status**: ⬜ Not started
- **File**: `src/components/stock/indicator-summary.tsx`

#### 2a) Props 확장
```typescript
haSignal?: { label: string; color: string; streak: number } | null
```

#### 2b) UI 추가 — 추가 지표 그리드(line 98~122)에 HA 카드 추가
기존 MFI/ADX/SAR과 같은 3-column 그리드에 하이킨아시 카드 배치:
```tsx
{haSignal != null && (
  <div className="bg-muted/50 rounded-lg p-2.5">
    <span className="text-xs text-muted-foreground">하이킨아시</span>
    <p className="font-mono text-sm mt-0.5">
      {haSignal.streak > 0 ? `${haSignal.streak}봉` : "-"}
    </p>
    <span className={cn("text-xs", haSignal.color)}>{haSignal.label}</span>
  </div>
)}
```

### Phase 3: stock-detail-client에서 HA 계산 및 전달
- **Status**: ⬜ Not started
- **File**: `src/app/stock/[ticker]/stock-detail-client.tsx`

#### 3a) indicatorData 쿼리에 HA 계산 추가 (line 64~103)
기존 `calculateMFI`, `calculateADX` 등과 같은 위치에서:
```typescript
const { calculateHeikinAshi, interpretHeikinAshi } = await import("@/lib/utils/technical-indicators")
const haData = calculateHeikinAshi(chart.data.map((d: any) => ({
  open: d.open, high: d.high, low: d.low, close: d.close,
})))
const haSignal = interpretHeikinAshi(haData)
```

#### 3b) return 객체에 `haSignal` 추가
```typescript
return {
  ...기존값,
  haSignal,
}
```

#### 3c) IndicatorSummary에 `haSignal` prop 전달 (line 194~206)
```tsx
haSignal={indicatorData.haSignal}
```

### Phase 4: 검증
- **Status**: ⬜ Not started
- **Tasks**:
  1. `npm run build` 성공 확인
  2. 종목 상세 페이지 → 차트 탭 하단 "기술적 지표" 섹션에 하이킨아시 카드 표시 확인
  3. 추세 방향/강도/연속 봉 수 정상 표시 확인
  4. 다양한 종목으로 교차 검증 (상승/하락/횡보 종목)

---

## 변경하지 않는 것
- `src/types/stock.ts` — 타입 변경 없음
- `src/components/stock/stock-chart.tsx` — 차트 컴포넌트 변경 없음
- API / DB — 서버 측 변경 없음

## Decisions
| # | Decision | Reason |
|---|----------|--------|
| 1 | 차트 토글이 아닌 기술적 지표 섹션에 결과값 표시 | 사용자 요청 — 기존 RSI/ADX/SAR과 동일한 UX 패턴 |
| 2 | 연속 봉 수 + 추세 강도 함께 표시 | 하이킨아시의 핵심 가치는 "추세의 연속성과 강도" 판단 |
| 3 | 도지형 감지 포함 (추세 전환 가능) | 하이킨아시의 중요한 반전 시그널 |
| 4 | 기존 3-column 그리드에 통합 | 일관된 UI, 별도 섹션 불필요 |
