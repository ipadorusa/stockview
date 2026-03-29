# 교차 검증 리포트 — Agent B

> 검증 대상: `.ai/v1-flow/flow-doc-a.md`
> 검증일: 2026-03-28
> 검증 방법: 실제 소스코드 파일 대조 (src/app/, src/lib/, src/components/, src/proxy.ts)

---

## 1. 검증 요약

| 섹션 | 판정 | 비고 |
|---|---|---|
| 1. 전체 페이지 목록 | **PASS** (경미한 오류 1건) | 모든 페이지 URL 확인됨. 렌더링/ISR 값 정확. 시스템 파일 정확 |
| 2. 페이지별 상세 Flow | **PARTIAL** (오류 2건, 불일치 1건) | 컴포넌트명/데이터소스 대부분 정확. 종목 비교 최대 수 불일치 |
| 3. 인증/권한 Flow | **PASS** | Mermaid 다이어그램 정확. Protected/Admin 경로 목록 정확 |
| 4. API 엔드포인트 전체 목록 | **PASS** | 67개 엔드포인트 모두 실제 route.ts와 일치 |
| 5. 글로벌 네비게이션 구조 | **PARTIAL** (불일치 2건) | 레이아웃 구조 정확. 헤더 카테고리 라벨 불일치, 서브 네비 불일치 |
| 6. 데이터 Flow 다이어그램 | **PASS** | Cron 엔드포인트 15개 모두 확인. 데이터 흐름 정확 |

**전체 판정: PASS (조건부)** — 핵심 구조와 대부분의 세부사항이 정확하나, 소수의 오류/누락이 존재

---

## 2. 오류 목록

### 오류 #1: 종목 비교 최대 수 불일치 (문서 내부 모순)

- **문서 기술**: 섹션 2.13에서 "최대 4종목" + "2~4 슬롯"이라 기술
- **실제 코드**: `src/app/compare/page.tsx:90` — `const MAX_SLOTS = 4` (4종목이 맞음)
- **그러나**: `src/app/page.tsx:208` 홈페이지 QuickLinkCard에서 `"최대 5종목 비교 분석"`이라 표시
- **판정**: 문서의 "최대 4종목" 기술은 compare 페이지 코드와 일치하지만, **홈페이지 UI 텍스트와 compare 코드 간에 불일치**가 존재함 (5 vs 4). 이는 코드베이스 자체의 버그이나, 문서에서 이 불일치를 언급하지 않음

### 오류 #2: 헤더 네비게이션 카테고리 라벨 불일치

- **문서 기술 (섹션 5.2)**: 데스크톱 메인 네비게이션 — "홈", "투자 정보", "분석", "뉴스", "더보기"
- **실제 코드**: `src/components/layout/app-header.tsx:77` — "분석" 카테고리의 label은 `"분석"`
- **그러나**: 모바일 그룹에서는 line 36에 `"분석 도구"`로 별도 라벨 사용
- **판정**: 데스크톱 메인 네비 라벨은 정확. 그러나 문서에서 모바일과 데스크톱의 라벨 차이를 구분하지 않음

### 오류 #3: 서브 네비게이션 "더보기" 항목 누락

- **문서 기술 (섹션 5.2 표)**: 더보기 서브 네비 = "관심종목, 포트폴리오, 마이페이지, 소개"
- **실제 코드**: `src/components/layout/app-header.tsx:101-106`
  ```
  subLinks: [
    { href: "/watchlist", label: "관심종목" },
    { href: "/portfolio", label: "포트폴리오" },
    { href: "/mypage", label: "마이페이지" },
    { href: "/about", label: "소개" },
  ]
  ```
- **판정**: 문서와 실제 코드 일치. **단, `/portfolio` 경로에 대응하는 page.tsx는 존재하지 않음** (watchlist 페이지 내 탭으로만 구현). 미들웨어 matcher에 `/portfolio/:path*`가 있으나 이는 API 경로 보호용. 헤더의 `/portfolio` 링크는 404를 반환할 수 있음 — 문서에서 이 사실을 언급하지 않음

---

## 3. 누락 항목

### 누락 #1: loading.tsx / error.tsx 파일 미기재

문서 섹션 1.4 "시스템 파일"에 루트 `layout.tsx`, `error.tsx`, `not-found.tsx`만 기재됨. 실제로는 다음 파일들이 추가로 존재:

| 파일 | 존재 여부 | 문서 기재 |
|---|---|---|
| `src/app/error.tsx` | 존재 | 기재됨 |
| `src/app/not-found.tsx` | 존재 | 기재됨 |
| `src/app/market/loading.tsx` | 존재 | **미기재** |
| `src/app/market/error.tsx` | 존재 | **미기재** |
| `src/app/news/loading.tsx` | 존재 | **미기재** |
| `src/app/news/error.tsx` | 존재 | **미기재** |
| `src/app/screener/loading.tsx` | 존재 | **미기재** |
| `src/app/stock/[ticker]/loading.tsx` | 존재 | **미기재** |
| `src/app/stock/[ticker]/error.tsx` | 존재 | **미기재** |
| `src/app/etf/loading.tsx` | 존재 | **미기재** |
| `src/app/etf/[ticker]/loading.tsx` | 존재 | **미기재** |
| `src/app/watchlist/loading.tsx` | 존재 | **미기재** |

**총 10개의 loading/error 파일이 누락됨**

### 누락 #2: 중간 layout.tsx 파일 미기재

루트 layout.tsx만 기재되었으나 다음 layout 파일들이 추가로 존재:

| 파일 | 용도 |
|---|---|
| `src/app/compare/layout.tsx` | 비교 페이지 레이아웃 |
| `src/app/news/layout.tsx` | 뉴스 페이지 레이아웃 |
| `src/app/settings/layout.tsx` | 설정 페이지 레이아웃 |

문서 섹션 1.4에서 `settings/layout.tsx`만 언급 없이 섹션 2.20에서 설정 페이지를 설명함. compare와 news의 layout은 아예 언급되지 않음.

### 누락 #3: 홈페이지 추가 컴포넌트 미기재

- **문서에 미기재**: `GtmPageView`, `PageContainer`, `JsonLd`, `Skeleton` — 홈페이지 및 대부분 페이지에 공통 사용되는 컴포넌트
- **판정**: 이들은 유틸리티/분석 컴포넌트이므로 핵심 Flow에 영향은 적으나, 완전성 차원에서 공통 컴포넌트 섹션으로 별도 기재하면 좋겠음

### 누락 #4: 홈페이지 환율 섹션 미기재

- **문서**: 홈페이지 컴포넌트에 `CompactIndexBar`, `IndexGroups`, `PopularStocksTabs`, `LatestNewsSection`, `QuickLinkGrid`, `AdSlot` 기재
- **실제 코드**: 환율 섹션이 별도로 존재 (`src/app/page.tsx:175-201`) — `IndexCard`를 재사용해서 환율 5개(USD, EUR, JPY, CNY, GBP)를 표시
- **판정**: 데이터 소스에 `getExchangeRates()` 함수가 기재되었으나, 컴포넌트 목록에서 환율 표시 섹션이 독립 섹션으로 언급되지 않음

---

## 4. 불일치 항목

### 불일치 #1: 스크리너 시그널 SSG — "5종" 기술의 정확성

- **문서 기술**: `/screener/[signal]` — "Server (async) + SSG(5종)"
- **실제 코드**: `src/app/screener/[signal]/page.tsx:51-53`
  ```ts
  export function generateStaticParams() {
    return Object.keys(SIGNAL_SLUGS).map((signal) => ({ signal }))
  }
  ```
  `SIGNAL_SLUGS`에는 5개 키: `golden-cross`, `rsi-oversold`, `volume-surge`, `bollinger-bounce`, `macd-cross`
- **판정**: 정확함. 5종이 맞음

### 불일치 #2: 리포트 상세 SSG — "최근50" 기술

- **문서 기술**: `/reports/[slug]` — "Server (async) + SSG(최근50)"
- **실제 코드**: `src/app/reports/[slug]/page.tsx:31-38` — 최근 30일 내 리포트 50건 take
- **판정**: 정확. "최근50"이라는 표현이 30일 제한을 생략했으나 큰 문제는 아님

### 불일치 #3: 미들웨어 matcher에 `/portfolio/:path*` 존재

- **문서 기술**: Protected 경로에 `/watchlist/*`, `/settings/*`, `/mypage/*` 등 기재
- **실제 코드**: `src/proxy.ts:41` matcher에 `/portfolio/:path*` 포함
- **그러나**: `/portfolio` 페이지 디렉토리는 존재하지 않음 (API만 존재: `/api/portfolio`)
- **판정**: 문서에서 미들웨어 matcher의 `/portfolio/:path*`를 누락. 실질적으로 `/portfolio` 페이지가 없어 영향은 없으나 정확성 차원에서 기재 필요

### 불일치 #4: `/reports/stock/[ticker]` 렌더링 타입

- **문서 기술**: "Server (async)" + "미인증 시 리다이렉트" (섹션 1.2에 "미인증 시 리다이렉트"로 기재)
- **실제 코드**: `src/app/reports/stock/[ticker]/page.tsx` — `revalidate = 900`, async server component
- **판정**: 정확. 미들웨어에서 리다이렉트하고, 통과 시 ISR 서버 컴포넌트로 렌더링

### 불일치 #5: Cron 엔드포인트 HTTP 메서드

- **문서 기술**: 모든 Cron API가 `POST` 메서드
- **실제 코드**: 15개 cron route.ts 모두 `export async function POST` 확인
- **판정**: 정확

---

## 5. 개선 제안

### 제안 1: loading/error 바운더리 섹션 추가
10개의 loading.tsx와 error.tsx 파일이 존재하지만 문서에 전혀 기재되지 않음. 섹션 1.4에 "라우트별 Loading/Error States" 하위 표를 추가할 것을 권장.

### 제안 2: 공통 컴포넌트 목록 섹션 추가
`PageContainer`, `GtmPageView`, `JsonLd`, `Breadcrumb`, `AdSlot`, `AdDisclaimer` 등 거의 모든 페이지에서 사용되는 공통 컴포넌트를 별도 섹션으로 정리하면 FE 팀의 이해도가 높아짐.

### 제안 3: 홈페이지 환율 섹션 명시
홈페이지에 환율 5개(USD, EUR, JPY, CNY, GBP)를 `IndexCard`로 표시하는 독립 섹션이 존재하지만 컴포넌트 목록에서 누락됨. 데이터 소스에 `getExchangeRates()`는 기재했으므로 컴포넌트 측도 보완 필요.

### 제안 4: 코드베이스 버그 보고
홈페이지 `src/app/page.tsx:208`에서 "최대 5종목 비교 분석"이라 표시하지만, 실제 compare 페이지의 `MAX_SLOTS = 4`로 4종목까지만 가능. UI 텍스트 수정이 필요.

### 제안 5: `/portfolio` 링크 경로 문제
헤더 서브 네비게이션에 `/portfolio` 링크가 존재하지만 해당 경로에 page.tsx가 없음. watchlist 페이지 내 포트폴리오 탭으로 리다이렉트하거나, 페이지를 생성해야 함.

### 제안 6: 중간 layout 파일 기재
`compare/layout.tsx`, `news/layout.tsx`, `settings/layout.tsx` 3개의 중간 레이아웃이 문서에서 누락됨. 이들이 어떤 역할을 하는지 (메타데이터 공유, 중첩 레이아웃 등) 섹션 1.4에 추가 기재 권장.

---

## 6. 검증 통계

| 항목 | 수치 |
|---|---|
| 검증한 페이지 URL | 34개 |
| 검증한 API 엔드포인트 | 67개 (route.ts 파일 대조) |
| 검증한 컴포넌트명 | 45개+ |
| 검증한 데이터 소스 함수 | 20개+ |
| 검증한 ISR revalidate 값 | 12개 (모두 정확) |
| 검증한 SSG generateStaticParams | 5개 (모두 정확) |
| 검증한 미들웨어 경로 | 11개 matcher 패턴 |
| **발견된 오류** | **3건** (비교 수 모순, 헤더 라벨, 서브 네비) |
| **누락 항목** | **4건** (loading/error 10파일, layout 3파일, 환율 섹션, 공통 컴포넌트) |
| **불일치 항목** | **2건** (미들웨어 matcher, 리포트 SSG 30일 제한 생략) |
| **정확도** | **약 93%** (총 120+ 항목 중 오류/누락 9건) |

---

## 결론

Agent A의 문서는 전반적으로 **높은 정확도**로 작성되었다. 34개 페이지 URL, 67개 API 엔드포인트, 15개 Cron Job이 모두 실제 코드와 일치하며, ISR revalidate 값과 SSG 설정도 정확하다. 인증/권한 Flow의 Mermaid 다이어그램도 `src/proxy.ts` 및 `src/lib/auth.ts`와 정확히 대응된다.

주요 개선점은: (1) loading/error 바운더리 파일 10개와 중간 layout 3개를 시스템 파일 섹션에 추가, (2) 홈페이지 환율 섹션과 공통 컴포넌트 명시, (3) 코드베이스 자체의 "5종목 vs 4종목" 불일치 보고. 이 세 가지를 보완하면 완전한 Flow 문서가 될 것이다.
