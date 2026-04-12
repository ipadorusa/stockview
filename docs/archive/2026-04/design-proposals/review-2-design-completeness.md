> **Status**: Archived (2026-04-12). Superseded by [.ai/DESIGN.md](../../../.ai/DESIGN.md).

# 디자인 완전성 리뷰

> **리뷰어**: 디자인 완전성 리뷰어
> **대상**: implementation-plan.md
> **기준 문서**: unified-design-system.md, unified-page-layouts.md, cross-review-a-reviews-b.md, cross-review-b-reviews-a.md
> **날짜**: 2026-03-30

---

## 요약

구현 계획서는 전체적으로 통합 디자인 문서의 주요 항목을 잘 커버하고 있으나, **11개의 누락 항목**이 발견되었다. 심각도 높음 3건, 중간 5건, 낮음 3건이다.

---

## 누락된 항목 (심각도: 높음)

### 1. 홈페이지 마켓 펄스 패널 컴포넌트 3종 누락 (환율위젯, 퀵액션, 섹터미니히트맵)

- **통합 문서 위치**: unified-page-layouts.md 섹션 1.1 (레이아웃 다이어그램), 섹션 1.3 (퀵 링크 카드 명세)
- **상세**:
  - 홈페이지 우측 "마켓 펄스" 패널에 **환율 카드** (USD/KRW, EUR/KRW — `.card-stat` 패턴), **퀵 액션 카드** (스크리너, AI리포트, 종목비교, 투자가이드 — `.card-interactive`), **섹터 미니 히트맵** (트리맵 축소판, `/sectors` 링크) 3개 컴포넌트가 명시되어 있음
  - 구현 계획 Phase 3에는 티커테이프, 지수카드, 인기종목, 뉴스만 포함되어 있고 마켓 펄스 패널의 3개 위젯이 완전히 빠져 있음
  - 심리 게이지는 Phase 6-3에 별도 배치되어 있으나, 이 3종은 어디에도 없음
- **계획에 빠진 이유 추정**: Phase 3-3에서 "인기 종목 + 마켓 펄스 → 뉴스 배치"를 언급하지만, 마켓 펄스 내부 컴포넌트를 상세화하지 않음
- **추가할 Phase**: Phase 3
- **구체적 작업 항목**:
  - `src/components/home/exchange-rate-widget.tsx` (신규) — 환율 카드, `.card-stat` 적용
  - `src/components/home/quick-actions.tsx` (신규) — 퀵 링크 그리드, `.card-interactive`
  - `src/components/home/sector-mini-heatmap.tsx` (신규) — 축소 히트맵, `--heatmap-*` 색상, `/sectors` 링크

### 2. CSS 변수 다크모드 우선 전환 전략 미명시

- **통합 문서 위치**: unified-design-system.md 섹션 1.1 (다크 모드 우선 결정), 섹션 2.8 (`:root` = dark, `.light` = light)
- **상세**:
  - 통합 디자인은 `:root`에 다크 모드 값, `.light` 클래스에 라이트 모드 값을 정의함
  - 현재 코드베이스는 반대 방향 — `:root`가 라이트, `.dark`가 다크 모드
  - 이 전환은 Tailwind 설정, Next.js theme provider, 모든 다크모드 유틸리티 클래스(`dark:*`)에 영향을 미침
  - 구현 계획 Phase 1-1은 "`:root` 변수를 라이트 모드 값으로, `.dark` 변수를 다크 모드 값으로 교체"라고 적혀 있어 **기존 방식을 유지**하는 것처럼 읽히나, 통합 디자인 문서는 **반대 방향**을 요구함
- **계획에 빠진 이유 추정**: 색상 값 교체에만 집중하고, 다크/라이트 선언 구조 변경을 간과함
- **추가할 Phase**: Phase 1 (가장 앞에서 결정 필요)
- **구체적 작업 항목**:
  - 다크모드 우선 전환 여부 최종 결정 (`:root`=dark vs 현행 유지)
  - 전환 시: Tailwind config `darkMode` 설정 변경, ThemeProvider 수정, `dark:` 유틸리티 → `light:` 유틸리티로 전환
  - 또는 현행 유지 시: unified-design-system.md의 CSS 코드 블록을 현행 방식(`:root`=light, `.dark`=dark)으로 재매핑

### 3. 브랜드/액센트/시맨틱 컬러 토큰 누락

- **통합 문서 위치**: unified-design-system.md 섹션 2.3 (브랜드 & 액센트), 섹션 2.4 (시맨틱/상태 컬러)
- **상세**:
  - 통합 디자인은 `--primary`, `--primary-hover`, `--primary-muted`, `--primary-foreground`, `--secondary`, `--secondary-hover`, `--accent`, `--accent-hover` 등 8개 브랜드 토큰과 `--success`, `--warning`, `--danger`, `--info` + 각각의 `-bg` 변형 8개 시맨틱 토큰을 새로 정의함
  - 구현 계획 Phase 1-1에는 배경/텍스트/테두리/그림자/글래스/히트맵/차트/주식 컬러 토큰만 나열되어 있고, **브랜드/시맨틱 컬러 교체가 목록에 없음**
  - 이 토큰들은 헤더 네비 링크, 버튼, 마켓 상태 뱃지, 에러 상태 등 사이트 전반에 사용됨
- **계획에 빠진 이유 추정**: 기존 shadcn이 이미 `--primary` 등을 정의하고 있어 교체 대상으로 인식하지 못한 것으로 추정
- **추가할 Phase**: Phase 1-1
- **구체적 작업 항목**:
  - `--primary/--primary-hover/--primary-muted/--primary-foreground` oklch 값 교체
  - `--secondary/--secondary-hover/--secondary-foreground` 신규 추가
  - `--accent/--accent-hover/--accent-foreground` 신규 추가
  - `--success/--warning/--danger/--info` + 각 `-bg` 변형 8개 토큰 추가
  - `--destructive` 토큰 매핑 추가

---

## 누락된 항목 (심각도: 중간)

### 4. Gradient Border 카드 변형 누락

- **통합 문서 위치**: unified-design-system.md 섹션 3.5, cross-review-a-reviews-b.md 섹션 4.1
- **상세**:
  - 통합 디자인은 6종 카드를 정의: Default, Interactive, Stat, Chart, **Gradient Border**, Glass
  - 계획 Phase 1-3은 `.card-default`, `.card-interactive`, `.card-stat`, `.card-chart`만 포함
  - `.card-gradient-border`는 Hot Stocks Top 3, 관심종목 알림, 상한가/하한가 종목에 사용
  - 교차리뷰에서도 "Gradient Border Card 활용처"를 합의함
- **계획에 빠진 이유 추정**: "제한적 사용"이라 우선순위에서 밀린 것으로 추정
- **추가할 Phase**: Phase 1-3 (유틸리티 클래스 정의) + Phase 3-4 (Hot Stocks 적용)
- **구체적 작업 항목**:
  - `.card-gradient-border` CSS 클래스 추가 (`::before` pseudo-element, `mask-composite` 기법)
  - `--border-gradient-start`, `--border-gradient-end` 토큰은 Phase 1-1에 포함되어 있으나 사용처 명시 필요

### 5. 센티먼트/인덱스/캐러셀 도트/바 투명도 전용 토큰 누락

- **통합 문서 위치**: unified-design-system.md 섹션 2.7 (`--bar-opacity-*`), 2.8 (`--sentiment-*`, `--index-*`, `--dot-*`)
- **상세**:
  - Phase 1-1의 "데이터 시각화 토큰 추가 (뱃지, 인덱스 컬러)"가 모호하여, 아래 토큰 그룹의 포함 여부가 불명확:
    - `--sentiment-fear/neutral/greed` (3개)
    - `--index-kospi/kosdaq/sp500/nasdaq/usdkrw` (5개)
    - `--dot-inactive/active/size/size-active/gap` (5개)
    - `--bar-opacity-full/high/medium/low/bg` + `--breadth-advancing/declining/flat` (8개)
  - 총 21개 토큰이 명시적으로 나열되지 않음
- **계획에 빠진 이유 추정**: "데이터 시각화 토큰"으로 뭉뚱그려 기술
- **추가할 Phase**: Phase 1-1
- **구체적 작업 항목**: 위 21개 CSS 변수를 Phase 1-1 체크리스트에 명시적으로 추가

### 6. 반경(radius) 토큰 체계 미언급

- **통합 문서 위치**: unified-design-system.md 섹션 2.8 (CSS 코드 블록, line 231-237)
- **상세**:
  - 통합 디자인은 6단계 radius 토큰 정의: `--radius`, `--radius-sm/md/lg/xl/2xl`
  - 구현 계획에는 radius 토큰 교체/추가에 대한 언급이 전혀 없음
  - 카드, 뱃지, 버튼, 입력 필드 등 전반에 영향
- **계획에 빠진 이유 추정**: shadcn이 기본 `--radius`를 이미 정의하고 있어 간과
- **추가할 Phase**: Phase 1-1
- **구체적 작업 항목**: `--radius-sm/md/lg/xl/2xl` 6개 토큰 추가

### 7. 네비게이션 세부 컴포넌트 누락 (마켓 상태 뱃지, 브레드크럼, 서브네비)

- **통합 문서 위치**: unified-page-layouts.md 섹션 4.1 (마켓 상태 뱃지 5개 상태), 섹션 4.3 (브레드크럼)
- **상세**:
  - 계획 Phase 2-1은 "시장 상태 뱃지 추가"를 한 줄로 언급하지만, 5가지 상태(장중/장마감/프리마켓/애프터마켓/휴장)별 구현 상세가 없음
  - 서브 네비게이션(2단 네비: 시장·ETF·섹터·배당·실적) — 계획에서 "서브 네비 필 스타일 + 활성 인디케이터 애니메이션"으로 한 줄 언급하지만, 실제 항목 구성이 미기술
  - 브레드크럼 컴포넌트 — 종목 상세 등에서 "주식 > 삼성전자 (005930)" 형태로 사용. 계획에 전혀 없음
- **계획에 빠진 이유 추정**: Phase 2가 "레이아웃 개편" 수준에서 기술되어 세부 UI 요소가 빠짐
- **추가할 Phase**: Phase 2-1
- **구체적 작업 항목**:
  - `src/components/layout/market-status-badge.tsx` (신규) — 5가지 상태 + pulse 애니메이션
  - `src/components/layout/breadcrumb.tsx` (신규) — 셰브론 구분자, 모바일 생략 로직
  - 서브 네비게이션 항목(시장·ETF·섹터·배당·실적) 정의 및 라우트 매핑

### 8. 모바일 전용 패턴 누락 (풀투리프레시, 스티키 CTA, 터치타겟)

- **통합 문서 위치**: unified-page-layouts.md 섹션 5.3 (스티키 CTA 바), 섹션 5.4 (풀투리프레시, 터치 타겟)
- **상세**:
  - **스티키 CTA 바**: 종목 상세 모바일에서 "관심종목 추가" 플로팅 버튼. `position: fixed`, 56px 높이, 차트 스크롤 후 페이드인. 계획에 없음
  - **풀투리프레시**: 홈/시장/관심종목 페이지, 80px 풀다운, StockView 로고 회전 인디케이터. 계획에 없음
  - **터치 타겟**: 모든 인터랙티브 요소 44px×44px 최소 크기. 계획의 검증 체크리스트에 없음
- **계획에 빠진 이유 추정**: 계획이 데스크톱 우선으로 작성되어 모바일 전용 인터랙션이 누락
- **추가할 Phase**: Phase 5 (스티키 CTA), Phase 6 (풀투리프레시, 터치타겟 감사)
- **구체적 작업 항목**:
  - `src/components/stock/sticky-cta-bar.tsx` (신규) — Phase 5에 추가
  - 풀투리프레시 구현 (홈/시장/관심종목) — Phase 6에 추가
  - 전역 터치 타겟 감사 — Phase 6 검증 체크리스트에 추가

---

## 누락된 항목 (심각도: 낮음)

### 9. 타이포그래피 상세 유틸리티 클래스 미포함

- **통합 문서 위치**: unified-design-system.md 섹션 4.2~4.5 (무게 체계, 자간 규칙), 섹션 4.5 (B 타이포 클래스 매핑 — `.price-large/medium/small`, `.change-pill`, `.card-section-title`)
- **상세**:
  - 계획 Phase 1-3은 `.font-price`만 언급
  - 통합 문서에는 `.price-large`, `.price-medium`, `.price-small`, `.change-pill`, `.card-section-title` 유틸리티도 정의되어 있음
  - 타이포그래피 크기 토큰(`--text-2xs` ~ `--text-4xl`)의 @theme 등록도 명시 필요
- **계획에 빠진 이유 추정**: `.font-price`가 대표로 기술되고 나머지가 생략됨
- **추가할 Phase**: Phase 1-3
- **구체적 작업 항목**: `.price-large/medium/small`, `.change-pill`, `.card-section-title` 유틸리티 클래스 추가

### 10. 히어로 그래디언트 & 메시 그래디언트 미포함

- **통합 문서 위치**: unified-design-system.md 섹션 6.12 (`.hero-gradient`, `.mesh-gradient`)
- **상세**:
  - 홈페이지 히어로 영역용 그래디언트와 빈 상태(empty state)용 메시 그래디언트가 정의됨
  - 계획에는 홈페이지 "히어로 섹션 → 대시보드형으로 교체"만 언급되고 그래디언트 배경 처리가 없음
- **계획에 빠진 이유 추정**: 히어로 제거로 불필요하다고 판단했을 수 있으나, empty state와 배경 분위기용으로 여전히 필요
- **추가할 Phase**: Phase 1-3 (유틸리티 정의) + Phase 3 (적용)
- **구체적 작업 항목**: `.hero-gradient`, `.mesh-gradient` CSS 클래스 추가

### 11. 차트 툴팁, 캐러셀 도트, 티커 테이프의 전용 CSS 클래스 정의

- **통합 문서 위치**: unified-design-system.md 섹션 6.5 (티커 테이프 전용), 6.6 (캐러셀 도트), 6.7 (차트 툴팁)
- **상세**:
  - 통합 디자인은 `.ticker-tape`, `.ticker-tape-content`, `.ticker-tape-item`, `.ticker-tape-dot`, `.carousel-dots`, `.carousel-dot`, `.chart-tooltip` 등 전용 CSS 클래스와 keyframe을 상세히 정의함
  - 계획 Phase 3-1은 "CSS 애니메이션 (translateX), 호버 시 정지"로 간략히 기술
  - 이 CSS 정의들이 Phase 1(globals.css)에 포함되어야 하는지, Phase 3/5에서 컴포넌트별로 작성되는지 불명확
- **계획에 빠진 이유 추정**: 컴포넌트 구현 시 자연히 작성될 것으로 간주
- **추가할 Phase**: Phase 1-3 (globals.css에 공통 클래스 정의)
- **구체적 작업 항목**: 위 전용 CSS 클래스들을 Phase 1-3의 체크리스트에 추가하거나, 각 Phase에서 컴포넌트 구현 시 포함되도록 명시

---

## 기존 항목 중 불명확한 부분 (명확화 필요)

### A. 마이그레이션 안전성

구현 계획의 "변경하지 않는 것" 섹션과 검증 체크리스트는 있으나, **구체적 마이그레이션 전략**이 부족하다:

- 기존 39개 `page.tsx`가 현재 사용하는 Tailwind 유틸리티(예: `dark:bg-card`, `text-muted-foreground`)가 Phase 1 토큰 교체 후에도 정상 동작하는지 검증하는 방법이 없음
- shadcn 호환 매핑(unified-design-system.md 섹션 7.3)이 계획 Phase 1-1에서 "shadcn 변수와 매핑 유지"로 한 줄 언급되지만, 16개 매핑 변수의 구체적 확인이 필요
- **권장**: Phase 1 완료 후 전체 페이지 스모크 테스트 체크리스트 추가

### B. 심리 게이지 Phase 배치

- 통합 레이아웃에서 심리 게이지는 홈페이지 마켓 펄스 패널의 일부
- 계획에서는 Phase 6-3에 배치 (마이크로 인터랙션)
- 홈페이지 완성도를 위해 Phase 3로 이동하거나, Phase 3에서 플레이스홀더 배치 후 Phase 6에서 인터랙션 추가하는 2단계 접근이 필요

### C. 뱃지 카테고리 색상 체계

- unified-design-system.md 섹션 5.3에 8종 뱃지 색상(한국시장, 미국시장, 섹터, 뉴스경제, 뉴스기업, 뉴스증시, 뉴스해외, ETF) 정의
- 계획 Phase 3-5 "카테고리 뱃지 (oklch 뱃지 체계)"로 한 줄 언급되지만 8종 전체의 CSS 변수가 Phase 1-1에 포함되는지 불명확
- **권장**: Phase 1-1에 뱃지 색상 토큰 8종 명시적 추가

---

## 커버리지 요약

| 검토 관점 | 커버율 | 주요 누락 |
|-----------|--------|-----------|
| 컬러 토큰 | ~75% | 브랜드/시맨틱, 센티먼트/인덱스/도트/바 토큰, radius |
| 카드 변형 6종 | 4/6 (67%) | Gradient Border, Glass 명시적 클래스 |
| 컴포넌트-토큰 매핑 | ~85% | 암묵적 커버, 명시적 참조 부족 |
| 홈페이지 컴포넌트 | 4/7 (57%) | 환율, 퀵액션, 섹터미니히트맵 |
| 시장 페이지 컴포넌트 | 5/5 (100%) | — |
| 종목 상세 컴포넌트 | 4/5 (80%) | 스티키 CTA |
| 반응형 3단계 | ~70% | 모바일 전용 패턴 미흡 |
| 교차리뷰 합의사항 | ~85% | Gradient Border 활용처 |
| 접근성 | ~60% | 터치타겟, 상세 WCAG 검증 |
| 마이그레이션 안전 | ~40% | 다크모드 전환 전략, 스모크테스트 |

---

*리뷰 완료. 위 누락 항목들을 구현 계획서에 반영하면 통합 디자인 문서와의 완전한 정합성이 확보됩니다.*
