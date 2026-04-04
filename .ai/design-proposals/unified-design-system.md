# StockView 통합 디자인 시스템

> **버전**: 1.0
> **날짜**: 2026-03-29
> **기반**: Proposal A (Visual System) + Proposal B (Page Layouts) + Cross-Review 통합
> **상태**: 확정

---

## 1. 디자인 원칙

### 1.1 확정된 결정 사항

| # | 결정 | 근거 |
|---|------|------|
| 1 | **다크 모드 우선** | 금융 전문가 사용 패턴 — 장시간 모니터링 시 눈 피로 감소. 다크가 기본 경험, 라이트는 보조. |
| 2 | **글래스모피즘 최소 적용** | 헤더 + 모바일 바텀 탭바에만 적용. 차트 툴팁, 티커 테이프, 일반 카드에는 미적용. 추후 확장 검토. |
| 3 | **노이즈 텍스처 미적용** | `.texture-noise` 관련 코드 전면 제거. 클린한 플랫 서피스 유지. |

### 1.2 전체 방향성

- **Terminal Elegance**: 전문 트레이딩 터미널의 정보 밀도 + 현대적 UI의 세련됨
- **색상 = oklch 전용**: 모든 색상을 oklch로 정의. hex/rgb/Tailwind 유틸리티 색상 직접 사용 금지
- **레이아웃 = Proposal B**: Grid 구조, 반응형 breakpoint, 컴포넌트 배치는 B를 따름
- **비주얼 토큰 = Proposal A**: 색상, 그림자, 카드, 타이포그래피, 인터랙션은 A를 따름
- **한국 관례 준수**: 빨강=상승(oklch hue 25), 파랑=하락(oklch hue 250)

---

## 2. 컬러 시스템

> 다크 모드가 기본 경험이므로, 다크 모드 값을 먼저 기술한다.

### 2.1 배경 계층 (5단계)

표면 간 깊이 차이로 시각적 계층을 만든다. 테두리 없이도 영역이 구분되는 것이 목표.

#### 다크 모드 (기본)

| 레벨 | CSS 변수 | oklch 값 | 용도 |
|------|----------|----------|------|
| L0 Base | `--bg-base` | `oklch(0.13 0.005 260)` | 페이지 배경, 앱 셸 |
| L1 Surface | `--bg-surface` | `oklch(0.17 0.005 260)` | 메인 콘텐츠 패널, 사이드바, 티커 테이프 |
| L2 Card | `--bg-card` | `oklch(0.21 0.005 260)` | 카드, 드롭다운, 팝오버 |
| L3 Elevated | `--bg-elevated` | `oklch(0.25 0.008 260)` | 호버 상태, 모달 오버레이 |
| L4 Floating | `--bg-floating` | `oklch(0.30 0.010 260)` | 툴팁, 플로팅 패널, 토스트 |

#### 라이트 모드

| 레벨 | CSS 변수 | oklch 값 | 용도 |
|------|----------|----------|------|
| L0 Base | `--bg-base` | `oklch(0.965 0.003 260)` | 페이지 배경 |
| L1 Surface | `--bg-surface` | `oklch(0.985 0.002 260)` | 메인 콘텐츠 패널 |
| L2 Card | `--bg-card` | `oklch(1.0 0 0)` | 카드 (순백) |
| L3 Elevated | `--bg-elevated` | `oklch(1.0 0 0)` | 그림자로 구분 |
| L4 Floating | `--bg-floating` | `oklch(1.0 0 0)` | 더 강한 그림자 |

### 2.2 텍스트 계층 (4단계)

#### 다크 모드 (기본)

| CSS 변수 | oklch 값 | 용도 |
|----------|----------|------|
| `--text-primary` | `oklch(0.95 0 0)` | 헤드라인, 가격, 핵심 콘텐츠 |
| `--text-secondary` | `oklch(0.72 0 0)` | 설명, 레이블 |
| `--text-tertiary` | `oklch(0.55 0 0)` | 캡션, 타임스탬프, 비활성 |
| `--text-muted` | `oklch(0.42 0 0)` | 플레이스홀더, 미세 힌트 |

#### 라이트 모드

| CSS 변수 | oklch 값 | 용도 |
|----------|----------|------|
| `--text-primary` | `oklch(0.15 0 0)` | 헤드라인, 가격 |
| `--text-secondary` | `oklch(0.40 0 0)` | 설명, 레이블 |
| `--text-tertiary` | `oklch(0.55 0 0)` | 캡션, 타임스탬프 |
| `--text-muted` | `oklch(0.70 0 0)` | 플레이스홀더 |

### 2.3 브랜드 & 액센트 컬러

| CSS 변수 | 다크 모드 | 라이트 모드 | 용도 |
|----------|----------|------------|------|
| `--primary` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` | 주요 액션, 링크, 활성 상태 |
| `--primary-hover` | `oklch(0.78 0.15 162)` | `oklch(0.40 0.18 162)` | 호버 |
| `--primary-muted` | `oklch(0.72 0.17 162 / 15%)` | `oklch(0.45 0.16 162 / 10%)` | 틴트 배경 |
| `--primary-foreground` | `oklch(0.15 0 0)` | `oklch(0.985 0 0)` | 프라이머리 위 텍스트 |
| `--secondary` | `oklch(0.70 0.10 250)` | `oklch(0.50 0.12 250)` | 보조 액션 |
| `--secondary-hover` | `oklch(0.76 0.08 250)` | `oklch(0.45 0.14 250)` | 보조 호버 |
| `--accent` | `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85)` | 강조, 골드/앰버 |
| `--accent-hover` | `oklch(0.85 0.10 85)` | `oklch(0.50 0.16 85)` | 강조 호버 |

### 2.4 시맨틱 / 상태 컬러

| CSS 변수 | 다크 모드 | 라이트 모드 | 용도 |
|----------|----------|------------|------|
| `--success` | `oklch(0.72 0.19 145)` | `oklch(0.50 0.17 145)` | 성공 상태 |
| `--success-bg` | `oklch(0.72 0.19 145 / 12%)` | `oklch(0.50 0.17 145 / 8%)` | 성공 배경 틴트 |
| `--warning` | `oklch(0.82 0.16 75)` | `oklch(0.65 0.18 75)` | 경고 |
| `--warning-bg` | `oklch(0.82 0.16 75 / 12%)` | `oklch(0.65 0.18 75 / 8%)` | 경고 배경 틴트 |
| `--danger` | `oklch(0.70 0.20 25)` | `oklch(0.55 0.22 25)` | 에러, 파괴 액션 |
| `--danger-bg` | `oklch(0.70 0.20 25 / 12%)` | `oklch(0.55 0.22 25 / 8%)` | 에러 배경 틴트 |
| `--info` | `oklch(0.75 0.12 240)` | `oklch(0.55 0.14 240)` | 정보 |
| `--info-bg` | `oklch(0.75 0.12 240 / 12%)` | `oklch(0.55 0.14 240 / 8%)` | 정보 배경 틴트 |

### 2.5 테두리 & 구분선

| CSS 변수 | 다크 모드 | 라이트 모드 |
|----------|----------|------------|
| `--border-subtle` | `oklch(1 0 0 / 6%)` | `oklch(0 0 0 / 6%)` |
| `--border-default` | `oklch(1 0 0 / 10%)` | `oklch(0 0 0 / 10%)` |
| `--border-strong` | `oklch(1 0 0 / 16%)` | `oklch(0 0 0 / 16%)` |
| `--border-focus` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` |
| `--border-gradient-start` | `oklch(0.72 0.17 162 / 40%)` | `oklch(0.45 0.16 162 / 30%)` |
| `--border-gradient-end` | `oklch(0.70 0.10 250 / 20%)` | `oklch(0.50 0.12 250 / 15%)` |

### 2.6 주가 방향 컬러 (한국 관례)

| CSS 변수 | 다크 모드 | 라이트 모드 | 용도 |
|----------|----------|------------|------|
| `--color-stock-up` | `oklch(0.72 0.20 25)` | `oklch(0.55 0.22 25)` | 상승 (빨강) |
| `--color-stock-up-bg` | `oklch(0.72 0.20 25 / 12%)` | `oklch(0.55 0.22 25 / 8%)` | 상승 배경 틴트 |
| `--color-stock-down` | `oklch(0.72 0.15 250)` | `oklch(0.55 0.17 250)` | 하락 (파랑) |
| `--color-stock-down-bg` | `oklch(0.72 0.15 250 / 12%)` | `oklch(0.55 0.17 250 / 8%)` | 하락 배경 틴트 |
| `--color-stock-flat` | `oklch(0.60 0 0)` | `oklch(0.55 0 0)` | 보합 (회색) |
| `--color-chart-candle-up` | `--color-stock-up`과 동일 | | 캔들 양봉 |
| `--color-chart-candle-down` | `--color-stock-down`과 동일 | | 캔들 음봉 |

### 2.7 마켓 브레드스 투명도 토큰

마켓 브레드스 바, 볼륨 바, 모멘텀 바에서 사용하는 투명도 레벨:

| CSS 변수 | 값 | 용도 |
|----------|---|------|
| `--bar-opacity-full` | `1.0` | 바 fill 100% (Top 1 종목) |
| `--bar-opacity-high` | `0.8` | 바 fill 80% |
| `--bar-opacity-medium` | `0.5` | 바 fill 50% |
| `--bar-opacity-low` | `0.3` | 바 fill 30% (가장 약한 종목) |
| `--bar-opacity-bg` | `0.1` | 바 트랙 배경 |
| `--breadth-advancing` | `var(--color-stock-up)` | 상승 종목 비율 |
| `--breadth-declining` | `var(--color-stock-down)` | 하락 종목 비율 |
| `--breadth-flat` | `var(--color-stock-flat)` | 보합 종목 비율 |

### 2.8 전체 CSS 변수 정의

```css
/* ============================================================
   StockView Unified Design System — CSS Variables
   다크 모드 우선. :root = dark, .light 클래스로 라이트 전환.
   ============================================================ */

:root {
  /* --- 배경 계층 --- */
  --bg-base: oklch(0.13 0.005 260);
  --bg-surface: oklch(0.17 0.005 260);
  --bg-card: oklch(0.21 0.005 260);
  --bg-elevated: oklch(0.25 0.008 260);
  --bg-floating: oklch(0.30 0.010 260);

  /* --- 텍스트 계층 --- */
  --text-primary: oklch(0.95 0 0);
  --text-secondary: oklch(0.72 0 0);
  --text-tertiary: oklch(0.55 0 0);
  --text-muted: oklch(0.42 0 0);

  /* --- 브랜드 --- */
  --primary: oklch(0.72 0.17 162);
  --primary-hover: oklch(0.78 0.15 162);
  --primary-muted: oklch(0.72 0.17 162 / 15%);
  --primary-foreground: oklch(0.15 0 0);
  --secondary: oklch(0.70 0.10 250);
  --secondary-hover: oklch(0.76 0.08 250);
  --secondary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.80 0.12 85);
  --accent-hover: oklch(0.85 0.10 85);
  --accent-foreground: oklch(0.15 0 0);

  /* --- 시맨틱 --- */
  --success: oklch(0.72 0.19 145);
  --success-bg: oklch(0.72 0.19 145 / 12%);
  --warning: oklch(0.82 0.16 75);
  --warning-bg: oklch(0.82 0.16 75 / 12%);
  --danger: oklch(0.70 0.20 25);
  --danger-bg: oklch(0.70 0.20 25 / 12%);
  --info: oklch(0.75 0.12 240);
  --info-bg: oklch(0.75 0.12 240 / 12%);
  --destructive: oklch(0.70 0.20 25);

  /* --- 테두리 --- */
  --border-subtle: oklch(1 0 0 / 6%);
  --border-default: oklch(1 0 0 / 10%);
  --border-strong: oklch(1 0 0 / 16%);
  --border-focus: oklch(0.72 0.17 162);
  --border-gradient-start: oklch(0.72 0.17 162 / 40%);
  --border-gradient-end: oklch(0.70 0.10 250 / 20%);

  /* --- 주가 방향 --- */
  --color-stock-up: oklch(0.72 0.20 25);
  --color-stock-up-bg: oklch(0.72 0.20 25 / 12%);
  --color-stock-down: oklch(0.72 0.15 250);
  --color-stock-down-bg: oklch(0.72 0.15 250 / 12%);
  --color-stock-flat: oklch(0.60 0 0);
  --color-chart-candle-up: oklch(0.72 0.20 25);
  --color-chart-candle-down: oklch(0.72 0.15 250);

  /* --- 마켓 브레드스 --- */
  --bar-opacity-full: 1.0;
  --bar-opacity-high: 0.8;
  --bar-opacity-medium: 0.5;
  --bar-opacity-low: 0.3;
  --bar-opacity-bg: 0.1;

  /* --- 그림자 (다크: 강한 drop + inner glow) --- */
  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 20%);
  --shadow-medium: 0 2px 8px oklch(0 0 0 / 30%), 0 0 1px oklch(1 0 0 / 5%);
  --shadow-elevated: 0 4px 16px oklch(0 0 0 / 40%), 0 0 1px oklch(1 0 0 / 8%);
  --shadow-floating: 0 8px 32px oklch(0 0 0 / 50%), 0 0 1px oklch(1 0 0 / 10%);
  --shadow-inner-glow: inset 0 1px 0 oklch(1 0 0 / 5%);

  /* --- 글래스모피즘 (헤더 + 바텀 탭바 전용) --- */
  --glass-bg: oklch(0.17 0.005 260 / 60%);
  --glass-border: oklch(1 0 0 / 8%);
  --glass-blur: 16px;

  /* --- 타이밍 --- */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;

  /* --- 반경 --- */
  --radius: 0.625rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.875rem;
  --radius-2xl: 1.125rem;

  /* --- shadcn 호환 매핑 --- */
  --background: var(--bg-base);
  --foreground: var(--text-primary);
  --card: var(--bg-card);
  --card-foreground: var(--text-primary);
  --popover: var(--bg-floating);
  --popover-foreground: var(--text-primary);
  --muted: var(--bg-surface);
  --muted-foreground: var(--text-secondary);
  --border: var(--border-default);
  --input: oklch(1 0 0 / 15%);
  --ring: var(--border-focus);

  /* --- 차트 시리즈 --- */
  --chart-1: oklch(0.72 0.17 162);
  --chart-2: oklch(0.75 0.14 45);
  --chart-3: oklch(0.70 0.15 300);
  --chart-4: oklch(0.80 0.12 85);
  --chart-5: oklch(0.68 0.18 210);
  --chart-6: oklch(0.72 0.16 350);
  --chart-7: oklch(0.75 0.15 120);
  --chart-8: oklch(0.70 0.12 20);

  /* --- 히트맵 9단계 --- */
  --heatmap-1: oklch(0.55 0.17 250);
  --heatmap-2: oklch(0.60 0.12 250);
  --heatmap-3: oklch(0.65 0.08 250);
  --heatmap-4: oklch(0.68 0.04 250);
  --heatmap-5: oklch(0.55 0 0);
  --heatmap-6: oklch(0.68 0.04 25);
  --heatmap-7: oklch(0.65 0.08 25);
  --heatmap-8: oklch(0.60 0.12 25);
  --heatmap-9: oklch(0.55 0.17 25);

  /* --- 센티먼트 게이지 (red/blue 혼동 방지) --- */
  --sentiment-fear: oklch(0.70 0.15 300);
  --sentiment-neutral: oklch(0.55 0 0);
  --sentiment-greed: oklch(0.80 0.12 85);

  /* --- 마켓 인덱스 --- */
  --index-kospi: oklch(0.72 0.20 25);
  --index-kosdaq: oklch(0.72 0.15 250);
  --index-sp500: oklch(0.72 0.17 162);
  --index-nasdaq: oklch(0.70 0.15 300);
  --index-usdkrw: oklch(0.80 0.12 85);

  /* --- 캐러셀 페이지네이션 도트 --- */
  --dot-inactive: oklch(1 0 0 / 20%);
  --dot-active: var(--primary);
  --dot-size: 6px;
  --dot-size-active: 18px;
  --dot-gap: 6px;

  /* --- 사이드바 (shadcn 호환) --- */
  --sidebar: var(--bg-surface);
  --sidebar-foreground: var(--text-primary);
  --sidebar-primary: var(--primary);
  --sidebar-primary-foreground: var(--primary-foreground);
  --sidebar-accent: var(--bg-elevated);
  --sidebar-accent-foreground: var(--text-primary);
  --sidebar-border: var(--border-default);
  --sidebar-ring: var(--primary);
}

.light {
  /* --- 배경 계층 --- */
  --bg-base: oklch(0.965 0.003 260);
  --bg-surface: oklch(0.985 0.002 260);
  --bg-card: oklch(1.0 0 0);
  --bg-elevated: oklch(1.0 0 0);
  --bg-floating: oklch(1.0 0 0);

  /* --- 텍스트 계층 --- */
  --text-primary: oklch(0.15 0 0);
  --text-secondary: oklch(0.40 0 0);
  --text-tertiary: oklch(0.55 0 0);
  --text-muted: oklch(0.70 0 0);

  /* --- 브랜드 --- */
  --primary: oklch(0.45 0.16 162);
  --primary-hover: oklch(0.40 0.18 162);
  --primary-muted: oklch(0.45 0.16 162 / 10%);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.50 0.12 250);
  --secondary-hover: oklch(0.45 0.14 250);
  --secondary-foreground: oklch(0.15 0 0);
  --accent: oklch(0.55 0.14 85);
  --accent-hover: oklch(0.50 0.16 85);
  --accent-foreground: oklch(0.15 0 0);

  /* --- 시맨틱 --- */
  --success: oklch(0.50 0.17 145);
  --success-bg: oklch(0.50 0.17 145 / 8%);
  --warning: oklch(0.65 0.18 75);
  --warning-bg: oklch(0.65 0.18 75 / 8%);
  --danger: oklch(0.55 0.22 25);
  --danger-bg: oklch(0.55 0.22 25 / 8%);
  --info: oklch(0.55 0.14 240);
  --info-bg: oklch(0.55 0.14 240 / 8%);
  --destructive: oklch(0.55 0.22 25);

  /* --- 테두리 --- */
  --border-subtle: oklch(0 0 0 / 6%);
  --border-default: oklch(0 0 0 / 10%);
  --border-strong: oklch(0 0 0 / 16%);
  --border-focus: oklch(0.45 0.16 162);
  --border-gradient-start: oklch(0.45 0.16 162 / 30%);
  --border-gradient-end: oklch(0.50 0.12 250 / 15%);

  /* --- 주가 방향 --- */
  --color-stock-up: oklch(0.55 0.22 25);
  --color-stock-up-bg: oklch(0.55 0.22 25 / 8%);
  --color-stock-down: oklch(0.55 0.17 250);
  --color-stock-down-bg: oklch(0.55 0.17 250 / 8%);
  --color-stock-flat: oklch(0.55 0 0);
  --color-chart-candle-up: oklch(0.55 0.22 25);
  --color-chart-candle-down: oklch(0.55 0.17 250);

  /* --- 그림자 (라이트: 자연스러운 drop shadow) --- */
  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 5%);
  --shadow-medium: 0 2px 8px oklch(0 0 0 / 8%), 0 1px 2px oklch(0 0 0 / 4%);
  --shadow-elevated: 0 4px 16px oklch(0 0 0 / 10%), 0 2px 4px oklch(0 0 0 / 5%);
  --shadow-floating: 0 8px 32px oklch(0 0 0 / 12%), 0 4px 8px oklch(0 0 0 / 6%);
  --shadow-inner-glow: none;

  /* --- 글래스모피즘 (헤더 + 바텀 탭바 전용) --- */
  --glass-bg: oklch(1 0 0 / 70%);
  --glass-border: oklch(0 0 0 / 8%);
  --glass-blur: 12px;

  /* --- 입력 --- */
  --input: oklch(0 0 0 / 10%);

  /* --- 차트 시리즈 (라이트용 어두운 톤) --- */
  --chart-1: oklch(0.45 0.16 162);
  --chart-2: oklch(0.55 0.16 45);
  --chart-3: oklch(0.48 0.17 300);
  --chart-4: oklch(0.55 0.14 85);
  --chart-5: oklch(0.48 0.18 210);
  --chart-6: oklch(0.50 0.18 350);
  --chart-7: oklch(0.50 0.16 120);
  --chart-8: oklch(0.50 0.14 20);

  /* --- 히트맵 (라이트에서도 동일 — 자체 대비 내장) --- */

  /* --- 센티먼트 게이지 --- */
  --sentiment-fear: oklch(0.48 0.17 300);
  --sentiment-neutral: oklch(0.55 0 0);
  --sentiment-greed: oklch(0.55 0.14 85);

  /* --- 마켓 인덱스 --- */
  --index-kospi: oklch(0.55 0.22 25);
  --index-kosdaq: oklch(0.55 0.17 250);
  --index-sp500: oklch(0.45 0.16 162);
  --index-nasdaq: oklch(0.48 0.17 300);
  --index-usdkrw: oklch(0.55 0.14 85);

  /* --- 캐러셀 페이지네이션 도트 --- */
  --dot-inactive: oklch(0 0 0 / 15%);
}
```

---

## 3. 카드 시스템

4종의 카드 변형. 글래스 카드는 헤더/바텀 탭바 전용.

### 3.1 Default Card (기본)

일반 콘텐츠 컨테이너. 대부분의 대시보드 카드에 사용.

```css
.card-default {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-subtle), var(--shadow-inner-glow);
  transition: box-shadow var(--duration-normal) var(--ease-out),
              border-color var(--duration-fast) ease;
}
```

**적용 위치**: 뉴스 카드, Key Stats 패널, 섹터 트리맵 컨테이너, 재무 테이블 래퍼, 퀵 액션 패널

### 3.2 Interactive Card (인터랙티브)

클릭 가능한 아이템. 호버 시 들어올림 효과.

```css
.card-interactive {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-subtle), var(--shadow-inner-glow);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
}
.card-interactive:hover {
  background: var(--bg-elevated);
  border-color: var(--border-default);
  box-shadow: var(--shadow-medium), var(--shadow-inner-glow);
  transform: translateY(-1px);
}
.card-interactive:active {
  transform: translateY(0);
  box-shadow: var(--shadow-subtle);
  transition-duration: var(--duration-fast);
}
```

**적용 위치**: Hot Stocks 리스트 행, 뉴스 피드 카드, 관련 종목 카드, 검색 결과 항목, Sortable Stock Table 행

### 3.3 Stat Card (통계 카드)

KPI/지표 표시용. 좌측 색상 액센트 바 + 방향별 그라데이션 배경.

```css
.card-stat {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-subtle), var(--shadow-inner-glow);
  padding: 12px 16px;
  transition: box-shadow var(--duration-normal) var(--ease-out);
}
.card-stat:hover {
  box-shadow: var(--shadow-medium),
              0 0 0 1px var(--primary-muted);
}

/* 상승 트렌드 */
.card-stat[data-trend="up"] {
  border-left-color: var(--color-stock-up);
  background: linear-gradient(135deg, var(--color-stock-up-bg), transparent 60%);
}
/* 하락 트렌드 */
.card-stat[data-trend="down"] {
  border-left-color: var(--color-stock-down);
  background: linear-gradient(135deg, var(--color-stock-down-bg), transparent 60%);
}
/* 보합 */
.card-stat[data-trend="flat"] {
  border-left-color: var(--color-stock-flat);
}
```

**적용 위치**: Index Widget Card (KOSPI, KOSDAQ, S&P 500, NASDAQ), 환율 카드, 포트폴리오 요약 수치, 모바일 Quick Stats 칩

### 3.4 Chart Card (차트 컨테이너 카드)

차트 영역 전용. 패딩 최소화, 내부 여백 없음. 차트가 카드 경계까지 채움.

```css
.card-chart {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-subtle), var(--shadow-inner-glow);
  overflow: hidden; /* 차트가 border-radius를 따르도록 */
  padding: 0;
}

/* 차트 내부 툴바 영역 */
.card-chart-toolbar {
  padding: 8px 12px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 모바일에서 full-bleed 시 border-radius 제거 */
@media (max-width: 767px) {
  .card-chart.full-bleed {
    border-radius: 0;
    border-left: none;
    border-right: none;
    margin: 0 -16px;
    width: calc(100% + 32px);
  }
}
```

**적용 위치**: 종목 상세 메인 차트, Index Widget의 미니 차트 래퍼, 재무 탭 차트 영역

### 3.5 Gradient Border Card (그라디언트 테두리)

특별 강조가 필요한 요소 전용. 제한적 사용.

```css
.card-gradient-border {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-medium), var(--shadow-inner-glow);
}
.card-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    var(--border-gradient-start),
    var(--border-gradient-end)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

**적용 위치 (제한적)**:
- Hot Stocks Top 3 종목
- 관심종목에서 알림이 있는 종목
- 상한가/하한가 종목의 상세 헤더

### 3.6 Glass Card (글래스 — 헤더/바텀 탭바 전용)

**적용 범위 제한**: 헤더와 모바일 바텀 탭바에만 사용. 다른 요소에는 미적용.

```css
/* 데스크톱 헤더 */
.header-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--glass-border);
}

/* 모바일 바텀 탭바 */
.bottom-tab-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-top: 1px solid var(--glass-border);
}
```

---

## 4. 타이포그래피

### 4.1 크기 스케일

데이터 밀도가 높은 금융 인터페이스에 최적화된 스케일.

| 토큰 | 크기 | 행간 | 용도 |
|------|------|------|------|
| `--text-2xs` | 10px (0.625rem) | 1.2 | 차트 축, 볼륨 레이블 |
| `--text-xs` | 12px (0.75rem) | 1.3 | 타임스탬프, 배지, 캡션, 마켓 상태 |
| `--text-sm` | 13px (0.8125rem) | 1.4 | 보조 텍스트, 테이블 셀, 설명 |
| `--text-base` | 14px (0.875rem) | 1.5 | 본문, 폼 레이블, 리스트 아이템 |
| `--text-md` | 15px (0.9375rem) | 1.5 | 카드 제목, 테이블 헤더 |
| `--text-lg` | 17px (1.0625rem) | 1.4 | 섹션 제목, 종목명 |
| `--text-xl` | 20px (1.25rem) | 1.3 | 페이지 부제목, 가격 |
| `--text-2xl` | 24px (1.5rem) | 1.2 | 페이지 제목, 히어로 수치 |
| `--text-3xl` | 30px (1.875rem) | 1.1 | 대형 디스플레이 수치 (지수 값) |
| `--text-4xl` | 36px (2.25rem) | 1.1 | 히어로 헤드라인 수치 |

### 4.2 무게 체계

| 토큰 | 무게 | 용도 |
|------|------|------|
| `--font-regular` | 400 | 본문, 설명, 테이블 셀 |
| `--font-medium` | 500 | 레이블, 카드 제목, 네비게이션 |
| `--font-semibold` | 600 | 섹션 헤더, 종목명, 강조 |
| `--font-bold` | 700 | 가격, KPI 수치, 페이지 제목 |

### 4.3 숫자 전용 타이포그래피

모든 금융 수치(가격, 거래량, 퍼센트, 지수)는 모노스페이스 + tabular-nums:

```css
.font-mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* 가격 전용: 대형 수치에 더 타이트한 자간 */
.font-price {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* 대시보드 카드 제목 (B 반영) */
.card-section-title {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}
```

### 4.4 자간 규칙

| 맥락 | 자간 | 비고 |
|------|------|------|
| 대문자 레이블 | `0.05em` | 가독성을 위해 넓힘 |
| 본문 | `0` | Pretendard 기본 |
| 큰 제목 (≥xl) | `-0.01em` | 약간 좁혀 세련됨 |
| 큰 숫자 (≥2xl) | `-0.02em` | 모노스페이스 정렬 |

### 4.5 Proposal B 타이포그래피 클래스 매핑

B가 정의한 유틸리티를 통합 토큰으로 변환:

```css
/* B의 .price-large → 통합 */
.price-large {
  font-size: var(--text-4xl);
  font-family: var(--font-mono);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* B의 .price-medium → 통합 */
.price-medium {
  font-size: var(--text-xl);
  font-family: var(--font-mono);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* B의 .price-small → 통합 */
.price-small {
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  font-weight: var(--font-medium);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* B의 .change-pill → 통합 */
.change-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-2xl);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.change-pill[data-trend="up"] {
  color: var(--color-stock-up);
  background: var(--color-stock-up-bg);
}
.change-pill[data-trend="down"] {
  color: var(--color-stock-down);
  background: var(--color-stock-down-bg);
}
.change-pill[data-trend="flat"] {
  color: var(--color-stock-flat);
  background: oklch(0.55 0 0 / 10%);
}
```

---

## 5. 데이터 시각화 컬러

### 5.1 멀티 시리즈 차트 팔레트

8색, 색각 이상(적록 색맹) 환경에서도 구분 가능하도록 선별.

| 시리즈 | 다크 모드 | 라이트 모드 | 이름 |
|--------|----------|------------|------|
| 1 | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` | Teal (Primary) |
| 2 | `oklch(0.75 0.14 45)` | `oklch(0.55 0.16 45)` | Orange |
| 3 | `oklch(0.70 0.15 300)` | `oklch(0.48 0.17 300)` | Purple |
| 4 | `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85)` | Gold |
| 5 | `oklch(0.68 0.18 210)` | `oklch(0.48 0.18 210)` | Cyan |
| 6 | `oklch(0.72 0.16 350)` | `oklch(0.50 0.18 350)` | Pink |
| 7 | `oklch(0.75 0.15 120)` | `oklch(0.50 0.16 120)` | Lime |
| 8 | `oklch(0.70 0.12 20)` | `oklch(0.50 0.14 20)` | Coral |

Area fill: 동일 색상 10-20% opacity, 하단으로 갈수록 투명 gradient.

### 5.2 히트맵 9단계 그라데이션

섹터 트리맵과 퍼포먼스 매트릭스용. 한국 관례(빨강=상승) 반영.

| 단계 | CSS 변수 | oklch 값 | 구간 |
|------|----------|----------|------|
| 1 | `--heatmap-1` | `oklch(0.55 0.17 250)` | -4% 이하 (진한 파랑) |
| 2 | `--heatmap-2` | `oklch(0.60 0.12 250)` | -3% |
| 3 | `--heatmap-3` | `oklch(0.65 0.08 250)` | -2% |
| 4 | `--heatmap-4` | `oklch(0.68 0.04 250)` | -1% |
| 5 | `--heatmap-5` | `oklch(0.55 0 0)` | 0% (중립 회색) |
| 6 | `--heatmap-6` | `oklch(0.68 0.04 25)` | +1% |
| 7 | `--heatmap-7` | `oklch(0.65 0.08 25)` | +2% |
| 8 | `--heatmap-8` | `oklch(0.60 0.12 25)` | +3% |
| 9 | `--heatmap-9` | `oklch(0.55 0.17 25)` | +4% 이상 (진한 빨강) |

### 5.3 배지 카테고리 컬러

| 카테고리 | 배경 (다크) | 텍스트 (다크) | 용도 |
|----------|-----------|-------------|------|
| 한국 시장 | `oklch(0.72 0.20 25 / 15%)` | `oklch(0.72 0.20 25)` | KR 마켓 태그 |
| 미국 시장 | `oklch(0.70 0.12 250 / 15%)` | `oklch(0.70 0.12 250)` | US 마켓 태그 |
| 섹터 | `oklch(0.72 0.17 162 / 15%)` | `oklch(0.72 0.17 162)` | 섹터/업종 |
| 뉴스 경제 | `oklch(0.70 0.12 250 / 15%)` | `oklch(0.70 0.12 250)` | 경제 뉴스 |
| 뉴스 기업 | `oklch(0.72 0.19 145 / 15%)` | `oklch(0.72 0.19 145)` | 기업 뉴스 |
| 뉴스 증시 | `oklch(0.80 0.12 85 / 15%)` | `oklch(0.80 0.12 85)` | 증시 뉴스 |
| 뉴스 해외 | `oklch(0.70 0.15 300 / 15%)` | `oklch(0.70 0.15 300)` | 해외 뉴스 |
| ETF | `oklch(0.70 0.15 300 / 15%)` | `oklch(0.70 0.15 300)` | ETF 태그 |

### 5.4 센티먼트 게이지 (수정됨)

주가 방향 색상(빨강/파랑)과의 혼동을 방지하기 위해 별도 색상 축 사용:

```css
/* Fear → Neutral → Greed: 보라 → 회색 → 금색 */
background: linear-gradient(
  90deg,
  var(--sentiment-fear),     /* 보라 */
  var(--sentiment-neutral),  /* 회색 */
  var(--sentiment-greed)     /* 금색 */
);
```

---

## 6. 마이크로 인터랙션

### 6.1 타이밍 토큰

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* 빠른 감속 — 등장 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* 매끄러움 — transform */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* 바운스 — 재미 요소 */
--duration-fast: 120ms;    /* 호버, 활성 상태 */
--duration-normal: 200ms;  /* 카드 전환, 색상 변화 */
--duration-slow: 350ms;    /* 모달 열기/닫기, 레이아웃 변경 */
```

### 6.2 가격 변동 애니메이션 (핵심 인터랙션)

주식 앱의 시그니처 인터랙션. 가격 변경 시 배경 + 텍스트 색상 동시 플래시.

```css
@keyframes price-tick-up {
  0% { color: var(--color-stock-up); background: var(--color-stock-up-bg); }
  100% { color: inherit; background: transparent; }
}
@keyframes price-tick-down {
  0% { color: var(--color-stock-down); background: var(--color-stock-down-bg); }
  100% { color: inherit; background: transparent; }
}

.price-tick-up {
  animation: price-tick-up 1.5s var(--ease-out) forwards;
  border-radius: var(--radius-sm);
  padding: 0 2px;
  margin: 0 -2px;
}
.price-tick-down {
  animation: price-tick-down 1.5s var(--ease-out) forwards;
  border-radius: var(--radius-sm);
  padding: 0 2px;
  margin: 0 -2px;
}
```

**적용 위치**: 티커 테이프, Index Widget, Hot Stocks 리스트, 종목 상세 헤더의 모든 가격 표시

### 6.3 숫자 카운트 애니메이션

히어로 수치(지수 값, 포트폴리오 총액) 로드 시 0에서 실제 값까지 카운트업:

```css
@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-count {
  animation: count-up 0.4s var(--ease-out) forwards;
}
```

### 6.4 스켈레톤 로딩 (Shimmer)

Tailwind 기본 `animate-pulse` 대신 gradient shimmer 사용:

```css
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  border-radius: var(--radius-md);
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* 다크 모드 (기본) */
.skeleton {
  background: linear-gradient(
    90deg,
    oklch(0.22 0.005 260) 25%,
    oklch(0.28 0.008 260) 50%,
    oklch(0.22 0.005 260) 75%
  );
  background-size: 200% 100%;
}

/* 라이트 모드 */
.light .skeleton {
  background: linear-gradient(
    90deg,
    oklch(0.95 0.003 260) 25%,
    oklch(0.98 0.002 260) 50%,
    oklch(0.95 0.003 260) 75%
  );
  background-size: 200% 100%;
}
```

### 6.5 티커 테이프 전용 스타일

```css
.ticker-tape {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  height: 36px;
  overflow: hidden;
  position: relative;
}

.ticker-tape-content {
  display: flex;
  align-items: center;
  gap: 24px;
  white-space: nowrap;
  animation: ticker-scroll linear infinite;
  /* 속도: 40px/sec, duration은 JS에서 콘텐츠 폭 기반 계산 */
}

.ticker-tape:hover .ticker-tape-content {
  animation-play-state: paused;
}

@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.ticker-tape-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  padding: 0 4px;
  border-radius: var(--radius-sm);
  transition: background var(--duration-fast) ease;
}
.ticker-tape-item:hover {
  background: var(--bg-elevated);
}

/* 방향 표시 도트 */
.ticker-tape-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.ticker-tape-dot[data-trend="up"] { background: var(--color-stock-up); }
.ticker-tape-dot[data-trend="down"] { background: var(--color-stock-down); }
.ticker-tape-dot[data-trend="flat"] { background: var(--color-stock-flat); }

/* 모바일 */
@media (max-width: 767px) {
  .ticker-tape {
    height: 32px;
    font-size: var(--text-2xs);
  }
}
```

### 6.6 캐러셀 페이지네이션 도트

모바일 Index Card 캐러셀 하단 도트 인디케이터:

```css
.carousel-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--dot-gap);
  padding: 8px 0;
}

.carousel-dot {
  width: var(--dot-size);
  height: var(--dot-size);
  border-radius: 999px;
  background: var(--dot-inactive);
  transition: all var(--duration-normal) var(--ease-out);
}
.carousel-dot[data-active="true"] {
  width: var(--dot-size-active);
  background: var(--dot-active);
}
```

### 6.7 차트 툴팁

글래스 미적용 결정에 따라 솔리드 배경 사용:

```css
.chart-tooltip {
  background: var(--bg-floating);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  padding: 8px 12px;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  animation: tooltip-enter 0.15s var(--ease-out) forwards;
  pointer-events: none;
}

@keyframes tooltip-enter {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 6.8 페이지 전환

```css
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.page-content {
  animation: page-enter 0.3s var(--ease-out) forwards;
}
```

### 6.9 관심종목 별 토글

```css
@keyframes star-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.star-toggle.active {
  animation: star-pop 0.3s var(--ease-spring);
  color: var(--accent);
}
```

### 6.10 포커스 링 시스템

접근성 필수. 키보드 내비게이션 시 명확한 포커스 표시.

```css
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* 다크 모드에서 추가 glow 효과 */
:root :focus-visible {
  box-shadow: 0 0 0 4px var(--primary-muted);
}
```

### 6.11 접근성: reduced-motion 대응

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .ticker-tape-content {
    animation: none;
  }
}
```

### 6.12 히어로 섹션 그라데이션

```css
.hero-gradient {
  background: linear-gradient(
    180deg,
    var(--primary-muted) 0%,
    transparent 60%
  );
}

/* 빈 상태용 메시 그라데이션 */
.mesh-gradient {
  background:
    radial-gradient(ellipse at 20% 50%, var(--primary-muted) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, oklch(0.70 0.10 250 / 8%) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, oklch(0.80 0.12 85 / 6%) 0%, transparent 50%);
}
```

---

## 7. 기존 색상 → oklch 변환 테이블

기존 코드의 hex/Tailwind 색상을 통합 시스템 토큰으로 교체할 때 참조.

### 7.1 globals.css 기존 hex → oklch

| 기존 값 (hex) | 용도 | 통합 CSS 변수 | oklch 값 |
|--------------|------|-------------|----------|
| `#e53e3e` | stock-up (light) | `--color-stock-up` | `oklch(0.55 0.22 25)` |
| `#fff5f5` | stock-up-bg (light) | `--color-stock-up-bg` | `oklch(0.55 0.22 25 / 8%)` |
| `#3182ce` | stock-down (light) | `--color-stock-down` | `oklch(0.55 0.17 250)` |
| `#ebf8ff` | stock-down-bg (light) | `--color-stock-down-bg` | `oklch(0.55 0.17 250 / 8%)` |
| `#718096` | stock-flat | `--color-stock-flat` | `oklch(0.55 0 0)` |
| `#fc8181` | stock-up (dark) | `--color-stock-up` | `oklch(0.72 0.20 25)` |
| `#3d1f1f` | stock-up-bg (dark) | `--color-stock-up-bg` | `oklch(0.72 0.20 25 / 12%)` |
| `#63b3ed` | stock-down (dark) | `--color-stock-down` | `oklch(0.72 0.15 250)` |
| `#1f2d3f` | stock-down-bg (dark) | `--color-stock-down-bg` | `oklch(0.72 0.15 250 / 12%)` |

### 7.2 Proposal B의 Tailwind 유틸리티 → oklch

| B의 Tailwind 클래스 | 용도 | 통합 CSS 변수 |
|--------------------|------|-------------|
| `bg-red-500` | 트리맵 강한 상승 | `--heatmap-9` |
| `bg-red-300` | 트리맵 상승 | `--heatmap-7` |
| `bg-gray-400` | 트리맵 보합 | `--heatmap-5` |
| `bg-blue-300` | 트리맵 하락 | `--heatmap-3` |
| `bg-blue-500` | 트리맵 강한 하락 | `--heatmap-1` |
| `bg-muted/50` | 티커 테이프 배경 | `--bg-surface` |
| `bg-card` | 카드 배경 | `--bg-card` |
| `bg-background` | 페이지 배경 | `--bg-base` |
| `shadow-md` | 호버 그림자 | `--shadow-medium` |
| `accent/50` | 행 호버 배경 | `--bg-elevated` |
| `text-muted-foreground` | 보조 텍스트 | `--text-secondary` |

### 7.3 shadcn 호환성 매핑

기존 shadcn 컴포넌트가 참조하는 변수 → 통합 시스템 변수:

| shadcn 변수 | → 통합 변수 |
|------------|-----------|
| `--background` | `var(--bg-base)` |
| `--foreground` | `var(--text-primary)` |
| `--card` | `var(--bg-card)` |
| `--card-foreground` | `var(--text-primary)` |
| `--popover` | `var(--bg-floating)` |
| `--popover-foreground` | `var(--text-primary)` |
| `--muted` | `var(--bg-surface)` |
| `--muted-foreground` | `var(--text-secondary)` |
| `--border` | `var(--border-default)` |
| `--ring` | `var(--border-focus)` |
| `--primary` | `var(--primary)` (직접) |
| `--destructive` | `var(--danger)` |

---

## 8. 레이아웃 요소별 비주얼 적용 가이드

Proposal B의 각 레이아웃 요소에 이 문서의 비주얼 토큰이 어떻게 적용되는지 매핑.

| B의 레이아웃 요소 | 배경 | 카드 유형 | 그림자 | 테두리 |
|-----------------|------|----------|--------|--------|
| 페이지 배경 | `--bg-base` | — | — | — |
| 헤더 | `--glass-bg` | glass | — | `--glass-border` |
| 티커 테이프 | `--bg-surface` | — (전용 스타일) | — | `--border-subtle` |
| Index Widget | `--bg-card` + trend gradient | stat | `--shadow-subtle` | `--border-subtle` + 좌측 3px |
| Hot Stocks 섹션 | `--bg-card` | default (래퍼) | `--shadow-subtle` | `--border-default` |
| Hot Stocks 각 행 | — (투명) | interactive | — | 하단 `--border-subtle` |
| 뉴스 카드 | `--bg-card` | interactive | `--shadow-subtle` | `--border-subtle` |
| Market Pulse 패널 | `--bg-card` | default | `--shadow-subtle` | `--border-default` |
| 센티먼트 게이지 | `--bg-card` | default | `--shadow-subtle` | `--border-default` |
| 섹터 트리맵 | `--bg-card` | default (래퍼) | `--shadow-subtle` | `--border-default` |
| 트리맵 셀 | `--heatmap-*` | — | — | — |
| 마켓 브레드스 바 | `--bg-card` | default | `--shadow-subtle` | `--border-default` |
| 종목 상세 헤더 | `--bg-surface` | — | — | — |
| 종목 차트 | `--bg-card` | chart | `--shadow-subtle` | `--border-default` |
| 사이드바 | `--bg-surface` | — | — | 좌측 `--border-subtle` |
| 사이드바 내 카드 | `--bg-card` | default | `--shadow-subtle` | `--border-default` |
| 콘텐츠 탭 | `--bg-card` | default | `--shadow-subtle` | `--border-default` |
| 모바일 바텀 탭 | `--glass-bg` | glass | — | `--glass-border` |
| 모바일 Quick Stats | `--bg-card` | stat (소형) | `--shadow-subtle` | `--border-subtle` |
| 툴팁 | `--bg-floating` | — (전용 스타일) | `--shadow-elevated` | `--border-default` |
| 모달/드롭다운 | `--bg-floating` | — | `--shadow-floating` | `--border-default` |

---

## 9. 접근성 대비 검증

모든 색상 조합이 WCAG 2.1 AA 기준 충족:

| 조합 | 대비비 | 등급 |
|------|--------|------|
| `--text-primary` on `--bg-base` (다크) | ~16:1 | AAA |
| `--text-primary` on `--bg-card` (다크) | ~13:1 | AAA |
| `--text-secondary` on `--bg-card` (다크) | ~7:1 | AA |
| `--text-tertiary` on `--bg-card` (다크) | ~4.6:1 | AA (큰 텍스트) |
| `--color-stock-up` on `--bg-card` (다크) | ~7.5:1 | AA |
| `--color-stock-down` on `--bg-card` (다크) | ~7.5:1 | AA |
| `--text-primary` on `--bg-base` (라이트) | ~17:1 | AAA |
| `--text-secondary` on `--bg-card` (라이트) | ~8:1 | AA |
| `--color-stock-up` on `--bg-card` (라이트) | ~5.5:1 | AA |
| `--color-stock-down` on `--bg-card` (라이트) | ~5.2:1 | AA |

포커스 인디케이터: 인접 색상 대비 3:1 이상 (WCAG 2.4.7).

---

*StockView 통합 디자인 시스템 v1.0 — Proposal A (Visual System) + Proposal B (Page Layouts) + Cross-Review 통합 완료.*
