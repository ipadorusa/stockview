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
│  한투 API          ┌─ StockQuote (최신 시세)                  │
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
06:00     09:00          15:30  16:00       22:30              05:00  06:00
  │         │               │     │           │                  │     │
  ▼         ▼               ▼     ▼           ▼                  ▼     ▼
[종목마스터] [KR시세15분]  [KR장마감] [정리]   [US시세15분]     [US장마감] [종목마스터]
[뉴스30분 ─────────────── 상시 운영 ──────────────────────────── 뉴스30분]
[환율1시간 ── 09:00~18:00 ──]
```

### 3.2 상세 Cron 스케줄

| Job ID | 작업명 | Cron 표현식 | 실행 시간 (KST) | 대상 | 비고 |
|--------|--------|------------|-----------------|------|------|
| `cron-kr-quote` | 한국 시세 수집 | `*/15 0-6 * * 1-5` (UTC) | 09:00~15:45 KST, 15분 간격 | KR 전체 ~2,650종목 | 한투 API, 핸들러에서 15:30 이후 스킵 처리 |
| `cron-kr-close` | 한국 장마감 일봉 | `30 6 * * 1-5` (UTC) | 15:30 KST, 1회 | KR 전체 | DailyPrice INSERT |
| `cron-us-quote` | 미국 시세 수집 | `*/15 13-20 * * 1-5` (UTC) | 22:00~05:00 KST, 15분 간격 | US 전체 ~1,000종목 | Yahoo Finance |
| `cron-us-close` | 미국 장마감 일봉 | `15 20-21 * * 2-6` (UTC) | 05:15/06:15 KST(화~토), DST 대응 2회 실행 | US 전체 | DailyPrice INSERT, 핸들러에서 장마감 확인 후 처리 |
| `cron-us-extended` | 미국 장전/장후 | `0 8-12,21-23 * * 1-5` (UTC) | 장전/장후 시간, 1시간 간격 | US 전체 | preMarket/postMarket |
| `cron-index` | 지수 수집 | `*/5 0-6,13-20 * * 1-5` (UTC) | 한국/미국 장중, 5분 간격 | 4개 지수 | 지수는 자주 갱신 |
| `cron-exchange` | 환율 수집 | `0 0-9 * * 1-5` (UTC) | 09:00~18:00 KST, 1시간 | USD/KRW 1개 | 한국은행 API |
| `cron-news` | 뉴스 수집 | `*/30 * * * *` | 상시, 30분 간격 | 한국+미국 뉴스 | Google News RSS + Naver RSS |
| `cron-master` | 종목 마스터 동기화 | `0 21 * * 0` (UTC) | 매주 일요일 06:00 KST | 전체 종목 | 상장/폐지 반영 |
| `cron-cleanup` | 데이터 정리 | `0 20 * * 0` (UTC) | 매주 일요일 05:00 KST | 오래된 뉴스, 일봉 | 3주 초과 삭제 |

### 3.3 한국 시세 수집 상세 (cron-kr-quote)

```
실행 조건: 평일(월~금), 09:00~15:30 KST
대상: Stock 테이블에서 market=KR, isActive=true 조회 → ~2,650종목

수집 절차:
  1. 한투 API access_token 확인 (만료 시 재발급, 유효기간 24시간)
  2. 종목 목록을 50개씩 배치 분할 (한투 API Rate Limit: 초당 20건)
  3. 배치별 순차 호출:
     - API: /uapi/domestic-stock/v1/quotations/inquire-price
     - 각 요청 간 50ms 딜레이 (초당 20건 준수)
  4. 응답 파싱 → StockQuote 테이블 upsert (stockId 기준)
  5. 수집 결과 로깅: 성공/실패 건수, 소요 시간

예상 소요 시간: 2,650종목 / 20건/초 ≈ 133초 ≈ 2분 13초
15분 간격이므로 충분한 여유 있음
```

### 3.4 미국 시세 수집 상세 (cron-us-quote)

```
실행 조건: 평일, 22:00~05:00 KST (미국 장중)
대상: Stock 테이블에서 market=US, isActive=true → ~1,000종목

수집 절차:
  ※ yahoo-finance2는 비공식 스크래핑 패키지 (SLA 없음, 차단 이력 있음: 2017, 2023년).
    장기적으로 Financial Modeling Prep(FMP, 무료 250건/일) 또는
    Twelve Data(무료 800건/일)를 primary로 전환 검토.

  1. yahoo-finance2의 quote()를 배치 호출
     - 한 번에 최대 10개 티커 묶어서 호출 가능
  2. 배치별 1~2초 딜레이 (비공식 API Rate Limit 회피)
  3. 실패 시 Alpha Vantage fallback (해당 종목만)
     - Alpha Vantage 무료: 1일 25건 제한 (분당 아님, 일일 한도)
     - 대량 fallback에는 부적합, 소수 종목 보완용으로만 사용
  4. 응답 파싱 → StockQuote upsert
     - preMarketPrice, postMarketPrice 포함 (장전/장후 시간대에만)

예상 소요 시간: 1,000종목 / 10종목 배치 x 2초 = 200초 ≈ 3분 20초
```

### 3.5 장마감 일봉 수집 상세 (cron-kr-close, cron-us-close)

```
한국 (15:30 KST):
  1. 한투 API inquire-daily-price로 당일 OHLCV 조회
  2. DailyPrice 테이블에 INSERT (stockId + date UNIQUE)
  3. StockQuote의 previousClose를 당일 종가로 갱신

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
| StockQuote | upsert (stockId 기준) | 장중 15분 | cron-kr-quote, cron-us-quote |
| DailyPrice | insert (stockId+date UNIQUE) | 1일 1회 | cron-kr-close, cron-us-close |
| MarketIndex | upsert (symbol 기준) | 장중 5분 | cron-index |
| ExchangeRate | upsert (pair 기준) | 1시간 | cron-exchange |
| News | insert (url UNIQUE, 중복 skip) | 30분 | cron-news |
| StockNews | insert (복합키) | 30분 | cron-news |
| Watchlist | insert/delete | 사용자 요청 시 | API Route |
| User, Account, Session | NextAuth 관리 | 로그인/가입 시 | NextAuth |

### 4.2 데이터 갱신 시점과 상태

```
StockQuote의 updatedAt 필드로 데이터 신선도를 판단:

한국 시세:
  - 장중 (09:00~15:30): 15분마다 갱신 → updatedAt 기준 최대 15분 전 데이터
  - 장마감 후 (15:30~다음날 09:00): 마지막 장마감 데이터 유지
  - 주말/공휴일: 금요일 장마감 데이터 유지

미국 시세:
  - 장중 (22:30~05:00 KST): 15분마다 갱신
  - 장전 (17:00~22:30 KST): preMarketPrice만 1시간마다 갱신
  - 장후 (05:00~09:00 KST): postMarketPrice만 1시간마다 갱신
  - 그 외: 마지막 장마감 데이터 유지

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
  - 한국: 한투 API inquire-daily-price로 3주치(15영업일) 일봉 수집
    - 2,650종목 x 15일 = ~39,750 rows
    - 배치 실행 (~수분 소요)
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

한투 API 장애:
  - cron-kr-quote 실패 → StockQuote가 갱신되지 않음
  - API Route는 이전 데이터 반환 (updatedAt으로 신선도 표시)
  - 3회 연속 실패 시 로그 알림

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

09:00 KST — cron-kr-quote 실행
  → 한투 API에서 005930 시세 수집
  → StockQuote upsert: price=72400, change=+1600, updatedAt=09:00

09:05 KST — 사용자가 /stock/005930 접속
  → API Route: /api/stocks/005930
  → DB에서 Stock + StockQuote JOIN 조회
  → 응답: { price: 72400, ..., updatedAt: "09:00" }
  → Next.js 서버 캐시에 15분간 저장

09:10 KST — 다른 사용자가 같은 페이지 접속
  → Next.js 서버 캐시에서 바로 응답 (DB 조회 안 함)

09:15 KST — cron-kr-quote 재실행
  → 한투 API: price=72800
  → StockQuote upsert: price=72800, updatedAt=09:15

09:20 KST — 사용자가 탭 복귀 (refetchOnWindowFocus)
  → TanStack Query: staleTime 15분 아직 안 지남 → refetch 안 함
  → 여전히 72400 표시

09:21 KST — 서버 캐시 만료 (09:05 + 15분 = 09:20 이후)
  → 다음 요청 시 DB에서 새로 조회 → 72800 응답

09:25 KST — 사용자가 페이지 새로고침
  → TanStack Query: 서버에서 72800 받아옴 → UI 갱신
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
