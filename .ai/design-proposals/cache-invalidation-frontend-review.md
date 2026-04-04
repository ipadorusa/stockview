# Cache Invalidation Fix — 프론트엔드 코드 리뷰

**리뷰어**: Claude (Frontend Senior — Next.js App Router / RSC 전문)
**대상**: KR 종목 페이지 캐시 무효화 수정
**관련 파일**: `page.tsx`, `stock-queries.ts`, 탭 서버 컴포넌트들

---

## 1. React `cache()` vs `unstable_cache` — 정확한 차이

### React `cache()` (page.tsx:42)
- **범위**: 단일 서버 렌더 요청 (request-scoped memoization)
- **저장소**: 메모리 (React의 AsyncLocalStorage)
- **ISR 연동**: 없음. `revalidateTag`로 무효화 불가
- **용도**: `generateMetadata` + `render`에서 같은 함수를 2회 호출할 때 중복 DB 쿼리 방지

### `unstable_cache` (stock-queries.ts:26)
- **범위**: Next.js Data Cache (요청 간 공유, 디스크/Redis 기반)
- **저장소**: `.next/cache` 또는 Vercel KV
- **ISR 연동**: `tags` 옵션으로 `revalidateTag` 연결 가능
- **직렬화**: 반환값을 JSON.stringify → JSON.parse. Date/Decimal/BigInt 타입 소실

**핵심**: page.tsx의 `getStock`이 React `cache()`를 사용하므로, `revalidateTag("quotes")`가 호출되어도 이 페이지의 데이터에는 **영향이 전혀 없음**. 현재 수정은 dead code(`getStockDetail`)만 변경했으므로 실제 버그가 수정되지 않음.

---

## 2. ISR 무효화 체인 — Next.js 16 기준 정확한 메커니즘

```
[Cron Job]
    │
    ├─ revalidateTag("quotes")
    │   └─ unstable_cache(tags: ["quotes"]) 엔트리 삭제
    │       └─ 해당 캐시를 사용한 ISR 페이지를 stale 마킹
    │           └─ 다음 요청 시 재생성 (stale-while-revalidate)
    │
    └─ revalidatePath("/stock/005930")  ← 제거됨
        └─ ISR 페이지 직접 stale 마킹 (Data Cache와 무관)
```

**`revalidateTag`가 ISR 페이지를 무효화하는 조건**:
- 페이지 렌더링 중 `unstable_cache` 또는 `fetch(url, { next: { tags: [...] } })`가 호출되어야 함
- Next.js가 렌더 중 사용된 태그를 추적하여 페이지와 연결
- `React.cache()`로 감싼 bare Prisma 호출은 이 추적 대상에 포함되지 **않음**

**결론**: `revalidatePath` 루프를 제거하면서 `getStock`을 `unstable_cache`로 전환하지 않으면, ISR 페이지는 오직 `revalidate = 300` 타이머에만 의존. 크론 실행과 페이지 갱신 사이에 최대 5분 지연 발생.

---

## 3. 직렬화 안전성

`unstable_cache`로 전환 시 Prisma 반환값의 타입 변환:

| Prisma 타입 | `unstable_cache` 통과 후 | 영향받는 코드 |
|-------------|-------------------------|--------------|
| `Date` | `string` (`"2026-04-02T09:00:00.000Z"`) | page.tsx:125 `q.updatedAt.toISOString()` → **런타임 에러** |
| `Decimal` | `string` (`"65400"`) | page.tsx:110 `Number(q.price)` → OK (`Number("65400")` = 65400) |
| `BigInt` | **JSON.stringify 실패** → 런타임 에러 | 현재 쿼리에 BigInt 필드 없음 |
| `null` | `null` | OK |

### 해결 방법: 캐시 함수 내부에서 plain object로 변환

```typescript
const getStockFromDb = unstable_cache(
  async (ticker: string) => {
    const stock = await prisma.stock.findUnique({ ... })
    if (!stock) return null
    // Date → string, Decimal → number 변환
    const q = stock.quotes[0]
    return {
      ...stock,
      updatedAt: stock.updatedAt.toISOString(),
      quotes: stock.quotes.map(q => ({
        ...q,
        price: Number(q.price),
        // ... 모든 Decimal 필드 Number() 변환
        updatedAt: q.updatedAt.toISOString(),
      })),
    }
  },
  ["stock-page"],
  { tags: ["quotes"], revalidate: 300 }
)
```

이렇게 하면 소비 코드에서 `Number()`와 `.toISOString()` 호출이 무해해짐 (`Number(number)` = noop, `string`은 `.toISOString()` 없이 직접 사용).

---

## 4. 요청 중복 제거 (Request Deduplication)

page.tsx에서 `getStock`은 2곳에서 호출됨:
- line 54: `generateMetadata`
- line 84: `StockDetailPage` (render)

### 현재: `React.cache()` → 같은 렌더 내 자동 dedup (DB 1회)
### 전환 후: `unstable_cache`만 사용 시 → Data Cache 히트 2회 (빠르지만 불필요)

**권장**: 이중 래핑

```typescript
// Data Cache 연동 (ISR + tag)
const getStockFromDb = unstable_cache(
  async (ticker: string) => { /* Prisma + 직렬화 */ },
  ["stock-page"],
  { tags: ["quotes"], revalidate: 300 }
)

// 렌더 내 dedup (generateMetadata + render)
const getStock = cache((ticker: string) => getStockFromDb(ticker))
```

이 패턴은 Next.js 공식 권장 패턴이며, 두 캐시 레이어의 장점을 모두 확보:
1. `unstable_cache`: 요청 간 Data Cache + 태그 무효화
2. `React.cache()`: 같은 렌더 내 메모리 dedup

---

## 5. 탭 컴포넌트 분석

### 가격 데이터 의존 탭 (캐시 전환 검토 필요)

| 탭 | 함수 | 현재 | 문제 |
|----|------|------|------|
| info-tab | `getStockPeers` | `React.cache()` | 동종 종목 **가격** 포함 → stale 가능 |
| chart-tab | `getStockIndicators` | `React.cache()` | **DailyPrice** 기반 기술 지표 → stale 가능 |
| chart-tab | `getChartData` | 캐시 없음 | prefetchQuery에서 사용, ISR 타이머에만 의존 |

### 가격 비의존 탭 (현재 상태 유지 OK)

| 탭 | 함수 | 현재 | 판단 |
|----|------|------|------|
| news-tab | `getStockNews` | `React.cache()` | 뉴스는 별도 크론 + "news" 태그 |
| dividend-tab | `getStockDividends` | `React.cache()` | 배당은 별도 크론 |
| disclosure-tab | `getStockDisclosures` | `React.cache()` | 공시는 별도 크론 |
| earnings-tab | `getStockEarnings` | `React.cache()` | 실적은 별도 크론 |

**우선순위**: `getStock`(page.tsx) 전환이 P0. 탭 함수들은 ISR 페이지가 재생성될 때 함께 fresh 데이터를 가져오므로, page.tsx의 `getStock`만 태그 연결하면 탭들도 자연스럽게 갱신됨. 단, `getStockPeers`의 가격 데이터는 별도의 `unstable_cache` + `tags: ["quotes"]`를 추가하면 더 정확해짐 (P2).

---

## 6. 제안하는 코드 변경 — page.tsx `getStock`

```typescript
// === page.tsx 변경 사항 ===

// line 2-3: import 변경
import { cache } from "react"
import { unstable_cache } from "next/cache"  // 추가

// line 42-50: getStock 교체
const getStockFromDb = unstable_cache(
  async (ticker: string) => {
    const stock = await prisma.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      include: {
        quotes: { take: 1, orderBy: { updatedAt: "desc" } },
        fundamental: true,
      },
    })
    if (!stock) return null

    // unstable_cache 직렬화 대비: Date → string, Decimal → number
    const q = stock.quotes[0] ?? null
    return {
      id: stock.id,
      ticker: stock.ticker,
      name: stock.name,
      nameEn: stock.nameEn,
      market: stock.market,
      exchange: stock.exchange,
      sector: stock.sector,
      stockType: stock.stockType,
      isActive: stock.isActive,
      updatedAt: stock.updatedAt.toISOString(),
      quotes: q
        ? [
            {
              price: Number(q.price),
              previousClose: Number(q.previousClose),
              change: Number(q.change),
              changePercent: Number(q.changePercent),
              open: Number(q.open),
              high: Number(q.high),
              low: Number(q.low),
              volume: Number(q.volume),
              marketCap: q.marketCap ? Number(q.marketCap) : null,
              high52w: q.high52w ? Number(q.high52w) : null,
              low52w: q.low52w ? Number(q.low52w) : null,
              per: q.per ? Number(q.per) : null,
              pbr: q.pbr ? Number(q.pbr) : null,
              preMarketPrice: q.preMarketPrice ? Number(q.preMarketPrice) : null,
              postMarketPrice: q.postMarketPrice ? Number(q.postMarketPrice) : null,
              updatedAt: q.updatedAt.toISOString(),
            },
          ]
        : [],
      fundamental: stock.fundamental
        ? {
            eps: stock.fundamental.eps ? Number(stock.fundamental.eps) : null,
            forwardEps: stock.fundamental.forwardEps ? Number(stock.fundamental.forwardEps) : null,
            dividendYield: stock.fundamental.dividendYield ? Number(stock.fundamental.dividendYield) : null,
            roe: stock.fundamental.roe ? Number(stock.fundamental.roe) : null,
            debtToEquity: stock.fundamental.debtToEquity ? Number(stock.fundamental.debtToEquity) : null,
            beta: stock.fundamental.beta ? Number(stock.fundamental.beta) : null,
            revenue: stock.fundamental.revenue ? Number(stock.fundamental.revenue) : null,
            netIncome: stock.fundamental.netIncome ? Number(stock.fundamental.netIncome) : null,
            description: stock.fundamental.description,
            employeeCount: stock.fundamental.employeeCount,
          }
        : null,
    }
  },
  ["stock-page"],
  { tags: ["quotes"], revalidate: 300 }
)

// React.cache()로 래핑하여 렌더 내 dedup 유지
const getStock = cache((ticker: string) => getStockFromDb(ticker))

// === line 125 수정 ===
// Before: updatedAt: q.updatedAt.toISOString(),
// After:  updatedAt: q.updatedAt,  // 이미 string (unstable_cache 직렬화 완료)

// === line 110-124: Number() 래핑 제거 가능하나 유지해도 무해 ===
// Number(number) === number 이므로 기존 코드 그대로 OK
```

### 타입 참고사항

`getStockFromDb`의 반환 타입이 Prisma 자동 생성 타입과 달라지므로, `stock` 변수의 타입 추론이 변경됨. `stock.quotes[0].updatedAt`가 `string`이 되므로 page.tsx:125의 `.toISOString()` 제거가 필수.

TypeScript가 이를 잡아주는지 확인 필요: `unstable_cache`의 반환 타입은 inner function의 반환 타입을 그대로 따르므로, 실제 런타임에서는 string이지만 **타입 시스템에서는 Date로 보임**. 이는 `unstable_cache`의 알려진 타입 안전성 문제.

**보호 코드 권장**:
```typescript
updatedAt: typeof q.updatedAt === 'string' ? q.updatedAt : q.updatedAt.toISOString(),
```
또는 위 제안처럼 캐시 함수 내부에서 미리 string으로 변환하면 이 문제 해소.

---

## 7. Dead Code (`getStockDetail`) 처리

**권장: 삭제 후 page.tsx에 통합**

이유:
1. `getStockDetail`(stock-queries.ts:26-83)은 `select` 패턴, page.tsx의 `getStock`은 `include` 패턴 → 반환 타입이 다름
2. 병합하려면 소비 코드 전체의 타입 수정 필요
3. page.tsx에서만 사용하는 쿼리이므로 page.tsx 로컬에 두는 것이 응집도 높음
4. `stock-queries.ts`는 여러 탭에서 공유하는 쿼리들의 모음으로 유지

**삭제 대상**: `stock-queries.ts:26-83` (`getStockDetail` 함수 전체)

---

## 요약: 우선순위별 액션

| 순위 | 항목 | 파일 | 설명 |
|------|------|------|------|
| **P0** | `getStock` → `unstable_cache` + `tags: ["quotes"]` | page.tsx:42-50 | 캐시 무효화 체인 복구의 **유일한 핵심** |
| **P0** | 직렬화 처리 (Date/Decimal) | page.tsx:42-50 내부 | 런타임 에러 방지 |
| **P0** | line 125 `.toISOString()` 제거/방어 | page.tsx:125 | 직렬화 후 string이므로 |
| **P1** | `React.cache()` 이중 래핑 | page.tsx | generateMetadata + render dedup |
| **P2** | `getStockDetail` dead code 삭제 | stock-queries.ts:26-83 | 코드 정리 |
| **P2** | `getStockPeers`에 `unstable_cache` 검토 | stock-queries.ts:224 | 동종 종목 가격 freshness |
| **P3** | `{ expire: 0 }` 옵션 유효성 확인 | collect-kr-quotes | 미문서화 API |
