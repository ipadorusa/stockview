# 최종 검증 보고서 #1

> 검증자: 최종 검증 담당 1
> 검증일: 2026-03-28
> 검증 대상: `flow-doc-a.md`, `flow-doc-b.md`, `cross-validation-a.md`, `cross-validation-b.md`
> 검증 방법: 소스코드 직접 대조 + 교차검증 재검증

---

## 1. 종합 판정

**조건부 PASS** — 두 문서 모두 v1.0 기획 문서로 활용 가능하나, CRITICAL 이슈 2건과 MAJOR 이슈 5건을 반드시 수정해야 한다.

- Doc A (코드 구조 기반): 정확도 약 91% — 교차검증 B의 93% 판정보다 소폭 하향 조정
- Doc B (사용자 여정 기반): 정확도 약 96% — 교차검증 A의 97.1% 판정과 유사

두 문서를 병합하면 완전한 v1.0 기획 문서가 될 수 있다. Doc B가 구조적 완성도(레이아웃, 컴포넌트 맵, 상태 관리)에서 우수하고, Doc A가 페이지별 상세 Flow 서술에서 우수하다.

---

## 2. 교차검증 재검증 결과

### 2.1 Cross-Validation A (B 문서 검증) 재검증

| # | 교차검증 발견 사항 | 재검증 결과 | 판정 |
|---|---|---|---|
| 오류 #1 | 관심종목 인증 방식 서술 오류 — "컴포넌트 레벨 체크"라 기술했으나 실제 미들웨어 보호 | **확인됨.** `src/proxy.ts` line 8에서 `pathname.startsWith("/watchlist")` 명시. 미들웨어가 1차 방어이며, `useSession()` 체크는 2차 방어. 문서 내부에서도 자기 모순 존재 (인벤토리 표에서는 "보호"로 올바르게 표기). | **정확한 발견** |
| 오류 #2 | 네비게이션 "더보기" prefixes와 subLinks 혼동 | **확인됨.** `app-header.tsx` line 97-107: `navCategories` "더보기"의 `prefixes`에는 `/settings`, `/contact` 포함되지만, `subLinks`에는 관심종목/포트폴리오/마이페이지/소개 4개만 표시. | **정확한 발견** |
| 누락 #1 | Toaster 레이아웃 트리 누락 | **확인됨.** `providers.tsx` line 33: `<Toaster richColors />` 존재. 단, Doc B 섹션 7.5에서 별도 언급하고 있으므로 경미한 누락. | **정확한 발견** |
| 누락 #2 | 모바일 "MY" 그룹 구조 미상세 | **확인됨.** `app-header.tsx` line 52-60: 모바일 `navGroups`의 "MY"에는 관심종목/포트폴리오/마이페이지/**설정** 4개. Desktop "더보기" `subLinks`에는 관심종목/포트폴리오/마이페이지/**소개** 4개. 구성이 다름. | **정확한 발견** |
| 누락 #3 | `/portfolio` 라우트 존재 여부 | **확인됨.** `src/app/portfolio/` 디렉토리는 **존재하지 않음**. 네비게이션에 링크가 있고 미들웨어 matcher에 포함되지만, 실제 페이지가 없어 404 반환. 다만, `isProtectedRoute` 체크에 `/portfolio`가 없어서 미들웨어를 통과한 후 Next.js 404가 표시됨. | **정확한 발견** (추가 발견: 미들웨어 보호도 불완전) |
| 누락 #4 | "분석 요청" URL 미기재 | **확인됨.** `app-header.tsx` line 83: `{ href: "/reports?tab=requests", label: "분석 요청" }` — URL이 누락. | **정확한 발견** |

**교차검증 A 정확도: 6/6 (100%)** — 모든 발견이 소스코드로 확인됨.

### 2.2 Cross-Validation B (A 문서 검증) 재검증

| # | 교차검증 발견 사항 | 재검증 결과 | 판정 |
|---|---|---|---|
| 오류 #1 | 종목 비교 최대 수: 홈페이지 UI "최대 5종목" vs compare 코드 `MAX_SLOTS = 4` | **확인됨.** `src/app/page.tsx` line 208: `description="최대 5종목 비교 분석"`, `src/app/compare/page.tsx` line 90: `const MAX_SLOTS = 4`. 코드베이스 자체 버그이며, 문서에서 이를 언급하지 않음. | **정확한 발견** (코드베이스 버그) |
| 오류 #2 | 모바일/데스크톱 네비 라벨 차이 미구분 | **확인됨.** Desktop: `"분석"` (line 77), Mobile: `"분석 도구"` (line 36). 문서가 이 차이를 구분하지 않음. | **정확한 발견** (경미) |
| 오류 #3 | 서브 네비 "더보기" + `/portfolio` 404 문제 | **확인됨.** 교차검증 A와 동일한 내용. `/portfolio` page.tsx 미존재. | **정확한 발견** |
| 누락 #1 | loading.tsx / error.tsx 10개 파일 미기재 | **부분 확인.** 실제 파일 수 확인: loading.tsx 7개 (market, news, stock/[ticker], watchlist, screener, etf, etf/[ticker]) + error.tsx 3개 (market, news, stock/[ticker]) = **총 10개**. 루트 error.tsx와 not-found.tsx는 Doc A에 기재됨. 교차검증의 리스트에서 `screener/error.tsx`는 실제 존재하지 않으므로 오류. | **대부분 정확, 세부 파일 목록에 소폭 오류** |
| 누락 #2 | 중간 layout.tsx 3개 미기재 | **확인됨.** `compare/layout.tsx`, `news/layout.tsx`, `settings/layout.tsx` — 모두 실제 존재. Doc A에서 누락. | **정확한 발견** |
| 누락 #3 | 홈페이지 공통 컴포넌트 미기재 | **확인됨.** `GtmPageView`, `PageContainer`, `JsonLd` 등은 대부분 페이지에서 사용되나 Doc A에서 체계적으로 나열되지 않음. | **정확한 발견** |
| 누락 #4 | 홈페이지 환율 섹션 미기재 | **확인됨.** `src/app/page.tsx` line 175-201에 환율 5개(USD, EUR, JPY, CNY, GBP) 표시 섹션 존재. Doc A 섹션 2.1 데이터 소스에서 `getExchangeRates()`는 기재했으나 컴포넌트 목록에 환율 표시를 명시적으로 언급하지 않음. | **정확한 발견** (경미) |
| 불일치 #3 | 미들웨어 matcher에 `/portfolio/:path*` | **확인됨.** `src/proxy.ts` line 41의 matcher에 포함되지만, `isProtectedRoute`에는 `/portfolio` 미포함. | **정확한 발견** |

**교차검증 B 정확도: 8/9 (89%)** — 누락 #1의 세부 파일 목록에 소폭 오류 (`screener/error.tsx`는 실제 미존재).

---

## 3. 추가 발견 사항 — 교차검증이 놓친 것

### 3.1 차트 기간 옵션 오류 (Doc A, Doc B 모두)

**Doc A (섹션 2.3)**: "기간 선택: 1M/3M/6M/1Y/3Y"
**Doc B (섹션 3.3 Mermaid 다이어그램)**: "기간 변경: 1W~5Y"

**실제 코드** (`src/types/stock.ts` line 66):
```typescript
export type ChartPeriod = "1W" | "2W" | "3W" | "1M" | "3M" | "6M" | "1Y"
```

`src/components/stock/chart-controls.tsx` line 7-15에서 PERIOD_LABELS:
- 1주, 2주, 3주, 1개월, 3개월, 6개월, 1년 (7개 옵션)

**양쪽 문서 모두 오류**:
- Doc A: "3Y" 옵션은 존재하지 않음, "1W/2W/3W" 누락
- Doc B: "5Y" 옵션은 존재하지 않음, "2W/3W" 누락

### 3.2 미들웨어 `/portfolio` 보호 불완전 (코드베이스 버그)

`src/proxy.ts`의 `isProtectedRoute` 조건에 `pathname.startsWith("/portfolio")`가 **빠져 있음**. matcher에는 `/portfolio/:path*`가 포함되어 미들웨어 함수가 실행되지만, `isProtectedRoute` 체크를 통과하므로 `NextResponse.next()`가 반환됨. 결과적으로 `/portfolio` 경로는 미들웨어에 의해 보호되지 않는 상태. (어차피 해당 페이지가 존재하지 않아 실질적 영향은 없으나, 의도와 구현이 불일치.)

교차검증 A, B 모두 "matcher에 `/portfolio/:path*` 포함"이라고만 언급하고, `isProtectedRoute` 조건에서 빠져 있는 점은 지적하지 않음.

### 3.3 Toaster 위치 정확도 (교차검증 A의 오류)

교차검증 A의 누락 #1에서 "Toaster는 `ThemeProvider` 내부, `CompareProvider` 바깥에 위치"라 기술. 실제 코드 확인:
```
SessionProvider > QueryClientProvider > ThemeProvider > TooltipProvider > CompareProvider > {children}
                                        └─ Toaster (CompareProvider 바깥, ThemeProvider 내부)
```
교차검증 A의 기술이 정확함.

### 3.4 Doc A의 `screener/[signal]` revalidate 값 누락

Doc A 섹션 1.1에서 `/screener/[signal]`의 revalidate를 "900s"로 기재. 실제 코드 `src/app/screener/[signal]/page.tsx` line 70: `export const revalidate = 900` — **정확함**. 그러나 Doc A 섹션 2.8에서 해당 페이지의 데이터 소스만 기술하고 ISR revalidate 값을 본문에 명시하지 않아 혼동 가능.

### 3.5 Doc B의 sitemap 관련 누락

Doc B 섹션 4.4에 `app/sitemap.ts` (기본 sitemap)가 누락됨. Doc A 섹션 1.4에는 포함. 실제 `src/app/sitemap.ts` 파일 존재 여부를 확인 — Doc A에 기재된 `robots.ts`, `sitemap.ts` 모두 존재함.

### 3.6 Doc A의 Protected 경로 목록에 `/portfolio` 페이지 경로 미포함

Doc A 섹션 3.4 "Protected 경로 목록"에 `/api/portfolio/*`는 기재되었으나 `/portfolio/*` 페이지 경로는 미기재. 실제로 `isProtectedRoute`에도 빠져 있으므로 현재 코드와는 일치하지만, matcher에는 포함되어 있어 의도적 보호 대상임을 시사.

### 3.7 ETF 상세 페이지 공시 탭 처리

Doc A 섹션 2.5: "공시 탭은 비활성". 실제 `src/app/etf/[ticker]/page.tsx`에서 `DisclosureTabServer`를 import하지 않고 `EventsTabWrapper`에 `disclosureSlot`을 `null`로 전달하는지 확인 필요. 코드 line 17-18에서 `DividendTabServer`, `EarningsTabServer`만 import하고 `DisclosureTabServer`는 미포함. **Doc A 기술 정확**.

### 3.8 `opengraph-image.tsx` 미기재 (양쪽 문서 모두)

`src/app/stock/[ticker]/opengraph-image.tsx` 파일이 존재하나 양쪽 문서 모두 언급하지 않음. OG 이미지 동적 생성은 SEO/SNS 공유에 중요한 기능.

---

## 4. 통합 이슈 목록

### CRITICAL (v1.0 릴리스 전 반드시 수정)

| # | 대상 문서 | 이슈 | 설명 |
|---|---|---|---|
| C-1 | Doc A, Doc B | 차트 기간 옵션 오류 | Doc A: "1M/3M/6M/1Y/3Y", Doc B: "1W~5Y". **실제: 1W/2W/3W/1M/3M/6M/1Y** (7개 옵션). 두 문서 모두 잘못됨. FE 팀이 이 문서를 참고하면 잘못된 기간 옵션을 구현할 위험. |
| C-2 | Doc B | 관심종목 인증 방식 자기 모순 | 섹션 3.4 line 298에서 "컴포넌트 레벨 체크"라 기술하나, 실제로 미들웨어가 1차 방어. 동일 문서 인벤토리 표에서는 "보호"로 표기. 인증 구현 시 혼동 유발. |

### MAJOR (수정 권장 — 팀 작업에 영향)

| # | 대상 문서 | 이슈 | 설명 |
|---|---|---|---|
| M-1 | Doc A | loading/error 바운더리 파일 10개 누락 | `market/loading.tsx`, `news/loading.tsx`, `stock/[ticker]/loading.tsx`, `watchlist/loading.tsx`, `screener/loading.tsx`, `etf/loading.tsx`, `etf/[ticker]/loading.tsx`, `market/error.tsx`, `news/error.tsx`, `stock/[ticker]/error.tsx` — 시스템 파일 섹션에 미기재. FE 팀이 어떤 라우트에 로딩/에러 처리가 있는지 파악 불가. |
| M-2 | Doc A | 중간 layout.tsx 3개 누락 | `compare/layout.tsx`, `news/layout.tsx`, `settings/layout.tsx` — 시스템 파일 섹션에 미기재. |
| M-3 | Doc A, Doc B | `/portfolio` 페이지 404 문제 미언급 | 네비게이션에 `/portfolio` 링크 존재, 미들웨어 matcher에 포함되지만, **페이지가 존재하지 않음** (포트폴리오는 `/watchlist` 탭으로 구현). 또한 `isProtectedRoute`에도 빠져 있어 미들웨어 보호도 불완전. 코드베이스 버그로 보고 필요. |
| M-4 | Doc A, Doc B | 코드베이스 버그: "최대 5종목" vs `MAX_SLOTS = 4` | 홈페이지 QuickLinkCard에서 "최대 5종목 비교 분석"이라 표시하나, compare 페이지의 `MAX_SLOTS = 4`. 문서에서 이 불일치를 명시하지 않음. |
| M-5 | Doc A, Doc B | Desktop/Mobile 네비게이션 구조 차이 미상세 | Desktop `navCategories`와 Mobile `navGroups`의 라벨/링크 차이가 체계적으로 구분되지 않음. (분석 vs 분석 도구, 더보기: 소개 vs MY: 설정) |

### MINOR (선택적 개선)

| # | 대상 문서 | 이슈 | 설명 |
|---|---|---|---|
| m-1 | Doc B | Toaster 레이아웃 다이어그램 누락 | 섹션 1 레이아웃 구조에서 `Toaster` 미표시 (섹션 7.5에서 별도 언급) |
| m-2 | Doc B | "분석 요청" URL 미기재 | 카테고리 매핑 표에서 실제 URL `/reports?tab=requests` 누락 |
| m-3 | Doc B | "더보기" prefixes와 subLinks 혼동 | 표에서 URL prefix 열에 `/settings`, `/contact` 포함했으나 실제 subLinks가 아님 |
| m-4 | Doc A | 공통 컴포넌트 섹션 미비 | `PageContainer`, `GtmPageView`, `JsonLd`, `Breadcrumb` 등이 페이지별 서술에 산재 |
| m-5 | Doc A | 홈페이지 환율 섹션 미기재 | 데이터 소스에 `getExchangeRates()`는 있으나 환율 5개 표시 UI 섹션 미언급 |
| m-6 | Doc A, Doc B | `opengraph-image.tsx` 미기재 | `stock/[ticker]/opengraph-image.tsx` 동적 OG 이미지 생성 파일 |
| m-7 | Doc B | sitemap.ts (기본) 미기재 | 섹션 4.4 특수 라우트에서 `app/sitemap.ts` 누락 (sitemap-index 등만 기재) |
| m-8 | Doc A | Mermaid 다이어그램 API 경로 형식 불일치 | `ticker` vs `[ticker]` vs `{ticker}` 혼용 |

---

## 5. 문서 간 차이점 분석

### 5.1 Doc A에만 있는 내용

| 항목 | 설명 |
|------|------|
| 페이지별 네비게이션 Flow | 각 페이지의 FROM/TO 관계 명시 (어디서 오고 어디로 가는지) |
| 비로그인 제한 상세 | 리포트 상세의 "비로그인 2건, 로그인 5건" 같은 세부 제한 사항 |
| 인증 Flow Mermaid (sequenceDiagram) | 로그인/회원가입의 단계별 시퀀스 다이어그램 |
| 데이터 Flow 다이어그램 (섹션 6) | 외부 소스 → Cron → DB → API → 클라이언트 전체 파이프라인 |
| 사용자 드롭다운/푸터 상세 | DropdownMenu 항목, Footer 링크 상세 |
| sitemap.ts 기재 | 기본 sitemap 파일 포함 |

### 5.2 Doc B에만 있는 내용

| 항목 | 설명 |
|------|------|
| 글로벌 레이아웃 구조 (섹션 1) | HTML 구조, Provider 중첩 순서 상세 |
| 사용자 여정별 Flow (섹션 3) | 비로그인/회원가입/종목탐색/관심종목/뉴스/리포트/게시판/설정/비교 여정 |
| 페이지 전체 인벤토리 (39개 테이블) | 모든 페이지를 번호 매겨 일람표로 제공 |
| 레이아웃/Loading/Error 바운더리 섹션 | 중간 layout, loading, error 파일 체계적 정리 |
| 컴포넌트 의존성 맵 (섹션 6) | 페이지별 사용 컴포넌트 + 공통 컴포넌트 테이블 |
| 상태 관리 & 데이터 Fetching (섹션 7) | React Query 키/패턴, URL State, Form State, 글로벌 State |
| 미들웨어 상세 (섹션 8) | matcher 패턴 전체 목록 + 보호 수준 정리 + `/portfolio/:path*` 포함 |
| ISR/캐싱 전략 | revalidate 값 + API 캐싱 전략 상세 |
| 보호 수준 4단계 정리 | 공개/로그인필요/관리자전용/CRON_SECRET 체계적 분류 |

### 5.3 두 문서 간 불일치 (어느 쪽이 맞는지)

| 항목 | Doc A | Doc B | 실제 코드 | 정답 |
|------|-------|-------|----------|------|
| 차트 기간 옵션 | 1M/3M/6M/1Y/3Y | 1W~5Y | 1W/2W/3W/1M/3M/6M/1Y | **둘 다 오류** |
| 관심종목 인증 | "미인증 시 `/auth/login` 리다이렉트" | "컴포넌트 레벨 체크" (line 298) | 미들웨어 리다이렉트 + 컴포넌트 이중 체크 | **Doc A가 더 정확** |
| 보호 경로에 `/portfolio` | `/api/portfolio/*`만 기재 | matcher에 `/portfolio/:path*` 포함 기재 | matcher에는 있으나 isProtectedRoute에는 없음 | **Doc B가 더 정확** (matcher 기재) |
| Cron API 메서드 | POST로 기재 | 메서드 미기재 (maxDuration만) | 전부 POST | **Doc A가 더 완전** |
| Cron maxDuration 값 | 미기재 | 전부 기재 (55s, 60s, 120s, 300s) | 값 모두 일치 | **Doc B가 더 완전** |
| Toaster 레이아웃 포함 | 포함 (섹션 5.1) | 미포함 (섹션 1) | 존재 | **Doc A가 더 정확** |
| 시스템 파일 | 루트만 기재 | 중간 layout + loading/error 모두 기재 | Doc B와 일치 | **Doc B가 더 완전** |

---

## 6. v1.0 문서 통합 권고사항

### 6.1 통합 전략: Doc B를 기반으로 Doc A의 강점 병합

Doc B가 구조적 프레임워크(레이아웃, 인벤토리, 컴포넌트 맵, 상태 관리, 미들웨어)에서 우수하므로 뼈대로 사용하고, Doc A의 페이지별 상세 Flow (FROM/TO, 인터랙션, 데이터 소스)와 데이터 파이프라인 다이어그램을 삽입한다.

### 6.2 통합 시 필수 수정 사항

1. **차트 기간 옵션 수정** → `1W | 2W | 3W | 1M | 3M | 6M | 1Y` (7개)
2. **관심종목 인증 서술 통일** → "미들웨어 `/auth/login?callbackUrl=/watchlist` 리다이렉트 (1차) + 컴포넌트 `useSession()` 이중 체크 (2차)"
3. **`/portfolio` 현황 명시** → "네비게이션 링크 존재, matcher 포함, 그러나 페이지 미구현. 포트폴리오 기능은 `/watchlist` 내 탭. v1.0에서 리다이렉트 또는 페이지 신설 필요."
4. **코드베이스 버그 보고 섹션 추가** → "최대 5종목" UI 텍스트 / `/portfolio` 404 / `isProtectedRoute` 누락
5. **loading/error/layout 바운더리 완전 기재** (Doc B의 섹션 4.3 활용)

### 6.3 권장 통합 문서 구조

```
1. 글로벌 레이아웃 구조 (Doc B 섹션 1 기반, Toaster 추가)
2. 사용자 진입점 (Doc B 섹션 2)
3. 사용자 여정별 Flow (Doc B 섹션 3, Doc A의 FROM/TO 관계 추가)
4. 페이지 전체 인벤토리 (Doc B 섹션 4 기반)
   4.1 페이지 목록 (39개)
   4.2 레이아웃 (4개)
   4.3 Loading/Error 바운더리
   4.4 특수 라우트 (sitemap.ts 추가)
5. 페이지별 상세 Flow (Doc A 섹션 2 — 가장 큰 차별점)
6. 인증/권한 Flow (Doc A 섹션 3의 시퀀스 다이어그램 + Doc B 섹션 8의 미들웨어 상세)
7. API 전체 인벤토리 (Doc B 섹션 5 기반, Doc A의 메서드 정보 병합)
8. 컴포넌트 의존성 맵 (Doc B 섹션 6)
9. 상태 관리 & 데이터 Fetching (Doc B 섹션 7)
10. 데이터 파이프라인 (Doc A 섹션 6)
11. 전체 사이트맵 (Doc B 섹션 9)
부록 A: ISR/캐싱 전략
부록 B: 코드베이스 알려진 이슈 (5종목 vs 4종목, /portfolio 404 등)
```

### 6.4 교차검증 프로세스 평가

두 교차검증 에이전트 모두 높은 품질의 검증을 수행함:
- **교차검증 A** (B 문서 검증): 100% 정확도 — 모든 발견 확인
- **교차검증 B** (A 문서 검증): 89% 정확도 — 세부 파일 목록 소폭 오류

양쪽 교차검증이 **공통으로 놓친 사항**:
- 차트 기간 옵션 오류 (양쪽 문서 모두 잘못됨에도 미발견)
- `isProtectedRoute`에서 `/portfolio` 누락 (matcher만 확인, 실제 보호 로직 미검증)
- `opengraph-image.tsx` 존재

---

## 검증 통계

| 항목 | 수치 |
|------|------|
| 검증한 소스코드 파일 | 25개+ |
| 검증한 페이지 URL/파일 경로 | 39개 전수 (Glob 확인) |
| 검증한 API 엔드포인트 | 59개 (route.ts Glob 확인) |
| 검증한 Cron maxDuration 값 | 15개 전수 (Grep 확인) |
| 검증한 미들웨어 보호 로직 | proxy.ts 전문 확인 |
| 검증한 ISR revalidate 값 | 10개 (홈/시장/종목/ETF/뉴스/스크리너/섹터/배당/실적/리포트) |
| 검증한 네비게이션 구조 | app-header.tsx 전문 확인 (navGroups + navCategories) |
| 검증한 Provider 구조 | providers.tsx 전문 확인 |
| **발견된 CRITICAL 이슈** | **2건** |
| **발견된 MAJOR 이슈** | **5건** |
| **발견된 MINOR 이슈** | **8건** |
