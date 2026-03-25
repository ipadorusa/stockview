# StockView 현재 서비스 전체 분석

> 분석일: 2026-03-25 | 분석 범위: 코드베이스 전체 (pages, components, API routes, DB schema, cron jobs)

---

## 1. 서비스 개요

StockView는 **한국+미국 듀얼마켓 주식 정보 플랫폼**으로, 초보 투자자를 주요 타겟으로 한다.
- **Tech Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Prisma 7 + PostgreSQL (Supabase) + TanStack Query + Tailwind CSS 4 + shadcn/ui
- **인증**: NextAuth 5 beta (Credentials provider, JWT 30일)
- **배포**: Vercel + GitHub Actions (cron)
- **수익화**: Google AdSense (AdSlot 컴포넌트로 여러 페이지에 배치)
- **SEO**: JSON-LD, OpenGraph, sitemap, Google/Naver 검색 등록, Breadcrumb

---

## 2. 페이지 구조 (총 39개 page.tsx)

### 2.1 핵심 페이지 (Core)

| 경로 | 설명 | 렌더링 | 특이사항 |
|------|------|--------|----------|
| `/` (홈) | 주요지수 + 환율 + 인기종목 + 최신뉴스 | SSR (ISR 15분) | 4개 섹션, Suspense 스트리밍 |
| `/market` | 시장 개요 (KR/US 탭) | SSR (ISR 15분) | 지수, 상승/하락 TOP5, 섹터 성과 |
| `/stock/[ticker]` | 종목 상세 | SSR (ISR 15분) + CSR | 탭 구조: 차트/정보/뉴스/공시/배당/실적, generateStaticParams 200개 |
| `/watchlist` | 관심종목 | CSR (로그인 필요) | React Query, 삭제 mutation |
| `/news` | 뉴스 목록 | SSR (ISR 5분) | 카테고리 필터 |

### 2.2 분석/스크리닝 페이지

| 경로 | 설명 | 렌더링 | 특이사항 |
|------|------|--------|----------|
| `/screener` | 기술적 스크리너 | SSR + CSR | 5개 신호: 골든크로스, RSI 과매도, 거래량급증, 볼린저반등, MACD |
| `/screener/[signal]` | 신호별 상세 | - | 개별 신호 페이지 |
| `/reports` | AI 리포트 목록 | SSR (ISR 15분) | 페이지네이션, Ollama 기반 AI 생성 |
| `/reports/[slug]` | AI 리포트 상세 | SSR | 개별 리포트 |
| `/reports/stock/[ticker]` | 종목별 리포트 | SSR | 종목 기준 필터 |
| `/compare` | 종목 비교 | CSR | 2개 종목 지표 비교 (ticker 직접 입력) |

### 2.3 이벤트/캘린더 페이지

| 경로 | 설명 | 렌더링 | 특이사항 |
|------|------|--------|----------|
| `/dividends` | 배당 캘린더 | SSR (ISR 1시간) | 예정/최근 배당 + 고배당 TOP10 |
| `/earnings` | 실적 캘린더 | SSR (ISR 1시간) | 예정/최근 실적 + Beat/Miss 배지 |

### 2.4 ETF/섹터 페이지

| 경로 | 설명 | 렌더링 | 특이사항 |
|------|------|--------|----------|
| `/etf` | ETF 목록 | SSR (ISR 15분) | KR/US 탭, 거래대금 기준 정렬 |
| `/etf/[ticker]` | ETF 상세 | SSR | 개별 ETF |
| `/sectors` | 섹터 목록 | SSR (ISR 1시간) | 카드 그리드 |
| `/sectors/[name]` | 섹터별 종목 | SSR | 섹터 내 종목 리스트 |

### 2.5 교육/가이드 페이지

| 경로 | 설명 |
|------|------|
| `/guide` | 투자 가이드 허브 |
| `/guide/technical-indicators` | 기술적 지표 가이드 |
| `/guide/dividend-investing` | 배당 투자 가이드 |
| `/guide/etf-basics` | ETF 기초 가이드 |
| `/guide/reading-financials` | 재무제표 읽기 가이드 |
| `/guide/market-indices` | 주요 지수 이해 가이드 |

### 2.6 커뮤니티/유틸리티 페이지

| 경로 | 설명 | 특이사항 |
|------|------|----------|
| `/board` | 요청 게시판 | 비공개 글 지원, 관리자 전체 열람 |
| `/board/new` | 글 작성 | 로그인 필요 |
| `/board/[id]` | 글 상세 | 댓글(대댓글) 지원 |
| `/board/[id]/edit` | 글 수정 | 작성자만 |
| `/mypage` | 마이페이지 | 프로필, 관심종목 미리보기, 퀵링크 |
| `/settings` | 설정 | 프로필/비밀번호 변경 |
| `/auth/login` | 로그인 | Credentials 방식 |
| `/auth/register` | 회원가입 | 이메일+닉네임+비밀번호 |
| `/auth/forgot-password` | 비밀번호 찾기 | - |

### 2.7 관리/기타 페이지

| 경로 | 설명 |
|------|------|
| `/admin/data-health` | 데이터 품질 모니터링 (관리자) |
| `/admin/contacts` | 문의 관리 (관리자) |
| `/about` | 서비스 소개 |
| `/contact` | 문의하기 |
| `/privacy` | 개인정보처리방침 |
| `/terms` | 이용약관 |

---

## 3. 컴포넌트 구조 (총 65개 .tsx)

### 3.1 디렉토리 구조

```
src/components/
├── ui/              (20개) shadcn/ui 기본 컴포넌트
├── layout/          (4개) AppHeader, BottomTabBar, Footer, PageContainer
├── market/          (4개) IndexCard, StockRow, SectorPerformance, PopularStocksTabs
├── stock/           (9개) PriceDisplay, StockChart, ChartControls, StockInfoGrid,
│                          WatchlistButton, PeerStocks, DisclosureList, DividendHistory,
│                          EarningsCalendar, IndicatorSummary
├── news/            (3개) NewsCard, NewsLink, SentimentBadge
├── search/          (2개) SearchBar, SearchCommand (Cmd+K)
├── auth/            (2개) LoginForm, RegisterForm
├── board/           (4개) PostForm, CommentForm, CommentItem, CommentSection
├── common/          (4개) PriceChangeText, ExchangeRateBadge, EmptyState, TooltipHelper, NewsTimestamp
├── analytics/       (2개) GTM, GtmPageView
├── seo/             (2개) JsonLd, Breadcrumb
├── ads/             (2개) AdSlot, AdDisclaimer
└── providers.tsx         (SessionProvider + ThemeProvider + QueryClientProvider)
```

### 3.2 레이아웃 구조

- **AppHeader**: 스티키 헤더, 데스크톱 네비게이션(8개 링크), 검색바, 다크모드 토글, 인증 메뉴, 모바일 Sheet 메뉴
- **BottomTabBar**: 모바일 전용 (lg:hidden), 4개 탭 (홈/시장/뉴스/MY)
- **Footer**: 하단 링크 (서비스 소개, 개인정보, 이용약관 등)
- **PageContainer**: max-w-screen-xl 래퍼

### 3.3 네비게이션 불일치

| 위치 | 노출 항목 |
|------|-----------|
| AppHeader (데스크톱) | 홈, 시장, ETF, 스크리너, AI 리포트, 뉴스, 게시판, 관심종목 |
| BottomTabBar (모바일) | 홈, 시장, 뉴스, MY |
| AppHeader 없음 | 배당, 실적, 섹터, 종목비교, 가이드 (헤더에서 직접 접근 불가) |

---

## 4. API 라우트 (총 46개 route.ts)

### 4.1 공개 API

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/stocks/search` | GET | 종목 검색 |
| `/api/stocks/popular` | GET | 인기 종목 |
| `/api/stocks/[ticker]` | GET | 종목 상세 |
| `/api/stocks/[ticker]/chart` | GET | 차트 데이터 |
| `/api/stocks/[ticker]/news` | GET | 종목 뉴스 |
| `/api/stocks/[ticker]/peers` | GET | 동종 종목 |
| `/api/stocks/[ticker]/earnings` | GET | 실적 데이터 |
| `/api/stocks/[ticker]/dividends` | GET | 배당 데이터 |
| `/api/stocks/[ticker]/disclosures` | GET | 공시 데이터 |
| `/api/market/indices` | GET | 시장 지수 |
| `/api/market/kr/movers` | GET | KR 상승/하락 |
| `/api/market/us/movers` | GET | US 상승/하락 |
| `/api/market/sectors` | GET | 섹터 목록 |
| `/api/market/sectors/[name]/stocks` | GET | 섹터별 종목 |
| `/api/market/exchange-rate` | GET | 환율 |
| `/api/news/latest` | GET | 최신 뉴스 |
| `/api/news` | GET | 뉴스 목록 (필터) |
| `/api/etf/popular` | GET | 인기 ETF |
| `/api/screener` | GET | 스크리너 결과 |
| `/api/reports` | GET | AI 리포트 목록 |
| `/api/reports/[slug]` | GET | AI 리포트 상세 |
| `/api/board` | GET/POST | 게시판 |
| `/api/board/[id]` | GET/PATCH/DELETE | 게시글 CRUD |
| `/api/board/[id]/comments` | GET/POST | 댓글 |
| `/api/board/comments/[commentId]` | PATCH/DELETE | 댓글 수정/삭제 |
| `/api/contact` | POST | 문의 전송 |

### 4.2 인증 필요 API

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth |
| `/api/auth/register` | POST | 회원가입 |
| `/api/watchlist` | GET/POST | 관심종목 목록/추가 |
| `/api/watchlist/[ticker]` | DELETE | 관심종목 삭제 |
| `/api/settings/profile` | PATCH | 프로필 수정 |
| `/api/settings/password` | PATCH | 비밀번호 변경 |

### 4.3 Cron API (CRON_SECRET 보호)

| 경로 | 주기 | 설명 |
|------|------|------|
| `/api/cron/collect-master` | 주 1회 | KR/US 종목 마스터 동기화 |
| `/api/cron/collect-kr-quotes` | 평일 | KR 시세 수집 |
| `/api/cron/collect-us-quotes` | 평일 | US 시세 수집 |
| `/api/cron/collect-kr-etf-quotes` | 평일 | KR ETF 시세 |
| `/api/cron/collect-exchange-rate` | 매일 | 환율 수집 |
| `/api/cron/collect-news` | 매일 | RSS 뉴스 수집 |
| `/api/cron/compute-indicators` | 매일 | 기술적 지표 계산 |
| `/api/cron/collect-events` | 매일 | 실적/배당 이벤트 |
| `/api/cron/collect-fundamentals` | 매일 | 펀더멘탈 데이터 |
| `/api/cron/collect-disclosures` | 매일 | DART 공시 수집 |
| `/api/cron/collect-dart-dividends` | 매일 | DART 배당 수집 |
| `/api/cron/sync-corp-codes` | 주기적 | DART 기업코드 동기화 |
| `/api/cron/sync-kr-sectors` | 주기적 | KR 섹터 동기화 |
| `/api/cron/cleanup` | 매일 | 21일 이전 데이터 삭제, 90일 비활성 종목 |

### 4.4 관리자 API

| 경로 | 설명 |
|------|------|
| `/api/admin/data-health` | 데이터 품질 조회 |
| `/api/admin/contacts` | 문의 목록 |

---

## 5. DB 스키마 (총 16개 모델)

### 5.1 핵심 모델

| 모델 | 설명 | 주요 관계 |
|------|------|-----------|
| **Stock** | 종목 마스터 | quotes, dailyPrices, news, fundamental, technicalIndicators, dividends, earnings, disclosures, aiReports |
| **StockQuote** | 현재 시세 (1:1) | stock (unique stockId) |
| **DailyPrice** | OHLCV 일봉 | stock + date (unique) |
| **StockFundamental** | 펀더멘탈 (1:1) | stock (unique stockId) |
| **TechnicalIndicator** | 기술적 지표 | stock + date (unique) |

### 5.2 이벤트/뉴스 모델

| 모델 | 설명 |
|------|------|
| **News** | 뉴스 기사 (url unique) |
| **StockNews** | 종목-뉴스 다대다 |
| **Dividend** | 배당 정보 |
| **EarningsEvent** | 실적 발표 |
| **Disclosure** | DART 공시 |
| **AiReport** | AI 분석 리포트 |

### 5.3 시장 데이터 모델

| 모델 | 설명 |
|------|------|
| **MarketIndex** | 시장 지수 (KOSPI, KOSDAQ, SPX, IXIC) |
| **ExchangeRate** | 환율 |

### 5.4 사용자/커뮤니티 모델

| 모델 | 설명 |
|------|------|
| **User** | 사용자 (email, nickname, role) |
| **Account/Session** | NextAuth 세션 |
| **Watchlist** | 관심종목 (user+stock unique) |
| **BoardPost** | 게시글 (비공개 지원) |
| **BoardComment** | 댓글 (대댓글 self-relation) |
| **ContactMessage** | 문의 메시지 |
| **CronLog** | Cron 실행 로그 |

### 5.5 Enum

- `Market`: KR | US
- `StockType`: STOCK | ETF
- `UserRole`: USER | ADMIN
- `NewsCategory`: KR_MARKET | US_MARKET | INDUSTRY | ECONOMY

---

## 6. 데이터 흐름

```
[외부 소스] → [Cron Jobs (GitHub Actions)] → [API Routes] → [PostgreSQL (Supabase)]
                                                                      ↓
[사용자 브라우저] ← [Next.js SSR/ISR] ← [Prisma Queries] ← [PostgreSQL]
                 ← [Client-side React Query] ← [API Routes]
```

### 6.1 데이터 소스

| 소스 | 대상 | 방식 |
|------|------|------|
| Naver Finance | KR 종목 마스터, 시세, 지수 | HTML 스크래핑 (EUC-KR), fchart API, polling API |
| Yahoo Finance | US 종목 시세, 환율 | v8 chart API |
| S&P 500 CSV | US 종목 마스터 | CSV 파싱 |
| Google News RSS | 뉴스 | RSS 피드 |
| Yahoo Finance RSS | 뉴스 | RSS 피드 |
| OpenDART | KR 공시, 배당, 기업코드 | REST API |
| Ollama (로컬) | AI 리포트 | LLM 생성 |

### 6.2 ISR/캐시 전략

| 페이지 | revalidate |
|--------|-----------|
| 홈, 시장, ETF, 종목상세 | 900초 (15분) |
| 뉴스 | 300초 (5분) |
| 배당, 실적, 섹터 | 3600초 (1시간) |
| AI 리포트 | 900초 (15분) |

---

## 7. 주요 기능 요약

### 7.1 구현 완료 기능

1. **시장 대시보드**: 지수, 환율, 인기종목, 상승/하락 TOP5
2. **종목 상세**: 시세, 차트(lightweight-charts), 펀더멘탈, 뉴스, 공시, 배당, 실적 (탭 구조)
3. **기술적 스크리너**: 5개 신호 (골든크로스, RSI 과매도, 거래량급증, 볼린저반등, MACD)
4. **AI 리포트**: Ollama 기반 자동 분석 리포트
5. **관심종목**: 로그인 사용자 전용 watchlist
6. **ETF 섹션**: KR/US ETF 목록 + 개별 상세
7. **배당/실적 캘린더**: 예정/최근/고배당 종목
8. **섹터**: 섹터 목록 + 섹터별 종목
9. **종목 비교**: 2개 종목 지표 비교
10. **뉴스**: 카테고리별 필터, 종목 매칭
11. **투자 가이드**: 5개 교육 콘텐츠
12. **게시판**: 기능 요청/버그 제보 (비공개, 댓글, 대댓글)
13. **사용자**: 회원가입/로그인, 프로필 관리, 비밀번호 변경
14. **관리자**: 데이터 품질 모니터링, 문의 관리
15. **SEO**: JSON-LD, OG, Breadcrumb, sitemap, 검색엔진 등록
16. **광고**: AdSense 슬롯 (홈, 시장, ETF, 스크리너, 배당, 실적, 종목비교, 종목상세)
17. **분석**: GTM + Vercel Analytics + Speed Insights
18. **다크모드**: next-themes 기반

### 7.2 한국 컨벤션

- 주가 색상: 빨간색 = 상승, 파란색 = 하락 (한국 관행)
- 한국어 UI 전체
- KST 타임존 명시적 변환

---

## 8. 기술적 패턴 및 특징

1. **Server Components 우선**: 대부분 SSR + ISR, CSR은 관심종목/비교 등 인터랙션 필요 시만
2. **Suspense 스트리밍**: 홈 뉴스, 종목 상세 탭들에 적용
3. **React Query Hydration**: 스크리너, 종목 차트에서 SSR prefetch → CSR hydration
4. **Upsert 패턴**: 모든 데이터 수집에서 idempotent upsert
5. **배치 처리**: Promise.allSettled + 사이즈 제한 (100-500)
6. **Rate Limiting**: Naver 200ms, Yahoo 5 concurrent
7. **에러 복원**: withRetry (exponential backoff, 3회)
8. **Zod 검증**: auth, watchlist, settings API 입력 검증
9. **미들웨어 보호**: /watchlist/*, /settings/*, /api/watchlist/* 인증 필요 (src/proxy.ts)
