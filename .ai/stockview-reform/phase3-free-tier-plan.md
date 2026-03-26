# Phase 3 무료 한도 전용 실행 계획

> 작성일: 2026-03-27 | 근거: 크론 감사, DB 스키마 분석, GitHub Actions 분 추정

---

## 0. 절대 제약 조건

| 리소스 | 한도 | 현재 사용 |
|--------|------|----------|
| Vercel Hobby | 함수 60초 | 7개 라우트 초과 (maxDuration 120~300) |
| Supabase Free | 500MB (실사용 ≤450MB) | ~450MB (한도 근접) |
| GitHub Actions (private) | 2,000분/월 | ~1,472분 (2x 곱 적용) |
| Groq Free | RPM 30, TPM ~6,000 | AI 리포트에서 사용 중 |
| Yahoo Finance | ~200 req/hr | US 시세 수집에 사용 |
| Naver | 200ms/req | KR 시세 수집에 사용 |
| Telegram Bot API | 무제한 | 크론 에러 알림용 |

---

## A. 기존 인프라 정상화

### A.1 Hobby 60초 초과 라우트 (7개)

| 라우트 | 현재 maxDuration | 현재 방식 | 정상화 방안 | 예상 시간 |
|--------|-----------------|----------|------------|----------|
| `collect-master` | 300s | Vercel API | KR/US 분리 → 각각 60초 내 | 각 30s |
| `collect-us-quotes` | 300s | Vercel API | **GA 직접 실행** (`scripts/` 전환) | ~120s |
| `sync-kr-sectors` | 300s | Vercel API | 배치 분할 (시장별) → 60초 내 | 각 40s |
| `collect-kr-etf-quotes` | 300s | Vercel API | 삭제 (고아 라우트, 워크플로우 없음) | - |
| `collect-disclosures` | 120s | Vercel API | 배치 크기 축소 (100→50) → 60초 내 | ~45s |
| `sync-corp-codes` | 120s | GA 스크립트 | 이미 GA 직접 실행 ✅ | 유지 |
| `collect-dart-dividends` | 300s | GA 스크립트 | 이미 GA 직접 실행 ✅ | 유지 |

**maxDuration 미설정 라우트 (2개):**
- `collect-exchange-rate`, `collect-news` → `export const maxDuration = 60` 추가 필요

### A.2 GitHub Actions 현재 소비 최적화

| 워크플로우 | 현재 스케줄 | 분/월 (2x) | 최적화 | 최적화 후 |
|-----------|-----------|-----------|--------|----------|
| cron-news | 매 2시간 | 744 | → 매 4시간 | **372** |
| cron-exchange | 매 3시간 (평일) | 176 | → 2회/일 (개장/폐장) | **88** |
| cron-pipeline-kr | 매일 (평일) | 132 | 유지 | 132 |
| cron-pipeline-us | 매일 (평일) | 132 | 유지 | 132 |
| cron-generate-reports | 매일 (평일) | 88 | 유지 | 88 |
| cron-disclosures | 매일 (평일) | 44 | 유지 | 44 |
| cron-fundamentals | 매일 (평일) | 44 | 유지 | 44 |
| cron-corp-codes | 매주 토 | 64 | 유지 | 64 |
| cron-dart-dividends | 분기 | 16 | 유지 | 16 |
| 기타 (cleanup, events, sectors, master) | 다양 | 32 | 유지 | 32 |
| **합계** | | **~1,472** | | **~1,012** |

**최적화 절감: -460분/월** → 뉴스 주기 완화(-372) + 환율 축소(-88)

---

## B. DB 용량 최적화

### B.1 TechnicalIndicator 온디맨드 전환 (핵심)

**현재**: 13개 지표 × ~4,800종목 × 90일 = **~284MB** (DB의 63%)

**전환 설계**:
1. `TechnicalIndicator` 테이블 **삭제** (Prisma 마이그레이션)
2. `src/lib/indicators.ts` 유틸 함수 생성:
   - 입력: `DailyPrice[]` (최근 60일분)
   - 출력: `{ ma5, ma20, ma60, ema12, ema26, rsi14, macd*, bb*, avgVolume20 }`
   - MA/EMA/RSI/MACD/BB 모두 OHLCV에서 순수 계산 가능
3. **스크리너 API** (`/api/screener`): DB에서 DailyPrice 조회 → 온디맨드 계산 → 필터
4. **종목 상세 API** (`/api/stocks/[ticker]/indicators`): 요청 시 계산
5. `compute-indicators` 크론 **삭제** (GA 분 추가 절감)

**트레이드오프**:
- 스크리너 응답 시간 증가 (~200ms → ~500ms) — 허용 범위
- `compute-indicators` 크론 삭제로 GA 분 추가 절감 (-44분/월 × 2x = -88분)

### B.2 DailyPrice 보존 기간

현재 365일 보존 → **유지** (장기 차트 필수, 167MB는 적정)

### B.3 AiReport 보존 정책 추가

현재 보존 정책 없음 → **180일 보존** 추가 (cleanup 크론에 추가)
- 예상 절감: 장기적으로 ~5-10MB

### B.4 최적화 후 DB 용량

| 테이블 | 최적화 전 | 최적화 후 |
|--------|----------|----------|
| TechnicalIndicator | ~284MB | **0MB** (삭제) |
| DailyPrice | ~167MB | ~167MB |
| 기타 (Stock, News, AiReport 등) | ~15MB | ~12MB |
| **합계** | **~466MB** | **~179MB** |
| **Phase 3 가용량** | 없음 | **~226MB** (450 - 179 - 45 버퍼) |

---

## C. Phase 3 기능별 엄격 판정

### ✅ Go: 알림 시스템 (Telegram)

| 항목 | 판정 |
|------|------|
| DB 추가 | `UserAlert` 모델 ~1MB 이하 |
| API 호출 | Telegram Bot API 무제한 |
| 크론 | 기존 시세 수집 크론에 피기백 (추가 크론 불필요) |
| GA 추가 분 | **0분** |

**구현 방식**:
- `UserAlert` 모델: `userId, stockId, type(PRICE/SIGNAL/EARNINGS/DIVIDEND), condition(JSON), isActive, lastTriggeredAt`
- 시세 수집 크론 완료 시 → UserAlert 체크 → 조건 충족 시 Telegram 발송
- Telegram Bot API (`sendMessage`) 호출은 수ms, 기존 크론 60초 내 충분

**판정 근거**: 추가 리소스 사실상 0. Telegram 무제한. DB 1MB 미만.

---

### ✅ Go: MarketIndex 이력

| 항목 | 판정 |
|------|------|
| DB 추가 | `MarketIndexHistory` 모델 ~1MB/년 |
| API 호출 | 기존 지수 수집에서 INSERT 추가 (추가 호출 없음) |
| 크론 | 기존 크론에 피기백 |
| GA 추가 분 | **0분** |

**구현 방식**:
- `MarketIndexHistory` 모델: `symbol, date, open, high, low, close, volume`
- `@@unique([symbol, date])` 인덱스
- 기존 `collect-kr-quotes` / `collect-us-quotes` 크론에서 지수 수집 시 이력 테이블에도 upsert
- 프론트: 홈/시장 페이지에 지수 미니차트 추가

**판정 근거**: 추가 API 호출 0, DB 1MB 미만, 기존 크론 수정만으로 구현.

---

### ✅ Go: Sector 정규화

| 항목 | 판정 |
|------|------|
| DB 추가 | `Sector` 모델 ~0.1MB |
| API 호출 | 없음 (일회성 마이그레이션) |
| 크론 | 기존 `sync-kr-sectors` 크론 수정 |
| GA 추가 분 | **0분** |

**구현 방식**:
1. `Sector` 모델: `id, name, nameEn, market`
2. `Stock.sector` (String) → `Stock.sectorId` (FK) 마이그레이션
3. 기존 `sync-kr-sectors` 크론에서 Sector 테이블 upsert
4. 섹터별 성과 계산은 API 요청 시 DailyPrice 기반 온디맨드

**판정 근거**: 일회성 작업, 지속 비용 0.

---

### ⚠️ 축소 Go: 외국인/기관 수급 (상위 200종목 한정)

| 항목 | 판정 |
|------|------|
| DB 추가 | `InstitutionalFlow` ~2MB/년 (200종목 × 365일) |
| API 호출 | Naver 스크래핑 200건 × 200ms = 40초 (60초 내) |
| 크론 | 신규 1개 (평일 1회) |
| GA 추가 분 | **44분/월** (22일 × 1분 × 2x) |

**축소 사유**: 전 종목(4,300) 수집 시 4,300 × 200ms = 860초 → 60초 초과, GA 분도 초과

**구현 방식**:
- `InstitutionalFlow` 모델: `stockId, date, foreignBuy, foreignSell, foreignNet, institutionBuy, institutionSell, institutionNet`
- 대상: 시가총액 상위 200 KR 종목 (KOSPI 150 + KOSDAQ 50)
- 소스: Naver Finance 투자자별 매매동향 페이지 스크래핑
- 크론: 평일 16:30 KST (장마감 후)

**판정 근거**: 200종목이면 Vercel 60초 내 가능, DB 2MB/년, GA 44분 추가.

---

### ⚠️ 축소 Go: 뉴스 감성 분석 (주 2회, 30건)

| 항목 | 판정 |
|------|------|
| DB 추가 | `News.sentiment` 필드 이미 존재 (추가 0) |
| API 호출 | Groq RPM 30, TPM 6,000 → 30건 × ~200토큰 = ~6,000 TPM 내 |
| 크론 | 신규 1개 (주 2회) |
| GA 추가 분 | **32분/월** (8회 × 2분 × 2x) |

**축소 사유**:
- 매일 100건 처리 시: TPM 6,000에서 ~10건/분 → 10분 소요 → GA 440분/월 (초과)
- 주 2회 30건이면 Groq 무료 한도 내 안전

**구현 방식**:
- Groq API (`llama-3.3-70b-versatile`)로 뉴스 제목+요약 → positive/negative/neutral 분류
- `News.sentiment` 필드 업데이트 (스키마 변경 불필요)
- 크론: 수/토 09:00 UTC, 최신 30건 미분석 뉴스 처리
- 프론트: 종목 상세 뉴스 탭에 감성 뱃지 표시

**판정 근거**: 기존 필드 활용, DB 추가 0, Groq 무료 한도 내.

---

### ⚠️ 축소 Go: US 종목 확대 (500 → 1,000)

| 항목 | 판정 |
|------|------|
| DB 추가 | DailyPrice +500종목 × 365일 × ~50B = **~9MB/년** |
| API 호출 | Yahoo 200 req/hr → 1,000종목 ~120초 (GA 직접 실행) |
| 크론 | 기존 `collect-us-quotes`를 GA 직접 실행으로 전환 |
| GA 추가 분 | **+88분/월** (기존 대비 실행 시간 2배, 22일 × 2분추가 × 2x) |

**축소 사유**: 2,000종목 시 Yahoo rate limit으로 5시간+ → GA 초과. 1,000이 현실적 한계.

**구현 방식**:
- NASDAQ 100 + S&P MidCap 400 주요 종목 추가 (CSV)
- `collect-us-quotes`를 `scripts/collect-us-quotes.ts`로 이전 (GA 직접 실행)
- Yahoo v8 batch: 5 concurrent, 200ms throttle

**판정 근거**: 1,000종목이면 GA 직접 실행으로 2분 내 가능, DB 9MB/년 추가.

---

### ❌ No-Go: 장중 시세 (5분 폴링)

| 항목 | 판정 |
|------|------|
| KR 5분 폴링 | 78회/일 × 22일 × 1분 × 2x = **3,432분/월** |
| US 5분 폴링 | 78회/일 × 22일 × 1분 × 2x = **3,432분/월** |
| KR+US 합계 | **6,864분/월** → 예산의 343% |

**축소 검토**:

| 간격 | KR만 (분/월) | KR+US (분/월) | 판정 |
|------|-------------|-------------|------|
| 5분 | 3,432 | 6,864 | ❌ 불가 |
| 15분 | 1,144 | 2,288 | ❌ 불가 |
| 30분 | 572 | 1,144 | ❌ 예산 57%+ |
| 1시간 | 308 | 616 | ⚠️ 단독은 가능하나 다른 기능 전부 포기 |
| 2시간 | 176 | 352 | ⚠️ 가능하나 효용 의문 |

**No-Go 근거**:
- 5분 폴링은 GitHub Actions 무료 한도를 단독으로 3배 초과
- 1시간 간격까지 축소해도 308분(KR만)으로 Phase 3 다른 기능 예산 잠식
- 2시간 간격이면 "장중 시세"의 의미가 퇴색 (현재 1일 1회 대비 개선폭 미미)
- Vercel Hobby Cron: 일 1회 제한으로 대안 불가
- **무료 한도 내에서는 구현 불가. 유료 전환(Vercel Pro Cron 또는 외부 스케줄러) 시 재검토.**

---

## D. 예산 배분표

### GitHub Actions 월 예산

```
GitHub Actions 월 한도:                    2,000분
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
현재 크론 (최적화 후):                     1,012분
  - 뉴스 (4시간):          372분
  - 파이프라인 KR+US:      264분
  - AI 리포트:              88분
  - 환율 (2회/일):          88분
  - 펀더멘탈:               44분
  - 공시:                   44분
  - 기타:                  112분

compute-indicators 삭제:                    -88분
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
최적화 후 현재 합계:                        924분

Phase 3 추가:                              164분
  - 외국인/기관 수급:        44분
  - 뉴스 감성 분석:          32분
  - US 종목 확대 추가분:     88분
  - 알림/지수이력/섹터:       0분

여유분 (20%):                              400분
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
합계:                                    1,488분 ✅ (< 2,000)
잔여:                                      512분
```

### DB 용량 예산

```
Supabase 실사용 한도:                      450MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
최적화 후 현재:                            179MB
  - DailyPrice:            167MB
  - 기타 테이블:            12MB
  - TechnicalIndicator:      0MB (삭제)

Phase 3 추가 (1년 기준):                    13MB
  - InstitutionalFlow:       2MB
  - MarketIndexHistory:      1MB
  - US 종목 확대 DailyPrice: 9MB
  - UserAlert:              <1MB
  - Sector:                 <1MB

여유분 (10%):                               45MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
합계:                                      237MB ✅ (< 450MB)
잔여:                                      213MB
```

---

## E. 최종 로드맵

### Sprint 1: 인프라 정상화 + DB 최적화 (1주)

| # | 작업 | 예상 공수 |
|---|------|----------|
| 1-1 | TechnicalIndicator 온디맨드 전환 (`lib/indicators.ts` + API 수정) | 4시간 |
| 1-2 | TechnicalIndicator 테이블 삭제 마이그레이션 | 30분 |
| 1-3 | compute-indicators 크론 삭제 | 15분 |
| 1-4 | Hobby 60초 초과 라우트 정상화 (분할/GA 전환) | 3시간 |
| 1-5 | maxDuration 미설정 라우트 수정 | 10분 |
| 1-6 | cron-news 4시간 간격으로 변경 | 10분 |
| 1-7 | cron-exchange 2회/일로 변경 | 10분 |
| 1-8 | AiReport 180일 보존 정책 cleanup 크론 추가 | 15분 |
| 1-9 | collect-kr-etf-quotes 고아 라우트 삭제 | 10분 |

### Sprint 2: 저비용 기능 (1주)

| # | 작업 | 예상 공수 |
|---|------|----------|
| 2-1 | MarketIndexHistory 모델 + 마이그레이션 | 1시간 |
| 2-2 | 기존 크론에서 지수 이력 upsert 추가 | 1시간 |
| 2-3 | 프론트: 홈/시장 페이지 지수 미니차트 | 3시간 |
| 2-4 | Sector 모델 정규화 + 마이그레이션 | 2시간 |
| 2-5 | sync-kr-sectors 크론 Sector 테이블 연동 | 1시간 |
| 2-6 | 프론트: 섹터 페이지 개선 | 2시간 |

### Sprint 3: 알림 시스템 (1~2주)

| # | 작업 | 예상 공수 |
|---|------|----------|
| 3-1 | UserAlert 모델 + 마이그레이션 | 1시간 |
| 3-2 | 알림 설정 UI (종목 상세 페이지) | 4시간 |
| 3-3 | 알림 관리 페이지 (`/settings/alerts`) | 3시간 |
| 3-4 | 시세 크론에 알림 체크 로직 삽입 | 2시간 |
| 3-5 | Telegram 발송 모듈 (`lib/telegram.ts`) | 1시간 |
| 3-6 | 알림 유형별 조건 엔진 (가격/신호/배당/실적) | 3시간 |

### Sprint 4: 수급 + 감성 분석 (1~2주)

| # | 작업 | 예상 공수 |
|---|------|----------|
| 4-1 | InstitutionalFlow 모델 + 마이그레이션 | 1시간 |
| 4-2 | Naver 수급 데이터 스크래퍼 | 3시간 |
| 4-3 | 수급 수집 크론 + GA 워크플로우 | 1시간 |
| 4-4 | 프론트: 종목 상세 "수급" 탭 | 3시간 |
| 4-5 | 뉴스 감성 분석 Groq 파이프라인 | 2시간 |
| 4-6 | 감성 분석 크론 + GA 워크플로우 | 1시간 |
| 4-7 | 프론트: 뉴스 감성 뱃지 | 1시간 |

### Sprint 5: US 종목 확대 (1주)

| # | 작업 | 예상 공수 |
|---|------|----------|
| 5-1 | NASDAQ 100 + MidCap 주요 종목 CSV 준비 | 1시간 |
| 5-2 | collect-us-quotes GA 직접 실행 전환 | 2시간 |
| 5-3 | seed-us-master 확장 | 1시간 |
| 5-4 | US 시세 수집 배치 최적화 (1,000종목) | 2시간 |

---

## F. 리스크 및 모니터링

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Groq 무료 한도 변경 | 감성 분석 중단 | Google Gemini Flash 무료 tier로 즉시 전환 |
| Naver 스크래핑 차단 | 수급 데이터 수집 불가 | KRX 데이터 시스템 CSV 다운로드 방식으로 전환 |
| DB 용량 예상 초과 | 450MB 근접 | DailyPrice 보존 기간 365→180일 축소 (비상시) |
| GA 분 예상 초과 | 2,000분 근접 | cron-news 6시간 간격으로 추가 축소 |
| Yahoo rate limit 강화 | US 1,000종목 수집 실패 | 배치 크기 축소 + 수집 주기 분산 |

**모니터링 대시보드 (Telegram 봇 활용)**:
- 매주 월요일: GA 분 사용량 알림
- 매월 1일: DB 용량 리포트 알림
- 크론 실패 시: 즉시 Telegram 알림 (기존 기능)

---

## G. 요약

| 기능 | 판정 | GA 추가 | DB 추가 | 구현 순서 |
|------|------|---------|---------|----------|
| 알림 시스템 (Telegram) | ✅ Go | 0분 | <1MB | Sprint 3 |
| MarketIndex 이력 | ✅ Go | 0분 | 1MB | Sprint 2 |
| Sector 정규화 | ✅ Go | 0분 | <1MB | Sprint 2 |
| 외국인/기관 수급 | ⚠️ 축소 Go (200종목) | 44분 | 2MB | Sprint 4 |
| 뉴스 감성 분석 | ⚠️ 축소 Go (주2회 30건) | 32분 | 0MB | Sprint 4 |
| US 종목 확대 | ⚠️ 축소 Go (→1,000) | 88분 | 9MB | Sprint 5 |
| **장중 시세** | **❌ No-Go** | **3,432분+** | - | **무료 불가** |

**총 Phase 3 추가**: GA +164분/월, DB +13MB/년
**인프라 최적화 절감**: GA -548분/월, DB -284MB
**최종 사용량**: GA 1,488분/2,000분 (74%), DB 237MB/450MB (53%)
