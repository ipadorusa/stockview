# StockView 디자인 개편 — 구현 계획

> **기반 문서**: unified-design-system.md + unified-page-layouts.md
> **날짜**: 2026-03-29
> **원칙**: 다크 모드 우선 / 글래스모피즘 최소 / 노이즈 텍스처 미적용

---

## Phase 1: 디자인 토큰 기반 교체 (globals.css)

가장 임팩트가 크고 리스크가 낮은 작업. CSS 변수만 교체하므로 컴포넌트 코드 변경 최소.

### 1-1. globals.css 컬러 토큰 교체
**파일**: `src/app/globals.css`

- [ ] `:root` (라이트 모드) 변수를 unified-design-system의 라이트 모드 값으로 교체
- [ ] `.dark` 변수를 unified-design-system의 다크 모드 값으로 교체
- [ ] 주식 컬러 hex → oklch 변환 (`#e53e3e` → `oklch(0.55 0.22 25)` 등)
- [ ] 배경 5단계 변수 추가 (`--bg-base`, `--bg-surface`, `--bg-card`, `--bg-elevated`, `--bg-floating`)
- [ ] 텍스트 4단계 변수 추가 (`--text-primary/secondary/tertiary/muted`)
- [ ] 테두리 3단계 변수 추가 (`--border-subtle/default/strong`)
- [ ] 그림자 4단계 변수 추가 (`--shadow-subtle/medium/elevated/floating`)
- [ ] 글래스모피즘 토큰 추가 (`--glass-bg/border/blur`)
- [ ] 히트맵 9단계 변수 추가 (`--heatmap-1` ~ `--heatmap-9`)
- [ ] 차트 팔레트 8색 교체 (`--chart-1` ~ `--chart-8`)
- [ ] 데이터 시각화 토큰 추가 (뱃지, 인덱스 컬러)
- [ ] 트랜지션 타이밍 토큰 추가 (`--ease-out/in-out/spring`, `--duration-fast/normal/slow`)
- [ ] shadcn 변수와 매핑 유지 (`--background` → `--bg-base` 등)

### 1-2. @theme 블록 업데이트
- [ ] `@theme inline`에 새 변수들 Tailwind 유틸리티로 노출
- [ ] 그림자 토큰 유틸리티 추가
- [ ] 배경 계층 유틸리티 추가

### 1-3. 기본 유틸리티 클래스 추가
- [ ] `.font-price` (모노, bold, tabular-nums, letter-spacing -0.02em)
- [ ] `.card-default`, `.card-interactive`, `.card-stat`, `.card-chart` 유틸리티
- [ ] `.skeleton` shimmer 애니메이션
- [ ] `.price-tick-up`, `.price-tick-down` 애니메이션
- [ ] 페이지 진입 애니메이션 `.page-content`
- [ ] 포커스 링 시스템 `:focus-visible`

**예상 변경**: globals.css 1파일, ~200줄 추가/변경
**검증**: `npm run build` 통과, 다크/라이트 모드 전환 확인

---

## Phase 2: 레이아웃 컴포넌트 개편

### 2-1. 헤더 개편
**파일**: `src/components/layout/app-header.tsx`

- [ ] 헤더에 글래스모피즘 적용 (backdrop-blur)
- [ ] 시장 상태 뱃지 추가 (🟢 장중 / 🔴 장마감 / 🟡 프리마켓)
- [ ] 검색 바 `⌘K` 힌트 추가
- [ ] 서브 네비 필 스타일 + 활성 인디케이터 애니메이션

### 2-2. 모바일 바텀 탭 바 개편
**파일**: `src/components/layout/bottom-tab-bar.tsx`

- [ ] 글래스모피즘 배경 적용
- [ ] 활성 상태: 솔리드 아이콘 + dot 인디케이터
- [ ] iOS safe area 대응

### 2-3. 페이지 컨테이너
**파일**: `src/components/layout/page-container.tsx`

- [ ] 배경 `--bg-base` 적용
- [ ] `.page-content` 진입 애니메이션 적용

### 2-4. 푸터
**파일**: `src/components/layout/footer.tsx`

- [ ] `--bg-surface` 배경, `--text-tertiary` 텍스트

**예상 변경**: 4파일
**검증**: 모든 페이지에서 헤더/푸터/탭바 정상 표시

---

## Phase 3: 홈페이지 대시보드화

### 3-1. 티커 테이프 (신규 컴포넌트)
**파일**: `src/components/home/ticker-tape.tsx` (신규)

- [ ] KOSPI, KOSDAQ, S&P 500, NASDAQ, USD/KRW 무한 수평 스크롤
- [ ] CSS 애니메이션 (`translateX`), 호버 시 정지
- [ ] 색상 코딩 (상승 빨강, 하락 파랑)
- [ ] 클릭 시 상세 페이지 이동
- [ ] `--bg-surface` 배경, `font-mono text-xs tabular-nums`

### 3-2. 지수 위젯 카드 재설계
**파일**: `src/components/market/index-card.tsx` (수정)

- [ ] `.card-stat` 적용 (방향성 좌측 보더 + 그래디언트 배경)
- [ ] 미니 차트 영역 (lightweight-charts, 60px 높이)
- [ ] 숫자 카운트업 애니메이션
- [ ] 모바일: 수평 캐러셀 (scroll-snap)

### 3-3. 홈페이지 레이아웃 변경
**파일**: `src/app/page.tsx` (수정)

- [ ] CSS Grid 대시보드 레이아웃 적용 (4칼럼 → 2칼럼 → 1칼럼)
- [ ] 티커 테이프 → 지수 카드 → 인기 종목 + 마켓 펄스 → 뉴스 배치
- [ ] 히어로 섹션 → 대시보드형으로 교체

### 3-4. 인기 종목 섹션 개편
**파일**: `src/components/market/popular-stocks-tabs.tsx`, `stock-row.tsx` (수정)

- [ ] `.card-interactive` 적용
- [ ] 거래량 바 추가 (수평 바 차트)
- [ ] 호버 시 스파크라인 인라인 표시

### 3-5. 뉴스 카드 개편
**파일**: 뉴스 관련 컴포넌트 (수정)

- [ ] 카테고리 뱃지 (oklch 뱃지 체계)
- [ ] `.card-interactive` 호버 효과
- [ ] 관련 종목 클릭 링크

**예상 변경**: ~6파일 (1 신규 + 5 수정)
**검증**: 홈페이지 데스크톱/태블릿/모바일 3단계 확인

---

## Phase 4: 시장 개요 페이지

### 4-1. 시장 페이지 레이아웃
**파일**: `src/app/market/page.tsx` (수정)

- [ ] Grid 레이아웃 적용
- [ ] KR/US 탭 전환 (URL 쿼리 파라미터)

### 4-2. 섹터 히트맵 (신규)
**파일**: `src/components/market/sector-heatmap.tsx` (신규)

- [ ] CSS Grid 트리맵 (시가총액 비율)
- [ ] `--heatmap-1` ~ `--heatmap-9` 색상 적용
- [ ] 호버 툴팁
- [ ] 모바일: 수평 바 차트로 전환

### 4-3. 시장 너비 바 (신규)
**파일**: `src/components/market/market-breadth-bar.tsx` (신규)

- [ ] 상승/보합/하락 스택드 바
- [ ] 로드 시 너비 애니메이션

### 4-4. 모멘텀 바 (신규)
**파일**: `src/components/market/momentum-bars.tsx` (신규)

- [ ] 상승 TOP 10 / 하락 TOP 10 나란히
- [ ] 수평 바 비례 채움

### 4-5. 정렬 가능 종목 테이블
**파일**: `src/components/market/stock-table.tsx` (신규 또는 수정)

- [ ] 칼럼 헤더 클릭 정렬
- [ ] 인라인 스파크라인
- [ ] 고정 헤더, 페이지네이션
- [ ] 모바일: 첫 칼럼 고정 수평 스크롤

**예상 변경**: ~5파일 (3~4 신규)
**검증**: 시장 페이지 데이터 표시 + 정렬/필터 동작

---

## Phase 5: 종목 상세 페이지

### 5-1. 종목 상세 레이아웃
**파일**: `src/app/stock/[ticker]/page.tsx` (수정)

- [ ] CSS Grid: chart(60vh) + sidebar(320px) 레이아웃
- [ ] 반응형: 태블릿에서 사이드바 아래로, 모바일 풀 블리드

### 5-2. 종목 헤더 재설계
- [ ] 가격 `text-4xl font-price`, 변동 필 색상
- [ ] OHLV 컴팩트 라인
- [ ] 관심종목/비교/공유 버튼

### 5-3. 사이드바 패널 (신규)
**파일**: `src/components/stock/stock-sidebar.tsx` (신규)

- [ ] 핵심 통계 그리드 (`.card-default`)
- [ ] 52주 레인지 슬라이더
- [ ] 관련 종목
- [ ] sticky 포지셔닝

### 5-4. 콘텐츠 탭 개선
**파일**: `src/app/stock/[ticker]/stock-tabs.tsx` (수정)

- [ ] 탭 전환 페이드 애니메이션
- [ ] 스크롤 시 탭바 sticky

**예상 변경**: ~4파일 (1 신규 + 3 수정)
**검증**: 종목 상세 차트 + 사이드바 + 탭 정상 동작

---

## Phase 6: 마이크로 인터랙션 & 폴리시

### 6-1. 가격 틱 애니메이션
- [ ] `usePriceTick` 훅 구현
- [ ] 가격 표시 컴포넌트에 적용

### 6-2. 스켈레톤 업그레이드
**파일**: `src/components/ui/skeleton.tsx` (수정)

- [ ] shimmer 그래디언트 애니메이션으로 교체

### 6-3. 시장 심리 게이지 (신규)
**파일**: `src/components/home/sentiment-gauge.tsx` (신규)

- [ ] CSS arc + 바늘 회전
- [ ] purple(공포) → gray(중립) → gold(탐욕)

### 6-4. 전역 인터랙션 정리
- [ ] 모든 카드 호버/active 상태 통일
- [ ] 버튼 press-down 효과 통일
- [ ] `prefers-reduced-motion` 대응

**예상 변경**: ~5파일
**검증**: 전체 사이트 인터랙션 일관성 확인, `npm run build` 통과

---

## 구현 순서 요약

| Phase | 내용 | 파일 수 | 난이도 | 의존성 |
|-------|------|---------|--------|--------|
| **1** | 디자인 토큰 (globals.css) | 1 | 낮음 | 없음 |
| **2** | 레이아웃 컴포넌트 (헤더/탭바/푸터) | 4 | 낮음 | Phase 1 |
| **3** | 홈페이지 대시보드화 | ~6 | 중간 | Phase 1, 2 |
| **4** | 시장 개요 페이지 | ~5 | 중간 | Phase 1, 2 |
| **5** | 종목 상세 페이지 | ~4 | 중간 | Phase 1, 2 |
| **6** | 마이크로 인터랙션 & 폴리시 | ~5 | 낮음 | Phase 1~5 |

**Phase 3, 4, 5는 서로 독립적**이므로 병렬 진행 가능.

---

## 변경하지 않는 것

- Next.js App Router 구조
- Prisma 스키마 / API 엔드포인트
- 인증 (NextAuth)
- 데이터 소스 (Naver, Yahoo, RSS)
- lightweight-charts 라이브러리
- shadcn/ui 컴포넌트 기본 구조 (Card, Button, Tabs 등 — 스타일만 변경)

---

## 검증 체크리스트

- [ ] `npm run build` 성공
- [ ] 다크 모드 기본, 라이트 모드 전환 정상
- [ ] 한국 컨벤션: 빨강=상승, 파랑=하락 유지
- [ ] WCAG AA 대비 비율 충족
- [ ] 모바일 (375px), 태블릿 (768px), 데스크톱 (1280px) 반응형
- [ ] `prefers-reduced-motion` 시 애니메이션 비활성
- [ ] 기존 기능 (관심종목, 로그인, 검색 등) 정상 동작
