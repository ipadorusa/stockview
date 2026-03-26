# 유료 API/서비스 식별 및 무료 대안

> 작성일: 2026-03-26 | 역할: PM-Lead
> 근거: `.ai/stockview-reform/` 기획 문서 전체 검토

---

## 1. 식별된 유료/위험 항목 요약

| # | 항목 | 문서 위치 | 유형 |
|---|------|----------|------|
| 1 | Alpha Vantage / Polygon.io | `04-reform-plan.md` §3 리스크 대응 | Yahoo 백업 유료 대안 |
| 2 | NewsAPI | `04-reform-plan.md` §3 리스크 대응 | Google News RSS 유료 대안 |
| 3 | Trading Economics API | `03-feature-analysis.md` §3.6 | 경제 캘린더 데이터 소스 |
| 4 | Financial Modeling Prep | `03-feature-analysis.md` §1.2 | KR/US 통합 유료 API |
| 5 | Cloud LLM API (Claude/GPT) | `03-feature-analysis.md` §2.3 | AI 리포트 개선 |
| 6 | Stripe | `03-feature-analysis.md` §6.2, §7 Phase 3 | 프리미엄 구독 결제 |
| 7 | Vercel KV / Upstash Redis | `03-feature-analysis.md` §5.3 | Rate Limit용 Redis |
| 8 | Vercel Pro (maxDuration 300) | `spec-data-quality.md` §2 | Fundamentals 배치 처리 |

---

## 2. 항목별 무료 대안 분석

---

### 2.1 Alpha Vantage / Polygon.io (Yahoo Finance v8 백업)

**현재 기획**: Yahoo Finance v8 API 차단 시 백업으로 Alpha Vantage 또는 Polygon.io 검토

**문제**: 두 서비스 모두 유료
- Alpha Vantage: 무료 25 req/day, 유료 $50/월~
- Polygon.io: 무료 tier 있으나 실시간 15분 지연, 유료 $29/월~

**무료 대안**:

| 대안 | 설명 | 한계 |
|------|------|------|
| **Yahoo Finance v7/v11** | 비공식이지만 v8과 병행 엔드포인트 다수 존재. v8 차단 시 v11(`/v11/finance/quoteSummary`)으로 fallback | 동일하게 비공식 |
| **yfinance (Python 래퍼)** | Yahoo 공식 라이브러리 아님, Node.js 환경 불일치 | 언어 차이 |
| **Yahoo Finance RSS** | `https://finance.yahoo.com/rss/headline?s=AAPL` — 이미 부분 사용 중 | 시세 아님, 뉴스만 |
| **Stooq.com** | 무료 CSV/JSON, `https://stooq.com/q/l/?s=AAPL.US&f=sd2t2ohlcv&e=json` | 비공식, 제한 있음 |
| **EODHD Free Tier** | 무료 20 req/day (US 시장만), 히스토리 1년 | 요청 수 제한 |

**권장 무료 전략**: Yahoo Finance v8 + v11 멀티 엔드포인트 fallback 체인 구현. v8 → v11 → Stooq 순서로 폴백. 별도 유료 서비스 불필요.

---

### 2.2 NewsAPI (Google News RSS 대안)

**현재 기획**: Google News RSS 품질 불안정 시 NewsAPI 또는 직접 언론사 RSS

**문제**: NewsAPI 무료 tier는 100 req/day, 1개월 이전 기사 불가, 상업적 사용 불가

**무료 대안**:

| 대안 | 설명 | 현재 사용 여부 |
|------|------|--------------|
| **언론사 직접 RSS** | 한경(`https://www.hankyung.com/feed/all-news`), 매경, 연합뉴스, 이데일리 — 이미 `news-kr-direct.ts`에서 사용 중 | **이미 사용 중** |
| **Yahoo Finance RSS** | `https://finance.yahoo.com/news/rssindex` — 이미 사용 중 | **이미 사용 중** |
| **Naver 검색 API** | `fetchNaverSearchNews` — 이미 사용 중 (60건) | **이미 사용 중** |
| **Google News RSS 개선** | 현재 구조(`news-rss.ts`) 유지, 중복 제거 강화 | **이미 사용 중** |

**결론**: NewsAPI 도입 불필요. 현재 다층 RSS 구조(Google News RSS + 언론사 직접 RSS + Yahoo RSS + Naver 검색 API)로 충분. 개선 방향은 기존 소스 품질 향상.

---

### 2.3 Trading Economics API (경제 캘린더)

**현재 기획**: FOMC, CPI 등 경제 캘린더 기능을 Trading Economics API로 구현 제안

**문제**: Trading Economics API 유료 (월 $99~)

**무료 대안**:

| 대안 | 설명 | 구현 난이도 |
|------|------|-----------|
| **Investing.com 스크래핑** | `03-feature-analysis.md`에서 이미 대안으로 언급. robots.txt 확인 필요 | Medium |
| **Econdb.com** | 무료 경제 데이터 API, `https://www.econdb.com/api/series/` | Low |
| **FRED (세인트루이스 연준)** | 미국 경제지표 무료 API (`https://fred.stlouisfed.org/docs/api/`). API Key 필요하나 무료 | Low |
| **OECD Data API** | 국제 경제 지표 무료 (`https://data.oecd.org/api/`) | Medium |
| **정적 데이터 관리** | FOMC 일정 등 분기 단위 정보는 수동 관리 + GitHub 이슈 등록 방식 | Low |
| **Finnhub.io 무료 tier** | 경제 캘린더 포함, 60 req/min 무료 | Low |

**권장**: Phase 3 경제 캘린더는 **Finnhub.io 무료 tier**(60 req/min, 경제 캘린더 엔드포인트 포함) + **FRED API**(미국 지표) 조합. Trading Economics API 제거.

---

### 2.4 Financial Modeling Prep (KR/US 통합 API)

**현재 기획**: `03-feature-analysis.md`에서 Naver 스크래핑 대안으로 언급 (월 $15~)

**문제**: 월 $15~이며 KR 데이터 제한적

**무료 대안**:

| 대안 | 설명 | KR 지원 |
|------|------|---------|
| **한국투자증권 OpenAPI** | 공식, 실시간 지원, 무료 (계좌 필요) | ✅ KR 전용 |
| **KRX 정보데이터시스템** | 장마감 후 EOD 데이터, 무료 (`http://data.krx.co.kr/`) | ✅ KR 전용 |
| **FinanceDataReader** | Python 라이브러리, KR/US 무료 오픈소스 | ✅ 지원 |
| **OpenDART** | 이미 사용 중, 재무제표 데이터 포함 | ✅ 이미 사용 중 |

**결론**: Financial Modeling Prep 도입 불필요. KR 데이터는 단기적으로 Naver 스크래핑 유지 + KRX API 보완, 장기적으로 한국투자증권 OpenAPI 검토.

---

### 2.5 Cloud LLM API — Claude/GPT (AI 리포트)

**현재 기획**: Ollama 로컬 한계 극복을 위해 Claude API 또는 GPT API 검토 (종목당 $0.01~0.05)

**문제**: 일일 자동 생성 시 월 수십 달러 비용 발생 가능

**무료/저비용 대안**:

| 대안 | 설명 | 비용 |
|------|------|------|
| **Ollama + VPS** | `03-feature-analysis.md`에서도 언급. $10~20/월 VPS에서 Ollama 실행 | 저비용 |
| **Groq API (무료 tier)** | LLaMA 3.x 기반, 무료 tier 6,000 tokens/min, 14,400 req/day | **무료** |
| **Google Gemini API (무료 tier)** | 무료 15 req/min, 1,500 req/day (Gemini 1.5 Flash) | **무료** |
| **Cloudflare Workers AI** | 무료 tier 포함, LLaMA 3 지원, Vercel과 연동 용이 | **무료** |
| **Together.ai** | 오픈소스 모델, 월 $5 무료 크레딧 | 무료 크레딧 |

**권장**: **Groq API 무료 tier** (LLaMA 3.3 70B, 빠른 추론) 또는 **Google Gemini Flash 무료 tier** 사용. 하루 10~20개 리포트 자동 생성 충분. Claude/GPT 유료 API 불필요.

---

### 2.6 Stripe (프리미엄 구독 결제)

**현재 기획**: Phase 3에서 프리미엄 구독 결제 처리용

**문제**: Stripe 수수료 2.9% + $0.30/건 (무료는 아님, 하지만 결제 처리 수수료는 불가피)

**무료/저비용 대안**:

| 대안 | 설명 | 수수료 |
|------|------|--------|
| **Stripe** (현재 기획) | 글로벌 표준, Next.js 연동 우수 | 2.9% + $0.30 |
| **토스페이먼츠** | 한국 서비스에 최적, 간편 연동 | 3.3% (부가세 포함) |
| **KG이니시스** | 국내 PG사, 구독 모델 지원 | 협의 |
| **Paddle** | SaaS 구독 전문, VAT 처리 포함 | 5% + $0.50 |

**결론**: 결제 수수료는 불가피. 한국 서비스이므로 **토스페이먼츠**가 더 적합. Stripe 대신 토스페이먼츠로 변경 권장. Phase 3 항목이므로 지금 당장 결정 불필요.

---

### 2.7 Vercel KV / Upstash Redis (Rate Limit)

**현재 기획**: In-memory Rate Limit이 Serverless 환경에서 무의미 → Vercel KV 또는 Upstash Redis 교체 제안

**문제**: Vercel KV 무료 tier 256MB/월 이후 유료, Upstash 무료 tier 10,000 req/day

**무료 대안**:

| 대안 | 설명 | 비용 |
|------|------|------|
| **Upstash Redis 무료 tier** | 10,000 req/day, 256MB — StockView 규모에서 충분 | **무료** |
| **Vercel Edge Middleware** | IP 기반 Rate Limit을 Edge에서 처리, 별도 Redis 불필요 | **무료** (Vercel Hobby에 포함) |
| **현재 구현 유지** | In-memory Rate Limit은 무의미하지만, 실제 공격 없으면 기능 영향 없음 | 무료 |

**권장**: **Vercel Edge Middleware** 기반 Rate Limit 적용. Redis 없이 무료로 구현 가능. `src/middleware.ts`에서 처리.

---

### 2.8 Vercel Pro (maxDuration 300초)

**현재 기획**: `spec-data-quality.md`에서 Fundamentals 배치 500개 처리에 `maxDuration = 300` 필요 → Vercel Pro 필요

**문제**: Vercel Pro 월 $20

**무료 대안**:

| 대안 | 설명 |
|------|------|
| **배치 분할 + 병렬화** | US 250개 + KR 250개를 동시 처리하여 60초 내 완료. 실제 소요시간: max(50s, 25s) = 50s |
| **GitHub Actions 분리 실행** | Fundamentals를 US/KR 두 개 워크플로우로 분리, 각각 60초 내 처리 |
| **청크 분할 크론** | 배치 크기를 150개로 줄이고 실행 횟수를 늘림 (주 3회 → 주 5회) |

**권장**: US/KR 병렬 처리로 `maxDuration = 60` (Vercel Hobby) 내 완료 가능. Vercel Pro 불필요. `spec-data-quality.md`의 `maxDuration = 300` 설정 제거.

---

## 3. 기획 문서 수정 필요 항목

| 문서 | 수정 항목 | 현재 내용 | 변경 내용 |
|------|----------|----------|----------|
| `04-reform-plan.md` §3 | Yahoo Finance 백업 | "Alpha Vantage / Polygon.io 백업" | "Yahoo Finance v11 멀티 엔드포인트 fallback" |
| `04-reform-plan.md` §3 | Google News RSS 대안 | "NewsAPI 또는 직접 언론사 RSS" | "직접 언론사 RSS 강화 (이미 사용 중)" |
| `03-feature-analysis.md` §3.6 | 경제 캘린더 소스 | "Trading Economics API (유료)" | "Finnhub.io 무료 tier + FRED API" |
| `03-feature-analysis.md` §2.3 | AI 리포트 개선 | "Cloud LLM API(Claude 등) 종목당 $0.01~0.05" | "Groq API 무료 tier (LLaMA 3.3 70B)" |
| `03-feature-analysis.md` §7 Phase 3 | 결제 | "Stripe 연동" | "토스페이먼츠 연동" |
| `03-feature-analysis.md` §5.3 | Rate Limit | "Vercel KV/Upstash Redis" | "Vercel Edge Middleware (무료)" |
| `spec-data-quality.md` §2 | Vercel Pro | "maxDuration = 300 (Vercel Pro 필요)" | "US/KR 병렬 처리로 60초 내 완료, maxDuration 300 불필요" |

---

## 4. 현재 무료 소스 (변경 불필요)

이미 사용 중이며 무료인 소스들 — 개편 기획에서 유지:

| 소스 | 용도 | 상태 |
|------|------|------|
| Naver Finance 스크래핑 | KR 종목 마스터/시세/지수 | 무료, 비공식 (리스크 있음) |
| Yahoo Finance v8 | US 시세/차트/펀더멘탈 | 무료, 비공식 |
| Google News RSS | 뉴스 | 무료 |
| Yahoo Finance RSS | 뉴스 | 무료 |
| 언론사 직접 RSS (한경/매경/연합/이데일리) | KR 뉴스 | 무료 |
| Naver 검색 API | KR 뉴스 보완 | 무료 (일정 제한) |
| OpenDART | KR 공시/배당 | 무료 공식 API |
| S&P 500 CSV | US 종목 마스터 | 무료 정적 파일 |
| GitHub Actions | 크론 스케줄러 | 무료 (월 2,000분) |
| Supabase Free | PostgreSQL DB | 무료 (500MB) |
| Vercel Hobby | 배포/Cron | 무료 (60초 제한) |

---

## 5. 결론 및 권장 액션

**즉시 반영할 수정사항** (Phase 1~2 기획 문서):

1. `spec-data-quality.md`: `maxDuration = 300` → US/KR 병렬 처리 방식으로 대체
2. `04-reform-plan.md`: Alpha Vantage/Polygon.io → Yahoo v11 fallback으로 대체
3. `04-reform-plan.md`: NewsAPI → "직접 언론사 RSS 강화"로 대체
4. `03-feature-analysis.md`: AI 리포트 Claude/GPT → Groq 무료 tier로 대체
5. `03-feature-analysis.md`: Trading Economics API → Finnhub 무료 tier로 대체
6. `03-feature-analysis.md`: Stripe → 토스페이먼츠로 대체
7. `03-feature-analysis.md`: Vercel KV/Upstash Redis → Vercel Edge Middleware로 대체

**Phase 3 이후 검토 항목** (비용 발생 불가피):
- 프리미엄 구독 결제 수수료 (토스페이먼츠 3.3%) — 구독 모델 도입 시 불가피
- Supabase Pro 업그레이드 ($25/월) — DailyPrice 3년 보존 시 500MB 초과 시점에 필요
