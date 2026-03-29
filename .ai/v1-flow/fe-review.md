# FE 개발자 리뷰 보고서

> **작성일**: 2026-03-29
> **기준 문서**: qa-result-1.md (FAIL 15, WARN 24), qa-result-3.md (FAIL 5, WARN 14)
> **방법**: QA 결과 기반 + 실제 소스코드 검증

---

## 1. FE 수행 요약

### 전체 건강 상태

| 구분 | qa-result-1 | qa-result-3 | 합계 |
|------|-------------|-------------|------|
| PASS | 165 | 133 | 298 |
| FAIL | 15 | 5 | 20 |
| WARN | 24 | 14 | 38 |
| N/A | 27 | 35 | 62 |

**FE 관점 판정: 조건부 출시 가능 (Conditional Go)**

- P0 결함 1건(callbackUrl)은 반드시 수정 후 출시
- P1 결함 3건은 출시 직후 hotfix 수준
- WARN 대부분은 UX 개선 사항이며 v1.0 블로커 아님
- N/A 62건 중 브라우저 테스트 필수 항목 약 20건 존재

---

## 2. FAIL 수정 계획

### FAIL-01: AUTH-012 / F-011 — callbackUrl 미처리 (P0, 즉시)

- **파일**: `src/components/auth/login-form.tsx`
- **현재 코드** (51행): `router.push("/"); router.refresh()`
- **문제**: `proxy.ts:33`에서 `loginUrl.searchParams.set("callbackUrl", pathname)`으로 callbackUrl을 설정하지만, login-form.tsx에서 이를 읽지 않음. Google OAuth도 `callbackUrl: "/"` 고정 (59행)
- **수정 방안**:
  1. `useSearchParams()` import 추가
  2. `const searchParams = useSearchParams()` 선언
  3. `const callbackUrl = searchParams.get("callbackUrl") || "/"`
  4. 51행: `router.push(callbackUrl)` 로 변경
  5. 59행: Google OAuth의 `callbackUrl`도 동일하게 동적 처리
  6. callbackUrl이 외부 URL인 경우를 방지하기 위해 `callbackUrl.startsWith("/")` 검증 추가
- **복잡도**: 간단
- **예상 시간**: 15분

### FAIL-02: STOCK-014 — 존재하지 않는 종목 접근 시 notFound() 미호출 (P1, 이번 스프린트)

- **파일**: `src/app/stock/[ticker]/page.tsx`
- **현재 코드** (81-83행): `const stock = await getStock(ticker)` 후 stock null 체크 없이 바로 진행. `initialData`가 null이 되어 StockTabs에 빈 데이터 전달
- **수정 방안**:
  1. 83행 이후에 `if (!stock) notFound()` 추가
  2. `import { notFound } from "next/navigation"` 추가
- **복잡도**: 간단
- **예상 시간**: 5분

### FAIL-03: NAV-006 / L-018 — /portfolio 경로 404 (P1, 이번 스프린트)

- **파일**: `src/components/layout/app-header.tsx`
- **현재 코드**: navGroups 56행과 navCategories 103행에 `{ href: "/portfolio", label: "포트폴리오" }` 존재. 실제 `/portfolio` page.tsx 미구현 — 포트폴리오 기능은 `/watchlist` 내 탭
- **수정 방안** (택 1):
  - **A안 (권장)**: href를 `/watchlist?tab=portfolio`로 변경
  - **B안**: `src/app/portfolio/page.tsx` 생성하여 `/watchlist?tab=portfolio`로 redirect
- **복잡도**: 간단
- **예상 시간**: 10분

### FAIL-04: CMP-010 / R-039 — MAX_SLOTS 텍스트 불일치 (P2, 다음 스프린트)

- **파일**: `src/app/page.tsx` 208행
- **현재 코드**: `description="최대 5종목 비교 분석"`
- **실제 제한**: `compare-context.tsx:21` — `MAX_SLOTS = 4`
- **수정 방안**: 텍스트를 `"최대 4종목 비교 분석"`으로 수정
- **복잡도**: 간단
- **예상 시간**: 2분

### FAIL-05: CS-024 / NAV-009 — 사이드시트 진입 방향 (P2, 판단 보류)

- **파일**: `src/components/layout/app-header.tsx` 222행
- **현재 코드**: `<SheetContent side="right">`
- **TC 기대**: 왼쪽에서 슬라이드 인
- **FE 판단**: **TC 수정 권장**. 햄버거 메뉴 아이콘이 우측에 있으므로 우측 진입이 UX 관례에 맞음. Android Material Design 가이드에서도 우측 네비 드로어 허용. 디자이너 최종 확인 필요
- **복잡도**: 간단 (변경 시 `side="left"`만 수정)
- **예상 시간**: 2분 (결정 후)

### FAIL-06: LD-011 — loading.tsx 미존재 페이지 (P2, 다음 스프린트)

- **현재 존재하는 loading.tsx**: market, news, stock/[ticker], watchlist, screener, etf, etf/[ticker] (7개)
- **미존재**: board, reports, dividends, earnings, sectors, compare (6개)
- **수정 방안**: 각 경로에 Skeleton 기반 loading.tsx 생성. 기존 market/loading.tsx 패턴 재활용
- **복잡도**: 보통 (6개 파일 생성, 각 페이지 레이아웃에 맞는 스켈레톤 설계 필요)
- **예상 시간**: 1시간

### FAIL-07: LD-012 / NEWS-003 — 뉴스 페이지네이션 vs 무한스크롤 (P2, TC 수정 권장)

- **파일**: `src/app/news/news-client.tsx` 124-129행
- **현재 구현**: 이전/다음 버튼 페이지네이션 방식, 잘 동작함
- **FE 판단**: **TC 수정 권장**. 페이지네이션이 SEO 및 접근성 측면에서 무한스크롤보다 우수. 뉴스 목록의 경우 페이지네이션이 합리적인 선택. FAIL이 아닌 PASS로 재분류 권장
- **복잡도**: 해당 없음 (현재 구현 유지)

### FAIL-08: BR-007 — 한국어 톤 혼재 (P1, 이번 스프린트)

- **현재 상태**:
  - `not-found.tsx:9`: "페이지를 찾을 수 없**어요**" (친근체)
  - `error.tsx:19`: "오류가 발생했**습니다**" (격식체)
  - `market/error.tsx:19`: "불러올 수 **없습니다**" (격식체)
  - `news/error.tsx:19`: "불러올 수 **없습니다**" (격식체)
- **수정 방안**: 격식체("~습니다")로 통일. not-found.tsx만 수정하면 됨
  - `not-found.tsx:9` → "페이지를 찾을 수 없습니다"
- **복잡도**: 간단
- **예상 시간**: 5분

### FAIL-09: BR-010 — Desktop/Mobile 용어 비대칭 (P2, 다음 스프린트)

- **파일**: `src/components/layout/app-header.tsx`
- **현재 불일치**:
  - Desktop navCategories 77행: `label: "분석"` vs Mobile navGroups 36행: `label: "분석 도구"`
  - Desktop subLink 83행: `label: "분석 요청"` vs Mobile navGroups 40행: `label: "리포트 요청"`
- **수정 방안**: 라벨 통일. "분석" / "분석 요청"으로 맞추거나, 양쪽 모두 "분석 도구" / "리포트 요청"으로 통일
- **복잡도**: 간단
- **예상 시간**: 10분

### FAIL-10: A-007 — 차트 접근성 aria-label 누락 (P2, 다음 스프린트)

- **파일**: `src/components/stock/stock-chart.tsx` 531행
- **현재 코드**: `<div ref={chartContainerRef} className="w-full min-h-[300px]" />`
- **수정 방안**: `role="img"` 및 `aria-label` 추가
  ```tsx
  <div ref={chartContainerRef} className="w-full min-h-[300px]" role="img" aria-label={`${ticker} 주가 캔들스틱 차트`} />
  ```
- **복잡도**: 간단
- **예상 시간**: 5분

---

## 3. WARN 판단 결과

### 수용 (현재 구현 유지)

| TC-ID | 항목 | 판단 근거 |
|-------|------|-----------|
| NAV-009 / R-004 | 사이드시트 우측 진입 | 햄버거 아이콘 위치(우측)와 일치. UX 관례상 문제 없음 |
| NEWS-003 | 페이지네이션 방식 | SEO/접근성 우수. 무한스크롤 대비 장점 많음 |
| STOCK-003 | 로그인 후 홈 개인화 부재 | v1.0에서는 CTA 배너 분기만으로 충분. 개인화는 v2 로드맵 |
| RQ-003 | text-xs(12px) 사용처 | 보조 텍스트/캡션에 적합. WCAG 최소 기준(12px) 충족 |
| RQ-016 | 테이블 overflow | `table.tsx`에서 가로 스크롤 컨테이너 처리 완료. 페이지 레벨은 브라우저 확인 시 검증 |
| C-027 | 차트 로딩 overlay | overlay 방식이 깜빡임 최소화에 적합. UX적으로 합리적 구현 |
| S-011 | 사이드시트 내 인라인 검색바 | 별도 모달 오픈 대비 인라인이 더 직관적. 수용 가능 |
| RQ-001 | 하단 탭바 터치 타깃 | h-14(56px) > 44px 기준 충족. 개별 버튼은 브라우저 확인 |

### 수정 필요

| TC-ID | 항목 | 수정 방안 | 우선순위 |
|-------|------|-----------|----------|
| AUTH-020 | `/board/:id/edit` matcher 패턴 | `proxy.ts:41` matcher에 `/board/:id*/edit` 패턴 확인. Next.js matcher 문법상 `:id`는 동적 세그먼트로 인식됨. 실동작은 브라우저 검증 필요 | P1 (브라우저 테스트) |
| CMP-003 | MAX_SLOTS 도달 시 알림 없음 | `compare-context.tsx:28`에서 무시만 됨. `toast.warning("최대 4종목까지 비교 가능합니다")` 추가 필요 | P1 |
| WL-006 | 관심종목 삭제 시 일괄 500 에러 | `watchlist/[ticker]/route.ts:31-33`에서 Prisma P2025(record not found) 분류하여 404 반환 | P2 |
| DT-010 | PriceChangeText에 font-mono 미적용 | 가격 변동 텍스트에 tabular-nums 미보장. 컴포넌트 자체에 `font-mono` className 추가 권장 | P2 |
| ES-014 | EmptyState 스타일 불균일 | EmptyState 컴포넌트(아이콘+제목+설명+CTA) 사용처와 단순 텍스트 혼재. 통일 패턴 정립 필요 | P2 |
| LA-016 | StickyPriceHeader와 2단 서브 네비 겹침 | `sticky-price-header.tsx:48`의 `top-14`가 2단 서브 네비(h-10) 존재 시 겹침. `top-24`로 변경하거나 서브 네비 존재 여부에 따라 동적 조정 | P1 |
| LA-017 | min-h-screen 미적용 | `layout.tsx:82` `<div className="pb-14 lg:pb-0">`에 `min-h-screen` 추가하여 Footer 위치 보장 | P1 |
| LA-018 | CookieConsent/FloatingBar/BottomTabBar 겹침 | CookieConsent(z-60, bottom-0)와 CompareFloatingBar(z-40, bottom-[60px])가 동시 표시 시 겹침 가능. CookieConsent 표시 중 FloatingBar의 bottom 값 추가 조정 필요 | P2 |
| F-022 | /reports/request 비로그인 접근 | `proxy.ts` matcher에 `/reports/request` 미포함. 미들웨어에 추가하거나 컴포넌트 레벨 체크 확인 필요 | P1 |
| SE-013 | 일부 페이지 canonical URL 누락 | 주요 페이지(`/market`, `/news`, `/compare` 등)에 개별 canonical 설정 추가 권장 | P2 |
| A-006 | `<main>` 랜드마크 태그 미사용 | `layout.tsx:82`의 `<div>`를 `<main>`으로 변경하여 스크린리더 랜드마크 인식 개선 | P1 |
| A-012 | chart-controls 터치 타깃 44px 미달 | `chart-controls.tsx`의 기간 버튼 `px-3 py-1 text-xs` → 최소 `min-h-[44px]` 또는 `py-2.5` 추가 | P2 |

---

## 4. 브라우저 테스트 필요 목록

### 홈페이지 (`/`)
- R-013: PopularStocksTabs 모바일 반응형
- R-015: CTA 배너 터치 타깃 (44px)
- LA-012: 섹션 간 간격 균일성

### 시장 페이지 (`/market`)
- R-016: MarketFilterChips 반응형 overflow 처리
- R-017: 상승/하락 종목 테이블 모바일 가로 스크롤
- LA-004: 상승/하락 분할 레이아웃

### 종목 상세 (`/stock/[ticker]`)
- STOCK-015~018: 차트 기간 변경, Heikin-Ashi 토글, 이동평균선 변경, 보조지표 패널
- R-023: 정보탭 카드 그리드 반응형
- R-024: 이벤트탭 테이블 반응형
- C-026: 모바일 터치 드래그/줌
- C-027: 차트 기간 변경 시 부드러운 전환
- DT-024: lightweight-charts 다크 테마 연동

### ETF 페이지 (`/etf`, `/etf/[ticker]`)
- R-025: ETF 목록 탭 전환
- R-026: ETF 상세 StockTabs

### 뉴스 페이지 (`/news`)
- R-027: NewsCard 레이아웃 반응형
- R-028: 카테고리 필터 칩 반응형

### 비교 페이지 (`/compare`)
- RQ-008: 비교 차트 모바일 가독성

### 인증 (`/auth/*`)
- AUTH-017: Google OAuth 취소 동작
- STOCK-010: 모바일 검색 오버레이

### 전역
- P-001~003: Lighthouse Core Web Vitals (LCP, FCP, CLS)
- P-004: INP 측정
- A-001~002: Tab/Enter 키보드 네비게이션
- A-009~011: WCAG AA 대비/색맹
- T-010: 설정 페이지 즉시 테마 반영
- L-019: 오프라인 상태 처리
- AN-006: 탭 전환 애니메이션

**테스트 방식 권장**:
- Core Web Vitals: Lighthouse CI 자동화 (GitHub Actions)
- 반응형: Chrome DevTools 디바이스 에뮬레이션 (375px / 768px / 1024px / 1440px)
- 접근성: axe DevTools + 수동 키보드 테스트
- 차트 인터랙션: 실 모바일 기기 테스트 (iOS Safari + Android Chrome)

---

## 5. 추가 발견 사항

### 5-1. 성능 우려

- **screener 페이지 대량 렌더링 (P-009)**: `screener-client.tsx`에서 4,000+ 종목을 한 번에 렌더링할 가능성. 가상 스크롤(react-window/tanstack-virtual) 또는 서버사이드 페이지네이션 확인 필요
- **차트 번들 사이즈**: `stock-chart.tsx`에서 14개 이상의 기술 분석 함수를 import. 동적 import로 분리하면 초기 로딩 개선 가능

### 5-2. 코드 품질

- **stock/[ticker]/page.tsx 방어 로직 부재**: stock이 null일 때 `notFound()` 호출 없이 진행하면서, 하위 컴포넌트들이 null 데이터를 받게 됨. TypeScript strict mode에서도 런타임 오류 가능
- **PriceChangeText 컴포넌트 파일 위치**: QA 보고서에서 `price-change-text.tsx`로 참조하나 실제 파일이 해당 경로에 없음. 파일명/경로 확인 필요. `price-display.tsx`에만 font-mono 적용되어 있음

### 5-3. 접근성 갭

- **`<main>` 랜드마크 미사용**: `layout.tsx:82`의 `<div className="pb-14 lg:pb-0">`가 `<main>`이 아님. 스크린리더 사용자가 메인 콘텐츠 영역을 바로 찾지 못함
- **차트 완전 접근 불가**: `stock-chart.tsx:531`의 차트 컨테이너에 aria 속성 전무. 시각 장애 사용자에게 가격 요약 텍스트라도 제공해야 함
- **chart-controls 터치 타깃**: `px-3 py-1 text-xs` 버튼은 높이 약 28px. WCAG 2.2 Target Size 기준 44px 미달

### 5-4. SEO 개선점

- **canonical URL 누락**: `layout.tsx`의 `alternates: { canonical: "./" }` 외에 개별 페이지에서 명시적 canonical 설정이 부족할 수 있음. `/market`, `/news`, `/compare` 등 주요 페이지에 추가 권장

---

## 6. Sprint Backlog

| 순번 | 우선순위 | 작업 | 수정 파일 | 예상 복잡도 | 관련 TC-ID |
|------|----------|------|-----------|-------------|------------|
| 1 | P0 즉시 | callbackUrl 리다이렉트 처리 | `src/components/auth/login-form.tsx` | 간단 | AUTH-012, F-011 |
| 2 | P1 | 존재하지 않는 종목 notFound() 추가 | `src/app/stock/[ticker]/page.tsx` | 간단 | STOCK-014 |
| 3 | P1 | /portfolio 링크를 /watchlist?tab=portfolio로 수정 | `src/components/layout/app-header.tsx` | 간단 | NAV-006, L-018 |
| 4 | P1 | 한국어 톤 통일 (격식체) | `src/app/not-found.tsx` | 간단 | BR-007 |
| 5 | P1 | StickyPriceHeader top 값 2단 서브 네비 겹침 수정 | `src/components/stock/sticky-price-header.tsx` | 보통 | LA-016 |
| 6 | P1 | min-h-screen 추가 (Footer 위치 보장) | `src/app/layout.tsx` | 간단 | LA-017 |
| 7 | P1 | `<div>` → `<main>` 랜드마크 변경 | `src/app/layout.tsx` | 간단 | A-006 |
| 8 | P1 | MAX_SLOTS 도달 시 toast 알림 추가 | `src/contexts/compare-context.tsx` | 간단 | CMP-003 |
| 9 | P1 | /reports/request 인증 보호 추가 | `src/proxy.ts` | 간단 | F-022 |
| 10 | P1 | Desktop/Mobile 네비 용어 통일 | `src/components/layout/app-header.tsx` | 간단 | BR-010 |
| 11 | P2 | MAX_SLOTS 텍스트 "최대 4종목"으로 수정 | `src/app/page.tsx` | 간단 | CMP-010, R-039 |
| 12 | P2 | 차트 컨테이너 aria-label 추가 | `src/components/stock/stock-chart.tsx` | 간단 | A-007 |
| 13 | P2 | loading.tsx 6개 페이지 추가 | `src/app/{board,reports,dividends,earnings,sectors,compare}/loading.tsx` | 보통 | LD-011 |
| 14 | P2 | 관심종목 삭제 에러 코드 분류 (P2025→404) | `src/app/api/watchlist/[ticker]/route.ts` | 간단 | WL-006 |
| 15 | P2 | EmptyState 컴포넌트 통일 패턴 적용 | 다수 파일 | 보통 | ES-014 |
| 16 | P2 | chart-controls 터치 타깃 44px 확보 | `src/components/stock/chart-controls.tsx` | 간단 | A-012 |
| 17 | P2 | CookieConsent/FloatingBar 겹침 방지 | `src/components/common/cookie-consent.tsx`, `compare-floating-bar.tsx` | 보통 | LA-018 |
| 18 | P2 | 주요 페이지 canonical URL 명시 | `src/app/{market,news,compare}/page.tsx` | 간단 | SE-013 |

**총 예상 작업량**: P0~P1 = 10건 (약 3시간), P2 = 8건 (약 4시간)

---

## 7. 종합 판정

### v1.0 출시 가능 여부: **조건부 Go**

**필수 조건 (출시 전 반드시 수정)**:
1. callbackUrl 처리 (P0) — 보호 라우트 접근 후 로그인 시 원래 페이지 복귀 불가는 핵심 UX 결함

**강력 권장 (출시 직후 hotfix)**:
2. notFound() 추가 — 존재하지 않는 종목 접근 시 빈 페이지 노출
3. /portfolio 데드링크 수정 — 네비게이션에 404 유발 링크 존재
4. 한국어 톤 통일 — 브랜드 일관성

**TC 문서 수정 권장**:
- NEWS-003: 무한스크롤 → 페이지네이션 (현재 구현이 더 합리적)
- CS-024 / NAV-009: 사이드시트 좌측 → 우측 (현재 구현이 UX 관례에 부합)
- LD-012: FAIL → PASS 재분류 (페이지네이션 정상 동작)
- C-009: 차트 기본 기간 1M → 3M (3M이 더 유의미한 정보 제공)

**브라우저 테스트 블로커**: N/A 62건 중 반응형(10건) + 접근성(5건) + 성능(7건)은 출시 전 최소 1회 수동 테스트 필요. 특히 모바일 375px에서의 차트/테이블 가독성은 반드시 확인해야 함.
