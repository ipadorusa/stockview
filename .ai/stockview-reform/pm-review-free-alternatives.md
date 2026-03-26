# PM 검토: 유료 서비스 → 무료 대안 변경안

> 작성일: 2026-03-26 | 작성자: 기능 기획자 (planner-feature)
> PM 지시: "현재 수익이 없으므로 유료 서비스/API/모델은 사용 불가. 모든 기획을 무료/오픈소스 대안으로 재검토"

---

## 1. 유료 항목 목록 및 대안

### 1.1 Cloud LLM API (Claude / GPT)

**언급 위치**:
- `03-feature-analysis.md` §2.3 AI 리포트 개선 제안 표: "Cloud LLM API (Claude/GPT) — 종목당 $0.01~0.05"
- `04-reform-plan.md` §2.3.6: "클라우드 LLM API(Claude 등)로 품질 향상 검토"

**결정: 제외**

**무료 대안**: 현재 Ollama(로컬) 구조를 유지하되 아래 방향으로 개선
- **모델 업그레이드**: exaone3.5:7.8b → `gemma3:12b` 또는 `qwen2.5:14b` (Ollama 무료, 한국어 품질 더 우수)
- **컨텍스트 확장**: `num_ctx: 4096` → `8192`로 상향 (분석 품질 향상)
- **자동화 방식**: Vercel 크론 대신 로컬 서버(개발 PC 또는 홈서버)에서 GitHub Actions webhook 수신 → Ollama 호출 → `/api/reports` POST 저장
- **프로덕션 배포 방안**: Oracle Cloud Free Tier (ARM 4코어/24GB RAM 무료 서버)에 Ollama 설치 가능. 7~14B 모델 운영에 충분.

**변경 필요 파일**:
- `03-feature-analysis.md` §2.3 개선 제안 표 → Cloud LLM 행 삭제, Ollama on Oracle Free Tier 행 추가
- `04-reform-plan.md` §2.3.6 → Cloud LLM 언급 삭제

---

### 1.2 Vercel Pro (maxDuration 300초)

**언급 위치**:
- `spec-data-quality.md` §2 Fundamentals 갱신 속도 개선: `maxDuration = 300 (Vercel Pro 필요)` 명시
- `03-feature-analysis.md` §5.1: "Pro 300초, Hobby 60초 → 대량 배치 처리 제약"

**결정: Vercel Hobby (무료) 60초 제약 내에서 운영**

**무료 대안**:
- Fundamentals 배치 크기: 250개/회 → **100개/회** (60초 이내 처리 가능 범위)
- 대신 실행 빈도를 높여 보완: 주 1회 → **주 5회 (평일 매일)**
  - 4,800종목 / 100개 = 48일 → 주 5회 실행 시 **~48 평일 = 약 10주**
  - 우선순위 큐(관심종목 > 인기종목 > 나머지)를 적용하면 핵심 종목은 매일 갱신 가능
- 병렬 처리 최적화: KR(Naver) 200ms/req × 50개 = 10초, US(Yahoo) 5 concurrent × 50개 ≈ 5초 → 합산 15초로 충분히 60초 내 처리 가능

**변경 필요 파일**:
- `spec-data-quality.md` §2: BATCH 250 → 100, `maxDuration = 300` 제거, 스케줄 주5회로 변경
- `03-feature-analysis.md` §5.1: Vercel Pro 언급 조건부 표현으로 수정

---

### 1.3 Vercel KV / Upstash Redis (Rate Limit)

**언급 위치**:
- `03-feature-analysis.md` §5.3 Rate Limit 개선 제안: "Vercel KV(Redis) 또는 Upstash Redis 기반으로 교체"

**결정: 제외 (현재 In-memory 방식 유지 또는 Edge Middleware 활용)**

**무료 대안**:
- **단기**: Rate limit 문제는 실질적으로 내부 크론 API에만 적용 (CRON_SECRET Bearer 인증으로 보호됨). 공개 API에 IP 기반 Rate limit이 필요하다면 Vercel Edge Middleware(무료)에서 처리.
- **중기**: Supabase(이미 사용 중)의 `rate_limit` 테이블로 DB 기반 Rate limit 구현 가능 (추가 비용 없음, 단 레이턴시 증가)
- Upstash Redis 무료 플랜(10,000 req/일)은 소규모에서 충분하지만, 의존성 추가보다 현재 구조 유지 권장

**변경 필요 파일**:
- `03-feature-analysis.md` §5.3 개선 제안 → Vercel KV/Upstash 삭제, Edge Middleware 또는 Supabase DB 방식으로 교체

---

### 1.4 Financial Modeling Prep / Alpha Vantage / Polygon.io

**언급 위치**:
- `03-feature-analysis.md` §1.2 KR 데이터 대안 검토 표: "Financial Modeling Prep — 월 $15~"
- `feature-analysis.md` §6 데이터 소스 리스크 대안: "Alpha Vantage, Polygon.io, Financial Modeling Prep"

**결정: 제외**

**무료 대안**:
- **Yahoo Finance v8 (현재 유지)**: 비공식이지만 현재 안정적으로 운영 중. 차단 위험에 대비해 retry 로직 강화.
- **KRX 정보데이터시스템**: KR 데이터 공식 무료. 다만 장마감 후 데이터만 제공, 현재 DailyPrice 용도에 적합.
- **한국투자증권 KIS Developers OpenAPI**: 무료(계좌 개설 필요), 실시간 시세 지원. 중기 대안으로 검토 가능.
- **OpenDART (현재 사용 중)**: KR 공시/배당 무료 API — 계속 유지.

**변경 필요 파일**:
- `feature-analysis.md` §6: Polygon.io 등 유료 API 언급에 "(유료, 현재 불가)" 주석 추가
- `03-feature-analysis.md` §1.2: Financial Modeling Prep 행에 "(유료, 제외)" 명시

---

### 1.5 Trading Economics API (경제 캘린더)

**언급 위치**:
- `03-feature-analysis.md` §3.6 경제 캘린더: "Trading Economics API (유료)"

**결정: 제외 또는 무료 대안으로 대체**

**무료 대안**:
- **Investing.com 스크래핑**: 같은 섹션에서 이미 언급됨. 단, ToS 위반 가능성 주의.
- **직접 정적 데이터 관리**: FOMC 일정, 고용지표, CPI 발표일은 연방준비제도(Fed), BLS 등 공식 기관에서 사전 공지. 반기별 수작업 업데이트도 현실적.
- **Finnhub 무료 플랜**: 경제 캘린더 API 포함, 월 60 API calls/분 제한 내 사용 가능.

**변경 필요 파일**:
- `03-feature-analysis.md` §3.6: Trading Economics 삭제, Finnhub 무료 플랜 또는 정적 관리 방식으로 교체

---

### 1.6 NewsAPI

**언급 위치**:
- `feature-analysis.md` §6 Google News RSS 대안: "NewsAPI"

**결정: 제외**

**사유**: NewsAPI는 개발자 플랜(무료)이 있지만 비상업적 용도만 허용. StockView는 광고 수익을 목표로 하므로 상업적 사용에 해당 → 유료 플랜 필요.

**무료 대안**:
- **현재 구조 유지**: Google News RSS + Yahoo Finance RSS + 직접 언론사 RSS (한경/매경/연합/이데일리)
- **RSS 소스 다양화**: 이미 `news-kr-direct.ts`에서 직접 언론사 RSS 수집 중. US는 Reuters RSS, AP News RSS, Seeking Alpha RSS 추가 검토.
- **중복 제거 강화**: 현재 URL + 제목 기반 중복 제거에 제목 유사도(Levenshtein) 추가.

**변경 필요 파일**:
- `feature-analysis.md` §6: NewsAPI → "(유료, 제외). RSS 소스 다양화로 대체" 표기

---

### 1.7 Stripe 연동 (프리미엄 구독)

**언급 위치**:
- `03-feature-analysis.md` §7 Phase 3 로드맵: "프리미엄 구독 (Stripe 연동)"
- `03-feature-analysis.md` §6.2 프리미엄 기능 후보 표

**결정: Phase 3 이후로 보류 (구현 기술 자체는 무료)**

**사유**: Stripe 자체는 수수료 기반(카드 결제당 2.9%+30¢)이므로 API 사용료는 없음. 수익 발생 후 도입 가능. 단, **현재 수익이 없는 상태에서는 프리미엄 구독 기획 자체를 보류**.

**무료 대안**:
- 현재는 AdSense 광고 수익만으로 운영
- 구독 기획은 Phase 3 이후 재검토. 도입 시 Stripe(무료 API, 수수료만 발생) 사용.

**변경 필요 파일**:
- `03-feature-analysis.md` §7: Phase 3 항목에서 Stripe 보류 표기. §6.2는 기획 문서로 유지(참고용).

---

### 1.8 Supabase Pro (8GB DB)

**언급 위치**:
- `spec-data-quality.md` §1 DailyPrice 보존 기간: "Supabase Pro: 8GB → 3~5년 보존 가능"

**결정: Supabase Free Tier (500MB)로 운영**

**변경 내용**:
- DailyPrice 보존 기간: 3년(1,095일) → **365일**로 하향 조정 (500MB 내 유지)
- 용량 추정: 4,800종목 × 365일 × ~80bytes ≈ 140MB → 500MB Free Tier에서 여유 있음
- 향후 종목 확대(1,500개) 시에는 180일로 단축 또는 Supabase Pro 전환 검토

**변경 필요 파일**:
- `spec-data-quality.md` §1: "Supabase Pro: 8GB" 언급 → "Supabase Free Tier 500MB 기준으로 365일 유지"로 수정

---

### 1.9 VPS 서버 (Ollama on VPS)

**언급 위치**:
- `03-feature-analysis.md` §2.3 AI 리포트 개선 제안: "Ollama on VPS — VPS $10~20/월"

**결정: Oracle Cloud Always Free Tier로 대체**

**무료 대안**:
- **Oracle Cloud Free Tier**: ARM 기반 4 OCPU + 24GB RAM 영구 무료 인스턴스 제공. Ollama + 14B 파라미터 모델 운영에 충분.
- 단, 초기 설정(Oracle Cloud 가입, Ollama 설치, GitHub Actions 연동)에 개발 시간 필요 (~2~4시간).
- **대안2**: Google Cloud의 `e2-micro` 인스턴스 (월 $0, 0.25 vCPU/1GB RAM) — Ollama 경량 모델(7B 이하)만 가능, 속도 느림.

**변경 필요 파일**:
- `03-feature-analysis.md` §2.3: "Ollama on VPS — $10~20/월" → "Ollama on Oracle Cloud Free Tier — 무료" 로 교체

---

## 2. Vercel Hobby 플랜 제약 하 배치 전략 재검토

| 크론잡 | 현재 기획 | Hobby 60초 제약 반영 개선안 |
|--------|-----------|--------------------------|
| Fundamentals 갱신 | 배치 500개, maxDuration 300 (Pro) | 배치 50~100개, maxDuration 60, 평일 매일 실행 |
| 장중 시세 폴링 | Vercel Cron 5분 (언급만) | GitHub Actions 5분 간격 (무료 2,000분/월 소비: 5분×288회/일×20평일=28,800분 → **무료 한도 초과**) → **클라이언트 폴링 방안 B 또는 포기** |
| News 수집 | 30분~1시간 간격 | GitHub Actions 1시간 간격으로 유지 (무료 한도 내) |
| Fundamentals 스케줄 | 주 3회 → | 평일 매일 (5회/주), 60초 내 처리 |

**장중 시세 관련 추가 검토**:
- GitHub Actions 5분 간격은 월 2,000분 무료 한도를 크게 초과 (KR+US = ~5,760분/월 추가 필요)
- **현실적 방안**: 장중 30분 간격으로 타협 (월 ~960분 추가 → 총 ~2,400분, 약간 초과)
- 또는 **방안 B (클라이언트 폴링)**: 사용자 브라우저에서 Yahoo Finance / Naver 직접 호출은 CORS 문제로 불가. 대신 `/api/stocks/[ticker]` 엔드포인트에 클라이언트 주도 30분 리프레시 적용(ISR stale-while-revalidate 활용).

---

## 3. AI 리포트 Ollama 개선 방안 (무료 유지)

현재 구조: Ollama 로컬 (exaone3.5:7.8b, num_ctx=4096)

**단계별 개선 (모두 무료)**:

| 단계 | 내용 | 비용 |
|------|------|------|
| 즉시 | num_ctx 4096 → 8192 상향 (컨텍스트 확장) | 무료 |
| 즉시 | 모델 교체: exaone3.5:7.8b → qwen2.5:14b (한국어 품질 우수) | 무료 (로컬 다운로드) |
| 단기 | Oracle Cloud Free Tier에 Ollama 설치 → GitHub Actions 크론에서 HTTP 호출로 자동화 | 무료 |
| 중기 | Groq API 무료 플랜 (Llama 3.3 70B, 분당 30 req 제한) — 고품질, 속도 빠름 | 무료 (제한 내) |
| 중기 | Together AI 무료 크레딧 또는 Hugging Face Inference API (무료 Tier) | 무료 (제한 내) |

**Groq API 무료 플랜 상세**:
- Llama 3.3 70B (또는 Mixtral 8x7B) 무료 제공
- 분당 30 req, 일 14,400 req — 종목 리포트 생성에 충분
- API key 발급 후 `GROQ_API_KEY` 환경변수로 관리
- 기존 `ollama.ts` → `groq.ts` (openai-compatible API)로 교체 용이
- **단점**: 한국어 품질은 Qwen/Exaone 대비 낮을 수 있음, 요청 제한 초과 시 장애

---

## 4. 변경 요약 (파일별)

### `03-feature-analysis.md`
| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| §1.2 KR 대안 표 | Financial Modeling Prep — 월 $15~ | (삭제 또는 "유료, 제외" 표기) |
| §2.3 AI 개선 제안 | Cloud LLM API — $0.01~0.05/종목 | 삭제; Groq 무료 또는 Oracle Free Tier Ollama 추가 |
| §2.3 AI 개선 제안 | Ollama on VPS — $10~20/월 | Oracle Cloud Free Tier — 무료 |
| §3.6 경제 캘린더 | Trading Economics API (유료) | Finnhub 무료 플랜 또는 정적 관리 |
| §5.1 Cron 제약 | Vercel Pro 300초 | Vercel Hobby 60초 제약 내 배치 분할 |
| §5.3 Rate Limit | Vercel KV / Upstash Redis | Edge Middleware 또는 Supabase DB |
| §7 Phase 3 | 프리미엄 구독 (Stripe 연동) | "수익 발생 후 재검토"로 보류 표기 |

### `spec-data-quality.md`
| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| §1 DailyPrice 보존 | 3년 (Supabase Pro 8GB 기준) | 1년 (Supabase Free 500MB 기준) |
| §2 Fundamentals 배치 | BATCH=250, maxDuration=300 (Pro) | BATCH=100, maxDuration=60, 평일 매일 실행 |

### `04-reform-plan.md`
| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| §2.3.6 AI 리포트 | "클라우드 LLM API(Claude 등)로 품질 향상 검토" | "Groq 무료 API 또는 Oracle Cloud Free Tier Ollama로 자동화" |
| §3 데이터 소스 리스크 | Alpha Vantage / Polygon.io 백업 | "(유료, 현재 불가) KIS OpenAPI 검토" |
| §3 데이터 소스 리스크 | NewsAPI | "(유료) RSS 소스 다양화로 대체" |

### `feature-analysis.md`
| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| §6 Yahoo 대안 | Alpha Vantage, Polygon.io, Financial Modeling Prep | "(모두 유료, 현재 불가) Yahoo v8 유지 + KIS OpenAPI 중기 검토" |
| §6 Google News 대안 | NewsAPI | "(유료) RSS 소스 다양화" |

---

## 5. 실제 구현 우선순위 (무료 제약 반영)

### 즉시 (코드 변경 불필요 또는 최소)
1. Ollama 모델 교체: `qwen2.5:14b` 로컬 다운로드 후 `ollama.ts` 모델명 변경
2. Fundamentals 스케줄: 토요일 1회 → 평일 매일 (GitHub Actions YAML 수정)
3. DailyPrice 보존: 365일 유지 (변경 없음 — 이미 적절)

### 단기 (1~2주)
4. Groq API 연동 테스트 (무료 플랜, Llama 70B) — 품질 비교 후 채택 여부 결정
5. Oracle Cloud Free Tier 서버 설정 + Ollama 배포 (리포트 자동화 파이프라인)

### 중기 (1~2개월)
6. KIS Developers OpenAPI 신청 및 KR 데이터 백업 소스로 통합
7. Finnhub 무료 플랜으로 경제 캘린더 데이터 수집 시도
