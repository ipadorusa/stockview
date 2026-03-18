# StockView 시장개요 개선 — Research & Findings

## Bug: changePercent 이중 부정 (Phase 1)

### 원인 분석
**파일**: `src/lib/data-sources/naver.ts` line 106

```typescript
// parseKrNum: 마이너스 부호를 보존함
function parseKrNum(s: string): number {
  return parseFloat(s.replace(/,/g, "").replace(/[^\d.+-]/g, "")) || 0
}

// 문제 코드 (line 105-106)
const changePctRaw = tds[2].replace("%", "").trim()  // "-66.77"
const changePercent = parseKrNum(changePctRaw) * (changePctRaw.startsWith("-") ? -1 : 1)
// parseKrNum("-66.77") = -66.77
// startsWith("-") = true → × -1 → +66.77 (이중 부정!)
```

### change 필드는 정상 동작
```typescript
// line 99-102: "하락" 텍스트 기반 부호 판정 → parseKrNum은 숫자만 반환
const changeRaw = tds[1]  // "하락 1,200"
const isDown = changeRaw.includes("하락") || changeRaw.includes("하한")
const change = parseKrNum(changeRaw) * (isDown ? -1 : 1)
// parseKrNum("하락 1,200") = 1200 (텍스트 제거됨) → × -1 → -1200 ✓
```

### 수정 방안
```typescript
const changePercent = Math.abs(parseKrNum(changePctRaw)) * (isDown ? -1 : 1)
```
- `Math.abs()`로 먼저 절대값 변환 → `parseKrNum`이 부호를 보존하든 안 하든 안전
- `isDown` 변수 재활용 → change 필드와 동일한 부호 판정 로직

## 현재 검색 기능 현황

### SearchBar 컴포넌트
- **위치**: `src/components/search/search-bar.tsx`
- **API**: `/api/stocks/search?q=...` (ticker, name, nameEn 검색, 최소 2글자)
- **UI**: Command 드롭다운 (debounce 300ms), 결과에서 클릭 → `/stock/{ticker}`
- **헤더 배치**: 데스크탑 `w-64` (app-header.tsx:61-63), 모바일 햄버거 메뉴 안

### 개선 필요사항
- 검색바가 눈에 잘 띄지 않음 (데스크탑에서 작은 크기)
- 모바일에서 햄버거 메뉴를 열어야 검색 가능
- Cmd+K / Ctrl+K 단축키 없음

## 섹터 성과 현황
- **컴포넌트**: `src/components/market/sector-performance.tsx`
- 읽기 전용 카드 (클릭 불가)
- API: `/api/market/sectors?market=KR|US` → 섹터명, 평균등락률, 종목수
- DB: Stock 모델에 `sector` 필드 있음 (indexed)

## 기존 기술적 지표 함수들 (screener 활용 가능)
- `calculateSMA()`, `calculateEMA()` — 이동평균
- `calculateRSI()` — RSI
- `calculateMACD()` — MACD
- `calculateBollingerBands()` — 볼린저밴드
- `calculateADX()` — ADX
- `calculateParabolicSAR()` — 파라볼릭 SAR
- `calculateMFI()` — MFI
- `calculateHeikinAshi()`, `interpretHeikinAshi()` — 하이킨아시
