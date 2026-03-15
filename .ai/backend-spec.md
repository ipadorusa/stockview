# Backend Specification: StockView

---

## 1. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| Runtime | Next.js 15 API Routes (App Router) | 프론트와 동일 프로젝트 |
| ORM | Prisma 6 | 타입 안전, 마이그레이션 관리 |
| DB | PostgreSQL (Supabase) | 관계형 데이터, 무료 티어 |
| 인증 | NextAuth.js v5 (Auth.js) | Credentials + OAuth |
| 캐싱 | Next.js unstable_cache + ISR | 주식 데이터 캐싱 |
| Validation | Zod | 요청/응답 스키마 검증 |
| 한국 주식 API | 한국투자증권 Open API | REST, 장전/장후 지원 |
| 미국 주식 API | Yahoo Finance (unofficial) / Alpha Vantage | Yahoo Finance 메인 (비공식, SLA 없음, 차단 이력 있음). Alpha Vantage 무료 1일 25건 한도로 소수 종목 fallback만 가능. 장기적으로 FMP/Twelve Data 전환 검토 |
| 뉴스 (한국) | Naver Finance 섹터 뉴스 스크래핑 (Primary) / Google News RSS (fallback) | ipadorusa-codex 방식 참고. 섹터별 뉴스 목록 페이지 스크래핑 |
| 뉴스 (미국) | Google News RSS + Yahoo Finance RSS (Primary) / Investing.com RSS (fallback) | NewsAPI 무료는 localhost 전용. 다중 RSS 조합으로 커버리지 확보 |
| 환율 | 한국은행 Open API / ExchangeRate-API | USD/KRW |
| Cron Jobs | GitHub Actions → API Route 호출 | Vercel Cron은 빈도 제한(Hobby 1일1회, Pro 1시간1회)으로 부적합. GitHub Actions(무료 2,000분/월)에서 스케줄에 따라 API Route HTTP 호출 |

---

## 2. 데이터베이스 스키마 (Prisma)

```prisma
// ─── 사용자 & 인증 ───

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  password      String    // bcrypt hashed
  nickname      String    @unique
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  watchlist     Watchlist[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─── 주식 종목 ───

model Stock {
  id        String   @id @default(cuid())
  ticker    String   @unique         // "005930" | "AAPL"
  name      String                   // "삼성전자" | "Apple Inc."
  nameEn    String?                  // 영문명 (한국 종목)
  market    Market                   // KR | US
  exchange  String                   // "KOSPI" | "NASDAQ"
  sector    String?                  // 업종
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  quotes     StockQuote[]
  dailyPrices DailyPrice[]
  watchlist   Watchlist[]
  news        StockNews[]

  @@index([market])
  @@index([name])
}

enum Market {
  KR
  US
}

// ─── 현재 시세 (최신 스냅샷) ───

model StockQuote {
  id              String   @id @default(cuid())
  stockId         String
  price           Decimal  @db.Decimal(18, 4) // 현재가
  previousClose   Decimal  @db.Decimal(18, 4) // 전일 종가
  change          Decimal  @db.Decimal(18, 4) // 전일 대비
  changePercent   Decimal  @db.Decimal(10, 4) // 등락률
  open            Decimal  @db.Decimal(18, 4) // 시가
  high            Decimal  @db.Decimal(18, 4) // 고가
  low             Decimal  @db.Decimal(18, 4) // 저가
  volume          BigInt                       // 거래량
  marketCap       BigInt?                      // 시가총액
  high52w         Decimal? @db.Decimal(18, 4)  // 52주 최고
  low52w          Decimal? @db.Decimal(18, 4)  // 52주 최저
  per             Decimal? @db.Decimal(10, 2)  // PER
  pbr             Decimal? @db.Decimal(10, 2)  // PBR

  // 장전/장후
  preMarketPrice  Decimal? @db.Decimal(18, 4)
  postMarketPrice Decimal? @db.Decimal(18, 4)

  updatedAt       DateTime @updatedAt

  stock Stock @relation(fields: [stockId], references: [id], onDelete: Cascade)

  @@unique([stockId])
  @@index([updatedAt])
}

// ─── 일별 가격 (차트 데이터) ───

model DailyPrice {
  id       String   @id @default(cuid())
  stockId  String
  date     DateTime @db.Date
  open     Decimal  @db.Decimal(18, 4)
  high     Decimal  @db.Decimal(18, 4)
  low      Decimal  @db.Decimal(18, 4)
  close    Decimal  @db.Decimal(18, 4)
  volume   BigInt
  adjClose Decimal? @db.Decimal(18, 4)  // 수정 종가

  stock Stock @relation(fields: [stockId], references: [id], onDelete: Cascade)

  @@unique([stockId, date])
  @@index([stockId, date])
}

// ─── 관심종목 ───

model Watchlist {
  id        String   @id @default(cuid())
  userId    String
  stockId   String
  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  stock Stock @relation(fields: [stockId], references: [id], onDelete: Cascade)

  @@unique([userId, stockId])
  @@index([userId])
}

// ─── 뉴스 ───

model News {
  id          String   @id @default(cuid())
  title       String
  summary     String?  @db.Text
  source      String            // "한국경제", "Reuters"
  url         String   @unique  // 원문 URL
  imageUrl    String?
  category    NewsCategory
  publishedAt DateTime
  createdAt   DateTime @default(now())

  stocks StockNews[]

  @@index([publishedAt])
  @@index([category])
}

model StockNews {
  stockId String
  newsId  String

  stock Stock @relation(fields: [stockId], references: [id], onDelete: Cascade)
  news  News  @relation(fields: [newsId], references: [id], onDelete: Cascade)

  @@id([stockId, newsId])
}

enum NewsCategory {
  KR_MARKET    // 한국 시장
  US_MARKET    // 미국 시장
  INDUSTRY     // 산업
  ECONOMY      // 경제
}

// ─── 지수 ───

model MarketIndex {
  id            String   @id @default(cuid())
  symbol        String   @unique  // "KOSPI", "KOSDAQ", "SPX", "IXIC"
  name          String            // "코스피", "S&P 500"
  value         Decimal  @db.Decimal(18, 4)
  change        Decimal  @db.Decimal(18, 4)
  changePercent Decimal  @db.Decimal(10, 4)
  updatedAt     DateTime @updatedAt
}

// ─── 환율 ───

model ExchangeRate {
  id            String   @id @default(cuid())
  pair          String   @unique  // "USD/KRW"
  rate          Decimal  @db.Decimal(18, 4)
  change        Decimal  @db.Decimal(18, 4)
  changePercent Decimal  @db.Decimal(10, 4)
  updatedAt     DateTime @updatedAt
}
```

---

## 3. API 엔드포인트 설계 (REST)

### 3.1 인증 (`/api/auth/...`)
NextAuth.js가 자동 처리:

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 (커스텀) |
| POST | `/api/auth/signin` | 로그인 (NextAuth) |
| POST | `/api/auth/signout` | 로그아웃 (NextAuth) |
| GET | `/api/auth/session` | 세션 조회 (NextAuth) |

#### `POST /api/auth/register`
```typescript
// Request
{
  email: string;
  password: string;
  nickname: string;
}

// Response 201
{
  id: string;
  email: string;
  nickname: string;
}

// Error 409
{ error: "이미 사용 중인 이메일입니다." }
```

---

### 3.2 종목 검색 (`/api/stocks`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/stocks/search?q={query}` | 종목 검색 (자동완성) |
| GET | `/api/stocks/[ticker]` | 종목 상세 (시세 포함) |
| GET | `/api/stocks/[ticker]/chart?period={period}` | 차트 데이터 |
| GET | `/api/stocks/[ticker]/news` | 종목 관련 뉴스 |
| GET | `/api/stocks/popular?market={KR\|US\|all}` | 인기 종목 TOP 10 (market 기본값: all) |

#### `GET /api/stocks/search?q=삼성`
```typescript
// Response 200
{
  results: [
    {
      ticker: "005930",
      name: "삼성전자",
      market: "KR",
      exchange: "KOSPI"
    },
    {
      ticker: "009150",
      name: "삼성전기",
      market: "KR",
      exchange: "KOSPI"
    }
  ]
}
```

#### `GET /api/stocks/005930`
```typescript
// Response 200
{
  ticker: "005930",
  name: "삼성전자",
  nameEn: "Samsung Electronics",
  market: "KR",
  exchange: "KOSPI",
  sector: "반도체",
  quote: {
    price: 72400,
    previousClose: 70800,
    change: 1600,
    changePercent: 2.26,
    open: 71200,
    high: 72800,
    low: 70900,
    volume: 12300000,
    marketCap: 432000000000000,
    high52w: 78200,
    low52w: 58400,
    per: 12.5,
    pbr: 1.3,
    preMarketPrice: null,
    postMarketPrice: null,
    updatedAt: "2026-03-14T06:30:00Z"
  }
}
```

#### `GET /api/stocks/005930/chart?period=3W`
```typescript
// Response 200
{
  ticker: "005930",
  period: "3W",
  data: [
    {
      time: "2026-02-24",
      open: 68500,
      high: 69200,
      low: 68100,
      close: 69000,
      volume: 10500000
    },
    // ... 약 15개 (3주 영업일)
  ]
}
```

#### `GET /api/stocks/AAPL/chart?period=3W`
```typescript
// 미국 종목은 동일 구조, 가격만 USD
// period 별 데이터 수 (DB 보관: 3주):
//   1W: 일봉 5개
//   2W: 일봉 ~10개
//   3W: 일봉 ~15개 (최대)
// ※ 1M 이상 장기 차트는 Post-MVP (DB에 3주치만 보관)
```

---

### 3.3 시장 (`/api/market`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/market/indices` | 주요 지수 (KOSPI, KOSDAQ, S&P500, NASDAQ) |
| GET | `/api/market/kr/movers` | 한국 시장 등락 TOP |
| GET | `/api/market/us/movers` | 미국 시장 등락 TOP |
| GET | `/api/market/exchange-rate` | USD/KRW 환율 |

#### `GET /api/market/indices`
```typescript
// Response 200
{
  indices: [
    {
      symbol: "KOSPI",
      name: "코스피",
      value: 2847.52,
      change: 33.81,
      changePercent: 1.20,
      updatedAt: "2026-03-14T06:30:00Z"
    },
    {
      symbol: "KOSDAQ",
      name: "코스닥",
      value: 892.15,
      change: 7.12,
      changePercent: 0.80,
      updatedAt: "2026-03-14T06:30:00Z"
    },
    {
      symbol: "SPX",
      name: "S&P 500",
      value: 5234.18,
      change: -15.72,
      changePercent: -0.30,
      updatedAt: "2026-03-14T00:00:00Z"
    },
    {
      symbol: "IXIC",
      name: "나스닥",
      value: 16742.39,
      change: 83.71,
      changePercent: 0.50,
      updatedAt: "2026-03-14T00:00:00Z"
    }
  ]
}
```

#### `GET /api/market/kr/movers?type=gainers&limit=5`
```typescript
// Response 200
{
  gainers: [
    { ticker: "005930", name: "삼성전자", price: 72400, changePercent: 2.26 },
    // ...
  ],
  losers: [
    { ticker: "066570", name: "LG전자", price: 98500, changePercent: -1.80 },
    // ...
  ]
}
```

#### `GET /api/market/exchange-rate`
```typescript
// Response 200
{
  pair: "USD/KRW",
  rate: 1342.50,
  change: 2.30,
  changePercent: 0.17,
  updatedAt: "2026-03-14T06:00:00Z"
}
```

---

### 3.4 뉴스 (`/api/news`)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/news?category={cat}&page={n}` | 뉴스 목록 |
| GET | `/api/news/latest?limit=5` | 최신 뉴스 (홈용) |

#### `GET /api/news?category=KR_MARKET&page=1&limit=10`
```typescript
// Response 200
{
  news: [
    {
      id: "clx...",
      title: "반도체 업종 강세...삼성전자 3% ↑",
      summary: "외국인 매수세에 힘입어 반도체 업종이...",
      source: "한국경제",
      imageUrl: "https://...",
      category: "KR_MARKET",
      publishedAt: "2026-03-14T04:30:00Z",
      relatedTickers: ["005930", "000660"]
    },
    // ...
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 156,
    totalPages: 16
  }
}
```

---

### 3.5 관심종목 (`/api/watchlist`) — 인증 필요

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/watchlist` | 내 관심종목 목록 |
| POST | `/api/watchlist` | 관심종목 추가 |
| DELETE | `/api/watchlist/[ticker]` | 관심종목 삭제 |

#### `GET /api/watchlist`
```typescript
// Response 200 (인증 필요)
{
  watchlist: [
    {
      ticker: "005930",
      name: "삼성전자",
      market: "KR",
      price: 72400,
      change: 1600,
      changePercent: 2.26,
      addedAt: "2026-03-10T02:00:00Z"
    },
    // ...
  ]
}

// Response 401
{ error: "로그인이 필요합니다." }
```

#### `POST /api/watchlist`
```typescript
// Request
{ ticker: "AAPL" }

// Response 201
{ message: "관심종목에 추가되었습니다." }

// Error 409
{ error: "이미 관심종목에 등록된 종목입니다." }
```

---

## 4. 데이터 수집 파이프라인

> **상세 문서: `.ai/data-pipeline.md`로 이관됨**
> 수집 대상, Cron 스케줄, 저장/조회/정리 전략, 캐싱, 장애 대응 전체 포함

### 4.1 수집 스케줄 (요약 — 상세는 data-pipeline.md §3 참조)

| 작업 | 주기 | 시간 (KST) | 데이터 소스 |
|------|------|-----------|------------|
| 한국 시세 | 15분 | 09:00~15:30 (장중) | 한투 API |
| 한국 장마감 일봉 | 1회/일 | 15:30 | 한투 API |
| 미국 시세 | 15분 | 22:00~05:00 (장중) | Yahoo Finance |
| 미국 장마감 일봉 | 1회/일 | 06:15 (화~토) | Yahoo Finance |
| 미국 장전/장후 | 1시간 | 장 외 시간 | Yahoo Finance |
| 지수 | 5분 | 한국/미국 장중 | 한투/Yahoo |
| 환율 | 1시간 | 09:00~18:00 | 한국은행 API |
| 뉴스 | 30분 | 상시 24시간 | KR: Naver Finance 스크래핑 + Google RSS / US: Google RSS + Yahoo RSS |
| 종목 마스터 | 주 1회 | 일요일 06:00 | KRX / Yahoo |
| 데이터 정리 | 주 1회 | 일요일 05:00 | - |

> **§4.2~4.6 상세 내용은 `.ai/data-pipeline.md`로 이관되었습니다.**
> 수집 아키텍처, API 연동, 캐싱 전략, 뉴스 파이프라인 전체를 포함합니다.

---

### 4.6 뉴스 데이터 파이프라인

> 상세: `data-pipeline.md` §3.6 참조

---

## 5. 인증 시스템

### 5.1 NextAuth.js 설정

```typescript
// auth.ts (Auth.js v5)
providers: [
  Credentials({
    credentials: {
      email: { type: "email" },
      password: { type: "password" },
    },
    authorize: async (credentials) => {
      // 1. email로 사용자 조회
      // 2. bcrypt.compare(password, user.password)
      // 3. 성공 시 user 반환, 실패 시 null
    },
  }),
  // Post-MVP: Google, Kakao
]

session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60,  // 30일
}

pages: {
  signIn: "/auth/login",
  newUser: "/auth/register",
}
```

### 5.2 미들웨어 보호

```typescript
// middleware.ts
// 보호 경로: /watchlist, /settings, /api/watchlist
// 비보호 경로: /, /market/*, /stock/*, /news/*, /auth/*

export const config = {
  matcher: ["/watchlist/:path*", "/settings/:path*", "/api/watchlist/:path*"]
}
```

### 5.3 비밀번호 정책

```
최소 8자
영문 + 숫자 필수
특수문자 권장
bcrypt saltRounds: 12
```

---

## 6. 프로젝트 디렉토리 구조 (백엔드 부분)

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   └── [...nextauth]/route.ts
│       ├── stocks/
│       │   ├── search/route.ts
│       │   ├── popular/route.ts
│       │   └── [ticker]/
│       │       ├── route.ts
│       │       ├── chart/route.ts
│       │       └── news/route.ts
│       ├── market/
│       │   ├── indices/route.ts
│       │   ├── exchange-rate/route.ts
│       │   ├── kr/movers/route.ts
│       │   └── us/movers/route.ts
│       ├── news/
│       │   ├── route.ts
│       │   └── latest/route.ts
│       └── watchlist/
│           ├── route.ts
│           └── [ticker]/route.ts
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── auth.ts               # NextAuth config
│   ├── validators/
│   │   ├── auth.ts           # Zod schemas for auth
│   │   └── stock.ts          # Zod schemas for stock queries
│   └── data-sources/
│       ├── kis.ts            # 한국투자증권 API client
│       ├── yahoo.ts          # Yahoo Finance wrapper
│       ├── news-kr.ts        # 한국 뉴스: Naver Finance 스크래핑 + Google RSS
│       ├── news-us.ts        # 미국 뉴스: Google RSS + Yahoo Finance RSS
│       └── exchange-rate.ts  # 환율 API client
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts               # 초기 종목 마스터 시딩
│   └── migrations/
└── types/
    ├── stock.ts              # Stock, Quote, DailyPrice types
    ├── news.ts               # News types
    └── market.ts             # Index, ExchangeRate types
```

---

## 7. 환경변수

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# 한국투자증권
KIS_APP_KEY="..."
KIS_APP_SECRET="..."
KIS_BASE_URL="https://openapi.koreainvestment.com:9443"

# 미국 주식: Yahoo Finance (unofficial) / Alpha Vantage (Fallback)
# 야후는 패키징이므로 별도 키 불필요. Alpha Vantage 키 추가:
ALPHA_VANTAGE_API_KEY="..."

# News (NewsAPI는 로컬 개발 전용, 프로덕션은 RSS 기반)
NEWS_API_KEY="..."           # 선택: 로컬 개발 시에만 사용
USE_NEWS_API="false"         # true로 설정 시 NewsAPI 활성화 (localhost 전용)

# Exchange Rate
EXCHANGE_RATE_API_KEY="..."
```

---

## 8. 에러 처리 패턴

```typescript
// 공통 에러 응답 형식
type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
}

// HTTP 상태 코드
// 200: 성공
// 201: 생성 성공
// 400: 잘못된 요청 (validation 실패)
// 401: 인증 필요
// 404: 리소스 없음
// 409: 충돌 (중복)
// 429: 요청 제한 초과
// 500: 서버 에러

// 외부 API 에러 → 클라이언트에 전파하지 않고, 캐시된 데이터 반환
// 외부 API 타임아웃: 5초
// 재시도: 최대 2회 (exponential backoff)
```
