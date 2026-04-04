# 통합 디자인 문서 — 페이지 레이아웃

> **기반**: Proposal B (Page Layouts) + Proposal A (Visual System) 통합
> **날짜**: 2026-03-29
> **확정 사항**: 다크 모드 우선 / 글래스모피즘 최소(헤더+바텀탭만) / 노이즈 텍스처 미적용
> **모든 색상**: Proposal A의 oklch 토큰 변수 사용

---

## 1. 홈페이지 대시보드

### 1.1 전체 레이아웃 (Desktop ≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  [티커 테이프 — 수평 무한 스크롤]                             │
│  KOSPI 2,645.32 ▲+0.8%  KOSDAQ 812.45 ▼-0.3%  S&P ...     │
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
│  │  인기 종목 (좌측 칼럼)    │ │  마켓 펄스 (우측 칼럼)      ││
│  │  [Tab: KR | US]         │ │                            ││
│  │                         │ │  ┌─ 심리 게이지 ──────────┐ ││
│  │  1. 삼성전자  72,400원   │ │  │ 공포 ◀━━━●━━▶ 탐욕    │ ││
│  │     ▲+2.1%  ████░░ vol  │ │  └────────────────────────┘ ││
│  │  2. SK하이닉스 142,500원 │ │                            ││
│  │     ▼-1.3%  ██░░░░ vol  │ │  ┌─ 환율 ────────────────┐ ││
│  │  ...                    │ │  │ USD 1,342.5 ▲0.2%     │ ││
│  │                         │ │  │ EUR 1,458.2 ▼0.1%     │ ││
│  │  [전체 보기 → /market]   │ │  └────────────────────────┘ ││
│  └──────────────────────────┘ │                            ││
│                               │  ┌─ 퀵 액션 ──────────────┐ ││
│  ┌──────────────────────────┐ │  │ [스크리너] [AI리포트]   │ ││
│  │  최신 뉴스               │ │  │ [종목비교] [투자가이드]  │ ││
│  │  ┌─ 뉴스 카드 ─────────┐ │ │  └────────────────────────┘ ││
│  │  │ [카테고리뱃지]  2h   │ │ │                            ││
│  │  │ 제목 텍스트...       │ │ │  ┌─ 섹터 미니 히트맵 ────┐ ││
│  │  │ 관련: 삼성전자       │ │ │  │ [트리맵 축소 버전]     │ ││
│  │  └────────────────────┘ │ │  │ [전체 보기 → /sectors] │ ││
│  │  [전체 보기 → /news]    │ │  └────────────────────────┘ ││
│  └──────────────────────────┘ └────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 1.2 CSS Grid 명세

```css
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

/* 태블릿 (768–1023px) */
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

/* 모바일 (<768px) */
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

### 1.3 컴포넌트 상세

#### 티커 테이프 바

| 속성 | 값 |
|---|---|
| 높이 | 36px (모바일 32px) |
| 배경 | `var(--bg-surface)` — L1 레벨, 글래스 미적용 |
| 텍스트 | `font-price` 클래스, `var(--text-2xs)` (10px) |
| 색상 | `var(--color-stock-up)` / `var(--color-stock-down)` — 종목 방향에 따라 |
| 구분자 | `var(--border-subtle)` 수직선 |
| 애니메이션 | `@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`, 40px/s |
| 호버 | 일시정지 (`animation-play-state: paused`) |
| 클릭 | 각 항목 클릭 시 해당 상세 페이지로 이동 |

#### 인덱스 위젯 카드

| 속성 | 값 |
|---|---|
| 카드 스타일 | `.card-stat` — A의 stat 카드 변형 |
| 크기 | 1/4 너비 (데스크톱), 1/2 (태블릿), 캐러셀 (모바일) |
| 높이 | 140px 고정 |
| 좌측 보더 | `3px solid var(--color-stock-up)` 또는 `var(--color-stock-down)` — 방향에 따라 |
| 배경 그래디언트 | 상승: `linear-gradient(135deg, var(--color-stock-up-bg), transparent 60%)` |
| | 하락: `linear-gradient(135deg, var(--color-stock-down-bg), transparent 60%)` |
| 지수명 | `var(--text-sm)`, `font-medium`, `var(--text-secondary)` |
| 가격 | `font-price` 클래스, `var(--text-3xl)` (30px) |
| 변동 | `var(--text-xs)`, 배경 pill — `var(--color-stock-up-bg)` 또는 `var(--color-stock-down-bg)` |
| 미니 차트 | lightweight-charts 영역 차트, 높이 60px, 최근 30 데이터 포인트 |
| 차트 라인 색상 | 지수별 고유 색상 — `var(--index-kospi)`, `var(--index-kosdaq)`, `var(--index-sp500)`, `var(--index-nasdaq)` |
| 차트 영역 채움 | 해당 인덱스 색상 10% 투명도 |
| 호버 | `var(--shadow-medium)`, `scale(1.01)` |
| 로딩 애니메이션 | 숫자 카운트업 600ms (`.animate-count`), 변동값 200ms 지연 페이드인 |

#### 심리 게이지 (Market Sentiment)

| 속성 | 값 |
|---|---|
| 컨테이너 | `.card-default` — 정적 디스플레이 |
| 크기 | ~180px 너비, 마켓 펄스 패널 내 |
| 아크 색상 | **보라(공포)** → **회색(중립)** → **금색(탐욕)** — 주식 색상 혼동 방지 |
| | 공포: `var(--secondary)` (oklch 보라/파랑 계열) |
| | 중립: `var(--text-tertiary)` |
| | 탐욕: `var(--accent)` (금색/앰버 계열) |
| 바늘 | CSS `transform: rotate()`, `transition: var(--duration-slow) var(--ease-out)` |
| 라벨 | "공포"(0) / "탐욕"(100), `var(--text-xs)`, `font-medium` |

#### 인기 종목 섹션

| 속성 | 값 |
|---|---|
| 컨테이너 | `.card-default` |
| 탭 | KR \| US — 밑줄 인디케이터, `transition: left var(--duration-normal) var(--ease-out)` |
| 각 행 스타일 | `.card-interactive` 패턴 (호버 시 `var(--bg-elevated)` + `var(--shadow-medium)`) |
| 순위 번호 | Top 3: `var(--primary)`, `font-bold`. 나머지: `var(--text-secondary)` |
| 종목명 | `var(--text-md)`, `font-semibold` |
| 가격 | `font-price`, `var(--text-sm)` |
| 거래량 바 | 수평 바, 최대 종목 대비 비례 너비 |
| 바 색상 | 상승: `var(--color-stock-up)` 30% opacity, 하락: `var(--color-stock-down)` 30% opacity |
| 행 높이 | 최소 48px (터치 타겟) |
| 최대 항목 | 10개 |

#### 뉴스 피드 카드

| 속성 | 값 |
|---|---|
| 카드 스타일 | `.card-interactive` — 클릭 가능 |
| 카테고리 뱃지 | A의 뱃지 체계: |
| | 한국시장 뉴스: `var(--color-stock-up)` 텍스트 + `var(--color-stock-up-bg)` 배경 |
| | 미국시장 뉴스: `var(--secondary)` 텍스트 + 해당 bg |
| | 섹터 뉴스: `var(--primary)` 텍스트 + `var(--primary-muted)` 배경 |
| | 일반 뉴스: `var(--accent)` 텍스트 + 해당 bg |
| 제목 | `var(--text-md)`, `font-semibold`, `var(--text-primary)` |
| 출처/시간 | `var(--text-xs)`, `var(--text-tertiary)` |
| 관련 종목 | `var(--text-xs)`, `var(--primary)`, 클릭 가능 |
| 호버 | `.card-interactive` 기본 동작 — `translateY(-2px)` + `var(--shadow-medium)` |

#### 퀵 링크 카드

| 속성 | 값 |
|---|---|
| 카드 스타일 | `.card-interactive` |
| 아이콘 | `var(--primary)`, 24px |
| 라벨 | `var(--text-md)`, `font-semibold` |
| 설명 | `var(--text-sm)`, `var(--text-secondary)` |

### 1.4 로딩 상태

모든 스켈레톤은 A의 `.skeleton` 클래스 사용 (gradient shimmer sweep):

```css
.skeleton {
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-floating) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
```

인덱스 카드 스켈레톤: 140px 높이, `border-radius: var(--radius-xl)`.
뉴스 카드 스켈레톤: 80px 높이.

---

## 2. 시장 개요

### 2.1 전체 레이아웃 (Desktop ≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  시장 개요                            USD/KRW 1,342.5 ▲0.2% │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ KOSPI   │ │ KOSDAQ  │ │ S&P 500 │ │ NASDAQ  │          │
│  │ 2,645   │ │ 812     │ │ 5,234   │ │ 16,432  │          │
│  │ [chart] │ │ [chart] │ │ [chart] │ │ [chart] │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ┌─ 마켓 탭 ─────────────────────────────────────────────┐  │
│  │  [한국]  [미국]                                       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  ┌─ 섹터 트리맵 히트맵 ─────────────────────────────┐ │  │
│  │  │  (시가총액 비례 셀 크기, 등락률 기반 색상)         │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─ 마켓 브레드스 바 ───────────────────────────────┐ │  │
│  │  │  상승 423 ████████████████░░░░░░░░ 하락 312      │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─ 상승 TOP 10 ────────┐  ┌─ 하락 TOP 10 ────────┐ │  │
│  │  │ ██████████ +8.2%     │  │ ██████████ -7.1%     │ │  │
│  │  │ ████████░░ +6.5%     │  │ ████████░░ -5.8%     │ │  │
│  │  └──────────────────────┘  └──────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─ 정렬 가능 종목 테이블 ─────────────────────────┐ │  │
│  │  │  종목명  현재가  등락률  거래량  시총  7일차트    │ │  │
│  │  │  ───────────────────────────────────────────── │ │  │
│  │  │  삼성전자  72,400  +2.1%  12.3조  432조  ╱╲╱  │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 CSS Grid 명세

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

@media (max-width: 1023px) {
  .index-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 767px) {
  .index-row { grid-template-columns: 1fr; }
  .movers-split { grid-template-columns: 1fr; }
}
```

### 2.3 컴포넌트 상세

#### 섹터 트리맵 히트맵

| 속성 | 값 |
|---|---|
| 컨테이너 | `.card-default`, 전체 너비, 높이 ~300px |
| 셀 크기 | 시가총액 비중에 비례 (`grid-template-columns` 동적 계산) |
| 셀 색상 | A의 히트맵 그래디언트 9단계: |
| | -4% 이하: `var(--heatmap-1)` — 진한 파랑 |
| | -3%: `var(--heatmap-2)` |
| | -2%: `var(--heatmap-3)` |
| | -1%: `var(--heatmap-4)` |
| | 0% (보합): `var(--heatmap-5)` — 중립 회색 |
| | +1%: `var(--heatmap-6)` |
| | +2%: `var(--heatmap-7)` |
| | +3%: `var(--heatmap-8)` |
| | +4% 이상: `var(--heatmap-9)` — 진한 빨강 |
| 셀 텍스트 | 섹터명: `var(--text-sm)`, `font-semibold`, 흰색 (어두운 배경) 또는 `var(--text-primary)` (밝은 배경) |
| | 등락률: `var(--text-xs)`, `font-mono` |
| 호버 | 툴팁 — 종목 수, 시가총액, 대표 종목. 배경: `var(--bg-floating)`, `var(--shadow-floating)` |
| 클릭 | `/sectors/[name]`으로 이동 |
| 모바일 | 트리맵 → 수평 바 차트 형태로 단순화 |

#### 마켓 브레드스 바

| 속성 | 값 |
|---|---|
| 컨테이너 | 전체 너비, 높이 40px |
| 상승 구간 | `var(--color-stock-up)` at 70% opacity |
| 보합 구간 | `var(--color-stock-flat)` at 50% opacity |
| 하락 구간 | `var(--color-stock-down)` at 70% opacity |
| 라벨 | 양쪽 끝 숫자, `var(--text-sm)`, `font-mono` |
| 하단 텍스트 | "상한가 X · 하한가 Y · 보합 Z", `var(--text-xs)`, `var(--text-tertiary)` |
| 애니메이션 | 너비 0→실제값, 400ms `var(--ease-out)` |
| 모서리 | `var(--radius-md)` |

#### 모멘텀 바 (상승/하락 TOP)

| 속성 | 값 |
|---|---|
| 레이아웃 | 2열 병렬 (`movers-split` 그리드) |
| 각 항목 | `.card-interactive` 패턴 |
| 바 색상 | 상승: `var(--color-stock-up)` at 30% opacity, 하락: `var(--color-stock-down)` at 30% opacity |
| 바 너비 | 최대 등락률 대비 비례 |
| 텍스트 | 종목명: `var(--text-sm)`, `font-medium`. 등락률: `font-price`, `var(--text-sm)` |
| 호버 | 전체 가격/거래량 정보 표시 |
| 최대 항목 | 10개씩 |

#### 정렬 가능 종목 테이블

| 속성 | 값 |
|---|---|
| 컨테이너 | `.card-default` |
| 헤더 | `var(--bg-surface)`, `var(--text-sm)`, `font-semibold`, `var(--text-secondary)` |
| 헤더 정렬 | 클릭 시 정렬 토글, 화살표 인디케이터 (`var(--text-tertiary)` → `var(--primary)`) |
| 행 | `.table-row` — 호버 시 `var(--bg-elevated)` |
| 행 높이 | 48px |
| 숫자 | 모두 `font-price` 클래스 |
| 스파크라인 | 마지막 열, 40px × 20px, lightweight-charts, 지난 7일 데이터 |
| 스티키 헤더 | 스크롤 시 고정, `var(--bg-surface)`, `var(--border-default)` 하단 보더 |
| 페이지네이션 | "더 보기" 버튼, 20개 단위 |
| 모바일 | `overflow-x: auto`, 첫 열(종목명) 스티키 |

#### KR/US 탭 전환

| 속성 | 값 |
|---|---|
| 스타일 | 밑줄 탭 (`.border-b-2`) |
| 활성 | `var(--primary)` 텍스트 + 하단 보더 |
| 비활성 | `var(--text-secondary)`, 호버 시 `var(--text-primary)` |
| 인디케이터 | 슬라이드 애니메이션: `transition: left var(--duration-normal) var(--ease-out)` |
| 콘텐츠 전환 | opacity 0→1, `var(--duration-fast)` |
| URL | `?market=kr` / `?market=us` 쿼리 파라미터 반영 |

---

## 3. 종목 상세

### 3.1 전체 레이아웃 (Desktop ≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  주식 > 삼성전자 (005930)                                    │
│                                                             │
│  ┌─ 종목 헤더 ─────────────────────────────────────────────┐│
│  │  삼성전자                           [★ 관심] [📊 비교]  ││
│  │  Samsung Electronics · 005930 · KOSPI                   ││
│  │                                                         ││
│  │  72,400원                                               ││
│  │  ▲ +1,500 (+2.11%)    시가 71,200  고가 72,800          ││
│  │  03.28 15:30 기준      저가 70,900  거래량 12.3조         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ 차트 (히어로) ──────────────────┐ ┌─ 사이드바 ─────────┐│
│  │                                  │ │                    ││
│  │                                  │ │  핵심 지표          ││
│  │    [lightweight-charts]          │ │  ────────────      ││
│  │    60vh, min 400px               │ │  시가총액  432조    ││
│  │                                  │ │  PER      12.3x    ││
│  │                                  │ │  PBR       1.2x    ││
│  │                                  │ │  배당수익률  2.1%   ││
│  │                                  │ │  ROE      14.2%    ││
│  │                                  │ │                    ││
│  │  [1D][1W][1M][3M][1Y][3Y]       │ │  52주 레인지        ││
│  │  [캔들|라인|영역] [지표]          │ │  저 58,800 ━●━━━   ││
│  └──────────────────────────────────┘ │       고 78,200    ││
│                                       │                    ││
│                                       │  관련 종목          ││
│                                       │  SK하이닉스 +1.2%  ││
│                                       │  삼성SDI   -0.5%   ││
│                                       └────────────────────┘│
│                                                             │
│  ┌─ 콘텐츠 탭 ────────────────────────────────────────────┐│
│  │  [개요] [재무] [뉴스] [이벤트] [AI 리포트]              ││
│  │  ──────────────────────────────────────────────────────  ││
│  │  [탭 콘텐츠 영역]                                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 3.2 CSS Grid 명세

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
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  overflow: hidden; /* 차트 컨테이너 전용 */
  padding: 0; /* 내부 차트가 꽉 참 */
}

.stock-sidebar {
  grid-area: sidebar;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 태블릿: 사이드바가 차트 아래로 */
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
    flex-direction: row;
    overflow-x: auto;
  }
}

/* 모바일: 차트 풀 블리드 */
@media (max-width: 767px) {
  .stock-chart-area {
    min-height: 300px;
    height: 50vh;
    margin: 0 -16px;
    width: calc(100% + 32px);
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
```

### 3.3 컴포넌트 상세

#### 종목 헤더

| 속성 | 값 |
|---|---|
| 배경 | `var(--bg-surface)` — L1 레벨 |
| 보더 | `var(--border-default)`, `var(--radius-xl)` |
| 종목명 | `var(--text-2xl)` (24px), `font-bold`, `var(--text-primary)` |
| 영문명/티커/거래소 | `var(--text-sm)`, `var(--text-secondary)` |
| 가격 | `font-price`, `var(--text-4xl)` (36px), 방향에 따라 `var(--color-stock-up)` 또는 `var(--color-stock-down)` |
| 변동 pill | `var(--text-sm)`, `font-mono`, 방향 배경 pill |
| 타임스탬프 | `var(--text-xs)`, `var(--text-tertiary)` |
| OHLV 행 | `var(--text-sm)`, `font-mono`, `var(--text-secondary)` |
| 액션 버튼 | 관심종목 ★ — 토글 시 `.star-pop` 애니메이션, `var(--accent)` 색상 |
| 프리/포스트 마켓 | (데이터 있을 때) `var(--text-xs)`, `var(--text-tertiary)`, 가격 아래 표시 |

#### 차트 영역 (히어로)

| 속성 | 값 |
|---|---|
| 컨테이너 | `.stock-chart-area` — `padding: 0`, `overflow: hidden` |
| 크기 | 60vh, min 400px, max 600px |
| 차트 라이브러리 | lightweight-charts |
| 기본 차트 | 캔들스틱 (KR), 라인 (US) |
| 기간 선택 | `1D | 1W | 1M | 3M | 1Y | 3Y | MAX` — pill 토글 버튼 |
| | 활성: `var(--primary)` bg + `var(--primary-foreground)` text |
| | 비활성: `var(--bg-elevated)` bg, 호버 시 `var(--bg-floating)` |
| 지표 버튼 | 팝오버 — MA(5,20,60,120), Bollinger, RSI, MACD, Volume |
| 크로스헤어 | 점선, `var(--text-tertiary)` 색상 |
| 크로스헤어 툴팁 | `var(--bg-floating)`, `var(--shadow-elevated)`, `var(--radius-lg)` — 글래스 미적용, 불투명 배경 |
| 거래량 | 하단 서브 차트, 전체 높이의 20% |
| 캔들 색상 | 양봉: `var(--color-stock-up)`, 음봉: `var(--color-stock-down)` |
| 캔들 심지 | 동일 색상 60% opacity |
| 모바일 | 풀 블리드, 50vh, 핀치 줌, 스와이프 팬, 롱프레스 크로스헤어 |

#### 사이드바 패널

| 섹션 | 카드 스타일 | 내용 |
|---|---|---|
| 핵심 지표 | `.card-stat` | 2열 그리드: 라벨(`var(--text-xs)`, `var(--text-tertiary)`) + 값(`font-price`, `var(--text-md)`) |
| 52주 레인지 | `.card-default` | 수평 슬라이더, 현재가 위치를 `var(--primary)` 점으로 표시 |
| 관련 종목 | `.card-interactive` 행들 | 3~5 종목, 이름 + 등락률. 클릭 시 이동. |

#### 콘텐츠 탭

| 속성 | 값 |
|---|---|
| 탭 바 스타일 | 밑줄 탭, 스크롤 시 차트 하단에 스티키 |
| 활성 탭 | `var(--primary)` 텍스트 + `border-b-2 var(--primary)` |
| 뱃지 | AI 리포트 탭에 카운트 뱃지 — `var(--accent)` bg, `var(--text-xs)` |
| 콘텐츠 전환 | `opacity 0→1`, `var(--duration-fast)` |
| 탭 목록 | 개요, 재무, 뉴스, 이벤트(배당+실적+공시), AI 리포트 |
| 각 탭 | Suspense + `.skeleton` 로딩 |
| 모바일 | 세그먼트 컨트롤 스타일, 접이식 하위 섹션 |

---

## 4. 네비게이션

### 4.1 헤더 (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ 📈 StockView  홈  투자정보  분석  뉴스  더보기               │
│                    🟢 장중 15:22    [🔍 종목 검색... ⌘K]  🌙 👤 │
├─────────────────────────────────────────────────────────────┤
│  시장 · ETF · 섹터 · 배당 · 실적        (2단 서브 네비)      │
└─────────────────────────────────────────────────────────────┘
```

| 속성 | 값 |
|---|---|
| 1단 높이 | `h-14` (56px) |
| 2단 높이 | `h-10` (40px) |
| **1단 배경** | **글래스모피즘 적용** — `var(--glass-bg)` + `backdrop-filter: blur(var(--glass-blur))` |
| 1단 하단 보더 | `var(--glass-border)` |
| 2단 배경 | `var(--bg-surface)` — 솔리드 (글래스 미적용) |
| 2단 하단 보더 | `var(--border-subtle)` |
| 로고 | `var(--primary)` 아이콘 + `var(--text-primary)` 텍스트, `font-bold`, `var(--text-lg)` |
| 네비 링크 (비활성) | `var(--text-secondary)`, 호버 시 `var(--text-primary)` + `var(--bg-elevated)` |
| 네비 링크 (활성) | `var(--text-primary)`, `var(--bg-elevated)` 배경 |
| 서브 네비 링크 (활성) | `var(--primary)`, `font-medium`, `border-b-2 var(--primary)` |
| 검색바 | 320px, `var(--bg-elevated)` 배경, `var(--border-default)` 보더, `⌘K` 힌트 |
| 테마 토글 | `var(--text-secondary)`, 호버 시 `var(--bg-elevated)` |

#### 마켓 상태 뱃지

| 상태 | 표시 | 색상 |
|---|---|---|
| 장중 | `🟢 장중 HH:MM` | `var(--success)`, 점 pulse 애니메이션 |
| 장마감 | `🔴 장마감` | `var(--danger)`, 정적 |
| 프리마켓 | `🟡 프리마켓` | `var(--warning)` |
| 애프터마켓 | `🟡 애프터마켓` | `var(--warning)` |
| 휴장 | `⚪ 주말` / `⚪ 공휴일` | `var(--text-tertiary)` |

위치: 네비 링크와 검색바 사이. `var(--text-xs)`, `font-medium`.

### 4.2 모바일 바텀 탭 바

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   🏠       🔍       📊       ⭐       👤        │
│   홈       검색      시장     관심     MY         │
│                                                  │
└──────────────────────────────────────────────────┘
```

| 속성 | 값 |
|---|---|
| 높이 | `h-14` (56px) + `env(safe-area-inset-bottom)` |
| **배경** | **글래스모피즘 적용** — `var(--glass-bg)` + `backdrop-filter: blur(var(--glass-blur))` |
| 상단 보더 | `var(--glass-border)` |
| 비활성 아이콘/텍스트 | `var(--text-tertiary)` |
| 활성 아이콘/텍스트 | `var(--primary)` + 아이콘 위 작은 점 인디케이터 |
| 터치 타겟 | 각 탭 전체 높이 (56px), flex-1 |
| 라벨 | `var(--text-2xs)` (10px) |
| 표시 조건 | `lg:hidden` — 데스크톱에서 숨김 |

### 4.3 브레드크럼

| 속성 | 값 |
|---|---|
| 텍스트 | `var(--text-xs)`, `var(--text-tertiary)` |
| 구분자 | 셰브론 (`>`) |
| 링크 | 마지막 항목 제외 클릭 가능, `var(--primary)` on hover |
| 위치 | 페이지 콘텐츠 최상단, 헤더 아래 |
| 모바일 | 3단계 초과 시 중간 생략 ("..."), 마지막 2개만 표시 |

---

## 5. 모바일 전략

### 5.1 홈페이지 모바일

```
┌──────────────────────────┐
│  [티커 테이프 — 스크롤]   │
├──────────────────────────┤
│ ← [KOSPI 카드] → [KOSDAQ]│  ← 수평 캐러셀
│      ● ○ ○ ○            │  ← 페이지네이션 도트
├──────────────────────────┤
│  인기 종목 [KR|US]       │
│  1. 삼성전자  72,400원   │
│     ▲+2.1%              │
│  2. SK하이닉스 142,500원 │
│  더보기 →                 │
├──────────────────────────┤
│  최신 뉴스               │
│  [카드 1] [카드 2]       │
│  더보기 →                 │
├──────────────────────────┤
│  환율 · 퀵링크 · 게이지  │
│  (접이식 섹션)            │
└──────────────────────────┘
│  🏠  🔍  📊  ⭐  👤    │
└──────────────────────────┘
```

#### 인덱스 카드 캐러셀

| 속성 | 값 |
|---|---|
| 스크롤 | `scroll-snap-type: x mandatory` |
| 카드 너비 | `calc(100vw - 64px)` — 좌우 16px 피킹 |
| 카드 스냅 | `scroll-snap-align: center` |
| 페이지네이션 도트 | 활성: `var(--primary)`, 비활성: `var(--border-default)` |
| 도트 크기 | 6px 원형 |
| 도트 간격 | 8px |

### 5.2 시장 페이지 모바일

- 트리맵 → 수평 색상 바 차트로 변환 (바 색상: `var(--heatmap-*)`)
- 테이블 → 카드 리스트 (기본) 또는 수평 스크롤 테이블 ("표 보기" 토글)
- 모멘텀 바: 1열 세로 스택

### 5.3 종목 상세 모바일

```
┌──────────────────────────┐
│  ← 삼성전자              │
│  72,400원  ▲+2.11%       │
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │    차트 (풀 블리드)  │  │  50vh, 핀치/스와이프
│  │    margin: 0 -16px  │  │
│  │ [1D][1W][1M][3M].. │  │
│  └────────────────────┘  │
│                          │
│  ← 시총 432조 | PER 12.3→│  수평 스크롤 스탯 칩
│                          │
├──────────────────────────┤
│  [개요][재무][뉴스][이벤트]│  세그먼트 컨트롤
│  ──────────────────────── │
│  ▸ 기업 개요              │  접이식 섹션
│  ▸ 주요 재무지표          │
│  ▾ 관련 뉴스              │
│    - 뉴스 카드 1          │
└──────────────────────────┘
│  [★ 관심종목 추가]        │  스티키 CTA (스크롤 후 표시)
│  🏠  🔍  📊  ⭐  👤    │
└──────────────────────────┘
```

#### 스티키 CTA 바

| 속성 | 값 |
|---|---|
| 위치 | 바텀탭 바로 위, `position: fixed` |
| 높이 | 56px |
| 배경 | `var(--bg-surface)` — 솔리드 (글래스 미적용) |
| 상단 그림자 | `var(--shadow-medium)` 반전 (위로 향하는 그림자) |
| 버튼 | `var(--primary)` bg, 전체 너비 |
| 표시 조건 | 차트 영역을 지나 스크롤한 후 페이드인 |
| 숨김 조건 | 이미 관심종목에 있으면 자동 숨김 |

### 5.4 전역 모바일 패턴

#### 터치 타겟

| 요소 | 최소 크기 |
|---|---|
| 인터랙티브 요소 전체 | 44px × 44px (Apple HIG) |
| 종목 행 | 높이 48px |
| 버튼 | 높이 36px, 터치 타겟 44px (패딩 포함) |
| 탭 아이템 | 전체 탭바 높이 (56px) |

#### 풀투리프레시

| 속성 | 값 |
|---|---|
| 대상 페이지 | 홈, 시장, 관심종목 |
| 트리거 거리 | 80px 풀 다운 |
| 인디케이터 | StockView 로고 회전 |
| 구현 | `overscroll-behavior: contain` + 터치 이벤트 |

---

## 6. 컴포넌트-토큰 매핑 테이블

모든 컴포넌트가 Proposal A의 어떤 디자인 토큰을 사용하는지 완전한 매핑.

### 6.1 배경 레벨 매핑

| 컴포넌트 | 배경 레벨 | 토큰 |
|---|---|---|
| 페이지 배경 | L0 | `var(--bg-base)` |
| 티커 테이프 | L1 | `var(--bg-surface)` |
| 헤더 1단 | Glass | `var(--glass-bg)` + `backdrop-filter: blur(var(--glass-blur))` |
| 헤더 2단 (서브네비) | L1 | `var(--bg-surface)` |
| 모바일 바텀탭 | Glass | `var(--glass-bg)` + `backdrop-filter: blur(var(--glass-blur))` |
| 카드 (기본/인터랙티브/스탯) | L2 | `var(--bg-card)` |
| 호버 상태 | L3 | `var(--bg-elevated)` |
| 툴팁, 차트 크로스헤어 | L4 | `var(--bg-floating)` |
| 모달, 팝오버 | L4 | `var(--bg-floating)` |
| 테이블 헤더 (스티키) | L1 | `var(--bg-surface)` |
| 사이드바 (종목 상세) | L1 | `var(--bg-surface)` |
| 스티키 CTA 바 (모바일) | L1 | `var(--bg-surface)` |

### 6.2 카드 변형 매핑

| 컴포넌트 | 카드 변형 | 비고 |
|---|---|---|
| 인덱스 위젯 카드 | `.card-stat` | `data-trend="up/down"` → 좌측 보더 + 그래디언트 |
| 환율 카드 | `.card-stat` | 동일 |
| 뉴스 피드 카드 | `.card-interactive` | 클릭 가능, 호버 리프트 |
| 퀵 링크 카드 | `.card-interactive` | 클릭 가능, 호버 리프트 |
| 인기 종목 각 행 | `.card-interactive` 패턴 | 행 단위 호버 |
| 섹터 히트맵 컨테이너 | `.card-default` | 정적 컨테이너 |
| 마켓 브레드스 바 컨테이너 | 없음 (배경 없이 직접 렌더) | |
| 종목 테이블 컨테이너 | `.card-default` | 정적 컨테이너 |
| 심리 게이지 패널 | `.card-default` | 정적 디스플레이 |
| 사이드바 — 핵심 지표 | `.card-stat` | PER, PBR 등 |
| 사이드바 — 52주 레인지 | `.card-default` | 시각화 컨테이너 |
| 사이드바 — 관련 종목 행 | `.card-interactive` 패턴 | 클릭 가능 |
| 차트 영역 | 전용 스타일 | `var(--bg-card)`, `padding: 0`, `overflow: hidden` |

### 6.3 타이포그래피 매핑

| 용도 | 크기 토큰 | 무게 | 클래스 |
|---|---|---|---|
| 차트 축 라벨 | `var(--text-2xs)` (10px) | regular | `font-mono` |
| 타임스탬프, 뱃지, 캡션 | `var(--text-xs)` (12px) | regular/medium | |
| 테이블 셀, 설명 | `var(--text-sm)` (13px) | regular | |
| 본문, 라벨, 목록 | `var(--text-base)` (14px) | regular | |
| 카드 제목, 테이블 헤더 | `var(--text-md)` (15px) | medium | |
| 섹션 제목, 종목명 | `var(--text-lg)` (17px) | semibold | |
| 가격 (중간) | `var(--text-xl)` (20px) | bold | `font-price` |
| 페이지 제목 | `var(--text-2xl)` (24px) | bold | |
| 인덱스 값 (대형) | `var(--text-3xl)` (30px) | bold | `font-price` |
| 종목 상세 가격 (히어로) | `var(--text-4xl)` (36px) | bold | `font-price` |

### 6.4 색상 매핑

| 용도 | 토큰 |
|---|---|
| 주가 상승 텍스트 | `var(--color-stock-up)` |
| 주가 상승 배경 | `var(--color-stock-up-bg)` |
| 주가 하락 텍스트 | `var(--color-stock-down)` |
| 주가 하락 배경 | `var(--color-stock-down-bg)` |
| 보합 | `var(--color-stock-flat)` |
| 히트맵 셀 (-4%~+4%) | `var(--heatmap-1)` ~ `var(--heatmap-9)` |
| KOSPI 차트 라인 | `var(--index-kospi)` |
| KOSDAQ 차트 라인 | `var(--index-kosdaq)` |
| S&P 500 차트 라인 | `var(--index-sp500)` |
| NASDAQ 차트 라인 | `var(--index-nasdaq)` |
| USD/KRW 차트 라인 | `var(--index-usdkrw)` |
| 뉴스 뱃지 (한국시장) | bg: A의 Market KR 뱃지 색상, text: 동일 |
| 뉴스 뱃지 (미국시장) | bg: A의 Market US 뱃지 색상, text: 동일 |
| 뉴스 뱃지 (섹터) | bg: `var(--primary-muted)`, text: `var(--primary)` |
| 뉴스 뱃지 (일반) | bg: A의 News 뱃지 색상, text: 동일 |
| 심리 게이지 — 공포 | `var(--secondary)` (보라/파랑) |
| 심리 게이지 — 중립 | `var(--text-tertiary)` |
| 심리 게이지 — 탐욕 | `var(--accent)` (금색) |
| 마켓 상태 — 장중 | `var(--success)` |
| 마켓 상태 — 장마감 | `var(--danger)` |
| 마켓 상태 — 프리/애프터 | `var(--warning)` |

### 6.5 그림자 매핑

| 상태 | 토큰 |
|---|---|
| 카드 기본 | `var(--shadow-subtle)` |
| 카드 호버 | `var(--shadow-medium)` |
| 모달, 확장 패널 | `var(--shadow-elevated)` |
| 툴팁, 커맨드 팔레트, 플로팅 | `var(--shadow-floating)` |

### 6.6 애니메이션 매핑

| 상호작용 | 이징 | 지속시간 | 출처 |
|---|---|---|---|
| 호버 효과, 활성 상태 | `var(--ease-out)` | `var(--duration-fast)` (120ms) | A |
| 카드 전환, 색상 변경 | `var(--ease-in-out)` | `var(--duration-normal)` (200ms) | A |
| 모달 열기/닫기, 레이아웃 | `var(--ease-out)` | `var(--duration-slow)` (350ms) | A |
| 관심종목 토글 | `var(--ease-spring)` | 300ms | A |
| 가격 변동 플래시 | `var(--ease-out)` | 1.5s | A |
| 숫자 카운트업 | `var(--ease-out)` | 400ms | A |
| 스켈레톤 시머 | ease-in-out | 1.5s infinite | A |
| 티커 테이프 스크롤 | linear | continuous (40px/s) | B |
| 탭 인디케이터 슬라이드 | `var(--ease-out)` | `var(--duration-normal)` | B+A |
| 마켓 브레드스 바 확장 | `var(--ease-out)` | 400ms | B |
| 페이지 진입 | `var(--ease-out)` | 300ms | A |

### 6.7 글래스모피즘 적용 범위 (확정)

| 요소 | 글래스 적용 | 이유 |
|---|---|---|
| 헤더 1단 | **적용** | 스크롤 시 콘텐츠 비침 효과 |
| 모바일 바텀탭 | **적용** | 콘텐츠 위 플로팅 느낌 |
| 헤더 2단 (서브네비) | 미적용 | `var(--bg-surface)` 솔리드 |
| 차트 툴팁 | 미적용 | `var(--bg-floating)` 솔리드 |
| 티커 테이프 | 미적용 | `var(--bg-surface)` 솔리드 — 가독성 우선 |
| 카드 전체 | 미적용 | `var(--bg-card)` 솔리드 |
| 스티키 CTA (모바일) | 미적용 | `var(--bg-surface)` 솔리드 |
| 모달/팝오버 | 미적용 | `var(--bg-floating)` 솔리드 |
