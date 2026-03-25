# Phase 1: 데이터 품질 개선 상세 기획서

> 작성일: 2026-03-25 | 근거: 코드베이스 직접 확인

---

## 1. DailyPrice 보존 기간 변경

### 현황
- **파일**: `src/app/api/cron/cleanup/route.ts` (line 39-48)
- **현재 정책**: 365일 이전 DailyPrice 삭제 (`days365Ago`)
- **참고**: CLAUDE.md에는 "21일"로 기재되어 있으나, 실제 코드는 이미 365일로 변경되어 있음

### 평가
- 365일 보존은 1년 차트까지 지원 — 기본적으로 양호
- 경쟁 서비스(네이버 증권, 키움)는 5~10년 차트 제공
- 현재 종목 수 기준 DB 용량 추정:
  - ~4,800 종목 x 365일 x ~80bytes/레코드 ≈ **~140MB/년**
  - Supabase Free: 500MB, Pro: 8GB → 3~5년 보존 가능

### 변경 사항

| 항목 | 현재 | 변경 |
|------|------|------|
| DailyPrice 보존 | 365일 | 1,095일 (3년) |
| 용량 추정 | ~140MB | ~420MB |

### 변경 파일

**`src/app/api/cron/cleanup/route.ts`**
```typescript
// Before (line 40):
const days365Ago = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

// After:
const days1095Ago = new Date(now.getTime() - 1095 * 24 * 60 * 60 * 1000)
```
- line 42: `where: { date: { lt: days1095Ago } }` 로 변경

### 예상 영향
- DB 용량: ~140MB → ~420MB (Supabase Pro 8GB 기준 5.25%)
- 차트 API (`/api/stocks/[ticker]/chart`): 3년 차트 제공 가능
- 스크리너/기술지표 계산: 영향 없음 (TechnicalIndicator는 별도 90일 보존)

### 롤백 방안
- cleanup 크론에서 보존 기간을 365일로 원복
- 이미 축적된 데이터는 다음 cleanup 실행 시 자동 삭제

---

## 2. Fundamentals 갱신 속도 개선

### 현황
- **파일**: `src/app/api/cron/collect-fundamentals/route.ts`
- **현재**: US/KR 각 100개씩 배치, `orderBy: [{ fundamental: { updatedAt: "asc" } }]` (가장 오래된 것부터)
- **스케줄**: `cron-fundamentals.yml` — 토요일 23:00 KST (주 1회)
- **문제**: 4,800 종목 / 200개(US+KR) = 24주에 전체 1회 갱신
- **maxDuration**: 60초 (Vercel 기본)

### 변경 사항

| 항목 | 현재 | 변경 |
|------|------|------|
| 배치 크기 | US 100 + KR 100 = 200 | US 250 + KR 250 = 500 |
| 스케줄 | 주 1회 (토요일) | 주 3회 (화/목/토) |
| 전체 갱신 주기 | ~24주 | ~3.2주 |
| 우선순위 큐 | updatedAt ASC (단순 라운드로빈) | 관심종목 > 인기종목 > 나머지 |

### 변경 파일

**1. `src/app/api/cron/collect-fundamentals/route.ts`**

```typescript
// Before:
const BATCH = 100

// After:
const BATCH = 250
export const maxDuration = 300  // 60 → 300 (Vercel Pro)
```

우선순위 큐 구현:
```typescript
// US stocks — 관심종목 + 인기종목 우선
const usStocks = await prisma.stock.findMany({
  where: { market: "US", isActive: true },
  select: { id: true, ticker: true },
  orderBy: [
    { watchlist: { _count: "desc" } },     // 관심종목 많은 순
    { fundamental: { updatedAt: "asc" } },  // 오래된 순
    { id: "asc" },
  ],
  take: BATCH,
})
```

**2. `.github/workflows/cron-fundamentals.yml`**

```yaml
# Before:
on:
  schedule:
    - cron: "0 14 * * 6"  # 토요일 23:00 KST

# After:
on:
  schedule:
    - cron: "0 14 * * 2,4,6"  # 화/목/토 23:00 KST
```

### Vercel 타임아웃 내 500개 처리 가능성

- Naver 펀더멘탈 스크래핑: 200ms/req → 250개 = 50초
- Yahoo 펀더멘탈: 5 concurrent × ~500ms → 250개 = 25초
- 순차 실행: 50s + 25s = 75초 → **60초 초과, maxDuration 300 필요**
- 병렬 실행 시: max(50s, 25s) = 50초 → 60초 내 가능하나 여유 없음
- **결론**: `maxDuration = 300`으로 설정하면 안전 (Vercel Pro 필요)

### 예상 영향
- 데이터 신선도: 전체 종목 1회 갱신 24주 → 3.2주
- 관심종목: 매주 최소 1회 갱신 보장
- GitHub Actions 비용: 주 1회 → 주 3회 (무료 플랜 2,000분/월 내)

### 롤백 방안
- BATCH를 100으로 원복, cron을 토요일만으로 변경
- maxDuration을 60으로 원복

---

## 3. Compare 페이지 API 버그 수정

### 현황
- **파일**: `src/app/compare/page.tsx` (line 33)
- **버그**: `const res = await fetch(\`/api/stock/${ticker}\`)` — 존재하지 않는 경로
- **실제 경로**: `/api/stocks/${ticker}` (s 포함)
- **증상**: 비교 결과가 항상 null → "종목을 찾을 수 없습니다" 표시

### 변경 사항

**`src/app/compare/page.tsx`** (line 33)
```typescript
// Before:
const res = await fetch(`/api/stock/${ticker}`)

// After:
const res = await fetch(`/api/stocks/${ticker}`)
```

### 영향 범위
- Compare 페이지 전체 기능 복구
- 다른 파일 영향 없음 (이 경로를 사용하는 곳은 compare/page.tsx 뿐)

### 롤백 방안
- 한 줄 변경이므로 git revert로 즉시 원복 가능

---

## 4. PBR 일원화

### 현황

PBR이 두 곳에 저장/갱신됨:

| 위치 | 갱신 시점 | 소스 |
|------|----------|------|
| `StockQuote.pbr` | KR: collect-kr-quotes (항상 null 설정) / US: collect-us-quotes (미설정) | KR: Naver에서 PBR 미제공, US: Yahoo에서 미포함 |
| `StockFundamental → StockQuote.pbr` | collect-fundamentals에서 `f.pbr`이 있으면 StockQuote에 업데이트 | Yahoo/Naver 펀더멘탈 |

실제 데이터 흐름:
1. **KR quotes 크론**: `pbr: null`로 StockQuote 설정 (line 139) → **기존 PBR 값 덮어씀**
2. **Fundamentals 크론**: PBR 수집 → StockQuote.pbr에 저장 (line 69-74)
3. **문제**: KR quotes가 fundamentals 이후에 실행되면 PBR이 null로 리셋됨

### 변경 방안

**방안 A (권장): KR quotes에서 PBR null 덮어쓰기 제거**

`src/app/api/cron/collect-kr-quotes/route.ts` (line 128-142)
```typescript
// Before:
const quoteData = {
  ...
  pbr: null,
  ...
}

// After:
const quoteData = {
  ...
  // pbr 제거 — fundamentals 크론에서만 갱신
  ...
}
```

단, upsert의 `create`에는 `pbr: null`이 필요하므로:
```typescript
return prisma.stockQuote.upsert({
  where: { stockId },
  update: {
    price: s.price,
    previousClose: s.previousClose,
    change: s.change,
    changePercent: s.changePercent,
    open: s.price,
    high: s.price,
    low: s.price,
    volume: s.volume,
    marketCap: s.marketCap,
    per: s.per,
    high52w: w52?.high52w ?? null,
    low52w: w52?.low52w ?? null,
    // pbr 제거: fundamentals에서만 갱신
  },
  create: { stockId, ...quoteData, pbr: null },
})
```

**방안 B (장기): PBR을 StockFundamental로 완전 이동**
- 스키마에서 `StockQuote.pbr` 컬럼 제거
- 프론트엔드에서 PBR 참조를 fundamental.pbr로 변경
- 영향 범위가 크므로 Phase 2에서 진행 권장

### 프론트엔드 PBR 참조 위치 (방안 B 시 변경 필요)

| 파일 | 라인 | 참조 |
|------|------|------|
| `src/app/stock/[ticker]/page.tsx` | 119 | `pbr: q.pbr` |
| `src/app/stock/[ticker]/tabs/info-tab-server.tsx` | 37 | `stock.quote.pbr` |
| `src/app/etf/[ticker]/page.tsx` | 110 | `q.pbr` |
| `src/app/compare/page.tsx` | 21, 59 | `quote.pbr`, `"PBR"` row |
| `src/app/reports/[slug]/page.tsx` | 344-345 | `data.quote.pbr` |
| `src/components/stock/stock-info-grid.tsx` | 14, 86 | `data.pbr` |
| `src/app/api/stocks/[ticker]/route.ts` | 60 | `quote.pbr` |

### 권장 실행 순서
1. **즉시**: 방안 A 적용 (KR quotes에서 PBR null 덮어쓰기 제거) — 1 파일 변경
2. **Phase 2**: 방안 B 검토 (StockFundamental로 완전 이동) — 7+ 파일 변경

### 롤백 방안
- 방안 A: `pbr: null` 라인 원복
- 방안 B: Prisma migration rollback + 프론트엔드 원복

---

## 5. 52주 고저 일괄 수집

### 현황

| 시장 | 52주 고저 수집 | 방식 |
|------|-------------|------|
| **US** | collect-us-quotes에서 일괄 수집 | Yahoo v8 API `q.high52w`, `q.low52w` (line 87-88) → StockQuote에 저장 |
| **KR** | collect-kr-quotes에서 DailyPrice 기반 계산 | `prisma.dailyPrice.groupBy` _max(high), _min(low) (line 107-119) → StockQuote에 저장 |
| **KR 개별** | `/api/stocks/[ticker]`에서 null일 때 개별 스크래핑 | `fetchNaverStock52w` (line 29-34) — 응답 지연 발생 |

### 분석

실제로 **KR 52주 고저는 이미 일괄 수집 중** (collect-kr-quotes lines 107-119):
```typescript
const fiftyTwoWeekData = await prisma.dailyPrice.groupBy({
  by: ["stockId"],
  where: { stockId: { in: stockIds }, date: { gte: oneYearAgo } },
  _max: { high: true },
  _min: { low: true },
})
```

**문제**: DailyPrice가 부족할 때 (신규 종목, 데이터 누락) null이 됨 → 개별 Naver 스크래핑 fallback 발생

### 변경 방안

**`src/app/api/stocks/[ticker]/route.ts`의 개별 스크래핑 제거 + 크론 보강**

**1. 크론 보강** — collect-kr-quotes에서 DailyPrice 부족 시 Naver 스크래핑 fallback

`src/app/api/cron/collect-kr-quotes/route.ts`에 추가:
```typescript
// 52주 데이터 부족 종목: Naver에서 개별 수집
const nullStockIds = stockIds.filter((id) => !fiftyTwoWeekMap.has(id))
if (nullStockIds.length > 0) {
  const nullStocks = allStocks.filter(
    (s) => nullStockIds.includes(tickerToId.get(s.ticker)!)
  )
  for (const s of nullStocks.slice(0, 50)) {  // 최대 50개 (10초 이내)
    try {
      const w52 = await fetchNaverStock52w(s.ticker)
      if (w52) {
        fiftyTwoWeekMap.set(tickerToId.get(s.ticker)!, {
          high52w: w52.high52w,
          low52w: w52.low52w,
        })
      }
    } catch { /* ignore */ }
    await sleep(200)  // rate limit
  }
}
```

**2. API에서 개별 스크래핑 제거 (또는 캐시 적용)**

`src/app/api/stocks/[ticker]/route.ts` (line 29-34):
```typescript
// Before: null일 때 매 요청마다 Naver 스크래핑 (응답 지연)
if (stock.market === "KR" && quote && high52w == null && low52w == null) {
  const w52 = await fetchNaverStock52w(stock.ticker).catch(() => null)
  ...
}

// After: 제거 (크론에서 일괄 수집으로 대체)
// 52주 데이터가 없으면 null 그대로 반환
```

### 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/app/api/cron/collect-kr-quotes/route.ts` | DailyPrice 부족 종목에 대한 Naver 52w 개별 수집 추가 (크론 내) |
| `src/app/api/stocks/[ticker]/route.ts` | 개별 Naver 52w 스크래핑 제거 (line 29-35 삭제) |

### 예상 영향
- API 응답 속도: 52주 데이터 null 종목의 응답 지연 제거 (200ms+ → 즉시)
- 데이터 커버리지: 크론에서 최대 50개 보충 → 2~3일이면 대부분 채워짐
- 주의: DailyPrice가 1년 미만인 종목(최근 상장)은 Naver 스크래핑 기반 데이터 사용

### 롤백 방안
- API에서 개별 스크래핑 코드 원복
- 크론에서 추가된 fallback 로직 제거

---

## 구현 순서 권장

| 순서 | 항목 | 예상 시간 | 리스크 |
|------|------|----------|--------|
| 1 | Compare API 버그 수정 (#3) | 5분 | 없음 |
| 2 | PBR null 덮어쓰기 제거 (#4, 방안 A) | 10분 | 낮음 |
| 3 | 52주 고저 일괄 수집 + API 개별 제거 (#5) | 30분 | 낮음 |
| 4 | Fundamentals 배치 확대 + 스케줄 변경 (#2) | 20분 | 중간 (타임아웃 테스트 필요) |
| 5 | DailyPrice 보존 3년 (#1) | 5분 | 없음 |

**총 예상 시간: ~70분**
