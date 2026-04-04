# Proposal B — Page Layout Redesign

> **Designer**: UX Designer B — Page Layout Designer
> **Date**: 2026-03-29
> **Goal**: Transform StockView from "white background + text list" into a TradingView-style financial dashboard with rich data visualization, strong visual hierarchy, and optimized screen real estate.

---

## Current State Analysis

### Problems Identified

1. **Flat layout**: `PageContainer` is a single `max-w-screen-xl` column. Every page is a vertical stack of sections with identical spacing (`mb-8`). No visual weight differentiation.
2. **No dashboard feel**: Homepage is Hero → Index Cards → Exchange Rates → Quick Links → Popular Stocks + News. All sections are equal weight, no focal point.
3. **Underutilized real estate**: On desktop (1280px), stock detail pages waste the right 30-40% of viewport — no sidebar, no contextual data panels.
4. **Minimal data density**: Market page shows 4 index cards + a simple gainers/losers list. No heatmaps, no breadth indicators, no sector visualization.
5. **Mobile = narrow desktop**: Bottom tab bar exists but content is just reflowed desktop columns. No mobile-native patterns (carousels, swipeable cards, gesture controls).
6. **No real-time feel**: Static ISR pages with no visual indicators of market activity — no ticker tapes, no pulse animations, no blinking prices.

---

## 1. Homepage — Dashboard Layout

### Design Philosophy
The homepage should feel like opening a Bloomberg terminal or TradingView dashboard — immediate, information-dense, and alive with market data. Every pixel above the fold should convey market state.

### Layout Specification (Desktop ≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  [Ticker Tape — horizontal scroll, infinite loop]           │
│  KOSPI 2,645.32 ▲+0.8%  KOSDAQ 812.45 ▼-0.3%  S&P ...    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────┐ │
│  │   KOSPI     │ │   KOSDAQ    │ │   S&P 500   │ │NASDAQ │ │
│  │  2,645.32   │ │   812.45    │ │  5,234.18   │ │16,432 │ │
│  │  ▲ +21.3    │ │  ▼ -2.8     │ │  ▲ +18.7    │ │▲+42.1 │ │
│  │  [mini      │ │  [mini      │ │  [mini      │ │[mini  │ │
│  │   chart]    │ │   chart]    │ │   chart]    │ │chart] │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────┘ │
│                                                             │
│  ┌──────────────────────────┐ ┌────────────────────────────┐│
│  │  HOT STOCKS (LEFT COL)  │ │  MARKET PULSE (RIGHT COL)  ││
│  │                         │ │                            ││
│  │  [Tab: KR | US]         │ │  ┌─ Sentiment Gauge ─────┐ ││
│  │                         │ │  │  Fear ◀━━━●━━▶ Greed  │ ││
│  │  1. 삼성전자  72,400원   │ │  └────────────────────────┘ ││
│  │     ▲+2.1%  ████░░ vol  │ │                            ││
│  │  2. SK하이닉스 142,500원 │ │  ┌─ Exchange Rates ──────┐ ││
│  │     ▼-1.3%  ██░░░░ vol  │ │  │ USD/KRW 1,342.5 ▲0.2% │ ││
│  │  3. 카카오   48,200원   │ │  │ EUR/KRW 1,458.2 ▼0.1% │ ││
│  │     ▲+3.4%  ███░░░ vol  │ │  │ JPY/KRW   896.4 ─0.0% │ ││
│  │  ...                    │ │  └────────────────────────┘ ││
│  │                         │ │                            ││
│  │  [See All → /market]    │ │  ┌─ Quick Actions ────────┐ ││
│  └──────────────────────────┘ │  │ [Screener] [Reports]   │ ││
│                               │  │ [Compare]  [Guide]     │ ││
│  ┌──────────────────────────┐ │  └────────────────────────┘ ││
│  │  LATEST NEWS             │ │                            ││
│  │                         │ │  ┌─ Sector Heatmap Mini ──┐ ││
│  │  ┌─ Card ─────────────┐ │ │  │ ┌──┐┌───┐┌──┐┌────┐  │ ││
│  │  │ 📰 Title here...   │ │ │  │ │IT││반도│├──┤│자동차│  │ ││
│  │  │ Source · 2h ago     │ │ │  │ │  ││체 ││금│└────┘  │ ││
│  │  │ Related: 삼성전자   │ │ │  │ └──┘└───┘│융│┌────┐  │ ││
│  │  └────────────────────┘ │ │  │          └──┘│바이오│  │ ││
│  │  ...3 more cards        │ │  │              └────┘  │ ││
│  │  [All News → /news]     │ │  │ [Full View → /sectors]│ ││
│  └──────────────────────────┘ └────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Grid Specification

```css
/* Homepage grid — desktop */
.home-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: auto auto auto;
  grid-template-areas:
    "ticker  ticker  ticker  ticker"
    "idx-1   idx-2   idx-3   idx-4"
    "hot     hot     pulse   pulse"
    "news    news    pulse   pulse";
  gap: 16px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
}

/* Tablet (768–1023px): 2-column */
@media (max-width: 1023px) {
  .home-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "ticker ticker"
      "idx-1  idx-2"
      "idx-3  idx-4"
      "hot    hot"
      "pulse  pulse"
      "news   news";
  }
}

/* Mobile (<768px): single column */
@media (max-width: 767px) {
  .home-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "ticker"
      "idx-carousel"
      "hot"
      "news"
      "pulse";
  }
}
```

### Component Details

#### 1.1 Ticker Tape Bar
- **Position**: Directly below the header, full width, `height: 36px`
- **Background**: `bg-muted/50` (light), `bg-card` (dark) — subtle contrast from header
- **Content**: KOSPI, KOSDAQ, S&P 500, NASDAQ, USD/KRW — continuous horizontal scroll via CSS animation (`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`)
- **Speed**: 40px/second, pause on hover
- **Typography**: `font-mono text-xs tabular-nums`
- **Color coding**: Red/blue for up/down per Korean convention, with colored dot indicator (`●`) before each value
- **Interaction**: Click any item → navigate to its detail page
- **Dark mode**: Same layout, uses dark stock color variants (`--color-stock-up: #fc8181`, `--color-stock-down: #63b3ed`)
- **Mobile**: Visible, slightly smaller (32px height, smaller text)

#### 1.2 Index Widget Cards (Redesigned)
- **Size**: Equal 1/4 width on desktop, 1/2 on tablet, horizontal carousel on mobile
- **Height**: 140px fixed
- **Structure**:
  ```
  ┌──────────────────────────┐
  │ KOSPI              🇰🇷   │  ← name + flag/market badge
  │                          │
  │ 2,645.32                 │  ← large mono font, 28px
  │ ▲ +21.34 (+0.81%)       │  ← colored change with bg pill
  │                          │
  │ ┌──────────────────────┐ │  ← mini area chart (lightweight-charts)
  │ │  ╱╲    ╱╲  ╱╲       │ │     60px height, last 30 data points
  │ │ ╱  ╲╱╲╱  ╲╱  ╲╱╲╱╲  │ │     gradient fill: stock-up/stock-down
  │ └──────────────────────┘ │
  └──────────────────────────┘
  ```
- **Background**: Subtle gradient based on direction — `from-stock-up-bg/30 to-transparent` for up, `from-stock-down-bg/30` for down
- **Border**: `border` with `border-stock-up/20` or `border-stock-down/20` accent on left edge (3px solid)
- **Hover**: `shadow-md` + slight scale `scale-[1.01]`
- **Dark mode**: Deeper gradient tints, brighter chart lines
- **Animation**: On load, numbers count up from 0 to actual value over 600ms (spring easing). Change values fade in with 200ms delay.

#### 1.3 Market Sentiment Gauge
- **New component**: Circular/arc gauge showing Fear ↔ Greed
- **Calculation**: Based on available data — ratio of advancing to declining stocks, index change direction, volume trends
- **Visual**: Semi-circle arc, gradient from blue (fear) through gray (neutral) to red (greed)
- **Needle**: Animated CSS `transform: rotate()` to current position
- **Label**: "공포" (Fear) / "탐욕" (Greed) with numeric value (0-100)
- **Size**: ~180px wide, placed in the right sidebar panel
- **Update**: Refreshes with ISR (15min)

#### 1.4 Hot Stocks Section
- **Replaces**: Current `PopularStocksTabs` — same data, better presentation
- **Tabs**: `KR | US` with underline indicator (animated slide with `transition: left 200ms, width 200ms`)
- **Each row** (redesigned from `StockRow`):
  ```
  ┌─────────────────────────────────────────────┐
  │ 1  삼성전자      72,400원  ▲ +2.1%  ████░░ │
  │    005930        vol 12.3조            │
  └─────────────────────────────────────────────┘
  ```
  - Rank number: bold, `text-primary` for top 3
  - Volume bar: horizontal bar chart showing relative volume (max width = highest volume stock)
  - Volume bar color: matches stock direction (red/blue, 30% opacity)
  - Hover: row background shifts to `accent/50`, sparkline preview appears inline
- **Max items**: 10 per tab (currently correct)

#### 1.5 News Feed Cards
- **Layout**: Vertical stack, 4 cards
- **Card design**:
  ```
  ┌──────────────────────────────────────┐
  │ [Category Badge]           2시간 전  │
  │                                      │
  │ 삼성전자, 신규 반도체 공장 투자...     │
  │                                      │
  │ 관련: 삼성전자(005930) SK하이닉스      │
  │ Source: 한국경제                       │
  └──────────────────────────────────────┘
  ```
- **Category badges**: Colored pills — `경제` (blue), `기업` (green), `증시` (amber), `해외` (purple)
- **Related stocks**: Clickable ticker links
- **Hover**: Card lifts with `shadow-md`, title color becomes `primary`

#### 1.6 Dark vs Light Mode

| Element | Light | Dark |
|---------|-------|------|
| Ticker tape bg | `oklch(0.97 0 0)` (muted) | `oklch(0.205 0 0)` (card) |
| Index card bg | white + directional gradient | `oklch(0.205 0 0)` + deeper gradient |
| Chart line (up) | `#e53e3e` | `#fc8181` |
| Chart fill (up) | `#e53e3e` at 15% opacity | `#fc8181` at 10% opacity |
| Chart line (down) | `#3182ce` | `#63b3ed` |
| Section dividers | `oklch(0.922 0 0)` border | `oklch(1 0 0 / 10%)` border |
| Stock row hover | `accent/50` | `accent/50` (darker accent) |
| Sentiment gauge arc | solid colors | same hues, slightly muted |

---

## 2. Market Overview — Data-Dense Dashboard

### Design Philosophy
The market page should feel like a professional trading terminal — maximum data density with clear visual hierarchy. Users should understand market state in 2 seconds.

### Layout (Desktop ≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  시장 개요                            USD/KRW 1,342.5 ▲0.2% │
│  ─────────────────────────────────────────────────────────── │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ KOSPI   │ │ KOSDAQ  │ │ S&P 500 │ │ NASDAQ  │          │
│  │ 2,645   │ │ 812     │ │ 5,234   │ │ 16,432  │          │
│  │ [chart] │ │ [chart] │ │ [chart] │ │ [chart] │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ┌─ Market Tabs ─────────────────────────────────────────┐  │
│  │  [한국]  [미국]                                       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  ┌─ Sector Treemap ─────────────────────────────────┐ │  │
│  │  │ ┌────────────┐┌──────────┐┌─────┐┌────────────┐ │ │  │
│  │  │ │            ││          ││     ││            │ │ │  │
│  │  │ │    IT      ││  반도체   ││ 금융 ││   자동차    │ │ │  │
│  │  │ │  +1.2%     ││  +2.4%   ││-0.3%││   +0.8%   │ │ │  │
│  │  │ │            ││          ││     ││            │ │ │  │
│  │  │ ├────────────┤├──────────┤├─────┤├────────────┤ │ │  │
│  │  │ │   바이오    ││  에너지   ││통신 ││   건설     │ │ │  │
│  │  │ │   -1.5%    ││  +0.6%   ││+0.1%││   -0.2%   │ │ │  │
│  │  │ └────────────┘└──────────┘└─────┘└────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─ Market Breadth ─────────────────────────────────┐ │  │
│  │  │  상승 423 ████████████████░░░░░░░░ 하락 312      │ │  │
│  │  │  상한가 3  하한가 1  보합 87                       │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─ Gainers / Losers Split ─────────────────────────┐ │  │
│  │  │  ┌─ 상승 TOP 10 ──────┐  ┌─ 하락 TOP 10 ──────┐ │ │  │
│  │  │  │ ██████████ +8.2%   │  │ ██████████ -7.1%   │ │ │  │
│  │  │  │ ████████░░ +6.5%   │  │ ████████░░ -5.8%   │ │ │  │
│  │  │  │ ██████░░░░ +5.1%   │  │ ██████░░░░ -4.2%   │ │ │  │
│  │  │  │ ...                │  │ ...                │ │ │  │
│  │  │  └────────────────────┘  └────────────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─ Sortable Stock Table ───────────────────────────┐ │  │
│  │  │  종목명    현재가   등락률  거래량  시가총액  차트 │ │  │
│  │  │  ─────────────────────────────────────────────── │ │  │
│  │  │  삼성전자  72,400  +2.1%  12.3조  432조   ╱╲╱   │ │  │
│  │  │  SK하이닉  142,500 -1.3%  3.2조   106조   ╲╱╲   │ │  │
│  │  │  ...                                            │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Grid Specification

```css
.market-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
}

.index-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.movers-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Tablet */
@media (max-width: 1023px) {
  .index-row { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile */
@media (max-width: 767px) {
  .index-row { grid-template-columns: 1fr; }
  .movers-split { grid-template-columns: 1fr; }
}
```

### Component Details

#### 2.1 Sector Treemap (Heatmap)
- **New component**: Treemap-style heatmap showing sector performance
- **Size**: Full width of content area, ~300px height
- **Cell sizing**: Proportional to market cap weight of sector
- **Color scale**:
  - Strongly up (>2%): `bg-red-500` (Korean convention)
  - Up (0-2%): `bg-red-300`
  - Flat: `bg-gray-400`
  - Down (0 to -2%): `bg-blue-300`
  - Strongly down (<-2%): `bg-blue-500`
- **Cell content**: Sector name + change percentage
- **Hover**: Tooltip with full details (number of stocks, market cap, top stock)
- **Click**: Navigate to `/sectors/[name]`
- **Implementation**: CSS Grid with `grid-template-columns` calculated from market cap ratios. No heavy charting library needed.
- **Dark mode**: Same color scale, slightly more saturated for contrast against dark background
- **Mobile**: Simplify to a list of colored bars (horizontal bar chart format) instead of treemap

#### 2.2 Market Breadth Bar
- **New component**: Single horizontal stacked bar
- **Width**: 100% of content area
- **Height**: 40px
- **Segments**: Advancing (red) | Flat (gray) | Declining (blue)
- **Labels**: Count on each end, percentage in center
- **Below bar**: Text line — "상한가 X · 하한가 Y · 보합 Z"
- **Animation**: Bar segments animate width from 0 to actual on load (400ms ease-out)

#### 2.3 Momentum Bars (Gainers/Losers)
- **Replaces**: Current simple `StockRow` lists
- **Layout**: Two columns side by side
- **Each item**:
  ```
  삼성전자 (005930)  ██████████████░░░░░░  +8.23%
  ```
  - Horizontal bar fills proportional to change percentage (max bar = max mover)
  - Bar color: Red fill for gainers, Blue fill for losers
  - Hover: Shows full details (price, volume, market cap)
  - Click: Navigate to stock detail
- **Max items**: 10 per column (up from 5)

#### 2.4 Sortable Stock Table
- **New component**: Data-dense table with sort, filter, and inline sparklines
- **Columns**: 종목명 | 현재가 | 등락 | 등락률 | 거래량 | 거래대금 | 시가총액 | 7일 차트
- **Features**:
  - Click column header to sort (toggle asc/desc), visual arrow indicator
  - Sparkline in last column: 7-day mini chart (40px × 20px, lightweight-charts)
  - Alternating row backgrounds for readability
  - Sticky header on scroll
  - Pagination: 20 items per page with "Load more" button
- **Row hover**: Highlight + show "상세 보기" ghost button on right
- **Typography**: All numbers in `font-mono tabular-nums` for alignment
- **Mobile**: Horizontal scroll with sticky first column (stock name)

#### 2.5 KR/US Market Switching
- **Tab design**: Underlined tabs (not chips) at the top of the market content area
- **Behavior**: All content below tabs updates when switching — treemap, breadth bar, movers, table
- **Animation**: Content crossfades (opacity 0→1, 150ms)
- **URL**: Tab state reflected in URL query param `?market=kr` / `?market=us`
- **Keyboard**: Arrow keys navigate between tabs

---

## 3. Stock Detail — Chart-Centric Layout

### Design Philosophy
The stock detail page is the most-visited page type. The chart must dominate. Supporting data should be easily accessible but not compete for attention. Think TradingView's ticker page.

### Layout (Desktop ≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb: 주식 > 삼성전자 (005930)                        │
│                                                             │
│  ┌─ Stock Header ──────────────────────────────────────────┐│
│  │                                                         ││
│  │  삼성전자                               [★ 관심종목]     ││
│  │  Samsung Electronics · 005930 · KOSPI    [📊 비교하기]   ││
│  │                                                         ││
│  │  72,400원                                               ││
│  │  ▲ +1,500 (+2.11%)    시가 71,200  고가 72,800          ││
│  │  03.28 15:30 기준      저가 70,900  거래량 12.3조         ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ Chart (Hero) ───────────────────┐ ┌─ Sidebar ─────────┐│
│  │                                  │ │                    ││
│  │                                  │ │  KEY STATS         ││
│  │                                  │ │  ────────────      ││
│  │    [TradingView-style chart]     │ │  시가총액  432조    ││
│  │    60% viewport height           │ │  PER      12.3x    ││
│  │    min 400px                     │ │  PBR       1.2x    ││
│  │                                  │ │  EPS     5,876원   ││
│  │                                  │ │  배당수익률  2.1%   ││
│  │                                  │ │  ROE      14.2%    ││
│  │                                  │ │  D/E      28.5%    ││
│  │  [1D] [1W] [1M] [3M] [1Y] [3Y]  │ │  Beta      1.12   ││
│  │  [Candle|Line|Area] [Indicators] │ │                    ││
│  │                                  │ │  52W RANGE         ││
│  └──────────────────────────────────┘ │  ──────────────    ││
│                                       │  저 58,800 ━━●━━━  ││
│                                       │       고 78,200    ││
│                                       │                    ││
│                                       │  RELATED STOCKS    ││
│                                       │  SK하이닉스 +1.2%  ││
│                                       │  삼성SDI   -0.5%   ││
│                                       │  LG에너지  +0.3%   ││
│                                       └────────────────────┘│
│                                                             │
│  ┌─ Content Tabs ──────────────────────────────────────────┐│
│  │  [개요] [재무] [뉴스] [이벤트] [AI 리포트]              ││
│  │  ──────────────────────────────────────────────────────  ││
│  │                                                         ││
│  │  [Tab content area — varies by selected tab]            ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Grid Specification

```css
.stock-detail-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: auto auto auto;
  grid-template-areas:
    "header  header"
    "chart   sidebar"
    "tabs    tabs";
  gap: 16px 24px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
}

.stock-chart-area {
  grid-area: chart;
  min-height: 400px;
  height: 60vh;
  max-height: 600px;
}

.stock-sidebar {
  grid-area: sidebar;
  position: sticky;
  top: 80px; /* below header */
  max-height: calc(100vh - 96px);
  overflow-y: auto;
}

/* Tablet: sidebar collapses below chart */
@media (max-width: 1023px) {
  .stock-detail-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "chart"
      "sidebar"
      "tabs";
  }
  .stock-sidebar {
    position: static;
    max-height: none;
  }
}

/* Mobile: chart-first, everything collapsible */
@media (max-width: 767px) {
  .stock-chart-area {
    min-height: 300px;
    height: 50vh;
    margin: 0 -16px; /* full-bleed on mobile */
    width: calc(100% + 32px);
  }
}
```

### Component Details

#### 3.1 Stock Header (Redesigned)
- **Layout**: Full width above chart
- **Left section**:
  - Stock name: `text-2xl font-bold`
  - English name + Ticker + Exchange: `text-sm text-muted-foreground`
  - Price: `text-4xl font-mono font-bold` with color based on direction
  - Change: Colored pill with arrow + absolute change + percentage
  - Timestamp: `text-xs text-muted-foreground`
  - OHLV row: `text-sm font-mono` — Open, High, Low, Volume in a compact horizontal line
- **Right section**:
  - Watchlist button: Heart/Star toggle with fill animation
  - Compare button: Add to compare bar
  - Share button: Copy link
- **Pre/Post market**: If available, show as a subdued line below the main price — "프리마켓 $142.50 (+0.3%)" in smaller text

#### 3.2 Chart Area (Hero Element)
- **Size**: 60% of viewport height, minimum 400px, maximum 600px
- **Library**: lightweight-charts (already in use)
- **Chart types** (toolbar below chart):
  - Candlestick (default for KR)
  - Line
  - Area (default for homepage mini-charts)
- **Time periods**: `1D | 1W | 1M | 3M | 1Y | 3Y | MAX` — pill-style toggle buttons
- **Indicators button**: Opens popover with checkboxes — MA(5,20,60,120), Bollinger, RSI, MACD, Volume
- **Crosshair**: Shows tooltip with OHLCV data on hover
- **Volume**: Sub-chart below main chart, 20% of chart height
- **Responsive**:
  - Desktop: 60vh, side-by-side with sidebar
  - Tablet: Full width, 50vh
  - Mobile: Full-bleed (negative margin to edge), 50vh, gesture controls (pinch to zoom, swipe to pan)

#### 3.3 Sidebar Panel
- **Width**: 320px fixed on desktop
- **Position**: Sticky, scrolls independently
- **Sections** (each in a Card):
  1. **Key Statistics**: Grid of label-value pairs, 2 columns
     - `font-mono tabular-nums` for values
     - Muted labels, strong values
  2. **52-Week Range**: Horizontal slider visualization
     - Blue dot = current price position
     - Labels at low and high ends
  3. **Related Stocks**: 3-5 stocks in same sector
     - Mini rows with name + change percentage
     - Click to navigate
  4. **Analyst Consensus** (future): Buy/Hold/Sell bar if data available
- **Dark mode**: Cards use `bg-card` (`oklch(0.205 0 0)`), borders at `oklch(1 0 0 / 10%)`
- **Tablet/Mobile**: Transforms into a horizontal scrollable card strip or collapsible accordion

#### 3.4 Content Tabs
- **Tab bar**: Sticky below chart on scroll (not below header)
- **Tabs**:
  1. **개요 (Overview)**: Company description, key fundamentals in cards, sector info
  2. **재무 (Financials)**: Revenue/Income charts, financial statements table
  3. **뉴스 (News)**: Related news cards (reuse NewsCard component)
  4. **이벤트 (Events)**: Dividends + Earnings + Disclosures combined (current EventsTabWrapper)
  5. **AI 리포트**: Link to AI reports if available, count badge on tab
- **Animation**: Tab content fades in (`opacity 0→1`, 150ms)
- **Lazy loading**: Non-active tabs load on first visit via Suspense

#### 3.5 Mobile Stock Detail
- **Order**: Header (compact) → Chart (full-bleed, 50vh) → Quick Stats (horizontal scroll cards) → Tabs
- **Chart**: Full-bleed with 16px padding removal
- **Quick Stats**: Horizontally scrollable row of stat chips above tabs
- **Tabs**: Segmented control style, not underline tabs
- **Sections**: Each tab content has collapsible sub-sections with chevron toggles

---

## 4. Navigation Redesign

### Design Philosophy
Navigation should be invisible until needed. Market status should be ambient — always visible but never distracting. Desktop users get power-user features; mobile users get thumb-friendly zones.

### 4.1 Header Redesign (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ 📈 StockView   홈  투자정보  분석  뉴스  더보기             │
│                              [🔍 종목 검색...]   🌙  👤    │
│                                                             │
│         ┌─ Market Status ──┐                                │
│         │ 🟢 장중 15:22    │ (or 🔴 장마감 or 🟡 프리마켓)  │
│         └──────────────────┘                                │
├─────────────────────────────────────────────────────────────┤
│  시장 · ETF · 섹터 · 배당 · 실적        (2nd level nav)     │
└─────────────────────────────────────────────────────────────┘
```

#### Header Specifications
- **Height**: Primary nav: `h-14` (56px) — unchanged
- **Sub-nav**: `h-10` (40px) — unchanged but redesigned
- **Market Status Badge**:
  - Position: Between nav links and search bar
  - States:
    - `🟢 장중 HH:MM` — green dot, pulse animation (`animate-pulse`)
    - `🔴 장마감` — red dot, static
    - `🟡 프리마켓` / `🟡 애프터마켓` — yellow dot
    - `⚪ 휴장` — gray dot, "주말" or "공휴일" label
  - Font: `text-xs font-medium`
  - Logic: KR market hours (09:00-15:30 KST weekdays), US market adjusted for KST
  - Click: Expands to show both KR and US market status
- **Search bar**: Expand from 256px to 320px, add keyboard shortcut hint `⌘K`
- **Background**: Solid `bg-background` with `border-b`, no blur effects (performance)

#### Sub-navigation Redesign
- **Visibility**: Only shows when a category is active (current behavior — keep)
- **Style**: More compact, pill-style links instead of plain text
- **Active indicator**: Bottom border `border-b-2 border-primary` with slide animation
- **Scrollable**: On tablet, horizontal scroll if links overflow

### 4.2 Mobile Bottom Tab Bar (Redesigned)

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   🏠       🔍       📊       ⭐       👤        │
│   홈       검색      시장     관심     MY         │
│                                                  │
└──────────────────────────────────────────────────┘
```

- **Height**: `h-14` (56px) — unchanged
- **Background**: `bg-background/95 backdrop-blur-sm` — frosted glass effect
- **Active state**: Icon fills solid + text becomes `text-primary` + dot indicator above icon
- **Safe area**: Account for iOS safe area with `pb-safe` (env(safe-area-inset-bottom))
- **Haptic**: Using `navigator.vibrate(10)` on tap (if supported)
- **Badge**: Red dot on 관심 (watchlist) tab when watchlist has alerts

### 4.3 Breadcrumb System

```
주식 > 시장 개요 > 섹터별 종목 > IT/반도체
```

- **Position**: Top of page content, below header, above page title
- **Style**: `text-xs text-muted-foreground`, chevron separators
- **Links**: All items except last are clickable
- **Schema**: JSON-LD BreadcrumbList for SEO (already partially implemented)
- **Mobile**: Truncate middle items with "..." if more than 3 levels, show only last 2

### 4.4 Sidebar Navigation (Power User Option — Future)
- **Concept**: Optional collapsible sidebar on far left
- **Width**: 240px expanded, 64px collapsed (icon-only)
- **Toggle**: Hamburger button or keyboard shortcut `[`
- **Content**: Full navigation tree with expandable sections
- **Persistence**: State saved in localStorage
- **Priority**: Phase 2 — not in initial redesign. Current top-nav is sufficient.

---

## 5. Mobile Responsive Strategy

### Design Philosophy
Mobile is not a smaller desktop. Each layout adapts to touch-native patterns. Thumb zone optimization: primary actions within 44-88px from bottom. Content hierarchy: chart/numbers first, context second.

### 5.1 Homepage Mobile (< 768px)

```
┌──────────────────────────┐
│  [Ticker Tape — scroll]  │
├──────────────────────────┤
│                          │
│  ← KOSPI → KOSDAQ → ... │  ← Horizontal carousel (swipe)
│  [Index card with chart] │     One card visible, peek edges
│                          │
├──────────────────────────┤
│                          │
│  인기 종목 [KR|US]       │
│  ┌────────────────────┐  │
│  │ 1. 삼성전자        │  │
│  │    72,400원 +2.1%  │  │
│  ├────────────────────┤  │
│  │ 2. SK하이닉스      │  │
│  │    142,500원 -1.3% │  │
│  └────────────────────┘  │
│  더보기 →                 │
│                          │
├──────────────────────────┤
│  최신 뉴스               │
│  ┌────────────────────┐  │
│  │ Card 1             │  │
│  │ Card 2             │  │
│  └────────────────────┘  │
│  더보기 →                 │
│                          │
├──────────────────────────┤
│  환율 · 퀵링크 · 센티먼트│
│  (collapsed sections)    │
│                          │
└──────────────────────────┘
│  🏠  🔍  📊  ⭐  👤    │
└──────────────────────────┘
```

#### Index Card Carousel
- **Component**: Horizontal scroll snap container
- **CSS**: `scroll-snap-type: x mandatory`, each card `scroll-snap-align: center`
- **Card width**: `calc(100vw - 64px)` — full width with peek of next card (16px visible on each side)
- **Dots**: Pagination dots below carousel, active dot = `bg-primary`
- **Swipe**: Natural scroll behavior, no JS needed
- **Auto-advance**: No auto-scroll (user-initiated only to avoid disorientation)

#### Hot Stocks List
- **Truncated**: Show top 5 (not 10), with "더보기" link
- **Touch targets**: Each row minimum `h-12` (48px) for comfortable tapping
- **Swipe-to-action**: Swipe right on a stock row to add to watchlist (optional, Phase 2)

### 5.2 Market Page Mobile

```
┌──────────────────────────┐
│  시장 개요               │
│  [KR] [US]  ← Tabs      │
├──────────────────────────┤
│                          │
│  ┌────────┐ ┌────────┐  │  ← 2-column index cards
│  │ KOSPI  │ │ KOSDAQ │  │
│  │ 2,645  │ │ 812    │  │
│  │ +0.8%  │ │ -0.3%  │  │
│  └────────┘ └────────┘  │
│                          │
├──────────────────────────┤
│  섹터 성과               │
│  ┌─────────────────────┐ │
│  │ IT       ████ +1.2% │ │  ← Horizontal bars (not treemap)
│  │ 반도체    █████+2.4% │ │
│  │ 금융      ██░ -0.3% │ │
│  │ 자동차    ███ +0.8%  │ │
│  └─────────────────────┘ │
│                          │
├──────────────────────────┤
│  상승/하락               │
│  [상승▲] [하락▼]  ← Chips│
│                          │
│  종목 리스트 (스크롤)     │
│  ...                     │
│                          │
└──────────────────────────┘
```

- **Treemap → Bar chart**: On mobile, sector treemap simplifies to horizontal colored bars
- **Tables → Card list**: Stock table becomes a card-based list with key stats
- **Horizontal scroll**: For tables that must remain tabular, use `overflow-x-auto` with sticky first column

### 5.3 Stock Detail Mobile

```
┌──────────────────────────┐
│  ← 삼성전자              │  ← Compact header, back arrow
│  72,400원  ▲+2.11%       │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │  ← Full-bleed chart
│  │                    │  │     50vh height
│  │    CHART           │  │     Pinch to zoom
│  │    (full width)    │  │     Swipe to pan
│  │                    │  │
│  │ [1D][1W][1M][3M].. │  │
│  └────────────────────┘  │
│                          │
│  ← 시총 432조 | PER 12.3 │  ← Horizontal scroll stat chips
│    | PBR 1.2 | 배당 2.1% →│
│                          │
├──────────────────────────┤
│  [개요][재무][뉴스][이벤트]│  ← Segmented control tabs
│  ──────────────────────── │
│                          │
│  ▸ 기업 개요              │  ← Collapsible sections
│  ▸ 주요 재무지표          │
│  ▾ 관련 뉴스              │
│    - 뉴스 카드 1          │
│    - 뉴스 카드 2          │
│                          │
│  [★ 관심종목 추가]        │  ← Sticky bottom CTA
└──────────────────────────┘
```

#### Chart Interaction (Mobile)
- **Full-bleed**: `margin: 0 -16px; width: calc(100% + 32px)`
- **Gestures**:
  - Pinch: Zoom in/out on time axis
  - Single finger drag: Pan left/right
  - Long press: Show crosshair with data tooltip
  - Double tap: Reset zoom
- **Period selector**: Horizontally scrollable pill buttons below chart
- **Orientation**: If user rotates to landscape, chart expands to ~90vh

#### Sticky Bottom CTA
- **Position**: Fixed above bottom tab bar
- **Content**: "★ 관심종목 추가" button for logged-in users
- **Visibility**: Fades in after scrolling past the chart
- **Height**: 56px with subtle top shadow
- **Dismiss**: Automatically hides if stock is already in watchlist

### 5.4 Global Mobile Patterns

#### Pull-to-Refresh
- **Pages**: Homepage, Market, Watchlist
- **Visual**: Custom indicator — StockView logo rotates during pull
- **Threshold**: 80px pull distance to trigger
- **Implementation**: `overscroll-behavior: contain` + touch event handlers (or native where supported)
- **Feedback**: Haptic vibration on trigger threshold

#### Touch Targets
- All interactive elements: minimum 44px × 44px (Apple HIG)
- Stock rows: 48px height minimum
- Buttons: 36px height minimum, 44px touch target with padding
- Tab items: Full height of tab bar (56px)

#### Data Tables on Mobile
- **Default**: Convert to card list format
- **Option**: "표 보기" toggle to switch to horizontal-scrollable table
- **Sticky column**: First column (stock name) stays fixed during horizontal scroll
- **Shadow indicator**: Right edge shadow to hint at scrollable content

#### Skeleton Loading
- Match component shapes exactly
- Pulse animation: `animate-pulse` (existing Tailwind class)
- Progressive: Header skeleton → Chart skeleton → Content skeleton (top-down)

---

## 6. Shared Design Tokens & Spacing System

### Spacing Scale
```
4px   — xs (gap between inline elements)
8px   — sm (padding inside badges)
12px  — md (gap between related items)
16px  — lg (section padding, card padding)
24px  — xl (gap between sections)
32px  — 2xl (major section separator)
48px  — 3xl (page section separator)
```

### Card System
All dashboard cards use a consistent pattern:
```css
.dashboard-card {
  @apply bg-card border rounded-lg p-4;
  @apply hover:shadow-md transition-shadow;
  /* Dark mode: same classes, CSS vars handle the color shift */
}

.dashboard-card-header {
  @apply flex items-center justify-between mb-3;
}

.dashboard-card-title {
  @apply text-sm font-semibold text-muted-foreground uppercase tracking-wider;
}
```

### Number Typography
```css
.price-large  { @apply text-4xl font-mono font-bold tabular-nums; }
.price-medium { @apply text-xl font-mono font-bold tabular-nums; }
.price-small  { @apply text-sm font-mono font-medium tabular-nums; }
.change-pill  { @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium; }
```

### Color Scale (Direction-Based)
```css
/* Already defined, ensure consistent usage: */
--color-stock-up: #e53e3e;       /* Light mode red */
--color-stock-up-bg: #fff5f5;    /* Light mode red bg */
--color-stock-down: #3182ce;     /* Light mode blue */
--color-stock-down-bg: #ebf8ff;  /* Light mode blue bg */
--color-stock-flat: #718096;     /* Gray */

/* Dark mode (already defined): */
--color-stock-up: #fc8181;
--color-stock-up-bg: #3d1f1f;
--color-stock-down: #63b3ed;
--color-stock-down-bg: #1f2d3f;
```

---

## 7. Animation & Micro-interaction Spec

### Page Transitions
- **Route change**: Content fades out (100ms) → fades in (200ms)
- **Implementation**: CSS `@starting-style` or `View Transitions API` (progressive enhancement)

### Data Updates
- **Price change flash**: When price updates, background briefly flashes stock-up-bg or stock-down-bg (300ms fade)
- **Counter animation**: Large numbers count up/down to new value (400ms, ease-out)
- **Sparkline draw**: Lines animate from left to right on initial load (600ms)

### Interactive Elements
- **Button press**: `active:scale-[0.97]` (already partially implemented)
- **Card hover**: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
- **Tab switch**: Content uses `transition-opacity duration-150`
- **Skeleton pulse**: Standard `animate-pulse`

### Performance Notes
- All animations use `transform` and `opacity` only (GPU-accelerated)
- `will-change: transform` on frequently animated elements
- `prefers-reduced-motion`: Disable all animations except essential state changes
- No JS-driven animations for layout — CSS only

---

## 8. Implementation Priority

### Phase 1 (High Impact, Low Effort)
1. Ticker tape component
2. Index card redesign with gradient backgrounds
3. Market status badge in header
4. Stock detail sidebar layout (CSS Grid change)
5. Mobile chart full-bleed

### Phase 2 (High Impact, Medium Effort)
1. Sector treemap/heatmap
2. Market breadth bar
3. Momentum bars (gainers/losers)
4. Sortable stock table
5. Stock header redesign

### Phase 3 (Medium Impact, Higher Effort)
1. Market sentiment gauge
2. Mobile carousel for index cards
3. Pull-to-refresh
4. Tab animations and transitions
5. Counter/price animations

### Not Recommended
- Sidebar navigation (current top-nav is sufficient for this information architecture)
- Auto-advancing carousels (user preference conflicts)
- WebSocket real-time updates (ISR is appropriate for the data refresh cycle)
