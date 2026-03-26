# 프론트엔드 개발자 분석: UX 기획 검토

> 분석일: 2026-03-26 | 분석자: 프론트엔드 개발자 (dev-frontend)
> 검토 대상: 02-ux-analysis.md, spec-navigation-redesign.md, 04-reform-plan.md, pm-review-free-alternatives.md

---

## 1. 네비게이션 재설계 구현 분석

### 1.1 데스크톱 메가메뉴

**현재 코드 구조 확인** (`app-header.tsx`):
- `navLinks` 배열에 8개 플랫 링크 정의 (23~32행)
- `nav` 요소에서 `hidden lg:flex`로 데스크톱만 노출 (50행)
- 활성 상태: `pathname === link.href` — exact match만 사용 중
- 모든 링크가 동일한 `px-3 py-1.5 rounded-md text-sm` 스타일
- Sheet(모바일 햄버거)도 동일 `navLinks` 배열 재사용 (127행)

**shadcn/ui NavigationMenu 사용 가능 여부**:
- **미설치 상태**. `components/ui/` 디렉토리에 `navigation-menu.tsx` 파일 없음
- 현재 사용 가능한 관련 컴포넌트: `dropdown-menu.tsx`, `popover.tsx`
- NavigationMenu는 `npx shadcn@latest add navigation-menu`로 추가 필요 (Radix UI 기반)

**구현 방안**:
- **방안 A (권장): NavigationMenu 추가 설치**
  - shadcn/ui의 NavigationMenu는 Radix `@radix-ui/react-navigation-menu` 기반
  - 호버 시 드롭다운, 키보드 접근성, 포커스 관리 내장
  - 기존 `app-header.tsx`의 `<nav>` 섹션만 교체하면 되며, Sheet 부분은 별도 구조 유지
  - 예상 추가 의존성: `@radix-ui/react-navigation-menu` (~30KB gzipped)

- **방안 B: 기존 DropdownMenu 활용**
  - 이미 설치된 `dropdown-menu.tsx` 사용
  - 단, DropdownMenu는 클릭 트리거 기반이라 호버 동작에 별도 로직 필요
  - NavigationMenu보다 접근성/UX 면에서 열위

**구현 난이도**: 중상 (NavigationMenu 설치 + 메뉴 구조 변경 + 활성 상태 로직 변경)

**예상 시간**: 2~3시간
- 기획서의 "60분" 추정은 NavigationMenu 설치/설정 시간과 반응형 테스트를 과소평가함
- 드롭다운 내부 섹션 헤더(투자 정보, 캘린더 등) 스타일링 + 섹션 구분선 추가 필요
- 활성 상태 로직이 단순 exact match에서 prefix match + 그룹핑으로 변경되므로 테스트 케이스 다수

**기획에서 누락된 부분**:
1. **호버 딜레이**: 마우스가 메뉴 사이를 이동할 때 의도치 않은 열림/닫힘 방지를 위한 딜레이 설정. NavigationMenu는 `delayDuration` prop으로 지원하지만, 값 튜닝 필요
2. **키보드 내비게이션**: NavigationMenu는 기본 지원하나, 커스텀 구조 시 `aria-expanded`, `aria-haspopup` 수동 관리 필요
3. **모바일/데스크톱 분기**: 현재 `lg:` 브레이크포인트(1024px)에서 전환. 메가메뉴 도입 시 드롭다운이 화면 밖으로 나가지 않도록 `xl:`(1280px)로 상향 검토 필요. 5개 카테고리 + 검색바 + 테마 + 로그인이 1024px에 들어가는지 확인 필요
4. **"홈" 링크의 위치**: 기획서에서는 메가메뉴에 "홈"을 포함하지만, 로고 클릭이 이미 홈으로 이동하므로 중복. "홈" 제거하고 4개 카테고리(투자/분석/뉴스/더보기)로 축소하는 것이 더 깔끔

### 1.2 모바일 BottomTabBar 5탭

**현재 코드 구조 확인** (`bottom-tab-bar.tsx`):
- 4개 탭 정의 (8~13행): Home, Globe, Newspaper, User 아이콘
- 활성 상태: MY 탭만 prefix match (`/mypage`, `/watchlist`, `/settings`), 나머지는 exact match (21~23행)
- 높이: `h-14` (56px), `lg:hidden` (1024px 이상 숨김)
- `fixed bottom-0 left-0 right-0 z-50` — 하단 고정

**5탭 변경 시 실제 코드 변경 범위**:
- `tabs` 배열에 1개 항목 추가 + 각 탭의 `isActive` 함수 변경
- 아이콘 import 추가 (`TrendingUp`, `BarChart3` from lucide-react)
- **매우 간단한 변경** — 기획서의 "15분" 추정이 적절

**활성 상태 로직 검증**:
- 기획서 제안: `분석` 탭이 `/screener`, `/reports`, `/compare`, `/guide`, `/stock/`에서 활성화
- **우려**: `/stock/[ticker]`를 "분석" 탭에 넣는 것이 사용자 직관에 맞는지 의문. 사용자가 종목 상세를 볼 때 "분석" 탭이 하이라이트되면 혼란 가능. 종목 상세는 어느 탭에서든 진입 가능하므로, 차라리 **어떤 탭도 활성화하지 않거나** 진입 경로에 따라 활성 탭을 결정하는 것이 적절
- `/stock/` prefix match는 모든 종목 상세 페이지에 적용되어 범위가 너무 넓음

**"분석" 탭이 `/screener`로 가는 것의 UX 적절성**:
- `/screener`는 이미 특정 기능 페이지. "분석" 탭의 랜딩으로는 부적절할 수 있음
- **대안 제안**: "분석" 탭 클릭 시 스크리너 대신 "분석 도구 허브" 역할을 하는 간단한 중간 페이지(`/tools`) 또는 `/screener` 상단에 퀵 링크 카드를 추가하여 허브 역할 부여
- 기획서의 "방안 A: 각 탭 랜딩 페이지에 퀵 링크 카드" 접근이 현실적

### 1.3 모바일 Sheet 메뉴 그룹핑

**현재 Sheet 구현 확인** (`app-header.tsx:118-144`):
- `Sheet` side="right", `SheetContent` className="w-72" (288px)
- 내부 구조: `SearchBar` + `navLinks.map()` (8개 수직 나열) + 로그인/회원가입
- 그룹핑, 섹션 헤더, 구분선 없음
- Sheet 닫기: 각 Link에 `onClick={() => setSheetOpen(false)}` 수동 처리

**그룹핑 구현 방식 제안**:

```tsx
// navLinks를 그룹 구조로 변경
const navGroups = [
  {
    label: "투자 정보",
    links: [
      { href: "/market", label: "시장 개요" },
      { href: "/etf", label: "ETF" },
      { href: "/sectors", label: "섹터별 종목" },
      { href: "/dividends", label: "배당 캘린더" },
      { href: "/earnings", label: "실적 캘린더" },
    ],
  },
  {
    label: "분석 도구",
    links: [
      { href: "/screener", label: "스크리너" },
      { href: "/reports", label: "AI 리포트" },
      { href: "/compare", label: "종목 비교" },
      { href: "/guide", label: "투자 가이드" },
    ],
  },
  // ...
]
```

- 섹션 헤더: `text-xs font-semibold text-muted-foreground uppercase tracking-wider`
- `Separator` 컴포넌트(이미 설치됨)로 그룹 간 구분
- 현재 Sheet의 `w-72`(288px)는 그룹핑 후에도 충분한 너비
- **예상 시간**: 30~45분 (기획서 30분 추정 적절)

---

## 2. 홈페이지 개편 구현 분석

### 2.1 현재 홈페이지 구조 확인

**실제 코드 기반 구조** (`page.tsx`):
```
1. h1: "한국/미국 주식 시세" (114행)
2. 주요 지수: IndexGroups — KR(KOSPI, KOSDAQ) 2x1 + US(SPX, IXIC) 2x1 → md 이상에서 2열 (117~128행)
3. 환율: IndexCard 5개 — 2열(모바일) / 3열(md) / 5열(lg) 그리드 (131~156행)
4. 인기 종목(PopularStocksTabs) + 최신 뉴스(LatestNewsSection) — lg 이상에서 2열 (158~183행)
5. AdSlot "home-bottom" (185행)
```

**기획서 현황 분석 검증**:
- 기획서: "주요 지수 2x2 그리드" → **부정확**. 실제는 KR 2개 + US 2개가 `grid-cols-1 md:grid-cols-2`로 배치. 모바일에서는 KR 2개 1줄 + US 2개 1줄 = 총 2줄
- 기획서: "환율 5개" → **정확**. USD, EUR, JPY, CNY, GBP
- 기획서: "인기 종목 10개" → **정확**. `getPopularStocks("KR", 10)`, `getPopularStocks("US", 10)` (106~107행)
- 기획서: "최신 뉴스 4개" → **정확**. `getLatestNews(4)` (78행)
- 기획서: "광고 배너" → **정확**. 최하단에 AdSlot 1개

### 2.2 히어로 섹션 구현

**첫 방문자 감지 방식**:
- **localStorage 방식 (권장)**: `localStorage.getItem("sv_visited")` 체크
  - 장점: 클라이언트 사이드만으로 동작, 서버 부담 없음
  - 단점: SSR 시 hydration mismatch 발생 가능 → `useEffect`에서 상태 설정 필요
  - 구현: 히어로 섹션을 Client Component로 분리, `useState` + `useEffect`로 초기 표시 후 localStorage 플래그 설정

- **Cookie 방식**: `next/headers`의 cookies()로 서버에서 감지 가능
  - 장점: SSR에서 즉시 판단, hydration mismatch 없음
  - 단점: 현재 홈페이지가 `revalidate = 900` ISR — 쿠키 기반 분기는 ISR 캐싱과 충돌 (사용자별 다른 HTML 필요)
  - **ISR 구조와 비호환** → localStorage 방식이 유일한 선택

**로그인 후 숨김 처리**:
- `useSession()`으로 로그인 여부 확인 가능 (이미 `app-header.tsx`에서 사용 중)
- 단, 홈페이지는 현재 **Server Component**. 히어로 섹션을 Client Component로 분리해야 함
- `<HeroSection />` Client Component 신규 생성 필요

**SEO 영향**:
- 히어로 섹션이 localStorage/세션 기반으로 조건부 렌더링되면 **검색 엔진 크롤러에게는 항상 보임** (JS 미실행 시 기본 상태)
- h1 텍스트 변경 시 SEO 키워드 영향 있을 수 있음. 현재 "한국/미국 주식 시세"는 검색 의도에 잘 맞는 텍스트 → 히어로 추가 시에도 h1은 유지하고, 히어로는 별도 영역으로 배치 권장

### 2.3 퀵 액세스 카드

**컴포넌트 설계**:
- 재사용 가능한 `QuickLinkCard` 컴포넌트 신규 생성
- Props: `href`, `icon` (LucideIcon), `label`, `description?`
- 홈, 시장, 스크리너 페이지에서 공통 사용 가능 (기획서의 `quick-links.tsx` 제안과 일치)

**반응형 레이아웃**:
- 모바일: `grid-cols-2` (2x2)
- 데스크톱: `grid-cols-4` (1x4)
- 각 카드: `border rounded-lg p-4 hover:shadow-md transition-shadow` — 기존 Card 디자인 언어와 일관

**예상 시간**: 30분 (기획서의 "퀵 링크 카드 컴포넌트 30분" + "페이지 적용 30분" = 60분 추정이 적절)

### 2.4 지수+환율 컴팩트 바

**현재 구조**:
- 지수: `IndexCard` 4개 (2x2 → md에서 4x1 느낌)
- 환율: `IndexCard` 5개 (2열 → 3열 → 5열)
- 총 모바일 높이: 약 250~300px (IndexCard 높이 ~90px x 4줄)

**1줄 압축 방안**:
- 기획서 제안: "KOSPI 2,650.32 +0.5% | KOSDAQ 850.12 -0.3% | S&P 2,650 | USD/KRW 1,380.5"
- **기술적 이슈**: 모바일 375px에서 이 정보를 1줄에 넣으면 매우 작거나 가로 스크롤 필요
- **대안 제안**:
  - 모바일: 가로 스크롤 가능한 `flex overflow-x-auto` 바 (Ticker tape 스타일)
  - 데스크톱: `flex items-center justify-between` 1줄 인라인
  - 환율은 USD/KRW만 인라인 표시, 나머지는 "더보기" 또는 별도 섹션
- **현재 IndexCard 컴포넌트 재사용 불가** — 새로운 컴팩트 표시 컴포넌트 필요 (`CompactIndexBar` 등)
- **예상 시간**: 1~1.5시간 (신규 컴포넌트 + 반응형 + 기존 IndexCard 섹션 교체)

---

## 3. 종목 상세 페이지 개편 분석

### 3.1 광고 위치 이동

**현재 코드** (`page.tsx:175`):
```tsx
<Breadcrumb items={[...]} />
<AdSlot slot="stock-detail-mid" format="rectangle" className="mx-4 md:mx-6 my-4" />
<StockTabs ... />
```

**이동 구현**:
- `<AdSlot>` 줄을 `<StockTabs>` 아래, `<AdDisclaimer>` 위로 이동 — **1줄 코드 이동**
- 또는 `StockTabs` 내부의 탭 콘텐츠 아래에 배치하려면 `StockTabs`에 `adSlot` prop 추가 필요

**실제 코드 변경 범위**: 극히 작음 (5분)

**광고 수익 영향 우려**:
- 광고가 첫 화면(above the fold)에서 벗어나면 노출률/클릭률 하락 가능
- 단, 현재 `format="rectangle"` (300x250 또는 유사)이 콘텐츠를 가로막는 것은 사용자 이탈의 원인이 될 수 있어, 장기적으로 아래 배치가 나을 수 있음
- **PM과 논의 필요**: 광고 수익 vs 사용자 경험 트레이드오프

### 3.2 탭 6→4개 통합

**현재 탭 구조** (`stock-tabs.tsx:197~205`):
```tsx
<TabsTrigger value="chart">차트</TabsTrigger>
<TabsTrigger value="info">시세</TabsTrigger>
<TabsTrigger value="news">뉴스</TabsTrigger>
{stock.market === "KR" && <TabsTrigger value="disclosure">공시</TabsTrigger>}
<TabsTrigger value="dividend">배당</TabsTrigger>
<TabsTrigger value="earnings">실적</TabsTrigger>
```
- KR 종목: 6개 탭 (차트/시세/뉴스/공시/배당/실적)
- US 종목: 5개 탭 (공시 제외)

**"정보" 탭과 "이벤트" 탭 통합의 구체적 구현 방안**:

기획서 제안: `[차트] [정보] [뉴스] [이벤트]` (4개)
- 정보 탭 = 시세 + 기업 개요 + 펀더멘탈 통합
- 이벤트 탭 = 공시 + 배당 + 실적 통합 (서브탭 또는 아코디언)

**Server Component 구조에서의 탭 통합 이슈**:
- 현재 각 탭 콘텐츠는 **Server Component slot 패턴** 사용 (page.tsx에서 각 TabServer를 Suspense로 감싸서 slot prop으로 전달)
- "이벤트" 탭 통합 시:
  - `page.tsx`에서 `disclosureSlot`, `dividendSlot`, `earningsSlot`을 하나의 `eventSlot`으로 묶어야 함
  - 이벤트 탭 내부에서 서브탭/아코디언으로 3개 슬롯을 배치하는 래퍼 컴포넌트 필요
  - **중요**: 서브탭 전환도 클라이언트 사이드. 현재는 각 slot이 탭 전환 시에만 마운트되는데, 통합 시 3개 슬롯이 동시 마운트되어 초기 로딩 증가 가능
  - **해결책**: 이벤트 탭 내부에서 아코디언 사용 시 `Collapsible` 패턴으로 각 섹션을 lazy 표시. 또는 서브탭을 사용하되, 비활성 서브탭은 `display: none`으로 처리 (이미 `TabsContent`가 이 방식)

- "정보" 탭 통합:
  - 현재 `stock-tabs.tsx`의 "기업 개요" 섹션(180~194행)을 "정보" 탭 내부로 이동
  - `infoSlot`에 기업 개요 텍스트를 포함시키거나, StockTabs 내부에서 정보 탭 선택 시 기업 개요 + infoSlot 합산 렌더링

**예상 시간**: 2~3시간 (슬롯 구조 변경 + 래퍼 컴포넌트 + 서브탭/아코디언 + 테스트)
- 기획서에서는 구체적 시간 미명시. "난이도 중"으로만 표기

### 3.3 차트 컨트롤 기본/고급 분리

**현재 chart-controls 코드 확인** (`chart-controls.tsx`):
- 1행: 기간 선택 — 7개 버튼 (1W, 2W, 3W, 1M, 3M, 6M, 1Y)
- 2행: 오버레이 지표 — SMA, EMA + BB, KC, Pivot, Fib, SAR, 패턴, HA = **9개 토글**
- 3행: 서브 패널 — MACD, RSI, Stoch, OBV, ATR, ROC, MFI, A/D, ADX = **9개 토글**
- 총 **25개 컨트롤**이 `flex-wrap`으로 렌더링
- Props로 18개의 상태/핸들러를 받음 (40~62행) — props 수가 매우 많음

**토글 방식 구현**:
```tsx
// 기본 모드: 기간만 표시
// 고급 모드: 기존 전체 표시
const [advancedMode, setAdvancedMode] = useState(false)

// 기간 선택 (항상 표시, 단 기본 모드에서는 축소)
// 기본: [1주] [1개월] [3개월] [1년] (4개)
// 고급: [1주] [2주] [3주] [1개월] [3개월] [6개월] [1년] (7개)

{advancedMode && (
  <>
    {/* 오버레이 */}
    {/* 패널 */}
  </>
)}
<button onClick={() => setAdvancedMode(!advancedMode)}>
  {advancedMode ? "간단히" : "지표 더보기"}
</button>
```

**구현 고려사항**:
- `advancedMode` 상태를 localStorage에 저장하여 사용자 선호 유지
- 기본 모드 기간 버튼을 4개로 축소하면 `ChartPeriod` 타입/기존 로직에 영향 없음 (비활성 기간은 고급 모드에서만 선택 가능)
- `ChartControls` props 수가 18개로 과도 — 이 기회에 `ChartControlsState` 객체로 통합하면 유지보수성 향상

**예상 시간**: 45분~1시간

---

## 4. 브랜드 컬러 도입 분석

### 4.1 현재 CSS 변수 체계 확인

**globals.css 분석**:
- oklch 기반 색상 시스템 사용 (Tailwind CSS 4 + shadcn 표준)
- Light mode `--primary: oklch(0.205 0 0)` — chroma 0 = **완전 무채색 (거의 검정)**
- Dark mode `--primary: oklch(0.922 0 0)` — **거의 흰색**
- 모든 `--primary` 관련 요소(버튼, 링크, 탭 활성 등)가 흑/백
- Stock 색상: `--color-stock-up: #e53e3e` (빨강), `--color-stock-down: #3182ce` (파랑) — hex 직접 지정
- chart-1~5: oklch 기반 파란색 계열 (hue ~260도)

**브랜드 컬러 추가 시 변경 범위**:

1. **globals.css 수정** (2개소):
   - `:root`의 `--primary` 값 변경 (예: `oklch(0.45 0.15 250)` — 딥 블루)
   - `.dark`의 `--primary` 값 변경 (예: `oklch(0.75 0.12 250)` — 밝은 블루)
   - `--primary-foreground`도 가독성 확보를 위해 조정 필요

2. **영향 범위 분석**:
   - `text-primary`: 링크, 탭 활성 텍스트, 각종 강조 텍스트 → 모두 브랜드 색으로 변경됨
   - `bg-primary`: 회원가입 버튼, CTA 버튼 → 브랜드 색 배경으로 변경됨
   - `border-primary/50`: 차트 컨트롤 토글 활성 테두리
   - **주의**: `text-primary`가 현재 검정(light) / 흰색(dark)인데, 브랜드 색으로 바뀌면 본문 텍스트와의 시각적 차이가 생김 → 이것이 기획 의도와 일치
   - **위험**: stock-up(빨강)과 stock-down(파랑) 색상과 브랜드 색상이 충돌하지 않도록 hue 선택 주의. 파랑 계열 브랜드라면 stock-down과 유사해질 수 있음
   - **제안**: 브랜드 색상으로 **초록 계열** (`oklch(0.55 0.15 145)`) 또는 **보라 계열** (`oklch(0.50 0.15 300)`)이 주식 빨강/파랑과 구분됨

3. **코드 변경량**: globals.css 4~6줄 수정으로 완료. **매우 적은 변경으로 전체 서비스 톤 변경 가능**
   - 다만 변경 후 모든 페이지의 시각적 확인 필요 (QA 시간이 구현보다 오래 걸림)

---

## 5. 기획 검토 의견

### 5.1 동의하는 부분

1. **BottomTabBar 5탭 확장** — 가장 비용 대비 효과가 큰 변경. 코드 변경량 최소, 모바일 접근성 대폭 개선
2. **숨겨진 페이지 네비게이션 노출** — 5개 페이지가 완전히 고립된 것은 명백한 결함. Sheet 그룹핑으로 즉시 해결 가능
3. **광고 위치 이동** — 1줄 코드 이동으로 UX 개선. 즉시 실행 가능
4. **차트 컨트롤 기본/고급 분리** — 25개 토글이 초보자에게 과도한 것은 사실. 토글 구현도 간단
5. **Compare 페이지 API 버그** (`/api/stock/` → `/api/stocks/`) — 기능이 아예 작동하지 않는 심각한 버그. 최우선 수정
6. **홈페이지 퀵 액세스 카드** — 숨겨진 기능의 발견성 해결에 효과적

### 5.2 우려 사항

1. **시간 추정의 현실성**:
   - 기획서: 네비게이션 재설계 전체 "~3시간"
   - 실제 예상: **5~7시간** (NavigationMenu 설치/학습, 반응형 테스트, 활성 상태 엣지케이스, Sheet 그룹핑, BottomTabBar)
   - 특히 메가메뉴는 호버 동작, 접근성, 반응형 전환 등 엣지케이스가 많음

2. **"분석" 탭의 `/stock/[ticker]` 포함**:
   - 종목 상세는 다양한 경로(홈 인기종목, 시장, 검색, 뉴스 등)에서 진입
   - 특정 탭에 귀속시키면 사용자 혼란 유발
   - **제안**: `/stock/` 경로는 어떤 탭에도 활성화하지 않음

3. **탭 6→4개 통합의 정보 밀도**:
   - "이벤트" 탭에 공시+배당+실적 3개를 통합하면 탭 내부가 길어짐
   - 특히 KR 종목의 공시 목록은 길 수 있음
   - 서브탭 방식이 아코디언보다 적절 (각 영역의 독립성 유지)

4. **히어로 섹션의 ISR 호환성**:
   - 홈페이지 `revalidate = 900` ISR 사용 중
   - 히어로 표시/숨김을 Client Component로 분리하면 ISR 캐시된 HTML에는 항상 히어로가 포함되고, 클라이언트에서 조건부로 숨김 → **CLS(Cumulative Layout Shift)** 발생 가능
   - **해결책**: 히어로 영역에 고정 높이를 설정하거나, 숨김 시 투명에서 콘텐츠로 fade-in 애니메이션

5. **환율 5개 → USD만 노출의 데이터 영향**:
   - 환율 데이터는 이미 수집 중 (크론). 노출하지 않아도 수집은 계속됨
   - 단, EUR/JPY/CNY/GBP 환율을 완전히 숨기면 해당 통화 관심 사용자 이탈 가능
   - **제안**: 기본 1줄에 USD만 표시 + "환율 더보기" 토글로 5개 전체 노출

6. **NavigationMenu 미설치 상태**:
   - 기획서에서 "shadcn/ui에 포함"이라고 했으나, 실제 프로젝트에 NavigationMenu가 **설치되어 있지 않음**
   - `npx shadcn@latest add navigation-menu` 실행 필요
   - Radix 의존성 추가로 번들 사이즈 소폭 증가 (~30KB gzipped, tree-shaking 적용 시 더 적음)

### 5.3 대안 제안

1. **메가메뉴 대신 2단 네비게이션**:
   - UX 기획서의 "안 B: 2단 네비게이션"이 구현 복잡도 면에서 더 유리
   - 1단: 5개 카테고리 링크 (기존 방식과 동일한 링크 형태)
   - 2단: 선택된 카테고리의 서브 링크 (조건부 렌더링)
   - NavigationMenu 추가 설치 불필요, 기존 컴포넌트만으로 구현 가능
   - **단점**: 높이 40px 추가로 콘텐츠 영역 감소 (기획서에서도 언급)
   - **장점**: 호버 로직 불필요, 모바일 전환 단순, 현재 URL 기반 서브내비 자동 표시

2. **종목 비교 모바일 대응**:
   - 기획서의 "카드형 레이아웃" 대신 **가로 스크롤 테이블** 방식이 더 적은 변경으로 구현 가능
   - `overflow-x-auto` + `min-w-[500px]` 로 테이블 유지하면서 모바일에서 스크롤
   - 카드형 전환은 별도 컴포넌트 개발 필요 → 공수 대비 효과 검토 필요

3. **차트 컨트롤 Props 리팩토링**:
   - 현재 18개 props → `useChartControls()` 커스텀 훅으로 상태 관리 통합
   - 기본/고급 모드 분리와 함께 진행하면 효율적

### 5.4 추가 제안

1. **Compare 페이지 API 버그 즉시 수정**:
   - `fetchStock` 함수의 `/api/stock/${ticker}` → `/api/stocks/${ticker}` (33행)
   - 1줄 수정으로 기능 정상화. Phase 1 전에 핫픽스로 처리 권장

2. **BottomTabBar safe-area-inset 대응**:
   - 현재 `fixed bottom-0`만 설정. iPhone의 홈 인디케이터 영역과 겹칠 수 있음
   - `pb-[env(safe-area-inset-bottom)]` 추가 권장

3. **Sheet 닫기 로직 개선**:
   - 현재 각 Link에 `onClick={() => setSheetOpen(false)}` 수동 적용
   - `usePathname()` 변경 감지로 자동 닫기 구현이 더 안정적:
   ```tsx
   useEffect(() => { setSheetOpen(false) }, [pathname])
   ```

4. **검색 모달 개선과 Sheet 내 SearchBar 중복 제거**:
   - Sheet 내 SearchBar를 제거하고, 대신 Sheet 상단에 검색 아이콘 → SearchCommand 모달로 통일
   - UX 기획서 5.2절에서 지적한 "두 가지 경로가 동일 기능이나 다른 UI" 문제 해결

5. **`app-header.tsx` "use client" 최적화**:
   - 현재 헤더 전체가 Client Component
   - 네비게이션 재설계 시 로고+링크 부분을 Server Component로 분리하고, Sheet/테마/세션 관련만 Client Component로 구성하면 초기 JS 번들 감소
   - 단, 메가메뉴(호버)를 쓰면 어차피 Client Component 필요 → 2단 네비게이션이면 분리 가능

---

## 6. 구현 우선순위 및 예상 공수 (프론트엔드 관점)

| # | 항목 | 기획 예상 | 실제 예상 | 난이도 | 비고 |
|---|------|----------|----------|--------|------|
| 0 | Compare API 버그 수정 | - | 5분 | 극하 | `/api/stock/` → `/api/stocks/` 핫픽스 |
| 1 | BottomTabBar 5탭 변경 | 15분 | 20분 | 하 | safe-area-inset 추가 포함 |
| 2 | 종목 상세 광고 위치 이동 | - | 5분 | 극하 | 1줄 이동 |
| 3 | Sheet 메뉴 그룹핑 + 누락 페이지 추가 | 30분 | 45분 | 하 | navGroups 구조 변경 + 섹션 헤더 |
| 4 | 차트 컨트롤 기본/고급 분리 | - | 1시간 | 중 | localStorage 선호 저장 포함 |
| 5 | 홈페이지 퀵 액세스 카드 | 30분 | 1시간 | 하 | QuickLinkCard 컴포넌트 + 3페이지 적용 |
| 6 | 데스크톱 메가메뉴 (NavigationMenu) | 60분 | 2.5시간 | 상 | 설치 + 구현 + 활성 로직 + 반응형 테스트 |
| 7 | 종목 상세 탭 6→4개 통합 | - | 2.5시간 | 중상 | slot 구조 변경 + 이벤트 탭 래퍼 |
| 8 | 홈페이지 히어로 섹션 | - | 1.5시간 | 중 | Client Component 분리 + CLS 방지 |
| 9 | 지수+환율 컴팩트 바 | - | 1.5시간 | 중 | 신규 컴포넌트 + 가로 스크롤 |
| 10 | 브랜드 컬러 도입 | - | 0.5시간 코드 + 2시간 QA | 중 | CSS 변수 변경은 쉽지만 전체 시각 검증 필요 |
| | **합계** | ~3시간 | **~11시간** | | 기획서는 네비게이션만 집계, 전체는 더 큼 |

**권장 구현 순서** (의존성 + 임팩트 기준):
1. Compare API 버그 핫픽스 (즉시)
2. BottomTabBar 5탭 + Sheet 그룹핑 (함께 진행, 네비게이션 구조 변경)
3. 광고 위치 이동 (독립적, 즉시)
4. 차트 컨트롤 기본/고급 (독립적)
5. 퀵 액세스 카드 (독립적)
6. 데스크톱 메가메뉴 (가장 복잡, 단독 진행 권장)
7. 탭 통합, 히어로, 컴팩트 바 (Phase 2로 분류해도 무방)
8. 브랜드 컬러 (다른 변경 완료 후 최종 적용)

---

## 7. 회의 안건 (논의 필요 사항)

### 기획자와 논의

1. **데스크톱 네비게이션 방식 결정**: 메가메뉴(안 A) vs 2단 네비게이션(안 B)
   - 메가메뉴: 구현 2.5시간, 라이브러리 추가 필요, UX 고급
   - 2단 내비: 구현 1.5시간, 추가 설치 없음, 콘텐츠 영역 40px 감소
   - 개인적으로 **2단 네비게이션을 Phase 1으로, 메가메뉴는 Phase 2 옵션으로** 권장

2. **"분석" 탭 랜딩 페이지**: `/screener` 직접 이동 vs 도구 허브 페이지 신규 생성
   - 허브 페이지 추가 시 1~2시간 추가 공수

3. **`/stock/[ticker]`의 탭 귀속**: 어느 탭에도 활성화하지 않는 방안 vs 기획서의 "분석" 귀속

4. **환율 축소 범위**: USD만 vs USD+EUR+JPY (3개) vs 현재 유지 + 토글

5. **탭 6→4개 통합 시기**: Phase 1에 포함할지, Phase 2로 미룰지. 서브탭 vs 아코디언 선택

### PM과 논의

6. **광고 위치 이동의 수익 영향**: 데이터 기반 결정 필요 (A/B 테스트 또는 이동 후 1~2주 모니터링)

7. **히어로 섹션의 실제 필요성**: 현재 트래픽에서 신규 사용자 비율? SEO 트래픽이 대부분이면 히어로가 오히려 방해

8. **브랜드 컬러 선정**: 디자이너 부재 시 누가 최종 결정? oklch 값 후보 2~3개를 제시하고 PM이 선택하는 방안

9. **PM 무료 대안 검토서 반영**: 장중 시세 30분 간격 타협안은 프론트엔드에서 "30분 전 기준" 타임스탬프 + 장중/장마감 배지 UI가 필요. Phase 2 설계에 포함 필요
