# Phase 1 백엔드 WBS (Work Breakdown Structure)

> 작성일: 2026-03-26 | 담당: dev-backend
> 브랜치: `feature/phase1-backend` (main 기준)
> 총 예상 공수: ~8~10시간

---

## 의존 관계 요약

```
[1] Compare 버그 수정 ──→ (FE 알림: URL 변경 없음, FE 코드 이미 수정됨)
[2] PBR null 제거 ──→ (FE 영향 없음)
[3] compute-indicators market 파라미터 ──→ (FE 영향 없음, YAML만 변경)
[4] 시그널 쿼리 중복 제거 ──→ (FE 영향 없음, 내부 리팩토링)
[5] Fundamentals 스케줄 + 우선순위 큐 ──→ (FE 영향 없음)
[6] KR quotes 60초 호환 ──→ (FE 영향 없음, 크론 내부)  ※ 블로커
[7] 52주 고저 스크래핑 제거 ──→ (FE 영향: API 응답 속도 개선, 인터페이스 변경 없음)
[8] Groq API 연동 ──→ (FE 영향 없음, AI 리포트 백엔드)
[9] 크론 에러 알림 Discord ──→ (FE 영향 없음)
```

**프론트엔드 병목 없음**: 모든 백엔드 작업은 API 인터페이스를 변경하지 않음. FE는 즉시 독립적으로 작업 가능.

---

## 1. Compare API 버그 수정

**예상 시간**: 5분
**선행 조건**: 없음
**FE 의존성**: 낮음 — Compare 페이지 FE 코드(`src/app/compare/page.tsx:33`)는 이미 `/api/stocks/`로 수정됨. git diff 확인 결과 FE 수정 완료 상태.
**기획서 의존성**: 없음

### 1.1 버그 확인 및 수정 (3분)

- **현황**: `src/app/compare/page.tsx:33`에서 `/api/stock/${ticker}` → 실제 라우트는 `/api/stocks/[ticker]`
- **수정 대상**: `src/app/compare/page.tsx` — git diff 확인 시 이미 `stocks`로 수정된 상태 (uncommitted)
- **수정 내용**: 변경 사항 확인 후 커밋
- **테스트**: `npm run build` 성공 확인, `/compare` 페이지에서 종목 비교 동작 확인
- **완료 기준**: 비교 페이지에서 2개 이상 종목 데이터가 정상 로드됨
- **롤백**: `git revert` (1줄 변경이므로 간단)

### 1.2 커밋 (2분)

- 커밋 메시지: `fix: Compare 페이지 API 경로 수정 (/api/stock → /api/stocks)`

---

## 2. PBR null 덮어쓰기 제거

**예상 시간**: 15분
**선행 조건**: 없음 (독립 작업)
**FE 의존성**: 없음 — API 응답 구조 변경 없음. PBR 값이 null 대신 유지되므로 FE는 자동으로 혜택
**기획서 의존성**: 없음 (spec-data-quality.md 방안 A 적용)

### 2.1 코드 분석 확인 (2분)

- **파일**: `src/app/api/cron/collect-kr-quotes/route.ts`
- **현재 구조** (line 128~146):
  ```
  const baseData = { ..., per: s.per, high52w: ..., low52w: ... }
  prisma.stockQuote.upsert({
    update: baseData,          ← pbr 미포함 (이미 수정됨?)
    create: { stockId, ...baseData, pbr: null }
  })
  ```
- **확인**: git diff로 현재 수정 상태 확인. 이미 `baseData`에서 `pbr` 제거된 상태인지 확인

### 2.2 upsert에서 pbr 제거 (5분)

- **수정 파일**: `src/app/api/cron/collect-kr-quotes/route.ts`
- **수정 내용**: `baseData` 객체에서 `pbr` 필드가 포함되어 있다면 제거
  - `update`에 pbr 미포함 → 기존 DB 값 유지
  - `create`에만 `pbr: null` → 신규 종목 생성 시 기본값
- **주의**: `baseData`가 `update`와 `create` 양쪽에 spread되는 구조이므로, pbr을 `baseData` 밖으로 분리

### 2.3 검증 (5분)

- **테스트**: `npm run build` 성공
- **검증 로직**: collect-kr-quotes 실행 후 StockQuote.pbr이 null로 덮어써지지 않는지 확인
  - 실제 DB 테스트는 불가하므로 코드 리뷰로 검증
  - `update` 객체에 `pbr` 키가 없음을 확인
- **완료 기준**: `update` 객체에 pbr 없음, `create` 객체에만 `pbr: null` 존재
- **롤백**: `git revert` — 단일 파일 변경

### 2.4 커밋 (3분)

- 커밋 메시지: `fix: KR quotes 크론에서 PBR null 덮어쓰기 제거`

---

## 3. compute-indicators market 파라미터 추가

**예상 시간**: 20분
**선행 조건**: 없음 (독립 작업)
**FE 의존성**: 없음 — FE는 indicators API를 직접 호출하지 않음 (크론 전용)
**기획서 의존성**: 없음

### 3.1 route.ts 수정 확인 (3분)

- **파일**: `src/app/api/cron/compute-indicators/route.ts`
- **현황**: git diff 확인 — 이미 `marketParam` 파싱 + `marketFilter` 적용 코드가 추가된 상태 (line 25~28)
- **확인**: 현재 uncommitted 변경이 완전한지 검증

### 3.2 YAML 수정 확인 (5분)

- **파일**: `.github/workflows/cron-indicators.yml`
- **현황**: 이미 `inputs.market` 파라미터 지원 (workflow_call + workflow_dispatch)
- **파일**: `.github/workflows/cron-pipeline-kr.yml`
- **현황**: 이미 `with: market: KR` 전달 중 (line 19~20)
- **파일**: `.github/workflows/cron-pipeline-us.yml`
- **확인**: `with: market: US` 전달 여부 확인

### 3.3 검증 (7분)

- **테스트**: `npm run build` 성공
- **동작 검증**:
  - `?market=KR` → KR 종목만 처리
  - `?market=US` → US 종목만 처리
  - 파라미터 없음 → 전체 종목 (하위 호환)
- **완료 기준**: 파이프라인 YAML에서 market 파라미터가 올바르게 전달됨
- **롤백**: `git revert` — route.ts + YAML 변경

### 3.4 커밋 (5분)

- 커밋 메시지: `feat: compute-indicators에 market 파라미터 추가 (KR/US 분리 계산)`
- 커밋 대상: `src/app/api/cron/compute-indicators/route.ts`, `.github/workflows/cron-pipeline-kr.yml`, `.github/workflows/cron-pipeline-us.yml`, `.github/workflows/cron-indicators.yml`

---

## 4. 시그널 쿼리 중복 제거

**예상 시간**: 1시간
**선행 조건**: 없음 (독립 작업)
**FE 의존성**: 없음 — `screener.ts`의 export 인터페이스 유지. `findSignalStockIds(market, signal, limit)` 시그니처 변경 없음. FE screener 페이지는 `getScreenerData()` 호출하며 이 함수는 변경 없음.
**기획서 의존성**: 없음

### 4.1 현재 중복 분석 (10분)

- **screener.ts**: 5개 시그널 함수 (findGoldenCross, findRsiOversold, findVolumeSurge, findBollingerBounce, findMacdCross) — LIMIT 없음, `CURRENT_DATE - INTERVAL '7 days'` 사용
- **ai-report.ts**: `findSignalMatches()` 함수에 동일한 5개 시그널 SQL — `LIMIT 10`, `sevenDaysAgo` 변수 사용
- **차이점**:
  1. screener.ts는 `CURRENT_DATE` (DB 서버 시간), ai-report.ts는 `sevenDaysAgo` (JS Date)
  2. screener.ts는 LIMIT 없음, ai-report.ts는 `LIMIT 10`
  3. SQL 로직은 실질적으로 동일

### 4.2 screener.ts에 limit 파라미터 추가 (15분)

- **수정 파일**: `src/lib/screener.ts`
- **수정 내용**:
  - 각 SIGNAL_FINDERS 함수에 `limit?: number` 파라미터 추가
  - SQL 끝에 `${limit ? Prisma.sql\`LIMIT ${limit}\` : Prisma.empty}` 추가
  - `findSignalStockIds()` 이미 `limit` 파라미터 지원 — 현재는 JS `slice()`로 처리, DB LIMIT으로 변경
- **주의**: Prisma raw query에서 동적 LIMIT은 `Prisma.sql` 헬퍼 필요

### 4.3 ai-report.ts에서 findSignalMatches 제거 (20분)

- **수정 파일**: `src/lib/ai-report.ts`
- **수정 내용**:
  - `findSignalMatches()` 함수 전체 삭제 (line 141~239, ~100줄)
  - `selectReportTargets()` 내에서 이미 `findSignalStockIds(market, signal, 10)` 호출 중 (line 73)
  - `findSignalMatches()`는 실제로 사용되지 않음 (dead code) — `selectReportTargets()`가 이미 `findSignalStockIds` 사용
- **확인**: `findSignalMatches`가 다른 곳에서 import되는지 grep 확인
- **결과**: dead code 삭제로 단순화

### 4.4 검증 (10분)

- **테스트**: `npm run build` 성공
- **grep 확인**: `findSignalMatches` 문자열이 프로젝트 내에 없음
- **동작 검증**: screener API + AI report 크론이 동일하게 동작
- **완료 기준**:
  - `findSignalMatches` 함수가 완전히 제거됨
  - `screener.ts`의 `findSignalStockIds`가 DB-level LIMIT 지원
  - 빌드 성공, 타입 에러 없음
- **롤백**: `git revert` — 2파일 변경

### 4.5 커밋 (5분)

- 커밋 메시지: `refactor: ai-report.ts의 중복 시그널 쿼리 제거, screener.ts로 통합`
- 커밋 대상: `src/lib/screener.ts`, `src/lib/ai-report.ts`

---

## 5. Fundamentals 스케줄 변경 + 우선순위 큐

**예상 시간**: 30분
**선행 조건**: 없음 (독립 작업)
**FE 의존성**: 없음 — 크론 스케줄/내부 로직 변경
**기획서 의존성**: PM 결정 확정 (평일 매일, BATCH=100) — 확정됨

### 5.1 YAML 스케줄 변경 (5분)

- **수정 파일**: `.github/workflows/cron-fundamentals.yml`
- **변경 전**: `cron: "0 14 * * 6"` (토요일 23:00 KST)
- **변경 후**: `cron: "0 14 * * 1-5"` (평일 23:00 KST)
- **GitHub Actions 분 소비 영향**: +22분/월 (무시 가능)

### 5.2 우선순위 큐 구현 (15분)

- **수정 파일**: `src/app/api/cron/collect-fundamentals/route.ts`
- **현재 로직**: `orderBy: [{ fundamental: { updatedAt: "asc" } }, { id: "asc" }]` → 가장 오래된 것부터
- **변경 로직**: 2단계 쿼리
  ```
  1단계: watchlist 보유 종목 우선 (최대 30개)
     WHERE watchlist: { some: {} }
  2단계: 나머지 (BATCH - 1단계 수) 를 updatedAt ASC로
     WHERE id NOT IN (1단계 결과)
  ```
- **US/KR 각각 적용**: 기존 코드에 US/KR 각각 BATCH=100으로 수집하는 구조 유지

### 5.3 검증 (7분)

- **테스트**: `npm run build` 성공
- **로직 검증**:
  - watchlist 종목이 30개 미만이면 나머지를 updatedAt ASC로 채움
  - watchlist 종목이 0개면 기존 동작과 동일 (하위 호환)
- **완료 기준**: YAML 스케줄 평일 매일, 우선순위 큐 동작
- **롤백**: `git revert`

### 5.4 커밋 (3분)

- 커밋 메시지: `feat: Fundamentals 스케줄 평일 매일 + 관심종목 우선 수집`
- 커밋 대상: `.github/workflows/cron-fundamentals.yml`, `src/app/api/cron/collect-fundamentals/route.ts`

---

## 6. KR quotes Hobby 60초 호환 (블로커)

**예상 시간**: 2~3시간
**선행 조건**: [2] PBR 수정 완료 (같은 파일 수정, 충돌 방지)
**FE 의존성**: 없음 — 크론 내부 최적화
**기획서 의존성**: PM 결정 (Hobby 60초) — 확정됨

### 6.1 현재 실행 시간 분석 (15분)

- **파일**: `src/app/api/cron/collect-kr-quotes/route.ts`
- **현재 구조**:
  1. Naver KOSPI + KOSDAQ + 인덱스 병렬 fetch → ~3~5초
  2. DailyPrice createMany (skipDuplicates, ~4,300건) → ~2~5초
  3. 52주 고저 groupBy → ~2~3초
  4. StockQuote upsert 43배치 × 100개 Promise.allSettled → **병목: ~86초 예상**
  5. MarketIndex upsert 2건 → ~1초
- **maxDuration = 300** (line 10) → Hobby에서는 60초 강제 종료
- **실측 방법**: `Date.now()` 로그 각 단계 전후에 추가하여 Vercel 로그에서 확인

### 6.2 해결 전략 결정 (15분)

**방안 A: KOSPI/KOSDAQ 분할** (권장)
- KR quotes 크론을 2개로 분할: `?exchange=KOSPI` / `?exchange=KOSDAQ`
- KOSPI ~900종목, KOSDAQ ~1,600종목 → 각각 ~16배치, ~25배치 → 각각 ~30~50초
- YAML에서 순차 실행 (quotes-kospi → quotes-kosdaq → indicators)

**방안 B: Bulk upsert 전환**
- 개별 `prisma.stockQuote.upsert()` → `prisma.$executeRaw` bulk upsert SQL
- `INSERT INTO ... ON CONFLICT (stockId) DO UPDATE SET ...`
- 4,300건 단일 쿼리 → ~5~10초

**결정**: 방안 A를 우선 시도 (안전, 검증 용이). 방안 A로도 부족하면 방안 B 추가 적용.

### 6.3 exchange 파라미터 추가 (30분)

- **수정 파일**: `src/app/api/cron/collect-kr-quotes/route.ts`
- **수정 내용**:
  ```typescript
  const exchangeParam = req.nextUrl.searchParams.get("exchange") // "KOSPI" | "KOSDAQ" | null

  // exchange 파라미터에 따라 선택적 fetch
  const results = await Promise.allSettled([
    (!exchangeParam || exchangeParam === "KOSPI") ? fetchNaverMarketData("KOSPI") : Promise.resolve([]),
    (!exchangeParam || exchangeParam === "KOSDAQ") ? fetchNaverMarketData("KOSDAQ") : Promise.resolve([]),
    fetchNaverIndices(),
  ])
  ```
- `maxDuration = 300` → `maxDuration = 55` 변경 (Hobby 안전 마진)
- DB 종목 조회도 exchange 필터 추가: `where: { market: "KR", isActive: true, exchange: exchangeParam ?? undefined }`

### 6.4 YAML 분할 (20분)

- **수정 파일**: `.github/workflows/cron-kr.yml`
- **변경 전**: 단일 curl (전체 KR)
- **변경 후**:
  ```yaml
  jobs:
    collect-kr-kospi:
      steps:
        - run: curl ... "/api/cron/collect-kr-quotes?exchange=KOSPI"
    collect-kr-kosdaq:
      needs: collect-kr-kospi
      steps:
        - run: curl ... "/api/cron/collect-kr-quotes?exchange=KOSDAQ"
  ```
- **수정 파일**: `.github/workflows/cron-pipeline-kr.yml`
  - `quotes` job이 `cron-kr.yml`을 호출하므로, cron-kr.yml 내에서 분할하면 pipeline도 자동 반영

### 6.5 하위 호환 유지 (10분)

- exchange 파라미터 없으면 기존 동작 (전체 KR) → 수동 트리거 시 기존 동작 유지
- 단, 전체 실행 시 60초 초과 가능 → 경고 로그 추가
  ```typescript
  if (!exchangeParam) {
    console.warn("[cron-kr] Running without exchange filter — may exceed 60s on Hobby plan")
  }
  ```

### 6.6 검증 (30분)

- **테스트**: `npm run build` 성공
- **로직 검증**:
  - `?exchange=KOSPI` → KOSPI 종목만 처리
  - `?exchange=KOSDAQ` → KOSDAQ 종목만 처리
  - 파라미터 없음 → 전체 (하위 호환)
- **시간 검증**: 각 exchange별 예상 처리 시간 계산
  - KOSPI ~900종목: 9배치 × ~2초 = ~18초 + overhead ~10초 = ~28초 ✓
  - KOSDAQ ~1,600종목: 16배치 × ~2초 = ~32초 + overhead ~10초 = ~42초 ✓
- **완료 기준**: 각 분할 크론이 55초 내 처리 가능한 종목 수
- **롤백**: `git revert` — route.ts + YAML 변경. 실패 시 `maxDuration = 300` 복원 (단, Hobby에서는 무효)

### 6.7 커밋 (5분)

- 커밋 메시지: `feat: KR quotes 크론 KOSPI/KOSDAQ 분할 실행 (Hobby 60초 호환)`
- 커밋 대상: `src/app/api/cron/collect-kr-quotes/route.ts`, `.github/workflows/cron-kr.yml`

---

## 7. 52주 고저 API 개별 스크래핑 제거

**예상 시간**: 20분
**선행 조건**: [6] KR quotes 60초 호환 완료 (52w fallback 크론 추가 여부가 6번 결과에 의존)
**FE 의존성**: 낮음 — API 응답 구조 변경 없음. 응답 속도 개선 효과 (Naver 개별 스크래핑 200ms 제거)
**기획서 의존성**: 없음

### 7.1 API에서 개별 스크래핑 제거 (10분)

- **수정 파일**: `src/app/api/stocks/[ticker]/route.ts`
- **현재 코드** (line 26~35):
  ```typescript
  // KR 종목: 52주 최고/최저가 null이면 Naver 시세 페이지에서 개별 스크래핑
  if (stock.market === "KR" && quote && high52w == null && low52w == null) {
    const w52 = await fetchNaverStock52w(stock.ticker).catch(() => null)
    ...
  }
  ```
- **수정**: 위 블록 전체 삭제. null이면 null 그대로 반환.
- **이유**: 52주 고저는 크론(`collect-kr-quotes`)에서 DailyPrice groupBy로 이미 계산됨. 개별 스크래핑은 불필요한 외부 호출이며 API 응답 지연 원인.

### 7.2 미사용 import 정리 (3분)

- `fetchNaverStock52w` import가 이 파일에서만 사용되는지 확인
- 사용처 없으면 import 제거
- `fetchNaverStock52w` 함수 자체는 다른 곳에서 사용될 수 있으므로 data-sources/naver.ts에서는 삭제하지 않음

### 7.3 검증 (5분)

- **테스트**: `npm run build` 성공
- **동작 검증**: `/api/stocks/005930` (삼성전자) 호출 시 52w 값이 DB에서 정상 반환되는지 확인
- **완료 기준**: API 응답에서 Naver 개별 스크래핑 호출 없음, 응답 시간 개선
- **롤백**: `git revert`

### 7.4 커밋 (2분)

- 커밋 메시지: `perf: 52주 고저 API 개별 스크래핑 제거 (크론 일괄 계산으로 대체)`
- 커밋 대상: `src/app/api/stocks/[ticker]/route.ts`

---

## 8. Groq API 연동

**예상 시간**: 2시간
**선행 조건**: [4] 시그널 쿼리 중복 제거 완료 (ai-report.ts 변경 충돌 방지)
**FE 의존성**: 없음 — AI 리포트 생성은 크론 백엔드. FE는 생성된 리포트를 DB에서 읽을 뿐
**기획서 의존성**: PM 결정 (Groq 무료 API 사용) — 확정됨

### 8.1 groq.ts 신규 파일 작성 (30분)

- **생성 파일**: `src/lib/groq.ts`
- **내용**:
  - `groqChat(messages: ChatMessage[]): Promise<string>`
  - Groq API 엔드포인트: `https://api.groq.com/openai/v1/chat/completions`
  - 인증: `Authorization: Bearer ${process.env.GROQ_API_KEY}`
  - 모델: `llama-3.3-70b-versatile` (환경변수 `GROQ_MODEL`로 오버라이드 가능)
  - 파라미터: `temperature: 0.3`, `max_tokens: 1200`, `top_p: 0.9`
  - 타임아웃: 30초 (Groq LPU는 매우 빠름)
  - 에러 핸들링: 429 (rate limit) → withRetry, 503 → withRetry
  - 응답 파싱: `data.choices[0].message.content`

### 8.2 llm.ts 통합 모듈 작성 (15분)

- **생성 파일**: `src/lib/llm.ts`
- **내용**:
  - `generateChat(messages: ChatMessage[]): Promise<string>`
  - 분기 로직:
    1. `GROQ_API_KEY` 있으면 → `groqChat()`
    2. 없으면 → `ollamaChat()` (로컬 fallback)
  - `ChatMessage` 타입 export (ollama.ts에서 이동)
  - `getLLMProvider(): string` 유틸 (로깅용)

### 8.3 ai-report 크론에서 llm.ts 호출로 변경 (20분)

- **수정 파일**: AI 리포트 생성 크론 (generate-reports 관련)
- **수정 내용**: `ollamaChat()` 직접 호출 → `generateChat()` 호출로 변경
- **확인**: ollamaChat을 직접 호출하는 모든 파일 grep 후 일괄 변경
- **ollama.ts는 유지**: 로컬 개발용 + llm.ts fallback

### 8.4 환경변수 문서화 (10분)

- CLAUDE.md의 환경변수 섹션에 `GROQ_API_KEY`, `GROQ_MODEL` 추가 (선택)
- `.env.example`에 추가 (있다면)

### 8.5 에러 핸들링 강화 (15분)

- Groq 429 응답 시: `Retry-After` 헤더 파싱 → 해당 시간만큼 대기 후 재시도
- Groq 503/500 응답 시: Ollama fallback 자동 전환 (해당 요청만)
- 응답 content가 빈 문자열이면 에러 throw

### 8.6 검증 (20분)

- **테스트**: `npm run build` 성공
- **단위 검증**:
  - `GROQ_API_KEY` 미설정 시 → Ollama fallback 정상 동작
  - `GROQ_API_KEY` 설정 시 → Groq API 호출 (실제 테스트는 API key 필요)
- **타입 검증**: ChatMessage 타입 호환성
- **완료 기준**: 빌드 성공, 환경변수 분기 정상, 기존 Ollama 동작 유지
- **롤백**: `git revert` — 신규 파일 삭제, import 복원

### 8.7 커밋 (10분)

- 커밋 메시지: `feat: Groq API 연동 + LLM 통합 모듈 (Ollama fallback 유지)`
- 커밋 대상: `src/lib/groq.ts` (신규), `src/lib/llm.ts` (신규), AI 리포트 관련 수정 파일

---

## 9. 크론 에러 알림 Discord

**예상 시간**: 1시간
**선행 조건**: 없음 (독립 작업, 단 다른 크론 수정 후 진행 권장)
**FE 의존성**: 없음
**기획서 의존성**: 없음 (dev-backend 제안 사항)

### 9.1 Discord 웹훅 유틸 작성 (20분)

- **생성 파일**: `src/lib/utils/discord.ts`
- **내용**:
  - `sendDiscordAlert(title: string, message: string, severity: "info" | "warning" | "error"): Promise<void>`
  - `DISCORD_WEBHOOK_URL` 환경변수에서 URL 가져오기
  - URL 미설정 시 → 로그만 출력, 에러 없이 무시
  - Discord Embed 형식: 색상(info=파랑, warning=노랑, error=빨강), 타임스탬프 포함
  - 타임아웃: 5초 (알림 실패가 크론 실패를 유발하면 안 됨)

### 9.2 크론 에러 핸들링에 알림 추가 (25분)

- **수정 파일들**: 주요 크론 route.ts 파일
  - `src/app/api/cron/collect-kr-quotes/route.ts`
  - `src/app/api/cron/collect-fundamentals/route.ts`
  - `src/app/api/cron/compute-indicators/route.ts`
- **수정 내용**: catch 블록 또는 에러 배열이 비어있지 않을 때 `sendDiscordAlert()` 호출
  ```typescript
  if (stats.errors.length > 0) {
    await sendDiscordAlert(
      "KR Quotes 크론 에러",
      `에러 ${stats.errors.length}건: ${stats.errors.slice(0, 3).join(", ")}`,
      "warning"
    ).catch(() => {}) // 알림 실패 무시
  }
  ```
- **주의**: `await sendDiscordAlert().catch(() => {})` — 알림 실패가 크론 응답에 영향 주지 않도록

### 9.3 검증 (10분)

- **테스트**: `npm run build` 성공
- **검증**: `DISCORD_WEBHOOK_URL` 미설정 시 에러 없이 동작
- **완료 기준**: 크론 에러 발생 시 Discord로 알림 전송, 미설정 시 graceful 무시
- **롤백**: `git revert`

### 9.4 커밋 (5분)

- 커밋 메시지: `feat: 크론 에러 Discord 알림 추가`
- 커밋 대상: `src/lib/utils/discord.ts` (신규), 크론 route.ts 파일들

---

## 전체 실행 순서 (의존 관계 기반)

```
Phase A — 독립 작업 (병렬 가능)
├─ [1] Compare 버그 수정 (5분)
├─ [3] compute-indicators market 파라미터 (20분)
├─ [4] 시그널 쿼리 중복 제거 (1시간)
└─ [5] Fundamentals 스케줄 + 우선순위 큐 (30분)

Phase B — PBR 선행 후 블로커
├─ [2] PBR null 제거 (15분)
└─ [6] KR quotes 60초 호환 (2~3시간)  ← [2] 완료 후 착수

Phase C — 후속 작업
├─ [7] 52주 고저 스크래핑 제거 (20분)  ← [6] 완료 후 착수
├─ [8] Groq API 연동 (2시간)  ← [4] 완료 후 착수 (ai-report.ts 충돌 방지)
└─ [9] Discord 알림 (1시간)  ← [6] 완료 후 착수 (크론 파일 안정화 후)
```

**최적 순서**: 1 → 2 → 3 → 6 → 4 → 5 → 7 → 8 → 9

---

## 프론트엔드 의존 관계 상세

| 백엔드 작업 | FE 영향 | FE 대기 필요 | 비고 |
|------------|---------|-------------|------|
| [1] Compare 버그 | 없음 | 아니오 | FE 코드 이미 수정됨 (uncommitted) |
| [2] PBR null | 없음 | 아니오 | PBR이 유지되므로 FE 자동 혜택 |
| [3] indicators market | 없음 | 아니오 | 크론 전용, FE 미호출 |
| [4] 시그널 통합 | 없음 | 아니오 | 내부 리팩토링, export 유지 |
| [5] Fundamentals | 없음 | 아니오 | 크론 스케줄 변경 |
| [6] KR 60초 호환 | 없음 | 아니오 | 크론 내부 최적화 |
| [7] 52w 제거 | API 속도↑ | 아니오 | 응답 구조 동일 |
| [8] Groq | 없음 | 아니오 | 리포트 생성 백엔드 |
| [9] Discord | 없음 | 아니오 | 운영 도구 |

**결론: FE는 백엔드 작업 완료를 기다릴 필요 없이 즉시 독립 작업 가능.**
