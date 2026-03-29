# 교차검증 재검증 보고서 (검증 교차검증 담당 2)

> 검증일: 2026-03-28
> 대상: `final-verification-1.md` (검증1), `final-verification-2.md` (검증2)
> 방법: 소스코드 직접 대조를 통한 양 리포트 교차검증

---

## 1. 검증1 리포트 정확도

**종합 정확도: 약 95%** — 높은 수준의 소스코드 기반 검증을 수행했으며, 대부분의 판정이 정확하다.

### 정확한 부분
- ChartPeriod 타입 검증: `1W|2W|3W|1M|3M|6M|1Y` 7개 옵션 — **소스코드 확인 완료** (`src/types/stock.ts:66`, `src/components/stock/chart-controls.tsx:7-15`)
- `MAX_SLOTS = 4` vs "최대 5종목" 불일치 — **확인** (`src/app/compare/page.tsx:90`, `src/app/page.tsx:208`)
- `/portfolio` 디렉토리 부재 — **확인** (디렉토리 존재하지 않음)
- `isProtectedRoute`에 `/portfolio` 미포함 — **확인** (`src/proxy.ts:8-15`에 `/portfolio` 없음)
- Provider 중첩 순서 — **확인** (`src/components/providers.tsx:25-37`: SessionProvider > QueryClientProvider > ThemeProvider > TooltipProvider > CompareProvider, Toaster는 ThemeProvider 내부/CompareProvider 외부)
- 교차검증 A 정확도 100%, 교차검증 B 정확도 89% 판정 — **적절**
- `screener/error.tsx` 미존재 지적 — **확인** (파일 없음)

### 소폭 부정확한 부분
- **opengraph-image.tsx 불완전 기재**: 검증1은 `stock/[ticker]/opengraph-image.tsx` 1개만 언급했으나, 실제로는 `etf/[ticker]/opengraph-image.tsx`도 존재 (총 2개). 검증1 자체도 누락.
- **error.tsx 개수**: 검증1은 "error.tsx 3개 (market, news, stock/[ticker])"로 기재했으나, 실제로는 root error.tsx 포함 **4개**. 검증2가 "4개"로 정확히 기재. 검증1은 본문에서 "루트 error.tsx는 Doc A에 기재됨"이라고 별도 언급하여 인지는 하고 있으나, 통계 표기에서 혼동 유발.

---

## 2. 동의/불일치 항목

### 동의하는 판정

| 항목 | 검증1 판정 | 내 판정 |
|------|-----------|--------|
| C-1: 차트 기간 옵션 오류 | CRITICAL | **동의.** 양쪽 문서 모두 틀림. FE 구현에 직접 영향. |
| C-2: 관심종목 인증 자기 모순 | CRITICAL | **동의.** `proxy.ts:8`에서 `/watchlist`는 명확히 미들웨어 보호. Doc B의 "컴포넌트 레벨 체크" 서술은 오류. |
| M-1: loading/error 10개 누락 | MAJOR | **동의.** loading 7개 + error 3개(non-root) = 10개. Doc A에 누락. |
| M-2: 중간 layout 3개 누락 | MAJOR | **동의.** `compare/layout.tsx`, `news/layout.tsx`, `settings/layout.tsx` 존재 확인. |
| M-3: /portfolio 404 | MAJOR | **동의.** 디렉토리 미존재 + isProtectedRoute 누락의 이중 문제. |
| M-4: 5종목 vs 4종목 | MAJOR | **동의.** 코드베이스 자체 버그. |
| M-5: Desktop/Mobile 네비 차이 | MAJOR | **동의.** 문서에서 체계적 구분 필요. |
| "Doc B를 뼈대로" 권고 | 타당 | **동의.** 아래 상세 분석 참조. |

### 부분적 불일치

| 항목 | 검증1 판정 | 내 판정 | 이유 |
|------|-----------|--------|------|
| Doc A 정확도 91% | 소폭 하향 | **적절하나 88-90%가 더 정확할 수 있음** | loading/error 10개 + layout 3개 + 환율 섹션 + 공통 컴포넌트 등 구조적 누락이 많아 91%는 다소 관대 |
| m-6: opengraph-image | MINOR 1개 | **MINOR이지만 2개** | `etf/[ticker]/opengraph-image.tsx`도 누락. 검증1 자체가 이를 놓침 |

---

## 3. 검증2와의 비교

### 일치하는 부분 (핵심 합의)
- 관심종목 인증 오류, 5종목/4종목 버그, /portfolio 404 — 양쪽 동일하게 확인
- ISR revalidate 10개, API 10개, Cron 15개 정확성 — 양쪽 모두 100% 일치 확인
- loading.tsx 7개, error.tsx 4개(root 포함) 파일 목록 — 양쪽 동일
- Doc B의 구조적 우수성 — 양쪽 동일 인식

### 검증2에만 있는 가치 (검증1이 놓친 관점)
1. **UX 팀 관점**: 에러/빈 상태 정의 부재, 온보딩 흐름 미상세, 이탈 시나리오, 접근성 — 검증1은 코드 정확성에만 집중하여 이 차원을 다루지 않음
2. **FE 팀 관점**: 컴포넌트 Props 인터페이스, 반응형 디자인 (4/10), 동적 import 전략 — 실행 가능성 측면에서 중요한 지적
3. **BE 팀 관점**: API Request/Response 스키마, 에러 응답 코드, Rate Limiting, Zod 스키마 상세 — API 명세서 별도 작성 필요성
4. **점수화된 평가**: 범위(8), 정확성(9), 가독성(8), 실행가능성(7), 유지보수(7) = 7.8/10 — 정량적 판단 제공

### 검증1에만 있는 가치 (검증2가 놓친 부분)
1. **교차검증 정확도 재검증**: A 100%, B 89% — 메타 검증 수행
2. **상세 불일치 표 (섹션 5.3)**: 7개 항목에 대해 "어느 쪽이 맞는지" 명시 — 통합 시 의사결정에 핵심
3. **통합 문서 구조 제안 (섹션 6.3)**: 10개 섹션 + 부록 2개의 구체적 목차 — 실행 가능한 가이드

### 근본적 차이: 관점의 보완성
- **검증1**: "코드 정확성 검증자" — 소스코드 대조 중심, 이슈 분류(C/M/m) 체계적
- **검증2**: "실용성 평가자" — 팀별(UX/FE/BE) 활용 관점, 완성도 점수화

**두 리포트는 상충하지 않고 보완적이다.** 모순되는 판정은 없음.

### "Doc B를 뼈대로" 권고에 대한 판정

검증1: "Doc B를 뼈대로, Doc A 강점 병합"
검증2: "병합하지 말고 이원화 운영" (Doc B = 1차 참조, Doc A = 2차 참조)

**내 판정: 검증1의 "Doc B 뼈대 + Doc A 병합"이 더 적절하다.**

이유:
- 두 문서를 별도 유지하면 동기화 비용이 계속 발생 (검증2도 유지보수 7/10으로 우려 표명)
- Doc B의 프레임워크(레이아웃 구조, 인벤토리, 컴포넌트 맵, 상태 관리, 미들웨어)가 확실히 체계적
- Doc A의 페이지별 FROM/TO Flow, 데이터 파이프라인 다이어그램, 인증 시퀀스는 Doc B에 없는 고유 가치
- 단일 문서로 통합하되, 팀별 색인(UX/FE/BE 바로가기)을 제공하면 검증2의 우려도 해소 가능

---

## 4. 최종 확정 이슈 목록

소스코드 직접 대조를 통해 확정한 전체 이슈 목록이다.

### CRITICAL (2건) — 확정

| # | 대상 | 이슈 | 소스코드 근거 | 비고 |
|---|------|------|-------------|------|
| C-1 | Doc A, Doc B | 차트 기간 옵션 오류 | `src/types/stock.ts:66` — `ChartPeriod = "1W"|"2W"|"3W"|"1M"|"3M"|"6M"|"1Y"` (7개). Doc A: "1M/3M/6M/1Y/3Y", Doc B: "1W~5Y" | 양쪽 모두 틀림. FE 구현 직접 영향. |
| C-2 | Doc B | 관심종목 인증 자기 모순 | `src/proxy.ts:8` — `pathname.startsWith("/watchlist")` 미들웨어 보호 | Doc B 내부 모순 (line 298 vs 인벤토리 표). 인증 구현 혼동. |

**CRITICAL 2건 모두 정당하다.** 검증1의 판정에 동의.

### MAJOR (5건) — 확정

| # | 대상 | 이슈 | 소스코드 근거 |
|---|------|------|-------------|
| M-1 | Doc A | loading/error 바운더리 10개 누락 | loading.tsx 7개 + error.tsx 3개(non-root) 존재 확인 |
| M-2 | Doc A | 중간 layout.tsx 3개 누락 | `compare/layout.tsx`, `news/layout.tsx`, `settings/layout.tsx` 존재 확인 |
| M-3 | Doc A, Doc B | /portfolio 404 + isProtectedRoute 누락 | 디렉토리 미존재 + `proxy.ts` isProtectedRoute에 미포함 |
| M-4 | Doc A, Doc B | "최대 5종목" vs MAX_SLOTS=4 | `page.tsx:208` vs `compare/page.tsx:90` |
| M-5 | Doc A, Doc B | Desktop/Mobile 네비 차이 미상세 | navCategories vs navGroups 라벨/링크 차이 |

**MAJOR 5건 모두 정당하다.** 검증1의 판정에 동의.

### MINOR (9건) — 확정 (검증1의 8건 + 1건 추가)

| # | 대상 | 이슈 |
|---|------|------|
| m-1 | Doc B | Toaster 레이아웃 다이어그램 누락 |
| m-2 | Doc B | "분석 요청" URL `/reports?tab=requests` 미기재 |
| m-3 | Doc B | "더보기" prefixes와 subLinks 혼동 |
| m-4 | Doc A | 공통 컴포넌트 섹션 미비 |
| m-5 | Doc A | 홈페이지 환율 섹션 미기재 |
| m-6 | Doc A, Doc B | `opengraph-image.tsx` 미기재 — **2개** (stock/[ticker] + etf/[ticker]) |
| m-7 | Doc B | sitemap.ts (기본) 미기재 |
| m-8 | Doc A | Mermaid 다이어그램 API 경로 형식 불일치 |
| m-9 | Doc A, Doc B | `/reports/request` 인증 방식 명확화 필요 (미들웨어 보호 아닌 컴포넌트 레벨 체크이나, Doc B의 관심종목 서술과 혼동 가능) |

### 문서 범위 외 보완 사항 (검증2 고유 발견, 타당성 인정)

아래는 코드 정확성이 아닌 "기획 문서 완성도" 관점의 이슈로, v1.0 통합 시 섹션 추가를 검토할 사항이다.

- 에러/빈 상태(Empty State) 정의 부재 — UX 팀 필요
- 반응형 디자인 사양 부재 — FE 팀 필요
- API Request/Response 스키마 미기재 — BE 팀 필요 (OpenAPI 별도 문서 권장)
- 접근성(A11y) 요구사항 부재
- 성능 예산(LCP/FID/CLS) 미정의

---

## 5. v1.0 통합 문서 작성 가이드

### 5.1 기본 전략

**Doc B를 뼈대로 사용하고, Doc A의 고유 콘텐츠를 병합한다.**

근거:
- Doc B의 구조(레이아웃 -> 진입점 -> 사용자 여정 -> 인벤토리 -> API -> 컴포넌트 -> 상태관리 -> 미들웨어 -> 사이트맵)가 논리적 흐름에서 우수
- Doc A의 페이지별 상세 Flow는 Doc B에 없는 고유 가치
- 단일 문서 유지가 이원화보다 동기화 비용 절감

### 5.2 섹션별 소스 지정

| 통합 문서 섹션 | 주 소스 | 보조 소스 | 수정 사항 |
|--------------|--------|----------|----------|
| 1. 글로벌 레이아웃 구조 | Doc B 섹션 1 | — | Toaster 위치 다이어그램에 추가 (ThemeProvider 내부, CompareProvider 외부) |
| 2. 사용자 진입점 | Doc B 섹션 2 | — | — |
| 3. 사용자 여정별 Flow | Doc B 섹션 3 | Doc A의 FROM/TO 관계 추가 | C-2 수정: 관심종목 인증을 "미들웨어 리다이렉트 1차 + useSession 2차"로 |
| 4. 페이지 전체 인벤토리 | Doc B 섹션 4 | Doc A의 sitemap.ts | m-7 수정: sitemap.ts 추가 |
| 5. 페이지별 상세 Flow | **Doc A 섹션 2** (고유) | — | C-1 수정: 차트 기간 1W/2W/3W/1M/3M/6M/1Y. m-5 수정: 환율 섹션 추가 |
| 6. 인증/권한 Flow | Doc A 섹션 3 시퀀스 다이어그램 + Doc B 섹션 8 미들웨어 상세 | — | M-3: /portfolio matcher vs isProtectedRoute 비대칭 명시 |
| 7. API 전체 인벤토리 | Doc B 섹션 5 | Doc A의 HTTP 메서드 | Cron maxDuration은 Doc B 값 사용 (검증 완료) |
| 8. 컴포넌트 의존성 맵 | Doc B 섹션 6 | Doc A의 인라인 컴포넌트 목록 | m-4: 공통 컴포넌트 섹션 보강 |
| 9. 상태 관리 & 데이터 Fetching | Doc B 섹션 7 | — | — |
| 10. 데이터 파이프라인 | **Doc A 섹션 6** (고유) | — | — |
| 11. 전체 사이트맵 | Doc B 섹션 9 | — | — |
| 부록 A: ISR/캐싱 전략 | Doc B | — | — |
| 부록 B: 코드베이스 알려진 이슈 | **신규 작성** | — | 아래 참조 |

### 5.3 필수 수정 체크리스트

통합 문서 작성 시 반드시 반영할 사항:

- [ ] **C-1**: 차트 기간 → `1W | 2W | 3W | 1M | 3M | 6M | 1Y` (7개)
- [ ] **C-2**: 관심종목 인증 → "미들웨어 `/auth/login?callbackUrl=/watchlist` 리다이렉트 (1차) + `useSession()` 이중 체크 (2차)"
- [ ] **M-1**: Doc A의 시스템 파일 섹션에 loading.tsx 7개 + error.tsx 3개 추가 (통합 시 Doc B 섹션 4.3 사용하므로 자동 해소)
- [ ] **M-2**: 중간 layout.tsx 3개 기재 (동일, Doc B에 이미 있음)
- [ ] **M-3**: /portfolio 현황 명시 — "네비게이션/matcher에 존재하나 페이지 미구현 + isProtectedRoute 누락. 포트폴리오 기능은 /watchlist 탭."
- [ ] **M-4**: "부록 B: 코드베이스 알려진 이슈"에 5종목/4종목 불일치 기재
- [ ] **M-5**: Desktop navCategories vs Mobile navGroups 비교 표 추가
- [ ] **m-6**: opengraph-image.tsx **2개** 기재 (stock/[ticker], etf/[ticker])

### 5.4 "부록 B: 코드베이스 알려진 이슈" 내용

```markdown
| # | 이슈 | 위치 | 설명 |
|---|------|------|------|
| 1 | "최대 5종목" vs MAX_SLOTS=4 | page.tsx:208 / compare/page.tsx:90 | UI 텍스트와 실제 제한 불일치 |
| 2 | /portfolio 404 | 네비게이션 + matcher | 페이지 미구현, /watchlist 탭으로 대체 |
| 3 | /portfolio isProtectedRoute 누락 | proxy.ts | matcher에는 포함되나 보호 로직에서 빠짐 |
```

### 5.5 충돌 해소 원칙

두 문서가 서로 다른 내용을 기술한 경우의 해소 기준:

1. **소스코드가 정답**: 문서 간 불일치 시 반드시 소스코드 대조 후 정확한 쪽 채택
2. **더 상세한 쪽 채택**: 양쪽 모두 정확하나 상세도가 다를 경우 더 상세한 버전 사용
3. **양쪽 모두 오류 시**: 소스코드 기반으로 새로 작성 (예: 차트 기간 옵션)

---

## 요약

| 평가 항목 | 결과 |
|----------|------|
| 검증1 리포트 정확도 | **약 95%** — opengraph-image 2개 중 1개 누락, error.tsx 통계 표기 혼동 외 매우 정확 |
| 검증2 리포트 정확도 | **약 97%** — 기술적 검증 + UX/FE/BE 관점까지 포괄. error.tsx 4개 정확 기재 |
| 양 검증 간 모순 | **없음** — 보완적 관계 |
| CRITICAL 2건 | **모두 정당** (소스코드 확인 완료) |
| MAJOR 5건 | **모두 정당** (소스코드 확인 완료) |
| MINOR | **9건** (검증1의 8건 + 1건 추가) |
| "Doc B 뼈대" 권고 | **동의** — 검증2의 "이원화" 대안보다 유지보수 비용 면에서 우수 |
