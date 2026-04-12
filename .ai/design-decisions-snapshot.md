# unified-design-system.md 이식 가능 결정 사항

> **출처**: `.ai/design-proposals/unified-design-system.md` (1170 lines, v1.0, 2026-03-29)
> **상태**: "확정"으로 표기되어 있으나 **코드 미적용**
> **목적**: DESIGN.md v0.1/v0.2로 가져갈 결정 사항을 섹션별로 정리 + 이식 난이도 표기

---

## 이식 난이도 범례

- 🟢 **직접 복사**: 토큰/CSS 그대로 가져오면 됨.
- 🟡 **적응 필요**: DESIGN.md 포맷(§3 9-섹션)에 맞게 재구성.
- 🔴 **코드 변경 동반**: 토큰만 선언하면 끝나지 않음. 컴포넌트 리팩터 필요.

---

## §1 디자인 원칙 (→ DESIGN.md §1 Visual Theme)

### 핵심 결정 3건 🟢

1. **다크 모드 우선** (근거: 금융 전문가 장시간 모니터링 눈 피로). 라이트는 보조.
2. **글래스모피즘 최소 적용** — 헤더 + 모바일 바텀 탭바에만. 차트 툴팁/티커 테이프/일반 카드 미적용.
3. **노이즈 텍스처 미적용** — `.texture-noise` 전면 제거.

### 5 방향성 🟢

- "Terminal Elegance" (전문 트레이딩 터미널 밀도 + 모던 UI 세련)
- **색상 = oklch 전용**. hex/rgb/Tailwind 색상 직접 사용 금지.
- 레이아웃 = Proposal B (Grid, 반응형)
- 비주얼 토큰 = Proposal A (색, 그림자, 카드, 타이포, 인터랙션)
- 한국 관례 — 빨강=상승(hue 25), 파랑=하락(hue 250)

---

## §2 컬러 시스템 (→ DESIGN.md §2 Color Palette)

### §2.1 배경 5-level 🟢 (신설)

| Level | 변수 | 다크 | 라이트 |
|-------|------|------|-------|
| L0 Base | `--bg-base` | `oklch(0.13 0.005 260)` | `oklch(0.965 0.003 260)` |
| L1 Surface | `--bg-surface` | `oklch(0.17 0.005 260)` | `oklch(0.985 0.002 260)` |
| L2 Card | `--bg-card` | `oklch(0.21 0.005 260)` | `oklch(1.0 0 0)` |
| L3 Elevated | `--bg-elevated` | `oklch(0.25 0.008 260)` | `oklch(1.0 0 0)` + shadow |
| L4 Floating | `--bg-floating` | `oklch(0.30 0.010 260)` | `oklch(1.0 0 0)` + strong shadow |

### §2.2 텍스트 4-level 🟢

`--text-primary / secondary / tertiary / muted` — 다크: `oklch(0.95 → 0.72 → 0.55 → 0.42 / 0 0)`, 라이트: `(0.15 → 0.40 → 0.55 → 0.70)`.

### §2.3 브랜드 액센트 🟢

- Primary: Teal `oklch(0.72 0.17 162)` / Light `(0.45 0.16 162)` (+ hover/muted/foreground)
- Secondary: Blue `oklch(0.70 0.10 250)` / Light `(0.50 0.12 250)`
- Accent: Gold/Amber `oklch(0.80 0.12 85)` / Light `(0.55 0.14 85)`

### §2.4 시맨틱 상태 4종 🟢

success(145) / warning(75) / danger(25) / info(240) — 각각 solid + `-bg` (12% 다크 / 8% 라이트 투명도).

### §2.5 테두리 3단 + focus + gradient 🟢

`--border-subtle/default/strong` (다크: 화이트 6/10/16%, 라이트: 블랙 동일) + `--border-focus` = primary + gradient pair.

### §2.6 주가 방향 컬러 (⭐ 핵심) 🔴

**현 hex를 oklch로 이전해야 함**:
- Up: `oklch(0.72 0.20 25)` (다크) / `oklch(0.55 0.22 25)` (라이트) — 빨강
- Down: `oklch(0.72 0.15 250)` / `oklch(0.55 0.17 250)` — 파랑
- Flat: `oklch(0.60 0 0)` / `oklch(0.55 0 0)` — 회색
- bg 틴트: 12% (다크) / 8% (라이트)
- candle-up/down: stock 색 재사용

### §2.7 마켓 브레드스 투명도 🟢

`--bar-opacity-full/high/medium/low/bg` = 1.0/0.8/0.5/0.3/0.1 + `--breadth-advancing/declining/flat` (stock 색 alias).

### §2.8 전체 CSS 변수 정의 블록 (⭐ 직접 이식 대상) 🟢

unified-design-system.md lines 144–398 전체가 **`globals.css` :root/.light 블록에 그대로 복사 가능**. 코드 내 추가 토큰(index/heatmap/sentiment/dot 등) 포함.

---

## §3 카드 시스템 (→ DESIGN.md §4 Component Stylings) 🟡

6종 변형, CSS-in-JS 블록 포함:

| # | 이름 | 용도 |
|---|------|-----|
| 3.1 | **Default Card** | 일반 콘텐츠 컨테이너 (뉴스, Key Stats, Sector Treemap 래퍼 등) |
| 3.2 | **Interactive Card** | 클릭 가능 아이템 — hover 시 `translateY(-1px)` + elevated bg + medium shadow |
| 3.3 | **Stat Card** | KPI — 좌측 3px 액센트 바 + `data-trend="up|down|flat"`별 그라데이션 |
| 3.4 | **Chart Card** | 차트 전용, padding 0, overflow hidden, 모바일에서 full-bleed |
| 3.5 | **Gradient Border Card** | 특별 강조 (Hot Stocks Top 3, 알림 보유 종목 등). 제한적 사용. |
| 3.6 | **Glass Card** | 헤더 + 모바일 바텀 탭바 **전용**. `backdrop-filter: blur(16px)`. |

**이식 방법**: DESIGN.md §4에서 각 카드를 "variant 이름 + Background/Border/Radius/Shadow/Padding" 6열 포맷으로 재구성.

---

## §4 타이포그래피 (→ DESIGN.md §3 Typography Rules) 🟢

### §4.1 크기 스케일 10단

`--text-2xs/xs/sm/base/md/lg/xl/2xl/3xl/4xl` = 10/12/13/14/15/17/20/24/30/36 px (+ line-height 각각 지정).

### §4.2 무게 4단

`--font-regular/medium/semibold/bold` = 400/500/600/700.

### §4.3 숫자 타이포 (⭐ 필수)

모든 가격/거래량/퍼센트/지수는 **`font-mono` + `font-variant-numeric: tabular-nums`** 강제. 가격 전용 `.font-price`는 `letter-spacing: -0.02em` + weight 700.

### §4.4 자간 규칙

대문자 레이블 0.05em / 본문 0 / ≥xl 제목 -0.01em / ≥2xl 숫자 -0.02em.

### §4.5 Proposal B 유틸 매핑

`.price-large/medium/small`, `.change-pill[data-trend=up|down|flat]` — DESIGN.md §4 Component 예시로 이식.

---

## §5 데이터 시각화 (→ DESIGN.md §10 Market Data — 신설 섹션) 🟢

### §5.1 멀티 시리즈 차트 팔레트 8색

색각 이상 고려. Teal/Orange/Purple/Gold/Cyan/Pink/Lime/Coral. 다크/라이트 페어 있음.

### §5.2 히트맵 9단 (⭐ 한국 관례 그대로)

`--heatmap-1..9`: 진한 파랑 → 회색 → 진한 빨강. -4% 이하 ~ +4% 이상 9단계.

### §5.3 배지 카테고리 8종

KR 시장(25), US 시장(250), 섹터(162), 뉴스 4종(경제/기업/증시/해외), ETF(300). 각 15% bg + full text.

### §5.4 센티먼트 게이지

주가색 혼동 방지를 위해 **보라(300) → 회색 → 금색(85)** 축 사용. `--sentiment-fear/neutral/greed`.

---

## §6 마이크로 인터랙션 (→ DESIGN.md §4 Component + §Motion 부록) 🔴

CSS 애니메이션 12종, 코드 레벨 구현 필요:

| # | 이름 | 핵심 |
|---|------|------|
| 6.1 | 타이밍 토큰 | `--ease-out/in-out/spring` + `--duration-fast/normal/slow` (120/200/350ms) |
| 6.2 | **가격 변동 애니메이션** (시그니처) | `@keyframes price-tick-up/down` — 1.5s 플래시 |
| 6.3 | 숫자 카운트업 | 0.4s ease-out |
| 6.4 | 스켈레톤 Shimmer | `animate-pulse` 대신 그라데이션 shimmer |
| 6.5 | 티커 테이프 | 40px/s scroll + hover pause + 방향 도트 |
| 6.6 | 캐러셀 페이지네이션 도트 | active 6px → 18px 확장 |
| 6.7 | **차트 툴팁** | 글래스 **미적용** (핵심 결정), solid `--bg-floating` |
| 6.8 | 페이지 전환 | 0.3s translateY(8px → 0) |
| 6.9 | 관심종목 별 | spring pop 0.3s |
| 6.10 | **포커스 링** | `:focus-visible` 2px + `outline-offset: 2px` + 다크에서 glow |
| 6.11 | `prefers-reduced-motion` | 0.01ms + 티커 테이프 스크롤 off |
| 6.12 | 히어로/메시 그라데이션 | 3-radial mesh (primary/secondary/accent 8% 각각) |

---

## §7 hex → oklch 변환 테이블 (⭐ M4 작업 지시서) 🔴

### §7.1 globals.css 직접 치환 매핑

| 기존 hex | 용도 | 목표 oklch |
|---------|-----|-----------|
| `#e53e3e` | stock-up light | `oklch(0.55 0.22 25)` |
| `#fff5f5` | stock-up-bg light | `oklch(0.55 0.22 25 / 8%)` |
| `#3182ce` | stock-down light | `oklch(0.55 0.17 250)` |
| `#ebf8ff` | stock-down-bg light | `oklch(0.55 0.17 250 / 8%)` |
| `#718096` | stock-flat | `oklch(0.55 0 0)` |
| `#fc8181` | stock-up dark | `oklch(0.72 0.20 25)` |
| `#3d1f1f` | stock-up-bg dark | `oklch(0.72 0.20 25 / 12%)` |
| `#63b3ed` | stock-down dark | `oklch(0.72 0.15 250)` |
| `#1f2d3f` | stock-down-bg dark | `oklch(0.72 0.15 250 / 12%)` |

### §7.2 Tailwind 유틸 → 토큰 매핑

- `bg-red-500/300` → `--heatmap-9/7`
- `bg-blue-500/300` → `--heatmap-1/3`
- `bg-gray-400` → `--heatmap-5`
- `bg-muted/50` → `--bg-surface`
- `bg-card` → `--bg-card`
- `bg-background` → `--bg-base`
- `shadow-md` → `--shadow-medium`
- `accent/50` → `--bg-elevated`
- `text-muted-foreground` → `--text-secondary`

### §7.3 shadcn 호환 매핑 (하위호환)

shadcn 컴포넌트가 참조하는 `--background/foreground/card/popover/muted/border/ring/destructive` 등은 통합 시스템 변수를 **별칭(alias)으로** 노출. DESIGN.md §4 컴포넌트 상속을 유지하기 위해 필수.

---

## §8 레이아웃 비주얼 가이드 (→ DESIGN.md §5 Layout) 🟡

20개 레이아웃 요소(헤더/티커테이프/Index Widget/Hot Stocks/뉴스/Market Pulse/Sentiment/Sector Treemap/Breadth/종목 상세/차트/사이드바/모바일 바텀/툴팁/모달)별로 **배경/카드유형/그림자/테두리** 4축 매핑 표. DESIGN.md §4 컴포넌트 섹션의 "Layout Application" 하위 표로 이식.

---

## §9 WCAG 접근성 검증 (→ DESIGN.md §7 Do's & Don'ts 근거) 🟢

10개 조합 대비비 계산 완료. 모두 AA 이상, 대부분 AAA. DESIGN.md §7 "Don't: 텍스트 대비 4.5:1 미만 조합 사용" 근거로 활용.

---

## 이식 전략 요약

### v0.1 (M2) — 토큰만

- §2 전체 (컬러 시스템 8 하위섹션 전부)
- §4 타이포그래피 전체
- §5 데이터 시각화 컬러
- §6.1 타이밍 토큰만 (애니메이션 구현은 M3/M4)

### v0.2 (M3) — 컴포넌트

- §3 카드 6종
- §4.5 Proposal B 유틸 클래스 (price-large/medium/small, change-pill)
- §6.2–6.12 인터랙션 (키프레임 CSS 포함)
- §8 레이아웃 요소 20종 매핑 표

### M4 (코드 정렬)

- §2.8 블록을 `globals.css`에 복사
- §7 변환 테이블대로 hex grep & 치환
- shadcn 별칭 매핑 유지

### 미결정

- 디자인 원 제안서의 "Proposal A/B" 원본 파일은 별도 문서로 존재하지 않음. §3/§4/§5 등에서 참조되는 "B가 정의한 유틸리티"는 unified 문서 내에서만 확인 가능 → 원 디자인 소스의 컨텍스트는 이 문서가 **최종본**으로 간주.
- "확정" 상태지만 실제 코드 미적용 → 유저 승인 단계에서 "그대로 가져가는지, 조정할 항목이 있는지" 재확인 필요 (DESIGN.md §8 Next Step 참고).
