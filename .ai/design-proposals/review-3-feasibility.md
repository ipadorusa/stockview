# 실행 가능성 리뷰

> **리뷰어**: 실행 가능성 리뷰어
> **날짜**: 2026-03-30
> **대상 문서**: implementation-plan.md, unified-page-layouts.md

---

## 실행 가능성 이슈 (심각도: 높음)

### 1. 섹터 히트맵 데이터 부재 — API/쿼리 신규 개발 필요

- **현상**: Phase 4의 섹터 히트맵(`sector-heatmap.tsx`)은 "시가총액 비율로 CSS Grid 트리맵"을 그리려 하나, 섹터별 시가총액 합산 데이터를 반환하는 API/쿼리가 없음
- **근거**: `src/lib/queries.ts`에 `getMarketIndices`, `getPopularStocks`, `getMarketMovers`만 존재. 섹터별 집계 함수 없음. Prisma 스키마에 `Sector` 모델은 있으나 (`prisma/schema.prisma:423`), 섹터별 시가총액 합산 쿼리는 미구현
- **영향**: 히트맵 컴포넌트만 만들면 빈 데이터. 쿼리 + API 라우트 구축이 선행 필요
- **해결 방안**: Phase 4 시작 전에 `getSectorHeatmapData(market)` 쿼리 추가 (Stock JOIN Sector, GROUP BY sector, SUM(marketCap))
- **계획서 수정 제안**: Phase 4에 "4-0. 섹터 히트맵 데이터 쿼리 구현" 작업 항목 추가. "변경하지 않는 것" 섹션의 "Prisma 스키마 / API 엔드포인트" 불변 원칙에 주의 — Prisma 스키마 변경은 불필요하지만 쿼리 함수는 신규 필요

### 2. 시장 너비/모멘텀 바 데이터 부재

- **현상**: Phase 4의 `market-breadth-bar.tsx`(상승/보합/하락 비율)와 `momentum-bars.tsx`(상승/하락 TOP 10)에 필요한 데이터를 반환하는 기존 쿼리가 없음
- **근거**: `getMarketMovers("KR")` (`src/lib/queries.ts:179`)는 상승/하락 TOP 5만 반환. 전체 종목의 상승/보합/하락 집계나 TOP 10 데이터 없음
- **영향**: 신규 쿼리 2개 필요 (`getMarketBreadth`, `getTopMovers(limit=10)`)
- **해결 방안**: `queries.ts`에 시장 너비 집계 쿼리와 TOP 10 모멘텀 쿼리 추가
- **계획서 수정 제안**: Phase 4에 "4-0. 데이터 레이어 준비" 하위 항목 추가 (히트맵 + 시장너비 + 모멘텀 쿼리)

### 3. 시장 심리 게이지 데이터 출처 미정

- **현상**: Phase 6의 `sentiment-gauge.tsx`는 "공포~탐욕" 게이지를 표시하나, 심리 지수를 산출할 데이터 소스와 알고리즘이 정의되지 않음
- **근거**: `src/lib/news-sentiment.ts`, `src/lib/utils/news-sentiment.ts` 등 뉴스 감성 분석은 존재하나, 이를 단일 게이지 수치(0~100)로 변환하는 로직 없음. 외부 Fear & Greed 지수 API도 미사용
- **영향**: 단순히 CSS arc를 그리는 것은 쉬우나, 신뢰할 수 있는 입력 데이터 확보가 핵심 과제. 데이터가 부정확하면 사용자 오해 유발
- **해결 방안**: (A) 기존 뉴스 감성 + 시장 너비 + 거래량 변화를 조합한 내부 지표 개발, 또는 (B) 외부 API(CNN Fear & Greed 등) 연동, 또는 (C) Phase 6에서 제외하고 향후 추가
- **계획서 수정 제안**: 심리 게이지는 별도 "선택 기능"으로 분류하고, 데이터 소스/알고리즘 설계를 선행 작업으로 명시

### 4. StockRow 수정 시 5개 파일 동시 영향

- **현상**: Phase 3에서 `StockRow`에 "거래량 바 추가", "호버 시 스파크라인 인라인 표시"를 적용하면, `StockRow`를 import하는 5개 파일 모두 영향받음
- **근거**: `StockRow` import 위치:
  - `src/components/market/popular-stocks-tabs.tsx` (홈 인기종목)
  - `src/components/market/market-filter-chips.tsx` (시장 페이지)
  - `src/app/watchlist/page.tsx` (관심종목)
  - `src/app/etf/page.tsx` (ETF)
  - `src/app/mypage/page.tsx` (마이페이지)
- **영향**: Phase 3에서 StockRow를 수정하면 시장 페이지(Phase 4 대상)와 watchlist/ETF/마이페이지(계획서 범위 밖)에도 즉시 영향. 특히 스파크라인 추가 시 모든 사용처에서 추가 데이터 fetch가 필요해짐
- **해결 방안**: (A) StockRow 변경을 Phase 3이 아닌 Phase 6(폴리시)으로 이동, 또는 (B) 스파크라인/거래량바를 optional prop으로 구현하여 기존 사용처에 영향 없게 처리
- **계획서 수정 제안**: StockRow 수정 항목에 "optional prop으로 하위 호환 유지" 명시, 영향 범위 5개 파일 목록 추가

---

## 실행 가능성 이슈 (심각도: 중간)

### 5. Phase 3/4/5 병렬 진행 시 IndexCard 수정 충돌

- **현상**: 계획서는 "Phase 3, 4, 5는 서로 독립적이므로 병렬 진행 가능"이라 하나, `IndexCard`가 홈(`page.tsx:56,186`)과 시장(`market/page.tsx:72`) 양쪽에서 사용됨
- **근거**: Phase 3(3-2)에서 IndexCard에 `.card-stat`, 미니 차트, 카운트업 애니메이션을 추가하면 Phase 4의 시장 페이지에서도 즉시 변경됨
- **영향**: Phase 3과 Phase 4를 별도 브랜치에서 병렬로 진행하면 IndexCard에서 merge conflict 발생
- **해결 방안**: IndexCard 수정을 Phase 2(공유 컴포넌트)로 승격시키거나, Phase 3→4→5 순차 진행
- **계획서 수정 제안**: Phase 2에 "2-5. 공유 컴포넌트(IndexCard, StockRow) 업그레이드" 추가, Phase 3/4/5에서는 이를 전제로 진행

### 6. globals.css 변경 시 43개 페이지 시각적 회귀 위험

- **현상**: Phase 1에서 globals.css 컬러 토큰을 일괄 교체하면 `PageContainer`를 import하는 43개 파일 전체에 영향
- **근거**: Grep 결과 `from "@/components/layout/page-container"` — 43개 파일에서 import. 또한 shadcn 변수(`--background`, `--foreground`, `--card` 등)를 참조하는 모든 shadcn/ui 컴포넌트도 영향
- **영향**: 단일 변수 오류가 전체 사이트 색상 깨짐으로 이어질 수 있음. 특히 주식 색상(빨강=상승, 파랑=하락)이 뒤바뀌면 심각한 사용자 혼란
- **해결 방안**: (A) 토큰 교체를 한 번에 하지 말고 카테고리별 점진 적용 (배경→텍스트→보더→그림자 순), (B) 주요 페이지 10개 스크린샷 before/after 비교 (수동), (C) oklch 변환 시 기존 hex와 시각적 동등성 사전 확인
- **계획서 수정 제안**: Phase 1 검증에 "주요 10페이지 스크린샷 비교" 추가, 주식 색상 교체 시 별도 확인 단계 명시

### 7. oklch 컬러 브라우저 호환성

- **현상**: 계획서는 주식 색상을 hex → oklch로 변환(`#e53e3e` → `oklch(0.55 0.22 25)`)하려 하나, oklch는 비교적 최신 CSS 기능
- **근거**: globals.css 현재 oklch 사용 0건. 모든 색상이 hex 또는 hsl 기반. oklch 전환 시 Safari 15 이하, 구형 안드로이드 WebView 미지원
- **영향**: 타겟 사용자(초보 투자자)가 구형 기기 사용 시 색상 미표시 → 상승/하락 구분 불가
- **해결 방안**: (A) oklch에 hex fallback 추가 (`color: #e53e3e; color: oklch(0.55 0.22 25)`), 또는 (B) 주식 색상은 hex 유지, 히트맵 등 신규 요소만 oklch 적용
- **계획서 수정 제안**: Phase 1에 "oklch fallback 전략" 항목 추가

### 8. 티커 테이프 데이터 Fetching 전략 미정

- **현상**: Phase 3의 `ticker-tape.tsx`는 KOSPI, KOSDAQ, S&P 500, NASDAQ, USD/KRW를 실시간 스크롤 표시하나, 데이터 갱신 전략이 없음
- **근거**: 홈페이지(`src/app/page.tsx`)는 서버 컴포넌트로 `revalidate = 900` (15분 ISR). 티커 테이프가 Server Component면 15분마다 갱신, Client Component면 별도 polling API 필요
- **영향**: "실시간" 느낌을 주려면 client-side polling이 필요하지만, 이는 API 라우트 추가를 의미. 서버 컴포넌트면 정적 데이터에 무한 스크롤 애니메이션만 붙는 형태
- **해결 방안**: ISR 15분 데이터를 그대로 사용하되, "마지막 업데이트 시간"을 명시하여 사용자 혼란 방지
- **계획서 수정 제안**: 3-1에 "데이터 소스: 홈페이지 SSR 시 getMarketIndices()/getExchangeRate() 재사용, client polling 미구현" 명시

### 9. 종목 상세 페이지 레이아웃 변경 복잡도 과소평가

- **현상**: Phase 5에서 종목 상세를 "chart(60vh) + sidebar(320px)" CSS Grid로 변경하려 하나, 현재 구조가 `StockTabs` 기반 탭 레이아웃으로 깊이 중첩됨
- **근거**: `src/app/stock/[ticker]/page.tsx`에서 `StockTabs`에 6개 Suspense slot을 전달하는 복잡한 구조. 차트를 탭 밖으로 꺼내고 사이드바를 추가하려면 `StockTabs` 컴포넌트 자체의 대대적 리팩토링 필요
- **영향**: 단순 CSS 변경이 아니라 컴포넌트 구조 변경. `StockTabs`의 slot 패턴, HydrationBoundary, Suspense 경계를 모두 재설계해야 함
- **해결 방안**: StockTabs를 "차트 영역"과 "정보 탭 영역"으로 분리하는 리팩토링을 Phase 5 첫 작업으로 명시
- **계획서 수정 제안**: Phase 5 난이도를 "중간"에서 "높음"으로 상향. "5-0. StockTabs 구조 리팩토링" 작업 추가

---

## 실행 가능성 이슈 (심각도: 낮음)

### 10. 누락된 페이지 — 나머지 30+개 페이지의 디자인 일관성

- **현상**: 계획서는 홈/시장/종목상세 3개 페이지만 다루고, 나머지 36개 page.tsx는 언급 없음
- **근거**: 전체 39개 page.tsx 중 계획 범위: 3개. 범위 밖: watchlist, news, sectors, screener, reports, compare, guide, dividends, earnings, etf, board, settings, mypage, auth, admin, about, contact, privacy, terms 등
- **영향**: Phase 1(globals.css)과 Phase 2(헤더/푸터)로 전역 스타일이 바뀌면 나머지 페이지도 외관이 변경됨. 의도치 않은 시각적 불일치 가능
- **해결 방안**: 나머지 페이지는 Phase 1-2 완료 후 자동으로 새 토큰 적용되므로 별도 작업 불필요하지만, "확인만 필요한 페이지 목록"을 체크리스트에 추가
- **계획서 수정 제안**: 검증 체크리스트에 "범위 밖 주요 페이지(watchlist, news, screener, reports) 시각적 확인" 추가

### 11. 헤더 시장 상태 뱃지 — 데이터 소스 미결정

- **현상**: Phase 2에서 헤더에 "🟢 장중 / 🔴 장마감 / 🟡 프리마켓" 뱃지를 추가하려 하나, 시장 상태를 판별하는 로직이 현재 없음
- **근거**: `app-header.tsx`는 순수 UI 컴포넌트(`"use client"`). 시장 시간 판별 로직은 `popular-stocks-tabs.tsx`에 `formatTradingDate()`로 있으나 이는 날짜 포맷팅용이고 실시간 상태 API는 없음
- **영향**: 시장 시간 기반 시계 계산(KST 09:00-15:30, EST 09:30-16:00)으로 대략적 판별은 가능하지만, 휴장일/반일장 등 예외 처리 필요
- **해결 방안**: 클라이언트 사이드에서 현재 시각 기반 간이 판별 (`isMarketOpen(market)` 유틸) 구현. 휴장일은 무시하고 평일+시간대만 체크하는 v1부터 시작
- **계획서 수정 제안**: 2-1에 "시장 상태 판별 유틸 함수 구현" 하위 작업 추가

### 12. page-container.tsx 신규 파일 vs 기존 파일

- **현상**: Phase 2에서 `page-container.tsx`에 배경/애니메이션을 적용하려 하나, 이 컴포넌트를 43개 페이지에서 import 중
- **근거**: `PageContainer`는 현재 단순 wrapper로 추정. 여기에 `.page-content` 애니메이션을 추가하면 전 페이지에 진입 애니메이션이 적용됨
- **영향**: `prefers-reduced-motion` 미대응 시 접근성 문제. 다만 계획서에 이미 Phase 6에서 `prefers-reduced-motion` 대응이 포함되어 있으므로 Phase 2~5 사이에는 접근성 미준수 기간 발생
- **해결 방안**: `PageContainer` 애니메이션 추가 시 처음부터 `prefers-reduced-motion` 미디어 쿼리 적용
- **계획서 수정 제안**: Phase 2-3에 `@media (prefers-reduced-motion: reduce)` 즉시 적용 명시 (Phase 6까지 미루지 말 것)

---

## 종합 평가

### 실행 가능 여부: **조건부 가능**

계획서의 전체 구조와 Phase 분리는 합리적이나, 아래 3가지를 보완해야 실행 가능:

1. **데이터 레이어 작업 추가** (이슈 #1, #2, #3): Phase 4 시작 전에 섹터 히트맵, 시장 너비, 모멘텀 쿼리 함수를 `queries.ts`에 추가하는 "Phase 3.5: 데이터 레이어" 또는 Phase 4 앞에 데이터 준비 단계 삽입
2. **공유 컴포넌트 수정 순서 조정** (이슈 #4, #5): `IndexCard`와 `StockRow` 수정을 Phase 2로 끌어올리거나, Phase 3→4→5 순차 진행으로 변경
3. **Phase 5 복잡도 재평가** (이슈 #9): `StockTabs` 리팩토링이 사실상 컴포넌트 구조 재설계이므로 별도 하위 Phase로 분리

### 위험도 순위

| 순위 | 이슈 | 심각도 | 롤백 난이도 |
|------|------|--------|------------|
| 1 | globals.css 일괄 교체 (#6) | 중간 | git revert 가능 (낮음) |
| 2 | StockTabs 리팩토링 (#9) | 중간 | 부분 revert 어려움 (높음) |
| 3 | 섹터 히트맵 데이터 (#1) | 높음 | 작업 자체 불가 (해당없음) |
| 4 | StockRow 광범위 영향 (#4) | 높음 | git revert 가능 (낮음) |
| 5 | oklch 호환성 (#7) | 중간 | fallback 추가로 해결 (낮음) |
