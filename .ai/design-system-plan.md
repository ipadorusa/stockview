# StockView DESIGN.md 수립 계획

> **목적**: 사이트 전체를 관통하는 단일 DESIGN.md(디자인 시스템 문서)를 만들어 AI 에이전트/개발자가 일관된 UI를 생성·유지할 수 있게 한다.
> **작성일**: 2026-04-12
> **형식 기준**: [Google Stitch DESIGN.md format](https://stitch.withgoogle.com/docs/design-md/format/) + VoltAgent awesome-design-md 9-section 확장
> **산출물**: `.ai/DESIGN.md` (정본) + 프로젝트 루트 `DESIGN.md` (3줄 포인터) — `AGENTS.md`와 짝을 이루는 디자인 원천

---

## Executive Summary

| 관점 | 요약 |
|------|------|
| **Problem** | 현 StockView는 토큰은 있으나 흩어져 있고(globals.css + 하드코딩 hex 혼재), 컴포넌트/차트/주가색 사용이 ad-hoc이라 AI/개발자가 일관된 UI를 재생성하기 어렵다. |
| **Solution** | Stitch DESIGN.md 9-섹션 포맷을 채택해 *다크-퍼스트 터미널 엘레강스* 방향으로 단일 DESIGN.md를 작성하고, 기존 `.ai/design-proposals/unified-design-system.md`를 정본화한다. |
| **Function/UX Effect** | AI 에이전트가 "시장 페이지를 Kraken 스타일로 재작성해줘" 같은 요청에 pixel-perfect 응답. 신규 페이지 평균 작성 시간·재작업률 감소. |
| **Core Value** | 한국 금융 관례 + 글로벌 트레이딩 터미널 수준의 정보 밀도를 갖춘, AI-네이티브로 유지되는 디자인 언어. |

---

## 1. Background — 왜 지금 DESIGN.md가 필요한가

### 1.1 현 상태 (2026-04-12 코드베이스 스캔)

- **토큰 소스**: `src/app/globals.css` 하나 — Tailwind 4 `@theme inline` 방식. `tailwind.config.*` 없음.
- **색상 포맷**: 시맨틱 컬러는 **oklch**, 주가 컬러(stock-up/down/flat)는 **hex** 하드코딩 — 혼재.
- **UI 프리미티브**: shadcn 기반 24개 컴포넌트(`src/components/ui/*`), `@base-ui/react` + `class-variance-authority`. Button(6 variants × 6 sizes), Badge(6 variants)는 CVA화되어 있음.
- **차트**: `lightweight-charts`를 `src/components/stock/stock-chart.tsx`에서 래핑. 지표 10+ 종(MACD/RSI/...). 차트 팔레트(`chart-1~5`) 정의는 있으나 시맨틱 매핑 불명.
- **주가 색**: `var(--color-stock-up)` 참조와 `#e53e3e` 인라인이 섞여 있음 (`institutional-flow.tsx` 등).
- **레이아웃**: 단일 `src/app/layout.tsx` — `AppHeader`(데스크탑) + `BottomTabBar`(모바일 `lg:hidden`), `next-themes`로 다크/라이트.
- **라우트**: 28개 톱레벨 라우트(`/stock/[ticker]`, `/market`, `/screener`, `/compare`, `/admin` 등).
- **기존 제안서**: `.ai/design-proposals/unified-design-system.md`에 1170줄짜리 "Terminal Elegance" 방향 디자인 시스템(oklch 전용, 다크 우선, 5단계 배경 계층) 이미 존재 — **미적용 상태**.

### 1.2 주요 갭

1. 디자인 토큰을 선언한 문서(DESIGN.md)가 없어 AI 에이전트가 볼 단일 진입점이 없음.
2. `.ai/design-proposals/unified-design-system.md`의 결정 사항이 `globals.css`에 이식되지 않음 (oklch 정본화, 주가색 oklch 전환).
3. 타이포/스페이싱 스케일이 "Tailwind 기본 + 체감" 수준, 명시되지 않음.
4. 컴포넌트 합성 패턴(Card.Header, Table Row states, Chart Tooltip 등)에 대한 규약 부재.
5. 모바일 BottomTabBar 외에 breakpoint/터치 타겟 규약 없음.
6. 차트 툴팁·호버·인디케이터 색상이 표준화되어 있지 않음.

---

## 2. Research Findings — 2026 금융/트레이딩 UI 트렌드

### 2.1 핵심 인사이트 (출처 말미 참조)

| 주제 | 정리 |
|------|------|
| **다크-퍼스트** | Linear, Raycast, Arc처럼 다크가 "기본 경험", 라이트는 보조. 금융 전문가 장시간 모니터링 대응. |
| **정보 밀도** | 대시보드 파워 유저는 "여백"보다 "데이터"를 원함. 그룹화·계층·점진 공개(progressive disclosure)로 인지 부하 관리. |
| **패턴** | 사이드바 240–280px + KPI 카드 스트립(4–6개) + CSS Grid auto-fill 콘텐츠 그리드가 2026 표준형. |
| **Bloomberg Terminal** | CVD(색각이상) 접근성 프레임워크 2025 롤아웃. Matthew Carter 커스텀 font(proportional + mono) — 색 + 숫자 타이포의 정밀함. |
| **Robinhood** | 4px grid, Inter typography, 순흑(#000) primary surface, 10-color 제한 팔레트, 대비 ≥4.5:1, **tabular-nums 필수**. |
| **Kraken/Binance** | 데이터-dense 다크 대시보드 + 포인트 액센트(Kraken=purple, Binance=yellow). |
| **실시간성** | "페이지"가 아닌 "항상 움직이는 라이브 시스템"으로 설계 — 상태 전이가 기본. |
| **2026 finance 트렌드** | 차분한 색, 읽기 쉬운 타이포, 투명성/신뢰, 명료한 차트·단순한 테이블·과거 실적 섹션 강화. |

### 2.2 VoltAgent awesome-design-md — 참고 표준

VoltAgent는 66개 이상의 실제 서비스 DESIGN.md 예시를 모아놓은 저장소. **우리가 벤치마킹할 관련 예시**:

- **Kraken** — 퍼플 액센트 다크 UI, 데이터 덴스 대시보드 (트레이딩 터미널에 가장 가까움)
- **Binance** — 모노크롬 + Binance Yellow, trading-floor urgency (주가색/경고 대비 참고)
- **Coinbase** — 기관형 신뢰감, 블루 아이덴티티 (보수적 UI 레퍼런스)
- **Revolut** — 다크 + 그라디언트 카드, fintech 정밀함
- **Stripe** — 퍼플 그라디언트 + weight-300 엘레강스 (본문 타이포 가이드)
- **Supabase / Sentry** — 다크 + 개발자향 데이터 덴스 레이아웃 (관리 화면 레퍼런스)

이 저장소의 표준 섹션(아래 §3)을 그대로 채택한다. 로컬 복제/열람 시 먼저 Kraken, Binance, Stripe의 DESIGN.md를 샘플로 다운받아 톤을 맞춘다.

---

## 3. Target DESIGN.md Structure

Stitch 9-섹션 + VoltAgent 확장을 그대로 채용. StockView 특화 섹션(§4.10)을 하나 더 추가한다.

| # | 섹션 | 담는 것 | StockView 특화 사항 |
|---|------|--------|---------------------|
| 1 | **Visual Theme & Atmosphere** | 무드, 밀도, 디자인 철학 | "Terminal Elegance" — 다크 우선, 고밀도, 한국 금융 관례 |
| 2 | **Color Palette & Roles** | 시맨틱 이름 + oklch + 역할 | 5-level background stack, stock-up/down을 oklch로 정본화 |
| 3 | **Typography Rules** | 폰트 패밀리, 전 계층 테이블 | Pretendard(한글) + Inter(숫자 보조) + JetBrains Mono(티커/가격), **tabular-nums 필수** |
| 4 | **Component Stylings** | 버튼/카드/인풋/내비/테이블 + 상태 | PriceChangeText, TickerBadge, PriceCell, ChartTooltip 포함 |
| 5 | **Layout Principles** | 스페이싱 스케일, 그리드, 여백 철학 | 4px base grid, 240–280 sidebar, KPI strip, **밀도 3단(casual/standard/pro) data-attr 스위치 + 5변수** |
| 6 | **Depth & Elevation** | 섀도우 시스템, 서피스 계층 | L0~L4 배경 계층(기존 proposal 채용) |
| 7 | **Do's and Don'ts** | 가드레일, 안티패턴 | "차트 툴팁에 글래스모피즘 금지", "hex 하드코딩 금지" 등 |
| 8 | **Responsive Behavior** | 브레이크포인트, 터치 타겟, 축소 전략 | BottomTabBar 유지, lg 이상에서 2-col+사이드바 |
| 9 | **Agent Prompt Guide** | 빠른 색 레퍼런스, 즉시 쓰는 프롬프트 | "Kraken 스타일 market 페이지 만들어줘" 같은 샘플 프롬프트 |
| 10 | **Market Data Patterns** (StockView 확장) | 주가색 룰/차트 팔레트 3-tier/KR·US 시장 차이 | 한국 관례(up=red/down=blue), **시맨틱 5 + 카테고리 8 + 히트맵 9** 팔레트 병행, NXT 필터 UI, USD/KRW 표기 |

---

## 4. Execution Plan — 5개 마일스톤

각 마일스톤은 독립 PR 단위로 설계. 기존 서비스에 **점진 적용**한다.

### M1. Discovery & 샘플 수집 (0.5일)

- [ ] VoltAgent 저장소에서 Kraken / Binance / Stripe / Sentry / Supabase DESIGN.md 다운로드 → `.ai/references/design-md/` 로 보관
- [ ] Stitch 공식 포맷 문서 저장 (오프라인 참고용)
- [ ] `.ai/design-proposals/unified-design-system.md` 재읽기 → 이식 가능한 결정 사항 목록화
- [ ] `globals.css` 현 토큰을 CSV/표로 추출 (oklch vs hex 구분)

**산출**: `.ai/references/design-md/` 폴더(7개 샘플), `.ai/references/stitch-format.md`, `.ai/design-tokens-snapshot.md`, `.ai/design-decisions-snapshot.md`.

### M2. DESIGN.md v0.1 초안 (1일)

- [ ] **`.ai/DESIGN.md` (정본) 생성** — §3 구조대로 빈 스켈레톤
- [ ] §1 Visual Theme: 기존 proposal "Terminal Elegance" 도입 문구 이식
- [ ] §2 Color: 기존 5-level 배경 + 텍스트 4단 + 시맨틱을 oklch로 복사 + **주가색 oklch 변환**(#e53e3e → `oklch(0.72 0.20 25)` 등) + **차트 팔레트 3-tier** (시맨틱 5 / 카테고리 8 / 히트맵 9)
  - ℹ️ 용어 주의: `design-decisions-snapshot.md` §5.1 "멀티 시리즈 차트 팔레트 8색"은 새 용어로 **카테고리(`--chart-series-1..8`)** 에 해당. 새 "시맨틱"은 `--chart-up/down/neutral/accent/info` 5개.
- [ ] §3 Typography: **Pretendard(sans, Variable) + JetBrains Mono(mono, Variable)** 2-family 체계 + 10단 size 스케일(`--text-2xs`~`--text-4xl`, unified proposal §4.1) + 4단 weight(`--font-regular/medium/semibold/bold`) + 숫자 전용 `.font-mono`/`.font-price` 유틸 + tabular-nums는 monospace 본질로 자동 해결
- [ ] §6 Elevation: L0~L4 배경 + shadow 3단
- [ ] §10 Market Data: 한국 관례, 차트 팔레트 3-tier, KR/US 표기 규약
- [ ] **루트 포인터 `DESIGN.md` 생성** (3줄 — `.ai/DESIGN.md` 리디렉트, §8 #1 참조)

**산출**: `.ai/DESIGN.md` v0.1 + 루트 `DESIGN.md` 포인터. 이 시점부터 AI 에이전트가 루트에서 DESIGN.md를 찾아 `.ai/DESIGN.md`를 읽을 수 있다.

### M3. DESIGN.md v0.2 — 컴포넌트/레이아웃/반응형 (1일)

- [ ] §4 Component Stylings
  - Button/Badge CVA variant 표로 문서화 (현 구현 그대로 스냅샷)
  - Card, Input, Table, Tooltip, Sheet, Dialog: 현재 스타일 + 권장 변형 기술
  - **StockView 특화**: `PriceChangeText`, `TickerBadge`, `PriceCell`, `ChartTooltip`, `StockTableRow` 사양
- [ ] §5 Layout: 4px grid, 컨테이너 max-w, 사이드바 240–280, KPI strip 규약, **밀도 3단 5변수 + data-attr 스위치 + 라우트 매핑 표** (§8 #4 참고)
- [ ] §8 Responsive: sm/md/lg/xl breakpoint, BottomTabBar 유지, 터치 44×44 최소
- [ ] §7 Do's & Don'ts: 10 ± 2개 항목 (예: "차트 색은 DESIGN.md §2.6 외 사용 금지")
- [ ] §9 Agent Prompt Guide: 3–5개 샘플 프롬프트

**산출**: `DESIGN.md` v0.2 (완성본 초안). 코드 변경은 아직 0.

### M4. Token 정합성 확보 — 코드 정렬 (1–2일)

> **원칙**: DESIGN.md를 진실의 원천(SoT)으로 삼고, 코드를 DESIGN.md에 맞춘다. *역방향 금지.*

- [ ] `src/app/globals.css` 업데이트
  - 주가 컬러 hex → oklch 변환 (§8 #3 참조)
  - 누락된 타이포 스케일 변수 추가 (`--text-2xs` ~ `--text-4xl`)
  - 5-level 배경 계층 정본화 (`--bg-base`~`--bg-floating`)
  - 4-level 텍스트 (`--text-primary/secondary/tertiary/muted`)
  - 시맨틱 상태 4쌍 (`--success/warning/danger/info` + `-bg`)
  - 테두리 3단 (`--border-subtle/default/strong`) + `--border-focus`
  - 그림자 4단 (`--shadow-subtle/medium/elevated/floating`) + inner-glow
  - 타이밍 토큰 (`--ease-*`, `--duration-*`)
  - **차트 토큰 리네임/확장** (§8 #5):
    - `--chart-1..5` → `--chart-series-1..5`로 rename + `-6/-7/-8` 추가 (카테고리 8색)
    - `--chart-up/down/neutral/accent/info` 시맨틱 alias 추가 (stock + primary + info 재사용)
    - `--heatmap-1..9` 신설
  - **밀도 5변수** (§8 #4): `--density-text-base/row-height/card-padding/gap/icon` — casual/standard/pro 3블록으로 `:root[data-density="..."]` 오버라이드
- [ ] **JetBrains Mono Variable 설치** (§8 #3):
  - `src/app/fonts/JetBrainsMonoVariable.woff2` 추가
  - `src/app/fonts.ts`에 `localFont` 선언 (`variable: "--font-jetbrains-mono"`)
  - `src/app/layout.tsx` 클래스 체인에 추가
  - `globals.css --font-mono` 앞단에 `var(--font-jetbrains-mono)` 삽입
- [ ] **밀도 라우트 매퍼** (§8 #4): `src/app/layout.tsx`에서 pathname 매칭 후 `<body data-density="...">` 주입 (기본값 `standard`, 라우트 미지정 시 fallback)
- [ ] 하드코딩된 `#e53e3e`, `#3182ce` 등 11개 hex 토큰 전수 치환 → `var(--color-stock-*)` (grep + Edit)
- [ ] `PriceCell` / `TickerBadge` 공통 컴포넌트 신설 (`src/components/common/`) — 중복 인라인 스타일 대체
- [ ] 차트 컴포넌트 내부에서 `--chart-1..5` 참조가 있다면 `--chart-series-1..5`로 치환 (grep 필수)
- [ ] 빌드 + lint + 시각 회귀 확인 (주요 페이지 5개 스크린샷 비교)

**산출**: PR 1개. 체크 기준 — `npm run build` 통과, 주요 5개 라우트 렌더 정상.

### M5. 운영화 (0.5일)

- [ ] `AGENTS.md`에 "UI 변경 시 `.ai/DESIGN.md`를 먼저 읽을 것" 명시 (§Code Rules 또는 §Tools)
- [ ] `.cursorrules` / Claude hook이 있다면 UI 파일 수정 전 `.ai/DESIGN.md` 참조 유도
- [ ] 루트 `DESIGN.md` (pointer)를 `.github/PULL_REQUEST_TEMPLATE.md`의 "UI 변경 체크리스트"에 링크
- [ ] README에 "Design system: see [.ai/DESIGN.md](./.ai/DESIGN.md)" 배지 추가
- [ ] `/pdca design` 실행 시 `.ai/DESIGN.md`를 자동 참조하도록 가이드
- [ ] **선행 제안서 아카이브**: `.ai/design-proposals/unified-design-system.md` + `.ai/design-proposals/review-2-design-completeness.md` → `docs/archive/2026-04/design-proposals/` 로 이동, 상단에 Archived 마커 추가

**산출**: 운영 규약 반영 PR 1개.

---

## 5. Success Criteria

| # | 기준 | 측정 방법 |
|---|------|----------|
| 1 | `.ai/DESIGN.md` (정본)에 §1–§10 전 섹션 작성됨 + 루트 `DESIGN.md` 3줄 포인터 존재 | 두 파일 존재 + lint (pandoc/textlint) |
| 2 | `globals.css`의 모든 색이 oklch 또는 `var(--*)` 경유 | `grep -E '#[0-9a-fA-F]{3,6}' src/**/*.{ts,tsx,css}` 결과 0 (주가색 포함) |
| 3 | Button/Card/PriceCell/TickerBadge 사용처가 5개 이상 라우트에서 일관 | 수동 리뷰 + 스크린샷 |
| 4 | AI 에이전트가 `.ai/DESIGN.md`만 읽고 신규 페이지 초안 생성 가능 | `/pdca design new-page` 테스트 수행 |
| 5 | 빌드/lint/타입체크 모두 통과 | `npm run build` + `npm run lint` |
| 6 | 주요 페이지(`/`, `/market`, `/stock/[ticker]`, `/compare`, `/screener`) 시각 회귀 없음 | 수동 스크린샷 diff |

---

## 6. Risks & Open Questions

| 리스크 / 질문 | 영향 | 대응 |
|--------------|------|------|
| 주가색 oklch 전환 시 기존 빨/파 톤 달라 보일 수 있음 | 중 | M4 전 소규모 PR로 `/stock/[ticker]`에 먼저 적용 → 시각 검토 |
| shadcn 원본 업데이트와 DESIGN.md 디버전스 | 중 | §4에 "shadcn 원본에서 파생 + 변경점만 문서화" 규약 |
| 2-family 폰트 로딩 부담 (Pretendard + JetBrains Mono) | 저 | 둘 다 Variable + `next/font/local` → 파일 2개로 최적화 (Inter 제외 결정, §8 #3) |
| `.ai/design-proposals/unified-design-system.md` + `review-2-design-completeness.md`와 `.ai/DESIGN.md` 중복 | 저 | M3 v0.2 완성 후 `docs/archive/2026-04/design-proposals/`로 이동, Archived 마커 추가 (§M5 참고) |
| `.ai/design-tokens-snapshot.md` + `.ai/design-decisions-snapshot.md` 처리 | 저 | M2 완료 후에도 M3/M4 작업 지시서 역할 유지 → **M5 운영화 시 `.ai/archive/m1-snapshots/` 로 이동** (M1 산출물 기록 보존 목적) |
| Bloomberg 스타일 고밀도가 일반 투자자에겐 과할 수 있음 | 저 | 해결됨 — 밀도 3단(casual/standard/pro) + 라우트 매핑표 도입 (§8 #4) |
| 질문: 4px grid vs 기존 Tailwind 4의 0.25rem(4px) 호환 | — | 호환. 그대로 채용 가능. |

---

## 7. References

### VoltAgent awesome-design-md
- Repo: https://github.com/VoltAgent/awesome-design-md
- Stitch 포맷: https://stitch.withgoogle.com/docs/design-md/format/
- 벤치마크 예시(trading/fintech): Kraken, Binance, Coinbase, Revolut, Stripe, Wise

### 2026 금융/대시보드 UI
- [Dashboard Design Patterns for Modern Web Apps 2026 — Art of Styleframe](https://artofstyleframe.com/blog/dashboard-design-patterns-web-apps/)
- [UI Design Trends 2026: 15 Patterns — Landdding](https://landdding.com/blog/ui-design-trends-2026)
- [Dashboard UX Patterns Best Practices — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)

### Bloomberg / Robinhood
- [Designing the Terminal for Color Accessibility — Bloomberg UX](https://www.bloomberg.com/ux/2021/10/14/designing-the-terminal-for-color-accessibility/)
- [How Bloomberg Terminal UX Designers Conceal Complexity](https://www.bloomberg.com/company/stories/how-bloomberg-terminal-ux-designers-conceal-complexity/)
- [Robinhood App: Invest with Material Design Ease — Google Design](https://design.google/library/robinhood-investing-material)
- [Robinhood UI skill — Lobehub](https://lobehub.com/skills/ihlamury-design-skills-robinhood)

### 2026 finance web trends
- [What will finance website design look like in 2026? — Digidop](https://www.digidop.com/blog/2026-design-trends-for-finance-websites)
- [7+ Best Stock Market Dashboard Templates 2026 — TailAdmin](https://tailadmin.com/blog/stock-market-dashboard-templates)

### 프로젝트 내 선행 자료
- `.ai/design-proposals/unified-design-system.md` — 기존 1170줄 제안(2026-03-29, Terminal Elegance)
- `.ai/design-proposals/review-2-design-completeness.md`
- `src/app/globals.css` — 현 토큰 정본

---

## 8. Confirmed Decisions (2026-04-12)

M2 착수 전 확정된 5건:

### 1. ✅ 문서 위치 — 듀얼 (`.ai/DESIGN.md` 정본 + 루트 포인터)

- **정본**: `.ai/DESIGN.md` — 모든 편집·버전 관리는 여기.
- **루트 포인터**: `DESIGN.md` — 3줄짜리 pointer 파일로 VoltAgent/Stitch/getdesign CLI 생태계 관례 충족.
  ```markdown
  # StockView Design System
  This project's DESIGN.md lives at [`.ai/DESIGN.md`](./.ai/DESIGN.md).
  See also: [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md).
  ```
- Symlink 비사용 (Windows/Vercel 빌드 리스크). 파일 2개가 정답.
- **작업 위치**: M2 마지막 단계에서 루트 포인터 생성.

### 2. ✅ 선행 제안서 아카이브 — M3 완료 후 실행

- **대상**: `.ai/design-proposals/unified-design-system.md` + `.ai/design-proposals/review-2-design-completeness.md` 동시 아카이브.
- **이동 위치**: `docs/archive/2026-04/design-proposals/` (기존 `docs/archive/` 관례 따름).
- **타이밍**: **M3 완료(DESIGN.md v0.2 확정) 이후**. M1~M3 사이에는 참조용으로 유지.
- **마커**: 아카이브 시 파일 상단에 `> **Status**: Archived. Superseded by [.ai/DESIGN.md](../../.ai/DESIGN.md).` 추가.

### 3. ✅ 타이포 — Pretendard + JetBrains Mono Variable (2-family)

- 둘 다 `next/font/local` 로컬 woff2 → Vercel 빌드 리스크 0.
- JetBrains Mono = monospace → 가격·티커의 tabular-nums 본질적으로 해결. Inter 추가 불필요.
- **작업** (M4): `src/app/fonts/JetBrainsMonoVariable.woff2` 추가 + `src/app/fonts.ts`에 localFont 선언 + `layout.tsx` 클래스 체인 + `globals.css --font-mono` 앞단 삽입.

### 4. ✅ 밀도 3단 (casual / standard / pro) — 좁게 정의

복잡도 폭증을 피하기 위해 **최소 침습 접근**으로 채택:

- **단일 제어 축**: `<body data-density="casual|standard|pro">` 속성 하나로 전체 전환.
- **플립되는 변수 5개만** (컴포넌트 재스타일 금지):

  | 변수 | casual | standard | pro |
  |------|--------|----------|-----|
  | `--density-text-base` | 15px | 14px | 13px |
  | `--density-row-height` | 52px | 44px | 36px |
  | `--density-card-padding` | 20px | 16px | 12px |
  | `--density-gap` | 16px | 12px | 8px |
  | `--density-icon` | 20px | 18px | 16px |

- **CSS 스위치**: `:root[data-density="pro"] { ... }` 블록으로 오버라이드.
- **라우트 매핑** (고정):
  - **casual**: `/`, `/mypage`, `/settings`, `/guide`, `/about`, `/contact`, `/privacy`, `/terms`, `/auth/*`
  - **standard** (⚠ **기본 fallback**): `/market`, `/watchlist`, `/news`, `/sectors`, `/dividends`, `/reports`, 그 외 미지정 라우트 전부
  - **pro**: `/stock/[ticker]`, `/compare`, `/screener`, `/etf/[ticker]`, `/board`, `/admin`
- **Fallback 규칙**: 라우트 매처가 일치하지 않으면 `standard` 자동 적용. M4 layout.tsx 구현 시 필수.
- **금지**: 컴포넌트별 density variant 생성 금지. density는 공간감만, 스타일 불변.
- **적용 메커니즘** (M4): `src/app/layout.tsx`에서 pathname 매칭 후 `<body data-density="...">` 주입.

### 5. ✅ 차트 팔레트 — 3-tier 하이브리드

시맨틱 단일만으로는 `/compare` 등 멀티 시리즈를 못 덮음 → **역할별 3군 병행**:

| 토큰 군 | 용도 | 변수 | 소스 |
|--------|-----|------|-----|
| **시맨틱** | 단일 차트 방향·상태 (가격, 캔들, 게이지, 인디케이터) | `--chart-up`/`--chart-down`/`--chart-neutral`/`--chart-accent`/`--chart-info` | stock-up/down/flat + primary + info 재사용 (alias) |
| **카테고리** | 멀티 시리즈 구분 (compare, 섹터 도넛, 포트폴리오 파이) | `--chart-series-1..8` | unified §5.1 8색 (Teal/Orange/Purple/Gold/Cyan/Pink/Lime/Coral) |
| **히트맵** | 트리맵/매트릭스 그라데이션 | `--heatmap-1..9` | unified §5.2 (파랑→회색→빨강, -4% 이하 ~ +4% 이상) |

- 기존 shadcn `--chart-1..5` 는 `--chart-series-1..5` 로 rename + series-6,7,8 확장.
- 색각이상(적록 색맹) 고려는 카테고리/히트맵 소스 이미 반영됨 (unified §5.1 근거).

---

## 9. Next Step

위 5건 확정 완료. 바로 **M2 (DESIGN.md v0.1 초안)** 착수.
