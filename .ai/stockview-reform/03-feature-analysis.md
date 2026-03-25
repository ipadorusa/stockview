# StockView 기능/데이터 관점 분석

> 분석일: 2026-03-25 | 분석자: 기능/데이터 기획자
> 근거: 코드베이스 전체 직접 확인 (API routes, cron jobs, data sources, DB schema, lib/)

---

## 1. 데이터 소스 및 품질

### 1.1 현재 데이터 소스 구조

| 소스 | 대상 데이터 | 수집 방식 | 안정성 |
|------|-----------|----------|--------|
| **Naver Finance** | KR 종목 마스터, 시세, 지수, 52주 고저, 펀더멘탈 | HTML 스크래핑 (EUC-KR) + fchart API + polling API | **Low** — HTML 구조 변경 시 즉시 장애 |
| **Yahoo Finance v8** | US 시세, 차트 OHLCV, 펀더멘탈, 실적, 배당, 환율 | REST API (no crumb) | **Medium** — 비공식 API, 차단 가능성 |
| **Google News RSS** | KR/US 뉴스 | RSS 피드 (4개 KR 쿼리 + 2개 US 쿼리 + Yahoo RSS) | **Medium** — 품질 변동, 리다이렉트 해석 필요 |
| **OpenDART** | KR 공시, 배당, 기업코드 | 공식 REST API (API Key) | **High** — 정부 공식 API, 일 10,000건 제한 |
| **S&P 500 CSV** | US 종목 마스터 | 정적 파일 | **High** — 다만 500개 한정 |
| **한경/매경/연합/이데일리** | KR 직접 뉴스 | RSS 직접 수집 (`news-kr-direct.ts`) | **Medium** |
| **Naver 검색 API** | KR 뉴스 보완 | `fetchNaverSearchNews` (60건) | **Medium** |
| **종목별 뉴스** | 상위 50개 종목 뉴스 | `fetchTopStocksNews` | **Medium** |
| **Ollama (로컬)** | AI 리포트 | LLM Chat API (exaone3.5:7.8b) | **Low** — 로컬 의존, 배포 환경 제약 |

### 1.2 KR 데이터 스크래핑 의존도 분석

**핵심 리스크**: KR 데이터의 80%가 Naver Finance 스크래핑에 의존

- `naver.ts`: HTML 스크래핑으로 종목 마스터, 시세, OHLCV (fchart), 지수 (polling API)
- `naver-fundamentals.ts`: 펀더멘탈 (EPS, ROE, 부채비율 등) 스크래핑
- `naver-dividends.ts`: 배당 데이터 스크래핑
- 인코딩: EUC-KR → UTF-8 변환 필요 (추가 복잡성)
- Rate limit: 200ms/req으로 자체 제한하지만, Naver 측 정책 변경 시 즉시 차단 가능

**대안 검토**:
| 대안 | 장점 | 단점 |
|------|------|------|
| 한국투자증권 OpenAPI | 공식 API, 실시간 지원 | 인증 복잡, 일일 호출 제한 |
| KRX 정보데이터시스템 | 공식, 무료 | 실시간 불가, 장마감 후 데이터만 |
| eBest/키움 OpenAPI | 실시간 호가/체결 | 계좌 필요, 인증 복잡 |
| Financial Modeling Prep | KR/US 통합 API | 유료 (월 $15~), KR 데이터 제한적 |

### 1.3 크론잡 스케줄 적절성

| 크론잡 | 현재 주기 | 평가 | 개선안 |
|--------|----------|------|--------|
| `collect-master` | 토요일 22:00 KST (주 1회) | **적절** — 종목 마스터는 변경 빈도 낮음 | - |
| `collect-kr-quotes` → `compute-indicators` | 평일 16:00 KST (파이프라인) | **보수적** — 장마감 후 1회만, 장중 데이터 없음 | 장중 5분~15분 폴링 추가 검토 |
| `collect-us-quotes` → `compute-indicators` | 평일 21:15 UTC (파이프라인) | **적절** — US 장마감 직후 | 프리마켓(04:00 ET) 추가 검토 |
| `collect-news` | 2시간 간격 24/7 | **느림** — 속보성 뉴스에 부적합 | 30분~1시간 간격으로 변경 |
| `collect-fundamentals` | 토요일 23:00 KST (주 1회) | **매우 느림** — 배치 100개, 4,800종목 전체 갱신에 48주 | 배치 500개 + 주 2~3회 |
| `compute-indicators` | KR/US 파이프라인 양쪽에서 호출 | **비효율** — market 파라미터 없이 전체 재계산 | market 파라미터 추가 |
| `cleanup` | 매일 | **주의 필요** — 아래 상세 분석 참고 | - |
| `collect-exchange-rate` | 별도 | **적절** | - |

### 1.4 Cleanup 정책 상세 분석

현재 `cleanup` 크론 (`/api/cron/cleanup/route.ts` 확인):

| 데이터 | 삭제 기준 | 영향 |
|--------|----------|------|
| News | 60일 이전 | 적절 — 뉴스 아카이브 불필요 |
| DailyPrice | **365일 이전** | **양호** — 1년 차트 지원 가능. 다만 장기(3년/5년) 차트 불가 |
| TechnicalIndicator | 90일 이전 | 적절 — 기술적 지표는 최근 데이터만 의미 |
| Disclosure | 1년 이전 | 적절 |
| Stock 비활성화 | 90일 시세 미갱신 | 적절 |

**이슈**: DailyPrice 365일은 1년 차트까지만 지원. 경쟁 서비스(네이버 증권, 키움)는 5~10년 차트 제공. Supabase 스토리지 비용 vs 사용자 경험 trade-off 필요.

---

## 2. 핵심 기능 개선 여지

### 2.1 스크리너 (현재: 5개 기술적 시그널만)

**현재 구현 (`src/lib/screener.ts`)**:
- 5개 시그널: golden_cross, rsi_oversold, volume_surge, bollinger_bounce, macd_cross
- 모두 `$queryRaw` PostgreSQL 쿼리로 구현 (타입 안전성 낮음)
- TechnicalIndicator 테이블 7일 이내 데이터만 스캔
- 매칭 결과 상위 20개만 반환, changePercent DESC 정렬
- `ai-report.ts`에서 동일한 시그널 쿼리를 **중복 구현** (LIMIT 10으로)

**개선 제안**:

| 항목 | 현재 | 개선안 | 우선순위 |
|------|------|--------|---------|
| 시그널 종류 | 기술적 5종 | + 데드크로스, RSI 과매수, 거래량 감소 (하락 시그널) | High |
| 펀더멘탈 필터 | 없음 | PER, PBR, 배당수익률, ROE 범위 필터 추가 | High |
| 복합 조건 | 단일 시그널만 | AND/OR 조합 (예: 골든크로스 + 저PER) | Medium |
| 시그널 쿼리 중복 | screener.ts + ai-report.ts 중복 | 공통 함수로 통합 | Medium |
| 정렬 옵션 | changePercent DESC 고정 | 시총, 거래량, PER 등 다양한 정렬 | Low |

### 2.2 종목 비교 (`/compare`)

**현재 구현 (`src/app/compare/page.tsx`)**:
- 2개 종목만 비교 가능 (UI에 2개 input 고정)
- ticker 직접 입력 방식 — 검색 연동 없음
- **API 경로 버그**: `/api/stock/${ticker}` 호출 — 실제 라우트는 `/api/stocks/${ticker}` (s 누락)
- 비교 항목: 시가, 등락률, 시총, PER, PBR, 배당수익률, ROE, EPS, 매출, 순이익

**개선 제안**:

| 항목 | 현재 | 개선안 |
|------|------|--------|
| 비교 종목 수 | 2개 고정 | 최대 5개까지 확장 |
| 종목 선택 | ticker 직접 입력 | SearchCommand (Cmd+K) 연동 자동완성 |
| API 버그 | `/api/stock/` (존재하지 않는 경로) | `/api/stocks/`로 수정 **(즉시 수정 필요)** |
| 차트 비교 | 없음 | 동일 기간 가격 추이 오버레이 차트 |
| 비교 저장 | 없음 | URL 파라미터로 공유 가능하게 |

### 2.3 AI 리포트

**현재 구현 (`src/lib/ollama.ts` + `src/lib/ai-report.ts`)**:
- **모델**: Ollama 로컬 (exaone3.5:7.8b) — 120초 타임아웃
- **프롬프트**: 시스템 프롬프트 + 데이터 스냅샷 (시세/밸류에이션/기술지표/가격추이/배당/실적/뉴스)
- **출력**: 한줄요약 + 투자의견(긍정/중립/부정) + 분석(500자)
- **종목 선정**: 시그널 우선 → 시총 상위 fallback, ETF 제외, 당일 중복 방지
- **데이터 저장**: AiReport 모델 (slug, signal, content, summary, verdict, dataSnapshot JSON)

**핵심 문제**:
1. **로컬 Ollama 의존**: Vercel 배포 환경에서 Ollama 실행 불가 → 실질적으로 로컬 개발 환경에서만 생성 가능
2. **모델 품질**: exaone3.5:7.8b (7.8B 파라미터) — 한국어 분석 품질 한계
3. **확장성**: 수동 트리거 or 로컬 크론만 가능, 자동화된 프로덕션 파이프라인 부재
4. **컨텍스트 윈도우**: num_ctx=4096 — 복잡한 종목 분석에 부족할 수 있음

**개선 제안**:
| 방안 | 장점 | 단점 | 비용 |
|------|------|------|------|
| Cloud LLM API (Claude/GPT) | 품질 우수, 배포 환경 독립 | API 비용 | 종목당 $0.01~0.05 |
| Ollama on VPS | 현재 구조 유지, 비용 낮음 | 인프라 관리 부담 | VPS $10~20/월 |
| 혼합 (Cloud + 캐시) | 주요 종목만 Cloud, 나머지 캐시 | 복잡도 증가 | 변동 |

### 2.4 관심종목 (Watchlist)

**현재 구현 (`src/app/watchlist/page.tsx`, `Watchlist` 모델)**:
- 단순 종목 리스트 (userId + stockId)
- 추가/삭제만 가능
- StockRow 컴포넌트로 현재가/등락률 표시
- 그룹핑, 알림, 메모, 매수가, 수량 등 없음

**개선 제안 (포트폴리오 확장)**:

```
현재 Watchlist: userId + stockId (단순 관심)
    ↓ 확장
Portfolio: userId + stockId + buyPrice + quantity + memo + groupName + alertPrice
```

| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 그룹핑 | "IT", "배당주", "미국주" 등 사용자 정의 그룹 | High |
| 매수 기록 | 매수가, 수량, 날짜 → 수익률 자동 계산 | High |
| 메모 | 종목별 투자 메모 | Medium |
| 정렬/필터 | 수익률순, 등락률순, 시총순 | Medium |
| 목표가 알림 | 지정 가격 도달 시 알림 | High (아래 알림 시스템과 연계) |

---

## 3. 신규 기능 후보 분석

### 3.1 포트폴리오 관리

| 항목 | 내용 |
|------|------|
| **필요성** | 관심종목의 자연스러운 확장, 사용자 리텐션 핵심 기능 |
| **데이터 모델** | `PortfolioEntry(userId, stockId, buyPrice, quantity, buyDate, memo, groupName)` |
| **핵심 기능** | 총 투자금, 평가금, 수익률(%), 일일 손익, 배당 수익 집계 |
| **난이도** | Medium — DB 모델 추가 + API + UI |
| **우선순위** | **P1** |

### 3.2 알림/푸시 시스템

| 항목 | 내용 |
|------|------|
| **필요성** | 경쟁 서비스 대비 핵심 누락 기능, 사용자 재방문 유도 |
| **알림 종류** | 목표가 도달, 급등/급락(5%+), 뉴스 알림, 실적 발표 D-1, 배당 권리락일 |
| **구현 방식** | Web Push (Service Worker) + 이메일 알림 (선택) |
| **데이터 모델** | `Alert(userId, stockId, type, condition, isActive, triggeredAt)` |
| **난이도** | High — Push 인프라 + 실시간 가격 체크 필요 |
| **우선순위** | **P2** (장중 시세 갱신과 연계 필요) |

### 3.3 소셜 기능 (종목 토론)

| 항목 | 내용 |
|------|------|
| **필요성** | 현재 게시판은 범용 (기능 요청/버그 제보용), 종목별 토론 부재 |
| **구현 방식** | 기존 BoardPost 모델에 `stockId` 외래키 추가, 종목 상세 페이지에 토론 탭 |
| **참고** | 네이버 증권 종목 토론방, 스톡트위츠(StockTwits) |
| **리스크** | 모더레이션 부담, 스팸/광고 관리 |
| **우선순위** | **P3** — 사용자 기반 확보 후 |

### 3.4 실시간/준실시간 데이터

| 항목 | 내용 |
|------|------|
| **현재** | 장마감 후 1일 1회 갱신 (크론) — 장중 방문자에게 전일 종가만 표시 |
| **방안 A** | 5분 폴링 (장중): GitHub Actions 5분 간격 or Vercel Cron |
| **방안 B** | 클라이언트 폴링: 사용자 브라우저에서 직접 외부 API 호출 |
| **방안 C** | WebSocket (장기): 실시간 호가/체결 스트리밍 |
| **권장** | **방안 A (서버 5분 폴링)** — 현재 아키텍처와 가장 호환, GitHub Actions 비용 고려 필요 |
| **난이도** | Medium (방안 A) / High (방안 C) |
| **우선순위** | **P1** — 가장 큰 사용자 경험 개선 |

### 3.5 해외 시장 확장

| 항목 | 내용 |
|------|------|
| **현재** | US 종목 ~500개 (S&P 500 CSV) |
| **단기** | NASDAQ 100, Russell 2000 주요 종목 추가 (Yahoo Finance API 활용) → ~1,500개 |
| **중기** | 일본(TSE), 홍콩(HKEX) — Yahoo Finance에서 `.T`, `.HK` suffix로 지원 |
| **데이터 모델** | Market enum 확장 (JP, HK 등), 통화/환율 모델 확장 |
| **우선순위** | **P3** — US 종목 확대는 P2 |

### 3.6 경제 캘린더

| 항목 | 내용 |
|------|------|
| **필요성** | FOMC, 고용지표, CPI 등 매크로 이벤트가 시장에 큰 영향 |
| **데이터 소스** | Trading Economics API (유료), Investing.com 스크래핑, 또는 직접 정적 데이터 관리 |
| **데이터 모델** | `EconomicEvent(name, date, country, importance, actual, forecast, previous)` |
| **UI** | 캘린더 뷰 + 리스트 뷰, 중요도 필터 |
| **우선순위** | **P2** |

---

## 4. 데이터 모델 개선

### 4.1 Stock + StockType 통합 구조

**현재**: Stock 모델에 `stockType: STOCK | ETF`로 구분, ETF 전용 필드 없음

**문제**:
- ETF에 필요한 정보 부재: 운용사, 총보수, 순자산총액(AUM), 추적지수, 보유종목 Top N
- `/etf/[ticker]` 페이지가 일반 종목과 동일한 데이터만 표시

**개선안**:
```prisma
model EtfDetail {
  id            String  @id @default(cuid())
  stockId       String  @unique
  issuer        String?    // 운용사 (삼성자산운용, BlackRock 등)
  expenseRatio  Decimal?   // 총보수 (%)
  aum           BigInt?    // 순자산총액
  trackingIndex String?    // 추적 지수
  category      String?    // ETF 카테고리 (국내주식, 해외주식, 채권 등)
  stock         Stock   @relation(...)
}
```

### 4.2 TechnicalIndicator 스토리지 효율

**현재**: 종목별 일별 레코드 (stockId + date unique)
- ~4,800 종목 x ~90일 보존 = ~432,000 레코드
- 13개 컬럼 (ma5, ma20, ma60, ema12, ema26, rsi14, avgVolume20, macdLine, macdSignal, macdHistogram, bbUpper, bbMiddle, bbLower)

**평가**: 현재 규모에서는 문제 없음. 90일 cleanup 적용 중이므로 무한 증가 방지됨. 종목 확대(1,500+) 시 파티셔닝 검토 필요.

### 4.3 News 카테고리 확장

**현재**: 4개 고정 enum (`KR_MARKET`, `US_MARKET`, `INDUSTRY`, `ECONOMY`)

**문제**:
- `INDUSTRY`가 너무 광범위 — 반도체/바이오/전기차/AI 등 구분 불가
- 카테고리 분류 로직이 키워드 기반 (`news-rss.ts:categorizeNews`) — 정확도 낮음

**개선안**:
```
현재: KR_MARKET | US_MARKET | INDUSTRY | ECONOMY
개선: + TECH | BIOTECH | ENERGY | FINANCE | CRYPTO | COMMODITY | GEOPOLITICS
```
또는 enum → String 변경하여 유연한 태그 시스템으로 전환

### 4.4 사용자 행동 데이터

**현재**: 사용자 행동 추적 없음 (GTM/Vercel Analytics로 페이지뷰만)

**제안 모델**:
```prisma
model UserActivity {
  id        String   @id @default(cuid())
  userId    String?
  sessionId String
  action    String   // "view_stock", "search", "add_watchlist", "compare"
  target    String?  // ticker 또는 검색어
  metadata  Json?
  createdAt DateTime @default(now())
  @@index([userId, action])
  @@index([target])
  @@index([createdAt])
}
```

**활용**: 인기 종목 집계 개선 (현재는 updatedAt 기반), 개인화 추천, 검색어 분석

---

## 5. API/백엔드 아키텍처

### 5.1 Cron 의존 구조의 한계

**현재 문제**:
- 13개 크론이 개별 GitHub Actions workflow → 관리 포인트 15개 YAML
- Vercel 함수 타임아웃: Pro 300초, Hobby 60초 → 대량 배치 처리 제약
- `compute-indicators`가 KR/US 파이프라인 양쪽에서 중복 실행 (market 파라미터 없음)
- `collect-kr-quotes`에 장전 실행 가드 있음 (KST 15:30 이전 스킵) — 좋은 패턴
- 뉴스 수집은 2시간 간격이지만 본문 추출(`extractArticleContent`) + Google 리다이렉트 해석으로 처리 시간 김

**개선 방향**:
1. **크론 통합**: 유사 스케줄 병합 (exchange-rate + indices를 KR quotes 파이프라인에 포함)
2. **market 파라미터**: `compute-indicators`에 `?market=KR` 추가하여 불필요한 재계산 방지
3. **장중 폴링**: Vercel Cron (최소 1분 간격) 또는 별도 워커 서비스

### 5.2 API 응답 일관성

**현황 확인**:
- 에러 응답: 대부분 `{ error: "메시지" }` 형태이나, HTTP status code와 함께 사용 — **일관적**
- 성공 응답: 각 API별 개별 구조 — **비일관적** (pagination 있는 곳과 없는 곳 혼재)
- Cache-Control 헤더: 각 API별 개별 설정 (s-maxage 60~900초)

**개선 제안**:
```typescript
// 표준 응답 래퍼
interface ApiResponse<T> {
  data: T
  pagination?: { page: number; limit: number; total: number; totalPages: number }
  meta?: { cachedAt: string; source: string }
}
```

### 5.3 Rate Limit 현황

**현재 구현 (`src/lib/rate-limit.ts`)**:
- In-memory sliding window (Map 기반)
- IP 키 기반, 함수: `rateLimit(key, maxRequests, windowMs)`
- setInterval 10분마다 만료 엔트리 정리
- **문제**: Vercel Serverless에서 인스턴스간 공유 불가 → 실질적으로 무의미
- 실제 사용처: `collect-us-quotes`와 `auth/register`에서만 확인

**개선 제안**:
- Vercel KV (Redis) 또는 Upstash Redis 기반으로 교체
- 또는 Vercel Edge Middleware에서 rate limit 적용

### 5.4 에러 처리 패턴

**현재 패턴 (양호)**:
- `withRetry()`: exponential backoff, 3회 재시도 (`src/lib/utils/retry.ts`)
- `Promise.allSettled()`: 배치 수집에서 개별 실패 격리
- `AbortSignal.timeout()`: 외부 요청에 타임아웃 적용 (5~15초)
- `CronLog`: 모든 크론 실행 결과 로깅

**개선점**:
- 에러 알림 없음 — 크론 실패 시 수동으로 CronLog 확인 필요
- Slack/Discord 웹훅 또는 이메일 알림 추가 권장

---

## 6. 수익화/성장 전략

### 6.1 현재 수익 구조

- **AdSense만**: AdSlot 컴포넌트로 8개+ 페이지에 배치 (홈, 시장, ETF, 스크리너, 배당, 실적, 종목비교, 종목상세)
- AdDisclaimer 컴포넌트로 광고 고지

### 6.2 프리미엄 기능 후보

| 기능 | Free | Premium | 예상 전환율 |
|------|------|---------|-----------|
| 스크리너 | 기술적 5종 | + 펀더멘탈 필터, 복합 조건, 알림 연동 | 3~5% |
| AI 리포트 | 일 3건 조회 | 무제한 + 맞춤 종목 리포트 요청 | 2~4% |
| 포트폴리오 | 1개 그룹 10종목 | 무제한 그룹/종목 + 수익률 분석 | 5~8% |
| 알림 | 3개 종목 | 무제한 + 다양한 조건 | 3~5% |
| 광고 제거 | - | 모든 AdSlot 비노출 | 1~2% |

**권장 가격**: 월 4,900원 / 연 39,000원 (국내 투자앱 대비 저가 전략)

### 6.3 SEO 콘텐츠 전략

**현재**: 투자 가이드 5개 (정적 콘텐츠)
- ETF 기초, 재무제표 읽기, 주요 지수 이해, 배당 투자, 기술적 지표

**확장 방안**:
1. **종목 분석 페이지 SEO**: AI 리포트를 SSR로 제공 (이미 `/reports/[slug]` 구현됨) — 크롤링 가능
2. **자동 생성 콘텐츠**: "삼성전자 주가 전망", "[ticker] 배당금" 등 검색 키워드 타겟 랜딩페이지
3. **가이드 확장**: 초보자 용어 사전, 계좌 개설 방법, 세금/수수료 가이드, 시장별 거래 시간 등
4. **뉴스 요약**: AI 기반 일일 시장 요약 → `/market/daily-summary` 자동 생성

---

## 7. 우선순위 종합 로드맵

### Phase 1: 즉시 개선 (1~2주)

| # | 항목 | 영향 | 난이도 |
|---|------|------|--------|
| 1 | Compare 페이지 API 경로 버그 수정 (`/api/stock/` → `/api/stocks/`) | 기능 복구 | Trivial |
| 2 | Fundamentals 배치 크기 100→500, 주 1회→주 3회 | 데이터 신선도 | Low |
| 3 | News 수집 주기 2시간→30분 | 뉴스 적시성 | Low |
| 4 | compute-indicators에 market 파라미터 추가 | 크론 효율 | Low |
| 5 | screener.ts + ai-report.ts 시그널 쿼리 중복 제거 | 유지보수성 | Low |

### Phase 2: 핵심 기능 (1~2개월)

| # | 항목 | 영향 | 난이도 |
|---|------|------|--------|
| 6 | 장중 시세 갱신 (5분 폴링) | **사용자 경험 혁신** | Medium |
| 7 | 포트폴리오 기능 (Watchlist 확장) | 리텐션 핵심 | Medium |
| 8 | 스크리너 확장 (하락 시그널 + 펀더멘탈 필터) | 기능 차별화 | Medium |
| 9 | AI 리포트 Cloud LLM 전환 | 품질/확장성 | Medium |
| 10 | DailyPrice 보존 3~5년으로 확장 | 장기 차트 | Low |

### Phase 3: 성장 기능 (3개월+)

| # | 항목 | 영향 | 난이도 |
|---|------|------|--------|
| 11 | 알림 시스템 (Web Push + 이메일) | 재방문 유도 | High |
| 12 | US 종목 확대 (1,500개+) | 시장 커버리지 | Medium |
| 13 | 경제 캘린더 | 매크로 분석 | Medium |
| 14 | 프리미엄 구독 (Stripe 연동) | 수익화 | Medium |
| 15 | 종목 토론방 (게시판 확장) | 커뮤니티 | Medium |
| 16 | ETF 전용 모델/페이지 개선 | ETF 사용자 | Medium |
| 17 | 크론 에러 알림 (Slack/Discord) | 운영 안정성 | Low |

---

## 8. 핵심 발견 요약

1. **가장 큰 약점**: 장중 시세 없음 (1일 1회 갱신) — 사용자 경험의 근본적 한계
2. **즉시 수정 필요**: Compare 페이지 API 경로 버그 (`/api/stock/` 존재하지 않음)
3. **데이터 소스 리스크**: KR 데이터 80%가 Naver 스크래핑 의존 — 중장기적으로 공식 API 전환 필요
4. **AI 리포트 병목**: Ollama 로컬 의존으로 프로덕션 자동화 불가
5. **스크리너 한계**: 기술적 시그널만, 펀더멘탈/복합 필터 없음
6. **수익화 기회**: 포트폴리오, 알림, 고급 스크리너를 프리미엄으로 묶어 구독 모델 가능
7. **Rate Limit 무의미**: In-memory 방식은 Serverless에서 인스턴스 간 공유 불가
8. **Sentiment 구현 양호**: 키워드 + 부정 접두사 패턴 인식, 한/영 모두 지원 — 다만 LLM 기반으로 고도화 여지
