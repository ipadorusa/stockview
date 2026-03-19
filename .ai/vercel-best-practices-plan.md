# Vercel React Best Practices 적용 계획

> 3라운드 비교 분석을 통해 최적의 리팩토링 전략을 도출합니다.

---

## 현재 상태 감사 결과

| 항목 | 현황 | 위반 룰 |
|------|------|---------|
| Suspense Boundaries | 0개 | `async-suspense-boundaries` |
| Dynamic Imports (next/dynamic) | 0개 | `bundle-dynamic-imports` |
| optimizePackageImports | 미설정 | `bundle-barrel-imports` |
| React.memo | 0개 | `rerender-memo` |
| content-visibility | 미사용 | `rendering-content-visibility` |
| 클라이언트 전용 페이지 | 7개 (screener, news, watchlist 등) | `server-serialization` |
| stock-chart 번들 | ~984줄 + 30개 indicator 임포트 | `bundle-dynamic-imports` |
| Toaster (sonner) | 항상 로드 | `bundle-defer-third-party` |
| search-command 이벤트리스너 | cleanup 누락 | `client-event-listeners` |

---

## Round 1: 초기 계획 (임팩트 중심 단순 적용)

### Phase 1 — CRITICAL: Suspense + Streaming (async-suspense-boundaries)
- `app/page.tsx`: Promise.all 이후 전체 블로킹 → Suspense로 뉴스/인기종목 스트리밍
- `app/market/page.tsx`: 상승/하락 종목을 Suspense로 분리
- `app/stock/[ticker]/page.tsx`: 이미 initialData 패턴 사용 중이므로 유지

### Phase 2 — CRITICAL: Bundle 최적화
- `next.config.ts`에 `optimizePackageImports: ['lucide-react', '@tanstack/react-query']` 추가
- `stock-chart.tsx`를 `next/dynamic`으로 lazy 로드 (SSR 불필요)
- `search-command.tsx`를 `next/dynamic`으로 lazy 로드
- Toaster를 `next/dynamic({ ssr: false })`로 전환

### Phase 3 — HIGH: Server Component 활용 극대화
- `news/page.tsx`, `screener/page.tsx`: "use client" 제거 → Server Component + 클라이언트 하위 컴포넌트 분리
- `watchlist/page.tsx`: 인증 필요 → 클라이언트 유지하되, Skeleton을 서버에서 렌더

### Phase 4 — MEDIUM: Re-render 최적화
- `StockRow`에 `React.memo` 적용 (시장 목록에서 반복 렌더링)
- `stock-chart.tsx` 내 30개 indicator 임포트 → conditional dynamic import
- 인기종목 리스트에 `content-visibility: auto` CSS 적용

### Phase 5 — MEDIUM: 클라이언트 개선
- `search-command.tsx` 이벤트 리스너 cleanup 추가
- `screener/page.tsx` useEffect prefetch → 이벤트 핸들러로 이동

**Round 1 평가**: 포괄적이나, Phase 3의 "use client" 제거가 과도함. screener/watchlist은 상태 관리가 핵심이라 서버 컴포넌트 전환이 오히려 복잡도를 높임. Phase 4의 indicator conditional import는 stock-chart가 이미 useEffect 내 dynamic import를 하고 있어 중복.

---

## Round 2: 수정된 계획 (실용성 보정)

### Phase 1 — Suspense Streaming (변경)
- `app/page.tsx`: 뉴스 섹션만 Suspense 분리 (인기종목은 LCP 요소이므로 블로킹 유지)
- `app/market/page.tsx`: SectorPerformance가 클라이언트 fetch를 하므로 이미 비동기 → 추가 Suspense 불필요
- **추가**: `app/stock/[ticker]/stock-detail-client.tsx`의 4개 useQuery 중 news, indicators를 Suspense 패턴으로

### Phase 2 — Bundle 최적화 (유지 + 보강)
- `next.config.ts`: `optimizePackageImports` 추가
- `stock-chart.tsx` → `next/dynamic({ ssr: false })` ← **가장 큰 번들 절감**
- `search-command.tsx` → `next/dynamic({ ssr: false })`
- `dividend-history.tsx`, `earnings-calendar.tsx` → `next/dynamic` (탭 전환 시 로드)
- Toaster → dynamic
- **삭제**: screener/news의 서버 전환은 제외 (Round 1 피드백 반영)

### Phase 3 — Server 최적화 (새로 추가)
- `app/stock/[ticker]/page.tsx`: 이미 `React.cache()` 사용 중 — 양호
- **추가**: `app/page.tsx`, `app/market/page.tsx`의 query 함수들에 `React.cache()` 래핑 (generateMetadata와 공유 시 중복 호출 방지)
- **추가**: `server-serialization` — stock-detail-client에 전달하는 initialData에서 불필요한 null 필드 제거

### Phase 4 — Re-render + Rendering (유지 + 수정)
- `StockRow`에 `React.memo` 적용
- `IndexCard`에 `React.memo` 적용 (시장 페이지에서 반복)
- 주식 목록에 `content-visibility: auto` 적용
- **삭제**: indicator conditional import (이미 dynamic import 패턴)

### Phase 5 — 클라이언트 품질 (유지)
- 이벤트 리스너 cleanup
- screener prefetch를 이벤트 핸들러로

**Round 2 평가**: Phase 1의 stock-detail-client Suspense 적용이 복잡함. 이미 useQuery로 데이터를 가져오고 있어 React Query의 자체 로딩 상태가 Suspense 역할을 함. Phase 2는 좋으나, dividend/earnings를 dynamic으로 하면 탭 전환 시 로딩 깜빡임이 생길 수 있음 → preload 전략 필요. Phase 3의 React.cache는 ISR 환경에서는 의미 제한적 (빌드 시 1회 호출).

---

## Round 3: 최종 계획 (최적화된 버전)

### Round 2 대비 변경 사항
1. **Suspense**: stock-detail-client 제외 (React Query가 이미 처리), 홈페이지 뉴스만 적용
2. **Dynamic import**: dividend/earnings에 preload 전략 추가 (탭 hover 시)
3. **React.cache**: ISR 페이지에서 제외 (generateMetadata가 없는 page.tsx에서는 불필요)
4. **추가**: `rendering-conditional-render` — `&&` 패턴을 ternary로 교체 (0 렌더링 버그 방지)
5. **추가**: `js-hoist-regexp` — naver scraper들의 RegExp를 모듈 레벨로 호이스트

---

## 최종 실행 계획

### Phase 1: next.config.ts + Bundle 기반 작업 (CRITICAL)
**영향도: 매우 높음 | 난이도: 낮음**

1. **`next.config.ts`** — `optimizePackageImports` 추가
   ```ts
   experimental: {
     optimizePackageImports: ['lucide-react', '@tanstack/react-query', 'sonner'],
   }
   ```

2. **`stock-chart.tsx` → `next/dynamic`**
   - `stock-detail-client.tsx`에서 직접 import 대신 dynamic import
   - `{ ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }`
   - 예상 절감: ~150KB+ (lightweight-charts + 30 indicator 함수)

3. **`search-command.tsx` → `next/dynamic`**
   - `search-bar.tsx`에서 dynamic import
   - `{ ssr: false }`
   - Ctrl+K 트리거 시에만 로드

4. **Toaster → `next/dynamic({ ssr: false })`**
   - `providers.tsx`에서 dynamic import

### Phase 2: Suspense Streaming (CRITICAL)
**영향도: 높음 | 난이도: 중간**

1. **`app/page.tsx`** — 뉴스 섹션을 async 서버 컴포넌트로 분리
   ```tsx
   // 인기종목은 LCP → 블로킹 유지
   // 뉴스는 below-the-fold → Suspense 스트리밍
   <Suspense fallback={<NewsSkeleton />}>
     <LatestNews />
   </Suspense>
   ```
   - `LatestNews`를 별도 async 컴포넌트로 추출 (같은 파일 또는 별도 파일)

2. **`app/market/page.tsx`** — 상승/하락 종목을 Suspense로 분리
   - 지수는 LCP → 블로킹 유지
   - Movers 데이터를 별도 async 컴포넌트로

### Phase 3: Dynamic Import 탭 컴포넌트 + Preload (HIGH)
**영향도: 중간~높음 | 난이도: 낮음**

1. **`stock-detail-client.tsx`** — 탭별 컴포넌트 lazy 로드
   ```tsx
   const DividendHistory = dynamic(() => import('@/components/stock/dividend-history').then(m => m.DividendHistory))
   const EarningsCalendar = dynamic(() => import('@/components/stock/earnings-calendar').then(m => m.EarningsCalendar))
   const PeerStocks = dynamic(() => import('@/components/stock/peer-stocks').then(m => m.PeerStocks))
   ```
   - 탭 trigger에 `onMouseEnter`로 preload 추가 (bundle-preload 룰)

2. **`stock-detail-client.tsx`** — technical-indicators dynamic import 정리
   - 이미 indicators 계산 시 `await import()`를 사용 중 → 양호, 변경 불필요

### Phase 4: React.memo + Rendering 최적화 (MEDIUM)
**영향도: 중간 | 난이도: 낮음**

1. **`StockRow` → `React.memo`**
   - 시장/관심종목 페이지에서 목록 렌더링 시 불필요한 re-render 방지
   - props가 모두 primitive이므로 커스텀 비교 함수 불필요

2. **`IndexCard` → `React.memo`**
   - 시장 페이지에서 4개씩 반복

3. **`NewsCard` → `React.memo`**
   - 뉴스 목록에서 반복

4. **`content-visibility: auto`** CSS 추가
   - `globals.css`에 `.stock-list-item { content-visibility: auto; contain-intrinsic-size: 0 60px; }` 추가
   - StockRow, NewsCard에 해당 클래스 적용

5. **조건부 렌더링 `&&` → ternary** (rendering-conditional-render)
   - `{count && <Badge />}` 같은 패턴에서 `count`가 0일 때 "0" 렌더링 방지
   - 해당 패턴 전체 검색 후 수정

### Phase 5: 클라이언트 품질 + JS 성능 (MEDIUM)
**영향도: 낮음~중간 | 난이도: 낮음**

1. **`search-command.tsx`** — 이벤트 리스너 cleanup
   ```tsx
   useEffect(() => {
     const handler = (e: KeyboardEvent) => { ... }
     document.addEventListener("keydown", handler)
     return () => document.removeEventListener("keydown", handler)
   }, [])
   ```

2. **`screener/page.tsx`** — useEffect prefetch → 이벤트 핸들러
   - `rerender-move-effect-to-event` 룰 적용
   - 마켓 탭 전환 시 onValueChange 핸들러에서 prefetch

3. **Naver scraper RegExp 호이스트** (js-hoist-regexp)
   - `naver-fundamentals.ts`, `naver.ts`의 정규식을 모듈 레벨 상수로

4. **`stock-detail-client.tsx`** — initialData 직렬화 최소화
   - `server-serialization`: null 필드를 undefined로 (JSON에서 제거됨)

### Phase 6: 검증
1. `npm run build` — 빌드 성공 확인
2. 번들 사이즈 비교 (before/after)
3. 주요 페이지 동작 확인 (홈, 시장, 종목상세, 뉴스, 스크리너)

---

## 적용하지 않는 룰과 사유

| 룰 | 사유 |
|----|------|
| `client-swr-dedup` | 이미 TanStack React Query 사용 중 (동등한 기능) |
| `server-cache-lru` | ISR 사용 중이라 서버 캐시 레이어 불필요 |
| `server-auth-actions` | Server Actions 미사용 (API routes + middleware 인증) |
| `advanced-*` | 복잡도 대비 효과 미미 |
| `bundle-barrel-imports` | 배럴 파일 없음 (이미 양호) |
| `rendering-activity` | React Activity는 아직 실험적 |
| `rendering-hydration-*` | suppressHydrationWarning 이미 html 태그에 적용 |
| `server-cache-react` | ISR이 request dedup 역할 수행 |
| `server-after-nonblocking` | Cron 전용이라 after() 불필요 |

---

## 예상 효과

| 지표 | Before | After (예상) |
|------|--------|-------------|
| 초기 JS 번들 | ~350KB+ | ~200KB (−40%) |
| 홈페이지 TTFB→LCP | 블로킹 | 스트리밍 (−30%) |
| stock-chart 로드 | 초기 번들 포함 | on-demand (~150KB 절감) |
| search-command | 항상 로드 | Ctrl+K 시 로드 |
| 목록 re-render | 전체 리렌더 | memo로 스킵 |
