# Component Specification: StockView

> shadcn/ui 기반 컴포넌트 명세
> 각 컴포넌트의 Props, 상태, 변형(Variants) 정의

---

## 1. Layout Components

### 1.1 `AppHeader`
```
위치: 모든 페이지 상단 고정
구성:
  ├── Logo (홈 링크)
  ├── SearchBar (데스크탑: 확장형 / 모바일: 아이콘)
  ├── MainNav (데스크탑: 탭 메뉴 / 모바일: 숨김)
  ├── ThemeToggle (Sun/Moon)
  └── AuthButtons (로그인/회원가입 또는 프로필 드롭다운)

반응형:
  mobile: Logo + SearchIcon + HamburgerMenu
  desktop: Logo + SearchBar + Nav + ThemeToggle + Auth
```

### 1.2 `BottomTabBar`
```
위치: 모바일에서만 하단 고정 (md 이상 숨김)
탭:
  - 홈 (Home icon)
  - 시장 (Globe icon)
  - 뉴스 (Newspaper icon)
  - MY (User icon)

Props:
  activeTab: "home" | "market" | "news" | "my"
```

### 1.3 `PageContainer`
```
역할: 페이지 콘텐츠 max-width + padding 래퍼
Props:
  className?: string

스타일:
  max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8
```

---

## 2. Search Components

### 2.1 `SearchBar`
```
역할: 종목 검색 + 자동완성
라이브러리: shadcn Command (cmdk 기반)

Props:
  placeholder?: string  (기본: "종목명 또는 티커 검색...")

상태:
  - open: boolean (드롭다운 열림/닫힘)
  - query: string (검색어)
  - results: SearchResult[] (자동완성 결과)

타입:
  SearchResult {
    ticker: string       // "005930" | "AAPL"
    name: string         // "삼성전자" | "Apple Inc."
    market: "KR" | "US"  // 시장 구분
    exchange: string     // "KOSPI" | "NASDAQ"
  }

동작:
  - 2글자 이상 입력 시 자동완성 트리거 (300ms debounce)
  - 한글/영문/숫자 모두 검색 가능
  - 결과 선택 시 /stock/[ticker] 이동
  - Cmd+K (Mac) / Ctrl+K (Win) 단축키로 열기
```

---

## 3. Market Components

### 3.1 `IndexCard`
```
역할: 주요 지수 미니 카드 (KOSPI, KOSDAQ, S&P500, NASDAQ)

Props:
  name: string           // "KOSPI"
  value: number          // 2847.52
  change: number         // +33.81
  changePercent: number  // +1.20
  sparklineData?: number[] // 미니 차트 데이터 (최근 3주, 15영업일)

Variants:
  - compact: 홈 대시보드 그리드용
  - expanded: 시장 개요 페이지 상단

상태 표시:
  상승: text-stock-up + bg-stock-up-bg
  하락: text-stock-down + bg-stock-down-bg
  보합: text-stock-flat
```

### 3.2 `StockRow`
```
역할: 종목 한 줄 요약 (테이블 행)

Props:
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  market: "KR" | "US"
  rank?: number           // 순위 (인기 종목)
  showSparkline?: boolean // 미니 차트 표시

동작:
  - 클릭 시 /stock/[ticker] 이동
  - 호버 시 shadow-md 효과
```

### 3.3 `MarketHeatmap` *(Post-MVP)*
```
역할: 업종별 등락 히트맵
상태: Post-MVP — 백엔드에 섹터별 집계 API 없음.
      구현 시 /api/market/kr/sectors 집계 API 추가 필요.

Props:
  data: SectorData[]

타입:
  SectorData {
    name: string         // "반도체"
    changePercent: number
    marketCap: number    // 크기 결정
  }

스타일:
  상승 강도에 따라 빨강 계열 그라데이션
  하락 강도에 따라 파랑 계열 그라데이션
```

---

## 4. Stock Detail Components

### 4.1 `PriceDisplay`
```
역할: 종목 현재가 + 등락 정보 대형 표시

Props:
  price: number
  change: number
  changePercent: number
  currency: "KRW" | "USD"
  preMarketPrice?: number   // 장전 가격
  postMarketPrice?: number  // 장후 가격

레이아웃:
  72,400원                    ← text-3xl font-bold font-mono
  ▲ +1,600 (+2.26%)          ← text-lg text-stock-up

  장전 72,800 (+0.55%)       ← text-sm text-muted-foreground (있을 때만)
```

### 4.2 `StockInfoGrid`
```
역할: 시세 상세 정보 그리드

Props:
  data: {
    open: number       // 시가
    high: number       // 고가
    low: number        // 저가
    volume: number     // 거래량
    high52w: number    // 52주 최고
    low52w: number     // 52주 최저
    marketCap?: number // 시가총액
    per?: number       // PER
    pbr?: number       // PBR
  }

레이아웃:
  2x4 그리드 (데스크탑) / 2x4 그리드 (모바일)
  각 셀: 라벨(text-sm muted) + 값(font-mono font-medium)
```

### 4.3 `StockDetailTabs`
```
역할: 종목 상세 탭 네비게이션
라이브러리: shadcn Tabs

탭:
  - "시세" — StockInfoGrid
  - "차트" — StockChart + IndicatorPanel
  - "뉴스" — NewsList (종목 필터)

기본 탭: "차트"
```

---

## 5. Chart Components

### 5.1 `StockChart`
```
역할: 메인 주가 차트
라이브러리: TradingView Lightweight Charts

Props:
  ticker: string
  period: "1W" | "2W" | "3W"  // DB에 3주치만 보관. 1M 이상은 Post-MVP
  chartType: "candlestick" | "line"
  indicators: IndicatorConfig[]
  data: OHLCV[]

타입:
  OHLCV {
    time: string      // "2026-03-14"
    open: number
    high: number
    low: number
    close: number
    volume: number
  }

  IndicatorConfig {
    type: "MA" | "RSI"  // MACD, BB는 Post-MVP (3주 데이터로 계산 불가)
    params: Record<string, number>
    visible: boolean
  }

크기:
  높이: 400px (데스크탑) / 300px (모바일)
  너비: 100% (부모 컨테이너)

인터랙션:
  - 마우스 호버: 크로스헤어 + 해당 시점 OHLCV 표시
  - 터치: 롱프레스로 크로스헤어 활성화
  - 줌: 마우스 휠 / 핀치 줌
  - 패닝: 드래그
```

### 5.2 `PeriodSelector`
```
역할: 차트 기간 선택

Props:
  value: Period
  onChange: (period: Period) => void

옵션: ["1W", "2W", "3W"]
  ※ DB에 3주(15영업일)치만 보관하므로 최대 3W.
    1M 이상 장기 차트는 Post-MVP (DB 보관 기간 확대 시 추가).

스타일: shadcn ToggleGroup (단일 선택)
```

### 5.3 `ChartTypeToggle`
```
역할: 캔들스틱 / 라인 차트 전환

Props:
  value: "candlestick" | "line"
  onChange: (type) => void

스타일: shadcn ToggleGroup + 아이콘
```

### 5.4 `IndicatorPanel`
```
역할: 기술 지표 토글 패널

Props:
  indicators: IndicatorConfig[]
  onChange: (indicators) => void

항목:
  ※ DB에 3주(15영업일)치만 보관하므로, 계산 가능한 지표만 제공.
  - MA (이동평균선): 토글 + 기간 설정 (5/10)
    - MA 20 이상은 데이터 부족으로 Post-MVP
  - RSI: 토글 + 기간 설정 (기본 14, 15일 데이터로 최소 1개 값 산출 가능)
  - MACD: Post-MVP (26일 데이터 필요, 15일로는 불가)
  - 볼린저 밴드: Post-MVP (20일 데이터 필요, 15일로는 불가)

각 항목 옆 CircleHelp 아이콘:
  클릭 → shadcn Popover로 초보자 설명 표시

초보자 설명 예시:
  MA: "이동평균선은 일정 기간의 평균 주가를 이은 선이에요.
       주가가 이동평균선 위에 있으면 상승 추세로 볼 수 있어요."
```

### 5.5 `VolumeChart`
```
역할: 거래량 바 차트 (메인 차트 하단)

Props:
  data: { time: string; volume: number; isUp: boolean }[]

크기:
  높이: 80px (데스크탑) / 60px (모바일)

스타일:
  상승일: chart-candle-up 색상
  하락일: chart-candle-down 색상
```

---

## 6. News Components

### 6.1 `NewsCard`
```
역할: 뉴스 기사 카드

Props:
  title: string
  summary: string
  source: string        // "한국경제", "Reuters"
  publishedAt: string   // ISO 날짜
  imageUrl?: string
  ticker?: string       // 관련 종목
  url: string           // 원문 링크

Variants:
  - featured: 큰 이미지 + 제목 + 요약 (홈 상단)
  - compact: 작은 이미지 + 제목 + 출처 (목록)
  - minimal: 제목 + 출처 + 시간 (종목 상세 하단)

동작:
  - 클릭 시 새 탭에서 원문 열기 (ExternalLink 아이콘)
  - 관련 종목 태그 클릭 시 해당 종목 페이지 이동
```

### 6.2 `NewsCategoryTabs`
```
역할: 뉴스 카테고리 필터

Props:
  value: "all" | "kr" | "us" | "industry"
  onChange: (category) => void

스타일: shadcn Tabs
```

### 6.3 `NewsTimestamp`
```
역할: 상대 시간 표시

Props:
  date: string | Date

출력: "방금 전" | "5분 전" | "2시간 전" | "어제" | "3일 전" | "2026.03.14"
```

---

## 7. Auth Components

### 7.1 `LoginForm`
```
역할: 로그인 폼
라이브러리: shadcn Form + react-hook-form + zod

필드:
  - email: Input (type="email", required)
  - password: Input (type="password", required)
  - remember: Checkbox ("로그인 유지")

버튼:
  - "로그인" (Primary)
  - "비밀번호 찾기" (Link)
  - "회원가입" (Link)

유효성:
  email: z.string().email("올바른 이메일을 입력해주세요")
  password: z.string().min(8, "8자 이상 입력해주세요")
```

### 7.2 `RegisterForm`
```
역할: 회원가입 폼

필드:
  - email: Input (type="email")
  - password: Input (type="password")
  - passwordConfirm: Input (type="password")
  - nickname: Input (type="text")
  - terms: Checkbox ("이용약관 동의", required)

유효성:
  email: z.string().email()
  password: z.string().min(8).regex(비밀번호 규칙)
  passwordConfirm: 비밀번호 일치 확인
  nickname: z.string().min(2).max(20)
```

---

## 8. Common Components

### 8.1 `ExchangeRateBadge`
```
역할: USD/KRW 환율 배지

Props:
  rate: number           // 1342.50
  change: number         // +2.30
  changePercent: number  // +0.17

스타일: 작은 배지형 (inline-flex, text-xs)
표시: "USD/KRW 1,342.50 ▲+2.30"
```

### 8.2 `WatchlistButton`
```
역할: 관심종목 추가/제거 토글

Props:
  ticker: string
  isWatched: boolean
  onToggle: (ticker: string) => void

상태:
  - false: Star 아이콘 (outline)
  - true: Star 아이콘 (filled, yellow)

동작:
  - 비로그인 시 클릭 → 로그인 유도 toast
  - 로그인 시 토글 + 성공 toast
```

### 8.3 `TooltipHelper`
```
역할: 초보자용 용어 설명 팝오버

Props:
  term: string      // "PER", "RSI" 등
  description: string

스타일: CircleHelp 아이콘 + shadcn Popover
```

### 8.4 `PriceChangeText`
```
역할: 가격 변동 텍스트 (색상 자동 적용)

Props:
  value: number
  format: "price" | "percent" | "both"
  currency?: "KRW" | "USD"
  showSign?: boolean (기본: true)

출력 예시:
  +1,600 (+2.26%)   → text-stock-up
  -500 (-0.68%)     → text-stock-down
  0 (0.00%)         → text-stock-flat
```

### 8.5 `EmptyState`
```
역할: 데이터 없음 상태 표시

Props:
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }

사용 예:
  관심종목 비어있을 때: "아직 관심종목이 없어요" + "종목 검색하기" 버튼
```

---

## 9. 컴포넌트 디렉토리 구조 (제안)

```
src/
├── components/
│   ├── ui/                 # shadcn/ui 기본 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   ├── command.tsx
│   │   ├── popover.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── app-header.tsx
│   │   ├── bottom-tab-bar.tsx
│   │   ├── page-container.tsx
│   │   └── footer.tsx
│   ├── search/
│   │   └── search-bar.tsx
│   ├── market/
│   │   ├── index-card.tsx
│   │   ├── stock-row.tsx
│   │   └── market-heatmap.tsx
│   ├── stock/
│   │   ├── price-display.tsx
│   │   ├── stock-info-grid.tsx
│   │   ├── stock-detail-tabs.tsx
│   │   └── watchlist-button.tsx
│   ├── chart/
│   │   ├── stock-chart.tsx
│   │   ├── volume-chart.tsx
│   │   ├── period-selector.tsx
│   │   ├── chart-type-toggle.tsx
│   │   └── indicator-panel.tsx
│   ├── news/
│   │   ├── news-card.tsx
│   │   ├── news-category-tabs.tsx
│   │   └── news-timestamp.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   └── common/
│       ├── exchange-rate-badge.tsx
│       ├── tooltip-helper.tsx
│       ├── price-change-text.tsx
│       └── empty-state.tsx
```
