# 기술 호환성 리뷰

> **리뷰어**: 기술 호환성 리뷰어
> **날짜**: 2026-03-30
> **대상**: implementation-plan.md + unified-design-system.md + unified-page-layouts.md
> **현재 스택**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui (base-nova), next-themes, lightweight-charts

---

## 발견된 누락/문제 (심각도: 높음/중간/낮음)

### 1. 다크 모드 전환 메커니즘 근본 충돌 (심각도: 높음)

- **문제**: 현재 시스템은 `next-themes`의 `attribute="class"` 설정으로 `.dark` 클래스 기반 다크 모드를 사용한다 (`providers.tsx:27`). globals.css의 `@custom-variant dark (&:is(.dark *));`도 이에 맞춰져 있다. 그런데 통합 디자인 시스템은 **`:root`를 다크 모드 기본값**으로 정의하고, **`.light` 클래스를 라이트 모드 오버라이드**로 사용한다. 이 두 접근은 근본적으로 호환되지 않는다.
- **영향**:
  - `next-themes`는 `<html>`에 `dark`/`light`/`system` 클래스를 토글한다. 현재 설정에서 라이트 모드 시 `.dark` 클래스가 제거되면, Tailwind의 `dark:` 유틸리티가 비활성화된다. 그런데 새 디자인은 `.light` 클래스를 붙이는 방식이므로, `next-themes` 설정을 바꾸지 않으면 라이트 모드 변수가 절대 적용되지 않는다.
  - Tailwind `@custom-variant dark (&:is(.dark *));`가 `.light` 시스템과 맞지 않게 된다.
- **해결 방안**:
  - **방안 A (권장)**: 현재 `.dark` 클래스 시스템을 유지하되, 디자인 시스템 CSS를 `:root`(라이트) / `.dark`(다크)로 작성. `defaultTheme`을 `"dark"`로 변경하여 다크 우선 경험 구현. `next-themes`, `@custom-variant`, 기존 `dark:` 유틸리티 모두 수정 없이 호환.
  - **방안 B**: `next-themes`의 `attribute="class"`를 유지하되 값 매핑을 커스터마이징. `themes={["dark", "light"]}` + `defaultTheme="dark"` 설정. CSS에서 `:root` 대신 `.dark` 셀렉터에 다크 변수를 넣고, `:root`(또는 `.light`)에 라이트 변수를 넣는다.
- **계획서 수정 제안**: Phase 1-1에 "다크 모드 메커니즘 전환 전략" 항목을 추가. 구체적으로 `providers.tsx`의 `ThemeProvider` 설정 변경과 `@custom-variant dark` 정의 유지/변경 여부를 명시해야 한다.

---

### 2. 기존 `dark:` Tailwind 유틸리티 30+ 파일 전면 깨짐 (심각도: 높음)

- **문제**: 코드베이스 전역에 `dark:` 접두어 유틸리티가 광범위하게 사용되고 있다:
  - `dark:prose-invert` (가이드 페이지 6곳)
  - `dark:text-green-400`, `dark:bg-green-900/30` 등 (sentiment, badge, status 컴포넌트)
  - `dark:-rotate-90 dark:scale-0` (헤더 테마 토글 아이콘)
  - 총 30+ 파일에서 `dark:` 유틸리티 사용 중
- **영향**: 만약 `:root`를 다크 기본으로 변경하고 `.dark` 클래스를 제거하면, 모든 `dark:` 유틸리티가 **항상 미적용** 상태가 된다. 라이트 모드 전용 스타일로 잘못 렌더링됨.
- **해결 방안**: 문제 #1의 방안 A를 채택하면 (`defaultTheme="dark"` + `.dark` 클래스 유지) 자동 해결. 또는 모든 `dark:` 유틸리티를 새 토큰 기반으로 교체하는 작업을 Phase 1에 포함해야 한다.
- **계획서 수정 제안**: Phase 1에 "기존 `dark:` 유틸리티 전수 조사 및 마이그레이션" 체크리스트 추가. 예상 변경 파일 수를 1파일(globals.css)에서 **30+ 파일**로 상향 조정.

---

### 3. `text-primary` Tailwind 유틸리티 이름 충돌 (심각도: 높음)

- **문제**: 현재 `@theme inline` 블록에 `--color-primary: var(--primary);`가 등록되어 있다. Tailwind 4에서 `text-primary`는 이 `--color-primary` 값(= 브랜드 초록색 `oklch(0.45 0.16 155)`)을 참조한다. 새 디자인 시스템은 `--text-primary`라는 CSS 변수를 "헤드라인/가격 텍스트 색상"으로 정의하는데, `text-primary` 유틸리티 클래스와 직접 충돌한다.
- **영향**: 현재 29개 파일에서 `text-primary`를 브랜드 색상(초록)으로 사용 중이다. `--text-primary` CSS 변수를 추가해도 Tailwind의 `text-primary` 유틸리티는 여전히 `--color-primary`를 참조하므로 혼란이 발생. 만약 `@theme inline`에 `--color-text-primary`를 추가하면 `text-text-primary`라는 어색한 클래스가 생긴다.
- **해결 방안**:
  - CSS 변수명을 `--text-primary`가 아닌 `--foreground-primary` 또는 `--text-1`로 변경하여 Tailwind 네임스페이스와 분리
  - 또는 `@theme inline`에서 별도의 `--color-fg-primary: var(--text-primary)` 매핑을 만들어 `text-fg-primary`로 사용
- **계획서 수정 제안**: Phase 1-1의 텍스트 계층 변수 이름을 재검토하고 Tailwind 유틸리티 이름과의 충돌 방지 전략을 명시.

---

### 4. lightweight-charts 다크 모드 감지 로직 깨짐 (심각도: 중간)

- **문제**: `stock-chart.tsx:87`과 `compare-chart.tsx:60`에서 `document.documentElement.classList.contains("dark")`로 다크 모드를 감지한다. 만약 새 디자인에서 `.dark` 클래스 없이 `:root` 기본 다크를 적용하면, 이 감지가 **항상 false**를 반환하여 차트가 항상 라이트 모드 색상으로 렌더링된다.
- **영향**: 차트 그리드 라인, 텍스트 색상, 가격 스케일 보더가 라이트 모드 값(밝은 회색)으로 고정되어 다크 배경 위에서 거의 안 보이게 됨.
- **해결 방안**: 문제 #1의 방안 A 채택 시 자동 해결. 그렇지 않으면 감지 로직을 `!document.documentElement.classList.contains("light")` 또는 `window.matchMedia("(prefers-color-scheme: dark)")` 등으로 변경.
- **계획서 수정 제안**: "변경하지 않는 것" 섹션에 "lightweight-charts 라이브러리"가 있지만, 차트 옵션의 색상 전달 코드는 수정이 필요함을 명시.

---

### 5. lightweight-charts 캔들 색상 하드코딩 (심각도: 중간)

- **문제**: `stock-chart.tsx:115-120`에서 캔들 색상이 hex 리터럴로 하드코딩되어 있다:
  ```js
  upColor: "#ef4444",      // Tailwind red-500
  downColor: "#3b82f6",    // Tailwind blue-500
  ```
  새 디자인 시스템의 주가 방향 색상은 oklch 값이다 (`oklch(0.72 0.20 25)` 등). lightweight-charts는 CSS 변수를 직접 받지 못하고 hex/rgb 문자열만 지원한다.
- **영향**: 캔들 색상이 디자인 시스템과 불일치. 다크/라이트 모드 전환 시에도 동일 색상 유지 (현재도 동일하지만, 새 디자인에서는 모드별 다른 값을 정의함).
- **해결 방안**: `getComputedStyle(document.documentElement).getPropertyValue('--color-stock-up')` 등으로 런타임에 CSS 변수값을 읽어와 사용. oklch 값은 `getComputedStyle`이 브라우저에서 자동으로 rgb로 변환해주므로 호환 가능.
- **계획서 수정 제안**: Phase 5 또는 Phase 6에 "차트 색상을 디자인 토큰 기반으로 전환" 항목 추가.

---

### 6. shadcn `--secondary`/`--accent` 의미 변경 (심각도: 중간)

- **문제**: 현재 shadcn 컴포넌트가 참조하는 핵심 변수의 의미가 크게 바뀐다:
  - `--secondary`: 현재 = 중립 회색 (`oklch(0.97 0 0)` 라이트 / `oklch(0.269 0 0)` 다크) → 새 디자인 = 파란색 계열 (`oklch(0.50 0.12 250)` 라이트 / `oklch(0.70 0.10 250)` 다크)
  - `--accent`: 현재 = 중립 회색 (secondary와 동일) → 새 디자인 = 골드/앰버 (`oklch(0.55 0.14 85)` 라이트 / `oklch(0.80 0.12 85)` 다크)
  - `--accent-foreground`: 현재 = 어두운 텍스트 (`oklch(0.205 0 0)`) → 새 디자인 = 어두운 텍스트 유지하지만 accent 배경이 골드로 바뀌므로 대비 비율 재확인 필요
- **영향**: shadcn의 `Badge variant="secondary"`, `Button variant="secondary"`, `Tabs`, `DropdownMenu` 등이 현재 중립 회색 배경인데, 변경 후 파란색/골드 배경으로 바뀜. 의도치 않은 시각적 변화 발생 가능.
- **해결 방안**:
  - 새 디자인에서 shadcn 호환 매핑에 중립 회색 값을 별도로 유지 (예: `--muted` 변수를 현재와 유사한 중립 회색으로 설정)
  - 또는 shadcn 컴포넌트의 variant별 실제 렌더링 결과를 Phase 1 검증에서 확인
- **계획서 수정 제안**: Phase 1 검증 체크리스트에 "shadcn 컴포넌트 (Button, Badge, Tabs, DropdownMenu) variant별 시각 확인" 추가.

---

### 7. `@theme inline` 블록에 새 변수 미등록 시 Tailwind 유틸리티 미생성 (심각도: 중간)

- **문제**: 구현 계획 1-2에서 "`@theme inline`에 새 변수들 Tailwind 유틸리티로 노출"이라고 했지만 구체적인 매핑이 명시되지 않았다. Tailwind 4에서 CSS 변수를 `@theme inline`에 등록하지 않으면 유틸리티 클래스가 자동 생성되지 않는다.
- **영향**: 다음 항목들이 `@theme inline`에 등록되어야 유틸리티로 사용 가능:
  - `--color-bg-base`, `--color-bg-surface`, `--color-bg-card`, `--color-bg-elevated`, `--color-bg-floating` → `bg-bg-base` 등 (또는 네이밍 개선 필요)
  - `--shadow-subtle`, `--shadow-medium`, `--shadow-elevated`, `--shadow-floating` → `shadow-subtle` 등
  - `--color-chart-6`, `--color-chart-7`, `--color-chart-8` → 현재 5까지만 등록
  - `--color-heatmap-1` ~ `--color-heatmap-9`
  - 트랜지션 타이밍 토큰은 Tailwind의 `@theme` 기본 네임스페이스(`--ease-*`, `--duration-*` 등)와 직접 매핑 가능
- **해결 방안**: Phase 1-2에 구체적인 `@theme inline` 매핑 코드를 명시.
- **계획서 수정 제안**: Phase 1-2를 확장하여 `@theme inline` 등록 목록을 명세화. 특히 `bg-bg-base` 같은 이중 접두어 문제를 고려한 네이밍 전략 수립.

---

### 8. `--radius` 값 정의 충돌 (심각도: 낮음)

- **문제**: 현재 `@theme inline`에서 `--radius-sm: calc(var(--radius) * 0.6)` 등 계산식으로 정의하는데, 새 디자인 시스템은 하드코딩된 값을 사용:
  ```css
  --radius-sm: 0.375rem;  /* 현재: calc(0.625rem * 0.6) = 0.375rem ✓ */
  --radius-md: 0.5rem;    /* 현재: calc(0.625rem * 0.8) = 0.5rem ✓ */
  --radius-lg: 0.625rem;  /* 현재: var(--radius) = 0.625rem ✓ */
  --radius-xl: 0.875rem;  /* 현재: calc(0.625rem * 1.4) = 0.875rem ✓ */
  --radius-2xl: 1.125rem; /* 현재: calc(0.625rem * 1.8) = 1.125rem ✓ */
  ```
- **영향**: 현재 값과 계산 결과가 일치하므로 시각적 변화 없음. 다만 `@theme inline`의 `calc()` 정의와 `:root`의 하드코딩 정의가 공존하면 어느 쪽이 우선하는지 혼란. 또한 새 디자인에는 `--radius-3xl`, `--radius-4xl`이 없는데 현재 `@theme inline`에는 있음.
- **해결 방안**: `@theme inline`의 radius 정의를 새 디자인에 맞춰 업데이트하거나, 한쪽으로 통일.
- **계획서 수정 제안**: Phase 1-2에 `@theme inline` radius 정의 정리 포함.

---

### 9. `--primary` hue 값 변경 (155 → 162) (심각도: 낮음)

- **문제**: 현재 `--primary`의 hue가 155 (더 청록에 가까운 초록)인데, 새 디자인은 162 (더 순수 초록). 미세한 차이지만 `--ring`, `--sidebar-ring` 등 연쇄 참조하는 변수들도 모두 바뀜.
- **영향**: 브랜드 색상이 미세하게 변경됨. 기능적 이슈 없음.
- **해결 방안**: 의도된 변경이면 문제없음. 단, OG 이미지, 파비콘 등 정적 에셋에 이전 브랜드 색상이 하드코딩되어 있다면 같이 업데이트.
- **계획서 수정 제안**: 필요 시 정적 에셋(og-default.png 등) 색상 업데이트 항목 추가.

---

### 10. Next.js 16 / React 19 서버 컴포넌트 호환성 (심각도: 낮음)

- **문제**: 구현 계획에서 추가하는 컴포넌트 중 일부(`usePriceTick` 훅, 티커 테이프 호버 정지, 차트 미니 위젯)는 클라이언트 컴포넌트여야 한다. 서버 컴포넌트에서 CSS 변수를 인라인 스타일로 접근하거나 DOM API를 사용하면 에러 발생.
- **영향**: `"use client"` 지시어 누락 시 빌드 에러.
- **해결 방안**: 신규 인터랙티브 컴포넌트에 `"use client"` 필수. 서버 컴포넌트에서는 Tailwind 유틸리티 클래스만 사용 (CSS 변수는 유틸리티를 통해 간접 참조).
- **계획서 수정 제안**: 각 Phase의 신규 컴포넌트에 서버/클라이언트 구분 명시. 특히 Phase 3 티커 테이프, Phase 6 가격 틱 훅은 반드시 클라이언트.

---

## 문제 요약

| # | 문제 | 심각도 | 영향 범위 |
|---|------|--------|----------|
| 1 | 다크 모드 `.dark` ↔ `:root` 기본 충돌 | **높음** | 전체 사이트 |
| 2 | `dark:` 유틸리티 30+ 파일 깨짐 | **높음** | 30+ 파일 |
| 3 | `text-primary` 이름 충돌 | **높음** | 29 파일 + 디자인 시스템 |
| 4 | lightweight-charts 다크 감지 깨짐 | 중간 | 차트 2개 컴포넌트 |
| 5 | 캔들 색상 하드코딩 | 중간 | 차트 1개 컴포넌트 |
| 6 | shadcn secondary/accent 의미 변경 | 중간 | shadcn 컴포넌트 전체 |
| 7 | `@theme inline` 등록 미명세 | 중간 | Tailwind 유틸리티 생성 |
| 8 | radius 정의 중복 | 낮음 | 스타일 일관성 |
| 9 | primary hue 미세 변경 | 낮음 | 브랜드 색상 |
| 10 | 서버/클라이언트 컴포넌트 구분 | 낮음 | 신규 컴포넌트 |

---

## 핵심 권고사항

> **가장 중요한 결정**: 다크 모드 메커니즘(문제 #1)을 먼저 확정해야 한다. 이 결정이 문제 #2, #4에 연쇄적으로 영향을 미친다.
>
> **권장**: 현재 `.dark` 클래스 시스템을 유지하고, `defaultTheme="dark"`로만 변경하는 방안 A. 이렇게 하면 기존 `dark:` 유틸리티, `@custom-variant`, lightweight-charts 감지 로직이 모두 수정 없이 동작한다. 디자인 시스템 CSS만 `:root`(라이트) / `.dark`(다크) 구조로 작성하면 된다.
>
> **두 번째 중요 결정**: `--text-primary` 변수명(문제 #3)을 Tailwind 충돌 없는 이름으로 변경해야 한다. 추천: `--fg-primary`, `--fg-secondary`, `--fg-tertiary`, `--fg-muted`.
