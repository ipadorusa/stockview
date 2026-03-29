# 독립 스위핑 검증 보고서 2 (Sweep-2)

> 검증일: 2026-03-28
> 역할: 독립 스위핑 검증관 2 — 9명의 에이전트 + 검증관 1의 작업에 대한 2차 독립 검증
> 방법: 기존 24건 전수 소스코드 대조 + 독자적 블라인드 스팟 탐색 + 문서 정합성 최종 검사
> 검증관 1의 오류도 지적 대상

---

## 1. 기존 24건 재검증

### CRITICAL 이슈 (2건)

#### C-1: 차트 기간 옵션 오류 — CONFIRMED

**검증 근거:**
- `src/types/stock.ts:66` — `ChartPeriod = "1W" | "2W" | "3W" | "1M" | "3M" | "6M" | "1Y"` (정확히 7개)
- `src/components/stock/chart-controls.tsx:7-14` — `PERIOD_LABELS` 동일 7개 키 확인

**문서 오류:**
- Doc A 2.3절: "기간 선택: 1M/3M/6M/1Y/3Y" — `1W`, `2W`, `3W` 누락, 존재하지 않는 `3Y` 포함
- Doc B 3.3절: "기간 변경: 1W~5Y" — 존재하지 않는 `5Y` 포함

**판정: CRITICAL 확정.** 검증관 1과 동일 결론.

---

#### C-2: 관심종목 인증 서술 모순 — CONFIRMED

**검증 근거:**
- `src/proxy.ts:8` — `pathname.startsWith("/watchlist")` → 미들웨어 보호 1차
- `src/proxy.ts:28-34` — 미인증 시 `/auth/login?callbackUrl=` 리다이렉트
- `src/app/watchlist/page.tsx:24` — `useSession()` 2차 체크
- `src/app/watchlist/page.tsx:63-73` — `status === "unauthenticated"` 시 로그인 버튼 UI

**실제 구조:** 이중 보호 (미들웨어 1차 + 컴포넌트 2차)

**Doc B의 모순:**
- Doc B 4.1 인벤토리 #10: `보호` (맞음)
- Doc B 3.4절 본문: "미인증 시: 로그인 안내 화면 (미들웨어가 아닌 컴포넌트 레벨 체크)" — **명시적으로 미들웨어를 부정**하여 오류

**판정: CRITICAL 확정.** 검증관 1과 동일 결론.

---

### MAJOR 이슈 (5건)

#### M-1: MAX_SLOTS 5→4 코드 버그 — CONFIRMED

**검증 근거:**
- `src/app/page.tsx:208` — `description="최대 5종목 비교 분석"` (UI 텍스트)
- `src/app/compare/page.tsx:90` — `const MAX_SLOTS = 4` (실제 제한)
- `src/contexts/compare-context.tsx:21` — `const MAX_SLOTS = 4` (CompareContext에서도 4로 제한)

**추가 발견:** CompareContext에서도 MAX_SLOTS=4를 사용하여 `addToCompare` 시 4개 제한이 이중으로 적용됨. 이는 단순 UI 텍스트 오류가 아니라 홈페이지의 "5종목" 문구가 실제 동작과 불일치하는 확실한 코드 버그.

**판정: MAJOR 확정.**

---

#### M-2: /portfolio 404 — CONFIRMED

**검증 근거:**
- `src/app/portfolio/` — 디렉토리 미존재 확인
- `src/components/layout/app-header.tsx:56` — navGroups MY 그룹에 `{ href: "/portfolio", label: "포트폴리오" }`
- `src/components/layout/app-header.tsx:103` — navCategories "더보기" subLinks에 `{ href: "/portfolio", label: "포트폴리오" }`
- `src/proxy.ts:41` — matcher에 `/portfolio/:path*` 포함
- `src/proxy.ts:8-15` — `isProtectedRoute`에 `/portfolio` **미포함**

**판정: MAJOR 확정.** 검증관 1과 동일 결론. 3중 문제 (네비→404, matcher/isProtectedRoute 비대칭, 실기능은 /watchlist 탭).

---

#### M-3: loading/error 바운더리 누락 (Doc A) — CONFIRMED

**파일시스템 전수 확인:**

loading.tsx (7개):
1. `src/app/market/loading.tsx`
2. `src/app/news/loading.tsx`
3. `src/app/stock/[ticker]/loading.tsx`
4. `src/app/watchlist/loading.tsx`
5. `src/app/screener/loading.tsx`
6. `src/app/etf/loading.tsx`
7. `src/app/etf/[ticker]/loading.tsx`

error.tsx (4개):
1. `src/app/error.tsx` (루트)
2. `src/app/market/error.tsx`
3. `src/app/news/error.tsx`
4. `src/app/stock/[ticker]/error.tsx`

not-found.tsx (1개): `src/app/not-found.tsx`

**Doc A 1.4절:** 루트 `error.tsx`만 기재. 나머지 loading 7개 + error 3개 = 10개 누락.
**Doc B 4.3절:** 전체 loading/error 표가 정확하게 기재됨.

**판정: MAJOR 확정.**

---

#### M-4: Desktop/Mobile 네비게이션 구조 차이 미상세 — CONFIRMED

**소스코드 확인:**

Desktop navCategories (`app-header.tsx:63-108`):
- 투자 정보: 시장, ETF, 섹터, 배당, 실적
- 분석: 스크리너, AI 리포트, 분석 요청, 비교, 가이드
- 뉴스: 뉴스, 게시판
- 더보기: 관심종목, 포트폴리오, 마이페이지, 소개 (subLinks 4개)
  - prefixes에는 `/settings`, `/contact` 포함하나 subLinks에는 없음

Mobile navGroups (`app-header.tsx:24-61`):
- 투자 정보: 시장 개요, ETF, 섹터별 종목, 배당 캘린더, 실적 캘린더
- 분석 도구: 스크리너, AI 리포트, 리포트 요청, 종목 비교, 투자 가이드
- 뉴스 · 커뮤니티: 뉴스, 게시판
- MY: 관심종목, 포트폴리오, 마이페이지, 설정 (4개)

BottomTabBar (`bottom-tab-bar.tsx:10-16`):
- 홈, 검색(오버레이), 시장, 관심, MY (5개)

**차이점 (문서 미기재):**
1. Desktop "더보기"에 `설정` 미포함 → Mobile MY에는 포함
2. Desktop "더보기"에 `소개(/about)` 포함 → Mobile MY에는 미포함
3. Desktop "분석" subLinks에 `분석 요청` label → Mobile은 `리포트 요청`
4. BottomTabBar 검색은 오버레이 동작 (isOverlay: true)
5. BottomTabBar MY의 활성 판정이 `/mypage` OR `/settings` (`bottom-tab-bar.tsx:34`)

**판정: MAJOR 확정.**

---

#### M-5: API Request/Response 스키마 부재 — CONFIRMED

**검증 근거:**
- `src/lib/validations/board.ts` — 게시판 Zod 스키마 존재
- `src/lib/validations/report-request.ts` — 리포트 요청 Zod 스키마 존재
- 양쪽 문서 모두 API 목록만 있고 Request/Response 타입 정의 없음

**판정: MAJOR 확정 (문서 범위 경계).**

---

### MINOR 이슈 (기존 9건)

#### m-1: Doc B Toaster 레이아웃 다이어그램 누락 — CONFIRMED

**근거:** `src/components/providers.tsx:33` — `<Toaster richColors />`는 ThemeProvider 내부, TooltipProvider/CompareProvider 외부에 위치. Doc B 1절 레이아웃 다이어그램에서 Toaster 미표시.

**추가 발견:** Doc B 1절의 Provider 중첩 표현이 `├──` 형태의 평면적 나열로 되어 있어, 실제 중첩 구조(SessionProvider > QueryClientProvider > ThemeProvider > TooltipProvider > CompareProvider)가 아닌 형제 관계처럼 오독될 수 있다.

**판정: CONFIRMED.**

---

#### m-2: Doc B "분석 요청" URL 미기재 — CONFIRMED

**근거:** `app-header.tsx:83` — `{ href: "/reports?tab=requests", label: "분석 요청" }`. Doc B 2절 카테고리 매핑에 URL prefix `/screener, /reports, /compare, /guide`만 기재.

**판정: CONFIRMED.**

---

#### m-3: Doc B "더보기" prefixes와 subLinks 혼동 — CONFIRMED

**근거:** `app-header.tsx:100-106`:
- prefixes (6개): `/watchlist`, `/portfolio`, `/mypage`, `/settings`, `/about`, `/contact`
- subLinks (4개): 관심종목, 포트폴리오, 마이페이지, 소개

`/settings`와 `/contact`가 prefixes에만 있고 subLinks에는 없음.

**판정: CONFIRMED.**

---

#### m-4: Doc A 공통 컴포넌트 섹션 미비 — CONFIRMED

**근거:** Doc A에는 `PageContainer`, `GtmPageView`, `JsonLd`, `Breadcrumb`, `AdSlot`, `AdDisclaimer`, `EmptyState`, `StockRow` 등 공통 컴포넌트 별도 섹션 없음. Doc B 6.2절에는 정리됨.

**판정: CONFIRMED.**

---

#### m-5: Doc A 홈페이지 환율 섹션 미기재 — 부분 CONFIRMED (검증관 1과 동일)

**근거:** `src/app/page.tsx:175-201` — 독립 환율 카드 그리드 섹션 존재. Doc A 2.1절에서 `CompactIndexBar`의 `exchangeRates` props 언급은 있으나, 별도 환율 섹션(카드 5장)은 명시하지 않음.

**판정: 부분 CONFIRMED.**

---

#### m-6: opengraph-image.tsx 미기재 — CONFIRMED (2개)

**근거:**
- `src/app/stock/[ticker]/opengraph-image.tsx` — 존재 확인
- `src/app/etf/[ticker]/opengraph-image.tsx` — 존재 확인

양쪽 문서 모두 미기재.

**판정: CONFIRMED.**

---

#### m-7: Doc B sitemap.ts (기본) 미기재 — CONFIRMED

**근거:** `src/app/sitemap.ts` — 존재 확인. Doc B 4.4절에는 4개 XML route 사이트맵만 기재하고 기본 `sitemap.ts` 누락. Doc A 1.4절에는 기재됨.

**판정: CONFIRMED.**

---

#### m-8: Doc A Mermaid 다이어그램 API 경로 형식 불일치 — CONFIRMED

**근거:** Doc A 6.2절 Mermaid에서 `/api/stocks/ticker/chart` (동적 세그먼트 표기 없이 "ticker" 평문)를 사용. Next.js 컨벤션인 `[ticker]` 표기와 불일치.

**판정: CONFIRMED.**

---

#### m-9: /reports/request 인증 방식 명확화 — CONFIRMED

**근거:**
- `src/proxy.ts:8-15` — `/reports/request`는 `isProtectedRoute`에 **미포함**
- `src/proxy.ts:41` matcher — `/reports/request`에 매칭되는 패턴 **없음**
- `src/app/reports/request/page.tsx:80` — `status === "unauthenticated"` 시 로그인 안내 UI

이는 미들웨어 리다이렉트가 아닌 컴포넌트 레벨 체크만 존재. `/watchlist`(미들웨어 보호)와 명확히 다른 패턴.

**판정: CONFIRMED.**

---

### 블라인드 스팟 이슈 (기존 8건)

#### NEW-1: OnboardingSheet 데드 코드 — CONFIRMED

**근거:**
- `src/components/onboarding/onboarding-sheet.tsx` — 파일 존재 확인
- grep `onboarding-sheet` → 어떤 파일에서도 import되지 않음

**판정: CONFIRMED. 데드 코드.**

---

#### NEW-2: 홈페이지 비로그인 CTA 배너 상세 미기술 — CONFIRMED

**근거:** `src/app/page.tsx:137-151` — `{!session && (...)}` 조건부 렌더링. `/guide`, `/auth/register` 두 CTA 링크 존재. 양쪽 문서에서 존재 언급하나 정확한 구성은 미상세.

**판정: CONFIRMED.**

---

#### NEW-3: HeroSection 내부 동작 미기술 — CONFIRMED (단, 검증관 1보다 상세화 필요)

**근거:** `src/components/home/hero-section.tsx`:
- `useSession()` — 로그인 사용자에게는 표시 안 함 (line 34: `if (session) return`)
- `localStorage.getItem("sv_visited")` — 이미 방문한 비로그인 사용자에게도 표시 안 함
- `localStorage.setItem("sv_visited", "true")` — 닫기 시 영구 저장
- 3개 기능 카드: 스크리너(`/screener`), AI 리포트(`/reports`), 배당 캘린더(`/dividends`)

**검증관 1 서술 오류:** "스크리너/AI 리포트/배당 캘린더 3개 기능 카드 + 닫기 기능 + localStorage 기반 상태 유지" → 정확. 오류 없음.

**판정: CONFIRMED.**

---

#### NEW-4: BottomTabBar "검색" 탭 오버레이 동작 — CONFIRMED

**근거:** `src/components/layout/bottom-tab-bar.tsx:12` — `{ href: "#search", label: "검색", icon: Search, isOverlay: true }`. Line 37-47에서 `isOverlay` 시 `<button>` 렌더링하고 `setSearchOpen(true)` 호출.

**판정: CONFIRMED.**

---

#### NEW-5: navCategories "더보기" subLinks와 prefixes 비대칭 — CONFIRMED

**근거:** m-3과 동일 근거. UX 측면에서 `/settings`와 `/contact` 경로에서 "더보기"가 활성화되지만 드롭다운에서 해당 링크로 이동할 수 없음.

**판정: CONFIRMED. m-3의 확장 이슈.**

---

#### NEW-6: screener/[signal] `dynamicParams=false` — CONFIRMED

**근거:** `src/app/screener/[signal]/page.tsx:69` — `export const dynamicParams = false`. `generateStaticParams()`가 5개 시그널만 반환 (line 51-52). 다른 경로 접근 시 404.

**판정: CONFIRMED.**

---

#### NEW-7: 공개 리포트 vs 보호 리포트 접근 권한 대비 미흡 — CONFIRMED

**근거:**
- `/reports` (공개), `/reports/[slug]` (공개) — 누구나 접근
- `/reports/stock/[ticker]` — 미들웨어 보호 (`proxy.ts:13`)
- `/reports/request` — 컴포넌트 레벨 체크만

세 가지 다른 보호 수준이 같은 `/reports` 하위에 혼재.

**판정: CONFIRMED.**

---

#### NEW-8: QueryClient 전역 기본 설정 미기술 — CONFIRMED

**근거:** `src/components/providers.tsx:14-21`:
- `staleTime: 5 * 60 * 1000` (5분)
- `gcTime: 30 * 60 * 1000` (30분)
- `retry: 1`

Doc B 7.5절에서 "staleTime 5분, gcTime 30분"으로 간접 언급하나 retry 미언급. Doc A에서는 전혀 미언급.

**추가 발견:** 개별 컴포넌트에서 staleTime을 오버라이드하는 경우가 다수:
- `use-chart-data.ts:16` — 24시간
- `watchlist/page.tsx:36,47` — 1분
- `mypage/page.tsx:27` — 1분
- `screener-client.tsx:34` — 15분
- `peer-stocks.tsx:35` — 30분

이러한 오버라이드 패턴이 문서에 없음.

**판정: CONFIRMED (INFO → MINOR 격상 권고).**

---

### 검증관 1 오류/부족 사항

| 항목 | 검증관 1 서술 | 실제 | 영향 |
|------|-------------|------|------|
| route.ts 개수 | "62개" (line 441) | **63개** (API 59 + sitemap 4) | 문서 품질 기준 수치 오류 |
| Toaster 위치 | "ThemeProvider 내부, CompareProvider 외부" | ThemeProvider 내부, **TooltipProvider 외부**, CompareProvider 외부 | 정밀도 부족 |
| m-6 | "이전 검증1은 stock만 언급하고 etf를 놓침" | 검증관 1 본인이 2개 다 기재함 (line 167-168) | 자기 모순적 서술 |

---

## 2. 신규 발견 (9명 에이전트 + 검증관 1 모두 놓친 사항)

### S2-NEW-1: `canEditPost` 관리자 권한 누락 — **MAJOR (코드 버그)**

**발견:**
- `src/lib/board-permissions.ts:16-18`:
  ```typescript
  export function canEditPost(session: Session | null, post: PostLike) {
    if (!session) return false
    return session.user.id === post.authorId
  }
  ```
- `canDeletePost` (line 21-23)은 `isAdmin(session)` 체크 포함
- `canEditPost`에는 `isAdmin` 체크가 **없음**

**영향:**
- Doc A 2.17절: "글 수정: 본인 + 관리자" → **오류. 관리자는 수정 불가.**
- Doc B 3.7절: "본인 글" 수정만 언급 → **정확**
- `src/app/board/[id]/edit/page.tsx:26` — `canEditPost(session, post)` 사용 → 관리자도 타인 글 수정 불가
- `src/app/api/board/[id]/route.ts:62` — PATCH에서 `canEditPost` 사용 → API에서도 관리자 수정 불가

**이것은 코드 버그이거나 의도적 설계 결정이다.** `canDeletePost`는 관리자 포함인데 `canEditPost`는 미포함이라는 비대칭이 존재. 문서에서 이 비대칭을 명확히 기술해야 한다.

**판정: MAJOR. 9명 + 검증관 1 모두 놓침.**

---

### S2-NEW-2: 차트 고급 기능 (Heikin-Ashi, 9개 보조지표 패널, 고급 오버레이) 미기술 — MINOR

**발견:**
- `src/components/stock/chart-controls.tsx:17` — `MAType = "off" | "SMA" | "EMA"` (이동평균 타입)
- `src/components/stock/chart-controls.tsx:18` — `IndicatorPanel = "MACD" | "RSI" | "Stochastic" | "OBV" | "ATR" | "ROC" | "MFI" | "ADLine" | "ADX"` (9개 보조지표 패널)
- `src/hooks/use-chart-data.ts:19-22` — Heikin-Ashi 캔들 계산 (`calculateHeikinAshi`)
- `src/components/stock/stock-chart.tsx:137` — `showHA` 토글로 Heikin-Ashi 표시 전환
- `src/components/stock/stock-chart.tsx:492` — `showBB, showKC, showFib, showPatterns, showPivot, showSAR` 추가 오버레이 존재

**차트에서 지원하는 기능 전체 목록:**
1. 캔들/Heikin-Ashi 전환
2. 이동평균선 (SMA/EMA)
3. 볼린저밴드 (BB)
4. 켈트너 채널 (KC)
5. 피보나치 되돌림 (Fib)
6. 패턴 인식 (Patterns)
7. 피봇 포인트 (Pivot)
8. 파라볼릭 SAR
9. 하단 패널: MACD, RSI, Stochastic, OBV, ATR, ROC, MFI, AD Line, ADX

**양쪽 문서에서의 서술:**
- Doc A 2.3절: "TradingView lightweight-charts 기반 가격 차트 (기간 선택: 1M/3M/6M/1Y/3Y)" — 기간만 언급
- Doc B 3.3절: 차트 탭에 대해 기간 변경만 언급

**판정: MINOR. 차트 기능의 상당 부분이 완전 누락되어 있으나, 핵심 사용자 플로우에는 영향 적음. 단 FE 구현 참조 시에는 중요.**

---

### S2-NEW-3: `use-chart-data` 커스텀 훅 staleTime 24시간 vs 문서 미언급 — MINOR

**발견:**
- `src/hooks/use-chart-data.ts:16` — `staleTime: 24 * 60 * 60 * 1000` (24시간)
- 이는 전역 기본값(5분)을 **크게** 오버라이드
- 차트 데이터가 한번 로드되면 24시간 동안 재요청하지 않음

**영향:** 사용자가 종목 상세 페이지에서 차트를 본 후, 같은 세션 내에서 24시간 동안은 캐시된 데이터만 표시. 이는 실시간 데이터가 아닌 ISR(15분) 기반이므로 합리적이나 문서에 명시 필요.

**판정: MINOR.**

---

### S2-NEW-4: `use-debounce` 훅 미기술 — INFO

**발견:**
- `src/hooks/use-debounce.ts` 존재
- `SearchCommand`, `StockSearchInput`, `SearchBar`에서 사용
- 양쪽 문서 모두 이 훅 미언급

**판정: INFO.**

---

### S2-NEW-5: Doc A cron 메서드 표기 정확, CLAUDE.md와 불일치 — INFO

**발견:**
- Doc A 4.14절: 모든 cron을 "POST"로 표기
- 실제 코드: 15개 cron 모두 `export async function POST` — Doc A 정확
- CLAUDE.md에는 "cron runs in UTC and triggers your production URL via HTTP GET" — CLAUDE.md가 Vercel 일반론을 서술하나 실제 코드는 POST

**판정: INFO. 문서 자체는 정확. CLAUDE.md의 일반론과 실제 구현의 차이.**

---

### S2-NEW-6: `generateStaticParams` 존재 페이지 정리 미완전 — MINOR

**발견:** `generateStaticParams`이 있는 페이지 5개:
1. `src/app/stock/[ticker]/page.tsx:27` — top 50 (dynamicParams=true)
2. `src/app/etf/[ticker]/page.tsx:26` — top 50 (dynamicParams=true)
3. `src/app/reports/[slug]/page.tsx:31` — 최근 30일 리포트 (dynamicParams 미설정 → 기본 true)
4. `src/app/screener/[signal]/page.tsx:51` — 5개 시그널 (**dynamicParams=false**)
5. `src/app/sectors/[name]/page.tsx:15` — 전체 섹터 (dynamicParams=true)

**Doc A:** "SSG(top 50)", "SSG(5종)", "SSG(최근50)", "SSG" 표기로 존재 언급하나 dynamicParams 값 미기재.
**Doc B:** "SSG 50개", "SSG 5개", "SSG 50개", "SSG" 표기하나 `dynamicParams` 미기재.

**핵심:** `reports/[slug]`에서 `dynamicParams` 미설정(기본 true). Doc A는 "최근50"이라 표기했으나 실제 코드는 `30 * 24 * 60 * 60 * 1000` (30일) 필터링이지 50건 제한이 아닐 수 있음.

확인: `src/app/reports/[slug]/page.tsx:32-34`:
```
where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
select: { slug: true },
take: 50,
```
→ 실제로 30일 내 최신 50건. Doc A/B 모두 "50개"는 정확하나 "30일 이내" 조건은 미언급.

**판정: MINOR.**

---

### S2-NEW-7: Providers 중첩 순서 — Doc B 다이어그램 오해 가능성 — MINOR

**실제 중첩 순서 (`providers.tsx`):**
```
SessionProvider
  └── QueryClientProvider
        └── ThemeProvider
              ├── TooltipProvider
              │     └── CompareProvider
              │           └── {children}
              └── Toaster (richColors)
```

**Doc A 5.1절:** 평면적 나열 `SessionProvider, ThemeProvider, QueryClientProvider, CompareProvider, Toaster` — 순서도 틀림 (ThemeProvider가 QueryClientProvider 안에 있는데 바깥처럼 표기). **TooltipProvider 누락.**

**Doc B 1절:**
```
├── SessionProvider (NextAuth)
├── QueryClientProvider (TanStack Query)
├── ThemeProvider (next-themes: light/dark/system)
├── TooltipProvider
└── CompareProvider (종목 비교 컨텍스트)
```
이는 형제 관계처럼 보이나 실제로는 깊은 중첩.

**판정: MINOR. 두 문서 모두 중첩 순서가 부정확하거나 오해 가능.**

---

### S2-NEW-8: `board-permissions.ts` canEditPost vs canDeletePost 비대칭 미기술 — M-1 확장

위 S2-NEW-1에서 상세 기술. 삭제는 관리자 가능, 수정은 관리자 불가 — 이 비대칭은 두 문서 어디에도 없음.

---

### S2-NEW-9: `notFound()` 호출 패턴 미문서화 — MINOR

**발견:** 6곳에서 `notFound()` 호출:
1. `board/[id]/edit/page.tsx:22` — 미인증 시
2. `board/[id]/edit/page.tsx:27` — canEditPost 실패 시
3. `board/[id]/page.tsx:46` — 게시글 미존재 시
4. `reports/[slug]/page.tsx:98` — 리포트 미존재 시
5. `reports/stock/[ticker]/page.tsx:60` — 종목 미존재 시
6. `screener/[signal]/page.tsx:75` — 유효하지 않은 시그널 시

양쪽 문서에서 `not-found.tsx` 존재는 기재하나, 어떤 조건에서 `notFound()`가 트리거되는지는 미기술.

**판정: MINOR.**

---

## 3. 문서 정합성 최종 검사

### 3.1 페이지 수 정합성

| 항목 | 파일시스템 | Doc A | Doc B | 일치 |
|------|-----------|-------|-------|------|
| page.tsx 총 수 | **39개** | 32+7+2=41 (중복?) | **39개** (명시) | Doc B 정확, Doc A 미명시 |

Doc A 카운트: 공개 30개 + 보호 7개 + 관리자 2개 = 39개. 실제로 일치.

### 3.2 API route.ts 수 정합성

| 항목 | 파일시스템 | Doc A | Doc B |
|------|-----------|-------|-------|
| API route.ts | **59개** | 미카운트 | 미카운트 |
| 전체 route.ts (sitemap 포함) | **63개** | 미카운트 | 미카운트 |

Doc A API 엔드포인트를 행 단위로 세면:
- 인증 2 + 종목 11 + 시장 7 + ETF 1 + 뉴스 2 + 스크리너 2 + 리포트 8 + 섹터 1 + 관심종목/포트폴리오 7 + 게시판 9 + 설정 2 + 문의 1 + 관리자 2 + Cron 15 = **70 행**

그러나 일부 행은 같은 route.ts에서 여러 메서드를 제공 (예: `/api/board` GET+POST = 1 route.ts, 2행). route.ts 기준으로는 59개가 맞음.

Doc B도 유사한 구조.

### 3.3 레이아웃 수 정합성

| 항목 | 파일시스템 | Doc A | Doc B |
|------|-----------|-------|-------|
| layout.tsx | **4개** | 1개만 (루트) | **4개** (정확) |

### 3.4 문서 간 내부 모순

| # | 항목 | Doc A | Doc B | 실제 |
|---|------|-------|-------|------|
| 1 | 차트 기간 | 1M/3M/6M/1Y/3Y | 1W~5Y | 1W/2W/3W/1M/3M/6M/1Y |
| 2 | 관심종목 인증 | 미들웨어 리다이렉트 | 컴포넌트 레벨 체크만 | 이중 보호 |
| 3 | 게시글 수정 권한 | 본인/관리자 | 본인 글 | **본인만** (코드 기준) |
| 4 | MAX_SLOTS | 5종목 (홈 UI) | 4종목 | 4종목 |
| 5 | cron HTTP 메서드 | POST | 미명시 | POST |
| 6 | Provider 순서 | 부정확 (평면 나열, TooltipProvider 누락) | 부정확 (형제 관계처럼 표기) | 깊은 중첩 |
| 7 | reports/[slug] SSG | 최근50 | 50개 | 30일 내 최신 50건 |
| 8 | 검증관1 route.ts 수 | - | - | 62 (오류) → 실제 63 |

### 3.5 양 문서 간 미식별 모순 (신규)

**#3이 가장 중요:** Doc A는 "글 수정: 본인/관리자"로 서술하고, Doc B는 "본인 글" 수정만 명시. 실제 코드(`canEditPost`)는 관리자 미포함이므로 **Doc B가 정확**하고 **Doc A가 오류**다. 이 모순은 9명의 에이전트와 검증관 1 모두 놓쳤다.

---

## 4. 최종 이슈 목록

### CRITICAL (2건) — 변동 없음

| # | 이슈 | 상태 | 소스코드 |
|---|------|------|---------|
| C-1 | 차트 기간 옵션 오류 (양쪽 문서) | CONFIRMED | `types/stock.ts:66`, `chart-controls.tsx:7-14` |
| C-2 | 관심종목 인증 서술 모순 (Doc B) | CONFIRMED | `proxy.ts:8`, `watchlist/page.tsx:24,63` |

### MAJOR (6건) — 1건 추가

| # | 이슈 | 상태 | 소스코드 |
|---|------|------|---------|
| M-1 | MAX_SLOTS 5→4 코드 버그 | CONFIRMED | `page.tsx:208`, `compare/page.tsx:90`, `compare-context.tsx:21` |
| M-2 | /portfolio 404 (3중 문제) | CONFIRMED | `app-header.tsx:56,103`, `proxy.ts:41` |
| M-3 | loading/error 바운더리 누락 (Doc A) | CONFIRMED | loading 7 + error 4 |
| M-4 | Desktop/Mobile 네비 차이 미상세 | CONFIRMED | `app-header.tsx:24-108`, `bottom-tab-bar.tsx:10-16` |
| M-5 | API 스키마 부재 | CONFIRMED | `lib/validations/` |
| **M-6** | **canEditPost 관리자 권한 누락 (코드 버그 또는 Doc A 오류)** | **NEW** | **`board-permissions.ts:16-18`** |

### MINOR (기존 9건 + 기존 NEW 8건 + 신규 7건 = 24건)

#### 기존 MINOR (9건)

| # | 이슈 | 상태 |
|---|------|------|
| m-1 | Doc B Toaster 레이아웃 위치 미명시 | CONFIRMED |
| m-2 | Doc B "분석 요청" URL 미기재 | CONFIRMED |
| m-3 | Doc B "더보기" prefixes/subLinks 혼동 | CONFIRMED |
| m-4 | Doc A 공통 컴포넌트 섹션 미비 | CONFIRMED |
| m-5 | Doc A 홈페이지 환율 독립 섹션 누락 | 부분 CONFIRMED |
| m-6 | opengraph-image.tsx 2개 미기재 | CONFIRMED |
| m-7 | Doc B sitemap.ts (기본) 미기재 | CONFIRMED |
| m-8 | Doc A Mermaid API 경로 형식 불일치 | CONFIRMED |
| m-9 | /reports/request 인증 방식 구분 필요 | CONFIRMED |

#### 검증관 1 발견 (8건)

| # | 이슈 | 상태 |
|---|------|------|
| NEW-1 | OnboardingSheet 데드 코드 | CONFIRMED |
| NEW-2 | 홈 비로그인 CTA 배너 상세 미기술 | CONFIRMED |
| NEW-3 | HeroSection 내부 동작 미기술 | CONFIRMED |
| NEW-4 | BottomTabBar 검색 오버레이 동작 미기술 | CONFIRMED |
| NEW-5 | "더보기" subLinks/prefixes 비대칭 | CONFIRMED |
| NEW-6 | screener/[signal] dynamicParams=false | CONFIRMED |
| NEW-7 | 공개/보호 리포트 접근 권한 대비 미흡 | CONFIRMED |
| NEW-8 | QueryClient 전역 설정 미기술 | CONFIRMED (MINOR 격상) |

#### 본 검증관 신규 발견 (7건)

| # | 이슈 | 심각도 |
|---|------|--------|
| S2-NEW-1 | canEditPost 관리자 미포함 (코드 버그/문서 오류) | **MAJOR** (위 M-6으로 격상) |
| S2-NEW-2 | 차트 고급 기능 (HA, 9개 보조지표, 6개 오버레이) 미기술 | MINOR |
| S2-NEW-3 | use-chart-data staleTime 24시간 미기술 | MINOR |
| S2-NEW-4 | use-debounce 훅 미기술 | INFO |
| S2-NEW-6 | generateStaticParams 조건 상세 미기술 | MINOR |
| S2-NEW-7 | Providers 중첩 순서 양 문서 모두 부정확 | MINOR |
| S2-NEW-9 | notFound() 트리거 조건 미문서화 | MINOR |

---

## 5. 판정

### 수치 요약

| 항목 | 수치 |
|------|------|
| CRITICAL | 2건 (전건 CONFIRMED) |
| MAJOR | **6건** (기존 5건 + 신규 1건) |
| MINOR (기존) | 9건 (8건 CONFIRMED + 1건 부분 CONFIRMED) |
| MINOR (검증관 1 발견) | 8건 (전건 CONFIRMED) |
| MINOR (본 검증관 신규) | 5건 |
| INFO | 2건 |
| **총 이슈** | **32건** |

### 검증관 1 대비 변경사항

1. **MAJOR 1건 추가 (M-6):** `canEditPost` 관리자 권한 누락 — 9명+검증관1 전원 미발견
2. **MINOR 5건 추가:** 차트 고급 기능, staleTime 24시간, Providers 중첩 순서, generateStaticParams 조건, notFound() 트리거
3. **INFO 2건 추가:** use-debounce 훅, cron POST vs CLAUDE.md GET
4. **route.ts 수 정정:** 62 → 63
5. **기존 24건 전건 CONFIRMED** (부정, 수정 없음)

### Go/No-Go 판정: **조건부 GO**

검증관 1과 동일하게 **v1.0 통합 문서 작성 진행 가능**하나, 추가 조건:

1. **M-6 (canEditPost) 확인 필수:** 코드 버그인지 의도적 설계인지 개발팀 확인 → 문서에 정확히 반영
2. **차트 기능 섹션 신설:** 9개 보조지표 + HA + 오버레이 6종은 FE 참조 시 핵심 정보
3. **Providers 중첩 순서 정확한 트리 다이어그램으로 교체**
4. 검증관 1의 체크리스트 전체 + 본 보고서의 추가 사항 반영

### 문서 품질 기준 (수정)

v1.0 문서 완성 후:
- [ ] 모든 page.tsx (**39개**)가 인벤토리에 포함
- [ ] 모든 route.ts (**63개**, API 59 + sitemap 4)가 인벤토리에 포함
- [ ] 차트 기간 옵션이 `1W|2W|3W|1M|3M|6M|1Y`로 정확히 기재
- [ ] 차트 고급 기능 (HA, MA, BB, KC, Fib, Patterns, Pivot, SAR + 9개 하단 패널) 기재
- [ ] 인증 방식이 미들웨어/컴포넌트/관리자의 3종으로 명확히 구분
- [ ] 게시글 수정 권한이 "본인만" 또는 관리자 포함 여부 확정 후 정확히 기재
- [ ] Desktop/Mobile/BottomTabBar 네비게이션 3종이 비교 표로 정리
- [ ] `/portfolio` 경로의 현재 상태(404)가 명시
- [ ] Providers 중첩 순서가 정확한 트리 구조로 기재
