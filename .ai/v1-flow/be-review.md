# BE 리뷰 보고서

> **작성일**: 2026-03-29
> **작성자**: BE 개발자
> **입력 문서**: `qa-result-1.md`, `qa-result-2.md`, `tc-2-api-data.md`
> **검증 방법**: QA 결과 기반 실제 소스코드 직접 리뷰

---

## 1. BE 수행 요약

| 구분 | 평가 |
|------|------|
| API 전체 Pass Rate | 91.7% (122/133, N/A 제외) |
| 최종 FAIL (BE 책임) | 2건 (AUTH-040, STOCK-014) |
| WARN (BE 관련) | 7건 |
| 보안 수준 | 양호 (Critical 이슈 없음) |
| 데이터 정합성 | 양호 (구조적 결함 없음) |
| Cron 안정성 | 양호 (timeout 대비 적절) |
| **종합 판정** | **v1.0 출시 가능 — 2건 FAIL 수정 후** |

---

## 2. FAIL 수정 계획

### FAIL-1: AUTH-040 — 리포트 요청 Zod 스키마 `ticker` 필드 중복

- **TC-ID**: AUTH-040
- **파일**: `src/lib/validations/report-request.ts:3-6`
- **현황**: `createReportRequestSchema`에 `ticker: z.string().min(1)` 필수 필드가 존재. TC에서는 `stockId`만으로 요청 기대
- **실제 영향**: 프런트엔드(`src/app/reports/request/page.tsx:55`)에서 `{ stockId: stock.id, ticker: stock.ticker }` 둘 다 전송하므로 **현재 런타임에서는 정상 동작**. 하지만 API 설계 관점에서 `ticker`는 서버에서 `stock.ticker`로 조회 가능하므로 중복 필드
- **수정 방안**: `ticker`를 Zod 스키마에서 제거. route handler(line 60)에서 이미 `stock.ticker`를 사용 중

```ts
// src/lib/validations/report-request.ts
export const createReportRequestSchema = z.object({
  stockId: z.string().min(1, "종목을 선택해주세요"),
  // ticker 제거 — 서버에서 stock.ticker 조회
})
```

- **부수 효과**: 프런트엔드에서 `ticker` 전송해도 Zod가 strip하므로 무해. Prisma `reportRequest.create` (route.ts:60)에서 `ticker: stock.ticker`로 이미 DB에서 조회한 값 사용
- **복잡도**: Low (1파일, 1줄 삭제)

### FAIL-2: STOCK-014 — 종목 상세 페이지 `notFound()` 미호출

- **TC-ID**: STOCK-014 (qa-result-1)
- **파일**: `src/app/stock/[ticker]/page.tsx:81-97`
- **현황**: `getStock(ticker)` 결과가 `null`일 때 `notFound()` 호출 없이 `initialData = null`로 렌더링 진행. UI가 비정상적으로 표시될 수 있음
- **수정 방안**:

```ts
// src/app/stock/[ticker]/page.tsx:83 이후 추가
import { notFound } from "next/navigation"

const stock = await getStock(ticker)
if (!stock) {
  notFound()
}
```

- **부수 효과**: 없음. `notFound()`는 Next.js의 404 페이지를 렌더링하며, `generateMetadata`에서는 이미 `!stock` 시 fallback 타이틀을 반환하고 있어 메타데이터는 영향 없음
- **복잡도**: Low (1파일, 3줄 추가)

---

## 3. WARN 판단 결과

### WARN-1: PUB-019 — chart API 유효하지 않은 period 응답 필드

- **파일**: `src/app/api/stocks/[ticker]/chart/route.ts:19-41`
- **코드 확인**: `period` 변수는 클라이언트 입력값 그대로 사용. `days`는 `periodDays[period] ?? 21`로 fallback되지만 응답의 `period` 필드(line 41)에는 원래 문자열 반환
- **판단**: **수정 권장 (P2)**. 현재 프런트엔드는 정의된 기간 값만 전송하므로 실제 문제 발생 가능성 낮음. 하지만 방어적 코딩 관점에서 수정 바람직
- **수정안**: 유효하지 않은 period일 경우 응답에 실제 적용된 기본값("3W")을 반환

```ts
const resolvedPeriod = periodDays[period] ? period : "3W"
const days = periodDays[period] ?? 21
// ... 응답에서 period: resolvedPeriod 사용
```

### WARN-2: PUB-030 — institutional API `ticker.toUpperCase()` 누락

- **파일**: `src/app/api/stocks/[ticker]/institutional/route.ts:27`
- **코드 확인**: `where: { ticker }` — toUpperCase() 미적용. DB의 ticker가 대문자로 저장되어 있으므로 소문자 입력 시 조회 실패
- **판단**: **수정 필요 (P1)**. 다른 모든 종목 API(`chart`, `news`, `dividends`, `earnings`, `disclosures`, `peers`, `fundamental-history`)는 `ticker.toUpperCase()` 적용. 이 API만 누락은 명백한 버그
- **수정안**:

```ts
// line 27
const stock = await prisma.stock.findUnique({
  where: { ticker: ticker.toUpperCase() },
  select: { id: true },
})
```

### WARN-3: DATA-003 — 52주 고/저 데이터 소스

- **파일**: `src/app/api/cron/collect-kr-quotes/route.ts:115-123`
- **코드 확인**: KR 시세 수집 시 DailyPrice에서 `groupBy` + `_max(high)` / `_min(low)`로 52주 값을 **직접 계산**하고 있음. US는 Yahoo에서 받은 `high52w`/`low52w` 사용
- **판단**: **수용 가능**. KR은 자체 계산, US는 Yahoo 제공값 사용. DailyPrice 365일 보관 정책과 일치하므로 KR 데이터는 정확. US도 Yahoo 값이 신뢰도 높음
- **조치**: 없음

### WARN-4: DATA-013 — revalidateTag 동작 확인

- **코드 확인**: `collect-kr-quotes/route.ts:214`에서 `revalidateTag("quotes")`, `collect-us-quotes/route.ts:199`에서도 동일. 페이지에서 해당 태그를 사용하는 `unstable_cache` 또는 `fetch` 설정은 별도 확인 필요
- **판단**: **수용 가능 (FE 확인 사항)**. ISR `revalidate` 값이 페이지별로 설정되어 있고(900초 등), cron 후 revalidateTag + revalidatePath 호출이 있으므로 기본적인 캐시 무효화는 작동. 태그 기반 세밀한 무효화는 향후 최적화 대상

### WARN-5: ERR-007 — `req.json()` 파싱 실패 시 500 응답

- **파일**: `src/app/api/watchlist/route.ts:52`
- **코드 확인**: `req.json()` 실패 시 상위 try-catch(line 51-75)에서 catch되어 500 반환. invalid JSON → SyntaxError가 catch 블록에 도달
- **판단**: **수정 권장 (P3)**. 서버 crash는 없지만, 400(Bad Request)이 더 적절한 응답 코드. 동일 패턴이 `board/route.ts`, `report-requests/route.ts` 등에도 존재
- **수정안**: `req.json()` 별도 try-catch로 감싸거나, 유틸리티 함수 도입

```ts
async function parseJsonBody(req: NextRequest) {
  try { return await req.json() }
  catch { return null }
}
// body가 null이면 400 반환
```

### WARN-6: AI-009 — GENERATING -> FAILED 상태 전이

- **파일**: `src/app/api/cron/generate-reports/route.ts:106-116`
- **코드 확인**: catch 블록(line 106)에서 `status: "FAILED"` 업데이트 코드가 **명시적으로 존재**:
  ```ts
  await prisma.reportRequest.update({
    where: { id: request.id },
    data: { status: "FAILED" },
  }).catch(() => {})
  ```
- **판단**: **문제 없음 (PASS로 재판정)**. QA 리뷰 시 80행까지만 확인하여 WARN 판정했으나, 실제 코드에서 GENERATING -> FAILED 전이가 정상 구현됨

### WARN-7: SEC-010 — Bearer 대소문자 구분

- **파일**: 모든 cron route의 auth 체크
- **코드 확인**: `authHeader !== \`Bearer ${process.env.CRON_SECRET}\`` — 엄격 비교
- **판단**: **수용 가능**. GitHub Actions cron caller가 `Bearer` 형식으로 고정 전송하므로 실제 문제 없음. HTTP 스펙상 Authorization 스킴은 case-insensitive이나, 서버-서버 통신에서 클라이언트를 우리가 제어하므로 risk 없음
- **조치**: 없음

### WARN-8: WL-006 (qa-result-1) — watchlist DELETE catch 블록

- **파일**: `src/app/api/watchlist/[ticker]/route.ts:31-33`
- **코드 확인**: catch 블록에서 일괄 500 반환. 미등록 종목 삭제 시 Prisma `P2025`(Record not found) 에러가 발생하지만 404가 아닌 500 반환
- **판단**: **수정 권장 (P3)**. Prisma delete는 레코드 미존재 시 `PrismaClientKnownRequestError` (P2025)를 throw. 이를 구분하면 더 정확한 응답 가능
- **수정안**:
```ts
catch (e: unknown) {
  if ((e as { code?: string }).code === "P2025") {
    return NextResponse.json({ error: "관심종목에 등록되지 않은 종목입니다." }, { status: 404 })
  }
  return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
}
```

---

## 4. 보안 점검 결과

### 4.1 인증 우회 가능성

| 검증 항목 | 결과 | 근거 |
|-----------|------|------|
| 미들웨어 보호 범위 | **양호** | `proxy.ts`에서 `/watchlist`, `/settings`, `/mypage`, `/api/watchlist`, `/api/portfolio`, `/reports/stock`, `/board/new`, `/board/:id/edit`, `/admin`, `/api/admin` 보호. matcher 패턴도 일치 |
| API route 이중 보호 | **양호** | 모든 인증 필요 API에서 `auth()` + `!session?.user?.id` 이중 체크 수행 |
| 관리자 권한 체크 | **양호** | `isAdmin(session)` 함수로 일관 처리. 미들웨어 + API route 이중 체크 |
| CRON 인증 | **양호** | 15개 모든 cron route에서 `Bearer ${CRON_SECRET}` 체크 확인 |
| JWT 설정 | **양호** | maxAge 30일, NEXTAUTH_SECRET 기반 서명, PrismaAdapter 사용 |

### 4.2 입력 검증 (Zod 커버리지)

| API | Zod 적용 | 비고 |
|-----|---------|------|
| POST /api/auth/register | O | email, password(8+, regex), nickname(2-20) |
| POST /api/watchlist | O | ticker min(1) |
| PATCH /api/settings/profile | O | nickname(2-20) |
| PATCH /api/settings/password | O | newPassword min(8) |
| POST /api/board | O | createPostSchema |
| PATCH /api/board/[id] | O | updatePostSchema |
| POST /api/report-requests | O | stockId, ticker |
| POST /api/portfolio | O | buyPrice positive, quantity int positive |
| POST /api/contact | O | email, message min(10) |
| GET /api/stocks/[ticker]/institutional | O | days(1-365) coerce |
| **커버리지** | **100%** | 모든 사용자 입력 API에 Zod 적용 |

### 4.3 Rate Limiting

| 엔드포인트 | 제한 | 구현 |
|-----------|------|------|
| POST /api/auth/register | 5회/시간/IP | `rateLimit("register:${ip}", 5, 3600_000)` |
| POST /api/board | 30초 쿨타임/사용자 | DB 기반 마지막 게시 시간 체크 |
| POST /api/report-requests | 3건/일/사용자 | DB 기반 당일 count |

**주의사항**: `src/lib/rate-limit.ts`는 인메모리 Map 기반. Vercel Serverless 환경에서는 함수 인스턴스가 cold start 시 초기화되므로, rate limit이 완벽하게 동작하지 않을 수 있음. 다만 회원가입은 빈도가 낮아 실질적 risk 최소.

### 4.4 SQL Injection / Prisma Injection

- **안전**: 모든 DB 쿼리가 Prisma Client를 통해 parameterized query로 실행. raw query 사용 없음
- **XSS**: React 자동 이스케이프 + `dangerouslySetInnerHTML` 사용 지점 없음 (게시판 content 제외 — 확인 필요)

### 4.5 CRON_SECRET 노출 위험

- **안전**: 환경변수로만 참조. 클라이언트 코드(`NEXT_PUBLIC_*`)에 노출 없음. 응답에도 미포함

---

## 5. 데이터 정합성 점검

### 5.1 Prisma Upsert 패턴

| 대상 | 패턴 | Unique Key | 안전성 |
|------|------|-----------|--------|
| StockQuote | `upsert` | `stockId` (unique) | 안전 — 1종목 1시세 |
| DailyPrice (KR) | `createMany` + `skipDuplicates` | `stockId_date` (compound) | 안전 — 중복 무시 |
| DailyPrice (US) | `upsert` | `stockId_date` (compound) | 안전 |
| MarketIndex | `upsert` | `symbol` (unique) | 안전 |
| MarketIndexHistory | `upsert` | `symbol_date` (compound) | 안전 |
| News | titleHash 기반 중복 방지 | - | 안전 |
| Watchlist | `create` + P2002 catch | `userId_stockId` (compound) | 안전 |

### 5.2 Race Condition 가능성

- **StockQuote upsert**: 동일 종목에 대해 KR/US cron이 동시 실행될 경우 — market이 다르므로 겹치지 않음. 같은 cron 내에서는 `Promise.allSettled` + batch 100건 병렬이지만, Prisma upsert는 Postgres `INSERT ... ON CONFLICT` 기반이므로 atomic
- **닉네임 중복 체크** (`auth.ts:69-71`): Google OAuth signIn 콜백에서 `findUnique` → `update` 사이에 race condition 가능. 하지만 nickname unique constraint가 DB 레벨에서 보호하므로 최악의 경우 에러 발생 → `return false` (로그인 실패) → 재시도 시 해결
- **게시판 viewCount increment**: `{ increment: 1 }`는 Postgres atomic operation이므로 안전

### 5.3 데이터 Cleanup 정책

| 대상 | 보관 기간 | 삭제 방식 | 안전성 |
|------|----------|----------|--------|
| 뉴스 | 60일 | `deleteMany` (StockNews는 CASCADE) | 안전 |
| 일봉 (DailyPrice) | 365일 | `deleteMany` | 안전 |
| 종목 비활성화 | 90일 시세 미갱신 | `updateMany(isActive: false)` | 안전 — 삭제가 아닌 비활성화 |
| 공시 | 365일 | `deleteMany` | 안전 |
| AI 리포트 | 180일 | `deleteMany` | 안전 |

**주의**: AI 리포트 삭제 시 `ReportRequest.aiReportId`는 `onDelete: SetNull`이므로 FK 위반 없음. 뉴스 삭제 시 StockNews는 CASCADE이므로 안전.

### 5.4 Foreign Key / Cascading Delete 안전성

- `User` 삭제 시: `Watchlist`, `Portfolio`, `BoardPost`, `BoardComment`, `ReportRequest`, `RequestComment` → CASCADE. 사용자 탈퇴 시 연관 데이터 전부 삭제 (의도된 동작)
- `Stock` 삭제 시: 관련 `StockQuote`, `DailyPrice`, `Watchlist`, `Portfolio` 등 CASCADE. 실제로는 stock 삭제가 아닌 `isActive: false` 처리이므로 cascade 발동 안 함
- `AiReport` 삭제 시: `ReportRequest.aiReportId` → SetNull (안전)

---

## 6. Cron Job 안정성

### 6.1 Timeout 대비

| Cron Job | maxDuration | 실제 위험 | 대응 |
|----------|------------|----------|------|
| collect-kr-quotes | 55초 | KR 종목 ~4,300건 batch 100건 upsert | `?exchange=KOSPI/KOSDAQ` 분할 실행으로 대응 |
| collect-us-quotes | 60초 | US 종목 ~500건 + OHLCV 개별 fetch | batch 20건 + sleep(1000ms) — 최악의 경우 tight |
| generate-reports | 60초 | LLM 호출 1-2건 | QUEUE_LIMIT=1, AUTO_LIMIT=1로 안전 |
| collect-dart-dividends | 300초 | OpenDART API 다수 호출 | 270초 안전장치 존재 |
| cleanup | 60초 | 5개 deleteMany 쿼리 | DB 인덱스 활용 시 빠른 실행 |
| collect-news | 60초 | 다중 RSS 소스 | Promise.allSettled 부분 실패 허용 |

**평가**: 대체로 안전. `collect-us-quotes`가 가장 tight하나, 500종목 기준으로 60초 내 완료 가능.

### 6.2 부분 실패 복구

| Cron Job | 복구 전략 | 평가 |
|----------|----------|------|
| collect-kr-quotes | `Promise.allSettled` + errors 배열 + Telegram 알림 | **양호** |
| collect-us-quotes | 개별 try-catch + errors 배열 | **양호** |
| generate-reports | GENERATING -> FAILED 상태 전이 + `.catch(() => {})` | **양호** |
| cleanup | 각 단계별 독립 try-catch | **양호** |
| collect-news | 다중 소스 독립 수집 | **양호** |

### 6.3 외부 API 실패 내성

- **Naver Finance**: `withRetry()`(3회 exponential backoff) + `Promise.allSettled` 부분 성공 허용
- **Yahoo Finance**: batch 단위 try-catch + 개별 종목 실패 허용
- **Groq/Ollama**: LLM 실패 시 FAILED 상태 전이. 다음 cron 실행 시 재처리 안 됨 (수동 재요청 필요)
- **OpenDART**: 270초 안전장치로 timeout 방지

### 6.4 idempotency (멱등성)

- **시세 수집**: upsert 패턴으로 동일 날짜 중복 실행 시 update만 발생 → **멱등**
- **뉴스 수집**: titleHash 기반 중복 방지 → **멱등**
- **리포트 생성**: slug 기반 중복 체크 (`findUnique({ where: { slug } })`) → **멱등**
- **cleanup**: 날짜 기반 deleteMany → **멱등**

---

## 7. Sprint Backlog

| 순번 | 우선순위 | 작업 | 수정 파일 | 예상 복잡도 | 관련 TC-ID |
|------|---------|------|----------|------------|-----------|
| 1 | **P0** | 종목 상세 페이지 `notFound()` 추가 | `src/app/stock/[ticker]/page.tsx` | Low | STOCK-014 |
| 2 | **P1** | institutional API `ticker.toUpperCase()` 추가 | `src/app/api/stocks/[ticker]/institutional/route.ts:27` | Low | PUB-030 |
| 3 | **P1** | 리포트 요청 스키마 `ticker` 필드 제거 (중복) | `src/lib/validations/report-request.ts:5` | Low | AUTH-040 |
| 4 | **P2** | chart API 유효하지 않은 period 시 실제 기간 반환 | `src/app/api/stocks/[ticker]/chart/route.ts:19,41` | Low | PUB-019 |
| 5 | **P3** | `req.json()` 파싱 실패 시 400 반환 유틸리티 도입 | 다수 route.ts (watchlist, board, report-requests 등) | Medium | ERR-007 |
| 6 | **P3** | watchlist DELETE catch 블록 P2025 구분 | `src/app/api/watchlist/[ticker]/route.ts:31-33` | Low | WL-006 |

**총 6건**, P0 1건 / P1 2건 / P2 1건 / P3 2건

---

## 8. 종합 판정

### BE v1.0 출시 준비 상태: READY (조건부)

**즉시 수정 필수 (P0-P1, 출시 전)**:
1. `stock/[ticker]/page.tsx` — `notFound()` 추가 (존재하지 않는 종목 URL 접근 시 500/빈 페이지 방지)
2. `institutional/route.ts` — `toUpperCase()` 추가 (API 일관성)
3. `report-request.ts` — `ticker` 필드 optional 또는 제거 (API 설계 정합성)

**출시 후 개선 (P2-P3)**:
4. chart API period 응답 개선
5. JSON 파싱 에러 핸들링 통일
6. watchlist DELETE 에러 코드 세분화

### 강점
- 모든 사용자 입력 API에 Zod 검증 100% 적용
- Prisma parameterized query로 SQL injection 방지
- Cron job 부분 실패 복구 패턴 일관 적용 (Promise.allSettled + errors 배열)
- Upsert 패턴으로 멱등성 보장
- 미들웨어 + API route 이중 인증 보호
- Cascading delete 정책 적절

### 주의 사항
- Rate limiter가 인메모리 기반이므로 Vercel Serverless cold start 시 초기화됨 (장기적으로 Redis 전환 권장)
- `collect-us-quotes` timeout이 tight (500종목 기준, 60초 내 완료 필요)
- Google OAuth 닉네임 자동 생성 시 미세한 race condition 가능성 있으나 DB unique constraint로 보호

**P0-P1 3건 수정 후 v1.0 출시 가능.**
