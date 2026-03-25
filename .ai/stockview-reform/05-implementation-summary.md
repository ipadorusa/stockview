# StockView 개편 구현 요약서

> 작성일: 2026-03-25 | 모든 상세 기획서 취합 완료

---

## 산출물 목록

| # | 파일 | 작성자 | 설명 |
|---|------|--------|------|
| 1 | `01-current-service-analysis.md` | PM Lead | 서비스 전체 분석 (39페이지, 46 API, 16 DB 모델) |
| 2 | `ux-analysis.md` | planner-ux | UX/UI 현황 분석 (강점 10개, 개선점 13개) |
| 3 | `feature-analysis.md` | planner-feature | 기능/데이터 분석 (크론 13개, 데이터소스 7개) |
| 4 | `04-reform-plan.md` | PM Lead | 최종 개편 기획안 (3 Phase 로드맵) |
| 5 | `spec-navigation-redesign.md` | planner-ux | Phase 1 네비게이션 상세 기획 |
| 6 | `spec-data-quality.md` | planner-feature | Phase 1 데이터 품질 상세 기획 |
| 7 | `spec-portfolio.md` | planner-feature | Phase 2 포트폴리오 상세 기획 |

---

## Phase 1 구현 요약 (즉시 착수 가능)

### A. 데이터 품질 개선 (~70분)

| 순서 | 항목 | 시간 | 수정 파일 | 핵심 변경 |
|------|------|------|-----------|-----------|
| 1 | Compare API 버그 수정 | 5분 | `src/app/compare/page.tsx` | `/api/stock/` → `/api/stocks/` (line 33) |
| 2 | PBR null 덮어쓰기 제거 | 10분 | `src/app/api/cron/collect-kr-quotes/route.ts` | upsert update에서 `pbr: null` 제거 |
| 3 | 52주 고저 크론 보강 + API 개별 스크래핑 제거 | 30분 | `collect-kr-quotes/route.ts`, `stocks/[ticker]/route.ts` | 크론에서 fallback 추가, API에서 개별 제거 |
| 4 | Fundamentals 배치 확대 | 20분 | `collect-fundamentals/route.ts`, `cron-fundamentals.yml` | 100→250개, 주1→주3회, maxDuration=300 |
| 5 | DailyPrice 3년 보존 | 5분 | `cron/cleanup/route.ts` | 365일→1,095일 |

**주요 발견**: DailyPrice는 이미 365일 보존으로 변경되어 있었음 (CLAUDE.md 기재가 outdated). 3년으로 추가 확장 제안.

### B. 네비게이션 재설계 (~3시간)

| 순서 | 항목 | 시간 | 파일 |
|------|------|------|------|
| 1 | BottomTabBar 4탭→5탭 | 15분 | `bottom-tab-bar.tsx` |
| 2 | Sheet 메뉴 그룹핑 | 30분 | `app-header.tsx` |
| 3 | 데스크톱 메가메뉴 | 60분 | 신규 `nav-menu.tsx` + `app-header.tsx` |
| 4 | 퀵 링크 카드 컴포넌트 | 30분 | 신규 `quick-links.tsx` |
| 5 | 홈/시장/스크리너 퀵 링크 적용 | 30분 | `page.tsx`, `market/page.tsx`, `screener/page.tsx` |
| 6 | 활성 상태 테스트 | 15분 | - |

**핵심 성과**: 네비 미노출 11개(29%) → 0개(0%), 2클릭 도달 22개(58%) → 35개(92%)

### Phase 1 합계: ~4시간 10분

---

## Phase 2 구현 요약 (포트폴리오, ~6시간)

| 순서 | 항목 | 시간 | 파일 |
|------|------|------|------|
| 1 | Prisma schema + migration | 15분 | `schema.prisma` |
| 2 | API routes (CRUD) | 1시간 | 신규 `api/portfolio/route.ts`, `api/portfolio/[id]/route.ts` |
| 3 | `use-watchlist` 커스텀 훅 | 20분 | 신규 `hooks/use-watchlist.ts` |
| 4 | 포트폴리오 페이지 UI | 2시간 | 신규 `portfolio/page.tsx`, `portfolio-row.tsx`, `portfolio-summary.tsx`, `add-entry-sheet.tsx` |
| 5 | StockRow 관심종목 버튼 | 30분 | `stock-row.tsx` |
| 6 | 적용 페이지 (시장, ETF, 스크리너) | 1시간 | `market/page.tsx`, `etf/page.tsx` 등 |
| 7 | 네비게이션 + 미들웨어 | 20분 | `proxy.ts`, `app-header.tsx` |
| 8 | 테스트 | 1시간 | - |

**핵심 결정**: 별도 PortfolioEntry 모델 신규 생성 (기존 Watchlist 유지, 복수 매수 지원)

---

## 발견된 버그/이슈 (즉시 수정 가능)

| # | 위치 | 설명 | 심각도 |
|---|------|------|--------|
| 1 | `compare/page.tsx:33` | API 경로 오타 `/api/stock/` → `/api/stocks/` | **Critical** (기능 미작동) |
| 2 | `collect-kr-quotes/route.ts` | PBR을 null로 덮어쓰기 (fundamentals 데이터 유실) | **High** |
| 3 | `layout.tsx` + `footer.tsx` | md~lg 브레이크포인트에서 Footer가 탭바에 가려짐 | Low |
| 4 | `News.sentiment` | 필드 존재하나 값 미수집 | Low |
| 5 | `StockQuote.preMarketPrice/postMarketPrice` | 필드 존재하나 수집 미구현 | Low |
| 6 | `CLAUDE.md` | DailyPrice "21일" 기재가 outdated (실제 365일) | Info |

---

## 전체 변경 파일 요약

### Phase 1 (수정 8파일 + 신규 2파일)

**수정:**
1. `src/app/compare/page.tsx` — API 경로 수정
2. `src/app/api/cron/collect-kr-quotes/route.ts` — PBR 제거, 52주 고저 fallback
3. `src/app/api/stocks/[ticker]/route.ts` — 개별 52주 스크래핑 제거
4. `src/app/api/cron/collect-fundamentals/route.ts` — 배치 확대, 우선순위
5. `.github/workflows/cron-fundamentals.yml` — 주3회 스케줄
6. `src/app/api/cron/cleanup/route.ts` — 3년 보존
7. `src/components/layout/app-header.tsx` — 메가메뉴 + Sheet 그룹핑
8. `src/components/layout/bottom-tab-bar.tsx` — 5탭

**신규:**
1. `src/components/layout/nav-menu.tsx` — 메가메뉴 컴포넌트
2. `src/components/ui/quick-links.tsx` — 퀵 링크 카드

### Phase 2 (수정 5파일 + 신규 8파일)

**수정:**
1. `prisma/schema.prisma` — PortfolioEntry 모델
2. `src/proxy.ts` — 포트폴리오 보호 경로
3. `src/components/market/stock-row.tsx` — showWatchlist prop
4. `src/components/layout/app-header.tsx` — 포트폴리오 링크
5. `src/app/mypage/page.tsx` — 포트폴리오 미리보기

**신규:**
1. `prisma/migrations/xxx/migration.sql`
2. `src/app/portfolio/page.tsx`
3. `src/app/api/portfolio/route.ts`
4. `src/app/api/portfolio/[id]/route.ts`
5. `src/components/portfolio/portfolio-row.tsx`
6. `src/components/portfolio/portfolio-summary.tsx`
7. `src/components/portfolio/add-entry-sheet.tsx`
8. `src/hooks/use-watchlist.ts`
