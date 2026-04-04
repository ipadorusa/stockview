# Cache Invalidation 수정 — 백엔드 코드 리뷰

**리뷰어**: Claude (Backend Senior)
**대상 커밋**: KR 종목 페이지 캐시 무효화 수정
**심각도**: BLOCKER 1건, CRITICAL 2건, WARNING 3건

---

## BLOCKER-1: `getStockDetail`은 데드 코드 — 핵심 수정이 효과 없음

**파일**: `src/lib/queries/stock-queries.ts:26-83`

`getStockDetail`을 `unstable_cache` + `tags: ["quotes"]`로 변경했으나, **이 함수를 import하는 파일이 프로젝트에 단 한 곳도 없습니다.** 실제 종목 페이지(`stock/[ticker]/page.tsx:42-50`)는 로컬 `getStock` 함수(React `cache()`)로 Prisma를 직접 호출합니다.

```
// page.tsx:42 — 실제 사용되는 함수 (tag 연결 없음)
const getStock = cache(async (ticker: string) => {
  return prisma.stock.findUnique({ ... })
})
```

React `cache()`는 단일 요청 내 dedup 용도일 뿐, `revalidateTag("quotes")`와 **전혀 연결되지 않습니다.** 따라서 cron이 `revalidateTag("quotes")`를 호출해도 이 페이지의 데이터는 무효화되지 않습니다.

**결론**: 이번 수정의 핵심 목표(cron 실행 후 종목 페이지 즉시 갱신)가 달성되지 않음.

### 권장 수정

**방법 A** (권장): `page.tsx`의 `getStock`을 제거하고, `stock-queries.ts`의 `getStockDetail`을 import하여 사용

```typescript
// page.tsx
import { getStockDetail } from "@/lib/queries/stock-queries"
// getStock 로컬 함수 삭제, getStockDetail로 교체
```

**방법 B**: `page.tsx`의 `getStock`을 `unstable_cache`로 직접 전환

```typescript
import { unstable_cache } from "next/cache"
const getStock = unstable_cache(
  async (ticker: string) => prisma.stock.findUnique({ ... }),
  ["stock-detail"],
  { tags: ["quotes"], revalidate: 300 }
)
```

---

## CRITICAL-1: `revalidateTag`만으로 ISR 페이지를 즉시 무효화할 수 없음

**파일**: `collect-kr-quotes/route.ts:222`

```typescript
revalidateTag("quotes", { expire: 0 })
```

Next.js에서 `revalidateTag`는 **`unstable_cache` 또는 `fetch`에 설정된 tag**만 무효화합니다. ISR의 `export const revalidate = 300`은 tag 기반이 아닌 시간 기반 캐시이므로, `revalidateTag`로 ISR 페이지 자체를 무효화할 수 없습니다.

올바른 흐름:
1. 페이지 내 데이터 fetching 함수가 `unstable_cache` + `tags: ["quotes"]` 사용 -> `revalidateTag("quotes")`로 데이터 캐시 무효화
2. ISR 페이지 자체의 갱신은 `revalidatePath` 또는 ISR timer에 의존

**현재 상태**: BLOCKER-1이 해결되지 않는 한, `revalidateTag("quotes")`가 호출되어도 종목 페이지 렌더링에 사용되는 데이터에는 영향 없음.

### `{ expire: 0 }` 옵션에 대하여

Next.js 16 공식 문서에서 `revalidateTag`의 두 번째 인자로 `{ expire: 0 }`은 문서화되어 있지 않습니다. 동작 여부를 확인할 필요가 있습니다. 표준 사용법은 `revalidateTag("quotes")`만 호출하는 것입니다.

---

## CRITICAL-2: `revalidatePath` 제거의 부작용

이전에는 ~4,800개 종목에 대해 `revalidatePath`를 루프 호출하여 ISR 페이지를 강제 갱신했습니다. 성능 문제가 있었지만, **최소한 페이지가 갱신되기는 했습니다.**

현재는 `revalidatePath`를 완전히 제거했으므로:
- ISR `revalidate = 300`에만 의존 → 최대 5분 지연
- `revalidateTag("quotes")`는 데드 코드 `getStockDetail`만 대상 → 실질적 효과 0

### 권장 수정

1. BLOCKER-1을 먼저 해결 (페이지가 `unstable_cache` + tag를 사용하도록)
2. 그러면 `revalidateTag("quotes")`가 데이터 캐시를 무효화하고, ISR 300초 내에 다음 요청에서 fresh 데이터로 재렌더링
3. 즉시 갱신이 필요하면 `revalidatePath`를 **인기 종목 상위 100개**만 대상으로 호출 (전체 4,800개 루프 대신)

---

## WARNING-1: Prisma Date/Decimal 직렬화 위험

**파일**: `stock-queries.ts:26-83`

`unstable_cache`는 반환값을 JSON으로 직렬화합니다. Prisma의 `Date` → `string`, `Decimal` → `string`으로 변환됩니다.

`page.tsx:125`에서:
```typescript
updatedAt: q.updatedAt.toISOString(),
```

만약 `getStockDetail`을 실제로 사용하게 되면, 캐시 히트 시 `q.updatedAt`는 이미 `string`이므로 `.toISOString()` 호출이 **런타임 에러**를 발생시킵니다.

### 권장 수정

`getStockDetail` 내부에서 직렬화를 처리하여 plain object를 반환하거나, 소비하는 쪽에서 `typeof q.updatedAt === 'string' ? q.updatedAt : q.updatedAt.toISOString()`로 방어 코드 추가.

---

## WARNING-2: 0건 수집 알림 로직의 엣지 케이스

**파일**: `collect-kr-quotes/route.ts:212-218`

```typescript
if (stats.stockQuote === 0 && stats.errors.length === 0) {
  await sendTelegramAlert(...)
}
```

**엣지 케이스**:
- `exchange=KOSPI`로 호출했는데 KOSPI fetch가 `rejected`, KOSDAQ은 `fulfilled`(빈 배열) → `errors`에 KOSPI 에러 추가 → `errors.length > 0`이므로 이 조건 미진입. **하지만 line 203-209의 에러 알림에서 이미 커버됨.** OK.
- DB에 active KR 종목이 0건 → `allStocks` 필터 후 0건 → `stockQuote=0`, `errors=[]` → 알림 발송. **정상 동작이나, 메시지가 "Naver 스크래핑 실패"라고 표시되어 오해 소지**. 실제로는 DB 종목 매칭 실패일 수 있음.

### 권장 수정

알림 메시지에 `dbStocks.length` 정보를 추가하여 원인 진단을 용이하게:
```typescript
`date=${stats.date}, dbStocks=${dbStocks.length}, stockQuote=0`
```

---

## WARNING-3: `--fail-with-body` 충분성

**파일**: `.github/workflows/cron-kr.yml:18, 29`

`--fail-with-body`는 HTTP 4xx/5xx 시 curl이 non-zero exit code를 반환하면서 response body도 출력합니다. 이는 기존 `--fail`보다 개선된 점이며, **충분합니다.**

다만 추가 권장사항:
- **타임아웃 설정 없음**: Vercel Function이 55초 `maxDuration`이지만, curl 자체는 무한 대기 가능. `--max-time 120` 추가 권장.
- **KOSDAQ job이 KOSPI에 `needs` 의존**: KOSPI 실패 시 KOSDAQ도 skip됨. 의도적 설계인지 확인 필요 (KOSPI/KOSDAQ은 독립적 거래소이므로 병렬 실행도 가능).

---

## 요약: 우선순위별 액션 아이템

| 순위 | 항목 | 액션 |
|------|------|------|
| 1 | BLOCKER-1 | `page.tsx`의 `getStock`을 `unstable_cache` + `tags: ["quotes"]`로 전환하거나, `getStockDetail` import |
| 2 | CRITICAL-1 | `{ expire: 0 }` 옵션 유효성 확인, 필요시 제거 |
| 3 | CRITICAL-2 | 인기 종목 대상 `revalidatePath` 선별적 호출 검토 |
| 4 | WARNING-1 | `unstable_cache` 사용 시 Date/Decimal 직렬화 처리 |
| 5 | WARNING-2 | 0건 알림에 `dbStocks.length` 추가 |
| 6 | WARNING-3 | curl에 `--max-time` 추가, KOSPI/KOSDAQ 의존성 재검토 |
| 7 | 데드 코드 | `getStockDetail`의 `unstable_cache` 변경은 BLOCKER-1 해결 시 활용, 아니면 revert |
