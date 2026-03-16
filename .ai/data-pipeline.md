# Data Pipeline Specification: StockView

> 데이터 수집 → 저장 → 조회 → 정리의 전체 라이프사이클 정의
> 핵심 원칙: **모든 데이터는 Cron이 DB에 적재한 것만 서빙한다. 사용자 요청 시 외부 API를 직접 호출하지 않는다.**

---

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                     데이터 흐름 (단방향)                       │
│                                                             │
│  [외부 API]  ──Cron──▶  [PostgreSQL DB]  ──API Route──▶  [클라이언트] │
│                                                             │
│  KRX 비공식 API    ┌─ StockQuote (최신 시세)                  │
│  Yahoo Finance     │  DailyPrice (일봉 히스토리)               │
│  Alpha Vantage     │  MarketIndex (지수)                     │
│  NewsAPI / RSS     │  ExchangeRate (환율)                    │
│  한국은행 API       └─ News + StockNews (뉴스)                │
│                                                             │
│  ※ API Route는 DB만 읽는다 (Read-Only)                       │
│  ※ 외부 API 호출은 Cron Job에서만 발생한다                     │
└─────────────────────────────────────────────────────────────┘
```

**왜 이렇게 하는가?**
- 사용자 요청 시 외부 API를 호출하면: 응답 시간 불안정, Rate Limit 위험, 장애 전파
- DB에서만 서빙하면: 일관된 응답 속도 (< 100ms), 외부 장애와 무관, 캐싱 로직 단순

---

## 2. 수집 대상 범위

### 2.1 종목 마스터 (Stock 테이블)

| 시장 | 수집 범위 | 예상 종목 수 | 기준 |
|------|----------|-------------|------|
| 한국 KOSPI | 전체 상장 종목 | ~950개 | KRX 상장 목록 |
| 한국 KOSDAQ | 전체 상장 종목 | ~1,700개 | KRX 상장 목록 |
| 미국 NYSE | 시가총액 상위 500 | 500개 | 시총 기준 필터 |
| 미국 NASDAQ | 시가총액 상위 500 | 500개 | 시총 기준 필터 |

**총 관리 종목: ~3,650개**

> MVP 초기에는 한국 전체 + 미국 S&P 500 구성종목(503개)으로 시작하고,
> 사용자가 검색한 미국 종목을 Stock 테이블에 동적으로 추가하는 전략도 병행.

### 2.2 시세 데이터 (StockQuote 테이블)

| 항목 | 수집 대상 | 비고 |
|------|----------|------|
| 한국 시세 | Stock 테이블의 KR 전체 | ~2,650개 |
| 미국 시세 | Stock 테이블의 US 전체 | ~1,000개 |
| 장전/장후 | 미국 종목만 | preMarketPrice, postMarketPrice |

### 2.3 일봉 데이터 (DailyPrice 테이블)

| 항목 | 보관 기간 | 레코드 수 (종목당) |
|------|----------|------------------|
| 최근 3주 일봉 | 3주 (영업일 ~15일) | ~15개 |
| 신규 일봉 추가 | 매일 장마감 후 1건 | - |

**총 레코드 추정: 3,650종목 x 15일 = ~54,750 rows**

> **DB 용량 전략**: Supabase 무료 티어 = 500MB.
> 3주치 일봉 + 인덱스 ≈ **~15MB** → 무료 티어로 충분.
> 차트는 최대 3주(15영업일)까지만 제공, 장기 차트는 Post-MVP.

### 2.4 뉴스 (News 테이블)

| 항목 | 내용 |
|------|------|
| 한국 뉴스 | 키워드: "코스피", "코스닥", "주식", "증권", 주요 종목명 상위 30개 |
| 미국 뉴스 | 키워드: "stock market", "S&P 500", "NASDAQ", 주요 종목명 상위 30개 |
| 수집 건수 | 크론 1회당 최대 50건 (중복 제거 후) |
| 보관 기간 | 3주 (21일, 이후 자동 삭제) |
| 최대 보관 건수 | ~1,680건 (50건 x 48회/일 x 21일 ÷ 30일) |

### 2.5 지수 & 환율

| 항목 | 대상 |
|------|------|
| 지수 | KOSPI, KOSDAQ, S&P 500, NASDAQ Composite — 4개 |
| 환율 | USD/KRW — 1개 |

---

## 3. 수집 스케줄 (Cron Jobs)

> **스케줄링 인프라: GitHub Actions**
> Vercel Cron은 Hobby 플랜 1일 1회, Pro 플랜도 1시간 1회로 제한되어
> 5분/15분/30분 주기 스케줄에 부적합. GitHub Actions (무료 2,000분/월)를 사용하여
> 스케줄에 따라 Next.js API Route를 HTTP로 호출하는 방식을 채택.
>
> ```yaml
> # .github/workflows/cron-kr-quote.yml 예시
> on:
>   schedule:
>     - cron: '*/15 0-6 * * 1-5'  # UTC
> jobs:
>   trigger:
>     runs-on: ubuntu-latest
>     steps:
>       - run: curl -X POST "${{ secrets.APP_URL }}/api/cron/kr-quote" -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
> ```

### 3.1 타임라인 (KST 기준)

```
                 한국장                               미국장
          ┌──────────────────┐              ┌──────────────────────┐
06:00     09:00          15:30  16:00       22:30              05:00  06:15
  │         │               │     │           │                  │     │
  ▼         ▼               ▼     ▼           ▼                  ▼     ▼
[종목마스터]              [KR장마감]                          [US장마감1회]
[뉴스2시간 ─────────────── 상시 운영 ──────────────────────────── 뉴스2시간]
[환율4회 ── 09:00/12:00/15:00/18:00 ──]
```

### 3.2 상세 Cron 스케줄

| Job ID | 작업명 | Cron 표현식 | 실행 시간 (KST) | 대상 | 비고 |
|--------|--------|------------|-----------------|------|------|
| `cron-kr-quotes` | 한국 시세+일봉 수집 | `0 7 * * 1-5` (UTC) | 16:00 KST, 1회 | KR 전체 ~2,650종목 | KRX 비공식 API, OHLCV+시총+PER/PBR+지수 일괄 수집 |
| `cron-us-quotes` | 미국 시세+일봉 수집 | `15 21 * * 1-5` (UTC) | 06:15 KST, 장마감 후 1회 | US 전체 ~1,000종목 | Yahoo Finance. StockQuote upsert + DailyPrice INSERT |
| `cron-exchange` | 환율 수집 | `0 0,3,6,9 * * 1-5` (UTC) | 09:00/12:00/15:00/18:00 KST, 1일 4회 | USD/KRW 1개 | Yahoo Finance (KRW=X) |
| `cron-news` | 뉴스 수집 | `0 */2 * * *` | 상시, 2시간 간격 | 한국+미국 뉴스 | Google News RSS + Naver RSS |
| `cron-master` | 종목 마스터 동기화 | `0 21 * * 0` (UTC) | 매주 일요일 06:00 KST | 전체 종목 | 상장/폐지 반영 |
| `cron-cleanup` | 데이터 정리 | `0 20 * * 0` (UTC) | 매주 일요일 05:00 KST | 오래된 뉴스, 일봉 | 3주 초과 삭제 |

> **GitHub Actions 분수 절감 (2026-03-16 최적화)**
> - 변경 전: ~105 runs/day → ~2,310분/월 (무료 2,000분 초과!)
> - 변경 후: ~18 runs/day → ~396분/월 (80% 절감)
> - US 시세: 15분 간격 장중 → 장마감 후 1회 (분석용 서비스, 실시간 불필요)
> - 뉴스: 30분 → 2시간 간격
> - 환율: US 시세에서 분리 → 별도 워크플로우, 1일 4회

### 3.3 한국 시세 수집 상세 (cron-kr-quotes)

```
실행 조건: 평일(월~금), 16:00 KST (장마감 후 1회)
대상: Stock 테이블에서 market=KR, isActive=true 조회 → ~2,650종목
데이터 소스: KRX 비공식 API (data.krx.co.kr, 인증 불필요)

수집 절차:
  1. getLastTradingDate()로 최근 영업일 계산
  2. KOSPI(STK) + KOSDAQ(KSQ) OHLCV + Fundamentals + 지수 병렬 수집
     - OHLCV: dbms/MDC/STAT/standard/MDCSTAT01501
     - 시총+PER/PBR: dbms/MDC/STAT/standard/MDCSTAT03501
     - 지수: dbms/MDC/STAT/standard/MDCSTAT00101
  3. DB에 등록된 종목만 필터링 (전체 종목 수집 후 필터)
  4. DailyPrice: createMany skipDuplicates (멱등성 보장)
  5. StockQuote: 100건씩 배치 upsert (stockId 기준)
     - price = close, previousClose = close - change
     - marketCap, per, pbr fundamentals 포함
  6. MarketIndex: KOSPI/KOSDAQ upsert
  7. 수집 결과 로깅: 성공/실패 건수, 소요 시간

예상 소요 시간: API 호출 4회 병렬 (~수초) + DB upsert (~30초)
1일 1회 실행이므로 소요 시간 제약 없음
```

### 3.4 미국 시세 수집 상세 (cron-us-quotes)

```
실행 조건: 평일, 장마감 직후 1회 (21:15 UTC = 06:15 KST)
대상: Stock 테이블에서 market=US, isActive=true → ~1,000종목

수집 절차:
  ※ Yahoo Finance 비공식 HTTP API (SLA 없음, 차단 이력 있음).
    1일 1회로 줄여 차단 위험 최소화.
    장기적으로 Financial Modeling Prep(FMP) 또는 Twelve Data 전환 검토.

  1. Yahoo Finance v7 quote API를 배치 호출 (최대 20개 티커/배치)
  2. 배치별 1초 딜레이 (비공식 API Rate Limit 회피)
  3. StockQuote upsert (최신 시세)
  4. DailyPrice upsert (당일 OHLCV, v8 chart API)

예상 소요 시간: 1,000종목 / 20종목 배치 x 1초 = 50초 + DailyPrice ~3분 ≈ 4분
```

### 3.5 장마감 일봉 수집 상세 (cron-kr-close, cron-us-close)

```
한국 (16:00 KST, cron-kr-quotes에 통합):
  1. KRX 비공식 API로 당일 전체 종목 OHLCV 수집
  2. DailyPrice 테이블에 createMany skipDuplicates
  3. StockQuote upsert (price=close, previousClose=close-change)

미국 (06:15 KST, 화~토):
  1. yahoo-finance2 chart()로 당일 OHLCV 조회
  2. DailyPrice 테이블에 INSERT
  3. adjClose (수정 종가) 포함

※ 이미 해당 날짜 레코드가 있으면 SKIP (중복 방지)
```

### 3.6 뉴스 수집 상세 (cron-news)

```
실행 조건: 상시, 30분 간격 (24시간)
보관 기간: 3주 (21일)

━━━ 한국 뉴스 수집 전략 ━━━

  1순위: Naver Finance 증권 뉴스 스크래핑 (Primary)
    ※ ipadorusa-codex 프로젝트의 n8n 워크플로우 방식을 참고.
      Naver Finance 섹터별 뉴스 목록 페이지를 직접 스크래핑.

    - URL 패턴:
      https://finance.naver.com/news/news_list.naver?mode=LSS3D
        &section_id=101&section_id2=258&section_id3={sectorId}
        &date={YYYYMMDD}&page={page}
    - 섹터별 수집: 반도체, 2차전지, 바이오, AI/SW 등 주요 섹터
    - 시간 윈도우 필터: 수집 시점 기준 최근 30분 이내 기사만 처리
    - 중복 제거: 기사 URL 기반 dedup (seen 캐시 + DB url UNIQUE)
    - User-Agent, Referer 헤더 설정 필요

  2순위: Google News RSS (무료, Naver 장애 시 fallback)
    - https://news.google.com/rss/search?q=주식&hl=ko&gl=KR
    - https://news.google.com/rss/search?q=코스피&hl=ko&gl=KR
    - 키워드별 RSS 피드 파싱 → 최대 20건

━━━ 해외(미국) 뉴스 수집 전략 ━━━

  ※ 한국과 달리 Naver 같은 단일 소스가 없으므로 다중 RSS 조합.
  ※ NewsAPI 무료는 localhost 전용 → 프로덕션 불가.

  1순위: Google News RSS (무료, 프로덕션 사용 가능)
    - https://news.google.com/rss/search?q=stock+market&hl=en&gl=US
    - https://news.google.com/rss/search?q=S%26P+500&hl=en&gl=US
    - https://news.google.com/rss/search?q=NASDAQ&hl=en&gl=US
    - 종목별: q=AAPL+stock, q=NVDA+stock 등 상위 30 종목

  2순위: Yahoo Finance RSS (무료, 미국 시장 특화)
    - https://finance.yahoo.com/news/rssindex
    - 시장 전체 뉴스 피드

  3순위: Investing.com RSS (무료, 글로벌 커버리지)
    - https://www.investing.com/rss/news.rss
    - 미국 + 글로벌 시장 뉴스

  [로컬 개발 전용] NewsAPI
    - 환경변수 USE_NEWS_API=true일 때만 동작
    - 프로덕션 배포 시 비활성화

━━━ 수집 절차 (공통) ━━━

  1. 한국: Naver Finance 섹터 뉴스 스크래핑 → 최대 20건
  2. 한국: Google News RSS 보강 → 최대 10건
  3. 미국: Google News RSS 키워드별 파싱 → 최대 20건
  4. 미국: Yahoo Finance RSS 파싱 → 최대 10건
  5. 중복 체크: News.url UNIQUE 제약으로 중복 자동 방지
  6. 카테고리 분류:
     - 제목/본문에 "코스피|코스닥|한국" → KR_MARKET
     - 제목/본문에 "S&P|나스닥|NYSE|미국" → US_MARKET
     - 제목/본문에 "반도체|AI|배터리|바이오" → INDUSTRY
     - 그 외 → ECONOMY
  7. 종목 매핑 (StockNews 연결):
     - Stock 테이블의 name, ticker와 뉴스 제목을 매칭
     - 예: 뉴스 제목에 "삼성전자" 포함 → StockNews(005930, newsId) INSERT
     - 매칭 대상: Stock 테이블의 인기 종목 상위 100개만 (성능)

키워드 목록 관리:
  - lib/data-sources/news-keywords.ts에 정적 배열로 관리
  - 한국: ["주식", "코스피", "코스닥", "삼성전자", "SK하이닉스", ...]
  - 미국: ["stock market", "S&P 500", "NVIDIA", "Apple", "Tesla", ...]
  - 종목명은 Stock 테이블에서 인기 순 상위 30개 자동 추출 (주 1회 갱신)
```

---

## 4. 데이터 저장 전략

### 4.1 테이블별 쓰기 패턴

| 테이블 | 쓰기 방식 | 빈도 | 쓰기 주체 |
|--------|----------|------|----------|
| Stock | upsert (ticker 기준) | 주 1회 | cron-master |
| StockQuote | upsert (stockId 기준) | 1일 1회(KR), 1일 1회(US) | cron-kr-quotes, cron-us-quotes |
| DailyPrice | insert (stockId+date UNIQUE) | 1일 1회 | cron-kr-quotes, cron-us-close |
| MarketIndex | upsert (symbol 기준) | 장중 5분 | cron-index |
| ExchangeRate | upsert (pair 기준) | 1일 4회 | cron-exchange |
| News | insert (url UNIQUE, 중복 skip) | 2시간 | cron-news |
| StockNews | insert (복합키) | 30분 | cron-news |
| Watchlist | insert/delete | 사용자 요청 시 | API Route |
| User, Account, Session | NextAuth 관리 | 로그인/가입 시 | NextAuth |

### 4.2 데이터 갱신 시점과 상태

```
StockQuote의 updatedAt 필드로 데이터 신선도를 판단:

한국 시세:
  - 장중: 갱신 없음 (KRX는 장마감 후 1회 수집)
  - 장마감 후 (16:00 KST, 1회): KRX 비공식 API로 전체 종목 OHLCV 수집 → updatedAt 갱신
  - 주말/공휴일: 금요일 장마감 데이터 유지

미국 시세:
  - 장마감 후 1회 (06:15 KST): StockQuote + DailyPrice 갱신
  - 그 외: 마지막 장마감 데이터 유지
  - 분석용 서비스이므로 실시간 시세 불필요

API 응답에 updatedAt을 항상 포함 → 클라이언트가 "15분 전 데이터" 등 표시 가능
```

### 4.3 초기 데이터 적재 (Seed)

```
프로젝트 최초 셋업 시 실행할 시드 작업:

1단계: 종목 마스터 시딩 (prisma/seed.ts)
  - 한국: KRX에서 KOSPI/KOSDAQ 전체 종목 CSV 다운로드 → Stock INSERT
  - 미국: S&P 500 구성종목 CSV → Stock INSERT
  - 소요: 1회성, ~5분

2단계: 히스토리컬 일봉 적재 (scripts/seed-daily-prices.ts)
  - 한국: KRX 비공식 API로 날짜별 1회 호출 x 15영업일 수집
    - 2,650종목 x 15일 = ~39,750 rows
    - 날짜별 순차 실행 (~수분 소요)
  - 미국: yahoo-finance2 chart()로 3주치 일봉 수집
    - MVP: S&P 100 (100종목)으로 시작 → 100 x 15 = ~1,500 rows
  - 총 레코드: ~54,750 rows (~15MB, Supabase 무료 티어 여유)

3단계: 지수/환율 초기값
  - 4개 지수 + USD/KRW 환율 1건씩 INSERT
```

---

## 5. 데이터 조회 전략 (API → 클라이언트)

### 5.1 핵심 원칙

```
API Route는 DB만 읽는다.
DB의 데이터는 Cron이 이미 갱신한 상태이다.
따라서 API Route에 복잡한 캐싱 로직이 필요 없다.
```

### 5.2 API Route별 조회 방식

| API Route | 데이터 소스 | 쿼리 방식 | 응답 속도 목표 |
|-----------|-----------|----------|--------------|
| `/api/stocks/search` | Stock 테이블 | `WHERE name LIKE '%q%' OR ticker LIKE '%q%'` | < 50ms |
| `/api/stocks/[ticker]` | Stock + StockQuote JOIN | `WHERE ticker = ?` | < 50ms |
| `/api/stocks/[ticker]/chart` | DailyPrice 테이블 | `WHERE stockId = ? AND date >= ? ORDER BY date` | < 100ms |
| `/api/stocks/[ticker]/news` | StockNews + News JOIN | `WHERE stockId = ? ORDER BY publishedAt DESC` | < 100ms |
| `/api/stocks/popular` | StockQuote + Stock JOIN | `WHERE market=? ORDER BY volume DESC LIMIT 10` (market param: KR\|US\|all, 기본 all) | < 100ms |
| `/api/market/indices` | MarketIndex 테이블 | `SELECT * (4건)` | < 30ms |
| `/api/market/kr/movers` | StockQuote + Stock JOIN | `WHERE market=KR ORDER BY changePercent DESC/ASC` | < 100ms |
| `/api/market/us/movers` | StockQuote + Stock JOIN | `WHERE market=US ORDER BY changePercent DESC/ASC` | < 100ms |
| `/api/market/exchange-rate` | ExchangeRate 테이블 | `WHERE pair = 'USD/KRW' (1건)` | < 30ms |
| `/api/news` | News 테이블 | `WHERE category = ? ORDER BY publishedAt DESC` | < 100ms |
| `/api/watchlist` | Watchlist + Stock + StockQuote JOIN | `WHERE userId = ?` | < 100ms |

### 5.3 서버 캐싱 (Next.js)

```
※ DB에서 직접 읽어도 충분히 빠르지만 (< 100ms),
  동일 요청이 반복될 경우 DB 부하를 줄이기 위해 최소한의 캐싱 적용.

  캐싱의 기준: "Cron이 다음에 DB를 갱신하기 전까지"가 캐시 TTL.
  → 데이터가 바뀔 수 없는 구간에서는 캐시가 항상 유효하다.

API Route 캐싱:
  - /api/stocks/search         → revalidate: 3600 (1시간)
      종목 마스터는 주 1회만 변경. 검색은 변동 없음.

  - /api/stocks/[ticker]       → revalidate: 900 (15분)
      StockQuote가 15분마다 갱신되므로 캐시도 15분.
      장 마감 후에도 15분이면 충분 (데이터가 안 바뀌므로).

  - /api/stocks/[ticker]/chart  → revalidate: 86400 (24시간)
      DailyPrice는 장마감 후 1일 1회 추가.
      당일 장마감 전까지는 어제까지의 데이터로 동일.
      ※ 차트 최대 기간: 3주 (15영업일). 장기 차트는 Post-MVP.

  - /api/market/indices        → revalidate: 300 (5분)
      지수는 5분마다 갱신되므로 캐시도 5분.

  - /api/market/exchange-rate  → revalidate: 3600 (1시간)
      환율은 1시간마다 갱신.

  - /api/news                  → revalidate: 1800 (30분)
      뉴스는 30분마다 수집되므로 캐시도 30분.

  - /api/watchlist             → revalidate: 0 (캐시 없음)
      사용자별 동적 데이터. 항상 최신.
```

### 5.4 클라이언트 캐싱 (TanStack Query)

```
핵심: staleTime을 서버 캐시 TTL과 맞춘다.
→ 서버가 같은 데이터를 줄 건데 클라이언트가 더 자주 요청할 이유 없음.

TanStack Query 설정:

  종목 시세 (/api/stocks/[ticker]):
    staleTime: 15 * 60 * 1000    // 15분 — Cron 주기와 일치
    gcTime: 30 * 60 * 1000       // 30분 후 GC
    refetchOnWindowFocus: true    // 탭 복귀 시 갱신 (단, stale일 때만)

  차트 데이터 (/api/stocks/[ticker]/chart):
    staleTime: 24 * 60 * 60 * 1000  // 24시간 — 일봉은 하루 1회 갱신
    gcTime: 60 * 60 * 1000          // 1시간 후 GC

  지수 (/api/market/indices):
    staleTime: 5 * 60 * 1000     // 5분 — Cron 주기와 일치
    refetchOnWindowFocus: true

  환율:
    staleTime: 60 * 60 * 1000    // 1시간

  뉴스:
    staleTime: 30 * 60 * 1000    // 30분

  검색:
    staleTime: 60 * 60 * 1000    // 1시간

  관심종목:
    staleTime: 0                  // 항상 최신

※ refetchInterval은 사용하지 않는다.
  → 자동 폴링 없음. 탭 포커스 복귀 + 수동 새로고침으로만 갱신.
  → 이유: 비실시간 서비스이므로 백그라운드 폴링은 불필요한 서버 부하.
```

---

## 6. 데이터 정리 (Cleanup)

### 6.1 정리 스케줄 (cron-cleanup)

```
실행: 매주 일요일 05:00 KST

정리 대상:
  1. News 테이블: publishedAt이 21일(3주) 이전인 레코드 DELETE
     - 연관된 StockNews도 CASCADE 삭제
     - 예상 삭제량: ~1,680건/주

  2. DailyPrice 테이블: date가 3주(21일) 이전인 레코드 DELETE
     - 예상 삭제량: 일주일에 5영업일 x 3,650종목 = ~18,250건 추가/삭제
     - 3주 넘으면 삭제 → Supabase 무료 500MB 여유 유지

  3. 비활성 종목: isActive=false이고 마지막 StockQuote 갱신이 90일 전인 종목
     - Stock.isActive = false 처리 (삭제는 안 함)
     - 해당 종목의 StockQuote 삭제 (시세 수집 대상에서 제외)
```

### 6.2 데이터 보관 정책 요약

| 테이블 | 보관 기간 | 예상 최대 크기 |
|--------|----------|--------------|
| Stock | 영구 (비활성 처리만) | ~4,000 rows |
| StockQuote | 영구 (최신 1건/종목) | ~3,650 rows |
| DailyPrice | 3주 (21일) | ~54,750 rows |
| MarketIndex | 영구 (최신 1건/지수) | 4 rows |
| ExchangeRate | 영구 (최신 1건/페어) | 1 row |
| News | 3주 (21일) | ~1,680 rows |
| StockNews | News와 동일 (CASCADE) | ~3,500 rows |
| Watchlist | 영구 (사용자 삭제 시 제거) | 사용자 수 비례 |

---

## 7. 장애 대응

### 7.1 외부 API 장애 시

```
원칙: 외부 API가 죽어도 서비스는 계속 동작한다.
→ DB에 마지막으로 적재된 데이터를 계속 서빙.
→ 클라이언트는 updatedAt을 보고 "30분 전 데이터" 등으로 표시.

KRX 비공식 API 장애:
  - cron-kr-quotes 실패 → StockQuote/DailyPrice가 갱신되지 않음
  - API Route는 이전 데이터 반환 (updatedAt으로 신선도 표시)
  - SLA 없음 — 장애 시 다음 영업일 수집까지 이전 데이터 유지

Yahoo Finance 장애:
  - cron-us-quote에서 실패한 종목만 Alpha Vantage fallback
  - Alpha Vantage도 실패 시 → 이전 데이터 유지
  - Alpha Vantage 일일 한도(25건) 초과 시 → 나머지는 다음 Cron에서 재시도

Naver Finance 스크래핑 장애 (한국):
  - Google News RSS로 fallback
  - 모든 소스 실패 시 → 이전 뉴스 유지 (30분 후 재시도)

Google News / Yahoo Finance RSS 장애 (미국):
  - Investing.com RSS로 fallback
  - 모든 소스 실패 시 → 이전 뉴스 유지 (30분 후 재시도)
```

### 7.2 Cron Job 모니터링

```
각 Cron Job 실행 결과를 로깅:

{
  jobId: "cron-kr-quote",
  executedAt: "2026-03-15T09:15:00+09:00",
  duration: 133000,   // ms
  totalStocks: 2650,
  success: 2648,
  failed: 2,
  failedTickers: ["298050", "450140"],
  error: null
}

모니터링 방법 (MVP):
  - Vercel Function Logs에서 확인
  - 실패율 > 10% 시 console.error로 표시

모니터링 방법 (Post-MVP):
  - DB에 CronLog 테이블 추가
  - 대시보드 또는 Slack 알림 연동
```

---

## 8. 전체 데이터 흐름 예시

### 예시: 사용자가 삼성전자(005930) 시세를 조회하는 경우

```
[시간 순서]

16:00 KST — cron-kr-quotes 실행 (GitHub Actions, 07:00 UTC)
  → KRX 비공식 API에서 KOSPI+KOSDAQ 전체 종목 OHLCV 수집
  → 005930 포함: StockQuote upsert: price=72800, change=+1600, updatedAt=16:00
  → DailyPrice INSERT (date=오늘)

16:05 KST — 사용자가 /stock/005930 접속
  → API Route: /api/stocks/005930
  → DB에서 Stock + StockQuote JOIN 조회
  → 응답: { price: 72800, ..., updatedAt: "16:00" }
  → Next.js 서버 캐시에 900초간 저장

16:10 KST — 다른 사용자가 같은 페이지 접속
  → Next.js 서버 캐시에서 바로 응답 (DB 조회 안 함)

다음날 16:00 KST — cron-kr-quotes 재실행
  → KRX에서 새로운 종가 수집 → StockQuote upsert 갱신
```

### 예시: 장마감 후 차트 조회

```
15:30 KST — cron-kr-close 실행
  → 005930 당일 OHLCV: open=71200, high=73100, low=71000, close=72800
  → DailyPrice INSERT (date=2026-03-15)
  → StockQuote.previousClose = 72800 갱신

15:35 KST — 사용자가 /stock/005930 차트 탭 (period=3W)
  → API Route: /api/stocks/005930/chart?period=3W
  → DailyPrice에서 최근 3주 일봉 조회
  → 오늘 추가된 3/15 데이터 포함하여 ~15건 응답
  → 서버 캐시: 24시간 (다음 장마감까지 데이터 변동 없음)
```

---

## 9. KR NXT(넥스트레이드) 미지원 결정 (2026-03-16)

```
배경:
  - NXT(넥스트레이드)는 2025년 3월 출범한 한국 대체거래소
  - 거래시간: 프리마켓 08:00~08:50, 메인 09:00~15:20, 애프터 15:30~20:00 KST
  - 2026년 현재 대형주 ~800종목 거래, 애프터마켓 거래량 상당

미지원 이유:
  1. data.krx.co.kr은 KRX 데이터만 제공, NXT 데이터 미제공
  2. NXT 데이터 접근에는 증권사 API(KIS/키움) 필요 → 계좌 개설 + API 키 필요
  3. KRX 종가가 익일 공식 기준가, NXT 종가는 별도 취급
  4. 초보 투자자 대상 분석 서비스 → NXT 시간외 데이터는 MVP 범위 밖

현행 유지:
  - cron-kr.yml: 16:00 KST 1회 (KRX 장마감 후)
  - getLastTradingDate(): 16:00 KST 기준
  - KRX 공식 종가만 수집

Post-MVP 검토 가능:
  - 증권사 API 연동 시 NXT 종가 별도 표시 가능
  - 사용자 수요 확인 후 결정
```
