# StockView 디자인 개편 — 구현 계획 v2

> **기반 문서**: unified-design-system.md + unified-page-layouts.md
> **날짜**: 2026-03-30
> **원칙**: 다크 모드 우선 / 글래스모피즘 최소 / 노이즈 텍스처 미적용
> **버전**: v2 (3차 리뷰 반영 — 기술 호환성, 디자인 완전성, 실행 가능성)

---

## 핵심 결정 사항 (3차 리뷰 반영)

| # | 결정 | 근거 |
|---|------|------|
| D1 | **다크 모드: `.dark` 클래스 유지 + `defaultTheme="dark"`** | next-themes/Tailwind `dark:` 유틸리티 30+파일 호환. `:root`=라이트, `.dark`=다크 구조 유지. providers.tsx에서 `defaultTheme="dark"`로 변경하여 다크 우선 경험 달성. (R1-#1, R2-#2) |
| D2 | **텍스트 변수명: `--fg-*` 사용** | `--text-primary`는 Tailwind의 `text-primary` 유틸리티(브랜드 색상)와 충돌. `--fg-primary/secondary/tertiary/muted`로 변경. (R1-#3) |
| D3 | **oklch fallback**: 주식 컬러는 hex 유지, 신규 토큰만 oklch | 구형 브라우저에서 상승/하락 색상 미표시 방지. `@theme inline`의 stock 컬러는 hex 유지. (R3-#7) |
| D4 | **심리 게이지: 선택 기능으로 분리** | 데이터 소스/알고리즘 미정. Phase 6에서 제외, 별도 후속 작업. (R3-#3) |
| D5 | **공유 컴포넌트(IndexCard, StockRow): Phase 2로 승격** | Phase 3/4/5 병렬 진행 시 충돌 방지. (R3-#5) |
| D6 | **StockRow 변경: optional prop으로 하위 호환** | 5개 파일에서 import 중. 스파크라인/거래량바는 optional prop. (R3-#4) |

---

## Phase 0: 다크 모드 전환 준비

Phase 1 이전에 반드시 완료해야 하는 인프라 작업.

### 0-1. ThemeProvider 기본값 변경
**파일**: `src/app/providers.tsx`

- [ ] `defaultTheme="dark"` 설정 (현재 `"system"` 또는 `"light"`)
- [ ] `attribute="class"` 유지 (`.dark` 클래스 기반 유지)
- [ ] `@custom-variant dark (&:is(.dark *));` 유지 확인

### 0-2. lightweight-charts 색상 동적 전환 준비
**파일**: `src/components/stock/stock-chart.tsx`, `compare-chart.tsx`

- [ ] `document.documentElement.classList.contains("dark")` 감지 로직 유지 (D1에 의해 호환)
- [ ] 캔들 색상 hex 하드코딩 → `getComputedStyle`로 CSS 변수 런타임 읽기로 전환
- [ ] 테마 변경 시 차트 재렌더링 로직 확인

**예상 변경**: 3파일
**검증**: 다크/라이트 전환 시 전체 사이트 + 차트 색상 정상

---

## Phase 1: 디자인 토큰 기반 교체 (globals.css)

### 1-1. globals.css 컬러 토큰 교체
**파일**: `src/app/globals.css`

**배경 계층 (5단계)**:
- [ ] `--bg-base`, `--bg-surface`, `--bg-card`, `--bg-elevated`, `--bg-floating` (다크/라이트)

**텍스트 계층 (4단계, `--fg-*` 네이밍)**:
- [ ] `--fg-primary`, `--fg-secondary`, `--fg-tertiary`, `--fg-muted` (다크/라이트)

**브랜드/액센트 컬러 (R2-#3 보강)**:
- [ ] `--primary`, `--primary-hover`, `--primary-muted`, `--primary-foreground` oklch 값 교체 (hue 155→162)
- [ ] `--secondary`, `--secondary-hover`, `--secondary-foreground` 신규 (파란 계열)
- [ ] `--accent`, `--accent-hover`, `--accent-foreground` 신규 (골드/앰버)

**시맨틱/상태 컬러 (R2-#3 보강)**:
- [ ] `--success` / `--success-bg`
- [ ] `--warning` / `--warning-bg`
- [ ] `--danger` / `--danger-bg` (+ `--destructive` 매핑)
- [ ] `--info` / `--info-bg`

**테두리 (3단계)**:
- [ ] `--border-subtle`, `--border-default`, `--border-strong`, `--border-focus`
- [ ] `--border-gradient-start`, `--border-gradient-end`

**그림자 (4단계)**:
- [ ] `--shadow-subtle`, `--shadow-medium`, `--shadow-elevated`, `--shadow-floating` (다크/라이트 별도)

**글래스모피즘 (헤더/바텀탭 전용)**:
- [ ] `--glass-bg`, `--glass-border`, `--glass-blur`

**주식 컬러 (D3: hex 유지 + oklch 신규)**:
- [ ] `--color-stock-up/down/flat` hex 값 유지 (`@theme inline`)
- [ ] `--color-stock-up-bg/down-bg` hex 값 유지
- [ ] 다크 모드 주식 컬러 hex 값 유지

**데이터 시각화 토큰**:
- [ ] 차트 팔레트 8색 교체 (`--chart-1` ~ `--chart-8`)
- [ ] 히트맵 9단계 (`--heatmap-1` ~ `--heatmap-9`)
- [ ] 뱃지 5종 (Market KR/US, Sector, News, ETF)
- [ ] 인덱스 5색 (`--index-kospi/kosdaq/sp500/nasdaq/usdkrw`) (R2-#5)
- [ ] 시장 너비 바 투명도 (`--bar-opacity-full/high/medium/low/bg`) (R2-#5)
- [ ] 시장 너비 색상 (`--breadth-advancing/declining/flat`) (R2-#5)

**트랜지션 타이밍**:
- [ ] `--ease-out`, `--ease-in-out`, `--ease-spring`
- [ ] `--duration-fast` (120ms), `--duration-normal` (200ms), `--duration-slow` (350ms)

**캐러셀 도트 (R2-#5)**:
- [ ] `--dot-inactive`, `--dot-active`, `--dot-size`, `--dot-size-active`, `--dot-gap`

**radius 체계 (R2-#6)**:
- [ ] `--radius`, `--radius-sm/md/lg/xl/2xl` 값 정리 및 통일
- [ ] `@theme inline`의 calc() 기반 정의와 일관성 확인

**shadcn 호환 매핑 유지 (R1-#6)**:
- [ ] `--background` = `--bg-base`
- [ ] `--card` = `--bg-card`
- [ ] `--popover` = `--bg-floating`
- [ ] `--muted` = `--bg-surface` (중립 회색 의미 유지)
- [ ] `--foreground` = `--fg-primary`
- [ ] `--muted-foreground` = `--fg-secondary`
- [ ] `--border` = `--border-default`
- [ ] `--ring` = `--border-focus`
- [ ] `--secondary` 의미 변경 주의: shadcn Button/Badge 시각 확인 필요

### 1-2. @theme inline 블록 업데이트 (R1-#7 보강)
**구체적 등록 목록**:
- [ ] 배경: `--color-bg-surface`, `--color-bg-elevated`, `--color-bg-floating` → `bg-bg-surface` 등
- [ ] 그림자: `--shadow-subtle/medium/elevated/floating` → `shadow-subtle` 등
- [ ] 차트: `--color-chart-6/7/8` 추가 (현재 5까지만)
- [ ] 히트맵: `--color-heatmap-1` ~ `--color-heatmap-9`
- [ ] 타이밍: `--ease-out/in-out/spring`, `--duration-fast/normal/slow`
- [ ] 네이밍 전략: `bg-bg-base` 이중 접두어 → `bg-base` 축약 가능 여부 확인

### 1-3. 유틸리티 클래스 추가
- [ ] `.font-price` (모노, bold, tabular-nums, letter-spacing -0.02em)
- [ ] `.card-default`, `.card-interactive`, `.card-stat`, `.card-chart` 유틸리티
- [ ] `.card-gradient-border` (R2-#4 보강, `::before` pseudo-element + mask-composite)
- [ ] `.skeleton` shimmer 애니메이션 (그래디언트 스윕, 다크/라이트 별도)
- [ ] `.price-tick-up`, `.price-tick-down` 애니메이션 (1.5s keyframe)
- [ ] 페이지 진입 애니메이션 `.page-content` (`@media (prefers-reduced-motion: reduce)` 즉시 포함)
- [ ] 포커스 링 시스템 `:focus-visible` (다크: 글로우, 라이트: 아웃라인)
- [ ] `.price-large`, `.price-medium`, `.price-small`, `.change-pill` 타이포그래피 유틸리티

### 1-4. 기존 dark: 유틸리티 점검 (R1-#2 보강)
- [ ] `dark:` 유틸리티 사용 파일 전수 조사 (30+파일)
- [ ] D1 결정으로 `.dark` 클래스 유지되므로 기존 `dark:` 유틸리티 호환 → 변경 불필요 확인
- [ ] 단, `--secondary`/`--accent` 의미 변경으로 인한 시각 변화 개별 확인 (R1-#6)

**예상 변경**: globals.css 1파일 (~300줄), providers.tsx (Phase 0 포함)
**검증**:
- [ ] `npm run build` 성공
- [ ] 다크 모드 기본 로드 확인
- [ ] 라이트 모드 전환 정상
- [ ] shadcn 컴포넌트 variant별 시각 확인 (Button, Badge, Tabs, DropdownMenu)
- [ ] **주요 10페이지 before/after 비교** (홈, 시장, 종목상세, 관심종목, 뉴스, 섹터, 스크리너, 리포트, 로그인, 마이페이지) (R3-#6)
- [ ] 주식 색상(빨강=상승, 파랑=하락) 불변 확인

---

## Phase 2: 레이아웃 컴포넌트 + 공유 컴포넌트 개편

### 2-1. 헤더 개편
**파일**: `src/components/layout/app-header.tsx`

- [ ] 헤더에 글래스모피즘 적용 (`bg-[--glass-bg] backdrop-blur-[--glass-blur] border-b border-[--glass-border]`)
- [ ] 검색 바 확장 (256→320px) + `⌘K` 힌트 추가
- [ ] 서브 네비 필 스타일 + `border-b-2 border-primary` 활성 인디케이터 슬라이드 애니메이션

### 2-1a. 시장 상태 뱃지 (R2-#7 보강)
**파일**: `src/components/layout/market-status-badge.tsx` (신규)

- [ ] 5가지 상태: 🟢 장중(pulse), 🔴 장마감, 🟡 프리마켓, 🟡 애프터마켓, ⚪ 휴장
- [ ] `isMarketOpen(market)` 유틸 함수: KST 09:00-15:30 평일 / EST 09:30-16:00 평일 기반 간이 판별
- [ ] 클릭 시 KR/US 양쪽 시장 상태 표시 확장

### 2-1b. 브레드크럼 컴포넌트 (R2-#7 보강)
**파일**: `src/components/layout/breadcrumb-nav.tsx` (신규)

- [ ] `text-xs` + `--fg-tertiary`, 셰브론 구분자
- [ ] 모바일: 3단계 초과 시 중간 "..." 생략
- [ ] JSON-LD BreadcrumbList SEO 스키마

### 2-2. 모바일 바텀 탭 바 개편
**파일**: `src/components/layout/bottom-tab-bar.tsx`

- [ ] 글래스모피즘 배경 (`bg-[--glass-bg] backdrop-blur-sm`)
- [ ] 활성 상태: 솔리드 아이콘 + dot 인디케이터 + `--fg-primary` 텍스트
- [ ] iOS safe area `pb-safe` (env(safe-area-inset-bottom))

### 2-3. 페이지 컨테이너
**파일**: `src/components/layout/page-container.tsx`

- [ ] 배경 `--bg-base` 적용
- [ ] `.page-content` 진입 애니메이션 + **`@media (prefers-reduced-motion: reduce)` 즉시 적용** (R3-#12)

### 2-4. 푸터
**파일**: `src/components/layout/footer.tsx`

- [ ] `--bg-surface` 배경, `--fg-tertiary` 텍스트

### 2-5. 공유 컴포넌트 업그레이드 (D5 신규)
Phase 3/4/5 병렬 진행 전에 공유 컴포넌트를 먼저 업그레이드.

**IndexCard** (`src/components/market/index-card.tsx`):
- [ ] `.card-stat` 적용 (방향성 좌측 보더 + 그래디언트 배경)
- [ ] 미니 차트 영역 (lightweight-charts, 60px 높이)
- [ ] 숫자 카운트업 애니메이션
- [ ] 캐러셀 도트 스타일 (모바일)

**StockRow** (`src/components/market/stock-row.tsx`):
- [ ] `.card-interactive` 적용
- [ ] 거래량 바: `showVolumeBar?: boolean` optional prop (D6)
- [ ] 인라인 스파크라인: `showSparkline?: boolean` optional prop (D6)
- [ ] 기존 5개 사용처 (popular-stocks-tabs, market-filter-chips, watchlist, etf, mypage) 하위 호환 확인

**예상 변경**: 8파일 (3 신규 + 5 수정)
**검증**: 모든 페이지에서 헤더/푸터/탭바 + IndexCard/StockRow 정상 표시

---

## Phase 3: 홈페이지 대시보드화

Phase 2에서 IndexCard/StockRow 업그레이드 완료를 전제.

### 3-1. 티커 테이프 (신규)
**파일**: `src/components/home/ticker-tape.tsx` (신규)

- [ ] KOSPI, KOSDAQ, S&P 500, NASDAQ, USD/KRW 무한 수평 스크롤
- [ ] CSS 애니메이션 (`translateX`, `@keyframes ticker`), 호버 시 정지
- [ ] 색상 코딩: `--color-stock-up`(상승), `--color-stock-down`(하락) 적용
- [ ] 클릭 시 상세 페이지 이동
- [ ] `--bg-surface` 솔리드 배경 (글래스 미적용), `font-mono text-xs tabular-nums`
- [ ] **데이터**: 홈페이지 SSR 시 `getMarketIndices()` + `getExchangeRate()` 재사용, client polling 미구현 (R3-#8)
- [ ] `prefers-reduced-motion`: 스크롤 정지, 정적 표시

### 3-2. 홈페이지 레이아웃 변경
**파일**: `src/app/page.tsx` (수정), `src/components/home/hero-section.tsx` (수정/교체)

- [ ] CSS Grid 대시보드 레이아웃 적용 (4칼럼 → 2칼럼 → 1칼럼)
- [ ] 기존 HeroSection → 티커 테이프 + 지수 카드 그리드로 교체
- [ ] `grid-template-areas`: ticker → idx → hot+pulse → news 배치

### 3-3. 인기 종목 섹션 개편
**파일**: `src/components/market/popular-stocks-tabs.tsx` (수정)

- [ ] Phase 2에서 업그레이드된 StockRow에 `showVolumeBar={true}` 전달
- [ ] 탭 인디케이터 애니메이션 (KR | US)

### 3-4. 마켓 펄스 패널 (R2-#1 보강 — 3종 컴포넌트)

**환율 위젯** (`src/components/home/exchange-rate-widget.tsx`, 신규):
- [ ] USD/KRW, EUR/KRW, JPY/KRW 표시
- [ ] `.card-stat` 적용, 방향성 색상
- [ ] 데이터: 기존 `getExchangeRate()` 재사용

**퀵 액션** (`src/components/home/quick-actions.tsx`, 신규):
- [ ] 2×2 그리드: 스크리너, AI리포트, 종목비교, 투자가이드
- [ ] `.card-interactive` 적용, Lucide 아이콘

**섹터 미니 히트맵** (`src/components/home/sector-mini-heatmap.tsx`, 신규):
- [ ] Phase 4의 히트맵 축소판 (데이터 가용 시)
- [ ] 데이터 미가용 시: 섹터 목록 링크로 대체 (graceful degradation)
- [ ] `/sectors` 전체 보기 링크

### 3-5. 뉴스 카드 개편
**파일**: 뉴스 관련 컴포넌트 (수정)

- [ ] 카테고리 뱃지: A의 뱃지 체계 적용 (경제=`--info`, 기업=`--success`, 증시=`--accent`, 해외=`--chart-3`)
- [ ] `.card-interactive` 호버 효과
- [ ] 관련 종목 클릭 링크

**예상 변경**: ~9파일 (4 신규 + 5 수정)
**검증**: 홈페이지 데스크톱/태블릿/모바일 3단계 + 모든 위젯 데이터 표시 확인

---

## Phase 4: 시장 개요 페이지

### 4-0. 데이터 레이어 준비 (R3-#1, R3-#2 보강)
**파일**: `src/lib/queries.ts` (수정)

- [ ] `getSectorHeatmapData(market)`: Stock JOIN Sector → GROUP BY sector, SUM(marketCap), AVG(changePercent)
- [ ] `getMarketBreadth(market)`: 전체 종목 상승/보합/하락 COUNT + 상한가/하한가 COUNT
- [ ] `getTopMovers(market, limit=10)`: 상승/하락 TOP 10 (기존 `getMarketMovers` 확장)

**참고**: Prisma 스키마 변경 불필요. 기존 Stock/Sector 모델로 쿼리 가능.

### 4-1. 시장 페이지 레이아웃
**파일**: `src/app/market/page.tsx` (수정)

- [ ] Grid 레이아웃 적용 (index-row → market-tabs → treemap → breadth → movers → table)
- [ ] KR/US 탭 전환 (URL 쿼리 파라미터 `?market=kr`)
- [ ] 탭 전환 시 콘텐츠 크로스페이드 (opacity 0→1, 150ms)

### 4-2. 섹터 히트맵 (신규)
**파일**: `src/components/market/sector-heatmap.tsx` (신규)

- [ ] CSS Grid 트리맵 (시가총액 비율로 `grid-template-columns` 계산)
- [ ] `--heatmap-1` ~ `--heatmap-9` 색상 적용
- [ ] 호버 툴팁 (`--bg-floating` + `--shadow-elevated`)
- [ ] 클릭 → `/sectors/[name]` 이동
- [ ] 모바일: 트리맵 → 수평 색상 바 차트로 전환

### 4-3. 시장 너비 바 (신규)
**파일**: `src/components/market/market-breadth-bar.tsx` (신규)

- [ ] 상승(`--breadth-advancing`)/보합(`--breadth-flat`)/하락(`--breadth-declining`) 스택드 바
- [ ] 로드 시 너비 애니메이션 (400ms ease-out)
- [ ] 하단 텍스트: "상한가 X · 하한가 Y · 보합 Z"

### 4-4. 모멘텀 바 (신규)
**파일**: `src/components/market/momentum-bars.tsx` (신규)

- [ ] 상승 TOP 10 / 하락 TOP 10 나란히 (2칼럼)
- [ ] 수평 바 비례 채움 (`--color-stock-up/down` 30% 불투명도)
- [ ] 호버: 상세 정보 표시, 클릭: 종목 상세 이동

### 4-5. 정렬 가능 종목 테이블 (신규)
**파일**: `src/components/market/stock-table.tsx` (신규)

- [ ] 칼럼: 종목명, 현재가, 등락, 등락률, 거래량, 거래대금, 시가총액, 7일 차트
- [ ] 칼럼 헤더 클릭 정렬 (오름/내림 토글)
- [ ] 인라인 스파크라인 (40px × 20px, lightweight-charts)
- [ ] 고정 헤더 (scroll), 페이지네이션 (20개/페이지)
- [ ] `font-mono tabular-nums` 숫자 정렬
- [ ] 모바일: 첫 칼럼 고정 + 수평 스크롤 + 우측 그림자 힌트

**예상 변경**: ~6파일 (4 신규 + 2 수정)
**검증**: 시장 페이지 데이터 표시 + 정렬/필터 동작 + KR/US 전환

---

## Phase 5: 종목 상세 페이지 (난이도: 높음 — R3-#9 반영)

### 5-0. StockTabs 구조 리팩토링 (R3-#9 보강)
**파일**: `src/app/stock/[ticker]/page.tsx`, `stock-tabs.tsx` (수정)

- [ ] 차트를 StockTabs 밖으로 분리 → 독립 차트 히어로 영역
- [ ] StockTabs → "정보 탭 영역"만 담당하도록 리팩토링
- [ ] Suspense boundary + HydrationBoundary 재배치
- [ ] 기존 6개 탭 slot 패턴 유지하되 차트 탭 제거 (상위로 승격)

### 5-1. 종목 상세 레이아웃
**파일**: `src/app/stock/[ticker]/page.tsx` (수정)

- [ ] CSS Grid: `grid-template-columns: 1fr 320px`, `grid-template-areas: "header header" "chart sidebar" "tabs tabs"`
- [ ] 차트: `min-height: 400px; height: 60vh; max-height: 600px`
- [ ] 반응형: 태블릿 → 사이드바 아래로, 모바일 → 차트 풀 블리드 (`margin: 0 -16px`)

### 5-2. 종목 헤더 재설계
- [ ] 가격 `text-4xl font-price`, 변동 `.change-pill` 색상 적용
- [ ] OHLV 컴팩트 라인 (`text-sm font-mono`)
- [ ] 관심종목(별 토글)/비교/공유 버튼

### 5-3. 사이드바 패널 (신규)
**파일**: `src/components/stock/stock-sidebar.tsx` (신규)

- [ ] 핵심 통계 그리드 (`.card-default`, 2칼럼, `font-mono tabular-nums`)
- [ ] 52주 레인지 슬라이더 (파란 dot = 현재 가격 위치)
- [ ] 관련 종목 (같은 섹터 3-5개)
- [ ] `position: sticky; top: 80px` 독립 스크롤
- [ ] 태블릿/모바일: 수평 스크롤 카드 스트립 또는 아코디언

### 5-4. 콘텐츠 탭 개선
**파일**: `src/app/stock/[ticker]/stock-tabs.tsx` (수정)

- [ ] 탭 전환 페이드 애니메이션 (`transition-opacity duration-150`)
- [ ] 스크롤 시 탭바 sticky (차트 아래)
- [ ] 브레드크럼 추가: "주식 > [종목명] ([티커])"

**예상 변경**: ~5파일 (1 신규 + 4 수정)
**검증**: 종목 상세 차트 히어로 + 사이드바 + 탭 + 반응형 3단계

---

## Phase 6: 마이크로 인터랙션 & 폴리시

### 6-1. 차트 색상 토큰 연동
**파일**: 차트 관련 컴포넌트

- [ ] 캔들/라인/영역 차트 색상을 `getComputedStyle` + CSS 변수 기반으로 전환
- [ ] 다크/라이트 전환 시 차트 색상 실시간 반영

### 6-2. 가격 틱 애니메이션
- [ ] `usePriceTick` 훅 구현
- [ ] 가격 표시 컴포넌트에 적용 (IndexCard, StockRow, 종목 헤더)

### 6-3. 스켈레톤 업그레이드
**파일**: `src/components/ui/skeleton.tsx` (수정)

- [ ] shimmer 그래디언트 애니메이션으로 교체 (`.skeleton` 클래스)
- [ ] 다크/라이트 별도 shimmer 색상

### 6-4. 전역 인터랙션 정리
- [ ] 모든 카드 호버/active 상태 통일 (`.card-interactive` 기반)
- [ ] 버튼 press-down 효과 통일
- [ ] `prefers-reduced-motion` 전역 대응 재확인
- [ ] 별 토글 `star-pop` 애니메이션

### 6-5. Gradient Border 카드 적용
- [ ] 인기 종목 Top 3에 `.card-gradient-border` 적용
- [ ] 관심종목 알림 종목에 적용

**예상 변경**: ~6파일
**검증**: 전체 사이트 인터랙션 일관성, `npm run build` 통과

---

## 구현 순서 요약

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──┬──→ Phase 3 (홈)
                                   ├──→ Phase 4 (시장) ──→ Phase 6
                                   └──→ Phase 5 (종목)
```

| Phase | 내용 | 파일 수 | 난이도 | 의존성 |
|-------|------|---------|--------|--------|
| **0** | 다크 모드 전환 준비 | 3 | 낮음 | 없음 |
| **1** | 디자인 토큰 (globals.css) | 1(+점검 30) | 중간 | Phase 0 |
| **2** | 레이아웃 + 공유 컴포넌트 | 8 | 중간 | Phase 1 |
| **3** | 홈페이지 대시보드화 | ~9 | 중간 | Phase 2 |
| **4** | 시장 개요 (데이터 레이어 포함) | ~6 | 중간 | Phase 2 |
| **5** | 종목 상세 (StockTabs 리팩토링 포함) | ~5 | **높음** | Phase 2 |
| **6** | 마이크로 인터랙션 & 폴리시 | ~6 | 낮음 | Phase 3~5 |

**Phase 3, 4, 5는 병렬 가능** (Phase 2에서 공유 컴포넌트 선행 처리 완료)

---

## 변경하지 않는 것

- Next.js App Router 구조
- Prisma 스키마 (쿼리 함수는 추가)
- 인증 (NextAuth)
- 데이터 소스 (Naver, Yahoo, RSS)
- lightweight-charts 라이브러리 (색상 전달 코드만 수정)
- shadcn/ui 컴포넌트 기본 구조 (Card, Button, Tabs 등 — 스타일만 변경)
- `dark:` Tailwind 유틸리티 (`.dark` 클래스 유지로 호환)

---

## 범위 밖 (후속 작업)

- 시장 심리 게이지 (D4: 데이터 소스/알고리즘 정의 후)
- 사이드바 네비게이션 (파워유저 옵션)
- 풀투리프레시, 스티키 바텀 CTA (모바일 고급 인터랙션)
- WebSocket 실시간 업데이트
- 범위 밖 페이지 개별 개편 (watchlist, news, screener, reports 등 — Phase 1-2로 자동 토큰 적용됨)

---

## 검증 체크리스트

### Phase별 검증
- [ ] **Phase 0**: `defaultTheme="dark"` 적용 후 전체 사이트 다크 모드 로드 확인
- [ ] **Phase 1**: `npm run build` + 10페이지 before/after 스크린샷 비교
- [ ] **Phase 2**: 헤더/푸터/탭바 + IndexCard/StockRow 전 페이지 정상
- [ ] **Phase 3/4/5**: 각 페이지 데스크톱/태블릿/모바일 3단계
- [ ] **Phase 6**: `npm run build` + 인터랙션 일관성

### 글로벌 검증
- [ ] `npm run build` 성공
- [ ] 다크 모드 기본, 라이트 모드 전환 정상
- [ ] 한국 컨벤션: 빨강=상승, 파랑=하락 유지
- [ ] WCAG AA 대비 비율 충족
- [ ] 모바일 (375px), 태블릿 (768px), 데스크톱 (1280px) 반응형
- [ ] `prefers-reduced-motion` 시 애니메이션 비활성
- [ ] 기존 기능 (관심종목, 로그인, 검색 등) 정상 동작
- [ ] shadcn 컴포넌트 variant별 시각 확인 (Button, Badge, Tabs, DropdownMenu)
- [ ] 범위 밖 주요 페이지 (watchlist, news, screener, reports) 시각적 확인
- [ ] lightweight-charts 다크/라이트 색상 정상 전환

---

## 3차 리뷰 반영 추적

| 리뷰 | # | 심각도 | 이슈 | 반영 위치 |
|------|---|--------|------|----------|
| R1 | 1 | 높음 | 다크 모드 메커니즘 충돌 | D1 → Phase 0 |
| R1 | 2 | 높음 | dark: 유틸리티 30+파일 | D1 → Phase 1-4 |
| R1 | 3 | 높음 | text-primary 이름 충돌 | D2 → Phase 1-1 |
| R1 | 4 | 중간 | lw-charts 다크 감지 | D1 → Phase 0-2 |
| R1 | 5 | 중간 | 캔들 색상 하드코딩 | Phase 0-2, 6-1 |
| R1 | 6 | 중간 | secondary/accent 의미 변경 | Phase 1-1 shadcn 매핑 |
| R1 | 7 | 중간 | @theme inline 미명세 | Phase 1-2 구체화 |
| R1 | 8 | 낮음 | radius 충돌 | Phase 1-1 radius 체계 |
| R1 | 9 | 낮음 | primary hue 155→162 | Phase 1-1 브랜드 컬러 |
| R2 | 1 | 높음 | 마켓 펄스 3종 누락 | Phase 3-4 신규 |
| R2 | 2 | 높음 | 다크모드 전환 전략 | D1 → Phase 0 |
| R2 | 3 | 높음 | 브랜드/시맨틱 토큰 누락 | Phase 1-1 보강 |
| R2 | 4 | 중간 | gradient border 누락 | Phase 1-3, 6-5 |
| R2 | 5 | 중간 | 전용 토큰 21개 모호 | Phase 1-1 명시 |
| R2 | 6 | 중간 | radius 미언급 | Phase 1-1 |
| R2 | 7 | 중간 | 네비 세부 컴포넌트 | Phase 2-1a, 2-1b |
| R2 | 8 | 중간 | 모바일 전용 패턴 | 범위 밖 (후속) |
| R3 | 1 | 높음 | 히트맵 데이터 부재 | Phase 4-0 |
| R3 | 2 | 높음 | 시장너비/모멘텀 데이터 | Phase 4-0 |
| R3 | 3 | 높음 | 심리 게이지 데이터 | D4 → 범위 밖 |
| R3 | 4 | 높음 | StockRow 5파일 영향 | D6 → Phase 2-5 |
| R3 | 5 | 중간 | IndexCard 병렬 충돌 | D5 → Phase 2-5 |
| R3 | 6 | 중간 | 43페이지 시각적 회귀 | Phase 1 검증 보강 |
| R3 | 7 | 중간 | oklch 브라우저 호환 | D3 |
| R3 | 8 | 중간 | 티커테이프 데이터 전략 | Phase 3-1 명시 |
| R3 | 9 | 중간 | StockTabs 복잡도 | Phase 5-0, 난이도 상향 |
