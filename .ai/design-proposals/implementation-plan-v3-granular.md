# StockView 디자인 개편 — 세분화 구현 계획 v3

> **원칙**: 모든 스텝이 독립 실행 가능, 블로커 없음
> **각 스텝**: 1~3 파일 변경, 즉시 검증 가능, 롤백 용이
> **날짜**: 2026-03-30

---

## Step 1: ThemeProvider 다크 우선 전환
**파일**: `src/components/providers.tsx` (1줄 변경)
**작업**:
```tsx
// before
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
// after
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
```
**검증**: 사이트 로드 시 다크 모드 기본 표시. 라이트 전환 토글 정상 동작.
**리스크**: 없음. `attribute="class"` 유지로 기존 `dark:` 유틸리티 전부 호환.

---

## Step 2: globals.css — 배경 5단계 토큰 추가
**파일**: `src/app/globals.css`
**작업**: `:root`와 `.dark` 블록에 배경 계층 변수 **추가** (기존 변수 건드리지 않음)
```css
:root {
  /* 기존 변수 유지 */
  --bg-base: oklch(0.965 0.003 260);
  --bg-surface: oklch(0.985 0.002 260);
  --bg-elevated: oklch(1.0 0 0);
  --bg-floating: oklch(1.0 0 0);
}
.dark {
  --bg-base: oklch(0.13 0.005 260);
  --bg-surface: oklch(0.17 0.005 260);
  --bg-elevated: oklch(0.25 0.008 260);
  --bg-floating: oklch(0.30 0.010 260);
}
```
- [ ] `--background`를 `--bg-base`와 동일 값으로 유지 (shadcn 호환)
- [ ] `--card`를 기존값 유지 (= bg-card 역할 이미 수행 중)

**검증**: `npm run build` 통과. 시각 변화 없음 (추가만 했으므로).

---

## Step 3: globals.css — 텍스트 4단계 토큰 추가
**파일**: `src/app/globals.css`
**작업**: `--fg-*` 네이밍으로 텍스트 계층 변수 추가
```css
:root {
  --fg-primary: oklch(0.15 0 0);
  --fg-secondary: oklch(0.40 0 0);
  --fg-tertiary: oklch(0.55 0 0);
  --fg-muted: oklch(0.70 0 0);
}
.dark {
  --fg-primary: oklch(0.95 0 0);
  --fg-secondary: oklch(0.72 0 0);
  --fg-tertiary: oklch(0.55 0 0);
  --fg-muted: oklch(0.42 0 0);
}
```
**검증**: `npm run build` 통과. 시각 변화 없음.

---

## Step 4: globals.css — 테두리/그림자/글래스 토큰 추가
**파일**: `src/app/globals.css`
**작업**: 테두리 3단계, 그림자 4단계, 글래스 토큰 추가
```css
:root {
  --border-subtle: oklch(0 0 0 / 6%);
  --border-default: oklch(0 0 0 / 10%);
  --border-strong: oklch(0 0 0 / 16%);
  --border-focus: oklch(0.45 0.16 162);
  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 5%);
  --shadow-medium: 0 2px 8px oklch(0 0 0 / 8%), 0 1px 2px oklch(0 0 0 / 4%);
  --shadow-elevated: 0 4px 16px oklch(0 0 0 / 10%), 0 2px 4px oklch(0 0 0 / 5%);
  --shadow-floating: 0 8px 32px oklch(0 0 0 / 12%), 0 4px 8px oklch(0 0 0 / 6%);
  --glass-bg: oklch(1 0 0 / 70%);
  --glass-border: oklch(0 0 0 / 8%);
  --glass-blur: 12px;
}
.dark {
  --border-subtle: oklch(1 0 0 / 6%);
  --border-default: oklch(1 0 0 / 10%);
  --border-strong: oklch(1 0 0 / 16%);
  --border-focus: oklch(0.72 0.17 162);
  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 20%);
  --shadow-medium: 0 2px 8px oklch(0 0 0 / 30%), 0 0 1px oklch(1 0 0 / 5%);
  --shadow-elevated: 0 4px 16px oklch(0 0 0 / 40%), 0 0 1px oklch(1 0 0 / 8%);
  --shadow-floating: 0 8px 32px oklch(0 0 0 / 50%), 0 0 1px oklch(1 0 0 / 10%);
  --glass-bg: oklch(0.17 0.005 260 / 60%);
  --glass-border: oklch(1 0 0 / 8%);
  --glass-blur: 16px;
}
```
**검증**: `npm run build` 통과. 시각 변화 없음.

---

## Step 5: globals.css — 브랜드/시맨틱 컬러 교체
**파일**: `src/app/globals.css`
**작업**: 기존 `--primary` hue 155→162 교체, 시맨틱 토큰 추가
- [ ] `:root`의 `--primary` oklch hue 155→162 변경
- [ ] `.dark`의 `--primary` oklch hue 155→162 변경
- [ ] `--primary-hover`, `--primary-muted` 추가
- [ ] `--success/--success-bg`, `--warning/--warning-bg`, `--danger/--danger-bg`, `--info/--info-bg` 추가 (다크/라이트)
- [ ] `--border-gradient-start`, `--border-gradient-end` 추가

**주의**: `--secondary`, `--accent`는 shadcn 컴포넌트에 영향. **이 단계에서는 변경하지 않음** — 의미 변경은 Step 16(shadcn variant 점검 후)에서.

**검증**: `npm run build` 통과. 프라이머리 색상 미세 변화 (155→162 hue shift) 시각 확인.

---

## Step 6: globals.css — 데이터 시각화 토큰 추가
**파일**: `src/app/globals.css`
**작업**:
- [ ] 차트 팔레트 `--chart-6/7/8` 추가 (기존 5개에 3개 추가)
- [ ] 히트맵 `--heatmap-1` ~ `--heatmap-9` 추가
- [ ] 인덱스 컬러 `--index-kospi/kosdaq/sp500/nasdaq/usdkrw` 추가
- [ ] 뱃지 컬러 (Market KR/US, Sector, News, ETF) 추가
- [ ] 시장 너비 `--breadth-advancing/declining/flat` 추가
- [ ] 센티먼트 `--sentiment-fear/neutral/greed` 추가
- [ ] 캐러셀 도트 `--dot-inactive/active` 추가

**검증**: `npm run build` 통과. 시각 변화 없음 (추가만).

---

## Step 7: globals.css — 트랜지션 타이밍 토큰 추가
**파일**: `src/app/globals.css`
**작업**:
```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
}
```
**검증**: `npm run build` 통과.

---

## Step 8: @theme inline 블록 확장
**파일**: `src/app/globals.css`
**작업**: `@theme inline` 블록에 새 토큰 등록
- [ ] `--color-bg-surface`, `--color-bg-elevated`, `--color-bg-floating` 등록
- [ ] `--shadow-*` 4종 등록
- [ ] `--color-chart-6/7/8` 등록
- [ ] `--color-heatmap-1` ~ `--color-heatmap-9` 등록
- [ ] 기존 stock 컬러 hex 유지 (`--color-stock-up: #e53e3e` 등 변경 없음)

**검증**: `npm run build` 통과. Tailwind 유틸리티 (`bg-bg-surface` 등) 사용 가능 확인.

---

## Step 9: 유틸리티 CSS 클래스 추가
**파일**: `src/app/globals.css` (`@layer base` 또는 `@layer utilities` 블록)
**작업**:
- [ ] `.font-price` (font-mono, bold, tabular-nums, -0.02em)
- [ ] `.card-default` (bg-card, border, rounded-xl, shadow-subtle)
- [ ] `.card-interactive` (card-default + hover:translateY(-1px) + active:translateY(0))
- [ ] `.card-stat` (card-default + border-left 3px + data-trend gradient)
- [ ] `.card-chart` (card-default + padding:0 + overflow:hidden)
- [ ] `.card-gradient-border` (::before pseudo + mask-composite)
- [ ] `.skeleton` shimmer 그래디언트 애니메이션 (@keyframes skeleton-shimmer)
- [ ] `.price-tick-up`, `.price-tick-down` (@keyframes, 1.5s)
- [ ] `.page-content` 진입 애니메이션 + `@media (prefers-reduced-motion: reduce)` 즉시 포함
- [ ] `:focus-visible` 포커스 링 (다크: 글로우, 라이트: 아웃라인)

**검증**: `npm run build` 통과.

---

## Step 10: 스켈레톤 업그레이드
**파일**: `src/components/ui/skeleton.tsx` (1파일)
**작업**: 기존 `animate-pulse` → shimmer 그래디언트로 교체
- [ ] `.skeleton` 클래스의 shimmer 활용하도록 변경
- [ ] 다크/라이트 별도 shimmer 색상 자동 적용 (CSS 변수 기반)

**검증**: 로딩 상태 페이지에서 shimmer 표시 확인.

---

## Step 11: 포커스 링 + prefers-reduced-motion 전역 적용
**파일**: `src/app/globals.css`
**작업**: `@layer base`에 전역 포커스/모션 감소 설정
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
**검증**: 브라우저 설정 변경 후 애니메이션 비활성 확인.

---

## Step 12: 헤더 글래스모피즘
**파일**: `src/components/layout/app-header.tsx` (1파일)
**작업**:
- [ ] 헤더 배경을 `bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--glass-border)]`로 변경
- [ ] 검색 바에 `⌘K` placeholder 힌트 추가

**검증**: 헤더 스크롤 시 블러 효과 표시. 데스크톱/모바일 확인.

---

## Step 13: 모바일 바텀탭 글래스모피즘
**파일**: `src/components/layout/bottom-tab-bar.tsx` (1파일)
**작업**:
- [ ] 배경 `bg-background/95 backdrop-blur-sm` 적용
- [ ] 활성 탭: `--fg-primary` 텍스트 + dot 인디케이터
- [ ] `pb-[env(safe-area-inset-bottom)]` iOS 대응

**검증**: 모바일 뷰에서 바텀탭 블러 + 활성 상태 확인.

---

## Step 14: 푸터 토큰 적용
**파일**: `src/components/layout/footer.tsx` (1파일)
**작업**: 배경 `var(--bg-surface)`, 텍스트 `var(--fg-tertiary)` 적용

**검증**: 푸터 다크/라이트 모드 색상 확인.

---

## Step 15: 페이지 컨테이너 배경 + 진입 애니메이션
**파일**: `src/components/layout/page-container.tsx` (1파일)
**작업**:
- [ ] 배경색 `var(--bg-base)` 적용
- [ ] `.page-content` 클래스 추가 (Step 9에서 정의한 애니메이션)

**검증**: 43개 페이지 중 주요 5개 확인 (홈, 시장, 종목상세, 관심종목, 뉴스).

---

## Step 16: shadcn secondary/accent 의미 점검 및 안전 변경
**파일**: `src/app/globals.css`
**작업**:
- [ ] `--secondary` 값을 현재 중립 회색으로 유지 (변경하지 않음)
- [ ] `--accent` 값을 현재 중립 회색으로 유지 (변경하지 않음)
- [ ] 대신 `--color-accent-gold: oklch(0.80 0.12 85)` 별도 토큰으로 추가
- [ ] `--color-secondary-blue: oklch(0.70 0.10 250)` 별도 토큰으로 추가
- [ ] 사용 시 `.card-stat`의 accent 등에서 새 토큰 참조

**근거**: shadcn Button/Badge/Tabs의 `secondary`/`accent` variant 깨짐 방지.
**검증**: shadcn 컴포넌트 (Button, Badge, Tabs, DropdownMenu) 전체 variant 시각 확인.

---

## Step 17: 시장 상태 뱃지 컴포넌트
**파일**: `src/components/layout/market-status-badge.tsx` (신규), `src/lib/utils/market-hours.ts` (신규)
**작업**:
- [ ] `isMarketOpen(market: 'KR' | 'US')`: KST 09:00-15:30 평일 / EST 09:30-16:00 평일 기반 판별
- [ ] 5가지 상태: 🟢장중(pulse), 🔴장마감, 🟡프리마켓, 🟡애프터마켓, ⚪휴장
- [ ] `text-xs font-medium`, `animate-pulse` (장중만)

**검증**: 현재 시간대에 맞는 상태 표시 확인.

---

## Step 18: 헤더에 시장 상태 뱃지 통합
**파일**: `src/components/layout/app-header.tsx` (수정)
**작업**: Step 17에서 만든 `MarketStatusBadge`를 헤더 네비와 검색 바 사이에 배치

**검증**: 데스크톱/모바일 헤더에서 뱃지 표시 확인.

---

## Step 19: 브레드크럼 컴포넌트
**파일**: `src/components/layout/breadcrumb-nav.tsx` (신규)
**작업**:
- [ ] props: `items: { label: string; href?: string }[]`
- [ ] `text-xs`, `--fg-tertiary`, Lucide `ChevronRight` 구분자
- [ ] 모바일: 3단계 초과 시 중간 "..." 생략

**검증**: 독립 테스트 (직접 import해서 표시).

---

## Step 20: 차트 색상 CSS 변수 기반 전환
**파일**: `src/components/stock/stock-chart.tsx`, `src/components/stock/compare-chart.tsx` (2파일)
**작업**:
- [ ] hex 하드코딩 → `getComputedStyle(document.documentElement).getPropertyValue('--border-default')` 등으로 전환
- [ ] 캔들 색상도 CSS 변수에서 읽기 (stock-up/down)
- [ ] `classList.contains("dark")` 감지는 유지 (Step 1에서 `.dark` 클래스 유지했으므로 호환)

**검증**: 다크/라이트 전환 시 차트 그리드/캔들/텍스트 색상 정상.

---

## Step 21: IndexCard 재설계
**파일**: `src/components/market/index-card.tsx` (1파일)
**작업**:
- [ ] `.card-stat` 적용 (방향성 좌측 3px 보더 + 그래디언트 배경)
- [ ] `data-trend="up"|"down"` 속성으로 상승/하락 스타일 분기
- [ ] 숫자에 `.font-price` 적용
- [ ] 변동값에 `.change-pill` 스타일 적용

**검증**: 홈페이지 + 시장 페이지에서 IndexCard 새 스타일 표시.

---

## Step 22: StockRow 하위 호환 업그레이드
**파일**: `src/components/market/stock-row.tsx` (1파일)
**작업**:
- [ ] `.card-interactive` 호버 효과 적용
- [ ] `showVolumeBar?: boolean` optional prop 추가 (기본 false)
- [ ] `showSparkline?: boolean` optional prop 추가 (기본 false)
- [ ] 거래량 바: 수평 div, 상대 너비, stock-up/down 색상 30% opacity
- [ ] 기존 5개 사용처 변경 없음 (optional prop 기본 false)

**검증**: 기존 사용처 (watchlist, etf, mypage) 시각 변화 없음 확인. popular-stocks-tabs에서 `showVolumeBar={true}` 전달 테스트.

---

## Step 23: 티커 테이프 컴포넌트
**파일**: `src/components/home/ticker-tape.tsx` (신규)
**작업**:
- [ ] props: `indices: Array<{ name, value, change, changePercent }>`, `exchangeRate: { rate, change }`
- [ ] 무한 수평 스크롤: 콘텐츠 2번 복제 + `@keyframes ticker { from { translateX(0) } to { translateX(-50%) } }`
- [ ] `var(--bg-surface)` 솔리드 배경, `font-mono text-xs tabular-nums`
- [ ] 색상: `var(--color-stock-up/down)` 적용
- [ ] 호버 시 `animation-play-state: paused`
- [ ] 클릭 → 각 지수 상세 링크
- [ ] `prefers-reduced-motion`: 정적 표시 (스크롤 정지)

**검증**: 독립 렌더링 테스트. 데이터 주입 후 스크롤 확인.

---

## Step 24: 환율 위젯 컴포넌트
**파일**: `src/components/home/exchange-rate-widget.tsx` (신규)
**작업**:
- [ ] props: `rates: Array<{ pair, rate, change, changePercent }>`
- [ ] `.card-stat` 적용, 방향성 색상
- [ ] USD/KRW, EUR/KRW, JPY/KRW 표시

**검증**: 독립 렌더링 테스트.

---

## Step 25: 퀵 액션 컴포넌트
**파일**: `src/components/home/quick-actions.tsx` (신규)
**작업**:
- [ ] 2×2 그리드: 스크리너(/screener), AI리포트(/reports), 종목비교(/compare), 투자가이드(/guide)
- [ ] `.card-interactive`, Lucide 아이콘 (BarChart3, FileText, GitCompareArrows, BookOpen — 기존 홈에서 사용 중)

**검증**: 독립 렌더링 + 링크 클릭 동작.

---

## Step 26: 홈페이지 CSS Grid 대시보드 레이아웃
**파일**: `src/app/page.tsx` (수정)
**작업**:
- [ ] 기존 HeroSection → 제거 (또는 히어로 영역을 티커테이프+지수카드로 교체)
- [ ] CompactIndexBar → 제거 (IndexCard로 대체)
- [ ] CSS Grid 적용:
  - 데스크톱: 4칼럼 (ticker 전폭 → idx 4등분 → hot+pulse 2+2 → news+pulse 2+2)
  - 태블릿: 2칼럼
  - 모바일: 1칼럼
- [ ] 티커 테이프 (Step 23) 배치
- [ ] 인기 종목에 `showVolumeBar={true}` 전달 (Step 22)
- [ ] 환율 위젯 (Step 24) 배치
- [ ] 퀵 액션 (Step 25) 배치
- [ ] 기존 QuickLinkGrid 교체/통합

**검증**: 홈페이지 데스크톱/태블릿/모바일 3단계 레이아웃 확인. 모든 데이터 정상 표시.

---

## Step 27: 뉴스 카드 스타일 개편
**파일**: 뉴스 카드 컴포넌트 (수정, 파일 위치 확인 필요)
**작업**:
- [ ] `.card-interactive` 호버 효과
- [ ] 카테고리 뱃지: 경제=`--info`, 기업=`--success`, 증시=`--color-accent-gold`, 해외=`--chart-3`
- [ ] 관련 종목 클릭 링크 강화

**검증**: 홈페이지 + 뉴스 페이지에서 뉴스 카드 새 스타일.

---

## Step 28: 데이터 레이어 — 시장 쿼리 추가
**파일**: `src/lib/queries.ts` (수정)
**작업**:
- [ ] `getSectorPerformance(market)`: Stock JOIN Sector → GROUP BY sector, AVG(changePercent), SUM(marketCap)
- [ ] `getMarketBreadth(market)`: 전체 종목 상승/보합/하락 COUNT, 상한가/하한가 COUNT
- [ ] `getTopMovers(market, limit=10)`: 기존 `getMarketMovers` 확장 (limit 파라미터 추가)

**참고**: Prisma 스키마 변경 없음. Stock 모델의 `changePercent`, `marketCap` 컬럼 사용.
**검증**: 쿼리 함수 직접 호출 테스트 (임시 API 라우트 또는 seed 스크립트).

---

## Step 29: 섹터 히트맵 컴포넌트
**파일**: `src/components/market/sector-heatmap.tsx` (신규)
**작업**:
- [ ] props: `sectors: Array<{ name, changePercent, marketCap }>`
- [ ] CSS Grid: `grid-template-columns` 시가총액 비율로 계산
- [ ] `--heatmap-1` ~ `--heatmap-9` 색상 매핑 (-4%이하 ~ +4%이상)
- [ ] 호버: 종목 수 + 시가총액 + 대장주 툴팁
- [ ] 클릭: `/sectors/[name]`
- [ ] 모바일 (<768px): 수평 색상 바 차트로 전환

**검증**: 독립 렌더링 + 다크/라이트 색상 확인.

---

## Step 30: 시장 너비 바 컴포넌트
**파일**: `src/components/market/market-breadth-bar.tsx` (신규)
**작업**:
- [ ] props: `advancing: number, declining: number, flat: number, limitUp: number, limitDown: number`
- [ ] 스택드 바: `--breadth-advancing/flat/declining` 색상
- [ ] 로드 시 너비 애니메이션 (400ms ease-out)
- [ ] 하단 텍스트: "상한가 X · 하한가 Y · 보합 Z"

**검증**: 독립 렌더링.

---

## Step 31: 모멘텀 바 컴포넌트
**파일**: `src/components/market/momentum-bars.tsx` (신규)
**작업**:
- [ ] props: `gainers: Array<{ name, ticker, changePercent }>`, `losers` 동일
- [ ] 2칼럼, 수평 바 비례 채움
- [ ] `--color-stock-up/down` 30% opacity

**검증**: 독립 렌더링.

---

## Step 32: 시장 페이지 레이아웃 재구성
**파일**: `src/app/market/page.tsx` (수정)
**작업**:
- [ ] CSS Grid: index-row → market-tabs(KR/US) → treemap → breadth → movers → table
- [ ] KR/US 탭: URL `?market=kr|us`, 콘텐츠 크로스페이드 150ms
- [ ] Step 28 쿼리 결과를 Step 29/30/31 컴포넌트에 전달
- [ ] 반응형: 태블릿 2칼럼, 모바일 1칼럼

**검증**: 시장 페이지 데스크톱/태블릿/모바일 + KR/US 전환.

---

## Step 33: 정렬 가능 종목 테이블
**파일**: `src/components/market/stock-table.tsx` (신규)
**작업**:
- [ ] 칼럼: 종목명, 현재가, 등락률, 거래량, 시가총액, 7일 차트
- [ ] 칼럼 헤더 클릭 정렬 (useState로 sortKey/sortDir 관리)
- [ ] `font-mono tabular-nums` 숫자 정렬
- [ ] 고정 헤더 (sticky), 20개/페이지 페이지네이션
- [ ] 모바일: overflow-x-auto + 첫 칼럼 sticky + 우측 그림자 힌트

**검증**: 시장 페이지에서 정렬/페이지네이션 동작.

---

## Step 34: 종목 상세 — StockTabs 구조 리팩토링
**파일**: `src/app/stock/[ticker]/page.tsx`, `stock-tabs.tsx` (2파일)
**작업**:
- [ ] 차트를 StockTabs 바깥으로 분리 → 독립 차트 히어로 영역
- [ ] StockTabs → 차트 탭 제거, 나머지 탭(개요/재무/뉴스/이벤트)만 유지
- [ ] Suspense/HydrationBoundary 재배치
- [ ] 기존 기능 유지 확인

**검증**: 종목 상세 페이지 기존 기능 전부 동작 (탭 전환, 차트, 데이터).

---

## Step 35: 종목 상세 — CSS Grid 레이아웃
**파일**: `src/app/stock/[ticker]/page.tsx` (수정)
**작업**:
- [ ] CSS Grid: `grid-template-columns: 1fr 320px`
- [ ] `grid-template-areas: "header header" "chart sidebar" "tabs tabs"`
- [ ] 차트: `min-height: 400px; height: 60vh; max-height: 600px`
- [ ] 태블릿: 1칼럼 (사이드바 아래로)
- [ ] 모바일: 차트 풀 블리드 `margin: 0 -16px; width: calc(100% + 32px)`

**검증**: 종목 상세 반응형 3단계.

---

## Step 36: 종목 상세 — 사이드바 패널
**파일**: `src/components/stock/stock-sidebar.tsx` (신규)
**작업**:
- [ ] 핵심 통계 그리드: 2칼럼, `.card-default`, `font-mono tabular-nums`
- [ ] 52주 레인지: 수평 바 + 현재 가격 dot
- [ ] 관련 종목: 같은 섹터 3-5개 (링크)
- [ ] `position: sticky; top: 80px; max-height: calc(100vh - 96px); overflow-y: auto`

**검증**: 사이드바 스크롤 독립 동작 + 반응형.

---

## Step 37: 종목 상세 — 헤더 재설계
**파일**: `src/app/stock/[ticker]/page.tsx` (수정)
**작업**:
- [ ] 가격: `text-4xl font-price`, 방향성 색상
- [ ] 변동: `.change-pill` + 화살표
- [ ] OHLV: `text-sm font-mono` 컴팩트 수평 라인
- [ ] 브레드크럼 (Step 19) 추가: "주식 > [종목명] ([티커])"
- [ ] 탭 전환 페이드 `transition-opacity duration-150`

**검증**: 종목 상세 헤더 + 탭 전환 + 브레드크럼.

---

## Step 38: 가격 틱 애니메이션 훅
**파일**: `src/hooks/use-price-tick.ts` (신규)
**작업**:
```tsx
export function usePriceTick(current: number, prev: number) {
  const direction = current > prev ? 'up' : current < prev ? 'down' : null;
  return direction ? `price-tick-${direction}` : '';
}
```
- [ ] IndexCard, StockRow, 종목 헤더에 적용

**검증**: 가격 변경 시 플래시 애니메이션.

---

## Step 39: Gradient Border 카드 적용
**파일**: `src/components/market/popular-stocks-tabs.tsx` (수정)
**작업**:
- [ ] 인기 종목 Top 3에 `.card-gradient-border` 클래스 적용

**검증**: 홈페이지 인기 종목 Top 3 그래디언트 보더 표시.

---

## Step 40: 최종 검증 + 빌드
**작업**:
- [ ] `npm run build` 성공
- [ ] 다크 모드 기본, 라이트 모드 전환 정상
- [ ] 빨강=상승, 파랑=하락 유지
- [ ] 반응형 3단계 (375/768/1280)
- [ ] `prefers-reduced-motion` 비활성
- [ ] 기존 기능 (관심종목, 로그인, 검색) 정상
- [ ] 범위 밖 페이지 (watchlist, news, screener, reports) 시각적 이상 없음

---

## 의존성 그래프

```
Step 1 (ThemeProvider)
  └→ Step 2~7 (토큰 추가, 각각 독립)
       └→ Step 8 (@theme inline)
            └→ Step 9 (유틸리티 CSS)
                 ├→ Step 10 (스켈레톤)
                 ├→ Step 11 (reduced-motion)
                 ├→ Step 12 (헤더 글래스)
                 ├→ Step 13 (바텀탭 글래스)
                 ├→ Step 14 (푸터)
                 ├→ Step 15 (페이지 컨테이너)
                 ├→ Step 16 (shadcn 점검)
                 ├→ Step 17→18 (시장 상태 뱃지)
                 ├→ Step 19 (브레드크럼)
                 ├→ Step 20 (차트 색상)
                 ├→ Step 21 (IndexCard)
                 ├→ Step 22 (StockRow)
                 │    ├→ Step 23 (티커 테이프)
                 │    ├→ Step 24 (환율 위젯)
                 │    ├→ Step 25 (퀵 액션)
                 │    └→ Step 26 (홈페이지 레이아웃) ← 23,24,25 합류
                 │         └→ Step 27 (뉴스 카드)
                 │              └→ Step 39 (gradient border)
                 ├→ Step 28 (데이터 쿼리)
                 │    ├→ Step 29 (히트맵)
                 │    ├→ Step 30 (시장너비바)
                 │    ├→ Step 31 (모멘텀바)
                 │    └→ Step 32 (시장 레이아웃) ← 29,30,31 합류
                 │         └→ Step 33 (종목 테이블)
                 └→ Step 34 (StockTabs 리팩토링)
                      └→ Step 35 (종목 Grid)
                           ├→ Step 36 (사이드바)
                           └→ Step 37 (헤더 재설계)
                                └→ Step 38 (가격 틱)
                                     └→ Step 40 (최종 검증)
```

**병렬 가능 구간**:
- Step 2~7: 전부 독립 (토큰 추가만)
- Step 10~22: 전부 독립 (Step 9 완료 후)
- Step 23~27 (홈) / Step 28~33 (시장) / Step 34~37 (종목): 3갈래 병렬

---

## 변경하지 않는 것
- Next.js App Router 구조
- Prisma 스키마
- 인증 (NextAuth)
- 데이터 소스 (Naver, Yahoo, RSS)
- lightweight-charts 라이브러리 (색상 전달만 수정)
- shadcn/ui 컴포넌트 구조 (스타일만 변경)
- `dark:` Tailwind 유틸리티 (`.dark` 클래스 유지)
- `--secondary`, `--accent` shadcn 기본값 (별도 토큰으로 분리)
- 주식 컬러 hex 값 (oklch 전환 안 함, 호환성)

## 범위 밖 (후속)
- 시장 심리 게이지 (데이터 소스 미정)
- 섹터 미니 히트맵 (Step 29 히트맵 완성 후 축소판)
- 사이드바 네비게이션
- 풀투리프레시, 스티키 CTA
- 모바일 IndexCard 캐러셀 (scroll-snap)
- WebSocket 실시간
