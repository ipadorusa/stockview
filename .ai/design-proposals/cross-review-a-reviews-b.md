# Cross-Review: Proposal A가 Proposal B를 리뷰

> **리뷰어**: UX Designer A (Visual System Designer)
> **대상**: Proposal B — Page Layout Redesign
> **날짜**: 2026-03-29

---

## 1. 전체 평가

Proposal B는 훌륭한 레이아웃 설계안이다. Bloomberg/TradingView 수준의 정보 밀도를 달성하면서도 모바일 대응까지 체계적으로 다뤘다. 특히 홈페이지의 CSS Grid 구조, 종목 상세의 chart-centric 레이아웃, 그리고 모바일의 full-bleed 차트 패턴은 Proposal A의 비주얼 시스템과 결합 시 강력한 시너지를 낼 수 있다.

다만, B가 자체적으로 정의한 색상/카드/타이포그래피 토큰이 A의 시스템과 **불일치하는 부분**이 있어 통합 시 조율이 필요하다.

---

## 2. 시너지가 좋은 부분 (잘 맞는 점)

### 2.1 Index Widget Cards + Stat Card 시스템

B의 Index Widget Card 설계(140px 고정 높이, 미니 차트, 방향별 gradient 배경)는 A의 `card-stat` 변형과 완벽히 매칭된다.

- B의 `border-stock-up/20 left edge (3px solid)` → A의 `.card-stat[data-trend="up"]`의 `border-left: 3px solid var(--color-stock-up)` 동일 패턴
- B의 `from-stock-up-bg/30 to-transparent` gradient → A의 `linear-gradient(135deg, var(--color-stock-up-bg), transparent 60%)` 동일 의도

**권장사항**: B의 Index Widget에 A의 `card-stat` CSS를 그대로 적용. 추가로 A의 `--shadow-subtle` + dark mode inner glow(`inset 0 1px 0 oklch(1 0 0 / 5%)`)를 더하면 깊이감이 생긴다.

### 2.2 Ticker Tape + Glass 시스템

B의 Ticker Tape(`bg-muted/50` light, `bg-card` dark)와 모바일 Bottom Tab Bar(`bg-background/95 backdrop-blur-sm`)는 A의 glassmorphism 카드 시스템으로 통합하면 일관성이 높아진다.

**권장사항**:
- Ticker Tape → A의 `--glass-bg` + `backdrop-blur(--glass-blur)` 적용
- Bottom Tab Bar → 이미 `backdrop-blur-sm`을 쓰므로 A의 `--glass-bg`, `--glass-border` 토큰으로 통일

### 2.3 종목 상세 Sidebar + Card 계층

B의 Sidebar(sticky, 320px, Key Stats / 52W Range / Related Stocks 각각 Card 안에 배치)는 A의 배경 계층 구조와 자연스럽게 결합된다.

**권장사항**:
- Sidebar 자체 배경: `--bg-surface` (L1)
- Sidebar 내 각 카드: `--bg-card` (L2)
- 이렇게 하면 sidebar가 메인 차트 영역과 시각적으로 분리되면서도 일체감을 유지

### 2.4 모바일 패턴

B의 모바일 전략(full-bleed 차트, scroll-snap 캐러셀, collapsible 섹션)은 A의 비주얼 시스템과 충돌 없이 적용 가능. 특히 A의 `page-enter` 애니메이션이 B의 route change fade와 잘 연결된다.

---

## 3. 불일치 및 충돌 사항

### 3.1 색상 시스템 불일치 (가장 큰 이슈)

B는 **hex 색상**을 직접 사용하고 있으나, A는 모든 색상을 **oklch**로 정의했다.

| B의 값 | A의 대응 값 | 차이 |
|--------|------------|------|
| `#e53e3e` (stock-up light) | `oklch(0.55 0.22 25)` | oklch가 더 정확한 지각 균일성 |
| `#fc8181` (stock-up dark) | `oklch(0.72 0.20 25)` | 유사하나 미세 차이 |
| `#3182ce` (stock-down light) | `oklch(0.55 0.17 250)` | oklch 값이 약간 다른 톤 |
| `#63b3ed` (stock-down dark) | `oklch(0.72 0.15 250)` | 유사 |
| `#fff5f5` (up-bg light) | `oklch(0.55 0.22 25 / 8%)` | A는 opacity 기반, B는 고정 색 |
| `#718096` (flat) | `oklch(0.55 0 0)` | 유사 |

**권장사항**: A의 oklch 값으로 통일. oklch는 Tailwind CSS 4의 기본 색상 공간이며, 지각적 균일성(perceptual uniformity)이 보장되어 dark/light 모드 전환 시 자연스러운 대비를 유지한다. B의 hex 값들은 마이그레이션 시 A의 CSS 변수로 교체.

### 3.2 카드 시스템 정의 중복

B가 섹션 6에서 자체 `.dashboard-card` 시스템을 정의했다:

```css
/* B의 정의 */
.dashboard-card {
  @apply bg-card border rounded-lg p-4;
  @apply hover:shadow-md transition-shadow;
}
```

이것은 A의 `.card-interactive`와 의도는 같지만 세부 사항이 다르다:
- B: `rounded-lg`, `shadow-md` on hover
- A: `rounded-xl`, `--shadow-medium` on hover, `translateY(-1px)`, `border-color` 전환

**권장사항**: A의 카드 시스템을 기본으로 채택하되, B의 `.dashboard-card-title`의 `uppercase tracking-wider` 스타일은 유용하므로 A의 타이포그래피 스케일에 반영. `rounded-lg` vs `rounded-xl`은 `--radius-xl`(A의 기본값 0.875rem)로 통일.

### 3.3 그림자 시스템 미스매치

B는 Tailwind 기본 그림자(`shadow-md`)를 사용하지만, A는 커스텀 4단계 그림자 체계(`--shadow-subtle/medium/elevated/floating`)를 정의했다. dark mode에서 Tailwind 기본 그림자는 거의 보이지 않는 문제가 있다.

**권장사항**: A의 커스텀 그림자 토큰을 사용. 특히 dark mode에서 `inset glow` 기법이 포함되어 있어 카드 경계가 명확하게 보인다. B의 모든 `shadow-md` 참조를 `shadow-[--shadow-medium]`으로 교체.

### 3.4 배경 계층 미적용

B는 모든 카드에 `bg-card`만 사용하고, 페이지 배경은 `bg-background`만 사용한다. A의 5단계 배경 계층(`--bg-base` ~ `--bg-floating`)을 활용하지 않고 있다.

**구체적 적용 예시**:

| B의 요소 | 현재 | A 적용 후 |
|----------|------|----------|
| 페이지 배경 | `bg-background` | `--bg-base` (L0) |
| Ticker Tape | `bg-muted/50` | `--bg-surface` (L1) |
| 각 섹션 카드 | `bg-card` | `--bg-card` (L2) |
| 호버 상태 | `accent/50` | `--bg-elevated` (L3) |
| 툴팁 / 드롭다운 | `bg-popover` | `--bg-floating` (L4) |

이렇게 하면 "white background + text only" 문제가 구조적으로 해결된다.

### 3.5 Sector Treemap 색상

B의 섹터 트리맵 색상이 Tailwind 유틸리티(`bg-red-500`, `bg-red-300`, `bg-blue-500` 등)를 사용하고 있다. 이는 A의 히트맵 그라데이션(`--heatmap-1` ~ `--heatmap-9`)과 충돌한다.

**권장사항**: A의 9단계 히트맵 시스템 적용. B의 5단계보다 세밀하고, oklch 기반이라 dark/light 모드에서 균일한 대비를 보장한다.

---

## 4. B에 추가되어야 할 비주얼 처리

### 4.1 Gradient Border 카드 활용처 부재

A의 `.card-gradient-border`(gradient 테두리)를 B의 레이아웃 중 어디에 적용할지 명시되지 않았다.

**제안 적용처**:
- 홈페이지 "Hot Stocks" 섹션의 Top 3 종목
- 관심종목(Watchlist) 페이지의 알림이 있는 종목
- 종목 상세 Header에서 해당 종목이 상한가/하한가일 때

### 4.2 Glass Card 활용처

A의 glassmorphism 카드가 B의 레이아웃에서 활용될 곳:
- **Ticker Tape Bar**: glass 배경 + blur → 아래 콘텐츠가 살짝 비침
- **모바일 Bottom Tab Bar**: 이미 `backdrop-blur-sm` 사용 → A의 glass 토큰으로 강화
- **차트 툴팁**: B가 crosshair tooltip을 언급하지만 스타일 미정의 → A의 `.chart-tooltip` 적용
- **Market Status Badge 확장 패널**: 클릭 시 열리는 패널에 glass 효과

### 4.3 Price Tick 애니메이션 누락

B는 "price change flash"를 300ms fade로만 정의했지만, A는 더 정교한 `price-tick-up/down` 키프레임 애니메이션(1.5s, 배경 + 색상 동시 전환)을 설계했다. 금융 앱의 핵심 인터랙션이므로 A의 버전을 채택해야 한다.

**적용 위치**: Ticker Tape, Index Widget Card, Hot Stocks 리스트, 종목 상세 Header의 가격 표시 — B가 정의한 모든 가격 표시 요소.

### 4.4 스켈레톤 로딩 비주얼 개선

B는 `animate-pulse`(Tailwind 기본)만 언급했으나, A는 gradient shimmer 애니메이션(방향성 있는 반짝임)을 정의했다. Shimmer가 더 professional한 인상을 준다.

### 4.5 Market Sentiment Gauge 색상

B의 Sentiment Gauge가 "blue(fear) → gray → red(greed)" 그라데이션을 사용하는데, 이것이 주식 등락 색상(red=up, blue=down)과 혼동될 수 있다.

**권장사항**: Fear/Greed 게이지는 A의 `--chart-3`(purple, oklch 300) → `--text-tertiary`(gray) → `--accent`(gold/amber, oklch 85) 그라데이션을 사용하여 주가 방향 색상과 의미적으로 분리.

### 4.6 Focus Ring 시스템 미언급

B는 키보드 내비게이션(Tab 간 Arrow 이동 등)을 언급하면서도 focus ring 스타일을 정의하지 않았다. A의 focus ring 시스템(`:focus-visible` + dark mode glow)을 적용해야 접근성이 확보된다.

---

## 5. 통합 권장사항 요약

### 즉시 통합 (Phase 1과 함께)

| 항목 | 조치 |
|------|------|
| 색상 시스템 | B의 모든 hex 값을 A의 oklch CSS 변수로 교체 |
| 배경 계층 | B의 레이아웃 요소에 A의 5단계 배경 매핑 적용 |
| 그림자 | B의 `shadow-md` 등을 A의 `--shadow-*` 토큰으로 교체 |
| 카드 시스템 | B의 `.dashboard-card`를 A의 카드 변형 시스템으로 대체 |
| 트리맵 색상 | B의 Tailwind 색상을 A의 `--heatmap-*` 9단계로 교체 |

### 점진적 통합 (Phase 2-3)

| 항목 | 조치 |
|------|------|
| Glassmorphism | Ticker Tape, Bottom Tab Bar, 차트 툴팁에 A의 glass 토큰 적용 |
| Gradient Border | Hot Stocks Top 3, 특수 상태 종목에 적용 |
| Price Tick | B의 300ms flash를 A의 1.5s 키프레임으로 교체 |
| 스켈레톤 | `animate-pulse`를 A의 shimmer 그라데이션으로 교체 |
| Sentiment 색상 | red/blue 혼동 방지를 위해 purple→gray→gold로 변경 |

### 설계 원칙 정리

1. **색상은 A에서 가져온다** — oklch 변수만 사용, hex 직접 사용 금지
2. **레이아웃은 B에서 가져온다** — Grid 구조, 반응형 breakpoint, 컴포넌트 배치
3. **인터랙션은 A의 타이밍 토큰 사용** — `--duration-fast/normal/slow`, `--ease-out/in-out/spring`
4. **카드는 A의 변형 시스템 사용** — default, glass, gradient-border, interactive, stat
5. **타이포그래피는 A의 스케일 사용** — B의 `.price-large/medium/small`은 A의 `--text-*` + `--font-*` 조합으로 표현

---

*리뷰 완료. 두 제안서는 상호 보완적이며, 위 권장사항을 따르면 구현 시 일관된 디자인 시스템으로 통합 가능합니다.*
