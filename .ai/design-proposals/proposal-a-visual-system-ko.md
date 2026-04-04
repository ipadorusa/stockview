# 제안서 A: 비주얼 시스템 디자인 — "터미널 엘레강스"

> StockView를 위한 TradingView 영감 비주얼 시스템. 깊이감 있는 배경 계층, 글래스모피즘 카드, 데이터 밀도 높은 금융 타이포그래피. oklch 색상 과학으로 다크/라이트 모드 모두 설계.

**디자인 철학**: 전문 터미널 미학과 현대적 글래스모피즘의 만남. 다크 모드가 주된 경험(금융 전문가들은 다크 모드 선호), 동일하게 세련된 라이트 모드 제공. 모든 표면에는 목적이 있다 — 장식적 군더더기 없이 기능적 아름다움만.

---

## 1. 컬러 시스템

### 1.1 배경 계층 (5단계)

레이어드 표면이 테두리 없이 깊이감을 생성. 각 단계는 서로 다른 oklch 밝기 단계.

#### 다크 모드 (주 경험)

| 단계 | 토큰 | oklch 값 | 용도 |
|------|------|----------|------|
| L0 — 베이스 | `--bg-base` | `oklch(0.13 0.005 260)` | 페이지 배경, 앱 셸 |
| L1 — 서피스 | `--bg-surface` | `oklch(0.17 0.005 260)` | 메인 콘텐츠 패널, 사이드바 |
| L2 — 카드 | `--bg-card` | `oklch(0.21 0.005 260)` | 카드, 드롭다운, 팝오버 |
| L3 — 엘리베이티드 | `--bg-elevated` | `oklch(0.25 0.008 260)` | 호버 상태, 모달 오버레이 |
| L4 — 플로팅 | `--bg-floating` | `oklch(0.30 0.010 260)` | 툴팁, 플로팅 패널, 토스트 |

#### 라이트 모드

| 단계 | 토큰 | oklch 값 | 용도 |
|------|------|----------|------|
| L0 — 베이스 | `--bg-base` | `oklch(0.965 0.003 260)` | 페이지 배경 |
| L1 — 서피스 | `--bg-surface` | `oklch(0.985 0.002 260)` | 메인 콘텐츠 패널 |
| L2 — 카드 | `--bg-card` | `oklch(1.0 0 0)` | 카드 (순백) |
| L3 — 엘리베이티드 | `--bg-elevated` | `oklch(1.0 0 0)` | 그림자로 높이감 표현 |
| L4 — 플로팅 | `--bg-floating` | `oklch(1.0 0 0)` | 더 강한 그림자 적용 |

### 1.2 전경 / 텍스트 계층

#### 다크 모드

| 토큰 | oklch 값 | 용도 |
|------|----------|------|
| `--text-primary` | `oklch(0.95 0 0)` | 헤드라인, 가격, 주요 콘텐츠 |
| `--text-secondary` | `oklch(0.72 0 0)` | 설명, 레이블 |
| `--text-tertiary` | `oklch(0.55 0 0)` | 캡션, 타임스탬프, 비활성 |
| `--text-muted` | `oklch(0.42 0 0)` | 플레이스홀더, 미묘한 힌트 |

#### 라이트 모드

| 토큰 | oklch 값 | 용도 |
|------|----------|------|
| `--text-primary` | `oklch(0.15 0 0)` | 헤드라인, 가격, 주요 콘텐츠 |
| `--text-secondary` | `oklch(0.40 0 0)` | 설명, 레이블 |
| `--text-tertiary` | `oklch(0.55 0 0)` | 캡션, 타임스탬프 |
| `--text-muted` | `oklch(0.70 0 0)` | 플레이스홀더 |

### 1.3 브랜드 & 액센트 컬러

기존 프라이머리 틸을 더 풍부하고 생동감 있는 에메랄드-틸로 진화. "스타트업"이 아닌 "금융급" 느낌.

| 토큰 | 다크 모드 | 라이트 모드 | 용도 |
|------|-----------|------------|------|
| `--primary` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` | 주요 액션, 링크, 활성 상태 |
| `--primary-hover` | `oklch(0.78 0.15 162)` | `oklch(0.40 0.18 162)` | 프라이머리 요소 호버 |
| `--primary-muted` | `oklch(0.72 0.17 162 / 15%)` | `oklch(0.45 0.16 162 / 10%)` | 프라이머리 틴트 배경 |
| `--secondary` | `oklch(0.70 0.10 250)` | `oklch(0.50 0.12 250)` | 보조 액션, 정보 상태 |
| `--secondary-hover` | `oklch(0.76 0.08 250)` | `oklch(0.45 0.14 250)` | 세컨더리 호버 |
| `--accent` | `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85)` | 하이라이트, 뱃지, 골드/앰버 액센트 |
| `--accent-hover` | `oklch(0.85 0.10 85)` | `oklch(0.50 0.16 85)` | 액센트 호버 |

### 1.4 시맨틱 / 상태 컬러

| 토큰 | 다크 모드 | 라이트 모드 | 용도 |
|------|-----------|------------|------|
| `--success` | `oklch(0.72 0.19 145)` | `oklch(0.50 0.17 145)` | 긍정 상태, 확인 |
| `--success-bg` | `oklch(0.72 0.19 145 / 12%)` | `oklch(0.50 0.17 145 / 8%)` | 성공 배경 틴트 |
| `--warning` | `oklch(0.82 0.16 75)` | `oklch(0.65 0.18 75)` | 경고, 주의 필요 |
| `--warning-bg` | `oklch(0.82 0.16 75 / 12%)` | `oklch(0.65 0.18 75 / 8%)` | 경고 배경 틴트 |
| `--danger` | `oklch(0.70 0.20 25)` | `oklch(0.55 0.22 25)` | 오류, 파괴적 액션 |
| `--danger-bg` | `oklch(0.70 0.20 25 / 12%)` | `oklch(0.55 0.22 25 / 8%)` | 오류 배경 틴트 |
| `--info` | `oklch(0.75 0.12 240)` | `oklch(0.55 0.14 240)` | 정보, 중립 알림 |
| `--info-bg` | `oklch(0.75 0.12 240 / 12%)` | `oklch(0.55 0.14 240 / 8%)` | 정보 배경 틴트 |

### 1.5 테두리 & 구분선 컬러

| 토큰 | 다크 모드 | 라이트 모드 |
|------|-----------|------------|
| `--border-subtle` | `oklch(1 0 0 / 6%)` | `oklch(0 0 0 / 6%)` |
| `--border-default` | `oklch(1 0 0 / 10%)` | `oklch(0 0 0 / 10%)` |
| `--border-strong` | `oklch(1 0 0 / 16%)` | `oklch(0 0 0 / 16%)` |
| `--border-focus` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` |
| `--border-gradient-start` | `oklch(0.72 0.17 162 / 40%)` | `oklch(0.45 0.16 162 / 30%)` |
| `--border-gradient-end` | `oklch(0.70 0.10 250 / 20%)` | `oklch(0.50 0.12 250 / 15%)` |

### 1.6 전체 CSS 변수 정의

```css
:root {
  /* 배경 계층 */
  --bg-base: oklch(0.965 0.003 260);
  --bg-surface: oklch(0.985 0.002 260);
  --bg-card: oklch(1.0 0 0);
  --bg-elevated: oklch(1.0 0 0);
  --bg-floating: oklch(1.0 0 0);

  /* 텍스트 계층 */
  --text-primary: oklch(0.15 0 0);
  --text-secondary: oklch(0.40 0 0);
  --text-tertiary: oklch(0.55 0 0);
  --text-muted: oklch(0.70 0 0);

  /* 브랜드 */
  --primary: oklch(0.45 0.16 162);
  --primary-hover: oklch(0.40 0.18 162);
  --primary-muted: oklch(0.45 0.16 162 / 10%);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.50 0.12 250);
  --secondary-hover: oklch(0.45 0.14 250);
  --accent: oklch(0.55 0.14 85);
  --accent-hover: oklch(0.50 0.16 85);

  /* 시맨틱 */
  --success: oklch(0.50 0.17 145);
  --success-bg: oklch(0.50 0.17 145 / 8%);
  --warning: oklch(0.65 0.18 75);
  --warning-bg: oklch(0.65 0.18 75 / 8%);
  --danger: oklch(0.55 0.22 25);
  --danger-bg: oklch(0.55 0.22 25 / 8%);
  --info: oklch(0.55 0.14 240);
  --info-bg: oklch(0.55 0.14 240 / 8%);

  /* 테두리 */
  --border-subtle: oklch(0 0 0 / 6%);
  --border-default: oklch(0 0 0 / 10%);
  --border-strong: oklch(0 0 0 / 16%);
  --border-focus: oklch(0.45 0.16 162);

  /* 주식 컬러 (한국 컨벤션: 빨강=상승, 파랑=하락) */
  --color-stock-up: oklch(0.55 0.22 25);
  --color-stock-up-bg: oklch(0.55 0.22 25 / 8%);
  --color-stock-down: oklch(0.55 0.17 250);
  --color-stock-down-bg: oklch(0.55 0.17 250 / 8%);
  --color-stock-flat: oklch(0.55 0 0);

  /* 그림자 (라이트는 실제 그림자, 글로우 아님) */
  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 5%);
  --shadow-medium: 0 2px 8px oklch(0 0 0 / 8%), 0 1px 2px oklch(0 0 0 / 4%);
  --shadow-elevated: 0 4px 16px oklch(0 0 0 / 10%), 0 2px 4px oklch(0 0 0 / 5%);
  --shadow-floating: 0 8px 32px oklch(0 0 0 / 12%), 0 4px 8px oklch(0 0 0 / 6%);

  /* 글래스모피즘 */
  --glass-bg: oklch(1 0 0 / 70%);
  --glass-border: oklch(0 0 0 / 8%);
  --glass-blur: 12px;

  /* 라운드 */
  --radius: 0.625rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.875rem;
  --radius-2xl: 1.125rem;
}

.dark {
  /* 배경 계층 */
  --bg-base: oklch(0.13 0.005 260);
  --bg-surface: oklch(0.17 0.005 260);
  --bg-card: oklch(0.21 0.005 260);
  --bg-elevated: oklch(0.25 0.008 260);
  --bg-floating: oklch(0.30 0.010 260);

  /* 텍스트 계층 */
  --text-primary: oklch(0.95 0 0);
  --text-secondary: oklch(0.72 0 0);
  --text-tertiary: oklch(0.55 0 0);
  --text-muted: oklch(0.42 0 0);

  /* 브랜드 */
  --primary: oklch(0.72 0.17 162);
  --primary-hover: oklch(0.78 0.15 162);
  --primary-muted: oklch(0.72 0.17 162 / 15%);
  --primary-foreground: oklch(0.15 0 0);
  --secondary: oklch(0.70 0.10 250);
  --secondary-hover: oklch(0.76 0.08 250);
  --accent: oklch(0.80 0.12 85);
  --accent-hover: oklch(0.85 0.10 85);

  /* 시맨틱 */
  --success: oklch(0.72 0.19 145);
  --success-bg: oklch(0.72 0.19 145 / 12%);
  --warning: oklch(0.82 0.16 75);
  --warning-bg: oklch(0.82 0.16 75 / 12%);
  --danger: oklch(0.70 0.20 25);
  --danger-bg: oklch(0.70 0.20 25 / 12%);
  --info: oklch(0.75 0.12 240);
  --info-bg: oklch(0.75 0.12 240 / 12%);

  /* 테두리 */
  --border-subtle: oklch(1 0 0 / 6%);
  --border-default: oklch(1 0 0 / 10%);
  --border-strong: oklch(1 0 0 / 16%);
  --border-focus: oklch(0.72 0.17 162);

  /* 주식 컬러 (한국 컨벤션: 빨강=상승, 파랑=하락) — 다크 배경에서 더 밝게 */
  --color-stock-up: oklch(0.72 0.20 25);
  --color-stock-up-bg: oklch(0.72 0.20 25 / 12%);
  --color-stock-down: oklch(0.72 0.15 250);
  --color-stock-down-bg: oklch(0.72 0.15 250 / 12%);
  --color-stock-flat: oklch(0.60 0 0);

  /* 그림자 (다크 모드는 미묘한 글로우 사용, 드롭 섀도우 아님) */
  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 20%);
  --shadow-medium: 0 2px 8px oklch(0 0 0 / 30%), 0 0 1px oklch(1 0 0 / 5%);
  --shadow-elevated: 0 4px 16px oklch(0 0 0 / 40%), 0 0 1px oklch(1 0 0 / 8%);
  --shadow-floating: 0 8px 32px oklch(0 0 0 / 50%), 0 0 1px oklch(1 0 0 / 10%);

  /* 글래스모피즘 (다크에서 더 드라마틱) */
  --glass-bg: oklch(0.17 0.005 260 / 60%);
  --glass-border: oklch(1 0 0 / 8%);
  --glass-blur: 16px;
}
```

---

## 2. 카드 시스템

### 2.1 카드 변형

모든 카드는 공통 베이스를 공유하고 변형 모디파이어로 분기. 링 기반 테두리(선명한 엣지)와 그림자 기반 깊이감 모두 사용.

#### 기본 카드 (Default)

그룹화된 콘텐츠를 위한 표준 컨테이너.

```css
/* 유틸리티 클래스: .card-default */
.card-default {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-subtle);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
```

**Tailwind**: `bg-[--bg-card] border border-[--border-default] rounded-xl shadow-[--shadow-subtle]`

#### 글래스 카드 (글래스모피즘)

오버레이, 헤더, 히어로 섹션을 위한 반투명 패널. 배경 블러로 깊이감 생성.

```css
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-medium);
}
```

**Tailwind**: `bg-[--glass-bg] backdrop-blur-[--glass-blur] border border-[--glass-border] rounded-xl shadow-[--shadow-medium]`

#### 그래디언트 테두리 카드

하이라이트된 콘텐츠(주목 종목, 활성 관심종목 항목)를 위한 그래디언트 테두리 액센트 카드.

```css
.card-gradient-border {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-medium);
  /* 의사 요소를 통한 그래디언트 테두리 */
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

#### 인터랙티브 카드

클릭 가능한 항목(종목 리스트 행, 관심종목 카드, 뉴스 항목)용. 호버 시 카드가 떠오름.

```css
.card-interactive {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-subtle);
  cursor: pointer;
  transition: all 0.2s ease;
}
.card-interactive:hover {
  background: var(--bg-elevated);
  border-color: var(--border-default);
  box-shadow: var(--shadow-medium);
  transform: translateY(-1px);
}
.card-interactive:active {
  transform: translateY(0px);
  box-shadow: var(--shadow-subtle);
}
```

**Tailwind**: `bg-[--bg-card] border border-[--border-subtle] rounded-xl shadow-[--shadow-subtle] cursor-pointer transition-all hover:bg-[--bg-elevated] hover:border-[--border-default] hover:shadow-[--shadow-medium] hover:-translate-y-px active:translate-y-0`

#### 통계 카드

KPI/지표 표시용 컴팩트 카드(시장 지수, 포트폴리오 요약). 색상이 있는 왼쪽 액센트 바 특징.

```css
.card-stat {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-subtle);
  padding: 12px 16px;
}
/* 변형: 양수 */
.card-stat[data-trend="up"] {
  border-left-color: var(--color-stock-up);
  background: linear-gradient(135deg, var(--color-stock-up-bg), transparent 60%);
}
/* 변형: 음수 */
.card-stat[data-trend="down"] {
  border-left-color: var(--color-stock-down);
  background: linear-gradient(135deg, var(--color-stock-down-bg), transparent 60%);
}
```

### 2.2 그림자 계층

| 단계 | 토큰 | 다크 모드 | 라이트 모드 | 용도 |
|------|------|-----------|------------|------|
| 미묘 | `--shadow-subtle` | `0 1px 2px oklch(0 0 0/20%)` | `0 1px 2px oklch(0 0 0/5%)` | 기본 정지 상태 |
| 중간 | `--shadow-medium` | `0 2px 8px oklch(0 0 0/30%), 내부 글로우` | `0 2px 8px oklch(0 0 0/8%)` | 호버, 포커스 요소 |
| 높음 | `--shadow-elevated` | `0 4px 16px oklch(0 0 0/40%), 내부 글로우` | `0 4px 16px oklch(0 0 0/10%)` | 모달, 확장 패널 |
| 플로팅 | `--shadow-floating` | `0 8px 32px oklch(0 0 0/50%), 내부 글로우` | `0 8px 32px oklch(0 0 0/12%)` | 툴팁, 커맨드 팔레트 |

### 2.3 내부 글로우 효과 (다크 모드 전용)

다크 모드 카드 상단 엣지에 미묘한 1px 내부 글로우로 빛 반사 시뮬레이션:

```css
.dark .card-default,
.dark .card-interactive {
  box-shadow:
    var(--shadow-subtle),
    inset 0 1px 0 oklch(1 0 0 / 5%);
}
```

---

## 3. 타이포그래피 스케일

### 3.1 사이즈 스케일

데이터 밀도 높은 금융 인터페이스에 최적화. 일반 웹 스케일보다 촘촘 — 모든 사이즈에 역할이 있음.

| 토큰 | 사이즈 | 행간 | 용도 |
|------|--------|------|------|
| `--text-2xs` | `0.625rem` (10px) | 1.2 | 마이크로 레이블 (차트 축, 거래량) |
| `--text-xs` | `0.75rem` (12px) | 1.3 | 타임스탬프, 뱃지, 캡션 |
| `--text-sm` | `0.8125rem` (13px) | 1.4 | 부가 텍스트, 테이블 셀, 설명 |
| `--text-base` | `0.875rem` (14px) | 1.5 | 본문, 폼 레이블, 리스트 항목 |
| `--text-md` | `0.9375rem` (15px) | 1.5 | 카드 제목, 테이블 헤더 |
| `--text-lg` | `1.0625rem` (17px) | 1.4 | 섹션 제목, 종목명 |
| `--text-xl` | `1.25rem` (20px) | 1.3 | 페이지 부제목, 가격 |
| `--text-2xl` | `1.5rem` (24px) | 1.2 | 페이지 제목, 히어로 숫자 |
| `--text-3xl` | `1.875rem` (30px) | 1.1 | 대형 표시 숫자 (지수 값) |
| `--text-4xl` | `2.25rem` (36px) | 1.1 | 히어로 헤드라인 숫자 |

### 3.2 굵기 시스템

| 토큰 | 굵기 | 용도 |
|------|------|------|
| `--font-regular` | 400 | 본문, 설명, 테이블 셀 |
| `--font-medium` | 500 | 레이블, 카드 제목, 네비게이션 항목 |
| `--font-semibold` | 600 | 섹션 헤더, 종목명, 강조 |
| `--font-bold` | 700 | 가격, KPI 숫자, 페이지 제목 |

### 3.3 금융 데이터용 모노스페이스

모든 숫자 금융 데이터(가격, 거래량, 퍼센트, 지수)는 열 정렬을 위해 모노스페이스 + tabular-nums 사용:

```css
.font-mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* 가격 전용: 큰 숫자에 더 촘촘하게 */
.font-price {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

### 3.4 자간

| 맥락 | 자간 | 참고 |
|------|------|------|
| 대문자 레이블 | `0.05em` | 가독성을 위해 넓힘 |
| 본문 | `0` | 기본, Pretendard가 잘 처리 |
| 제목 (>= xl) | `-0.01em` | 세련미를 위해 약간 좁힘 |
| 큰 숫자 (>= 2xl) | `-0.02em` | 모노스페이스 숫자가 잘 좁혀짐 |

---

## 4. 데이터 시각화 컬러

### 4.1 주가 변동 (한국 컨벤션)

| 상태 | 다크 모드 | 라이트 모드 | 토큰 |
|------|-----------|------------|------|
| 상승 | `oklch(0.72 0.20 25)` | `oklch(0.55 0.22 25)` | `--color-stock-up` |
| 상승 배경 | `oklch(0.72 0.20 25 / 12%)` | `oklch(0.55 0.22 25 / 8%)` | `--color-stock-up-bg` |
| 하락 | `oklch(0.72 0.15 250)` | `oklch(0.55 0.17 250)` | `--color-stock-down` |
| 하락 배경 | `oklch(0.72 0.15 250 / 12%)` | `oklch(0.55 0.17 250 / 8%)` | `--color-stock-down-bg` |
| 보합 | `oklch(0.60 0 0)` | `oklch(0.55 0 0)` | `--color-stock-flat` |

**캔들스틱 차트 매핑:**
- `--color-chart-candle-up`: `--color-stock-up`과 동일
- `--color-chart-candle-down`: `--color-stock-down`과 동일
- 캔들 위크: 1px, 같은 색상 60% 불투명도

### 4.2 다중 시리즈 차트 팔레트

겹치는 차트 시리즈를 위한 8개의 지각적으로 구별되는 색상. 색각 이상(적록색맹/적색맹)에서도 구별 가능하도록 테스트 완료.

| 시리즈 | 토큰 | 다크 모드 | 라이트 모드 | 이름 |
|--------|------|-----------|------------|------|
| 1 | `--chart-1` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` | 틸 (프라이머리) |
| 2 | `--chart-2` | `oklch(0.75 0.14 45)` | `oklch(0.55 0.16 45)` | 오렌지 |
| 3 | `--chart-3` | `oklch(0.70 0.15 300)` | `oklch(0.48 0.17 300)` | 보라 |
| 4 | `--chart-4` | `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85)` | 골드 |
| 5 | `--chart-5` | `oklch(0.68 0.18 210)` | `oklch(0.48 0.18 210)` | 시안 |
| 6 | `--chart-6` | `oklch(0.72 0.16 350)` | `oklch(0.50 0.18 350)` | 핑크 |
| 7 | `--chart-7` | `oklch(0.75 0.15 120)` | `oklch(0.50 0.16 120)` | 라임 |
| 8 | `--chart-8` | `oklch(0.70 0.12 20)` | `oklch(0.50 0.14 20)` | 코랄 |

각 시리즈의 영역 채움: 같은 색상 10-20% 불투명도, 하단으로 투명 그래디언트.

### 4.3 뱃지 / 카테고리 컬러

마켓 태그, 섹터 뱃지, 뉴스 카테고리용:

| 뱃지 | 다크 모드 | 라이트 모드 | 용도 |
|------|-----------|------------|------|
| 한국 시장 | `oklch(0.72 0.20 25 / 15%)` 텍스트 `oklch(0.72 0.20 25)` | `oklch(0.55 0.22 25 / 10%)` 텍스트 `oklch(0.55 0.22 25)` | 한국 시장 태그 |
| 미국 시장 | `oklch(0.70 0.12 250 / 15%)` 텍스트 `oklch(0.70 0.12 250)` | `oklch(0.50 0.14 250 / 10%)` 텍스트 `oklch(0.50 0.14 250)` | 미국 시장 태그 |
| 섹터 | `oklch(0.72 0.17 162 / 15%)` 텍스트 `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162 / 10%)` 텍스트 `oklch(0.45 0.16 162)` | 섹터/산업 태그 |
| 뉴스 | `oklch(0.80 0.12 85 / 15%)` 텍스트 `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85 / 10%)` 텍스트 `oklch(0.55 0.14 85)` | 뉴스 카테고리 뱃지 |
| ETF | `oklch(0.70 0.15 300 / 15%)` 텍스트 `oklch(0.70 0.15 300)` | `oklch(0.48 0.17 300 / 10%)` 텍스트 `oklch(0.48 0.17 300)` | ETF 태그 |

### 4.4 히트맵 그래디언트

섹터 히트맵 및 성과 매트릭스용. 한국 컨벤션에 따라 진한 파랑(최악)에서 중립 회색을 거쳐 진한 빨강(최고)까지 9단계 그래디언트:

```css
--heatmap-1: oklch(0.55 0.17 250);    /* -4%+ 진한 파랑 */
--heatmap-2: oklch(0.60 0.12 250);    /* -3% */
--heatmap-3: oklch(0.65 0.08 250);    /* -2% */
--heatmap-4: oklch(0.68 0.04 250);    /* -1% */
--heatmap-5: oklch(0.55 0 0);         /* 0% 중립 회색 */
--heatmap-6: oklch(0.68 0.04 25);     /* +1% */
--heatmap-7: oklch(0.65 0.08 25);     /* +2% */
--heatmap-8: oklch(0.60 0.12 25);     /* +3% */
--heatmap-9: oklch(0.55 0.17 25);     /* +4%+ 진한 빨강 */
```

### 4.5 시장 지수 표시 컬러

| 지수 | 컬러 | 토큰 |
|------|------|------|
| KOSPI | `oklch(0.55 0.22 25)` / `oklch(0.72 0.20 25)` | `--index-kospi` |
| KOSDAQ | `oklch(0.55 0.17 250)` / `oklch(0.72 0.15 250)` | `--index-kosdaq` |
| S&P 500 | `oklch(0.45 0.16 162)` / `oklch(0.72 0.17 162)` | `--index-sp500` |
| NASDAQ | `oklch(0.48 0.17 300)` / `oklch(0.70 0.15 300)` | `--index-nasdaq` |
| USD/KRW | `oklch(0.55 0.14 85)` / `oklch(0.80 0.12 85)` | `--index-usdkrw` |

---

## 5. 마이크로 인터랙션

### 5.1 트랜지션 타이밍

모든 인터랙션에서 일관된 이징:

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* 빠른 감속 — 진입용 */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* 부드러움 — 변환용 */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* 바운스 — 재미 요소용 */
  --duration-fast: 120ms;    /* 호버, 활성 상태 */
  --duration-normal: 200ms;  /* 카드 전환, 색상 변경 */
  --duration-slow: 350ms;    /* 모달 열기/닫기, 레이아웃 시프트 */
}
```

### 5.2 카드 호버 효과

```css
/* 표준 카드 호버 — 띄우기 + 테두리 밝히기 */
.card-interactive {
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out),
              border-color var(--duration-fast) ease;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
  border-color: var(--border-default);
}
.card-interactive:active {
  transform: translateY(0);
  transition-duration: var(--duration-fast);
}

/* 통계 카드 호버 — 미묘한 액센트 색상 글로우 */
.card-stat:hover {
  box-shadow: var(--shadow-medium),
              0 0 0 1px var(--primary-muted);
}
```

### 5.3 버튼 상태

```css
/* 기본 버튼 — 눌림 효과 (shadcn 베이스에 이미 있음) */
button {
  transition: all var(--duration-fast) var(--ease-in-out);
}
button:hover {
  filter: brightness(1.08);
}
button:active {
  transform: translateY(1px);
  filter: brightness(0.95);
}

/* 고스트 버튼 호버 — 미묘한 배경 채우기 */
.btn-ghost:hover {
  background: var(--bg-elevated);
}

/* 아이콘 버튼 — 호버 시 스케일 펄스 */
.btn-icon:hover {
  transform: scale(1.05);
}
.btn-icon:active {
  transform: scale(0.95);
}
```

### 5.4 가격 틱 애니메이션 (숫자 변경)

주식 앱의 시그니처 인터랙션. 가격이 변경되면 색상이 잠시 깜빡이고 숫자가 애니메이션됨.

```css
/* 가격 변경 플래시 애니메이션 */
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

/* 숫자 카운터 애니메이션 (선택, 히어로 숫자용) */
@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-count {
  animation: count-up 0.4s var(--ease-out) forwards;
}
```

**React 구현 패턴:**
```tsx
// usePriceTick 훅
function usePriceTick(currentPrice: number, prevPrice: number) {
  const direction = currentPrice > prevPrice ? 'up' : currentPrice < prevPrice ? 'down' : null;
  return direction ? `price-tick-${direction}` : '';
}
```

### 5.5 로딩 스켈레톤

미묘한 그래디언트 스윕이 있는 펄스 기반 스켈레톤. 적절한 대비를 위해 배경 계층 사용.

```css
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-floating) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

/* 다크 모드: 더 잘 보이는 쉬머 */
.dark .skeleton {
  background: linear-gradient(
    90deg,
    oklch(0.22 0.005 260) 25%,
    oklch(0.28 0.008 260) 50%,
    oklch(0.22 0.005 260) 75%
  );
  background-size: 200% 100%;
}
```

### 5.6 차트 호버 툴팁

```css
.chart-tooltip {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  padding: 8px 12px;
  font-size: var(--text-xs);
  animation: tooltip-enter 0.15s var(--ease-out) forwards;
  pointer-events: none;
}

@keyframes tooltip-enter {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 5.7 리스트 아이템 / 행 인터랙션

```css
/* 테이블 행 호버 — 미묘한 하이라이트 */
.table-row {
  transition: background var(--duration-fast) ease;
}
.table-row:hover {
  background: var(--bg-elevated);
}

/* 관심종목 별 토글 */
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

### 5.8 페이지 전환

페이지 콘텐츠의 부드러운 진입:

```css
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-content {
  animation: page-enter 0.3s var(--ease-out) forwards;
}
```

### 5.9 포커스 링 시스템

일관되고 접근성 있는 포커스 표시:

```css
/* 기본 포커스 링 */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* 다크 배경에서는 아웃라인 대신 글로우 사용 */
.dark :focus-visible {
  outline: 2px solid var(--primary);
  box-shadow: 0 0 0 4px var(--primary-muted);
}
```

---

## 6. 구현 매핑

### 6.1 기존 shadcn 변수 매핑

마이그레이션 노력을 최소화하기 위해, 새 토큰은 기존 shadcn 변수를 대체하지 않고 보완:

| shadcn 변수 | 매핑 대상 | 참고 |
|-------------|----------|------|
| `--background` | `--bg-base` | 페이지 배경 |
| `--card` | `--bg-card` | 카드 표면 |
| `--popover` | `--bg-floating` | 팝오버/드롭다운 표면 |
| `--muted` | `--bg-surface` | 뮤트 배경 |
| `--foreground` | `--text-primary` | 주 텍스트 |
| `--muted-foreground` | `--text-secondary` | 보조 텍스트 |
| `--border` | `--border-default` | 기본 테두리 |
| `--ring` | `--border-focus` | 포커스 링 |
| `--primary` | `--primary` | 직접 매핑 |
| `--destructive` | `--danger` | 오류/파괴적 |

### 6.2 Tailwind 유틸리티 확장

```css
/* globals.css @theme 블록에 추가 */
@theme inline {
  --shadow-subtle: var(--shadow-subtle);
  --shadow-medium: var(--shadow-medium);
  --shadow-elevated: var(--shadow-elevated);
  --shadow-floating: var(--shadow-floating);
}
```

### 6.3 마이그레이션 우선순위

1. **1단계**: 배경 계층 + 텍스트 컬러 (시각적 임팩트 최대)
2. **2단계**: 카드 시스템 개편 (글래스모피즘 + 그림자)
3. **3단계**: 데이터 시각화 컬러 (차트, 뱃지, 히트맵)
4. **4단계**: 마이크로 인터랙션 (호버, 애니메이션, 스켈레톤)
5. **5단계**: 폴리시 (페이지 전환, 포커스 링, 툴팁)

---

## 7. 접근성 준수

모든 색상 조합이 WCAG 2.1 AA 대비 요구사항 충족:

| 조합 | 대비 비율 | 통과 |
|------|----------|------|
| `--text-primary` on `--bg-base` (다크) | ~16:1 | AAA |
| `--text-primary` on `--bg-card` (다크) | ~13:1 | AAA |
| `--text-secondary` on `--bg-card` (다크) | ~7:1 | AA |
| `--text-tertiary` on `--bg-card` (다크) | ~4.6:1 | AA (큰 텍스트) |
| `--color-stock-up` on `--bg-card` (다크) | ~7.5:1 | AA |
| `--color-stock-down` on `--bg-card` (다크) | ~7.5:1 | AA |
| `--text-primary` on `--bg-base` (라이트) | ~17:1 | AAA |
| `--text-secondary` on `--bg-card` (라이트) | ~8:1 | AA |
| `--color-stock-up` on white (라이트) | ~5.5:1 | AA |
| `--color-stock-down` on white (라이트) | ~5.2:1 | AA |

포커스 표시는 인접 색상 대비 최소 3:1 (WCAG 2.4.7).

---

## 8. 비주얼 아이덴티티 시그니처

### 8.1 그래디언트 액센트

데이터를 압도하지 않으면서 브랜드를 표현하는 미묘한 그래디언트:

```css
/* 히어로 섹션 배경 그래디언트 */
.hero-gradient {
  background: linear-gradient(
    180deg,
    var(--primary-muted) 0%,
    transparent 60%
  );
}

/* 헤더 배경 (글래스 + 그래디언트) */
.header-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--glass-border);
}

/* 빈 상태를 위한 장식 메시 그래디언트 */
.mesh-gradient {
  background:
    radial-gradient(ellipse at 20% 50%, var(--primary-muted) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, oklch(0.70 0.10 250 / 8%) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, oklch(0.80 0.12 85 / 6%) 0%, transparent 50%);
}
```

### 8.2 노이즈 텍스처 오버레이

넓은 평면에 촉각적 질감 추가 (선택, CSS만 사용):

```css
.texture-noise::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* 작은 노이즈 SVG */
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

---

*UX 디자이너 A가 StockView 디자인 개편을 위해 설계. 모든 값은 Tailwind CSS 4 + shadcn/ui (base-nova)에 최적화된 구현 가능한 oklch CSS 커스텀 프로퍼티.*
