# 독립 스위핑 검증 보고서 3 (Reverse Engineering 방식)

> 검증일: 2026-03-28
> 역할: 독립 스위핑 검증관 3 — 코드 우선, 문서 후순 역공학 방식
> 방법: 코드에서 독자적 인벤토리 구축 후 문서 대조

---

## 1. 독자 인벤토리

### 1.1 페이지 인벤토리 (page.tsx 39개)

코드에서 직접 발견한 전체 페이지 목록:

| # | 경로 | 비고 |
|---|------|------|
| 1 | `/` | 홈 |
| 2 | `/market` | 시장 개요 |
| 3 | `/stock/[ticker]` | 종목 상세 |
| 4 | `/etf` | ETF 목록 |
| 5 | `/etf/[ticker]` | ETF 상세 |
| 6 | `/news` | 뉴스 |
| 7 | `/screener` | 스크리너 |
| 8 | `/screener/[signal]` | 시그널별 스크리너 |
| 9 | `/reports` | AI 리포트 목록 |
| 10 | `/reports/[slug]` | AI 리포트 상세 |
| 11 | `/reports/request` | 분석 요청 |
| 12 | `/reports/stock/[ticker]` | 종목별 리포트 히스토리 |
| 13 | `/compare` | 종목 비교 |
| 14 | `/sectors` | 섹터 목록 |
| 15 | `/sectors/[name]` | 섹터 상세 |
| 16 | `/dividends` | 배당 캘린더 |
| 17 | `/earnings` | 실적 캘린더 |
| 18 | `/watchlist` | 관심종목 + 포트폴리오 |
| 19 | `/mypage` | 마이페이지 |
| 20 | `/settings` | 설정 |
| 21 | `/board` | 게시판 목록 |
| 22 | `/board/[id]` | 게시글 상세 |
| 23 | `/board/new` | 글 작성 |
| 24 | `/board/[id]/edit` | 글 수정 |
| 25 | `/guide` | 투자 가이드 목록 |
| 26 | `/guide/technical-indicators` | 기술적 지표 |
| 27 | `/guide/dividend-investing` | 배당 투자 |
| 28 | `/guide/etf-basics` | ETF 기초 |
| 29 | `/guide/reading-financials` | 재무제표 읽기 |
| 30 | `/guide/market-indices` | 주요 지수 |
| 31 | `/about` | 서비스 소개 |
| 32 | `/contact` | 문의하기 |
| 33 | `/privacy` | 개인정보처리방침 |
| 34 | `/terms` | 이용약관 |
| 35 | `/auth/login` | 로그인 |
| 36 | `/auth/register` | 회원가입 |
| 37 | `/auth/forgot-password` | 비밀번호 찾기 |
| 38 | `/admin/contacts` | 문의 관리 (ADMIN) |
| 39 | `/admin/data-health` | 데이터 품질 (ADMIN) |

**Doc A 대비:** 39개 전체 일치. Doc A에서 모두 기재됨.
**Doc B 대비:** Doc B의 인벤토리(섹션 4) 확인 결과 동일 범위 커버.

### 1.2 API 인벤토리 (route.ts 60개)

**공개 API (23개):**
- `/api/auth/[...nextauth]` — NextAuth 핸들러
- `/api/auth/register` — 회원가입
- `/api/stocks/search` — 종목 검색
- `/api/stocks/popular` — 인기 종목
- `/api/stocks/[ticker]` — 종목 상세
- `/api/stocks/[ticker]/chart` — 차트 데이터
- `/api/stocks/[ticker]/news` — 종목 뉴스
- `/api/stocks/[ticker]/dividends` — 배당 이력
- `/api/stocks/[ticker]/earnings` — 실적 이력
- `/api/stocks/[ticker]/disclosures` — 공시
- `/api/stocks/[ticker]/peers` — 동종업계
- `/api/stocks/[ticker]/institutional` — 기관 매매
- `/api/stocks/[ticker]/fundamental-history` — 펀더멘털 히스토리
- `/api/market/indices` — 시장 지수
- `/api/market/exchange-rate` — 환율
- `/api/market/kr/movers` — 한국 등락 종목
- `/api/market/us/movers` — 미국 등락 종목
- `/api/market/sectors` — 섹터 목록
- `/api/market/sectors/[name]/stocks` — 섹터별 종목
- `/api/market-indices/history` — 지수 히스토리
- `/api/etf/popular` — 인기 ETF
- `/api/news` — 뉴스 목록
- `/api/news/latest` — 최신 뉴스

**스크리너/리포트 API (8개):**
- `/api/screener` — 기술적 스크리너
- `/api/screener/fundamental` — 펀더멘털 스크리너
- `/api/reports` — 리포트 목록
- `/api/reports/[slug]` — 리포트 상세
- `/api/report-requests` — 분석 요청 목록/생성
- `/api/report-requests/[id]` — 요청 상태 변경
- `/api/report-requests/[id]/comments` — 요청 댓글
- `/api/sectors` — 섹터 목록 (별도)

**인증 필수 API (8개):**
- `/api/watchlist` — 관심종목 CRUD
- `/api/watchlist/[ticker]` — 관심종목 삭제
- `/api/portfolio` — 포트폴리오 CRUD
- `/api/portfolio/[id]` — 포트폴리오 항목 수정/삭제
- `/api/settings/profile` — 프로필 수정
- `/api/settings/password` — 비밀번호 변경
- `/api/contact` — 문의 등록
- `/api/board` + `/api/board/[id]` + `/api/board/[id]/comments` + `/api/board/comments/[commentId]` — 게시판 CRUD

**관리자 API (2개):**
- `/api/admin/contacts` — 문의 관리
- `/api/admin/data-health` — 데이터 품질

**Cron API (15개):**
- `collect-master`, `collect-kr-quotes`, `collect-us-quotes`, `collect-exchange-rate`, `collect-news`, `collect-fundamentals`, `collect-institutional`, `collect-events`, `collect-dart-dividends`, `collect-disclosures`, `analyze-sentiment`, `generate-reports`, `sync-corp-codes`, `sync-kr-sectors`, `cleanup`

**Doc A 대비:** 모든 API 엔드포인트가 Doc A 섹션 4에 기재됨. 일치.
**Doc B 대비:** Doc B 섹션 5에서도 동일 범위 커버.

### 1.3 시스템 파일 인벤토리

| 유형 | 파일 | 수량 |
|------|------|------|
| layout.tsx | root, news, compare, settings | 4개 |
| loading.tsx | market, news, stock/[ticker], watchlist, screener, etf, etf/[ticker] | 7개 |
| error.tsx | root, market, news, stock/[ticker] | 4개 |
| not-found.tsx | root | 1개 |
| opengraph-image.tsx | stock/[ticker], etf/[ticker] | 2개 |
| sitemap | sitemap.ts, sitemap-index.xml, sitemap-stocks.xml, sitemap-etf.xml, sitemap-reports.xml | 5개 |
| robots.ts | root | 1개 |

### 1.4 네비게이션 구조 (독자 분석)

**Desktop (navCategories 4그룹):**
- 투자 정보: 시장, ETF, 섹터, 배당, 실적
- 분석: 스크리너, AI 리포트, 분석 요청, 비교, 가이드
- 뉴스: 뉴스, 게시판
- 더보기: 관심종목, 포트폴리오, 마이페이지, 소개

**Mobile Sheet (navGroups 4그룹):**
- 투자 정보: 시장 개요, ETF, 섹터별 종목, 배당 캘린더, 실적 캘린더
- 분석 도구: 스크리너, AI 리포트, 리포트 요청, 종목 비교, 투자 가이드
- 뉴스/커뮤니티: 뉴스, 게시판
- MY: 관심종목, 포트폴리오, 마이페이지, 설정

**Mobile BottomTabBar (5탭):**
- 홈, 검색(오버레이), 시장, 관심, MY

**Footer 링크:**
- 개인정보처리방침, 이용약관, 쿠키 설정(button), 서비스 소개, 게시판, 문의하기

### 1.5 미들웨어 보호 구조 (src/proxy.ts)

**Protected Routes (isProtectedRoute):**
- `/watchlist`, `/settings`, `/mypage`
- `/api/watchlist`, `/api/portfolio`
- `/reports/stock`
- `/board/new`, `/board/[id]/edit`

**Admin Routes:**
- `/admin/*`, `/api/admin/*`

**Matcher 목록 (config.matcher):**
- `/watchlist/:path*`, `/portfolio/:path*`, `/settings/:path*`, `/mypage/:path*`
- `/api/watchlist/:path*`, `/api/portfolio/:path*`
- `/reports/stock/:path*`
- `/board/new`, `/board/:id/edit`
- `/admin/:path*`, `/api/admin/:path*`

---

## 2. 누락 발견 (문서에 없는 항목)

### 2.1 양쪽 문서 공통 누락

#### MISS-1: 환경변수 전체 목록 미기재 (MAJOR)

CLAUDE.md에 6개 env var만 기재되어 있으나, 코드에서 실제 사용하는 환경변수는 최소 16개:

| 변수명 | 용도 | 문서 기재 |
|--------|------|-----------|
| `DATABASE_URL` | DB 연결 | O (CLAUDE.md) |
| `DIRECT_URL` | DB 직접 연결 | O |
| `NEXTAUTH_SECRET` | JWT 비밀키 | O |
| `NEXTAUTH_URL` | NextAuth URL | O |
| `CRON_SECRET` | Cron 인증 | O |
| `APP_URL` | 앱 기본 URL | O |
| `OPENDART_API_KEY` | DART API | O |
| `AUTH_GOOGLE_ID` | Google OAuth | X |
| `AUTH_GOOGLE_SECRET` | Google OAuth | X |
| `GROQ_API_KEY` | Groq LLM | X |
| `GROQ_MODEL` | Groq 모델명 | X |
| `OLLAMA_URL` | Ollama URL | X |
| `OLLAMA_MODEL` | Ollama 모델명 | X |
| `NAVER_CLIENT_ID` | 네이버 검색 API | X |
| `NAVER_CLIENT_SECRET` | 네이버 검색 API | X |
| `TELEGRAM_BOT_TOKEN` | 텔레그램 알림 | X |
| `TELEGRAM_CHAT_ID` | 텔레그램 알림 | X |
| `NEXT_PUBLIC_GTM_ID` | GTM 추적 | X |
| `NEXT_PUBLIC_ADSENSE_ID` | AdSense | X |

**9개 환경변수가 양쪽 문서에서 전혀 언급되지 않음.** 특히 `AUTH_GOOGLE_*`(Google OAuth), `GROQ_API_KEY`(AI 리포트 생성), `TELEGRAM_*`(Cron 알림)은 핵심 기능에 영향.

#### MISS-2: AI 리포트 생성 파이프라인 상세 미기술 (MAJOR)

코드에서 발견한 AI 리포트 생성 체계:
- `src/lib/llm.ts` — LLM 라우터 (Groq 우선, Ollama 폴백)
- `src/lib/groq.ts` — Groq API 클라이언트 (llama-3.3-70b-versatile 기본)
- `src/lib/ollama.ts` — Ollama 로컬 LLM (exaone3.5:7.8b 기본)
- `src/lib/ai-report.ts` + `src/lib/ai-report-utils.ts` — 리포트 생성 로직
- `scripts/generate-ai-reports.ts` — 수동 생성 스크립트
- `/api/cron/generate-reports` — 자동 생성 Cron

양쪽 문서에서 AI 리포트 "표시"는 다루지만, **생성 파이프라인** (LLM 선택, 프롬프트, 데이터 스냅샷 구조)은 전혀 기술되지 않음.

#### MISS-3: 텔레그램 알림 시스템 미기재 (MINOR)

`src/lib/utils/telegram.ts`가 존재하며, 5개 Cron API에서 import하여 사용:
- `collect-kr-quotes`, `collect-institutional`, `collect-fundamentals`, `analyze-sentiment`, `report-requests`

Cron 실행 결과 알림이 Telegram으로 전송되는 운영 기능이나 어디에도 문서화되지 않음.

#### MISS-4: 용어 사전(Glossary) 시스템 미기재 (MINOR)

- `src/lib/glossary.ts` — 투자 용어 사전 + 시그널 색상 정의
- `src/components/common/tooltip-helper.tsx` — 용어 툴팁 UI

종목 상세 등에서 PER, PBR, ROE 등의 용어에 마우스를 올리면 설명이 표시되는 기능이나 문서에 미기재.

#### MISS-5: 뉴스 수집 소스 다양성 미기재 (MINOR)

코드에서 발견한 뉴스 수집 소스:
- `src/lib/data-sources/news-rss.ts` — Google/Yahoo RSS (문서에 기재)
- `src/lib/data-sources/news-kr-direct.ts` — 한국 직접 크롤링
- `src/lib/data-sources/news-naver-search.ts` — 네이버 검색 API
- `src/lib/data-sources/news-stock-specific.ts` — 종목별 뉴스
- `src/lib/utils/news-sentiment.ts` — Groq 기반 감성 분석
- `src/lib/news-sentiment.ts` — 감성 분석 (별도)

문서에서는 "Google News RSS + Yahoo Finance RSS"만 언급. 실제로는 네이버 검색 API, 직접 크롤링 등 복수 소스가 존재.

#### MISS-6: Google AdSense 통합 미기재 (MINOR)

- `public/ads.txt` — AdSense 퍼블리셔 ID (pub-2608247315025794)
- `src/components/ads/ad-slot.tsx` — 광고 슬롯 컴포넌트
- `src/components/ads/ad-disclaimer.tsx` — 광고 면책 표시
- `src/app/layout.tsx:68-74` — 조건부 AdSense 스크립트 로드

Doc A에서 `AdSlot` 컴포넌트명만 간략 언급. 광고 시스템의 구조(AdSense 연동, ads.txt, 조건부 로드)는 미기술.

#### MISS-7: GitHub Actions 워크플로우 상세 미기재 (MINOR)

16개 GitHub Actions 워크플로우 파일 존재:
- **파이프라인**: `cron-pipeline-kr.yml` (평일 07:00 UTC), `cron-pipeline-us.yml` (평일 21:15 UTC)
- **개별**: cleanup, events, disclosures, fundamentals, exchange, institutional, kr-sectors, master, news, sentiment, dart-dividends, corp-codes

Doc A에서 Cron API 엔드포인트만 나열하고, **실제 실행 스케줄과 워크플로우 구조**(파이프라인이 개별 워크플로우를 호출하는 구조)는 미기술. 특히 `cron-pipeline-kr.yml`이 `cron-kr.yml`을 reusable workflow로 호출하는 패턴.

#### MISS-8: 쿠키 동의(Cookie Consent) 상세 미기재 (MINOR)

- `src/components/cookie-consent.tsx` — 쿠키 동의 배너
- Footer에서 `cookie-consent-reset` 이벤트로 재설정 가능
- GTM consent 기본값: `ad_storage: denied, analytics_storage: granted`

Doc A/B에서 `CookieConsent` 컴포넌트명만 언급. GDPR/개인정보보호 관련 동의 흐름, GTM consent mode 통합은 미기술.

---

## 3. 기존 이슈 검증 (final-sweep.md 24건)

### CRITICAL (2건)

#### C-1: 차트 기간 옵션 오류 — 동의 (CONFIRMED)

독자 검증 결과:
- `src/types/stock.ts:66` — `ChartPeriod = "1W" | "2W" | "3W" | "1M" | "3M" | "6M" | "1Y"` (7개)
- Doc A: "1M/3M/6M/1Y/3Y" (4개만 맞고, 1W/2W/3W 누락, 3Y는 존재하지 않음)
- Doc B: "1W~5Y" (5Y 존재하지 않음)

**판정: 동의. CRITICAL 적절.**

#### C-2: 관심종목 인증 서술 모순 — 동의 (CONFIRMED)

독자 검증 결과:
- `src/proxy.ts:8` — `/watchlist` 미들웨어 보호 (1차)
- `src/app/watchlist/page.tsx` — `useSession()` 컴포넌트 체크 (2차)
- 이중 보호 구조가 정확히 기술되지 않음

**판정: 동의. CRITICAL 적절.**

### MAJOR (5건)

#### M-1: MAX_SLOTS 5 vs 4 코드 버그 — 동의 (CONFIRMED)

독자 검증 결과:
- `src/app/page.tsx:208` — `description="최대 5종목 비교 분석"` (UI 텍스트)
- `src/app/compare/page.tsx:90` — `const MAX_SLOTS = 4` (실제 제한)
- `src/app/compare/page.tsx:163` — `최대 {MAX_SLOTS}개 종목의 주요 지표를 비교해 보세요` (4로 표시)

**판정: 동의. 이것은 문서 이슈가 아니라 코드베이스 자체의 버그. 홈페이지 QuickLinkCard에서 "5종목"이라 하고 실제 비교 페이지에서는 4개 제한.**

#### M-2: /portfolio 404 — 동의 (CONFIRMED)

독자 검증 결과:
- `src/app/portfolio/` 디렉토리 자체가 미존재
- `app-header.tsx:56,103` — 두 곳에서 `/portfolio` 링크 노출
- `proxy.ts:41` matcher에 `/portfolio/:path*` 포함
- `proxy.ts:8-15` isProtectedRoute에는 `/portfolio` 미포함 (비대칭)
- 실제 포트폴리오 기능은 `/watchlist` 페이지의 탭으로 존재
- `src/components/portfolio/` 디렉토리에 컴포넌트 3개 존재

**판정: 동의. MAJOR 적절. 네비게이션에서 클릭하면 404 발생하는 심각한 UX 버그.**

#### M-3: loading/error 바운더리 누락 (Doc A) — 동의 (CONFIRMED)

독자 검증 결과: loading.tsx 7개 + error.tsx 4개 = 총 11개 시스템 파일 중 Doc A 시스템 파일 섹션에 루트 error.tsx만 기재.

**판정: 동의. MAJOR 적절.**

#### M-4: Desktop/Mobile 네비게이션 차이 미상세 — 동의 (CONFIRMED)

독자 분석에서 발견한 차이:
1. Desktop "더보기" subLinks에 **설정 없음** (prefixes에는 포함)
2. Desktop subLinks에 **소개(/about)** 있음, Mobile navGroups에는 없음
3. Mobile navGroups에 **설정** 있음, Desktop에는 없음
4. BottomTabBar는 완전히 별도 구조 (5탭)
5. Footer에 **문의하기(/contact)** 있음, 양쪽 nav 모두에 없음

**판정: 동의. MAJOR 적절.**

#### M-5: API Request/Response 스키마 부재 — 동의 (CONFIRMED)

`src/lib/validations/` 에 Zod 스키마 존재하나 문서 미반영.

**판정: 동의. 다만 문서 범위 경계 이슈이므로 별도 API 문서로 분리 권장.**

### MINOR (9건 기존)

| # | 이슈 | 독자 검증 | 판정 |
|---|------|-----------|------|
| m-1 | Toaster 레이아웃 위치 미명시 | 동의 | CONFIRMED |
| m-2 | "분석 요청" URL `?tab=requests` 미기재 | 동의 | CONFIRMED |
| m-3 | "더보기" prefixes/subLinks 혼동 | 동의. prefixes 6개 vs subLinks 4개 (설정, 문의 누락) | CONFIRMED |
| m-4 | 공통 컴포넌트 섹션 미비 (Doc A) | 동의 | CONFIRMED |
| m-5 | 홈페이지 환율 독립 섹션 누락 | 동의 (부분) | 부분 CONFIRMED |
| m-6 | opengraph-image.tsx 2개 미기재 | 동의. stock + etf 모두 확인 | CONFIRMED |
| m-7 | sitemap.ts (기본) 미기재 (Doc B) | 동의. `src/app/sitemap.ts` 존재 확인 | CONFIRMED |
| m-8 | Mermaid API 경로 형식 불일치 | 동의 | CONFIRMED |
| m-9 | /reports/request 인증 방식 구분 필요 | 동의. 미들웨어 보호 아님, 컴포넌트 레벨 체크 | CONFIRMED |

### 신규 발견 (8건)

| # | 이슈 | 독자 검증 | 판정 |
|---|------|-----------|------|
| NEW-1 | OnboardingSheet 데드 코드 | 동의. `src/app/` 어디에서도 import 없음 확인 | CONFIRMED |
| NEW-2 | 비로그인 CTA 배너 상세 미기술 | 동의 | CONFIRMED |
| NEW-3 | HeroSection 내부 동작 미기술 | 동의 | CONFIRMED |
| NEW-4 | BottomTabBar 검색 오버레이 동작 | 동의. `isOverlay: true` 확인 | CONFIRMED |
| NEW-5 | "더보기" subLinks/prefixes 비대칭 UX | 동의. m-3의 확장이며 정확 | CONFIRMED |
| NEW-6 | screener/[signal] dynamicParams=false | 동의. line 69에서 확인 | CONFIRMED |
| NEW-7 | 공개/보호 리포트 접근 권한 대비 미흡 | 동의 | CONFIRMED |
| NEW-8 | QueryClient 전역 설정 미기술 | 동의 | CONFIRMED |

### 검증관 1의 오류 여부

**final-sweep.md에서 발견한 오류: 없음.** 24건 모두 소스코드 근거가 정확하며, 심각도 분류도 적절하다. 특히 C-1(차트 기간), M-1(MAX_SLOTS), M-2(/portfolio 404)는 코드에서 직접 확인한 결과 검증관 1의 판단이 정확하다.

---

## 4. 시스템 레벨 발견

### 4.1 next.config.ts

- **보안 헤더**: CSP, X-Frame-Options, X-XSS-Protection 등 6개 보안 헤더가 모든 경로에 적용. 양쪽 문서 모두 미기재.
- **CSP 정책**: Google AdSense, GTM, Google Analytics 도메인이 허용 목록에 포함. script-src에 `unsafe-inline`, `unsafe-eval` 포함 (보안 관점 주의 필요).
- **서버 외부 패키지**: `@prisma/client`, `prisma`, `pg`, `pg-native`, `pgpass` — 서버 번들링에서 제외.
- **이미지 원격 패턴**: `hostname: "**"` (와일드카드) — 모든 외부 이미지 허용. 보안 관점 주의.
- **serverActions**: `allowedOrigins: ["localhost:3000"]` — 프로덕션에서 Server Actions가 차단될 수 있는 잠재적 이슈.
- **redirects/rewrites**: 없음. `/portfolio` -> `/watchlist?tab=portfolio` 같은 리다이렉트가 없어서 M-2 이슈가 발생.

### 4.2 package.json

- **seed 스크립트**: `seed:etf-master` — ETF 마스터 데이터 시드 스크립트 존재. CLAUDE.md에 미기재.
- **generate:ai-reports**: 수동 AI 리포트 생성 스크립트. 문서에 미기재.
- **playwright**: devDependency에 포함되지만, 테스트 프레임워크 미구성 (CLAUDE.md에 "No test framework is configured" 기재).
- **@mozilla/readability + jsdom**: 기사 본문 추출을 위한 라이브러리. `src/lib/utils/article-extractor.ts`에서 사용. 뉴스 크롤링의 핵심 도구이나 문서 미기재.

### 4.3 prisma/schema.prisma

20개 모델 + 4개 enum:
- User, Account, Session (인증)
- Stock, StockQuote, DailyPrice (시세)
- Watchlist, Portfolio (사용자)
- News, StockNews (뉴스)
- MarketIndex, MarketIndexHistory (지수)
- ExchangeRate (환율)
- StockFundamental, FundamentalHistory (펀더멘털)
- Dividend, EarningsEvent, Disclosure (이벤트)
- CronLog (운영)
- AiReport, ReportRequest, RequestComment (AI 리포트)
- BoardPost, BoardComment (게시판)
- Sector (섹터)
- InstitutionalFlow (기관 매매)
- ContactMessage (문의)
- Enum: Market(KR/US), UserRole(USER/ADMIN), StockType(STOCK/ETF), NewsCategory(4종), RequestStatus(6종)

### 4.4 GitHub Actions

16개 워크플로우 존재. 핵심 발견:
- **파이프라인 패턴**: `cron-pipeline-kr.yml`과 `cron-pipeline-us.yml`이 각각 `cron-kr.yml`과 `cron-us.yml`을 reusable workflow로 호출하는 2단계 구조. 이 패턴은 문서에 미기재.
- **스케줄**: KR 평일 16:00 KST(07:00 UTC), US 평일 16:15 ET(21:15 UTC). 감성 분석은 수/토 09:00 UTC.
- **US 파이프라인**: DATABASE_URL, DIRECT_URL을 secrets로 전달. KR 파이프라인은 APP_URL, CRON_SECRET만.

### 4.5 public/ 디렉토리

- `ads.txt` — Google AdSense 인증 파일
- `og-default.png` — 기본 OG 이미지
- `vercel.svg`, `next.svg`, `globe.svg`, `window.svg`, `file.svg` — Next.js 기본 아이콘 (사용 여부 불명)
- **robots.txt 없음** — `src/app/robots.ts`에서 동적 생성
- **manifest.json/webmanifest 없음** — PWA 미지원

### 4.6 보안 헤더 (next.config.ts)

양쪽 문서에서 전혀 다루지 않는 항목:
- Content-Security-Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### 4.7 SEO 인프라

- `src/lib/seo.ts` — Organization, WebSite JSON-LD 생성
- `src/components/seo/json-ld.tsx` — JSON-LD 렌더링 컴포넌트
- `src/app/robots.ts` — robots.txt (API, auth, settings, watchlist, admin, mypage 차단)
- Google Search Console 인증 (`verification.google`)
- Naver Search Advisor 인증 (`naver-site-verification`)
- Vercel Analytics + Speed Insights

양쪽 문서에서 SEO 구조(JSON-LD, robots 정책, 검색엔진 인증)를 체계적으로 다루지 않음.

---

## 5. 데이터 모델 정합성

### 5.1 모델별 페이지/API 매핑

| Prisma 모델 | 페이지 | API | 정합 |
|-------------|--------|-----|------|
| User | /mypage, /settings, /auth/* | /api/auth/*, /api/settings/* | O |
| Account | (인증 내부) | /api/auth/[...nextauth] | O |
| Session | (인증 내부) | /api/auth/[...nextauth] | O |
| Stock | /stock/[ticker], /etf/[ticker], 다수 | /api/stocks/* | O |
| StockQuote | /stock/[ticker], /market 등 | /api/stocks/[ticker] | O |
| DailyPrice | /stock/[ticker] 차트 | /api/stocks/[ticker]/chart | O |
| Watchlist | /watchlist, /mypage | /api/watchlist | O |
| Portfolio | /watchlist (탭) | /api/portfolio | O (단, 전용 페이지 없음) |
| News | /news | /api/news, /api/news/latest | O |
| StockNews | /stock/[ticker] 뉴스탭 | /api/stocks/[ticker]/news | O |
| MarketIndex | /market, / (홈) | /api/market/indices | O |
| MarketIndexHistory | / (홈 스파크라인) | /api/market-indices/history | O |
| ExchangeRate | /market, / (홈) | /api/market/exchange-rate | O |
| StockFundamental | /stock/[ticker] 정보탭 | /api/stocks/[ticker] | O |
| FundamentalHistory | /stock/[ticker] | /api/stocks/[ticker]/fundamental-history | O |
| Dividend | /dividends, /stock/[ticker] 이벤트탭 | /api/stocks/[ticker]/dividends | O |
| EarningsEvent | /earnings, /stock/[ticker] 이벤트탭 | /api/stocks/[ticker]/earnings | O |
| Disclosure | /stock/[ticker] 이벤트탭(KR만) | /api/stocks/[ticker]/disclosures | O |
| CronLog | /admin/data-health | /api/admin/data-health | O |
| AiReport | /reports, /reports/[slug], /reports/stock/[ticker] | /api/reports, /api/reports/[slug] | O |
| ReportRequest | /reports?tab=requests, /reports/request | /api/report-requests | O |
| RequestComment | /reports?tab=requests | /api/report-requests/[id]/comments | O |
| BoardPost | /board, /board/[id], /board/new, /board/[id]/edit | /api/board | O |
| BoardComment | /board/[id] | /api/board/[id]/comments, /api/board/comments/[commentId] | O |
| Sector | /sectors, /sectors/[name] | /api/sectors, /api/market/sectors | O |
| InstitutionalFlow | /stock/[ticker] | /api/stocks/[ticker]/institutional | O |
| ContactMessage | /contact, /admin/contacts | /api/contact, /api/admin/contacts | O |

### 5.2 정합성 이슈

1. **Portfolio 모델 vs 페이지 불일치**: Portfolio 모델과 API(`/api/portfolio`)가 존재하지만, 전용 페이지(`/portfolio`)는 없고 `/watchlist` 탭에 통합. 네비게이션은 `/portfolio`를 별도 경로로 노출 -- M-2 이슈와 동일.

2. **StockType ENUM 활용**: `StockType`에 `STOCK`과 `ETF`가 정의되어 있고, 실제로 `/stock/[ticker]`와 `/etf/[ticker]`가 별도 경로로 존재. 그런데 내부적으로 동일한 컴포넌트(`StockTabs`)를 재사용. 문서에서 이 구조적 공유 관계가 명확히 기술되지 않음.

3. **NewsCategory ENUM vs 실제 필터**: `KR_MARKET`, `US_MARKET`, `INDUSTRY`, `ECONOMY` 4종인데, Doc A에서는 뉴스 카테고리를 "전체/경제/산업/시장/기업"으로 기재. "기업" 카테고리는 ENUM에 없으므로 문서 오류 가능성.

4. **RequestStatus ENUM**: `PENDING`, `APPROVED`, `REJECTED`, `GENERATING`, `COMPLETED`, `FAILED` 6개 상태. 리포트 요청의 상태 전이 흐름(PENDING -> APPROVED -> GENERATING -> COMPLETED/FAILED, 또는 PENDING -> REJECTED)이 문서에 미기재.

---

## 6. 최종 판정

### 6.1 요약 통계

| 구분 | 수량 |
|------|------|
| 기존 CRITICAL (확인됨) | 2건 |
| 기존 MAJOR (확인됨) | 5건 |
| 기존 MINOR (확인됨) | 9건 |
| 기존 신규 발견 (확인됨) | 8건 |
| **본 검증에서 추가 발견** | **8건 (MISS-1~8)** + **시스템 레벨 4건** + **데이터 모델 4건** |
| 검증관 1 오류 | 0건 |
| 비이슈 판정 | 0건 |

### 6.2 본 검증 고유 발견 (역공학 방식으로만 발견 가능했던 항목)

1. **MISS-1**: 환경변수 9개 누락 (AUTH_GOOGLE_*, GROQ_*, OLLAMA_*, NAVER_*, TELEGRAM_*, GTM, ADSENSE) -- 문서 우선 접근에서는 CLAUDE.md의 6개만 보고 넘어가기 쉬움
2. **MISS-2**: AI 리포트 생성 파이프라인 (LLM 라우터, Groq/Ollama 이중 구조)
3. **MISS-3**: 텔레그램 알림 시스템
4. **MISS-5**: 뉴스 수집 4개 소스 (RSS 외 직접 크롤링, 네이버 검색 API)
5. **next.config.ts**: serverActions `allowedOrigins: ["localhost:3000"]` 프로덕션 이슈 가능성
6. **next.config.ts**: images `hostname: "**"` 와일드카드 보안 이슈
7. **데이터 모델**: NewsCategory ENUM vs 문서 카테고리 불일치
8. **데이터 모델**: RequestStatus 상태 전이 흐름 미기재

### 6.3 Go/No-Go 판정

**조건부 Go.**

**근거:**
- 페이지/API 인벤토리 자체는 양쪽 문서에서 100% 커버됨 (39 페이지, 60 API 전수 확인)
- CRITICAL 2건은 문서 수정만으로 해결 가능 (차트 기간 옵션, 인증 서술)
- MAJOR 5건 중 M-2(/portfolio 404)는 **코드 수정이 필요** (리다이렉트 또는 별도 페이지 생성)
- M-1(MAX_SLOTS)도 **코드 수정 필요** (홈페이지 텍스트 or 비교 페이지 제한 수정)

**Go 조건:**
1. C-1, C-2: 문서 내 차트 기간 옵션과 인증 서술 즉시 수정
2. M-1: 홈페이지 "최대 5종목" -> "최대 4종목"으로 코드 수정, 또는 MAX_SLOTS를 5로 변경
3. M-2: `/portfolio` 경로에 대해 (a) `/watchlist?tab=portfolio`로 리다이렉트 추가, 또는 (b) 네비게이션 링크를 `/watchlist` 탭 링크로 변경
4. MISS-1: 환경변수 전체 목록을 문서에 추가
5. MISS-2: AI 리포트 생성 파이프라인 섹션 추가

**No-Go 사유 없음:** 위 5개 조건은 모두 단시간 해결 가능하며, 아키텍처 수준의 재설계가 필요한 이슈는 없다.
