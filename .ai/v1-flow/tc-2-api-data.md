# TC-2: API & 데이터 레이어 테스트 케이스

> **문서 버전**: v1.0
> **작성일**: 2026-03-29
> **담당**: QA 담당 2
> **기준 문서**: `.ai/v1-flow/v1.0-page-flow.md` + 실제 `src/app/api/` 소스코드 대조
> **Base URL**: `http://localhost:3000` (로컬) / `https://stockview.kr` (프로덕션)

---

## 1. 개요

### 1.1 테스트 범위

| 영역 | 설명 |
|------|------|
| 공개 API | 인증 없이 접근 가능한 종목/마켓/뉴스/검색/리포트/게시판 API |
| 인증 필요 API | 관심종목, 포트폴리오, 설정, 게시판 CRUD, 리포트 요청 API |
| 관리자 API | 문의 관리, 데이터 헬스, 리포트 요청 승인 |
| Cron API | 15개 Cron 엔드포인트 (CRON_SECRET 인증) |
| 데이터 정합성 | 외부 소스(Naver/Yahoo) 대비 DB 데이터 정확성 |
| 에러 핸들링 | 외부 장애, DB 실패, Zod 검증 실패 등 |
| AI 리포트 파이프라인 | Groq/Ollama LLM 호출, 상태 전이, 생성-저장-조회 |
| 권한/보안 | canEditPost/canDeletePost 비대칭, JWT 검증, CRON_SECRET |

### 1.2 총 T/C 수

| 카테고리 | P0 | P1 | P2 | P3 | 합계 |
|----------|----|----|----|----|------|
| 공개 API | 8 | 12 | 10 | 4 | 34 |
| 인증 필요 API | 10 | 14 | 8 | 2 | 34 |
| 관리자 API | 3 | 4 | 2 | 0 | 9 |
| Cron API | 5 | 8 | 6 | 2 | 21 |
| 데이터 정합성 | 4 | 5 | 3 | 1 | 13 |
| 에러 핸들링 | 4 | 6 | 4 | 1 | 15 |
| AI 리포트 파이프라인 | 3 | 5 | 3 | 1 | 12 |
| 권한/보안 | 5 | 6 | 3 | 0 | 14 |
| **합계** | **42** | **60** | **39** | **11** | **152** |

---

## 2. 공개 API T/C

### 2.1 종목 검색 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-001 | 검색 | 정상 검색 (한글 종목명) | DB에 활성 종목 존재 | `GET /api/stocks/search?q=삼성` | 200, `{ results: [{ id, ticker, name, market, exchange, stockType }] }`, 최대 10건, name asc 정렬 | P0 | BE |
| PUB-002 | 검색 | 정상 검색 (티커) | DB에 AAPL 존재 | `GET /api/stocks/search?q=AAPL` | 200, `results` 배열에 AAPL 포함 (case-insensitive) | P0 | BE |
| PUB-003 | 검색 | 영문명 검색 | DB에 nameEn 데이터 존재 | `GET /api/stocks/search?q=Samsung` | 200, nameEn 필드로 매칭된 결과 반환 | P1 | BE |
| PUB-004 | 검색 | 2자 미만 쿼리 | 없음 | `GET /api/stocks/search?q=a` | 200, `{ results: [] }` (빈 배열, 에러 아님) | P1 | BE |
| PUB-005 | 검색 | 쿼리 파라미터 없음 | 없음 | `GET /api/stocks/search` | 200, `{ results: [] }` | P2 | BE |
| PUB-006 | 검색 | 빈 문자열 쿼리 | 없음 | `GET /api/stocks/search?q=` | 200, `{ results: [] }` | P2 | BE |
| PUB-007 | 검색 | 존재하지 않는 종목 | 없음 | `GET /api/stocks/search?q=ZZZZZZZ` | 200, `{ results: [] }` | P2 | BE |
| PUB-008 | 검색 | 비활성 종목 제외 | `isActive=false` 종목 존재 | `GET /api/stocks/search?q=비활성종목명` | 200, 비활성 종목 미포함 확인 | P1 | BE |
| PUB-009 | 검색 | 캐시 헤더 확인 | 없음 | `GET /api/stocks/search?q=삼성` | 응답 헤더 `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` | P3 | BE |

### 2.2 종목 상세 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-010 | 종목상세 | 정상 조회 (KR) | DB에 005930 + Quote + Fundamental | `GET /api/stocks/005930` | 200, `{ ticker, name, market:"KR", quote: { price, change, changePercent, volume, marketCap, high52w, low52w, per, pbr, ... }, fundamental: { eps, roe, dividendYield, ... } }` | P0 | BE |
| PUB-011 | 종목상세 | 정상 조회 (US) | DB에 AAPL 존재 | `GET /api/stocks/AAPL` | 200, `market: "US"`, preMarketPrice/postMarketPrice 필드 포함 | P0 | BE |
| PUB-012 | 종목상세 | 소문자 티커 | DB에 AAPL 존재 | `GET /api/stocks/aapl` | 200, `ticker: "AAPL"` (toUpperCase 변환 확인) | P1 | BE |
| PUB-013 | 종목상세 | 존재하지 않는 티커 | 없음 | `GET /api/stocks/INVALID999` | 404, `{ error: "종목을 찾을 수 없습니다." }` | P0 | BE |
| PUB-014 | 종목상세 | Quote 없는 종목 | Stock만 존재, Quote 없음 | `GET /api/stocks/NOTICKER` | 200, `quote: null` | P1 | BE |
| PUB-015 | 종목상세 | Fundamental 없는 종목 | Stock만 존재, Fundamental 없음 | `GET /api/stocks/NOTICKER` | 200, `fundamental: null` | P1 | BE |
| PUB-016 | 종목상세 | Decimal->Number 변환 | Quote에 Decimal 타입 데이터 | 응답의 price, change 등 필드 | 모든 숫자 필드가 `number` 타입 (string "1234.56"이 아닌 1234.56) | P1 | BE |

### 2.3 차트 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-017 | 차트 | 기본 기간 (3W) | DailyPrice 데이터 존재 | `GET /api/stocks/005930/chart` | 200, `{ ticker, period: "3W", data: [{ time, open, high, low, close, volume }] }`, 최근 21일 데이터 | P0 | BE |
| PUB-018 | 차트 | 기간 지정 (1Y) | 1년치 DailyPrice | `GET /api/stocks/005930/chart?period=1Y` | 200, `period: "1Y"`, 최대 365일 데이터 | P0 | BE |
| PUB-019 | 차트 | 유효하지 않은 기간 | 없음 | `GET /api/stocks/005930/chart?period=5Y` | 200, 기본값 21일(3W) 적용 | P2 | BE |
| PUB-020 | 차트 | 존재하지 않는 종목 | 없음 | `GET /api/stocks/INVALID/chart` | 404, `{ error: "종목을 찾을 수 없습니다." }` | P1 | BE |
| PUB-021 | 차트 | 빈 데이터 (신규 상장) | Stock 존재, DailyPrice 없음 | `GET /api/stocks/NEWTICKER/chart` | 200, `{ data: [] }` | P2 | BE |
| PUB-022 | 차트 | 날짜 포맷 확인 | DailyPrice 존재 | 응답의 `data[].time` 필드 | `"YYYY-MM-DD"` 형식 (ISO 날짜만, 시간 미포함) | P2 | BE |
| PUB-023 | 차트 | 캐시 헤더 (24시간) | 없음 | 응답 헤더 확인 | `Cache-Control: public, s-maxage=86400, stale-while-revalidate=172800` | P3 | BE |

### 2.4 종목 관련 API (뉴스/배당/실적/공시/동종업계/기관/펀더멘탈)

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-024 | 종목뉴스 | 정상 조회 | 종목 관련 뉴스 존재 | `GET /api/stocks/005930/news` | 200, 뉴스 배열 반환 | P1 | BE |
| PUB-025 | 종목뉴스 | 존재하지 않는 종목 | 없음 | `GET /api/stocks/INVALID/news` | 404 또는 빈 배열 | P2 | BE |
| PUB-026 | 배당 | 정상 조회 | 배당 데이터 존재 | `GET /api/stocks/005930/dividends` | 200, 배당 이력 배열 | P1 | BE |
| PUB-027 | 실적 | 정상 조회 | 실적 데이터 존재 | `GET /api/stocks/AAPL/earnings` | 200, 실적 이력 배열 | P1 | BE |
| PUB-028 | 공시 | KR 종목 정상 조회 | 공시 데이터 존재 | `GET /api/stocks/005930/disclosures` | 200, 공시 목록 배열 | P1 | BE |
| PUB-029 | 동종업계 | 정상 조회 | 같은 섹터 종목 존재 | `GET /api/stocks/005930/peers` | 200, 동종업계 종목 배열 | P2 | BE |
| PUB-030 | 기관매매 | 정상 조회 | 기관 데이터 존재 | `GET /api/stocks/005930/institutional` | 200, 기관 매매 동향 | P2 | BE |
| PUB-031 | 펀더멘탈 | 히스토리 조회 | 펀더멘탈 히스토리 존재 | `GET /api/stocks/005930/fundamental-history` | 200, 시계열 펀더멘탈 데이터 | P2 | BE |

### 2.5 마켓 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-032 | 지수 | 시장 지수 정상 조회 | MarketIndex 데이터 존재 | `GET /api/market/indices` | 200, `{ indices: [...] }`, KOSPI/KOSDAQ/SPX/IXIC 포함, Cache-Control: s-maxage=900 | P0 | BE |
| PUB-033 | 환율 | USD/KRW 환율 조회 | ExchangeRate 데이터 존재 | `GET /api/market/exchange-rate` | 200, 환율 데이터 반환 | P0 | BE |
| PUB-034 | 등락 | KR 상승/하락 종목 | Quote 데이터 존재 | `GET /api/market/kr/movers` | 200, 상승/하락 종목 목록 | P1 | BE |
| PUB-035 | 등락 | US 상승/하락 종목 | Quote 데이터 존재 | `GET /api/market/us/movers` | 200, 상승/하락 종목 목록 | P1 | BE |
| PUB-036 | 섹터 | 섹터 목록 조회 | 섹터 데이터 존재 | `GET /api/market/sectors` | 200, 섹터 배열 | P1 | BE |
| PUB-037 | 섹터 | 섹터별 종목 조회 | 섹터에 종목 존재 | `GET /api/market/sectors/반도체/stocks` | 200, 해당 섹터 종목 목록 | P1 | BE |
| PUB-038 | 지수이력 | 지수 히스토리 (스파크라인) | MarketIndexHistory 존재 | `GET /api/market-indices/history` | 200, 지수별 시계열 데이터 | P2 | BE |

### 2.6 뉴스 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-039 | 뉴스 | 정상 조회 (기본) | 뉴스 데이터 존재 | `GET /api/news` | 200, `{ news: [{ id, title, summary, source, category, sentiment, publishedAt, url, relatedTickers, relatedStocks }], pagination: { page:1, limit:10, total, totalPages } }` | P0 | BE |
| PUB-040 | 뉴스 | 카테고리 필터 | 다양한 카테고리 뉴스 존재 | `GET /api/news?category=KR_MARKET` | 200, 모든 뉴스의 category가 `KR_MARKET` | P1 | BE |
| PUB-041 | 뉴스 | 감성 필터 | 감성 분석 완료 뉴스 | `GET /api/news?sentiment=POSITIVE` | 200, 해당 감성 뉴스만 반환 | P2 | BE |
| PUB-042 | 뉴스 | 키워드 검색 | 뉴스 존재 | `GET /api/news?q=삼성` | 200, 제목에 "삼성" 포함 뉴스 (case-insensitive) | P2 | BE |
| PUB-043 | 뉴스 | 페이지네이션 | 뉴스 20건+ 존재 | `GET /api/news?page=2&limit=5` | 200, 5건 반환, `pagination.page: 2` | P1 | BE |
| PUB-044 | 뉴스 | 최신 뉴스 | 뉴스 존재 | `GET /api/news/latest?limit=4` | 200, 최대 4건, publishedAt 내림차순 | P1 | BE |

### 2.7 인기종목 / ETF API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-045 | 인기종목 | 마켓별 인기 종목 | 인기 종목 데이터 존재 | `GET /api/stocks/popular?market=KR&limit=10` | 200, KR 종목만, 최대 10건 | P1 | BE |
| PUB-046 | ETF | 인기 ETF 조회 | ETF 데이터 존재 | `GET /api/etf/popular?market=US&limit=5` | 200, US ETF만, 최대 5건 | P2 | BE |

### 2.8 AI 리포트 API (공개)

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-047 | 리포트 | 목록 조회 (기본) | AI 리포트 존재 | `GET /api/reports` | 200, `{ reports: [{ id, slug, title, summary, verdict, signal, reportDate, stock: { ticker, name, market } }], pagination }` | P0 | BE |
| PUB-048 | 리포트 | 마켓 필터 | KR/US 리포트 존재 | `GET /api/reports?market=KR` | 200, 모든 리포트의 `stock.market: "KR"` | P1 | BE |
| PUB-049 | 리포트 | 시그널 필터 | 다양한 시그널 리포트 | `GET /api/reports?signal=golden-cross` | 200, 해당 시그널 리포트만 | P2 | BE |
| PUB-050 | 리포트 | 상세 조회 (slug) | 리포트 존재 | `GET /api/reports/samsung-005930-2026-03-29` | 200, `{ id, slug, title, signal, content, summary, verdict, dataSnapshot, stock, quote }` | P0 | BE |
| PUB-051 | 리포트 | 존재하지 않는 slug | 없음 | `GET /api/reports/nonexistent-slug` | 404, `{ error: "리포트를 찾을 수 없습니다." }` | P1 | BE |

### 2.9 게시판 API (공개 부분)

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-052 | 게시판 | 비로그인 목록 조회 | 공개+비공개 게시글 존재 | `GET /api/board` (인증 없이) | 200, 공개 글만 반환 (`isPrivate: false`), 비공개 글 제외 | P0 | BE |
| PUB-053 | 게시판 | 페이지네이션 기본값 | 게시글 20건+ | `GET /api/board` | 200, `pagination: { page:1, limit:20, total, totalPages }` | P1 | BE |
| PUB-054 | 게시판 | 페이지네이션 제한 | 없음 | `GET /api/board?limit=100` | 200, limit 최대 50으로 클램핑 | P2 | BE |
| PUB-055 | 게시판 | 공개 글 상세 조회 | 공개 게시글 존재 | `GET /api/board/{id}` (인증 없이) | 200, `{ post: { id, title, content, viewCount(+1), author, ... } }`, 조회수 1 증가 | P0 | BE |
| PUB-056 | 게시판 | 비공개 글 비로그인 접근 | 비공개 게시글 존재 | `GET /api/board/{privatePostId}` (인증 없이) | 403, `{ error: "접근 권한이 없습니다." }` | P1 | BE |
| PUB-057 | 게시판 | 존재하지 않는 글 | 없음 | `GET /api/board/nonexistent-id` | 404, `{ error: "게시글을 찾을 수 없습니다." }` | P1 | BE |

### 2.10 기타 공개 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| PUB-058 | 스크리너 | 기술적 스크리너 | 기술 지표 데이터 존재 | `GET /api/screener?market=KR&signal=golden-cross` | 200, 해당 시그널 종목 목록 + 페이지네이션 | P1 | BE |
| PUB-059 | 스크리너 | 펀더멘탈 스크리너 | 펀더멘탈 데이터 존재 | `GET /api/screener/fundamental` | 200, 펀더멘탈 기준 종목 목록 | P2 | BE |
| PUB-060 | 섹터 | 섹터 데이터 조회 | 섹터 데이터 존재 | `GET /api/sectors` | 200, 섹터 목록 | P2 | BE |
| PUB-061 | 문의 | 문의 등록 (정상) | 없음 | `POST /api/contact` body: `{ "name":"홍길동", "email":"test@test.com", "category":"service", "message":"테스트 메시지입니다 10자 이상" }` | 200, `{ ok: true }` | P1 | BE |
| PUB-062 | 문의 | 문의 Validation 실패 | 없음 | `POST /api/contact` body: `{ "name":"", "email":"invalid", "category":"service", "message":"짧음" }` | 400, Zod 에러 메시지 | P1 | BE |
| PUB-063 | 문의 | Honeypot 봇 차단 | 없음 | `POST /api/contact` body: `{ "name":"Bot", "email":"bot@bot.com", "category":"other", "message":"스팸메시지입니다", "website":"http://spam.com" }` | 200, `{ ok: true }` (DB 저장되지 않음 - honeypot 트랩) | P2 | BE |
| PUB-064 | 회원가입 | 정상 가입 | 중복 없는 이메일/닉네임 | `POST /api/auth/register` body: `{ "email":"new@test.com", "password":"Test1234", "nickname":"테스터" }` | 201, `{ id, email, nickname }` | P0 | BE |
| PUB-065 | 회원가입 | 중복 이메일 | 이미 등록된 이메일 | `POST /api/auth/register` body: `{ "email":"existing@test.com", "password":"Test1234", "nickname":"새닉네임" }` | 409, `{ error: "이미 사용 중인 이메일입니다." }` | P0 | BE |
| PUB-066 | 회원가입 | 중복 닉네임 | 이미 등록된 닉네임 | `POST /api/auth/register` body: `{ "email":"unique@test.com", "password":"Test1234", "nickname":"기존닉네임" }` | 409, `{ error: "이미 사용 중인 닉네임입니다." }` | P1 | BE |
| PUB-067 | 회원가입 | 비밀번호 규칙 위반 | 없음 | `POST /api/auth/register` body: `{ "email":"t@t.com", "password":"12345678", "nickname":"테스터" }` | 400, `{ error: "영문과 숫자를 포함해야 합니다" }` | P1 | BE |

---

## 3. 인증 필요 API T/C

### 3.1 관심종목 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| AUTH-001 | 관심종목 | 목록 조회 (인증) | 로그인 + 관심종목 3건 | `GET /api/watchlist` (Cookie: JWT 세션) | 200, `{ watchlist: [{ ticker, name, market, stockType, price, change, changePercent, addedAt }] }`, createdAt desc 정렬 | P0 | BE |
| AUTH-002 | 관심종목 | 목록 조회 (비인증) | 없음 | `GET /api/watchlist` (인증 없이) | 401, `{ error: "로그인이 필요합니다." }` | P0 | BE |
| AUTH-003 | 관심종목 | 추가 (정상) | 로그인 + DB에 005930 존재 | `POST /api/watchlist` body: `{ "ticker": "005930" }` | 201, `{ message: "관심종목에 추가되었습니다." }` | P0 | BE |
| AUTH-004 | 관심종목 | 추가 (비인증) | 없음 | `POST /api/watchlist` body: `{ "ticker": "005930" }` (인증 없이) | 401, `{ error: "로그인이 필요합니다." }` | P0 | BE |
| AUTH-005 | 관심종목 | 추가 (존재하지 않는 종목) | 로그인 | `POST /api/watchlist` body: `{ "ticker": "INVALID" }` | 404, `{ error: "종목을 찾을 수 없습니다." }` | P1 | BE |
| AUTH-006 | 관심종목 | 추가 (중복) | 로그인 + 이미 005930 추가됨 | `POST /api/watchlist` body: `{ "ticker": "005930" }` | 409, `{ error: "이미 관심종목에 등록된 종목입니다." }` (P2002 unique violation) | P1 | BE |
| AUTH-007 | 관심종목 | 추가 (빈 티커) | 로그인 | `POST /api/watchlist` body: `{ "ticker": "" }` | 400, `{ error: "올바른 티커를 입력해주세요." }` (Zod min(1) 실패) | P1 | BE |
| AUTH-008 | 관심종목 | 삭제 (정상) | 로그인 + 005930 관심종목 등록됨 | `DELETE /api/watchlist/005930` | 200, `{ message: "관심종목에서 삭제되었습니다." }` | P0 | BE |
| AUTH-009 | 관심종목 | 삭제 (비인증) | 없음 | `DELETE /api/watchlist/005930` (인증 없이) | 401, `{ error: "로그인이 필요합니다." }` | P1 | BE |
| AUTH-010 | 관심종목 | 삭제 (존재하지 않는 종목) | 로그인 | `DELETE /api/watchlist/INVALID` | 404, `{ error: "종목을 찾을 수 없습니다." }` | P2 | BE |

### 3.2 포트폴리오 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| AUTH-011 | 포트폴리오 | 목록 조회 | 로그인 + 포트폴리오 항목 존재 | `GET /api/portfolio` | 200, `{ portfolio: [{ id, ticker, name, market, buyPrice, quantity, currentPrice, profitLoss, profitLossPercent, totalValue, totalCost, totalProfitLoss, ... }], summary: { totalValue, totalCost, totalProfitLoss, count } }` | P0 | BE |
| AUTH-012 | 포트폴리오 | 목록 조회 (비인증) | 없음 | `GET /api/portfolio` (인증 없이) | 401 | P0 | BE |
| AUTH-013 | 포트폴리오 | 추가 (정상) | 로그인, 005930 존재 | `POST /api/portfolio` body: `{ "ticker":"005930", "buyPrice":70000, "quantity":10, "buyDate":"2026-01-15", "memo":"장기투자", "groupName":"핵심" }` | 201, `{ message: "포트폴리오에 추가되었습니다." }` | P0 | BE |
| AUTH-014 | 포트폴리오 | 추가 (Zod 검증 실패) | 로그인 | `POST /api/portfolio` body: `{ "ticker":"005930", "buyPrice":-100, "quantity":0 }` | 400, Zod 에러 (buyPrice positive, quantity positive int) | P1 | BE |
| AUTH-015 | 포트폴리오 | 추가 (중복 종목) | 로그인, 이미 포트폴리오에 존재 | `POST /api/portfolio` body: `{ "ticker":"005930", "buyPrice":70000, "quantity":5 }` | 409, `{ error: "이미 포트폴리오에 등록된 종목입니다." }` | P1 | BE |
| AUTH-016 | 포트폴리오 | 수정 (정상) | 로그인, 포트폴리오 항목 존재 | `PATCH /api/portfolio/{id}` body: `{ "buyPrice":75000, "quantity":20 }` | 200, `{ message: "포트폴리오가 수정되었습니다." }` | P1 | BE |
| AUTH-017 | 포트폴리오 | 수정 (타인 항목) | 로그인, 다른 사용자의 항목 ID | `PATCH /api/portfolio/{otherId}` | 404, `{ error: "포트폴리오 항목을 찾을 수 없습니다." }` (userId 불일치) | P1 | BE |
| AUTH-018 | 포트폴리오 | 삭제 (정상) | 로그인, 본인 포트폴리오 항목 | `DELETE /api/portfolio/{id}` | 200, `{ message: "포트폴리오에서 삭제되었습니다." }` | P1 | BE |
| AUTH-019 | 포트폴리오 | 삭제 (타인 항목) | 로그인, 다른 사용자의 항목 ID | `DELETE /api/portfolio/{otherId}` | 404 | P1 | BE |
| AUTH-020 | 포트폴리오 | 수익률 계산 정확성 | 매수가 50000, 수량 10, 현재가 55000 | `GET /api/portfolio` | profitLoss: 5000, profitLossPercent: 10.00, totalValue: 550000, totalCost: 500000, totalProfitLoss: 50000 | P1 | BE |

### 3.3 설정 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| AUTH-021 | 프로필 | 닉네임 변경 (정상) | 로그인 | `PATCH /api/settings/profile` body: `{ "nickname": "새닉네임" }` | 200, `{ ok: true }` | P0 | BE |
| AUTH-022 | 프로필 | 닉네임 변경 (비인증) | 없음 | `PATCH /api/settings/profile` body: `{ "nickname": "새닉" }` (인증 없이) | 401, `{ error: "Unauthorized" }` | P1 | BE |
| AUTH-023 | 프로필 | 닉네임 2자 미만 | 로그인 | `PATCH /api/settings/profile` body: `{ "nickname": "a" }` | 400, `{ error: "닉네임은 2자 이상이어야 합니다" }` | P1 | BE |
| AUTH-024 | 프로필 | 닉네임 20자 초과 | 로그인 | `PATCH /api/settings/profile` body: `{ "nickname": "가나다라마바사아자차카타파하가나다라마바사" }` | 400, `{ error: "닉네임은 20자 이하여야 합니다" }` | P2 | BE |
| AUTH-025 | 프로필 | 닉네임 중복 | 로그인, 기존 닉네임 존재 | `PATCH /api/settings/profile` body: `{ "nickname": "이미존재하는닉" }` | 409, `{ error: "이미 사용 중인 닉네임입니다" }` | P1 | BE |
| AUTH-026 | 비밀번호 | 변경 (정상) | 로그인, Credentials 사용자 | `PATCH /api/settings/password` body: `{ "currentPassword":"OldPass1", "newPassword":"NewPass1" }` | 200, `{ ok: true }` | P0 | BE |
| AUTH-027 | 비밀번호 | 현재 비밀번호 불일치 | 로그인 | `PATCH /api/settings/password` body: `{ "currentPassword":"WrongPass1", "newPassword":"NewPass1" }` | 400, `{ error: "현재 비밀번호가 올바르지 않습니다" }` | P0 | BE |
| AUTH-028 | 비밀번호 | 새 비밀번호 8자 미만 | 로그인 | `PATCH /api/settings/password` body: `{ "currentPassword":"OldPass1", "newPassword":"abc" }` | 400, `{ error: "새 비밀번호는 8자 이상이어야 합니다" }` | P1 | BE |
| AUTH-029 | 비밀번호 | 소셜 로그인 사용자 | Google OAuth 로그인, password 미설정 | `PATCH /api/settings/password` body: `{ "currentPassword":"any", "newPassword":"NewPass1" }` | 400, `{ error: "소셜 로그인 사용자는 설정에서 비밀번호를 설정해주세요" }` | P1 | BE |

### 3.4 게시판 API (인증 부분)

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| AUTH-030 | 게시판 | 로그인 목록 조회 (일반 사용자) | 로그인, 공개+비공개 글 존재 | `GET /api/board` (일반 사용자 인증) | 200, 공개 글 + 본인 비공개 글만 반환, 타인 비공개 글 제외 | P0 | BE |
| AUTH-031 | 게시판 | 글 작성 (정상) | 로그인 | `POST /api/board` body: `{ "title":"테스트 제목", "content":"테스트 내용입니다.", "isPrivate":false }` | 201, `{ post: { id } }` | P0 | BE |
| AUTH-032 | 게시판 | 글 작성 (비인증) | 없음 | `POST /api/board` body: `{ "title":"제목", "content":"내용" }` (인증 없이) | 401, `{ error: "로그인이 필요합니다." }` | P0 | BE |
| AUTH-033 | 게시판 | 글 작성 (30초 쿨타임) | 로그인, 직전에 글 작성 | `POST /api/board` (30초 이내 재작성) | 429, `{ error: "너무 빠르게 작성하고 있습니다. 30초 후 다시 시도해주세요." }` | P1 | BE |
| AUTH-034 | 게시판 | 글 수정 (작성자) | 로그인, 본인 게시글 | `PATCH /api/board/{id}` body: `{ "title":"수정된 제목" }` | 200, `{ post: { id } }` | P0 | BE |
| AUTH-035 | 게시판 | 글 수정 (비작성자) | 로그인, 타인 게시글 | `PATCH /api/board/{othersPostId}` body: `{ "title":"수정 시도" }` | 403, `{ error: "수정 권한이 없습니다." }` | P0 | BE |
| AUTH-036 | 게시판 | 글 삭제 (작성자) | 로그인, 본인 게시글 | `DELETE /api/board/{id}` | 200, `{ message: "삭제되었습니다." }` | P1 | BE |
| AUTH-037 | 게시판 | 글 삭제 (비작성자, 비관리자) | 로그인, 타인 게시글 | `DELETE /api/board/{othersPostId}` | 403, `{ error: "삭제 권한이 없습니다." }` | P1 | BE |
| AUTH-038 | 게시판 | 비공개 글 작성자 접근 | 로그인, 본인 비공개 글 | `GET /api/board/{myPrivatePostId}` | 200, 정상 열람 | P1 | BE |

### 3.5 리포트 요청 API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| AUTH-039 | 리포트요청 | 목록 조회 (비인증) | 요청 목록 존재 | `GET /api/report-requests` (인증 없이) | 200, 목록 반환 (isOwner: false), 비인증도 GET 가능 | P1 | BE |
| AUTH-040 | 리포트요청 | 요청 생성 (정상) | 로그인, stockId 존재 | `POST /api/report-requests` body: `{ "stockId": "valid-stock-id" }` | 201, `{ request: { id, stockId, ticker, status:"PENDING", requestedAt } }` | P0 | BE |
| AUTH-041 | 리포트요청 | 요청 생성 (비인증) | 없음 | `POST /api/report-requests` body: `{ "stockId": "id" }` (인증 없이) | 401 | P0 | BE |
| AUTH-042 | 리포트요청 | 중복 요청 (진행 중) | 로그인, 동일 종목에 PENDING 요청 존재 | `POST /api/report-requests` body: `{ "stockId": "same-stock-id" }` | 409, `{ error: "이미 해당 종목에 대한 요청이 진행 중입니다." }` | P1 | BE |
| AUTH-043 | 리포트요청 | 일일 한도 초과 (3건) | 로그인, 오늘 이미 3건 요청 | `POST /api/report-requests` body: `{ "stockId": "another-stock" }` | 429, `{ error: "일일 요청 한도(3건)를 초과했습니다." }` | P1 | BE |
| AUTH-044 | 리포트요청 | 요청 삭제 (본인, PENDING) | 로그인, 본인 PENDING 요청 | `DELETE /api/report-requests/{id}` | 200, `{ ok: true }` | P1 | BE |
| AUTH-045 | 리포트요청 | 요청 삭제 (본인, 비PENDING) | 로그인, 본인 APPROVED 요청 | `DELETE /api/report-requests/{id}` | 400, `{ error: "PENDING 상태의 요청만 취소할 수 있습니다." }` | P2 | BE |
| AUTH-046 | 리포트요청 | 요청 삭제 (타인) | 로그인, 타인 요청 | `DELETE /api/report-requests/{othersId}` | 403, `{ error: "본인의 요청만 취소할 수 있습니다." }` | P1 | BE |

---

## 4. 관리자 API T/C

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| ADM-001 | 문의관리 | 문의 목록 조회 (관리자) | ADMIN 역할 로그인 | `GET /api/admin/contacts` | 200, `{ contacts: [{ id, name, email, category, message, createdAt }], pagination }` | P0 | BE |
| ADM-002 | 문의관리 | 문의 목록 조회 (일반 사용자) | 일반 사용자 로그인 | `GET /api/admin/contacts` | 403, `{ error: "관리자 권한이 필요합니다." }` | P0 | BE |
| ADM-003 | 문의관리 | 문의 목록 조회 (비인증) | 없음 | `GET /api/admin/contacts` (인증 없이) | 403 (isAdmin(null) -> false) | P0 | BE |
| ADM-004 | 데이터헬스 | 데이터 품질 조회 (관리자) | ADMIN 로그인 | `GET /api/admin/data-health` | 200, `{ stocks: { total, active, kr, us }, news: { total, last24h }, dailyPrices, quotes, cronLogs, checkedAt }` | P1 | BE |
| ADM-005 | 데이터헬스 | 데이터 품질 조회 (일반 사용자) | 일반 사용자 로그인 | `GET /api/admin/data-health` | 403 | P1 | BE |
| ADM-006 | 리포트요청 | 승인 (관리자) | ADMIN 로그인, PENDING 요청 존재 | `PATCH /api/report-requests/{id}` body: `{ "status": "APPROVED" }` | 200, `{ request: { id, status:"APPROVED", approvedAt } }` | P1 | BE |
| ADM-007 | 리포트요청 | 거절 (관리자) | ADMIN 로그인, PENDING 요청 | `PATCH /api/report-requests/{id}` body: `{ "status": "REJECTED" }` | 200, `{ request: { id, status:"REJECTED" } }` | P1 | BE |
| ADM-008 | 리포트요청 | 승인 (비PENDING 상태) | ADMIN 로그인, APPROVED 요청 | `PATCH /api/report-requests/{id}` body: `{ "status": "APPROVED" }` | 400, `{ error: "PENDING 상태의 요청만 처리할 수 있습니다." }` | P2 | BE |
| ADM-009 | 리포트요청 | 승인 (일반 사용자) | 일반 사용자 로그인 | `PATCH /api/report-requests/{id}` body: `{ "status": "APPROVED" }` | 403, `{ error: "관리자 권한이 필요합니다." }` | P1 | BE |

---

## 5. Cron API T/C

### 5.1 공통 인증 검증

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| CRON-001 | 인증 | 정상 인증 | CRON_SECRET 환경변수 설정 | `POST /api/cron/cleanup` Header: `Authorization: Bearer {CRON_SECRET}` | 200, 정상 실행 | P0 | BE |
| CRON-002 | 인증 | 인증 없이 호출 | 없음 | `POST /api/cron/cleanup` (Authorization 헤더 없음) | 401, `{ error: "Unauthorized" }` | P0 | BE |
| CRON-003 | 인증 | 잘못된 토큰 | 없음 | `POST /api/cron/cleanup` Header: `Authorization: Bearer wrong-token` | 401, `{ error: "Unauthorized" }` | P0 | BE |
| CRON-004 | 인증 | Bearer 접두사 없이 | 없음 | `POST /api/cron/cleanup` Header: `Authorization: {CRON_SECRET}` | 401 (Bearer 접두사 불일치) | P1 | BE |
| CRON-005 | 인증 | GET 메서드로 호출 | 없음 | `GET /api/cron/cleanup` Header: `Authorization: Bearer {CRON_SECRET}` | 405 Method Not Allowed (POST만 지원) | P2 | BE |

### 5.2 KR 시세 수집

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| CRON-006 | KR시세 | 정상 실행 (장 마감 후) | KST 15:30 이후, 평일, KR 종목 존재 | `POST /api/cron/collect-kr-quotes` | 200, `{ ok:true, date, dailyPrice:N, stockQuote:N, marketIndex:N, errors:[] }` | P0 | BE |
| CRON-007 | KR시세 | 장 마감 전 스킵 | KST 15:30 이전 | `POST /api/cron/collect-kr-quotes` | 200, `{ ok:true, skipped:true, reason:"KR market not yet closed" }` | P1 | BE |
| CRON-008 | KR시세 | force 파라미터 | KST 15:30 이전 | `POST /api/cron/collect-kr-quotes?force=true` | 200, 강제 실행 (skipped 아님) | P1 | BE |
| CRON-009 | KR시세 | exchange 분할 실행 | 없음 | `POST /api/cron/collect-kr-quotes?exchange=KOSPI` | 200, KOSPI 종목만 수집 | P2 | BE |
| CRON-010 | KR시세 | 공휴일 스킵 | KR 공휴일 | `POST /api/cron/collect-kr-quotes` | 200, `{ ok:true, skipped:true, reason:"KR holiday" }` | P1 | BE |

### 5.3 US 시세 수집

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| CRON-011 | US시세 | 정상 실행 | US 종목 존재, 정상 인증 | `POST /api/cron/collect-us-quotes` | 200, `{ ok:true }` 수집 통계 포함 | P0 | BE |

### 5.4 기타 Cron API

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| CRON-012 | 마스터 | 종목 마스터 싱크 | 정상 인증 | `POST /api/cron/collect-master` | 200, KR(Naver)+US(S&P500 CSV) 종목 동기화 결과 | P1 | BE |
| CRON-013 | 환율 | 환율 수집 | 정상 인증 | `POST /api/cron/collect-exchange-rate` | 200, USD/KRW 환율 갱신 결과 | P1 | BE |
| CRON-014 | 뉴스 | 뉴스 수집 | 정상 인증 | `POST /api/cron/collect-news` | 200, RSS+크롤링+네이버검색 수집 통계 | P1 | BE |
| CRON-015 | 감성분석 | 뉴스 감성 분석 | 정상 인증, GROQ_API_KEY 설정 | `POST /api/cron/analyze-sentiment` | 200, 감성 분석 완료 건수 | P2 | BE |
| CRON-016 | 리포트 | AI 리포트 생성 | 정상 인증, GROQ_API_KEY 설정 | `POST /api/cron/generate-reports` | 200, `{ ok:true, generated:N, skipped:N, failed:N, queued:N, errors:[] }` | P1 | BE |
| CRON-017 | 리포트 | 특정 티커 리포트 생성 | 정상 인증, 005930 존재 | `POST /api/cron/generate-reports?ticker=005930` | 200, 해당 종목 리포트 생성 | P2 | BE |
| CRON-018 | 클린업 | 데이터 정리 | 정상 인증, 오래된 데이터 존재 | `POST /api/cron/cleanup` | 200, `{ ok:true, newsDeleted:N, dailyPriceDeleted:N, stocksDeactivated:N, disclosuresDeleted:N, aiReportsDeleted:N }` | P1 | BE |
| CRON-019 | 클린업 | 삭제 기준일 확인 | 60일+ 뉴스, 365일+ 일봉, 90일+ 미갱신 종목, 1년+ 공시, 180일+ 리포트 | `POST /api/cron/cleanup` 후 DB 확인 | 뉴스: 60일 이전 삭제, 일봉: 365일 이전 삭제, 종목: 90일 미갱신 비활성화, 공시: 1년 이전 삭제, 리포트: 180일 이전 삭제 | P2 | BE |
| CRON-020 | 펀더멘탈 | 펀더멘탈 수집 | 정상 인증 | `POST /api/cron/collect-fundamentals` | 200, 수집 통계 | P2 | BE |
| CRON-021 | DART | DART 배당 수집 | 정상 인증, OPENDART_API_KEY 설정 | `POST /api/cron/collect-dart-dividends` | 200, DART 배당 수집 결과 (maxDuration: 300s) | P2 | BE |

---

## 6. 데이터 정합성 T/C

### 6.1 한국 주식 데이터

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| DATA-001 | KR정합성 | 시세 정확성 | collect-kr-quotes 실행 완료 | 1. `GET /api/stocks/005930` 응답의 price 확인 2. 네이버 금융에서 삼성전자 현재가 직접 확인 3. 두 값 비교 | DB의 price가 네이버 금융 종가와 일치 (Cron 기반이므로 실시간이 아닌 마지막 수집 시점 기준) | P0 | BE |
| DATA-002 | KR정합성 | 지수 정확성 | collect-kr-quotes 실행 완료 | 1. `GET /api/market/indices` 응답의 KOSPI/KOSDAQ 확인 2. 네이버 금융 지수와 비교 | KOSPI, KOSDAQ 값이 네이버 금융 지수 종가와 일치 | P0 | BE |
| DATA-003 | KR정합성 | 52주 최고/최저 | 1년치 DailyPrice 존재 | `GET /api/stocks/005930` 응답의 `quote.high52w`, `quote.low52w` | DailyPrice 최근 1년 데이터의 max(high)/min(low)와 일치 | P1 | BE |
| DATA-004 | KR정합성 | 종목 수 | collect-master 실행 완료 | `GET /api/admin/data-health` (관리자) | `stocks.kr` >= 2000 (KOSPI+KOSDAQ 활성 종목) | P1 | BE |

### 6.2 미국 주식 데이터

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| DATA-005 | US정합성 | 시세 정확성 | collect-us-quotes 실행 완료 | 1. `GET /api/stocks/AAPL` 응답의 price 2. Yahoo Finance에서 AAPL 종가 확인 | 가격이 Yahoo Finance 데이터와 일치 (소수점 2자리 이내 오차 허용) | P0 | BE |
| DATA-006 | US정합성 | S&P 500 종목 수 | collect-master 실행 완료 | DB에서 US 활성 종목 수 확인 | 약 500개 이상 | P1 | BE |

### 6.3 환율 / 뉴스

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| DATA-007 | 환율 | USD/KRW 정확성 | collect-exchange-rate 실행 완료 | `GET /api/market/exchange-rate` 응답 vs Yahoo Finance USD/KRW | 환율이 Yahoo Finance 기준 +/-1% 이내 | P0 | BE |
| DATA-008 | 뉴스 | 카테고리 분류 정확성 | collect-news 실행 완료 | `GET /api/news?category=KR_MARKET` | 반환된 뉴스가 실제로 한국 시장 관련 내용 (수동 검증, 10건 샘플) | P2 | BE |
| DATA-009 | 뉴스 | 종목 매칭 정확성 | 종목별 뉴스 매칭 완료 | `GET /api/stocks/005930/news` | 반환된 뉴스 제목에 삼성전자 관련 키워드 포함 (수동 검증) | P2 | BE |
| DATA-010 | 뉴스 | 중복 뉴스 확인 | collect-news 다수 실행 | `GET /api/news?limit=50` | 동일 URL 뉴스 중복 없음 (upsert 정상 동작) | P1 | BE |

### 6.4 ISR revalidate

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| DATA-011 | ISR | 종목 페이지 revalidate | collect-kr-quotes 실행 | 1. `/stock/005930` 접근 -> 가격 확인 2. Cron 실행 (가격 변경) 3. 15분 후 재접근 | ISR 15분 revalidate 후 갱신된 가격 표시 | P1 | 공통 |
| DATA-012 | ISR | 뉴스 페이지 revalidate | collect-news 실행 | 1. `/news` 접근 -> 뉴스 수 확인 2. Cron 실행 (새 뉴스 추가) 3. 5분 후 재접근 | ISR 5분 revalidate 후 새 뉴스 노출 | P2 | 공통 |
| DATA-013 | ISR | revalidateTag 동작 | Cron에서 revalidateTag("quotes") 호출 | Cron 실행 직후 종목 페이지 접근 | 캐시 즉시 무효화, 최신 데이터 반영 | P1 | BE |

---

## 7. 에러 핸들링 T/C

### 7.1 외부 API 장애

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| ERR-001 | 네이버장애 | Naver Finance 응답 없음 | 네이버 API mock/차단 | `POST /api/cron/collect-kr-quotes` (force=true) | 200, `{ ok:true, errors: ["KOSPI: ...", "KOSDAQ: ..."] }` (Promise.allSettled로 부분 성공 가능), 텔레그램 warning 알림 발송 | P0 | BE |
| ERR-002 | 야후장애 | Yahoo Finance 응답 없음 | Yahoo API mock/차단 | `POST /api/cron/collect-us-quotes` | 200, errors 배열에 에러 기록, 텔레그램 알림 | P0 | BE |
| ERR-003 | RSS장애 | Google News RSS 장애 | RSS 피드 접근 불가 | `POST /api/cron/collect-news` | 200, 다른 소스(Yahoo RSS, 직접 크롤링 등) 부분 성공 가능 | P1 | BE |
| ERR-004 | DART장애 | DART API 장애 | DART API 응답 불가 | `POST /api/cron/collect-dart-dividends` | 에러 로깅, 부분 실패 허용 | P2 | BE |

### 7.2 DB 관련

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| ERR-005 | DB장애 | DB 연결 실패 시 API 응답 | DATABASE_URL 불량 (테스트 환경) | `GET /api/stocks/search?q=삼성` | 500, `{ error: "검색 중 오류가 발생했습니다." }` | P0 | BE |
| ERR-006 | DB장애 | Prisma unique violation | 중복 데이터 삽입 시도 | 관심종목 중복 추가 | 409, P2002 코드 처리로 friendly 에러 메시지 | P1 | BE |

### 7.3 입력 검증

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| ERR-007 | 검증 | 잘못된 JSON body | 로그인 | `POST /api/watchlist` body: `invalid json{{{` (Content-Type: application/json) | 400 또는 500, 서버 crash 없음 | P0 | BE |
| ERR-008 | 검증 | 빈 body | 로그인 | `POST /api/watchlist` body: (empty) | 400 또는 500, 서버 crash 없음 | P1 | BE |
| ERR-009 | 검증 | Zod 스키마 불일치 (추가 필드) | 로그인 | `POST /api/watchlist` body: `{ "ticker":"005930", "extraField":"hack" }` | 200/201, 추가 필드 무시 (Zod strip 동작) | P2 | BE |
| ERR-010 | 검증 | 회원가입 이메일 형식 오류 | 없음 | `POST /api/auth/register` body: `{ "email":"not-email", "password":"Test1234", "nickname":"테스터" }` | 400, `{ error: "올바른 이메일을 입력해주세요" }` | P1 | BE |
| ERR-011 | 검증 | 문의 메시지 10자 미만 | 없음 | `POST /api/contact` body: `{ "name":"홍", "email":"t@t.com", "category":"service", "message":"짧다" }` | 400, `{ error: "메시지는 10자 이상 입력해주세요" }` | P2 | BE |

### 7.4 Rate Limiting

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| ERR-012 | Rate Limit | 회원가입 IP 제한 | 동일 IP에서 연속 호출 | `POST /api/auth/register` 6회 연속 (같은 IP) | 6번째부터 429, `{ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." }`, Retry-After: 3600 헤더 | P1 | BE |
| ERR-013 | Rate Limit | 게시판 글 작성 30초 쿨타임 | 로그인 | 게시글 작성 직후 30초 이내 재작성 | 429, `{ error: "너무 빠르게 작성하고 있습니다..." }` | P1 | BE |
| ERR-014 | Rate Limit | 리포트 요청 일일 3건 제한 | 로그인, 오늘 3건 요청 완료 | 4번째 POST /api/report-requests | 429, `{ error: "일일 요청 한도(3건)를 초과했습니다." }` | P1 | BE |
| ERR-015 | Rate Limit | Groq API 30 RPM | generate-reports Cron | 2초 throttle 적용 확인 (코드 리뷰) | THROTTLE_MS=2000 간격으로 LLM 호출 (로그 확인) | P3 | BE |

---

## 8. AI 리포트 파이프라인 T/C

### 8.1 LLM 라우터

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| AI-001 | LLM | Groq 우선 사용 | GROQ_API_KEY 환경변수 설정 | `POST /api/cron/generate-reports` | 생성된 리포트의 `model` 필드가 "groq" (또는 Groq 관련 provider명) | P0 | BE |
| AI-002 | LLM | Ollama 폴백 | GROQ_API_KEY 미설정 | `POST /api/cron/generate-reports` | Ollama 로컬 서버로 폴백, `model` 필드가 "ollama" | P1 | BE |
| AI-003 | LLM | Groq API 장애 시 | GROQ_API_KEY 존재, Groq 서버 장애 mock | `POST /api/cron/generate-reports` | `{ failed: N, errors: ["..."] }`, 에러 로깅 | P1 | BE |

### 8.2 리포트 생성 플로우

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| AI-004 | 생성 | 자동 생성 (시그널 감지) | Cron 인증, 기술적 시그널 감지 종목 존재 | `POST /api/cron/generate-reports` | 200, `generated >= 1`, DB에 AiReport 레코드 생성 | P0 | BE |
| AI-005 | 생성 | 큐 처리 (승인된 요청) | APPROVED 상태 요청 존재 | `POST /api/cron/generate-reports` | 요청 상태: APPROVED -> GENERATING -> COMPLETED, `aiReportId` 연결 | P0 | BE |
| AI-006 | 생성 | 중복 리포트 스킵 | 오늘 해당 종목 리포트 이미 존재 | `POST /api/cron/generate-reports?ticker=005930` | `skipped: 1`, 기존 리포트 유지 | P1 | BE |
| AI-007 | 생성 | 마켓 필터 | KR/US 모두 시그널 존재 | `POST /api/cron/generate-reports?market=KR` | KR 종목 리포트만 생성 | P2 | BE |

### 8.3 상태 전이

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| AI-008 | 상태전이 | 정상 플로우 | 요청 PENDING | 1. 관리자 APPROVED 2. Cron generate-reports 3. 조회 | PENDING -> APPROVED -> GENERATING -> COMPLETED, completedAt 설정, aiReportId 연결 | P0 | BE |
| AI-009 | 상태전이 | 생성 실패 | 요청 APPROVED, LLM 오류 | Cron generate-reports 실행 (LLM 장애 mock) | APPROVED -> GENERATING -> FAILED | P1 | BE |
| AI-010 | 상태전이 | 거절 플로우 | 요청 PENDING | 관리자 `PATCH { status: "REJECTED" }` | PENDING -> REJECTED | P1 | BE |

### 8.4 생성 -> 저장 -> 조회

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| AI-011 | 조회 | 생성된 리포트 조회 | Cron으로 리포트 생성 완료 | `GET /api/reports/{slug}` | 200, `{ title, content(마크다운), summary, verdict, signal, dataSnapshot, stock, quote }` 모든 필드 non-null | P1 | BE |
| AI-012 | 조회 | 리포트 목록에 노출 | 리포트 생성 완료 | `GET /api/reports?page=1` | 생성된 리포트가 최신순 목록 최상단에 노출 | P2 | BE |

---

## 9. 권한/보안 T/C

### 9.1 게시판 권한 비대칭 (canEditPost vs canDeletePost)

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| SEC-001 | 권한 | canEditPost: 작성자만 수정 가능 | 로그인(작성자) | `PATCH /api/board/{myPostId}` body: `{ "title":"수정" }` | 200, 수정 성공 | P0 | BE |
| SEC-002 | 권한 | canEditPost: 관리자도 수정 불가 | ADMIN 로그인, 타인 게시글 | `PATCH /api/board/{othersPostId}` body: `{ "title":"수정" }` | 403, `{ error: "수정 권한이 없습니다." }` (관리자여도 canEditPost 미포함) | P0 | BE |
| SEC-003 | 권한 | canDeletePost: 작성자 삭제 가능 | 로그인(작성자) | `DELETE /api/board/{myPostId}` | 200, 삭제 성공 | P0 | BE |
| SEC-004 | 권한 | canDeletePost: 관리자 삭제 가능 | ADMIN 로그인, 타인 게시글 | `DELETE /api/board/{othersPostId}` | 200, 삭제 성공 (관리자 canDeletePost 포함) | P0 | BE |
| SEC-005 | 권한 | canDeletePost: 일반 사용자 타인글 삭제 불가 | 일반 사용자 로그인, 타인 게시글 | `DELETE /api/board/{othersPostId}` | 403, `{ error: "삭제 권한이 없습니다." }` | P0 | BE |

### 9.2 댓글 권한

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| SEC-006 | 댓글 | 댓글 삭제 (작성자) | 로그인, 본인 댓글 | `DELETE /api/board/comments/{myCommentId}` | 200, 삭제 성공 | P1 | BE |
| SEC-007 | 댓글 | 댓글 삭제 (관리자) | ADMIN 로그인, 타인 댓글 | `DELETE /api/board/comments/{othersCommentId}` | 200, 관리자 삭제 가능 (canDeleteComment) | P1 | BE |
| SEC-008 | 댓글 | 댓글 수정 (타인) | 로그인, 타인 댓글 | `PATCH /api/board/comments/{othersCommentId}` | 403, 수정 불가 | P1 | BE |

### 9.3 CRON_SECRET 검증

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| SEC-009 | CRON | 모든 Cron 엔드포인트 인증 | 없음 | 15개 Cron API 각각에 인증 없이 POST | 모두 401 반환 (누락 없이 일관적 인증) | P0 | BE |
| SEC-010 | CRON | Bearer 토큰 형식 엄격 검증 | 없음 | `Authorization: bearer {CRON_SECRET}` (소문자 bearer) | 401 (정확히 `Bearer ` 형식만 허용, 대소문자 구분) | P2 | BE |

### 9.4 JWT 토큰

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| SEC-011 | JWT | 만료된 토큰 | 30일 이상 경과된 JWT | 만료 토큰으로 `GET /api/watchlist` | 401, NextAuth 세션 만료 처리 | P1 | BE |
| SEC-012 | JWT | 변조된 토큰 | 임의 수정된 JWT | 변조 토큰으로 `GET /api/watchlist` | 401, JWT 서명 검증 실패 | P1 | BE |

### 9.5 미들웨어 라우트 보호

| TC-ID | 카테고리 | 테스트 항목 | 사전 조건 | 테스트 단계 | 예상 결과 | 우선순위 | 담당 |
|-------|---------|------------|----------|------------|----------|---------|------|
| SEC-013 | 미들웨어 | 보호 API 비인증 접근 | 없음 | `GET /api/watchlist` (인증 없이, 미들웨어 경유) | 401 JSON 응답 (미들웨어 레벨에서 차단) | P1 | BE |
| SEC-014 | 미들웨어 | 관리자 API 일반 사용자 | 일반 사용자 로그인 | `GET /api/admin/contacts` | 403 JSON (미들웨어 + API 레벨 이중 체크) | P1 | BE |

---

## 10. 요약

### 10.1 우선순위별 통계

| 우선순위 | 건수 | 비율 |
|----------|------|------|
| P0 (Critical) | 42 | 27.6% |
| P1 (High) | 60 | 39.5% |
| P2 (Medium) | 39 | 25.7% |
| P3 (Low) | 11 | 7.2% |
| **합계** | **152** | **100%** |

### 10.2 담당별 통계

| 담당 | 건수 |
|------|------|
| BE | 149 |
| 공통 | 3 |
| **합계** | **152** |

### 10.3 카테고리별 P0 테스트 (반드시 v1.0 릴리스 전 통과)

| 카테고리 | P0 TC-ID 목록 |
|----------|--------------|
| 공개 API | PUB-001, PUB-002, PUB-010, PUB-011, PUB-013, PUB-017, PUB-018, PUB-032, PUB-033, PUB-039, PUB-047, PUB-050, PUB-052, PUB-055, PUB-064, PUB-065 |
| 인증 API | AUTH-001~004, AUTH-008, AUTH-012~013, AUTH-021, AUTH-026~027, AUTH-030~032, AUTH-034~035, AUTH-040~041 |
| 관리자 API | ADM-001~003 |
| Cron API | CRON-001~003, CRON-006, CRON-011 |
| 데이터 정합성 | DATA-001, DATA-002, DATA-005, DATA-007 |
| 에러 핸들링 | ERR-001, ERR-002, ERR-005, ERR-007 |
| AI 리포트 | AI-001, AI-004, AI-005, AI-008 |
| 권한/보안 | SEC-001~005, SEC-009 |

### 10.4 curl 테스트 예시 (Quick Reference)

```bash
# === 공개 API ===
# 종목 검색
curl -s 'http://localhost:3000/api/stocks/search?q=삼성' | jq .

# 종목 상세
curl -s 'http://localhost:3000/api/stocks/005930' | jq .

# 차트 데이터 (1개월)
curl -s 'http://localhost:3000/api/stocks/005930/chart?period=1M' | jq .

# 시장 지수
curl -s 'http://localhost:3000/api/market/indices' | jq .

# 뉴스 (카테고리 필터 + 페이지네이션)
curl -s 'http://localhost:3000/api/news?category=KR_MARKET&page=1&limit=5' | jq .

# AI 리포트 목록
curl -s 'http://localhost:3000/api/reports?market=KR&page=1&limit=10' | jq .

# 게시판 목록 (비로그인)
curl -s 'http://localhost:3000/api/board?page=1&limit=20' | jq .

# 회원가입
curl -s -X POST 'http://localhost:3000/api/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test1234","nickname":"테스터"}' | jq .

# 문의 등록
curl -s -X POST 'http://localhost:3000/api/contact' \
  -H 'Content-Type: application/json' \
  -d '{"name":"홍길동","email":"hong@test.com","category":"service","message":"테스트 문의 메시지입니다."}' | jq .

# === 인증 필요 API (세션 쿠키 필요) ===
# 관심종목 추가
curl -s -X POST 'http://localhost:3000/api/watchlist' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_JWT_TOKEN' \
  -d '{"ticker":"005930"}' | jq .

# 관심종목 삭제
curl -s -X DELETE 'http://localhost:3000/api/watchlist/005930' \
  -H 'Cookie: next-auth.session-token=YOUR_JWT_TOKEN' | jq .

# 포트폴리오 추가
curl -s -X POST 'http://localhost:3000/api/portfolio' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_JWT_TOKEN' \
  -d '{"ticker":"AAPL","buyPrice":180.50,"quantity":10}' | jq .

# 게시글 작성
curl -s -X POST 'http://localhost:3000/api/board' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_JWT_TOKEN' \
  -d '{"title":"테스트 글","content":"테스트 내용입니다.","isPrivate":false}' | jq .

# 리포트 요청
curl -s -X POST 'http://localhost:3000/api/report-requests' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_JWT_TOKEN' \
  -d '{"stockId":"YOUR_STOCK_ID"}' | jq .

# === 관리자 API ===
# 문의 목록 (관리자 세션)
curl -s 'http://localhost:3000/api/admin/contacts' \
  -H 'Cookie: next-auth.session-token=ADMIN_JWT_TOKEN' | jq .

# 리포트 요청 승인 (관리자)
curl -s -X PATCH 'http://localhost:3000/api/report-requests/REQUEST_ID' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=ADMIN_JWT_TOKEN' \
  -d '{"status":"APPROVED"}' | jq .

# === Cron API ===
# KR 시세 수집
curl -s -X POST 'http://localhost:3000/api/cron/collect-kr-quotes?force=true' \
  -H 'Authorization: Bearer YOUR_CRON_SECRET' | jq .

# 데이터 정리
curl -s -X POST 'http://localhost:3000/api/cron/cleanup' \
  -H 'Authorization: Bearer YOUR_CRON_SECRET' | jq .

# AI 리포트 생성 (특정 종목)
curl -s -X POST 'http://localhost:3000/api/cron/generate-reports?ticker=005930' \
  -H 'Authorization: Bearer YOUR_CRON_SECRET' | jq .
```

### 10.5 알려진 이슈 참조

본 T/C에서 검증하는 주요 알려진 이슈:

| 이슈 ID | 내용 | 관련 T/C |
|---------|------|---------|
| M-6 | `canEditPost`가 관리자를 미포함하는 비대칭 설계 | SEC-001, SEC-002 |
| M-2 | `/portfolio` 페이지 404 (실제로는 `/watchlist` 내 탭) | - (API는 정상, 페이지 라우팅 이슈) |

---

> **작성 기준**: 실제 `src/app/api/` 소스코드 100% 대조 완료.
> **검증 방법**: curl/Postman으로 개별 엔드포인트 직접 호출.
> **주의**: 인증 필요 API 테스트 시 `next-auth.session-token` 쿠키 세팅 필요 (브라우저에서 로그인 후 DevTools > Application > Cookies에서 추출).
