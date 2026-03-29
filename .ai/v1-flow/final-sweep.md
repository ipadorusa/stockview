# 독립 최종 검증 보고서 (Final Sweep)

> 검증일: 2026-03-28
> 역할: 독립 최종 검증관 — 8명의 에이전트가 수행한 작업의 최종 소스코드 대조 검증
> 방법: 확정 이슈 16건 전수 소스코드 대조 + 블라인드 스팟 독립 스위핑

---

## 1. 이슈 검증 결과

### CRITICAL 이슈 (기존 2건 → 확정 2건)

#### C-1: 차트 기간 옵션 오류 — CONFIRMED

**소스코드 근거:**
- `src/types/stock.ts:66` — `ChartPeriod = "1W" | "2W" | "3W" | "1M" | "3M" | "6M" | "1Y"` (정확히 7개)
- `src/components/stock/chart-controls.tsx:7-15` — `PERIOD_LABELS` 맵이 동일한 7개 키를 사용

**문서 오류:**
- Doc A: "1M/3M/6M/1Y/3Y" — `1W`, `2W`, `3W` 누락, 존재하지 않는 `3Y` 포함
- Doc B: "1W~5Y" — 존재하지 않는 `5Y` 포함, 구간 표현이 모호

**판정: CRITICAL 확정.** FE 구현 시 참조하면 잘못된 UI를 만들게 된다.

---

#### C-2: 관심종목 인증 서술 모순 — CONFIRMED (단, 실태는 "이중 보호"로 양쪽 다 부분적 사실)

**소스코드 근거:**
- `src/proxy.ts:8` — `pathname.startsWith("/watchlist")` → **미들웨어 보호 대상** (1차)
- `src/app/watchlist/page.tsx:24` — `const { data: session, status } = useSession()` (2차)
- `src/app/watchlist/page.tsx:63-73` — `if (status === "unauthenticated")` → 로그인 버튼 UI 표시

**실제 인증 흐름:**
1. 미인증 사용자가 `/watchlist` 접근 → `proxy.ts`가 `/auth/login?callbackUrl=/watchlist`로 리다이렉트 (1차)
2. 어떤 이유로 미들웨어를 통과해도, 컴포넌트 레벨에서 `useSession()`으로 2차 체크

**Doc B의 모순:**
- 인벤토리 표에서는 "보호"라고 표기 (맞음)
- 사용자 여정 섹션에서는 "컴포넌트 레벨 체크"만 언급 (불완전)

**판정: CRITICAL 확정.** 미들웨어 1차 방어 + 컴포넌트 2차 체크의 이중 구조를 정확히 서술해야 한다.

---

### MAJOR 이슈 (기존 5건 → 확정 5건)

#### M-1: MAX_SLOTS 5→4 코드 버그 — CONFIRMED

**소스코드 근거:**
- `src/app/page.tsx:208` — `description="최대 5종목 비교 분석"` (UI 텍스트)
- `src/app/compare/page.tsx:90` — `const MAX_SLOTS = 4` (실제 제한)

**판정: MAJOR 확정.** 이것은 문서 문제가 아니라 **코드베이스 자체의 버그**다. UI 텍스트("최대 5종목")와 실제 로직(`MAX_SLOTS=4`)이 불일치한다.

---

#### M-2: /portfolio 404 — CONFIRMED

**소스코드 근거:**
- `src/app/portfolio/` — **디렉토리 미존재** (page.tsx 없음)
- `src/components/layout/app-header.tsx:56` — `{ href: "/portfolio", label: "포트폴리오" }` (navGroups)
- `src/components/layout/app-header.tsx:103` — `{ href: "/portfolio", label: "포트폴리오" }` (navCategories subLinks)
- `src/proxy.ts:41` — matcher에 `/portfolio/:path*` 포함
- `src/proxy.ts:8-15` — `isProtectedRoute`에 `/portfolio` **미포함** (비대칭)

**실제 포트폴리오 기능 위치:**
- `src/app/watchlist/page.tsx:93-206` — `/watchlist` 페이지 내 Tabs 컴포넌트의 "포트폴리오" 탭
- `src/components/portfolio/` — `add-portfolio-dialog.tsx`, `portfolio-row.tsx`, `portfolio-summary.tsx` 존재

**판정: MAJOR 확정.** 3중 문제: (1) 네비게이션 링크 → 404, (2) matcher에는 있으나 isProtectedRoute에는 없는 비대칭, (3) 실제 기능은 `/watchlist` 탭인데 별도 경로처럼 노출.

---

#### M-3: loading/error 바운더리 누락 (Doc A) — CONFIRMED

**소스코드 근거 (Glob 전수 확인):**

loading.tsx 7개:
1. `src/app/market/loading.tsx`
2. `src/app/news/loading.tsx`
3. `src/app/stock/[ticker]/loading.tsx`
4. `src/app/watchlist/loading.tsx`
5. `src/app/screener/loading.tsx`
6. `src/app/etf/loading.tsx`
7. `src/app/etf/[ticker]/loading.tsx`

error.tsx 4개:
1. `src/app/error.tsx` (루트 — Doc A에 기재됨)
2. `src/app/market/error.tsx`
3. `src/app/news/error.tsx`
4. `src/app/stock/[ticker]/error.tsx`

**판정: MAJOR 확정.** Doc A의 시스템 파일 섹션에 루트 `error.tsx`만 기재, 나머지 loading 7개 + error 3개 = 10개 파일 누락. Doc B의 인벤토리에는 포함되어 있으므로 통합 시 Doc B 기준 사용으로 해소 가능.

---

#### M-4: Desktop/Mobile 네비게이션 구조 차이 미상세 — CONFIRMED

**소스코드 근거:**

**Desktop (`navCategories` in `app-header.tsx:63-108`):**
- 투자 정보: 시장, ETF, 섹터, 배당, 실적
- 분석: 스크리너, AI 리포트, 분석 요청, 비교, 가이드
- 뉴스: 뉴스, 게시판
- 더보기: 관심종목, 포트폴리오, 마이페이지, 소개

**Mobile Sheet (`navGroups` in `app-header.tsx:24-61`):**
- 투자 정보: 시장 개요, ETF, 섹터별 종목, 배당 캘린더, 실적 캘린더
- 분석 도구: 스크리너, AI 리포트, 리포트 요청, 종목 비교, 투자 가이드
- 뉴스·커뮤니티: 뉴스, 게시판
- MY: 관심종목, 포트폴리오, 마이페이지, 설정

**Mobile BottomTabBar (`bottom-tab-bar.tsx:10-16`):**
- 홈, 검색(오버레이), 시장, 관심, MY

**차이점:**
1. Desktop "더보기"에 **설정이 없음** → Mobile navGroups에는 있음
2. Desktop subLinks에 **소개(`/about`)** 포함 → Mobile navGroups에는 없음
3. BottomTabBar는 5개 탭만으로 완전히 다른 구조
4. Desktop navCategories의 라벨과 Mobile navGroups의 라벨이 미세하게 다름 (예: "분석" vs "분석 도구")

**판정: MAJOR 확정.** 양쪽 문서 모두 이 차이를 체계적으로 비교하지 않았다.

---

#### M-5: API Request/Response 스키마 부재 — CONFIRMED

**판정: MAJOR 확정 (단, 문서 범위 경계).** 양쪽 문서 모두 API 엔드포인트 목록은 있으나 Request/Response 타입 정의가 없다. `src/lib/validations/` 디렉토리에 Zod 스키마(`board.ts`, `report-request.ts`)가 존재하나 문서에 반영되지 않음. OpenAPI 별도 문서로 분리하는 것이 적절.

---

### MINOR 이슈 (기존 9건 → 확정 9건)

#### m-1: Doc B Toaster 레이아웃 다이어그램 누락 — CONFIRMED

**근거:** `src/components/providers.tsx:33` — `<Toaster richColors />`는 `ThemeProvider` 내부, `CompareProvider` 외부에 위치. Doc B의 레이아웃 다이어그램(섹션 1)에서 Toaster 위치가 명시되지 않음. Doc B 섹션 6에서 `Toaster (sonner)` 전역 컴포넌트로 언급만 됨.

#### m-2: Doc B "분석 요청" URL 미기재 — CONFIRMED

**근거:** Desktop navCategories subLinks에 `{ href: "/reports?tab=requests", label: "분석 요청" }`이 있으나, Doc B의 더보기/분석 섹션에서 이 URL 패턴(`?tab=requests`)을 명시적으로 기재하지 않음. `reports-page-tabs.tsx`에서 `searchParams.get("tab") === "requests"` 로직으로 탭 전환.

#### m-3: Doc B "더보기" prefixes와 subLinks 혼동 — CONFIRMED

**근거:** `app-header.tsx:98-107` — navCategories "더보기"의:
- `prefixes`: `/watchlist`, `/portfolio`, `/mypage`, `/settings`, `/about`, `/contact` (6개)
- `subLinks`: 관심종목, 포트폴리오, 마이페이지, 소개 (4개 — **설정, 문의 누락**)

Doc B 섹션 2의 표에서 "더보기"의 prefixes와 subLinks를 혼동/불완전하게 기재.

#### m-4: Doc A 공통 컴포넌트 섹션 미비 — CONFIRMED

**근거:** `PageContainer`, `GtmPageView`, `JsonLd`, `Breadcrumb`, `AdSlot`, `AdDisclaimer`, `EmptyState`, `StockRow` 등 거의 모든 페이지에서 사용되는 공통 컴포넌트가 Doc A에 별도 섹션으로 정리되지 않음. Doc B 섹션 6에는 컴포넌트 맵으로 정리되어 있음.

#### m-5: Doc A 홈페이지 환율 섹션 미기재 — DENIED (조건부)

**근거:** Doc A 섹션 2.1 (홈페이지)을 재확인한 결과:
- `src/app/page.tsx:156-201` — 환율 섹션이 `<section className="mb-8">`으로 존재
- Doc A에서 `CompactIndexBar` 컴포넌트를 언급하는데, 이 컴포넌트가 `exchangeRates`를 props로 받음 (line 158)
- 그러나 별도 `<section>` 블록으로 된 환율 카드 그리드(line 175-201)는 Doc A에서 명시적으로 언급되지 않음

**판정: 부분 CONFIRMED.** `CompactIndexBar` 내 환율 표시는 간접 언급되지만, 독립 환율 섹션(환율 카드 그리드)은 누락.

#### m-6: opengraph-image.tsx 미기재 — CONFIRMED (2개)

**근거:**
- `src/app/stock/[ticker]/opengraph-image.tsx` — 존재
- `src/app/etf/[ticker]/opengraph-image.tsx` — 존재

양쪽 문서 모두 이 파일들을 기재하지 않음. 이전 검증1은 stock만 언급하고 etf를 놓침.

#### m-7: Doc B sitemap.ts (기본) 미기재 — CONFIRMED

**근거:** `src/app/sitemap.ts` — Next.js 메타데이터 규약에 의한 기본 사이트맵 파일이 존재 (revalidate 3600, 정적 경로 + 동적 종목 경로 포함). Doc B는 `sitemap-index.xml`, `sitemap-stocks.xml`, `sitemap-etf.xml`, `sitemap-reports.xml` (4개 route.ts)만 기재하고 기본 `sitemap.ts`를 누락. Doc A는 시스템 파일 섹션에 기재함.

#### m-8: Doc A Mermaid 다이어그램 API 경로 형식 불일치 — CONFIRMED

**근거:** Doc A의 Mermaid 다이어그램에서 API 경로를 `ticker`, `[ticker]`, `{ticker}` 등 혼재하여 사용. 일관된 형식(`[ticker]` — Next.js 동적 세그먼트 표기)으로 통일 필요.

#### m-9: /reports/request 인증 방식 명확화 — CONFIRMED

**근거:** `src/proxy.ts:8-15` — `/reports/request`는 `isProtectedRoute`에 포함되지 않음 (미들웨어 보호 아님). `src/app/reports/request/page.tsx:87` — 컴포넌트 레벨에서 `useSession()` 체크 후 미인증 시 로그인 버튼 UI 표시. 이것은 `/watchlist`(미들웨어 보호)와 다른 패턴이므로 문서에서 명확히 구분해야 한다.

---

## 2. 블라인드 스팟 발견

8명의 에이전트가 모두 놓친 (또는 불충분하게 다룬) 사항:

### NEW-1: OnboardingSheet 컴포넌트 — 미사용 코드 (MINOR)

**발견:** `src/components/onboarding/onboarding-sheet.tsx` 파일이 존재하나, `src/app/` 어디에서도 import되지 않는다. 시장/섹터/종목 선택 3단계 온보딩 UI가 구현되어 있으나 실제 연결되지 않은 데드 코드.

**영향:** 양쪽 문서 모두 미언급. v1.0 문서에서 "미구현 기능" 또는 "계획된 기능"으로 별도 기재하거나, 코드 정리 대상으로 명시할 필요가 있다.

### NEW-2: 홈페이지 비로그인 조건부 UI — 부분 누락 (MINOR)

**발견:** `src/app/page.tsx:137-152` — `{!session && (...)}`로 비로그인 사용자에게만 "투자 가이드 보기" + "무료 회원가입" CTA 배너가 표시된다. Doc A에서 "비로그인 시 가이드/회원가입 배너 표시"로 언급하고, Doc B에서 "비로그인 시 초보자 가이드 배너 노출"로 언급하나, 어느 쪽도 정확한 UI 구성(두 개의 CTA 링크: `/guide`, `/auth/register`)을 상세히 기술하지 않음.

**영향:** 경미. 그러나 홈페이지 비로그인 UX 흐름의 핵심 분기이므로 문서에 명시 권장.

### NEW-3: HeroSection 컴포넌트 — 상세 미기술 (MINOR)

**발견:** `src/components/home/hero-section.tsx` — 로그인 상태에 따라 다른 동작을 하는 클라이언트 컴포넌트. 스크리너/AI 리포트/배당 캘린더 3개 기능 카드 + 닫기 기능 + localStorage 기반 상태 유지. 양쪽 문서에서 이름만 언급되고 내부 동작이 기술되지 않음.

### NEW-4: BottomTabBar "검색" 탭의 오버레이 동작 — 미기술 (MINOR)

**발견:** `src/components/layout/bottom-tab-bar.tsx:12` — `{ href: "#search", label: "검색", icon: Search, isOverlay: true }`. 모바일 하단 탭의 "검색"은 페이지 이동이 아니라 `SearchCommand` 오버레이를 여는 특수 동작이다. 양쪽 문서 모두 BottomTabBar의 탭 목록은 있으나, 검색 탭의 오버레이 동작을 명시적으로 설명하지 않음.

### NEW-5: navCategories "더보기" subLinks와 prefixes 비대칭 — 기존 m-3 확장

**발견:** `app-header.tsx:98-107`에서 "더보기"의 prefixes에 `/settings`와 `/contact`가 포함되지만 subLinks에는 없다. 이는 URL이 `/settings`나 `/contact`일 때 "더보기" 카테고리가 활성화되지만, 해당 카테고리의 드롭다운에서는 이 링크로 이동할 방법이 없다는 의미. UX 비일관성.

### NEW-6: `dynamicParams = false` on screener/[signal] — 미기술 (MINOR)

**발견:** `src/app/screener/[signal]/page.tsx:69` — `export const dynamicParams = false`. 이는 `generateStaticParams()`에서 반환하지 않는 시그널 경로에 접근하면 404가 반환된다는 의미. 양쪽 문서에서 screener의 시그널별 페이지가 SSG임은 언급하나, `dynamicParams = false`로 허용 경로가 제한된다는 사실은 명시하지 않음.

### NEW-7: /reports/stock/[ticker]가 미들웨어 보호 대상 — 미강조 (MINOR)

**발견:** `src/proxy.ts:13` — `pathname.startsWith("/reports/stock")`. 이 경로는 인증이 필요한 보호 라우트다. Doc A에서 "미인증 시 리다이렉트"로 언급하고, Doc B에서도 "보호"로 표기하여 양쪽 모두 인지하고 있으나, 이것이 공개 리포트(`/reports`, `/reports/[slug]`)와 보호 리포트(`/reports/stock/[ticker]`)의 접근 권한 차이라는 점이 명확히 대비되지 않음.

### NEW-8: Providers 내 QueryClient 기본 설정 — 미기술 (INFO)

**발견:** `src/components/providers.tsx:14-21` — QueryClient 기본 설정: `staleTime: 5분`, `gcTime: 30분`, `retry: 1`. 이는 모든 React Query 훅의 기본 동작에 영향을 미치는 전역 설정이나, 양쪽 문서에서 상세히 기술하지 않음.

---

## 3. 최종 확정 이슈 목록

### CRITICAL (2건) — 변동 없음

| # | 이슈 | 상태 | 소스코드 위치 |
|---|------|------|-------------|
| C-1 | 차트 기간 옵션 오류 (양쪽 문서) | CONFIRMED | `types/stock.ts:66`, `chart-controls.tsx:7-15` |
| C-2 | 관심종목 인증 서술 모순 (Doc B) | CONFIRMED | `proxy.ts:8`, `watchlist/page.tsx:24,63` |

### MAJOR (5건) — 변동 없음

| # | 이슈 | 상태 | 소스코드 위치 |
|---|------|------|-------------|
| M-1 | MAX_SLOTS 5→4 코드 버그 | CONFIRMED | `page.tsx:208`, `compare/page.tsx:90` |
| M-2 | /portfolio 404 (3중 문제) | CONFIRMED | nav `app-header.tsx:56,103`, matcher `proxy.ts:41`, 디렉토리 미존재 |
| M-3 | loading/error 바운더리 누락 (Doc A) | CONFIRMED | loading 7개 + error 4개 (루트 포함) |
| M-4 | Desktop/Mobile 네비게이션 차이 미상세 | CONFIRMED | `app-header.tsx:24-108`, `bottom-tab-bar.tsx:10-16` |
| M-5 | API 스키마 부재 | CONFIRMED | `lib/validations/` Zod 스키마 존재하나 문서 미반영 |

### MINOR (9건 기존 + 8건 신규 = 17건)

#### 기존 MINOR (9건)

| # | 이슈 | 상태 |
|---|------|------|
| m-1 | Doc B Toaster 레이아웃 위치 미명시 | CONFIRMED |
| m-2 | Doc B "분석 요청" URL (`?tab=requests`) 미기재 | CONFIRMED |
| m-3 | Doc B "더보기" prefixes/subLinks 혼동 | CONFIRMED |
| m-4 | Doc A 공통 컴포넌트 섹션 미비 | CONFIRMED |
| m-5 | Doc A 홈페이지 환율 독립 섹션 누락 | 부분 CONFIRMED |
| m-6 | opengraph-image.tsx 2개 미기재 | CONFIRMED |
| m-7 | Doc B sitemap.ts (기본) 미기재 | CONFIRMED |
| m-8 | Doc A Mermaid API 경로 형식 불일치 | CONFIRMED |
| m-9 | /reports/request 인증 방식 구분 필요 | CONFIRMED |

#### 신규 발견 (8건)

| # | 이슈 | 심각도 |
|---|------|--------|
| NEW-1 | OnboardingSheet 데드 코드 미기재 | MINOR |
| NEW-2 | 홈페이지 비로그인 CTA 배너 상세 미기술 | MINOR |
| NEW-3 | HeroSection 내부 동작 미기술 | MINOR |
| NEW-4 | BottomTabBar 검색 오버레이 동작 미기술 | MINOR |
| NEW-5 | navCategories "더보기" subLinks/prefixes 비대칭 (UX 버그) | MINOR |
| NEW-6 | screener/[signal] `dynamicParams=false` 미기술 | MINOR |
| NEW-7 | 공개 리포트 vs 보호 리포트 접근 권한 대비 미흡 | MINOR |
| NEW-8 | QueryClient 전역 기본 설정 미기술 | INFO |

---

## 4. v1.0 통합 문서 작성 가이드

### 4.1 기본 전략

**Doc B를 뼈대로 사용하고, Doc A의 고유 콘텐츠를 병합한다.** (기존 합의 유지)

### 4.2 최종 목차 구조

```
1. 글로벌 레이아웃 구조
   1.1 Root Layout (Provider 중첩 순서 + Toaster 위치)
   1.2 중간 Layout (compare, news, settings)
   1.3 시스템 파일 (loading 7개, error 4개, not-found 1개, opengraph-image 2개)

2. 네비게이션 구조
   2.1 Desktop 상단 네비 (navCategories 4개 + subLinks)
   2.2 Mobile 사이드시트 (navGroups 4개)
   2.3 Mobile 하단 탭바 (BottomTabBar 5개 탭, 검색 오버레이 동작 포함)
   2.4 Desktop vs Mobile 차이 비교 표

3. 사용자 진입점 & 조건부 UI
   3.1 비로그인 사용자 흐름 (가이드 배너, HeroSection)
   3.2 로그인 사용자 흐름

4. 사용자 여정별 Flow
   4.1 종목 탐색 여정
   4.2 관심종목/포트폴리오 관리 여정
   4.3 AI 리포트 여정
   4.4 뉴스/커뮤니티 여정
   4.5 설정/마이페이지 여정

5. 페이지 전체 인벤토리
   5.1 공개 페이지 (렌더링/ISR/revalidate 포함)
   5.2 보호 페이지 (인증 방식 명확 구분: 미들웨어 vs 컴포넌트)
   5.3 관리자 페이지

6. 페이지별 상세 Flow (Doc A 고유)
   6.1 홈 (환율 독립 섹션 + CompactIndexBar 구분)
   6.2 종목 상세 (차트 기간: 1W|2W|3W|1M|3M|6M|1Y 정확 명시)
   6.3 관심종목 (탭 구조: 관심종목 + 포트폴리오)
   6.4 기타 주요 페이지

7. 인증/권한 Flow
   7.1 미들웨어 보호 라우트 (proxy.ts matcher + isProtectedRoute)
   7.2 컴포넌트 레벨 인증 체크 (/reports/request 등)
   7.3 관리자 라우트 (ADMIN 역할 검증)
   7.4 /portfolio matcher vs isProtectedRoute 비대칭 명시

8. API 전체 인벤토리
   8.1 공개 API (HTTP 메서드 + ISR/캐싱)
   8.2 인증 필요 API
   8.3 관리자 API
   8.4 Cron API (maxDuration 포함)

9. 컴포넌트 의존성 맵
   9.1 페이지별 컴포넌트 목록 (Doc B 기준)
   9.2 공통 컴포넌트 (PageContainer, GtmPageView, Breadcrumb, JsonLd, AdSlot 등)

10. 상태 관리 & 데이터 Fetching
    10.1 React Query 키 목록 + staleTime
    10.2 QueryClient 전역 기본 설정
    10.3 URL 상태 (searchParams 활용 패턴)
    10.4 Context (CompareProvider)

11. 데이터 파이프라인 (Doc A 고유)
    11.1 Cron 수집 흐름
    11.2 데이터 소스별 특성

12. SEO & 사이트맵
    12.1 sitemap.ts (기본) + 4개 XML route 사이트맵
    12.2 opengraph-image (stock, etf)
    12.3 JsonLd 스키마

부록 A: 코드베이스 알려진 이슈
부록 B: 미사용 코드/계획된 기능
```

### 4.3 섹션별 소스 지정

| 섹션 | 주 소스 | 보조 소스 | 수정 사항 |
|------|--------|----------|----------|
| 1. 글로벌 레이아웃 | Doc B §1 | Doc A §1.4 | Toaster 위치 다이어그램 추가, opengraph-image 2개 추가 |
| 2. 네비게이션 | **신규 작성** | Doc A §5, Doc B §2 | Desktop/Mobile/BottomTabBar 3종 비교 표 작성 |
| 3. 조건부 UI | **신규 작성** | Doc A §2.1, Doc B §3 | HeroSection, 비로그인 CTA 배너 상세 |
| 4. 사용자 여정 | Doc B §3 | Doc A FROM/TO | C-2 수정: 관심종목 이중 인증 |
| 5. 페이지 인벤토리 | Doc B §4 | Doc A §1 | m-7: sitemap.ts 추가 |
| 6. 페이지별 상세 | **Doc A §2** (고유) | — | C-1: 차트 기간 7개, m-5: 환율 독립 섹션 |
| 7. 인증/권한 | Doc A §3 + Doc B §8 병합 | — | M-2: /portfolio 비대칭, m-9: 보호 vs 컴포넌트 구분 |
| 8. API 인벤토리 | Doc B §5 | Doc A §4 | Cron maxDuration Doc B 값 사용 |
| 9. 컴포넌트 맵 | Doc B §6 | Doc A 인라인 목록 | m-4: 공통 컴포넌트 보강 |
| 10. 상태 관리 | Doc B §7 | — | NEW-8: QueryClient 기본 설정 추가 |
| 11. 데이터 파이프라인 | **Doc A §6** (고유) | — | — |
| 12. SEO | Doc B §9 일부 | Doc A §1.4 | m-7: sitemap.ts, m-6: opengraph 2개 |
| 부록 A | **신규 작성** | — | M-1, M-2, NEW-5 |
| 부록 B | **신규 작성** | — | NEW-1 (OnboardingSheet) |

### 4.4 필수 수정 체크리스트

통합 문서 작성 시 반드시 반영할 사항:

**CRITICAL 수정:**
- [ ] C-1: 차트 기간 → `1W | 2W | 3W | 1M | 3M | 6M | 1Y` (7개). Doc A "3Y", Doc B "5Y" 모두 삭제
- [ ] C-2: 관심종목 인증 → "미들웨어 1차 리다이렉트 (`proxy.ts`) + `useSession()` 2차 컴포넌트 체크의 이중 구조"

**MAJOR 수정:**
- [ ] M-1: "최대 5종목" → 부록 A에 "코드 버그: `page.tsx:208` 텍스트('5종목')와 `compare/page.tsx:90` 로직(`MAX_SLOTS=4`) 불일치"로 기재
- [ ] M-2: /portfolio 현황 → "네비게이션/matcher에 존재하나 `page.tsx` 미구현. `isProtectedRoute`에도 누락 (비대칭). 실제 포트폴리오 기능은 `/watchlist` 페이지 내 탭"
- [ ] M-3: loading 7개 + error 4개 (루트 포함) 전수 기재
- [ ] M-4: Desktop navCategories / Mobile navGroups / BottomTabBar 3종 비교 표 작성
- [ ] M-5: API 스키마는 v1.0 문서 범위 외로 명시, 향후 OpenAPI 문서 별도 작성 권고

**MINOR 수정:**
- [ ] m-1: Toaster → ThemeProvider 내부, CompareProvider 외부에 위치 명시
- [ ] m-2: 분석 요청 URL → `/reports?tab=requests` 명시
- [ ] m-3: 더보기 prefixes(6개) vs subLinks(4개) 정확히 대비
- [ ] m-4: 공통 컴포넌트 별도 섹션 (Doc B §6 기준 보강)
- [ ] m-5: 홈페이지에 `CompactIndexBar`와 별도 환율 카드 그리드 섹션이 존재함을 구분
- [ ] m-6: opengraph-image → `stock/[ticker]` + `etf/[ticker]` 2개 기재
- [ ] m-7: `sitemap.ts` (기본) 추가 기재 (기존 4개 XML route와 별도)
- [ ] m-8: Mermaid 다이어그램 API 경로 → `[ticker]` 형식으로 통일
- [ ] m-9: 보호 라우트(미들웨어) vs 컴포넌트 레벨 인증 명확 구분 표 작성

**신규 콘텐츠:**
- [ ] NEW-1: 부록 B에 OnboardingSheet 데드 코드 기재
- [ ] NEW-4: BottomTabBar 검색 탭의 오버레이 동작 명시
- [ ] NEW-5: 부록 A에 navCategories 더보기 subLinks/prefixes 비대칭 기재
- [ ] NEW-6: screener/[signal]의 `dynamicParams=false` 명시 (허용되지 않는 시그널은 404)
- [ ] NEW-8: QueryClient 기본 설정 (staleTime 5분, gcTime 30분, retry 1) 기재

### 4.5 충돌 해소 원칙

1. **소스코드가 정답**: 문서 간 불일치 시 반드시 소스코드 대조 후 정확한 쪽 채택
2. **더 상세한 쪽 채택**: 양쪽 모두 정확하나 상세도가 다를 경우 더 상세한 버전 사용
3. **양쪽 모두 오류 시**: 소스코드 기반으로 새로 작성 (예: C-1 차트 기간)

---

## 5. 최종 판정

### 수치 요약

| 항목 | 수치 |
|------|------|
| CRITICAL | 2건 (전건 CONFIRMED) |
| MAJOR | 5건 (전건 CONFIRMED) |
| MINOR (기존) | 9건 (8건 CONFIRMED + 1건 부분 CONFIRMED) |
| MINOR (신규 발견) | 8건 |
| 총 이슈 | 24건 |

### Go/No-Go 판정: **조건부 GO**

**v1.0 통합 문서 작성을 진행해도 된다.** 다만 다음 조건을 충족해야 한다:

1. **CRITICAL 2건 반드시 수정 반영** — 차트 기간 옵션, 관심종목 인증 서술
2. **MAJOR 5건 반영** — 특히 M-2(/portfolio 404)와 M-4(네비 차이)는 문서 구조에 영향
3. **위 4.3 섹션별 소스 지정을 준수** — "신규 작성" 표시된 섹션은 기존 문서 복붙이 아니라 소스코드 기반으로 새로 작성
4. **부록 A/B 필수 포함** — 코드베이스 알려진 이슈와 미사용 코드를 공식 기록

### 문서 품질 기준

v1.0 문서 완성 후 다음을 만족해야 한다:
- [ ] 모든 page.tsx (39개)가 인벤토리에 포함
- [ ] 모든 route.ts (62개)가 API 인벤토리에 포함
- [ ] 차트 기간 옵션이 `1W|2W|3W|1M|3M|6M|1Y`로 정확히 기재
- [ ] 인증 방식이 미들웨어/컴포넌트/관리자의 3종으로 명확히 구분
- [ ] Desktop/Mobile/BottomTabBar 네비게이션 3종이 비교 표로 정리
- [ ] `/portfolio` 경로의 현재 상태(404)가 명시
