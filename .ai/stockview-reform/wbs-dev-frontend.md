# WBS: Phase 1 프론트엔드 개발

> 작성일: 2026-03-26 | 작성자: dev-frontend
> 브랜치: `feature/phase1-frontend` (main 기반)
> 총 예상 시간: ~7시간 30분

---

## 의존 관계 요약

### 백엔드 의존 없음 (즉시 시작 가능)
- T1: BottomTabBar 5탭 전환 (이미 완료 확인 — 검증만 필요)
- T2: Sheet 메뉴 그룹핑
- T3: 2단 네비게이션 구현
- T4: 광고 위치 이동
- T5: 차트 컨트롤 기본/고급 분리
- T6: 퀵 링크 카드 컴포넌트
- T8: 브랜드 컬러 적용

### 기획서 확정 대기
- T7: 홈 히어로 섹션 — UX 기획자(planner-ux)의 히어로 카피/CTA 문구 확정 필요
- T8: 브랜드 컬러 적용 — PM의 최종 컬러 선정 필요 (Indigo vs 보라 vs 초록)

### 백엔드 의존
- 없음. Phase 1 프론트엔드 작업은 모두 UI 레이어 변경이며 API 변경 불필요.

### 병렬 작업 가능 구간
```
[즉시 시작] T1 검증 → T2 Sheet → T4 광고 이동 (연속, ~40분)
[즉시 시작] T5 차트 컨트롤 (독립, ~60분)
[T2 완료 후] T3 2단 네비게이션 (T2의 navGroups 구조 재사용, ~120분)
[독립]      T6 퀵 링크 카드 (~45분)
[기획 확정 후] T7 히어로 섹션 (~90분)
[모든 작업 완료 후] T8 브랜드 컬러 (최종 QA 포함, ~90분)
```

---

## T1: BottomTabBar 5탭 전환

**상태: 이미 구현 완료 — 검증만 필요**

코드 확인 결과 `bottom-tab-bar.tsx`에 5탭(홈/투자/분석/뉴스/MY)이 이미 구현되어 있고, `safe-area-inset-bottom`도 적용 완료.

### T1.1 기존 구현 검증 (10분)
- **수정 대상 파일**: 없음 (검증만)
- **선행 조건**: 없음
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **테스트/검증 방법**:
  - `npm run dev`로 로컬 서버 기동
  - 모바일 뷰포트(375px)에서 5개 탭 렌더링 확인
  - 각 탭 클릭 시 올바른 페이지 이동 확인
  - 활성 상태 로직: `/market` → 투자 탭, `/screener` → 분석 탭, `/news` → 뉴스 탭
  - `/stock/[ticker]` 진입 시 어떤 탭도 활성화되지 않는지 확인
  - `lg:` 브레이크포인트(1024px) 이상에서 탭바 숨김 확인
- **완료 기준**: 5탭 동작 정상, 활성 상태 정확, safe-area 적용됨

---

## T2: Sheet 메뉴 그룹핑 (~35분)

### T2.1 navGroups 데이터 구조 정의 (10분)
- **수정 대상 파일**: `src/components/layout/app-header.tsx`
- **선행 조건**: 없음
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음 (기획서의 카테고리 분류 확정됨)
- **작업 내용**:
  - 기존 `navLinks` 배열(23~32행, 8개 플랫 링크)을 `navGroups` 그룹 구조로 변환
  - 그룹 구성:
    ```
    투자 정보: 시장, ETF, 섹터, 배당 캘린더, 실적 캘린더
    분석 도구: 스크리너, AI 리포트, 종목 비교, 투자 가이드
    뉴스/커뮤니티: 뉴스, 게시판
    MY: 관심종목, 포트폴리오, 설정
    ```
  - 기존 `navLinks`도 유지 (데스크톱 1단 네비게이션에서 사용)
- **테스트/검증 방법**: TypeScript 타입 체크 통과
- **완료 기준**: `navGroups` 타입 정의 및 데이터 작성 완료

### T2.2 Sheet 내부 그룹핑 UI 적용 (15분)
- **수정 대상 파일**: `src/components/layout/app-header.tsx` (118~144행 Sheet 영역)
- **선행 조건**: T2.1
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - Sheet 내부의 `navLinks.map()` → `navGroups.map()` 변환
  - 각 그룹에 섹션 헤더 추가: `text-xs font-semibold text-muted-foreground uppercase tracking-wider`
  - 그룹 간 `<Separator />` 컴포넌트 삽입 (이미 설치됨)
  - 숨겨진 페이지 추가: `/sectors`, `/dividends`, `/earnings`, `/compare`, `/guide`, `/portfolio`, `/settings`
  - 각 Link에 `onClick={() => setSheetOpen(false)}` 유지
- **테스트/검증 방법**:
  - 모바일에서 햄버거 메뉴 열기
  - 4개 그룹이 섹션 헤더와 구분선으로 분리되는지 확인
  - 모든 링크 클릭 시 Sheet 닫힘 + 올바른 페이지 이동
  - Sheet 너비(w-72, 288px)에서 레이아웃 깨지지 않는지 확인
- **완료 기준**: 4개 그룹 노출, 기존에 숨겨진 7개 페이지 접근 가능

### T2.3 usePathname 기반 Sheet 자동 닫기 (10분)
- **수정 대상 파일**: `src/components/layout/app-header.tsx`
- **선행 조건**: T2.2
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - `useEffect(() => { setSheetOpen(false) }, [pathname])` 추가
  - 각 Link의 `onClick={() => setSheetOpen(false)}` 제거 (useEffect로 대체)
  - 이점: 향후 Link 추가 시 onClick 누락 방지
- **테스트/검증 방법**:
  - Sheet 열린 상태에서 링크 클릭 → Sheet 자동 닫힘 확인
  - 뒤로가기(popstate) 시에도 Sheet 닫힘 확인
- **완료 기준**: pathname 변경 시 Sheet 자동 닫힘

---

## T3: 2단 네비게이션 구현 (~120분)

### T3.1 1단 카테고리 바 구현 (30분)
- **수정 대상 파일**: `src/components/layout/app-header.tsx`
- **선행 조건**: T2.1 (navGroups 구조 재사용)
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음 (2단 네비게이션 방안 채택 확정 가정)
- **작업 내용**:
  - 기존 데스크톱 네비게이션 `<nav>` 영역(50행 부근)을 카테고리 링크로 변경
  - 1단: 홈 / 투자 정보 / 분석 도구 / 뉴스 / 더보기 (5개 카테고리)
  - `hidden lg:flex` 유지 (모바일에서는 BottomTabBar + Sheet 사용)
  - 활성 카테고리 판별: `pathname` prefix 기반 매칭
    - 투자 정보: `/market`, `/etf`, `/sectors`, `/dividends`, `/earnings`
    - 분석 도구: `/screener`, `/reports`, `/compare`, `/guide`
    - 뉴스: `/news`, `/board`
    - 더보기: `/mypage`, `/watchlist`, `/settings`, `/portfolio`, `/about`, `/contact`
  - 활성 스타일: `text-primary font-medium` + 하단 2px 인디케이터
- **테스트/검증 방법**:
  - 1024px 이상에서 1단 카테고리 바 표시 확인
  - 각 카테고리 클릭 시 해당 그룹 첫 번째 페이지로 이동
  - 활성 카테고리 하이라이트 정확성 확인
- **완료 기준**: 5개 카테고리 렌더링, 활성 상태 정확

### T3.2 2단 서브메뉴 구현 (40분)
- **수정 대상 파일**: `src/components/layout/app-header.tsx`
- **선행 조건**: T3.1
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - 1단 아래에 조건부 2단 서브메뉴 바 렌더링
  - 현재 활성 카테고리의 하위 링크를 가로 나열
  - 2단 높이: `h-10` (40px), 배경: `bg-muted/30`, 하단 border
  - 서브링크 스타일: `text-sm text-muted-foreground hover:text-foreground`
  - 활성 서브링크: `text-primary font-medium`
  - "홈" 카테고리에서는 2단 미표시 (서브메뉴 불필요)
  - 구현 구조:
    ```tsx
    {activeCategory && activeCategory.links.length > 0 && (
      <div className="hidden lg:block border-b bg-muted/30">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 flex items-center h-10 gap-4">
          {activeCategory.links.map(link => (...))}
        </div>
      </div>
    )}
    ```
- **테스트/검증 방법**:
  - `/market` 접속 → 2단에 "시장, ETF, 섹터, 배당, 실적" 표시 확인
  - `/screener` 접속 → 2단에 "스크리너, AI 리포트, 비교, 가이드" 표시 확인
  - `/` (홈) 접속 → 2단 미표시 확인
  - 서브링크 클릭 시 올바른 이동 + 활성 상태 변경
- **완료 기준**: 카테고리별 서브메뉴 정확히 표시, URL 기반 활성 상태 동작

### T3.3 반응형 처리 및 엣지케이스 (30분)
- **수정 대상 파일**: `src/components/layout/app-header.tsx`
- **선행 조건**: T3.2
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - 1024px~1280px 구간에서 5개 카테고리 + 검색 + 테마 + 로그인이 1줄에 들어가는지 확인
  - 필요시 카테고리 텍스트를 축약하거나 `xl:` 이상에서만 전체 표시
  - 2단 서브메뉴가 많은 경우(투자 정보 5개) 가로 스크롤 또는 줄바꿈 처리
  - `overflow-x-auto` + `scrollbar-hide` 적용 검토
  - `/stock/[ticker]` 접속 시 어떤 카테고리도 활성화하지 않거나, 가장 최근 방문 카테고리 유지
- **테스트/검증 방법**:
  - Chrome DevTools 반응형 모드에서 1024px, 1280px, 1440px 확인
  - 모든 카테고리/서브링크가 잘림 없이 표시되는지 확인
  - 998px 이하에서 카테고리 바 완전 숨김 (모바일 모드)
- **완료 기준**: 모든 데스크톱 브레이크포인트에서 레이아웃 정상

### T3.4 콘텐츠 영역 높이 조정 (20분)
- **수정 대상 파일**: `src/components/layout/page-container.tsx` (또는 관련 레이아웃)
- **선행 조건**: T3.2
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - 2단 네비게이션 추가로 헤더 높이가 56px → 96px로 증가 (홈 제외)
  - `main` 콘텐츠 영역의 `pt-` 또는 `mt-` 조정
  - sticky 헤더 높이 변경에 따른 스크롤 오프셋 조정
  - BottomTabBar와의 간격도 재확인
- **테스트/검증 방법**:
  - 콘텐츠가 헤더에 가려지지 않는지 확인
  - 스크롤 시 sticky 헤더가 올바르게 고정되는지 확인
  - 앵커 링크(#) 이동 시 헤더에 가려지지 않는지 확인
- **완료 기준**: 모든 페이지에서 콘텐츠 시작점이 헤더 아래에 위치

---

## T4: 광고 위치 이동 (~5분)

### T4.1 AdSlot 위치 변경 (5분)
- **수정 대상 파일**: `src/app/stock/[ticker]/page.tsx` (219행)
- **선행 조건**: 없음
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - 현재 구조: `<StockTabs /> → <AdSlot /> → <AdDisclaimer />`
  - AdSlot이 이미 StockTabs 아래에 위치함 — 기획서 요구사항과 일치
  - **확인 결과: 변경 불필요**. 현재 배치가 이미 "탭 콘텐츠 하단"임
  - 만약 StockTabs 내부로 이동 요청 시에는 StockTabs에 `adSlot` prop 추가 필요
- **테스트/검증 방법**: 종목 상세 페이지에서 광고 위치 시각 확인
- **완료 기준**: 광고가 탭 콘텐츠 아래에 표시됨 (현재 상태 유지)

---

## T5: 차트 컨트롤 기본/고급 분리 (~60분)

### T5.1 기본/고급 모드 상태 추가 (15분)
- **수정 대상 파일**: `src/components/stock/chart-controls.tsx`
- **선행 조건**: 없음
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - `advancedMode` state 추가 (기본값: `false`)
  - localStorage에서 초기값 복원: `localStorage.getItem("sv_chart_advanced") === "true"`
  - 토글 시 localStorage 저장
  - `ChartControlsProps`에 외부에서 제어 필요 없음 — 내부 state로 충분
- **테스트/검증 방법**: advancedMode 토글 후 페이지 새로고침 → 상태 유지 확인
- **완료 기준**: localStorage 기반 상태 유지 동작

### T5.2 기본 모드 UI 구현 (20분)
- **수정 대상 파일**: `src/components/stock/chart-controls.tsx`
- **선행 조건**: T5.1
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - 기본 모드: 기간 7개 버튼만 표시 (현재 1행 그대로)
  - 오버레이(SMA/EMA/BB/KC/Pivot/Fib/SAR/패턴/HA) 숨김
  - 서브 패널(MACD/RSI/Stoch/OBV/ATR/ROC/MFI/A-D/ADX) 숨김
  - 기간 버튼 아래에 "지표 더보기 ▼" 토글 버튼 추가
  - 토글 버튼 스타일: `text-xs text-muted-foreground hover:text-foreground`
  - `{advancedMode && (<> ...오버레이... ...패널... </>)}` 로 감싸기
- **테스트/검증 방법**:
  - 기본 모드: 기간 버튼 + "지표 더보기" 버튼만 표시
  - "지표 더보기" 클릭 → 오버레이 + 패널 전체 노출
  - 고급 모드: "간단히 ▲" 버튼 표시 → 클릭 시 기본 모드로 복귀
- **완료 기준**: 기본/고급 토글 동작, 기존 지표 기능 정상 유지

### T5.3 고급 모드 전환 시 지표 상태 보존 (15분)
- **수정 대상 파일**: `src/components/stock/chart-controls.tsx`
- **선행 조건**: T5.2
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - 고급 → 기본 전환 시 선택된 오버레이/패널 상태 유지 (숨기기만 할 뿐 해제하지 않음)
  - 차트 자체는 선택된 지표를 계속 표시 (advancedMode는 컨트롤 UI만 접기)
  - 또는 기본 모드 전환 시 모든 오버레이/패널 해제 → 사용자 경험 관점에서 결정 필요
  - **권장**: 상태 유지 (컨트롤만 접기). 고급 → 기본 시 이미 차트에 그려진 지표 유지
- **테스트/검증 방법**:
  - RSI + BB 활성 → 기본 모드 전환 → 차트에 RSI/BB 계속 표시 확인
  - 다시 고급 모드 → RSI/BB 토글 버튼이 활성 상태 유지 확인
- **완료 기준**: 모드 전환 시 차트 지표 상태 일관성 유지

### T5.4 반응형 확인 (10분)
- **수정 대상 파일**: 없음 (검증만)
- **선행 조건**: T5.3
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **테스트/검증 방법**:
  - 모바일(375px): 기본 모드에서 기간 7개가 1줄에 들어가는지 확인
  - 고급 모드에서 오버레이/패널이 `flex-wrap`으로 올바르게 줄바꿈되는지 확인
  - "지표 더보기" 버튼이 기간 버튼 우측 또는 아래에 적절히 배치되는지 확인
- **완료 기준**: 모바일/데스크톱 모두 레이아웃 정상

---

## T6: 퀵 링크 카드 컴포넌트 (~45분)

### T6.1 QuickLinkCard 컴포넌트 생성 (15분)
- **수정 대상 파일**: `src/components/ui/quick-link-card.tsx` (신규)
- **선행 조건**: 없음
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - Props: `href: string`, `icon: LucideIcon`, `label: string`, `description?: string`
  - 스타일: `border rounded-lg p-4 hover:shadow-md transition-shadow`
  - 내부: 아이콘(h-6 w-6) + 라벨(font-medium) + 설명(text-sm text-muted-foreground)
  - `Link` 컴포넌트로 감싸기 (next/link)
  - 기존 Card 디자인 언어와 일관성 유지
- **테스트/검증 방법**: Storybook 없으므로 홈페이지에서 직접 시각 확인
- **완료 기준**: 컴포넌트 독립 렌더링 가능

### T6.2 홈페이지 적용 (15분)
- **수정 대상 파일**: `src/app/page.tsx`
- **선행 조건**: T6.1
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - 인기 종목 섹션 위에 퀵 링크 그리드 추가
  - 레이아웃: `grid grid-cols-2 md:grid-cols-4 gap-3`
  - 카드 4개: 스크리너, AI 리포트, 종목 비교, 투자 가이드
  - 아이콘: `BarChart3`, `FileText`, `GitCompare`, `BookOpen` (lucide-react)
- **테스트/검증 방법**:
  - 홈페이지에서 4개 카드 렌더링 확인
  - 각 카드 클릭 시 올바른 페이지 이동
  - 모바일 2x2 / 데스크톱 1x4 레이아웃 확인
- **완료 기준**: 홈페이지에 퀵 링크 4개 노출

### T6.3 스크리너/시장 페이지 적용 (15분)
- **수정 대상 파일**: `src/app/screener/page.tsx`, `src/app/market/page.tsx`
- **선행 조건**: T6.1
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - 각 페이지 상단 또는 하단에 관련 퀵 링크 카드 2~3개 추가
  - 스크리너: AI 리포트, 종목 비교, 투자 가이드
  - 시장: ETF, 섹터별 종목, 배당 캘린더
- **테스트/검증 방법**: 각 페이지에서 퀵 링크 표시 + 이동 확인
- **완료 기준**: 3개 페이지에 퀵 링크 적용 완료

---

## T7: 홈 히어로 섹션 (~90분)

### T7.1 HeroSection Client 컴포넌트 생성 (30분)
- **수정 대상 파일**: `src/components/home/hero-section.tsx` (신규)
- **선행 조건**: 없음
- **백엔드 의존성**: 없음
- **기획서 의존성**: **있음** — planner-ux의 히어로 카피/CTA 문구 확정 필요 (임시 텍스트로 먼저 구현)
- **작업 내용**:
  - `"use client"` Client Component
  - 첫 방문자 감지: `localStorage.getItem("sv_visited")` (useEffect에서 체크)
  - 로그인 감지: `useSession()`
  - 조건: 미방문 && 미로그인 → 히어로 표시
  - 닫기 버튼: localStorage에 `sv_visited = "true"` 저장
  - CLS 방지: 컨테이너에 고정 높이 `min-h-[200px]` 설정
  - 내부 구조:
    - 타이틀: "한국/미국 주식 정보를 한눈에"
    - 설명: 1~2줄 서비스 소개
    - CTA 버튼: "시작하기" → `/auth/register`, "둘러보기" → 히어로 닫기
  - 스타일: `bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6`
- **테스트/검증 방법**:
  - localStorage 초기화 + 로그아웃 → 히어로 표시 확인
  - "둘러보기" 클릭 → 히어로 숨김 + localStorage 설정 확인
  - 새로고침 → 히어로 미표시 확인
  - 로그인 상태 → 히어로 미표시 확인
- **완료 기준**: 조건부 히어로 표시/숨김 동작

### T7.2 지수+환율 컴팩트 바 (40분)
- **수정 대상 파일**: `src/components/home/compact-index-bar.tsx` (신규), `src/app/page.tsx`
- **선행 조건**: 없음
- **백엔드 의존성**: 없음 (기존 API 재사용)
- **기획서 의존성**: 없음
- **작업 내용**:
  - 기존 IndexCard 4개 + 환율 5개를 1~2줄 컴팩트 바로 압축
  - 모바일: 가로 스크롤 `flex overflow-x-auto scrollbar-hide gap-4`
  - 데스크톱: `flex items-center justify-between` 1줄 인라인
  - 각 항목: "KOSPI 2,650 +0.5%" 형태 (라벨 + 가격 + 변동률)
  - 환율: USD/KRW만 기본 표시, 나머지는 "더보기" 토글
  - 변동률 색상: `text-stock-up` / `text-stock-down` 유지
  - 기존 `IndexGroups` + 환율 `IndexCard` 그리드를 이 컴포넌트로 교체
- **테스트/검증 방법**:
  - 홈페이지에서 컴팩트 바 렌더링 확인
  - 모바일에서 가로 스크롤 동작 확인
  - 데스크톱에서 1줄 표시 확인
  - 등락률 색상 정확성 확인
- **완료 기준**: 기존 지수/환율 정보가 컴팩트하게 1~2줄로 표시

### T7.3 홈페이지 레이아웃 통합 (20분)
- **수정 대상 파일**: `src/app/page.tsx`
- **선행 조건**: T7.1, T7.2
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - 페이지 구조 재배치:
    1. HeroSection (조건부)
    2. CompactIndexBar (지수+환율)
    3. QuickLinkCards (T6에서 생성)
    4. PopularStocksTabs + LatestNewsSection (기존)
    5. AdSlot (기존)
  - 기존 IndexGroups, 환율 IndexCard 그리드 제거
  - ISR `revalidate = 900` 유지 (HeroSection은 Client Component이므로 ISR에 영향 없음)
- **테스트/검증 방법**:
  - 홈페이지 전체 레이아웃 시각 확인
  - ISR 캐시 동작 확인 (Server Component 부분)
  - CLS 없이 히어로 표시/숨김 전환 확인
- **완료 기준**: 홈페이지 개편 레이아웃 완성

---

## T8: 브랜드 컬러 적용 (~90분)

### T8.1 CSS 변수 변경 (15분)
- **수정 대상 파일**: `src/app/globals.css` (67~68행 light, 108~109행 dark)
- **선행 조건**: T1~T7 완료 (모든 UI 변경 후 최종 적용)
- **백엔드 의존성**: 없음
- **기획서 의존성**: **있음** — PM의 최종 브랜드 컬러 선정 필요
- **작업 내용**:
  - Light mode `--primary` 변경: `oklch(0.205 0 0)` → PM 선택 컬러
  - Dark mode `--primary` 변경: `oklch(0.922 0 0)` → PM 선택 컬러
  - `--primary-foreground` 대비율 확인 (WCAG AA 4.5:1 이상)
  - **stock-down 충돌 검토**: 파랑(Indigo) 선택 시 `--color-stock-down: #3182ce`와 근접 → stock-down 색상을 `#1e40af` (더 진한 네이비)로 변경 검토
  - 후보 컬러:
    - Indigo: Light `oklch(0.45 0.15 260)`, Dark `oklch(0.75 0.12 260)` — stock-down과 충돌 주의
    - Purple: Light `oklch(0.50 0.15 300)`, Dark `oklch(0.78 0.10 300)` — 충돌 없음
    - Teal: Light `oklch(0.55 0.12 180)`, Dark `oklch(0.78 0.08 180)` — 충돌 없음
- **테스트/검증 방법**: CSS 변수 변경 후 전체 색상 톤 확인
- **완료 기준**: `--primary` 관련 CSS 변수 4~6줄 변경 완료

### T8.2 영향 범위 시각 검증 — QA (60분)
- **수정 대상 파일**: 없음 (검증만, 필요시 미세 조정)
- **선행 조건**: T8.1
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **검증 대상 페이지 (전수 검사)**:
  - [ ] 홈페이지 (`/`)
  - [ ] 시장 (`/market`)
  - [ ] ETF (`/etf`)
  - [ ] 스크리너 (`/screener`)
  - [ ] AI 리포트 목록 (`/reports`)
  - [ ] AI 리포트 상세 (`/reports/[slug]`)
  - [ ] 뉴스 (`/news`)
  - [ ] 종목 상세 (`/stock/[ticker]`) — **가장 중요: stock-up/down 색상과 primary 구분**
  - [ ] 로그인/회원가입 (`/auth/login`, `/auth/register`)
  - [ ] 관심종목 (`/watchlist`)
  - [ ] 설정 (`/settings`)
  - [ ] 게시판 (`/board`)
  - [ ] 종목 비교 (`/compare`)
- **검증 항목**:
  - `text-primary`: 링크, 탭 활성 텍스트 가독성
  - `bg-primary`: CTA 버튼 배경 대비율
  - `border-primary/50`: 차트 컨트롤 토글 테두리 식별성
  - Dark mode 전환 시 모든 요소 가독성
  - stock-up(빨강) / stock-down(파랑)과 primary 색상의 시각적 구분
- **완료 기준**: 13개 이상 페이지에서 Light/Dark 모두 시각 이상 없음

### T8.3 stock-down 색상 충돌 대응 (15분, 조건부)
- **수정 대상 파일**: `src/app/globals.css` (12~13행, 99~100행)
- **선행 조건**: T8.2에서 충돌 확인된 경우에만
- **백엔드 의존성**: 없음
- **기획서 의존성**: 없음
- **작업 내용**:
  - Indigo 브랜드 채택 시에만 실행
  - `--color-stock-down`: `#3182ce` → `#1e40af` (진한 네이비)
  - `--color-stock-down-bg`: `#ebf8ff` → `#dbeafe` (연한 네이비 배경)
  - Dark mode도 동일하게 조정
- **테스트/검증 방법**: 종목 상세에서 하락 종목의 가격 색상 확인
- **완료 기준**: primary 색상과 stock-down 색상이 명확히 구분됨

---

## 전체 일정 요약

| 태스크 | 예상 시간 | 선행 조건 | 백엔드 의존 | 기획 의존 |
|--------|----------|----------|-----------|----------|
| T1 BottomTabBar 검증 | 10분 | - | 없음 | 없음 |
| T2 Sheet 그룹핑 | 35분 | - | 없음 | 없음 |
| T3 2단 네비게이션 | 120분 | T2.1 | 없음 | 없음 |
| T4 광고 위치 확인 | 5분 | - | 없음 | 없음 |
| T5 차트 컨트롤 분리 | 60분 | - | 없음 | 없음 |
| T6 퀵 링크 카드 | 45분 | - | 없음 | 없음 |
| T7 히어로 섹션 | 90분 | - | 없음 | 카피 확정 |
| T8 브랜드 컬러 | 90분 | T1~T7 | 없음 | 컬러 확정 |
| **합계** | **~7시간 30분** | | | |

### 권장 실행 순서 (크리티컬 패스)

```
Phase A (병렬, ~1시간):
  ├─ T1 검증 (10분) → T2 Sheet (35분) → T4 확인 (5분)
  └─ T5 차트 컨트롤 (60분)

Phase B (Phase A 완료 후, ~2시간):
  ├─ T3 2단 네비게이션 (120분) — T2의 navGroups 재사용
  └─ T6 퀵 링크 카드 (45분) — 독립 작업, 병렬 가능

Phase C (기획 확정 후, ~1.5시간):
  └─ T7 히어로 섹션 (90분)

Phase D (모든 작업 후, ~1.5시간):
  └─ T8 브랜드 컬러 (90분) — 최종 QA 포함
```

### 수정 대상 파일 전체 목록

| 파일 | 관련 태스크 | 변경 유형 |
|------|-----------|----------|
| `src/components/layout/app-header.tsx` | T2, T3 | 대규모 수정 |
| `src/components/stock/chart-controls.tsx` | T5 | 중규모 수정 |
| `src/app/page.tsx` | T6, T7 | 중규모 수정 |
| `src/app/globals.css` | T8 | 소규모 수정 (4~6줄) |
| `src/components/ui/quick-link-card.tsx` | T6 | **신규 생성** |
| `src/components/home/hero-section.tsx` | T7 | **신규 생성** |
| `src/components/home/compact-index-bar.tsx` | T7 | **신규 생성** |
| `src/app/screener/page.tsx` | T6 | 소규모 수정 |
| `src/app/market/page.tsx` | T6 | 소규모 수정 |
| `src/components/layout/page-container.tsx` | T3 | 소규모 수정 (조건부) |
| `src/app/stock/[ticker]/page.tsx` | T4 | 변경 없음 (확인만) |
| `src/components/layout/bottom-tab-bar.tsx` | T1 | 변경 없음 (검증만) |
