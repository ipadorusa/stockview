# 백엔드 개발자 분석: 기능 기획 검토

> 분석일: 2026-03-26 | 분석자: 백엔드 개발자 (dev-backend)
> 검토 대상: 03-feature-analysis.md, spec-data-quality.md, spec-portfolio.md, 04-reform-plan.md, pm-review-free-alternatives.md

---

## 1. 데이터 품질 개선 구현 분석 (spec-data-quality.md)

### 1.1 DailyPrice 보존 기간 변경

**현재 코드 확인 (`src/app/api/cron/cleanup/route.ts` line 39-48)**:
- 실제 코드는 `days365Ago` (365일)로 이미 설정되어 있음
- CLAUDE.md에 "21일"이라고 기재된 것은 **구 정보**. 기획서(03-feature-analysis.md)에서도 이미 365일로 확인

**PM 결정 (pm-review-free-alternatives.md §1.8)**:
- Supabase Free 500MB 기준 365일 유지 (현행 유지)
- 기획서(spec-data-quality.md §1)의 3년(1,095일) 확장안은 **PM 결정과 충돌** → 3년 확장 불가

**실제 용량 추정**:
- 4,800종목 x 365일 x ~80bytes/레코드 ≈ 140MB
- 현재 TechnicalIndicator(90일), News(60일), 기타 모델 합산 시 전체 DB 약 250~300MB 추정
- 500MB Free Tier 내 여유 있으나, 종목 확대(1,500개 추가) 시 위험

**결론**: 변경 불필요. 현행 365일 유지. 기획서의 3년 확장은 PM 결정에 따라 보류.

### 1.2 Fundamentals 배치 크기 변경

**현재 코드 확인 (`src/app/api/cron/collect-fundamentals/route.ts`)**:
- `BATCH = 100` (line 22)
- `maxDuration = 60` (line 8)
- US 100개 + KR 100개 = 200개/회
- 정렬: `fundamental.updatedAt: "asc"` (가장 오래된 것부터) — 단순 라운드로빈
- 스케줄: 토요일 23:00 KST 주 1회 (`cron-fundamentals.yml`)

**기획서 vs PM 결정 충돌**:

| 항목 | 기획서 (spec-data-quality.md) | PM 결정 (pm-review) |
|------|------------------------------|---------------------|
| 배치 크기 | 250개 (US+KR=500) | 100개 (US+KR=200) |
| maxDuration | 300 (Vercel Pro) | 60 (Hobby) |
| 스케줄 | 주 3회 (화/목/토) | 평일 매일 (주 5회) |
| 전체 갱신 주기 | ~3.2주 | ~10주 |

**PM 결정 기준 실현성 분석**:
- KR Naver 스크래핑: 200ms/req x 100개 = 20초
- US Yahoo 펀더멘탈: 5 concurrent x 100개 ≈ 10초
- DB upsert 200개: 약 5~10초
- **총 예상: 35~40초 → 60초 내 가능** (여유 있음)

**우선순위 큐 구현 현실성**:
기획서는 `watchlist._count: "desc"` 정렬을 제안했으나, Prisma에서 relation count 기반 orderBy는 **관계 깊이 제한**이 있음. 현재 코드의 `fundamental.updatedAt: "asc"` orderBy와 `watchlist._count` 를 동시에 사용하려면 raw query가 필요하거나, 2단계 쿼리가 필요함.

**현실적 대안**:
```typescript
// 1단계: 관심종목 보유 종목 우선 수집
const watchedStocks = await prisma.stock.findMany({
  where: { market: "US", isActive: true, watchlist: { some: {} } },
  select: { id: true, ticker: true },
  take: 30, // 관심종목 최대 30개 먼저
})
// 2단계: 나머지 70개를 updatedAt ASC로
const remainingStocks = await prisma.stock.findMany({
  where: { market: "US", isActive: true, id: { notIn: watchedStocks.map(s => s.id) } },
  orderBy: [{ fundamental: { updatedAt: "asc" } }, { id: "asc" }],
  take: BATCH - watchedStocks.length,
})
```

이 방식이면 복잡도 낮고 구현 가능. **예상 공수: 30분**.

**결론**: PM 결정 따라 BATCH=100 유지, 스케줄만 평일 매일로 변경. 우선순위 큐는 2단계 쿼리로 간단히 구현 가능.

### 1.3 Compare 페이지 API 버그

**코드 확인 (`src/app/compare/page.tsx` line 33)**:
```typescript
const res = await fetch(`/api/stock/${ticker}`)
```

**실제 API 라우트**: `src/app/api/stocks/[ticker]/route.ts` → 경로는 `/api/stocks/[ticker]`

- **버그 확인**: `stock` vs `stocks` — `s` 누락으로 404 반환. 비교 기능 완전 미작동.
- **수정 범위**: 1줄 변경. 다른 파일 영향 없음.
- **예상 공수: 1분**. 즉시 수정 가능.

### 1.4 PBR null 덮어쓰기

**현재 코드 확인**:

1. `collect-kr-quotes/route.ts` line 139: `pbr: null` — **매번 null로 덮어쓰기 확인**
2. `collect-fundamentals/route.ts` line 69-74, 125-130: `f.pbr != null`이면 StockQuote.pbr에 저장

**실제 데이터 흐름 문제**:
- KR 파이프라인: 평일 16:00 → collect-kr-quotes → `pbr: null`로 upsert
- Fundamentals: 토요일 23:00 → PBR 수집 → StockQuote.pbr에 저장
- **월~금 매일 PBR이 null로 리셋됨** → 토요일에만 PBR이 보임

**기획서 방안 A (권장) 검증**:
`collect-kr-quotes`의 upsert에서 `update` 부분에서 `pbr`을 제거하고, `create`에만 `pbr: null`을 두는 방식.

그러나 **현재 코드 구조를 보면**, `quoteData` 객체를 `update`와 `create` 양쪽에 사용하고 있음 (line 143-147):
```typescript
const quoteData = { ..., pbr: null, ... }
return prisma.stockQuote.upsert({
  where: { stockId },
  update: quoteData,
  create: { stockId, ...quoteData },
})
```

따라서 수정 방법:
```typescript
const quoteData = {
  price: s.price,
  previousClose: s.previousClose,
  // ... 나머지 필드
  // pbr 제거
}
return prisma.stockQuote.upsert({
  where: { stockId },
  update: quoteData, // pbr 미포함 → 기존 값 유지
  create: { stockId, ...quoteData, pbr: null }, // 신규 생성 시만 null
})
```

**예상 공수: 10분**. 리스크 낮음.

### 1.5 52주 고저 일괄 수집

**현재 코드 확인**:

1. `collect-kr-quotes/route.ts` line 106-119: DailyPrice.groupBy로 52주 고저 계산 — **이미 일괄 수집 중**
2. `stocks/[ticker]/route.ts` line 29-35: null일 때 `fetchNaverStock52w` 개별 스크래핑 — **API 응답 지연 원인**

**기획서 제안 검증**:
- 크론에서 DailyPrice 부족 종목에 Naver 52w fallback 추가 (최대 50개)
- API에서 개별 스크래핑 제거

**우려 사항**:
- 50개 x 200ms(rate limit) = 10초 추가 — `collect-kr-quotes`는 이미 `maxDuration=300` (Vercel Pro) 사용 중
- **Hobby 60초 제약 하에서**: 이미 KR quotes 크론 자체가 `maxDuration=300`으로 설정되어 있음. **Hobby에서는 이 크론 자체가 60초 제약에 걸릴 수 있음**

**심각한 발견**: `collect-kr-quotes/route.ts` line 10에 `export const maxDuration = 300`이 설정되어 있음. 이는 **Vercel Pro를 전제로 한 코드**임. PM이 Hobby 60초 내 운영을 지시했으나, 기존 KR quotes 크론도 이미 Pro를 요구하는 상황.

- KR 활성 종목 ~4,300개 x 100개 배치 upsert → DailyPrice createMany + StockQuote upsert 43배치
- 52주 고저 groupBy 쿼리
- MarketIndex upsert
- **60초 내 처리 가능 여부**: createMany는 skipDuplicates로 빠르지만, upsert 43배치(각 100개 Promise.allSettled)는 시간 소요. **실측 필요하나 60초 초과 가능성 높음**

**결론**: 52w fallback 추가 전에, KR quotes 크론 자체의 Hobby 60초 호환성을 먼저 검증해야 함. 이것은 기획서에서 누락된 중요한 기술적 제약.

---

## 2. 포트폴리오 기능 구현 분석 (spec-portfolio.md)

### 2.1 DB 스키마 검토

**현재 Prisma schema 확인**:
- Watchlist: `@@unique([userId, stockId])` — 같은 종목 중복 추가 불가
- 기획서의 방안 B (별도 PortfolioEntry 모델) 판단: **적절함**

**PortfolioEntry 모델 설계 검토**:

```prisma
model PortfolioEntry {
  buyPrice  Decimal  @db.Decimal(18, 4)
  quantity  Decimal  @db.Decimal(18, 4)
  buyDate   DateTime @db.Date
  memo      String?  @db.VarChar(500)
  groupName String?  @db.VarChar(50)
}
```

| 필드 | 평가 |
|------|------|
| `Decimal(18,4)` buyPrice | **적절**. KRW 정수도 USD 소수도 커버. 기존 StockQuote와 동일 precision |
| `Decimal(18,4)` quantity | **적절**. US 소수점 매수(fractional shares) 지원. KR은 정수만이지만 decimal이 안전 |
| `@db.Date` buyDate | **적절**. 시간 정보 불필요 |
| `VarChar(500)` memo | **적절**. Text 불필요, 500자면 충분 |
| `VarChar(50)` groupName | **적절**. 별도 Group 테이블 없이 문자열로 관리하는 것은 단순성 면에서 합리적 |

**인덱스 설계**:
- `@@index([userId])` — 사용자별 조회: 필수
- `@@index([userId, groupName])` — 그룹별 조회: 유용
- `@@index([stockId])` — 종목 삭제 시 cascade 성능: 적절

**누락 검토**:
- `@@index([userId, stockId])` 복합 인덱스 추가 권장 — 사용자별 특정 종목 조회 시 유용
- unique 제약 없음 (같은 종목 복수 매수 허용) — 의도적이며 적절

### 2.2 API 설계 검토

**GET /api/portfolio 응답 구조**:
기획서의 그룹별 계층 응답은 좋으나, **수익률 계산을 서버에서 하는 것의 문제**:

1. **현재가 조회**: PortfolioEntry JOIN Stock JOIN StockQuote → 3 테이블 조인
2. 항목이 많을 때 계산 비용: N개 항목 x (currentPrice - buyPrice) 계산 자체는 가벼움
3. **서버 계산 권장**: 클라이언트 계산 시 현재가 별도 fetch 필요 → 오히려 비효율

**N+1 쿼리 위험**:
기획서의 구현 참고 코드에 N+1 문제 없음. Prisma `include`로 한 번에 조회 가능:
```typescript
const entries = await prisma.portfolioEntry.findMany({
  where: { userId },
  include: {
    stock: {
      include: { quotes: { take: 1, orderBy: { updatedAt: "desc" } } }
    }
  }
})
```
단일 쿼리로 전체 데이터 가져올 수 있음. **N+1 위험 없음**.

**환율 변환 없이 시장별 통화 표시**:
- Phase 2에서 환율 변환 제외는 합리적
- 다만 **전체 요약(summary)에서 totalCost/totalValue를 단순 합산하면 KRW+USD 혼합** → 의미 없는 숫자
- **대안**: summary를 시장별로 분리하거나, 전체 합산 시 환율 변환 적용. Phase 2 기획 시 반드시 고려 필요.

**Zod 스키마**: 적절. `z.number().positive()`로 음수/0 방지, 날짜 regex 검증 포함.

### 2.3 미들웨어/인증

**현재 proxy.ts 확인**:
- 보호 경로: `/watchlist`, `/settings`, `/mypage`, `/api/watchlist`, `/reports/stock`, `/board/new`, `/board/[id]/edit`
- `config.matcher`에도 명시적으로 등록해야 함

**포트폴리오 추가 방법**:
```typescript
// proxy.ts 수정
const isProtectedRoute = pathname.startsWith("/watchlist") ||
  pathname.startsWith("/settings") ||
  pathname.startsWith("/mypage") ||
  pathname.startsWith("/portfolio") ||        // 추가
  pathname.startsWith("/api/watchlist") ||
  pathname.startsWith("/api/portfolio") ||     // 추가
  // ...

// config.matcher에도 추가
matcher: [..., "/portfolio/:path*", "/api/portfolio/:path*"]
```

**예상 공수: 5분**.

### 2.4 성능 고려

- **캐싱 전략**: GET /api/portfolio는 인증 필수이므로 CDN 캐싱 불가. `Cache-Control: private, no-store` 적절.
- **현재가 신선도**: StockQuote.updatedAt 기반으로 "마지막 갱신 시간" 표시 필요
- **항목 수 제한**: 기획서에 없지만, 무제한 허용 시 DB/응답 크기 문제. **사용자당 최대 200개** 정도 제한 권장.

---

## 3. 크론잡 최적화 분석

### 3.1 현재 크론 구조 확인

**GitHub Actions 워크플로우** (15개 YAML 파일):

| 워크플로우 | 스케줄 | 의존성 |
|-----------|--------|--------|
| `cron-pipeline-kr.yml` | 평일 07:00 UTC (16:00 KST) | quotes → indicators |
| `cron-pipeline-us.yml` | 평일 21:15 UTC | quotes → indicators |
| `cron-fundamentals.yml` | 토요일 14:00 UTC | 단독 |
| `cron-news.yml` | 매 2시간 | 단독 |
| `cron-cleanup.yml` | 매일 | 단독 |
| 기타 10개 | 다양 | 단독 |

**compute-indicators 중복 실행 확인**:
- `cron-pipeline-kr.yml`과 `cron-pipeline-us.yml` 양쪽에서 `cron-indicators.yml`을 `workflow_call`로 호출
- `compute-indicators` 코드에 `market` 파라미터 **없음** → 전체 종목 재계산
- TIME_LIMIT 50초, BATCH 100개, `orderBy: updatedAt: "asc"` 커서 기반 → 50초 내 처리 가능한 만큼만 처리
- **KR 파이프라인 실행 후**: 전체 종목 대상 50초 처리 (KR 우선이 아님)
- **US 파이프라인 실행 후**: 또 전체 종목 대상 50초 처리
- **결과**: 하루에 2번 실행되어 대부분 종목 커버 가능하지만, KR 후에 US 종목이 계산되고 US 후에 KR 종목이 계산되는 비효율

### 3.2 market 파라미터 추가

**구현 방안**:
```typescript
// compute-indicators/route.ts
const market = req.nextUrl.searchParams.get("market") as "KR" | "US" | null

const stocks = await prisma.stock.findMany({
  where: {
    isActive: true,
    ...(market ? { market } : {}), // market 지정 시 해당 시장만
  },
  // ...
})
```

**파이프라인 YAML 수정**:
```yaml
# cron-pipeline-kr.yml
- name: Trigger Indicator Computation
  run: |
    curl -X POST "${{ secrets.APP_URL }}/api/cron/compute-indicators?market=KR" ...
```

**효과**: KR 파이프라인에서 KR만 계산 → 처리 시간 절반, US도 동일. 호환성 유지 (market 미지정 시 전체).

**예상 공수: 20분**.

### 3.3 GitHub Actions 무료 한도

**현재 사용량 추정**:

| 크론 | 실행 횟수/월 | 실행 시간(예상) | 월 소비 분 |
|------|-------------|----------------|-----------|
| KR pipeline | 22회 (평일) | 2분 (quotes+indicators) | 44분 |
| US pipeline | 22회 (평일) | 2분 | 44분 |
| News | 360회 (12/일) | 1분 | 360분 |
| Fundamentals | 4회 (토) | 1분 | 4분 |
| 기타 10개 | ~100회 | 1분 | 100분 |
| **합계** | | | **~552분/월** |

무료 한도 2,000분/월 기준 여유 있음.

**PM의 Fundamentals 평일 매일 변경 시**: +22회 x 1분 = +22분 → 영향 미미

**장중 5분 폴링 추가 시**:
- KR 장중 (09:00~15:30 = 6.5시간) x 12회/시간 x 22일 = 1,716회
- US 장중 (09:30~16:00 = 6.5시간) x 12회/시간 x 22일 = 1,716회
- 총 3,432회 x 1분 = **3,432분 추가 → 총 ~4,000분 → 무료 한도 2배 초과**
- PM의 30분 간격 타협안: 3,432/6 = 572분 추가 → 총 ~1,124분 → 무료 한도 내

**결론**: 장중 30분 간격이면 가능하나 여유 적음. 5분 간격은 불가. PM 결정과 일치.

---

## 4. AI 리포트 개선 분석

### 4.1 현재 Ollama 구조 확인

**`src/lib/ollama.ts` 확인**:
- `OLLAMA_URL`: 환경변수 또는 `http://localhost:11434`
- `OLLAMA_MODEL`: 환경변수 또는 `exaone3.5:7.8b`
- `num_ctx: 4096`, `temperature: 0.3`, `num_predict: 1200`
- 120초 타임아웃, withRetry 1회 재시도

**`src/lib/ai-report.ts` 확인**:
- 종목 선정: 시그널 우선 → 시총 상위 fallback
- 데이터 수집: 8개 Promise.all (stock, quote, fundamental, technical, prices, dividends, earnings, news)
- 프롬프트: 체계적 (기본정보, 시세, 밸류에이션, 기술지표, 주가추이, 배당, 실적, 뉴스)
- 파싱: `[한줄요약]`, `[투자의견]`, `[분석]` 구조화 + fallback

**시그널 쿼리 중복 확인**:
- `screener.ts`: 5개 시그널 함수 (findGoldenCross 등), LIMIT 없이 전체 매칭
- `ai-report.ts`: 동일한 5개 시그널을 `findSignalMatches`로 재구현, **LIMIT 10**
- SQL 로직은 거의 동일하나 미세한 차이 존재 (sevenDaysAgo 변수 vs CURRENT_DATE)
- **통합 가능**: screener.ts의 함수에 `limit` 파라미터 추가하면 ai-report.ts에서 재사용 가능

### 4.2 PM 결정 반영

**Oracle Cloud Free Tier + Ollama 현실성**:
- ARM 4 OCPU + 24GB RAM → 14B 모델 운영 가능 (qwen2.5:14b 약 9GB VRAM)
- **문제점**: Oracle Cloud Free Tier는 ARM(aarch64) → Ollama ARM 빌드 필요. 공식 지원됨.
- **네트워크**: Vercel → Oracle Cloud 간 레이턴시. 리포트 생성은 비동기이므로 문제 없음.
- **초기 설정**: Oracle 가입 + 인스턴스 생성 + Ollama 설치 + firewall 설정 + HTTPS 설정 → **예상 3~4시간**
- **운영 리스크**: Oracle Free Tier 인스턴스가 idle 시 회수될 수 있음 (공식 정책). cron keep-alive 필요.

**Groq API 무료 플랜 연동 가능성**:
- OpenAI 호환 API → `ollama.ts`를 약간 수정하면 연동 가능
- Llama 3.3 70B: 한국어 품질은 exaone보다 낮을 수 있으나, 모델 크기(70B)로 보상
- 분당 30 req 제한: 일 5개 리포트 생성 기준 충분
- **구현**: `OLLAMA_URL`을 `https://api.groq.com/openai/v1`로 변경 + API key 헤더 추가
- Groq는 `/chat/completions` (OpenAI 호환), Ollama는 `/api/chat` → **엔드포인트 분기 필요**
- **예상 공수: 1~2시간** (groq.ts 신규 파일 + 환경변수 기반 분기)

**모델 교체 영향 (exaone → qwen2.5:14b)**:
- `ollama.ts`에서 `OLLAMA_MODEL` 환경변수로 관리됨 → 코드 변경 없이 환경변수만 변경
- 다만 `num_ctx: 4096` → `8192` 변경 시 메모리 사용량 증가. 로컬 개발 환경에서는 문제 없으나 Oracle Free Tier에서 14B + 8192 ctx는 24GB에 빠듯할 수 있음
- **권장**: `num_ctx: 6144`로 타협하거나, 12B 이하 모델 사용

---

## 5. Rate Limit 분석

### 5.1 현재 구현 확인

**`src/lib/rate-limit.ts` 확인**:
- In-memory `Map<string, number[]>` 기반 sliding window
- 10분마다 만료 엔트리 정리 (setInterval)
- **Serverless에서 무의미한지 검증**: Vercel Serverless Functions는 요청마다 인스턴스가 생성/재사용됨. warm 인스턴스 간에는 Map이 유지되지만, 인스턴스가 여러 개 뜨면 각각 독립적인 Map을 가짐 → **인스턴스 간 공유 불가, 실질적으로 무의미**

**실제 사용처 확인**:
- `collect-us-quotes`: Yahoo API 호출 시 자체 rate limit
- `auth/register`: 회원가입 남용 방지

기획서의 "무의미" 평가에 **동의**. 단, 단일 인스턴스 내에서는 동작하므로 완전히 무의미하지는 않음. warm 인스턴스에 연속 요청이 오면 일정 수준의 보호는 됨.

### 5.2 대안

**Edge Middleware 기반 rate limit**:
- `proxy.ts`가 이미 Edge에서 실행됨 (NextAuth middleware)
- Edge는 단일 인스턴스가 아니라 글로벌 엣지 노드에서 실행되므로 **여전히 분산 문제 존재**
- 다만 간단한 토큰 버킷 정도는 구현 가능

**Supabase DB 기반 rate limit**:
- `rate_limit` 테이블에 IP + timestamp 저장
- 매 요청마다 DB 조회 → **레이턴시 추가 (50~100ms)**
- 크론 API는 이미 CRON_SECRET으로 보호되므로 불필요
- 공개 API 중 남용 가능성이 높은 것: `/api/stocks/[ticker]`, `/auth/register`

**결론**: 현재 수준에서 rate limit 개선은 낮은 우선순위. 사용자 기반이 크지 않다면 현행 유지. 문제 발생 시 Upstash Redis 무료(10,000 req/일) 도입 검토.

---

## 6. 기획 검토 의견

### 6.1 동의하는 부분

1. **Compare API 버그 수정**: 즉시 수정 필요. 확인 완료.
2. **PBR null 덮어쓰기 수정**: 코드 확인 결과 실제로 매일 리셋됨. 방안 A 적절.
3. **PortfolioEntry 별도 모델**: Watchlist 확장보다 명확한 분리가 낫음. 스키마 설계 적절.
4. **compute-indicators market 파라미터**: 간단하고 효과적.
5. **시그널 쿼리 중복 제거**: screener.ts와 ai-report.ts의 거의 동일한 SQL 통합 필요.

### 6.2 우려 사항

**1. collect-kr-quotes의 Vercel Hobby 호환성 (기획서 모두 누락)**

가장 중요한 발견: `collect-kr-quotes/route.ts`에 `maxDuration = 300`이 이미 설정됨. 이는 **Vercel Pro를 전제로 작성된 코드**. PM이 Hobby 60초 제약을 지시했으나, KR quotes 크론이 4,300개 종목의 DailyPrice createMany + StockQuote upsert를 60초 내 처리할 수 있는지 검증이 필요.

- DailyPrice createMany (skipDuplicates): 4,300개 단일 쿼리 → 약 2~5초
- StockQuote upsert: 43배치 x 100개 Promise.allSettled → 각 배치 ~2초 x 43 = ~86초 → **60초 초과 가능**

**대안**: StockQuote도 batch upsert로 변경하거나, 종목 수를 분할하여 2회에 나눠 실행.

**2. 시간 추정의 현실성**

| 항목 | 기획서 예상 | 실제 예상 | 차이 사유 |
|------|-----------|----------|----------|
| Compare 버그 | 5분 | 1분 | 과대 추정 (1줄 변경) |
| PBR 수정 | 10분 | 15분 | upsert 구조 변경 + 테스트 필요 |
| 52주 고저 | 30분 | 1시간 | Hobby 60초 호환성 검토 포함 |
| Fundamentals | 20분 | 30분 | 우선순위 큐 로직 + YAML 수정 |
| 포트폴리오 전체 | 6시간 | 8~10시간 | 환율 혼합 문제, 에러 핸들링, 그룹 관리 UI 복잡도 과소추정 |

**3. DB 마이그레이션 리스크**

PortfolioEntry 모델 추가는 **신규 테이블 생성**이므로 리스크 낮음 (기존 데이터 영향 없음). 다만:
- Supabase Free Tier에서 `prisma migrate deploy`는 `DIRECT_URL` (direct connection) 필요
- Pooler URL로는 migration 불가 — 이미 설정되어 있을 것이나 확인 필요

**4. Vercel Hobby 60초 제약의 실질적 영향**

기획서들은 Hobby 제약을 부분적으로만 반영. 실제로 영향받는 크론:
- `collect-kr-quotes`: maxDuration=300 설정 → **Hobby에서 강제 60초 종료**
- `collect-fundamentals`: maxDuration=60 → OK (현재 BATCH=100)
- `compute-indicators`: maxDuration=60, TIME_LIMIT=50초 → OK
- `collect-news`: 확인 필요

### 6.3 대안 제안

**1. KR quotes 크론 분할**:
```
collect-kr-quotes-kospi (KOSPI 종목만) → 60초 내
collect-kr-quotes-kosdaq (KOSDAQ 종목만) → 60초 내
```
또는 StockQuote upsert를 `prisma.$transaction`으로 bulk update 변경.

**2. 포트폴리오 환율 처리 (Phase 2 내)**:
전체 합산 시 ExchangeRate 모델 (이미 존재)에서 USD/KRW 환율을 가져와 변환. `prisma.exchangeRate.findUnique({ where: { pair: "USDKRW" } })` 한 번 조회로 충분.

**3. AI 리포트 이중 백엔드**:
```typescript
// 환경변수로 분기
if (process.env.GROQ_API_KEY) {
  // Groq API 사용 (프로덕션)
} else {
  // Ollama 사용 (로컬 개발)
}
```
Oracle Cloud 의존성 없이 Groq 무료로 프로덕션 리포트 자동화 가능.

### 6.4 추가 제안

1. **크론 에러 알림**: Discord webhook (무료)으로 크론 실패 알림 추가 — 1시간이면 구현 가능
2. **DB 용량 모니터링**: Supabase 대시보드 수동 확인 + cleanup 크론에 용량 로깅 추가
3. **API 응답 표준화는 후순위**: 현재 동작하는 API를 일관성 위해 리팩토링하는 것은 ROI 낮음

---

## 7. 구현 우선순위 및 예상 공수 (백엔드 관점)

| # | 항목 | 기획 예상 | 실제 예상 | 비고 |
|---|------|----------|----------|------|
| 1 | Compare API 버그 수정 | 5분 | 1분 | 1줄 변경 |
| 2 | PBR null 덮어쓰기 제거 | 10분 | 15분 | upsert 구조 분리 |
| 3 | compute-indicators market 파라미터 | - | 20분 | 코드 + YAML 수정 |
| 4 | 시그널 쿼리 중복 제거 | - | 1시간 | screener.ts에 limit 파라미터 추가, ai-report.ts 리팩토링 |
| 5 | Fundamentals 스케줄 변경 | 20분 | 30분 | YAML 수정 + 우선순위 큐 |
| 6 | 52주 고저 API 개별 스크래핑 제거 | 30분 | 20분 | API 코드 삭제 (크론 fallback은 Hobby 제약으로 보류) |
| 7 | **KR quotes Hobby 60초 호환성** | 기획 누락 | **2~3시간** | 가장 중요. 분할 실행 또는 bulk upsert 변환 |
| 8 | 포트폴리오 백엔드 (스키마+API) | 2시간 | 3~4시간 | Prisma migration + CRUD API + middleware |
| 9 | Ollama 모델/설정 변경 | 즉시 | 10분 | 환경변수 변경 |
| 10 | Groq API 연동 | 1~2시간 | 2시간 | 신규 파일 + 환경변수 분기 |
| 11 | 크론 에러 알림 (Discord) | - | 1시간 | 제안 사항 |

**총 백엔드 공수 예상**: ~12~15시간 (Phase 1 전체)

---

## 8. 회의 안건 (논의 필요 사항)

### 8.1 기획서 간 충돌 사항

| 충돌 | spec-data-quality.md | pm-review | 결정 필요 |
|------|---------------------|-----------|----------|
| DailyPrice 보존 | 3년 (1,095일) | 365일 유지 | **PM 결정 따름** |
| Fundamentals 배치 | 250개, maxDuration 300 | 100개, maxDuration 60 | **PM 결정 따름** |
| Fundamentals 스케줄 | 주 3회 | 주 5회 (평일 매일) | **PM 결정 따름** (더 자주 실행) |
| AI 리포트 | Cloud LLM or VPS | Oracle Free Tier or Groq | **PM 결정 따름** |

### 8.2 기획서에서 누락된 기술적 제약

1. **`collect-kr-quotes` maxDuration=300 문제**: Hobby 60초에서 4,300개 종목 처리 불가능할 수 있음. **분할 실행 전략 합의 필요**
2. **포트폴리오 환율 혼합 문제**: KRW + USD 단순 합산은 의미 없음. Phase 2에서 어떻게 처리할지 기획 보완 필요
3. **포트폴리오 항목 수 제한**: 무제한 vs 200개 제한 → 기획 결정 필요
4. **Oracle Cloud Free Tier 인스턴스 회수 리스크**: idle 인스턴스 자동 회수 정책 → Groq API를 primary로 사용하는 것이 더 안정적

### 8.3 즉시 합의 필요 (블로커)

1. **KR quotes 크론 60초 호환 여부 실측**: Vercel Hobby에서 실제 실행 시간 측정 후, 분할 필요 여부 결정
2. **포트폴리오 환율 합산 정책**: 시장별 분리 표시 vs 원화 환산 통합 표시
3. **AI 리포트 자동화 방식**: Groq API(빠르고 안정) vs Oracle Cloud Ollama(제어권 높음) → 하나 선택 또는 fallback 구조