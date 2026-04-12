# StockView 현 디자인 토큰 스냅샷

> **출처**: `src/app/globals.css` (148 lines, 2026-04-12 기준)
> **목적**: M4(코드 정렬) 이전에 "현재 상태 → 목표 상태" 이식 범위를 명확화.

## 1. 구조 개요

```
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));

@theme inline { ... Tailwind 4 색/폰트/라운드 매핑 ... }

:root        { ... 라이트 모드 값 (dual) ... }
.dark        { ... 다크 모드 오버라이드 ... }

@layer base  { border/body/html/font-mono 유틸 3줄 }
```

- **Tailwind 버전**: 4 (`@theme inline` 기반, `tailwind.config.*` 없음)
- **Plugin**: tw-animate-css, shadcn/tailwind.css, @tailwindcss/typography
- **다크 모드 방식**: `.dark` 클래스 커스텀 variant (next-themes 호환)
- **폰트 시스템**: `--font-pretendard` → "Pretendard Variable" 폴백 → 한국어 시스템 폰트

## 2. 토큰 인벤토리 (현재 존재)

### 2.1 색상 — 주가 계열 (⚠ hex 하드코딩)

| 변수 | 라이트 | 다크 | 문제 |
|------|-------|------|------|
| `--color-stock-up` | `#e53e3e` | `#fc8181` | ❌ hex |
| `--color-stock-up-bg` | `#fff5f5` | `#3d1f1f` | ❌ hex |
| `--color-stock-down` | `#3182ce` | `#63b3ed` | ❌ hex |
| `--color-stock-down-bg` | `#ebf8ff` | `#1f2d3f` | ❌ hex |
| `--color-stock-flat` | `#718096` | (dark 미정의) | ❌ hex + 다크 누락 |
| `--color-chart-candle-up` | `#e53e3e` | 상속 | ❌ hex |
| `--color-chart-candle-down` | `#3182ce` | 상속 | ❌ hex |

### 2.2 색상 — shadcn 시맨틱 (✅ oklch)

| 변수 | 라이트 | 다크 |
|------|-------|------|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| `--card-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| `--popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.45 0.16 155)` (teal) | `oklch(0.65 0.18 155)` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.15 0 0)` |
| `--secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` |
| `--accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` |
| `--ring` | `oklch(0.45 0.16 155)` | `oklch(0.65 0.18 155)` |

### 2.3 차트 시리즈 (5색, 블루-퍼플 그라데이션 / ⚠ 시맨틱 없음)

| 변수 | 라이트+다크 공통 |
|------|-----------------|
| `--chart-1` | `oklch(0.809 0.105 251.813)` |
| `--chart-2` | `oklch(0.623 0.214 259.815)` |
| `--chart-3` | `oklch(0.546 0.245 262.881)` |
| `--chart-4` | `oklch(0.488 0.243 264.376)` |
| `--chart-5` | `oklch(0.424 0.199 265.638)` |

### 2.4 사이드바 (✅ oklch, 거의 미사용)

`--sidebar`, `--sidebar-foreground`, `--sidebar-primary(-foreground)`, `--sidebar-accent(-foreground)`, `--sidebar-border`, `--sidebar-ring` — 8개. shadcn 호환 슬롯으로만 존재.

### 2.5 라운드 스케일 (✅ 계산식)

`--radius: 0.625rem` (=10px) 기준으로 sm/md/lg/xl/2xl/3xl/4xl 생성:
- `--radius-sm`: 0.375rem (60%)
- `--radius-md`: 0.5rem (80%)
- `--radius-lg`: 0.625rem (100%)
- `--radius-xl`: 0.875rem (140%)
- `--radius-2xl`: 1.125rem (180%)
- `--radius-3xl`: 1.375rem (220%)
- `--radius-4xl`: 1.625rem (260%)

### 2.6 폰트 패밀리

- `--font-sans`: Pretendard Variable + 한국어 시스템 폰트 체인 (Apple SD Gothic Neo, Noto Sans KR 등)
- `--font-mono`: 시스템 모노 (ui-monospace → SF Mono → Menlo → Consolas → Liberation Mono)
- **누락**: display 폰트 없음. 숫자 전용 폰트(tabular-nums) 유틸 1줄(`@layer base .font-mono { font-variant-numeric: tabular-nums; }`)만 존재.

## 3. 목표 대비 갭 (unified-design-system.md 기준)

| 카테고리 | 현재 | 목표 | 조치 |
|---------|-----|------|------|
| **배경 5-level** | `--background`/`--card`/`--popover`/`--muted` 4개 혼재 | `--bg-base`/`--bg-surface`/`--bg-card`/`--bg-elevated`/`--bg-floating` | M4: 5-level 신설 후 shadcn 변수를 매핑으로 연결 |
| **텍스트 4-level** | `--foreground`/`--muted-foreground` 2개 | `--text-primary`/`--text-secondary`/`--text-tertiary`/`--text-muted` | M4: 신설 |
| **시맨틱 상태** | `--destructive` 1개 | `--success`/`--warning`/`--danger`/`--info` + `-bg` 변형 | M4: 4쌍 신설 |
| **테두리 3단** | `--border` 1개 | `--border-subtle`/`--border-default`/`--border-strong` + `--border-focus` | M4: 신설 |
| **주가 컬러** | hex 7개 | oklch (light: `0.55 0.22 25` / dark: `0.72 0.20 25`) | M4 핵심 작업: hex → oklch 전환 |
| **차트 팔레트** | `chart-1..5` 블루 그라데이션 | 시맨틱 8색 (Teal/Orange/Purple/Gold/Cyan/Pink/Lime/Coral) | M4: 재정의 |
| **히트맵 9단** | 없음 | `--heatmap-1..9` (blue→gray→red, 한국 관례) | M4: 신설 |
| **타입 스케일** | 없음 (Tailwind 기본 사용) | `--text-2xs..--text-4xl` 10단 + `--font-regular..--font-bold` 4단 | M4: 신설 |
| **그림자** | 없음 (Tailwind `shadow-*` 직접 사용) | `--shadow-subtle`/`--shadow-medium`/`--shadow-elevated`/`--shadow-floating` + inner-glow | M4: 신설 |
| **타이밍/이징** | 없음 | `--ease-out`/`--ease-in-out`/`--ease-spring` + `--duration-fast/normal/slow` | M4: 신설 |
| **글래스모피즘** | 없음 | `--glass-bg`/`--glass-border`/`--glass-blur` (헤더+모바일 탭바 전용) | M4: 신설 |
| **마켓 인덱스** | 없음 | `--index-kospi/kosdaq/sp500/nasdaq/usdkrw` | M4: 신설 |
| **센티먼트** | 없음 | `--sentiment-fear/neutral/greed` (빨/파와 혼동 방지) | M4: 신설 |
| **마켓 브레드스** | 없음 | `--bar-opacity-full/high/medium/low/bg` | M4: 신설 |
| **캐러셀 도트** | 없음 | `--dot-inactive/active/size/size-active/gap` | M4: 신설 |
| **display 폰트** | 없음 | Pretendard 단독 유지 또는 Inter + JetBrains Mono 추가 | §8 Next Step에서 결정 |

## 4. 코드 내 하드코딩 색상 탐색 결과

`grep -En '#[0-9a-fA-F]{3,6}' src/` 결과 (수동 확인 필요):
- `globals.css` `@theme inline` 블록 7줄 (stock-up/up-bg/down/down-bg/flat/chart-candle-up/chart-candle-down) + `.dark` 블록 4줄 (stock-up/up-bg/down/down-bg dark 오버라이드) = **총 11개 hex 토큰**. M4에서 oklch로 일괄 치환.
- 컴포넌트 인라인: Explore 결과에 따르면 `institutional-flow.tsx` 등에 `var(--color-stock-up)` 참조 혼재. 실제 hex 하드코딩은 M4에서 grep으로 재확인.

## 5. 결론

**"현 토큰 시스템은 shadcn 기본 + 주가색 hex 부가" 수준.** 목표는 9개 도메인별 토큰군(배경/텍스트/시맨틱/테두리/주가/차트/타입/그림자/모션)을 모두 채우는 것. unified-design-system.md §2.8 블록을 거의 그대로 이식 가능하다 (§2.8 단일 블록 = 목표 토큰 전체).
