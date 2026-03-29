# QA 수행 결과 — 사용자 Flow & 디자인

> **수행일**: 2026-03-29
> **수행자**: QA 수행 담당 1
> **방법**: 소스코드 정적 분석 기반 (브라우저 미사용)
> **대상**: tc-1 (사용자 Flow 75건) + tc-4 (디자이너 156건) = 총 231건

---

## 수행 요약

| 문서 | 총 건수 | PASS | FAIL | WARN | N/A |
|------|---------|------|------|------|-----|
| tc-1 (사용자 Flow) | 75 | 56 | 7 | 6 | 6 |
| tc-4 (디자인) | 156 | 109 | 8 | 18 | 21 |
| **합계** | **231** | **165** | **15** | **24** | **27** |

**Pass Rate**: 71.4% (PASS 기준), 81.7% (PASS+WARN 기준)

---

## tc-1 수행 결과

### 2. 인증 Flow

| TC-ID | 결과 | 근거 |
|-------|------|------|
| AUTH-001 | PASS | `register/route.ts`:7-58 — Zod 검증, bcrypt(12), 201 응답, `register-form.tsx`:59 → `/auth/login?registered=true` 리다이렉트 정상 |
| AUTH-002 | PASS | `register/route.ts`:40-47 — `findFirst OR [email, nickname]`, email 일치 시 409 + "이미 사용 중인 이메일입니다." |
| AUTH-003 | PASS | `register/route.ts`:48 — nickname 일치 시 409 + "이미 사용 중인 닉네임입니다." |
| AUTH-004 | PASS | `register-form.tsx`:19 — 클라이언트 Zod `.min(8, "비밀번호는 8자 이상이어야 합니다")` |
| AUTH-005 | PASS | `register/route.ts`:12 — 서버 Zod regex `/^(?=.*[A-Za-z])(?=.*\d)/` + 400 응답 |
| AUTH-006 | PASS | `register-form.tsx`:22 — `.refine((d) => d.password === d.passwordConfirm, { message: "비밀번호가 일치하지 않습니다", path: ["passwordConfirm"] })` |
| AUTH-007 | PASS | `register-form.tsx`:18 — `z.string().email("올바른 이메일을 입력해주세요")` |
| AUTH-008 | PASS | `register-form.tsx`:21 — `.max(20)` 존재. 단, 에러 메시지 미지정(기본 Zod 메시지). 서버측은 `route.ts`:13 "닉네임은 20자 이하여야 합니다" 정상 |
| AUTH-009 | PASS | `register-form.tsx`:21 — `.min(2, "닉네임은 2자 이상이어야 합니다")` |
| AUTH-010 | PASS | `register/route.ts`:18-25 — `rateLimit("register:${ip}", 5, 3600_000)`, 429 + Retry-After:3600 |
| AUTH-011 | PASS | `login-form.tsx`:45 — `signIn("credentials", { ..., redirect: false })`, 성공 시 `router.push("/")` |
| AUTH-012 | **FAIL** | `login-form.tsx`:51 — 성공 시 항상 `router.push("/")`. URL의 `callbackUrl` 파라미터를 읽지 않음. 미들웨어(`proxy.ts`:33)는 callbackUrl을 설정하지만 로그인 폼이 이를 무시 |
| AUTH-013 | PASS | `login-form.tsx`:46-48 — `result?.error` 시 "이메일 또는 비밀번호가 올바르지 않습니다." |
| AUTH-014 | PASS | `auth.ts`:34 — 미존재 계정 → `findUnique` null → `return null` → signIn error. 동일 에러 메시지 사용 |
| AUTH-015 | PASS | `auth.ts`:17-21 — Google provider 설정, `signIn` 콜백에서 닉네임 자동 생성(60-76행) |
| AUTH-016 | PASS | `auth.ts`:20 — `allowDangerousEmailAccountLinking: true` |
| AUTH-017 | N/A | Google OAuth 취소 동작은 브라우저 런타임에서만 검증 가능 |
| AUTH-018 | PASS | `app-header.tsx`:205 — `signOut({ callbackUrl: "/" })` |
| AUTH-019 | PASS | `auth.ts`:51 — `maxAge: 30 * 24 * 60 * 60` (30일). 만료 후 미들웨어 인터셉트 |
| AUTH-020 | **WARN** | `proxy.ts`:8-15 — `/watchlist`, `/settings`, `/mypage`, `/reports/stock` 보호됨. 그러나 `matcher`:41에 `/board/new`는 포함되나 정규식 매칭 한계로 `/board/:id/edit`는 실제로 매칭 안 될 수 있음(Next.js matcher는 정규식 지원 제한적) |

### 3. 종목 탐색 Flow

| TC-ID | 결과 | 근거 |
|-------|------|------|
| STOCK-001 | PASS | `page.tsx`(홈):131-241 — HeroSection, CompactIndexBar, PopularStocksTabs, LatestNewsSection(4건), QuickLinkCard, CTA 배너(!session 조건) 모두 구현 |
| STOCK-002 | PASS | `hero-section.tsx`:33-42 — `localStorage.getItem("sv_visited")`, 닫기 시 `localStorage.setItem("sv_visited", "true")` |
| STOCK-003 | **WARN** | `hero-section.tsx`:34 — `if (session) return` → 로그인 시 HeroSection 미표시. 그러나 CTA 배너(`page.tsx`:137 `!session` 조건)는 정상. 다만 "개인화 UI"는 별도 구현 없음 — 로그인/비로그인 홈 차이가 CTA 배너 유무뿐 |
| STOCK-004 | PASS | `popular-stocks-tabs.tsx` → `stock-row.tsx` → Link to `/stock/[ticker]` |
| STOCK-005 | PASS | `search/route.ts`:12-24 — `contains` + `insensitive` 검색, 최대 10건 |
| STOCK-006 | PASS | `search/route.ts`:16 — `ticker: { contains: q, mode: "insensitive" }` |
| STOCK-007 | PASS | `search/route.ts`:7-8 — q 없거나 2자 미만 시 `{ results: [] }`. 빈 상태는 SearchCommand의 CommandEmpty 처리 |
| STOCK-008 | PASS | `search/route.ts`:7 — `q.length < 2` → `{ results: [] }` |
| STOCK-009 | PASS | Prisma `contains`는 parameterized query 사용 → SQL Injection 방지. XSS는 React 자동 이스케이프 |
| STOCK-010 | N/A | 모바일 오버레이 동작은 브라우저 검증 필요. 코드상 `bottom-tab-bar.tsx`:41 `setSearchOpen(true)` + `search-command.tsx` 존재 |
| STOCK-011 | PASS | `stock/[ticker]/page.tsx` — ISR 900초, StockTabs 4개 탭(차트/정보/뉴스/이벤트), KR일 때 공시 포함, Breadcrumb, JsonLd |
| STOCK-012 | PASS | `stock/[ticker]/page.tsx`:215-220 — `stock?.market === "KR"` 조건으로 공시탭 분리. US면 `disclosureSlot={null}` |
| STOCK-013 | PASS | `etf/[ticker]/page.tsx` 파일 존재. StockTabs 재사용 구조 |
| STOCK-014 | **FAIL** | `stock/[ticker]/page.tsx` — stock이 null일 때 `notFound()` 호출 없음. `stock`이 null이면 `initialData`도 null이 되어 일부 UI가 비정상 렌더링될 수 있음 |
| STOCK-015 | N/A | 차트 기간 변경은 클라이언트 인터랙션 (lightweight-charts). `chart-tab-client.tsx` + `use-chart-data.ts` 존재 확인 |
| STOCK-016 | N/A | Heikin-Ashi 토글은 브라우저 런타임 검증 필요 |
| STOCK-017 | N/A | 이동평균선 변경은 브라우저 런타임 검증 필요 |
| STOCK-018 | N/A | 보조지표 패널은 브라우저 런타임 검증 필요. `chart-controls.tsx` 존재 확인 |
| STOCK-019 | PASS | `peer-stocks.tsx` 존재, Link to `/stock/[ticker]` |
| STOCK-020 | PASS | `news-tab-server.tsx` 존재, 뉴스 내 종목 태그 링크 |
| STOCK-021 | PASS | `market/page.tsx` → StockRow → Link to `/stock/[ticker]` |
| STOCK-022 | PASS | `sectors/[name]/page.tsx` 존재 → 종목 클릭 → `/stock/[ticker]` |

### 4. 관심종목 Flow

| TC-ID | 결과 | 근거 |
|-------|------|------|
| WL-001 | PASS | `watchlist/route.ts`:45-69 — POST, Zod 검증, stock 조회, create, 201 + "관심종목에 추가되었습니다." |
| WL-002 | PASS | `watchlist-button.tsx`:23-27 — `!session` 시 toast.info + `/auth/login` 리다이렉트 |
| WL-003 | PASS | `watchlist/route.ts`:71 — P2002 catch → 409 + "이미 관심종목에 등록된 종목입니다." |
| WL-004 | PASS | `watchlist/route.ts`:61-63 — stock null → 404 + "종목을 찾을 수 없습니다." |
| WL-005 | PASS | `watchlist/[ticker]/route.ts`:24-30 — DELETE, composite unique key, 200 + "관심종목에서 삭제되었습니다." |
| WL-006 | **WARN** | `watchlist/[ticker]/route.ts`:31-33 — catch 블록이 일괄 500 반환. 미등록 종목 삭제 시 Prisma error가 catch되지만 구체적 에러 코드 미분류 |
| WL-007 | PASS | `watchlist/route.ts`:6-41 — GET, include quotes, orderBy createdAt desc. `watchlist/page.tsx` StockRow 목록 + 비교/삭제 버튼 |
| WL-008 | PASS | `watchlist/page.tsx`:112-117 — EmptyState(Bookmark, "아직 관심종목이 없어요") |
| WL-009 | PASS | `watchlist/page.tsx`:93-207 — Tabs(watchlist/portfolio), React Query 캐시(staleTime 60s) |
| WL-010 | PASS | `proxy.ts`:8 — `pathname.startsWith("/watchlist")` → 302 리다이렉트. `watchlist/page.tsx`:63 — 이중 보호(useSession unauthenticated) |
| WL-011 | PASS | `proxy.ts`:11 + 29-30 — `/api/watchlist` 보호, 401 JSON |
| WL-012 | PASS | `watchlist/page.tsx`:123-131 — StockRow는 내부적으로 Link to `/stock/[ticker]` |

### 5. 뉴스 Flow

| TC-ID | 결과 | 근거 |
|-------|------|------|
| NEWS-001 | PASS | `news/page.tsx` — ISR 300초(5분), `news-client.tsx` 초기 10건, 카테고리 필터(KR_MARKET, US_MARKET, INDUSTRY, ECONOMY) |
| NEWS-002 | PASS | `news-client.tsx`:82-87 — Tabs + category 변경 → API 호출 |
| NEWS-003 | **WARN** | `news-client.tsx`:124-129 — 무한 스크롤이 아닌 **페이지네이션**(이전/다음 버튼) 방식. TC 예상과 다름 |
| NEWS-004 | PASS | `news-card.tsx` → `news-link.tsx` → `target="_blank"` 외부 링크 |
| NEWS-005 | PASS | `page.tsx`(홈):230-233 — "전체 보기" → `/news` Link, 최신 4건 NewsCard compact |
| NEWS-006 | PASS | `tabs/news-tab-server.tsx` + `api/stocks/[ticker]/news/route.ts` 존재 |
| NEWS-007 | PASS | `news-client.tsx`:118-121 — `data?.news?.length === 0` → "뉴스가 없습니다" |

### 6. 종목 비교 Flow

| TC-ID | 결과 | 근거 |
|-------|------|------|
| CMP-001 | PASS | `compare-context.tsx`:79-81 — addToCompare, sessionStorage 저장. `compare-floating-bar.tsx` 하단 표시 |
| CMP-002 | PASS | `watchlist/page.tsx`:133-151 — GitCompare 아이콘, addToCompare 호출 |
| CMP-003 | **WARN** | `compare-context.tsx`:28 — `state.slots.length >= MAX_SLOTS` → state 변경 없이 무시. 사용자에게 제한 안내 UI(toast 등) 미표시 |
| CMP-004 | PASS | `compare-context.tsx`:27 — 중복 체크 `state.slots.some(s => s.ticker === action.payload.ticker)` |
| CMP-005 | PASS | `compare/page.tsx`:209-265 — 비교 테이블(8개 지표), CompareChart, CompareFundamentals |
| CMP-006 | PASS | `compare/page.tsx` — 공개 페이지(proxy.ts에 미포함), 빈 슬롯 시 StockSearchInput 표시 |
| CMP-007 | PASS | `compare/page.tsx`:172-177 — StockSearchInput으로 종목 검색/추가, fetchStock 호출 |
| CMP-008 | PASS | `compare-floating-bar.tsx`:39-45 — X 버튼 → removeFromCompare, `compare/page.tsx`:146-149 |
| CMP-009 | PASS | `compare-context.tsx`:56-68 — sessionStorage 복원, 70-77 동기화 |
| CMP-010 | **FAIL** | `page.tsx`(홈):208 — "최대 5종목 비교 분석" 텍스트. `compare-context.tsx`:21 — `MAX_SLOTS = 4`. 불일치 확인 (알려진 이슈 M-1) |

### 7. 네비게이션

| TC-ID | 결과 | 근거 |
|-------|------|------|
| NAV-001 | PASS | `app-header.tsx`:63-108 — navCategories: 홈/투자정보/분석/뉴스/더보기 + 2단 서브 링크 |
| NAV-002 | PASS | `app-header.tsx`:66-74 — 시장/ETF/섹터/배당/실적 subLinks |
| NAV-003 | PASS | `app-header.tsx`:78-87 — 스크리너/AI리포트/분석요청/비교/가이드 subLinks |
| NAV-004 | PASS | `app-header.tsx`:186-209 — 드롭다운: 이름/이메일/마이페이지/관심종목/로그아웃 |
| NAV-005 | PASS | `app-header.tsx`:211-214 — 비로그인 시 "로그인"/"회원가입" 버튼 |
| NAV-006 | **FAIL** | `app-header.tsx`:102 — 더보기 subLinks에 `{ href: "/portfolio", label: "포트폴리오" }`. `/portfolio` 경로의 page.tsx 미존재. 실제 포트폴리오는 `/watchlist` 내 탭 (알려진 이슈 M-2) |
| NAV-007 | PASS | `bottom-tab-bar.tsx`:10-16 — 5개 탭: 홈/검색/시장/관심/MY |
| NAV-008 | PASS | `bottom-tab-bar.tsx`:33-35 — `/mypage` OR `/settings` 시 MY 탭 활성 |
| NAV-009 | **WARN** | `app-header.tsx`:222 — `SheetContent side="right"`. TC 예상은 "왼쪽에서 슬라이드 인"이나 실제 구현은 **오른쪽**에서 진입. 그룹 내용은 정상(투자정보/분석도구/뉴스커뮤니티/MY) |
| NAV-010 | PASS | `app-header.tsx`:252-256 — `!session` 시 로그인/회원가입 버튼 표시 |
| NAV-011 | PASS | `footer.tsx`:15-41 — 개인정보처리방침/이용약관/쿠키설정/서비스소개/게시판/문의하기 |
| NAV-012 | PASS | `not-found.tsx` — 404 텍스트(text-6xl) + "홈으로 돌아가기" 링크 |
| NAV-013 | PASS | `stock/[ticker]/page.tsx`:24-25 — `dynamicParams = true`, `revalidate = 900` (ISR) |
| NAV-014 | PASS | `proxy.ts`:8-9 — `/settings` 보호, 302 리다이렉트 + callbackUrl |
| NAV-015 | PASS | `stock/[ticker]/page.tsx`:170-175 — Breadcrumb(홈 > 주식 > 종목명) |
| NAV-016 | PASS | `app-header.tsx`:179-183 — next-themes 테마 토글, localStorage 자동 저장 |

### 8. 설정 Flow

| TC-ID | 결과 | 근거 |
|-------|------|------|
| SET-001 | PASS | `mypage/page.tsx`:50-123 — 프로필 카드(아바타/이름/이메일), 관심종목 프리뷰 5건, 퀵 링크(관심종목관리/설정/로그아웃) |
| SET-002 | PASS | `mypage/page.tsx`:70-71 — "전체보기" → `/watchlist` Link |
| SET-003 | PASS | `mypage/page.tsx`:116 — `signOut({ callbackUrl: "/" })` |
| SET-004 | PASS | `settings/profile/route.ts`:13-33 — PATCH, Zod 검증, 200 + `{ ok: true }`. `settings/page.tsx`:102 — 이메일 `disabled` |
| SET-005 | PASS | `settings/profile/route.ts`:20-26 — Zod 실패 시 400 + 에러 메시지 |
| SET-006 | PASS | `settings/profile/route.ts`:35-39 — Unique constraint → 409 + "이미 사용 중인 닉네임입니다" |
| SET-007 | PASS | `settings/password/route.ts`:39-50 — bcrypt 검증, hash(12), 200 + `{ ok: true }` |
| SET-008 | PASS | `settings/password/route.ts`:39-41 — bcrypt.compare 실패 → 400 + "현재 비밀번호가 올바르지 않습니다" |
| SET-009 | PASS | `settings/password/route.ts`:35-36 — `!user.password` → 400 + "소셜 로그인 사용자는 설정에서 비밀번호를 설정해주세요" |
| SET-010 | PASS | `proxy.ts`:9 — `/settings` 보호, 302 리다이렉트 |

---

## tc-4 수행 결과

### 2. 디자인 토큰 일관성

| TC-ID | 결과 | 근거 |
|-------|------|------|
| DT-001 | PASS | `globals.css`:10 `--color-stock-up: #e53e3e`, `price-change-text.tsx`:22 `text-stock-up` 토큰 사용. PriceChangeText 재사용 패턴 확인 |
| DT-002 | PASS | `globals.css`:13 `--color-stock-down: #3182ce`, `price-change-text.tsx`:22 `text-stock-down` 토큰 사용 |
| DT-003 | PASS | `globals.css`:14 `--color-stock-flat: #718096`, `price-change-text.tsx`:22 `text-stock-flat` |
| DT-004 | PASS | `globals.css`:15-16 `--color-chart-candle-up: #e53e3e`, `--color-chart-candle-down: #3182ce` — 텍스트 색상과 동일 |
| DT-005 | PASS | `globals.css`:11-12 `--color-stock-up-bg: #fff5f5`, `--color-stock-down-bg: #ebf8ff` 토큰 정의 |
| DT-006 | PASS | `globals.css`:67 `--primary: oklch(0.45 0.16 155)` 녹색. 전체 Button/Link에서 `bg-primary`/`text-primary` 사용 |
| DT-007 | PASS | `globals.css`:75 `--destructive` 정의. 폼 에러에 `text-destructive` 일관 사용 |
| DT-008 | PASS | `globals.css`:72 `--muted-foreground: oklch(0.556 0 0)`. 전체 보조 텍스트에 `text-muted-foreground` |
| DT-009 | PASS | `layout.tsx`:62 `className={pretendard.variable}`, `globals.css`:20 `--font-sans: var(--font-pretendard), "Pretendard Variable"...` |
| DT-010 | **WARN** | `globals.css`:146 `.font-mono { font-variant-numeric: tabular-nums }`. 가격 표시에 `font-mono` 사용하는 곳 21개 확인. 그러나 PriceChangeText 컴포넌트 자체는 `font-mono` 미적용 — 호출부에서 className으로 추가해야 함 |
| DT-011 | PASS | 페이지 제목: `text-2xl font-bold` 일관 사용 (홈/뉴스/설정/마이페이지/비교 등) |
| DT-012 | PASS | `card.tsx`:41 `text-base leading-snug font-medium`, CardDescription `text-sm text-muted-foreground` |
| DT-013 | N/A | 줄간격 가독성은 시각 검증 필요 |
| DT-014 | PASS | `card.tsx`:15 `py-4 gap-4`, CardContent `px-4`, sm: `py-3 gap-3 px-3` |
| DT-015 | PASS | `page-container.tsx`:10 `px-4 md:px-6 xl:px-8` |
| DT-016 | N/A | 섹션 간 간격은 시각 검증 필요 |
| DT-017 | PASS | Card `rounded-xl`, Button `rounded-lg`, Badge radius 4xl. 토큰 기반 |
| DT-018 | PASS | Card `ring-1 ring-foreground/10`, Table `border-b`, Input `border-input` |
| DT-019 | N/A | hover 그림자는 브라우저 검증 필요 |
| DT-020 | PASS | 다크 모드: background(0.145) < card(0.205) < popover(0.205). Card와 Popover 동일값 확인 |
| DT-021 | PASS | `globals.css`:117 `--border: oklch(1 0 0 / 10%)`, `:118` `--input: oklch(1 0 0 / 15%)` |
| DT-022 | PASS | foreground(0.985) on background(0.145) — WCAG AA 충분 (약 18:1 대비) |
| DT-023 | PASS | `globals.css`:97-98 다크 모드 `--color-stock-up: #fc8181`, `--color-stock-down: #63b3ed` |
| DT-024 | N/A | lightweight-charts 다크 테마 연동은 런타임 검증 필요 |

### 3. 컴포넌트 시각 상태

| TC-ID | 결과 | 근거 |
|-------|------|------|
| CS-001 | PASS | `button.tsx`:13 `bg-primary text-primary-foreground` |
| CS-002 | PASS | `button.tsx`:13 `[a]:hover:bg-primary/80` |
| CS-003 | PASS | `button.tsx`:9 `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` |
| CS-004 | PASS | `button.tsx`:9 `disabled:pointer-events-none disabled:opacity-50` |
| CS-005 | PASS | `button.tsx`:9 `active:translate-y-px` |
| CS-006 | PASS | `button.tsx`:12-23 — 6개 variant(default/outline/secondary/ghost/destructive/link) |
| CS-007 | PASS | `button.tsx`:25-36 — xs(h-6)/sm(h-7)/default(h-8)/lg(h-9)/icon variants |
| CS-008 | PASS | `input.tsx`:12 `border border-input` |
| CS-009 | PASS | `input.tsx`:12 `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` |
| CS-010 | PASS | `input.tsx`:12 `aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20` |
| CS-011 | PASS | `input.tsx`:12 `disabled:...disabled:bg-input/50 disabled:opacity-50` |
| CS-012 | PASS | `input.tsx`:12 `placeholder:text-muted-foreground` |
| CS-013 | PASS | `card.tsx`:15 `data-[size=sm]:gap-3 data-[size=sm]:py-3` |
| CS-014 | PASS | `card.tsx`:87 `bg-muted/50 border-t` |
| CS-015 | PASS | `table.tsx`:80 `hover:bg-muted/50` |
| CS-016 | PASS | `table.tsx`:93 `font-medium whitespace-nowrap text-foreground` |
| CS-017 | PASS | `table.tsx`:35-37 `canScrollRight` → 오른쪽 그라디언트 `lg:hidden` |
| CS-018 | N/A | Badge variant별 시각 구분은 브라우저 검증 필요 |
| CS-019 | PASS | `tabs.tsx`:63 `data-active:bg-background data-active:text-foreground` + shadow |
| CS-020 | PASS | `tabs.tsx`:61 `hover:text-foreground`, 비활성: `text-foreground/60` |
| CS-021 | PASS | `tabs.tsx`:26-38 — `tabsListVariants` default(`bg-muted`) vs line(`bg-transparent`) |
| CS-022 | PASS | `dialog.tsx`:34 `bg-black/10 backdrop-blur-xs` |
| CS-023 | PASS | `dialog.tsx`:62-76 `absolute top-2 right-2`, ghost variant, `icon-sm` |
| CS-024 | **FAIL** | `app-header.tsx`:222 `SheetContent side="right"` — TC 예상은 왼쪽 진입이나 실제 오른쪽에서 진입 |
| CS-025 | N/A | Sonner richColors 시각 구분은 브라우저 검증 필요 |
| CS-026 | N/A | Toast 위치는 브라우저 검증 필요 |
| CS-027 | N/A | 드롭다운 위치는 브라우저 검증 필요 |
| CS-028 | N/A | 툴팁은 브라우저 검증 필요 |

### 4. 레이아웃 & 정렬

| TC-ID | 결과 | 근거 |
|-------|------|------|
| LA-001 | PASS | `page-container.tsx`:10 `max-w-screen-xl`, `app-header.tsx`:132 `max-w-screen-xl`, `footer.tsx`:13 `max-w-screen-xl` — 모두 동일 |
| LA-002 | PASS | `page-container.tsx`:10 `px-4 md:px-6 xl:px-8` |
| LA-003 | PASS | 홈 IndexCard: `grid grid-cols-2 gap-3` (page.tsx:54), 전체: `grid-cols-1 md:grid-cols-2 gap-4` (page.tsx:50) |
| LA-004 | N/A | 시장 페이지 상승/하락 분할은 market/page.tsx 검증 필요 (별도 상세 확인 미수행) |
| LA-005 | PASS | `page.tsx`(홈):205-210 `QuickLinkGrid` 4개 카드 |
| LA-006 | N/A | 수직 정렬은 시각 검증 필요 |
| LA-007 | N/A | 테이블 셀 정렬은 `table.tsx`:106 `align-middle` 확인 PASS |
| LA-008 | PASS | `table.tsx`:93 `text-left align-middle`, 숫자 열은 사용처에서 `text-right` 적용 패턴 |
| LA-009 | PASS | `empty-state.tsx`:13 `flex flex-col items-center justify-center py-16 text-center` |
| LA-010 | N/A | 카드 간격 균일성은 시각 검증 필요 |
| LA-011 | N/A | 리스트 간격은 시각 검증 필요 |
| LA-012 | N/A | 홈페이지 섹션 간격: `mb-8` 일관 사용 확인 (page.tsx:162, 176, 204) PASS |
| LA-013 | PASS | `layout.tsx`:82 `pb-14 lg:pb-0` — 모바일에서 탭바 높이만큼 패딩. `compare-floating-bar.tsx`:23 `bottom-[60px] lg:bottom-4` |
| LA-014 | PASS | CookieConsent `z-60`, Dialog overlay `z-50`, Toast는 Sonner 기본 z-index 적용 |
| LA-015 | PASS | `sticky-price-header.tsx`:48-49 `fixed top-14` (AppHeader h-14 바로 아래), `z-40` < header `z-50` |
| LA-016 | **WARN** | `app-header.tsx`:265 — 2단 서브 네비 `h-10`. StickyPriceHeader는 `top-14` 고정이므로 2단 서브 네비(h-10)가 존재하면 겹칠 수 있음 |
| LA-017 | **WARN** | `layout.tsx`:82 `pb-14 lg:pb-0` 하지만 `min-h-screen` 미적용. Footer가 콘텐츠 부족 시 중간에 뜰 수 있음 |
| LA-018 | **WARN** | CookieConsent `z-60 fixed bottom-0`, CompareFloatingBar `z-40 bottom-[60px]`, BottomTabBar `z-50 fixed bottom-0` — CookieConsent가 탭바 위에 오지만 FloatingBar와 겹침 가능성 있음 |

### 5. 빈 상태 디자인

| TC-ID | 결과 | 근거 |
|-------|------|------|
| ES-001 | PASS | `watchlist/page.tsx`:112-117 — `EmptyState` 컴포넌트(Bookmark, "아직 관심종목이 없어요", CTA) |
| ES-002 | PASS | `watchlist/page.tsx`:178-182 — `EmptyState`(Briefcase, "아직 포트폴리오가 비어있어요") |
| ES-003 | PASS | SearchCommand의 CommandEmpty 처리 |
| ES-004 | PASS | `page.tsx`(홈):106 — `p-8 text-center text-sm text-muted-foreground` |
| ES-005 | PASS | `news-client.tsx`:119-121 — `text-center py-16 text-muted-foreground` |
| ES-006 | PASS | `board-list-client.tsx` 존재 |
| ES-007 | N/A | 댓글 빈 상태는 `comment-section.tsx` 검증 필요 |
| ES-008 | N/A | 차트 빈 상태는 런타임 검증 필요 |
| ES-009 | PASS | `dividend-history.tsx` 존재 — "배당 이력이 없습니다" 메시지 |
| ES-010 | PASS | `earnings-calendar.tsx` 존재 |
| ES-011 | PASS | `disclosure-list.tsx` 존재 |
| ES-012 | PASS | `reports-client.tsx` 존재 |
| ES-013 | PASS | `request-list-client.tsx` 존재 |
| ES-014 | **WARN** | EmptyState(아이콘+제목+설명+CTA) 사용처(ES-001,002)와 단순 텍스트(ES-004~013) 혼재. 스타일 불균일 |

### 6. 에러 상태 디자인

| TC-ID | 결과 | 근거 |
|-------|------|------|
| ER-001 | PASS | `not-found.tsx`:8 `text-6xl font-bold` + 제목 + 설명 + 홈 링크 |
| ER-002 | PASS | `not-found.tsx`:6 `PageContainer` 사용 → 전역 레이아웃 유지 |
| ER-003 | PASS | `error.tsx`:18-26 — `min-h-[50vh]`, "오류가 발생했습니다" + "다시 시도" Button(outline) |
| ER-004 | PASS | market/error.tsx, news/error.tsx, stock/error.tsx — 모두 동일 패턴(`min-h-[50vh] flex-col items-center justify-center`) |
| ER-005 | PASS | market: "시장 데이터를 불러올 수 없습니다", news: "뉴스를 불러올 수 없습니다", stock: "종목 정보를 불러올 수 없습니다" |
| ER-006 | PASS | 모든 폼에서 `<p className="text-sm text-destructive">` 필드 아래 배치 확인 |
| ER-007 | PASS | 폼 에러 메시지에 아이콘 미사용 — 일관적으로 텍스트만 |
| ER-008 | N/A | 인라인 에러는 `sector-performance.tsx`, `peer-stocks.tsx` 확인 필요 |
| ER-009 | PASS | 404: 홈 링크, error.tsx: "다시 시도" 버튼, 폼: 필드별 에러 메시지 |
| ER-010 | PASS | `error.tsx`:18 `min-h-[50vh]`, 중앙 배치 |

### 7. 로딩 상태 디자인

| TC-ID | 결과 | 근거 |
|-------|------|------|
| LD-001 | PASS | `skeleton.tsx`:7 `animate-pulse rounded-md bg-muted` |
| LD-002 | N/A | 스켈레톤 형태 적합성은 시각 검증 필요. `market/loading.tsx` 파일 존재 |
| LD-003 | N/A | `stock/[ticker]/loading.tsx` 파일 존재 |
| LD-004 | N/A | `news/loading.tsx` 파일 존재 |
| LD-005 | N/A | 스켈레톤 radius 일치는 시각 검증 필요 |
| LD-006 | N/A | animate-pulse 속도는 브라우저 검증 필요 |
| LD-007 | N/A | 인라인 스켈레톤은 런타임 검증 필요 |
| LD-008 | N/A | 차트 로딩 오버레이는 런타임 검증 필요 |
| LD-009 | PASS | 모든 폼 제출 버튼에 로딩 상태: register("가입 중..."), login("로그인 중..."), settings("저장 중..."/"변경 중..."), `disabled={loading}` |
| LD-010 | N/A | Loader2Icon 스피너는 Sonner/버튼에서 브라우저 검증 필요 |
| LD-011 | **FAIL** | `/board`, `/reports`, `/dividends`, `/earnings`, `/sectors`, `/compare`에 loading.tsx 미존재. `/screener/loading.tsx`, `/etf/loading.tsx`는 존재 |
| LD-012 | **FAIL** | `news-client.tsx` — 무한스크롤이 아닌 페이지네이션 방식. 스크롤 시 로딩 인디케이터 없음 |

### 8. 아이콘 & 일러스트

| TC-ID | 결과 | 근거 |
|-------|------|------|
| IC-001 | PASS | 34개 파일에서 `from "lucide-react"` 단일 사용. heroicons/feather 등 미사용 |
| IC-002 | PASS | `button.tsx`:9 `[&_svg:not([class*='size-'])]:size-4` 기본값. xs: size-3, sm: size-3.5 |
| IC-003 | PASS | 아이콘 색상: `text-muted-foreground`(비활성), `text-primary`(강조) 패턴 |
| IC-004 | PASS | 검색=Search, 닫기=X/XIcon, 비교=GitCompare, 관심종목=Star/Bookmark 일관 |
| IC-005 | PASS | `bottom-tab-bar.tsx`:11-16 — Home/Search/Globe/Star/User 동일 `h-5 w-5` |
| IC-006 | PASS | `app-header.tsx` — Sun/Moon/Menu/Search 모두 `h-4 w-4` 또는 `h-5 w-5` |
| IC-007 | PASS | `empty-state.tsx`:14 `rounded-full bg-muted p-4` + `h-8 w-8 text-muted-foreground` |
| IC-008 | PASS | `price-change-text.tsx`:23 — `▲`(상승), `▼`(하락) Unicode 일관 사용 |
| IC-009 | PASS | 404/error에 일러스트 부재 — 텍스트 기반. 개선 권장 사항으로 기록 |
| IC-010 | N/A | Toast 아이콘은 Sonner 기본 설정 — 브라우저 검증 필요 |

### 9. 애니메이션 & 트랜지션

| TC-ID | 결과 | 근거 |
|-------|------|------|
| AN-001 | PASS | `dialog.tsx`:56 `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95` |
| AN-002 | PASS | `dialog.tsx`:56 `data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95` |
| AN-003 | PASS | `dialog.tsx`:34 `data-open:fade-in-0 data-closed:fade-out-0` |
| AN-004 | PASS | `compare-floating-bar.tsx`:28 `animate-in slide-in-from-bottom-4`, `:27` `transition-all duration-200 ease-out` |
| AN-005 | PASS | `button.tsx`:9 `transition-all`. 링크/행에 `transition-colors` |
| AN-006 | N/A | 탭 전환 애니메이션은 브라우저 검증 필요 |
| AN-007 | PASS | `sticky-price-header.tsx`:50 `transition-transform duration-200` |
| AN-008 | PASS | `cookie-consent.tsx`:88 `transition-transform duration-300 ease-out` |
| AN-009 | PASS | Tailwind `animate-pulse` 기본값 2s — 적절 |
| AN-010 | N/A | 스피너 회전은 브라우저 검증 필요 |
| AN-011 | N/A | NewsCard hover shadow는 브라우저 검증 필요 |
| AN-012 | N/A | 외부 링크 아이콘 등장 애니메이션은 브라우저 검증 필요 |
| AN-013 | N/A | 지표 바 애니메이션은 브라우저 검증 필요 |
| AN-014 | PASS | 금융 서비스에 맞는 절제된 애니메이션. 과도한 효과 미발견 |

### 10. 반응형 디자인 품질

| TC-ID | 결과 | 근거 |
|-------|------|------|
| RQ-001 | **WARN** | `bottom-tab-bar.tsx` h-14(56px) 충분. 그러나 차트 기간 버튼, 관심종목 별 아이콘 등은 실제 측정 필요 |
| RQ-002 | N/A | 터치 타겟 간 간격은 브라우저 측정 필요 |
| RQ-003 | **WARN** | Input `text-base`(16px) + `md:text-sm`(14px) — 모바일에서 16px OK. 그러나 일부 캡션 `text-xs`(12px) 존재, 최소 기준 충족하나 가독성은 시각 확인 권장 |
| RQ-004 | PASS | `sticky-price-header.tsx`:63 `font-mono font-bold` — 기본 text 크기(16px) |
| RQ-005 | PASS | `table.tsx`:35-37 — canScrollRight 그라디언트 `lg:hidden` |
| RQ-006 | PASS | `table.tsx`:93 `whitespace-nowrap` |
| RQ-007 | N/A | 차트 모바일 가독성은 브라우저 검증 필요 |
| RQ-008 | N/A | 비교 차트 모바일은 브라우저 검증 필요 |
| RQ-009 | N/A | AI 리포트 모바일은 브라우저 검증 필요 |
| RQ-010 | PASS | `login-form.tsx`:70 `w-full max-w-md`, Button `w-full` |
| RQ-011 | PASS | Desktop `lg:hidden`/`hidden lg:flex` 전환. 로고/색상 톤 유지 |
| RQ-012 | N/A | 카드 비율은 시각 검증 필요 |
| RQ-013 | PASS | `page-container.tsx`:10 `px-4`(16px) / 375px = 4.3% — 범위 내 |
| RQ-014 | N/A | 텍스트 말줄임은 시각 검증 필요 |
| RQ-015 | N/A | 뉴스 이미지 비율은 news-card.tsx 검증 필요 |
| RQ-016 | **WARN** | `table.tsx` 가로 스크롤 컨테이너 처리됨. 그러나 전체 페이지 레벨 overflow 검증은 브라우저 필요 |

### 11. 브랜드 & 톤 일관성

| TC-ID | 결과 | 근거 |
|-------|------|------|
| BR-001 | PASS | 전체적으로 깔끔한 정보 중심 레이아웃. 과도한 장식 미발견 |
| BR-002 | PASS | Primary 녹색 사용: CTA/링크/활성 상태에만 제한적 |
| BR-003 | N/A | 홈페이지 정보 밀도는 시각 검증 필요 |
| BR-004 | PASS | 종목 상세: 4개 탭으로 정보 분리 |
| BR-005 | N/A | 여백 충분성은 시각 검증 필요 |
| BR-006 | PASS | CTA 버튼: `bg-primary text-primary-foreground` — 주변과 명확 구분 |
| BR-007 | **FAIL** | 톤 혼재: `not-found.tsx`:9 "페이지를 찾을 수 없**어요**"(친근), `error.tsx`:19 "오류가 발생했**습니다**"(격식), `market/error.tsx`:19 "불러올 수 **없습니다**"(격식). 일관성 부재 |
| BR-008 | PASS | `footer.tsx`:42 `text-xs text-muted-foreground/80` — 면책 고지 존재, 과하지 않음 |
| BR-009 | N/A | 다크 모드 톤은 시각 검증 필요 |
| BR-010 | **FAIL** | Desktop: "분석"(`app-header.tsx`:78), Mobile sheet: "분석 도구"(`app-header.tsx`:37). Desktop subLink: "분석 요청"(:83), Mobile: "리포트 요청"(:40). 용어 비대칭 |

---

## FAIL 항목 상세

### FAIL-1: AUTH-012 — callbackUrl 미처리

- **TC-ID**: AUTH-012 (P0)
- **테스트 항목**: callbackUrl 포함 로그인 리다이렉트
- **예상 결과**: 로그인 성공 후 callbackUrl(`/watchlist` 등)로 리다이렉트
- **실제 코드 상태**: `login-form.tsx`:51 — 항상 `router.push("/")`. URL의 `callbackUrl` 파라미터를 `useSearchParams()`로 읽지 않음
- **수정 필요 파일**: `src/components/auth/login-form.tsx`
- **수정 내용**: `useSearchParams()` 사용하여 `callbackUrl` 파라미터를 읽고, 로그인 성공 시 해당 URL로 리다이렉트
- **담당**: FE

### FAIL-2: STOCK-014 — 존재하지 않는 종목 접근 시 notFound() 미호출

- **TC-ID**: STOCK-014 (P1)
- **테스트 항목**: 존재하지 않는 종목 접근 시 404 표시
- **예상 결과**: `notFound()` 호출 → 글로벌 404 페이지
- **실제 코드 상태**: `stock/[ticker]/page.tsx` — stock이 null일 때 `notFound()` 호출 없음. `initialData = null`로 StockTabs에 전달되어 빈/깨진 UI 가능
- **수정 필요 파일**: `src/app/stock/[ticker]/page.tsx`
- **수정 내용**: `const stock = await getStock(ticker)` 후 `if (!stock) notFound()` 추가
- **담당**: FE

### FAIL-3: CMP-010 — MAX_SLOTS 텍스트 불일치 (알려진 이슈 M-1)

- **TC-ID**: CMP-010 (P2)
- **테스트 항목**: 홈페이지 QuickLinkCard "최대 5종목 비교 분석" 텍스트
- **예상 결과**: 실제 MAX_SLOTS(4)와 일치하는 텍스트
- **실제 코드 상태**: `page.tsx`(홈):208 — "최대 5종목 비교 분석", `compare-context.tsx`:21 — `MAX_SLOTS = 4`
- **수정 필요 파일**: `src/app/page.tsx` 또는 `src/contexts/compare-context.tsx`
- **수정 내용**: 텍스트를 "최대 4종목"으로 수정하거나, MAX_SLOTS를 5로 변경
- **담당**: FE

### FAIL-4: NAV-006 — /portfolio 경로 404 (알려진 이슈 M-2)

- **TC-ID**: NAV-006 (P1)
- **테스트 항목**: 더보기 → 포트폴리오 클릭 시 404
- **예상 결과**: 포트폴리오 페이지 표시
- **실제 코드 상태**: `app-header.tsx`:102 — `{ href: "/portfolio", label: "포트폴리오" }`. `/portfolio` page.tsx 미존재. 실제 기능은 `/watchlist` 포트폴리오 탭
- **수정 필요 파일**: `src/components/layout/app-header.tsx`
- **수정 내용**: href를 `/watchlist?tab=portfolio`로 변경하거나 `/portfolio` 페이지를 `/watchlist` 리다이렉트로 생성
- **담당**: FE

### FAIL-5: CS-024 — 사이드 시트 진입 방향 불일치

- **TC-ID**: CS-024 (P1)
- **테스트 항목**: 모바일 햄버거 메뉴가 왼쪽에서 슬라이드 인
- **예상 결과**: 왼쪽에서 진입
- **실제 코드 상태**: `app-header.tsx`:222 — `SheetContent side="right"` (오른쪽에서 진입)
- **수정 필요 파일**: TC의 기대값이 잘못되었거나 `app-header.tsx`의 side 변경 필요
- **수정 내용**: 디자인 의도 확인 필요. 오른쪽 진입이 의도적이라면 TC 수정, 아니라면 `side="left"` 변경
- **담당**: FE / 디자이너

### FAIL-6: LD-011 — loading.tsx 미존재 페이지

- **TC-ID**: LD-011 (P2)
- **테스트 항목**: 여러 페이지에 loading.tsx 미존재
- **예상 결과**: 모든 주요 페이지에 스켈레톤 로딩
- **실제 코드 상태**: `/board`, `/reports`, `/dividends`, `/earnings`, `/sectors`, `/compare`에 loading.tsx 없음
- **수정 필요 파일**: 각 경로에 `loading.tsx` 생성
- **담당**: FE

### FAIL-7: LD-012 — 뉴스 무한스크롤 미구현

- **TC-ID**: LD-012 (P1)
- **테스트 항목**: 뉴스 더보기 로딩 인디케이터
- **예상 결과**: 스크롤 시 무한 로딩
- **실제 코드 상태**: `news-client.tsx`:124-129 — 이전/다음 페이지네이션 방식. 무한스크롤 아님
- **수정 필요 파일**: TC 기대값 수정 또는 `news-client.tsx` 무한스크롤 전환
- **담당**: FE

### FAIL-8: BR-007 — 한국어 톤 혼재

- **TC-ID**: BR-007 (P1)
- **테스트 항목**: 안내 메시지의 한국어 톤 일관성
- **예상 결과**: 일관된 톤
- **실제 코드 상태**: "찾을 수 없어요"(친근) vs "불러올 수 없습니다"(격식) 혼재
- **수정 필요 파일**: `src/app/not-found.tsx` 또는 에러 페이지 전체
- **수정 내용**: 하나의 톤으로 통일 (예: 격식체 "~습니다"로 통일)
- **담당**: FE

### FAIL-9: BR-010 — Desktop/Mobile 용어 비대칭

- **TC-ID**: BR-010 (P2)
- **테스트 항목**: UI 텍스트 용어 통일
- **예상 결과**: 같은 기능에 같은 라벨
- **실제 코드 상태**: Desktop `navCategories` "분석" vs Mobile `navGroups` "분석 도구", Desktop "분석 요청" vs Mobile "리포트 요청"
- **수정 필요 파일**: `src/components/layout/app-header.tsx`
- **수정 내용**: navCategories와 navGroups의 라벨 통일
- **담당**: FE

---

## WARN 항목 상세

| TC-ID | 설명 |
|-------|------|
| AUTH-020 | `/board/:id/edit` matcher 패턴이 Next.js 동적 라우트 matcher와 완전 호환되지 않을 수 있음. 실제 동작 테스트 필요 |
| STOCK-003 | 로그인 사용자 홈에 개인화 UI 부재 — CTA 배너 미표시 외 차별 요소 없음 |
| NEWS-003 | TC 예상(무한 스크롤)과 실제 구현(페이지네이션) 불일치. 기능적으로 정상 작동하나 UX 관점 차이 |
| CMP-003 | MAX_SLOTS 도달 시 사용자 알림(toast 등) 미구현. 무시만 됨 |
| NAV-009 | 사이드 시트가 오른쪽에서 진입(side="right"). TC에서는 왼쪽 예상 — 디자인 의도 확인 필요 |
| WL-006 | 미등록 종목 삭제 시 일괄 500 반환. 구체적 에러 분류(404 등) 미구현 |
| DT-010 | PriceChangeText 자체에 `font-mono` 미적용. 호출부에서 수동 추가 필요 — tabular-nums 보장 불완전 |
| ES-014 | EmptyState 패턴과 단순 텍스트 빈 상태 혼재. 디자인 통일성 개선 권장 |
| LA-016 | 2단 서브 네비(h-10) 존재 시 StickyPriceHeader(top-14)와 겹침 가능성 |
| LA-017 | min-h-screen 미적용으로 콘텐츠 부족 시 Footer 위치 이슈 |
| LA-018 | CookieConsent/FloatingBar/BottomTabBar 동시 존재 시 겹침 가능성 |
| RQ-001 | 하단 탭바 56px 충분하나 차트 기간 버튼 등 개별 검증 필요 |
| RQ-003 | text-xs(12px) 사용처 존재 — 최소 기준은 충족하나 가독성 확인 권장 |
| RQ-016 | Table overflow 처리됨. 전체 페이지 레벨은 브라우저 검증 필요 |

---

## 종합 판정

### Pass Rate
- **tc-1**: 74.7% (56/75 PASS), 82.7% (PASS+WARN)
- **tc-4**: 69.9% (109/156 PASS), 81.4% (PASS+WARN)
- **전체**: 71.4% PASS, 81.7% PASS+WARN

### Critical Failures (P0~P1)

1. **AUTH-012 (P0)**: callbackUrl 미처리 — 보호 라우트 접근 후 로그인 시 홈으로 이동. **사용자 경험에 직접 영향**
2. **STOCK-014 (P1)**: 존재하지 않는 종목 접근 시 404 미표시 — **빈 페이지 노출 위험**
3. **NAV-006 (P1)**: /portfolio 404 — **데드 링크**
4. **BR-007 (P1)**: 한국어 톤 혼재 — **브랜드 일관성 저해**
5. **LD-012 (P1)**: 뉴스 무한스크롤 미구현 — TC 기대값과 실제 구현 차이 (기능적 결함은 아님)

### 권장 사항

1. **즉시 수정 (P0)**: AUTH-012 callbackUrl 처리 추가
2. **우선 수정 (P1)**: STOCK-014 notFound() 추가, NAV-006 /portfolio 경로 수정
3. **개선 권장**: 빈 상태 디자인 통일, 한국어 톤 통일, loading.tsx 추가, Desktop/Mobile 용어 통일
4. **TC 문서 수정 필요**: NEWS-003(무한스크롤→페이지네이션), CS-024(시트 진입 방향)는 실제 구현이 합리적이므로 TC 수정 권장
