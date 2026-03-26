# AI 리포트 기능 개선 상세 기획서

> 작성일: 2026-03-26 | 근거: 코드베이스 직접 확인 + PM 무료 전환 결정
> PM 결정: Cloud LLM 비용 불가, Groq 무료 API를 primary로 전환

---

## 1. 현황 분석

### 1.1 현재 구현

| 항목 | 현재 |
|------|------|
| LLM 백엔드 | Ollama 로컬 (`src/lib/ollama.ts`) |
| 모델 | exaone3.5:7.8b (7.8B 파라미터) |
| 컨텍스트 | num_ctx=4096, temperature=0.3, num_predict=1200 |
| 타임아웃 | 120초, withRetry 1회 재시도 |
| 종목 선정 | 시그널 매칭 우선 → 시총 상위 fallback, ETF 제외, 당일 중복 방지 |
| 데이터 수집 | 8개 Promise.all (stock, quote, fundamental, technical, prices, dividends, earnings, news) |
| 출력 | 한줄요약 + 투자의견(긍정/중립/부정) + 분석(~500자) |
| 저장 | AiReport 모델 (slug, signal, content, summary, verdict, dataSnapshot JSON) |
| SSR | `/reports/[slug]` 경로로 SEO 크롤링 가능 |

### 1.2 핵심 문제

1. **로컬 Ollama 의존**: Vercel 프로덕션에서 Ollama 실행 불가 → 수동 트리거만 가능, 자동화된 파이프라인 부재
2. **모델 품질 한계**: 7.8B 파라미터 → 분석 깊이, 한국어 표현력, 구조화된 출력 일관성 부족
3. **컨텍스트 부족**: 4,096 tokens → 8개 데이터 소스를 모두 충분히 담기에 빠듯
4. **시그널 쿼리 중복**: screener.ts와 ai-report.ts에 동일한 5개 시그널 SQL이 중복 구현 (→ spec-data-quality.md §8에서 해결)

---

## 2. LLM 백엔드 전환

### 2.1 아키텍처: Groq Primary → Ollama Fallback

```
프로덕션 (Vercel + GitHub Actions):
  GitHub Actions 크론 → /api/cron/generate-reports → Groq API (Llama 3.3 70B)
                                                    ↓ (Groq 장애 시)
                                                    Ollama fallback (설정된 경우)

로컬 개발:
  수동 트리거 → /api/cron/generate-reports → Ollama 로컬 (qwen2.5:14b 권장)
```

### 2.2 Groq vs Ollama 비교

| 항목 | Ollama (현재) | Groq API (전환 후) |
|------|-------------|-------------------|
| 모델 | exaone3.5:7.8b (7.8B) | Llama 3.3 70B (~9배 파라미터) |
| 컨텍스트 | 4,096 tokens | 128K tokens |
| 응답 속도 | 로컬 GPU 의존 (~30-60초) | Groq LPU 추론 (~3-8초) |
| 실행 환경 | 로컬 PC만 | 프로덕션 어디서든 (HTTP API) |
| 자동화 | 수동 트리거 | GitHub Actions 크론 자동화 |
| 비용 | 무료 (전기 + GPU) | **무료** (Groq Free Tier) |
| 한국어 | exaone 한국어 특화 | Llama 범용 (프롬프트 보완 필요) |
| 가용성 | 로컬 PC 가동 시만 | Groq 서비스 가동 시 (SLA 없음) |

### 2.3 Groq 무료 플랜 제한

| 제한 항목 | 수치 |
|----------|------|
| 분당 요청 수 | 30 req/min |
| 일일 요청 수 | 14,400 req/day |
| 분당 출력 토큰 | 6,000 tokens/min |
| 컨텍스트 윈도우 | 128K tokens |

### 2.4 구현

**신규 파일**: `src/lib/groq.ts`
```typescript
import { withRetry } from "@/lib/utils"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export async function generateGroqChat(messages: ChatMessage[]): Promise<string> {
  const res = await withRetry(
    () =>
      fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(30_000),
      }),
    { retries: 1 }
  )

  const data = await res.json()
  return data.choices[0].message.content
}
```

**`src/lib/ai-report.ts` 분기 로직**:
```typescript
import { generateGroqChat } from "@/lib/groq"
import { generateOllamaChat } from "@/lib/ollama"

async function generateChat(messages: ChatMessage[]): Promise<string> {
  if (process.env.GROQ_API_KEY) {
    return generateGroqChat(messages) // 프로덕션: Groq
  }
  return generateOllamaChat(messages) // 로컬: Ollama
}
```

**환경변수 추가**:
| 변수 | 필수 | 설명 |
|------|------|------|
| `GROQ_API_KEY` | 프로덕션 필수 | Groq API 키 (console.groq.com에서 발급) |
| `GROQ_MODEL` | 선택 | 기본값: `llama-3.3-70b-versatile` |

### 2.5 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/groq.ts` | **신규** — Groq API 호출 (OpenAI 호환) |
| `src/lib/ai-report.ts` | LLM 호출 부분을 환경변수 기반 분기로 변경 |
| `src/lib/ollama.ts` | 변경 없음 (로컬 개발용 유지) |
| `.env.example` | `GROQ_API_KEY`, `GROQ_MODEL` 추가 |

### 2.6 롤백 방안
- `GROQ_API_KEY` 환경변수 제거 → 자동으로 Ollama fallback

---

## 3. 리포트 생성 전략

### 3.1 배치 사전생성 (Primary)

**스케줄**: 매일 KST 18:00 (KR 장마감 후)

```
GitHub Actions 크론 (cron-generate-reports.yml):
1. /api/cron/generate-reports 호출
2. 시그널 매칭 종목 상위 5개 (KR) 선정
3. 시그널 매칭 종목 상위 5개 (US, 전일 기준) 선정
4. 순차적으로 10개 리포트 생성
5. AiReport 테이블에 저장
```

**타임아웃 검증**:
- 10개 × ~5초 (Groq 응답) = ~50초
- DB 저장 10개: ~5초
- **총 ~55초 → Hobby 60초 내 가능** (단, 여유 적음)

**안전 방안**: 10개를 한 번에 생성하기 어려우면 KR 5개 / US 5개로 2회 분할 호출

**GitHub Actions YAML**:
```yaml
# .github/workflows/cron-generate-reports.yml
name: Generate AI Reports
on:
  schedule:
    - cron: "0 9 * * 1-5"  # 평일 18:00 KST (UTC 09:00)
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate KR Reports
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/generate-reports?market=KR&count=5" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
      - name: Generate US Reports
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/generate-reports?market=US&count=5" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**주말**: 토요일 KST 12:00에 주간 종합 리포트 1건 (시장 요약, 주간 상승/하락 TOP5)

### 3.2 온디맨드 생성 (Phase 2 이후)

| 사용자 유형 | 접근 권한 |
|-----------|----------|
| 비로그인 | 사전생성 리포트만 열람 |
| 로그인 | 사전생성 리포트 + 일 3건 온디맨드 요청 |

온디맨드 로직:
1. 24시간 내 해당 종목 리포트 있으면 → 캐시 반환
2. 없으면 → Groq API 호출하여 실시간 생성
3. Rate limit guard: 사용자별 일 3건 제한 (DB count 체크)

### 3.3 일일 Groq 소비 예측

| 항목 | 일일 req |
|------|---------|
| 배치 사전생성 | 10 |
| 온디맨드 (Phase 2, 활성 사용자 50명 × 평균 1건) | ~50 |
| **합계** | **~60 req/일** |
| Groq 일일 한도 | 14,400 req/일 |
| **사용률** | **~0.4%** |

→ Groq 무료 한도 대비 매우 여유로움

---

## 4. 프롬프트 가이드라인 (한국 시장 특화)

### 4.1 기존 프롬프트 구조 (유지)

현재 ai-report.ts의 프롬프트는 8개 데이터 섹션으로 체계적:
1. 기본정보 (종목명, 시장, 섹터)
2. 시세 (현재가, 등락률, 52주 고저)
3. 밸류에이션 (PER, PBR, 배당수익률)
4. 기술지표 (이동평균, RSI, MACD, 볼린저밴드)
5. 주가추이 (최근 30일 OHLCV)
6. 배당 (배당금, 배당수익률, 배당일)
7. 실적 (매출, 영업이익, EPS)
8. 뉴스 (최근 뉴스 헤드라인)

### 4.2 분석 가이드라인 블록 (추가)

시스템 프롬프트에 다음 가이드라인 블록 추가:

```
## 분석 가이드라인

### 시장별 비교 기준
- 한국 시장(KR) 종목: PER은 코스피 평균(~12배)과 비교하여 고평가/저평가 판단
- 미국 시장(US) 종목: PER은 S&P 500 평균(~22배)과 비교하여 고평가/저평가 판단
- 양쪽 시장 모두 동일 섹터 평균과 비교하면 더 의미 있음

### 투자의견 규칙
- 투자의견(긍정/중립/부정)은 반드시 정량적 근거와 함께 제시
- 최소 2가지 이상의 근거 요인 명시 (예: "PER 8배로 업종 대비 저평가 + 골든크로스 발생")
- 리스크 팩터도 반드시 1가지 이상 제시

### 한국어 금융 용어
- 정확한 금융 용어 사용: "주가수익비율" 대신 "PER", "주가순자산비율" 대신 "PBR"
- 시장 방향성: "상승" 대신 "강세", "하락" 대신 "약세"
- 매매 용어: "매수 우위", "매도 우위", "관망"
- 기술적 분석: "지지선", "저항선", "돌파", "이탈"

### 출력 형식
- [한줄요약]: 30자 이내, 핵심 포인트 1가지
- [투자의견]: 긍정/중립/부정 + 근거 1줄
- [분석]: 500~800자, 밸류에이션→기술적→뉴스→리스크 순서
```

### 4.3 컨텍스트 확장 활용 (128K)

Groq의 128K 컨텍스트를 활용하여 기존보다 풍부한 데이터 투입 가능:

| 데이터 | 현재 (4K) | Groq (128K) |
|--------|----------|-------------|
| 주가추이 | 최근 30일 | 최근 90일로 확장 가능 |
| 뉴스 | 최근 5건 헤드라인 | 최근 10건 + 요약 1줄씩 |
| 과거 리포트 | 미포함 | 직전 리포트 verdict 포함 (추세 비교) |
| 섹터 비교 | 미포함 | 동일 섹터 상위 3개 종목 PER/등락률 |

> Phase 1에서는 기존 프롬프트 + 가이드라인 블록 추가만 진행. 컨텍스트 확장은 Phase 2에서 점진적으로 적용.

### 4.4 면책 문구

리포트 페이지 (`/reports/[slug]`) 상단에 표시:

> "이 리포트는 AI가 공개 데이터를 기반으로 자동 생성한 참고 분석입니다. 투자 판단의 근거로 사용하지 마세요. 실제 투자는 본인의 판단과 책임 하에 진행하시기 바랍니다."

---

## 5. 품질 관리

### 5.1 리포트 품질 목표

**목표 수준: "AI 참고 분석"** (증권사 리포트급이 아닌, 데이터 기반 요약 분석)

| 항목 | 7.8B (현재) | 70B (Groq) |
|------|-----------|-----------|
| 밸류에이션 해석 | 단순 수치 나열 | PER/PBR의 시장 평균 대비 평가 |
| 기술적 분석 | 시그널 단순 언급 | 시그널 조합 해석 + 지지/저항 맥락 |
| 뉴스 반영 | 제목 나열 | 뉴스의 주가 영향 해석 |
| 투자의견 | 긍정/중립/부정 3단계 | 근거 기반 의견 + 리스크 팩터 |
| 한국어 자연스러움 | 어색한 표현 빈번 | 양호 (금융 특수 용어는 프롬프트 보완) |

### 5.2 품질 테스트 (구현 전 선행)

Groq 전환 전 반드시 품질 비교 테스트 실시:

1. 동일 종목 3개(KR 2개 + US 1개) 선정
2. 현재 exaone 7.8B로 리포트 생성
3. Groq Llama 3.3 70B로 동일 데이터 기반 리포트 생성
4. 비교 항목: 분석 깊이, 한국어 자연스러움, 구조 일관성, 사실 정확성
5. 결과에 따라 모델/프롬프트 조정

### 5.3 한국어 금융 용어 약점 보완

Llama 3.3 70B는 한국 금융 특수 용어에서 약점이 예상됨:

| 용어 | 예상 대응 | 보완 |
|------|----------|------|
| 외국인 순매수/순매도 | 기본 개념 이해, 맥락 해석 미흡 가능 | 프롬프트에 용어 정의 + 해석 가이드 |
| 공매도 잔고/비율 | 한국 규제 특수성 약함 | 현재 데이터 미포함 — 당장 문제 없음 |
| 신용잔고/신용비율 | 한국식 표현 부자연스러울 수 있음 | 현재 데이터 미포함 |
| PER/PBR/ROE | 범용 금융 용어 → 문제 없음 | - |
| 코스피/코스닥 구분 | 기본 인지 가능 | 프롬프트에 시장 구분 명시 |

---

## 6. 변경 파일 요약

### 신규 파일

| 파일 | 설명 |
|------|------|
| `src/lib/groq.ts` | Groq API 호출 모듈 (OpenAI 호환) |
| `.github/workflows/cron-generate-reports.yml` | 리포트 자동 생성 크론 |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/ai-report.ts` | LLM 호출을 환경변수 기반 분기 (Groq/Ollama) + 프롬프트 가이드라인 추가 |
| `src/app/reports/[slug]/page.tsx` | 면책 문구 추가 (없는 경우) |
| `.env.example` | `GROQ_API_KEY`, `GROQ_MODEL` 추가 |

---

## 7. 구현 순서

| 순서 | 항목 | 백엔드 예상 시간 | 비고 |
|------|------|----------------|------|
| 0 | **품질 테스트** (exaone vs Llama 70B) | 1시간 | 구현 전 선행 필수 |
| 1 | groq.ts 신규 파일 + 환경변수 분기 | 2시간 | 핵심 구현 |
| 2 | 프롬프트 가이드라인 추가 | 30분 | ai-report.ts 수정 |
| 3 | cron-generate-reports.yml 생성 | 30분 | GitHub Actions |
| 4 | 면책 문구 추가 | 10분 | reports 페이지 |
| 5 | Ollama 모델 교체 (로컬) | 10분 | 환경변수 변경만 |

**총 백엔드 공수: ~4시간**

---

## 8. 향후 확장 (Phase 2+)

| 기능 | 설명 |
|------|------|
| 온디맨드 리포트 | 로그인 사용자 일 3건 실시간 생성 |
| 컨텍스트 확장 | 90일 주가, 섹터 비교, 과거 리포트 추가 |
| 주간 종합 리포트 | 시장 요약, 주간 TOP5 상승/하락 |
| 리포트 평가 시스템 | 사용자 피드백 (유용/비유용) 수집 |
| 멀티모델 A/B 테스트 | Llama vs Mixtral vs Qwen 품질 비교 |
