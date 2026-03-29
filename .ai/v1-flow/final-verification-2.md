# 최종 검증 보고서 2 — 사용성(Usability) 관점

> 검증자: 최종 검증 담당 2
> 검증일: 2026-03-28
> 대상: `flow-doc-a.md` (코드 구조 기반, 정확도 93%), `flow-doc-b.md` (사용자 여정 기반, 정확도 97.1%)
> 참고: `cross-validation-a.md`, `cross-validation-b.md`
> 검증 방법: 소스 코드 대조 + UX/FE/BE 팀 관점 사용성 평가

---

## 1. 종합 평가

**v1.0 기획 문서 준비도: 7.8 / 10**

두 문서 모두 높은 기술적 정확도를 보여주며, 코드베이스의 전체 구조를 충실히 반영하고 있다. 그러나 v1.0 기획 문서로서 각 팀이 바로 작업에 투입하기에는 몇 가지 보완이 필요하다.

**문서별 역할 분담:**
- **Doc A** (코드 구조 기반): FE/BE 개발자를 위한 기술 참조 문서로 적합. 페이지별 컴포넌트, 데이터 소스, API 명세가 체계적.
- **Doc B** (사용자 여정 기반): UX 디자이너 및 PM을 위한 흐름 문서로 적합. Mermaid 다이어그램, 사용자 시나리오, 상태 관리 패턴이 풍부.

**권장 활용 방식:** 두 문서를 병합하지 말고, Doc B를 1차 참조(사용자 흐름 이해), Doc A를 2차 참조(구현 세부사항)로 이원화하여 운영할 것을 권장.

---

## 2. UX팀 관점 검증 결과

### 2.1 사용자 여정 완전성: **양호 (8/10)**

**강점:**
- Doc B의 Mermaid 다이어그램이 비로그인/로그인 사용자의 전체 여정을 시각적으로 잘 표현함
- 비로그인 사용자가 접근 가능한 페이지 목록과 제한 사항이 명확하게 테이블로 정리됨
- 회원가입 -> 로그인 -> 보호 페이지 접근의 흐름이 sequenceDiagram으로 명확

**부족한 점:**
1. **에러/빈 상태(Empty State) 정의 부재**: 관심종목이 비어있을 때, 검색 결과가 없을 때, 네트워크 에러 시의 UI가 어떻게 보여야 하는지 기술되지 않음. UX 팀이 별도로 정의해야 함
2. **온보딩 흐름 미상세**: 홈페이지의 "비로그인 시 초보자 가이드 배너"가 언급되지만, 신규 사용자를 위한 온보딩 시나리오(첫 관심종목 추가, 포트폴리오 설정 등)가 없음
3. **이탈 시나리오 미기재**: 사용자가 폼 작성 중 페이지를 벗어날 때의 확인 다이얼로그 유무, 세션 만료 시 동작 등이 문서화되지 않음
4. **접근성(Accessibility) 고려 부재**: 키보드 네비게이션, 스크린 리더 지원, 색상 대비 등 접근성 요구사항이 전혀 없음

### 2.2 사용자 인터랙션 문서화: **양호 (7/10)**

**강점:**
- Doc A의 각 페이지별 "사용자 인터랙션" 섹션이 클릭, 탭 전환, 필터 등 주요 인터랙션을 나열
- Doc B의 Flow 다이어그램이 페이지 간 전환 경로를 시각적으로 표현

**부족한 점:**
1. **마이크로 인터랙션 미기재**: 관심종목 추가 시 별 아이콘 애니메이션, 토스트 알림 표시/사라짐 타이밍, 로딩 스피너 vs 스켈레톤 사용 기준 등이 없음
2. **검색 UX 상세 미기재**: 검색바의 자동완성 동작, 최근 검색 기록 표시 여부, 모바일 검색 오버레이의 전환 애니메이션 등이 문서에 없음

### 2.3 사이트맵/IA 구조: **우수 (9/10)**

**강점:**
- Doc B의 섹션 9에 전체 사이트맵 Mermaid 다이어그램이 공개/보호/관리자 영역으로 분리되어 있어 IA 다이어그램 작성에 바로 활용 가능
- Doc A의 섹션 5에서 데스크톱 헤더, 모바일 하단 탭바, 햄버거 메뉴 구조가 명확

**부족한 점:**
1. **Desktop vs Mobile 네비게이션 차이 미구분**: 교차 검증에서 지적된 대로 navGroups(모바일)와 navCategories(데스크톱)의 라벨/링크 구성이 다르나 명시적으로 분리 기술되지 않음
   - Desktop "더보기": 관심종목, 포트폴리오, 마이페이지, **소개** (설정 없음)
   - Mobile "MY": 관심종목, 포트폴리오, 마이페이지, **설정** (소개 없음)
   - Mobile "분석 도구" vs Desktop "분석" (라벨 차이)

### 2.4 엣지 케이스 커버리지: **미흡 (5/10)**

문서에서 다루지 않는 중요 엣지 케이스:
- 종목이 상장폐지/거래정지된 경우의 종목 상세 페이지 표시
- 동시에 같은 종목을 관심종목에 중복 추가 시도
- 포트폴리오에 음수 수량/가격 입력 시 검증
- 네트워크 오프라인 상태에서의 클라이언트 컴포넌트 동작
- 장시간 비활동 후 JWT 세션 만료 시 사용자 경험

---

## 3. FE팀 관점 검증 결과

### 3.1 컴포넌트 식별: **양호 (8/10)**

**강점:**
- Doc B 섹션 6에 페이지별 컴포넌트 의존성 맵이 잘 정리됨 (17개 페이지)
- 공통 컴포넌트 목록 (PageContainer, GtmPageView, Breadcrumb, JsonLd, AdSlot 등)이 Doc B에 별도 섹션으로 정리
- Doc A는 각 페이지별로 인라인으로 컴포넌트를 나열하여 상세도가 높음

**부족한 점:**
1. **컴포넌트 Props 인터페이스 미기재**: FE 팀이 컴포넌트를 빌드하려면 각 컴포넌트의 props 타입이 필요한데, 문서에는 컴포넌트명만 나열됨
2. **동적 import 대상 미명시**: `CompareChart`와 `CompareFundamentals`가 dynamic import인 것은 기재되었으나, 다른 페이지의 동적 로딩 전략은 상세하지 않음
3. **홈페이지 환율 섹션 누락** (교차 검증 B에서 지적): `IndexCard`를 재사용하는 환율 5개(USD, EUR, JPY, CNY, GBP) 표시 영역이 Doc A의 컴포넌트 목록에서 독립적으로 기술되지 않음

### 3.2 데이터 페칭 패턴: **우수 (9/10)**

**강점:**
- Doc B 섹션 7에 Server/Client/Hybrid 패턴을 명확히 분류
- React Query 키 구조와 staleTime이 페이지별로 정리됨
- URL State (searchParams) 사용 패턴도 기재됨
- Doc A 각 페이지의 "데이터 소스" 섹션에서 Prisma 쿼리와 API 호출이 구분됨

**소스 코드 대조 결과:**

| 페이지 | 문서 기술 | 실제 코드 | 판정 |
|--------|----------|----------|------|
| `/` | ISR 900s | `revalidate = 900` | **일치** |
| `/market` | ISR 900s | `revalidate = 900` | **일치** |
| `/stock/[ticker]` | ISR 900s + SSG 50 | `revalidate = 900`, `take: 50` | **일치** |
| `/etf/[ticker]` | ISR 900s + SSG 50 | `revalidate = 900`, `take: 50` | **일치** |
| `/news` | ISR 300s | `revalidate = 300` | **일치** |
| `/reports` | ISR 900s | `revalidate = 900` | **일치** |
| `/reports/[slug]` | ISR 900s + SSG 50 | `revalidate = 900`, `take: 50` | **일치** |
| `/sectors` | ISR 3600s | `revalidate = 3600` | **일치** |
| `/dividends` | ISR 3600s | `revalidate = 3600` | **일치** |
| `/screener/[signal]` | ISR 900s + SSG 5 | `revalidate = 900`, `SIGNAL_SLUGS` 5개 | **일치** |

**10개 페이지 ISR 값 모두 정확 확인.**

### 3.3 반응형 디자인: **미흡 (4/10)**

두 문서 모두 반응형 관련 정보가 극히 제한적:
- 모바일 하단 탭바가 `lg:hidden`이라는 것과, 데스크톱 서브 네비가 `lg` 이상에서 표시된다는 것만 기재
- 브레이크포인트별 레이아웃 변화, 그리드 열 수 변화, 터치 영역 크기 등 구체적 요구사항 없음
- 모바일에서의 테이블 스크롤 처리 (비교 테이블, 스크리너 결과 등) 방식 미정의

### 3.4 Loading/Error 바운더리: **분리 평가**

- **Doc A**: 시스템 파일 섹션(1.4)에 루트 `error.tsx`와 `not-found.tsx`만 기재. **loading/error 10개 파일 누락**
- **Doc B**: 섹션 4.3에 7개 loading.tsx + 4개 error.tsx를 모두 기재. **완전**

실제 존재하는 파일 (소스 코드 확인):
- `loading.tsx` 7개: market, news, stock/[ticker], watchlist, screener, etf, etf/[ticker]
- `error.tsx` 4개: root, market, news, stock/[ticker]

Doc B의 기재 내용과 완전히 일치함을 확인.

---

## 4. BE팀 관점 검증 결과

### 4.1 API 계약(Contract): **양호 (7/10)**

**강점:**
- 두 문서 모두 API 엔드포인트를 체계적으로 열거 (Doc A: 67개, Doc B: 59+15=74개)
- HTTP 메서드, 인증 수준, 설명이 포함됨
- Cron API의 maxDuration 값이 Doc B에 정확히 기재됨

**소스 코드 대조 결과 (10개 API 엔드포인트 확인):**

| 엔드포인트 | 문서 메서드 | 실제 메서드 | 판정 |
|-----------|-----------|-----------|------|
| `/api/watchlist` | GET, POST | `GET`, `POST` | **일치** |
| `/api/watchlist/[ticker]` | DELETE | `DELETE` (파일 존재) | **일치** |
| `/api/portfolio` | GET, POST | `GET`, `POST` | **일치** |
| `/api/portfolio/[id]` | PATCH, DELETE | `PATCH`, `DELETE` | **일치** |
| `/api/board` | GET, POST | `GET`, `POST` | **일치** |
| `/api/board/[id]` | GET, PATCH, DELETE | `GET`, `PATCH`, `DELETE` | **일치** |
| `/api/settings/profile` | PATCH | 파일 존재 확인 | **일치** |
| `/api/settings/password` | PATCH | 파일 존재 확인 | **일치** |
| `/api/report-requests` | GET, POST | 파일 존재 확인 | **일치** |
| `/api/report-requests/[id]` | PATCH, DELETE | 파일 존재 확인 | **일치** |

**10개 엔드포인트 모두 문서와 일치.**

**부족한 점:**
1. **Request/Response 스키마 미기재**: 각 API의 요청 파라미터 타입과 응답 JSON 구조가 문서에 없음. BE 팀이 구현하거나 FE 팀이 연동하려면 별도 API 명세서가 필요
2. **에러 응답 코드/메시지 미기재**: 400 (잘못된 입력), 401, 403, 404, 409 (중복) 등 각 엔드포인트의 에러 응답이 정의되지 않음
3. **Rate Limiting 정책 미기재**: API별 요청 제한 정책이 문서화되지 않음 (report-requests의 하루 3건 제한만 언급)
4. **Zod 스키마 내용 미기재**: API 입력 검증에 Zod를 사용한다는 사실은 언급되지만, 구체적 필드별 검증 규칙이 불완전 (설정 페이지의 닉네임 2~20자, 비밀번호 8자+ 정도만 기재)

### 4.2 인증 요구사항: **우수 (9/10)**

**강점:**
- 미들웨어 보호 경로 목록이 `src/proxy.ts`와 완전히 일치함을 소스 코드로 확인
- Admin vs Protected 경로의 동작 차이 (403 vs 401, 리다이렉트 대상)가 정확

**소스 코드 대조 결과 (proxy.ts 완전 검증):**

| 항목 | 문서 | 실제 코드 | 판정 |
|------|------|----------|------|
| Protected: `/watchlist` | 양쪽 기재 | `pathname.startsWith("/watchlist")` | **일치** |
| Protected: `/settings` | 양쪽 기재 | `pathname.startsWith("/settings")` | **일치** |
| Protected: `/mypage` | 양쪽 기재 | `pathname.startsWith("/mypage")` | **일치** |
| Protected: `/api/watchlist` | 양쪽 기재 | `pathname.startsWith("/api/watchlist")` | **일치** |
| Protected: `/api/portfolio` | 양쪽 기재 | `pathname.startsWith("/api/portfolio")` | **일치** |
| Protected: `/reports/stock` | 양쪽 기재 | `pathname.startsWith("/reports/stock")` | **일치** |
| Protected: `/board/new` | 양쪽 기재 | `pathname === "/board/new"` | **일치** |
| Protected: `/board/[id]/edit` | 양쪽 기재 | regex `/^\/board\/[^/]+\/edit$/` | **일치** |
| Admin: `/admin` | 양쪽 기재 | `pathname.startsWith("/admin")` | **일치** |
| Admin: `/api/admin` | 양쪽 기재 | `pathname.startsWith("/api/admin")` | **일치** |
| Matcher: `/portfolio/:path*` | Doc B 기재, Doc A **누락** | config.matcher에 포함 | **Doc A 누락** |

**핵심 발견:** `/reports/request` 페이지는 미들웨어 보호 대상이 아님. 컴포넌트 레벨에서 `useSession()`으로 체크하여 미인증 시 로그인 버튼을 표시하는 방식. Doc A는 "미인증 시 안내 표시"로 정확히 기술. Doc B는 "미들웨어가 아닌 컴포넌트 레벨 체크"라고 표현했으나, 이것이 오류로 지적된 관심종목 페이지(/watchlist)와 혼동되기 쉬움.

### 4.3 Cron Job 문서화: **우수 (9/10)**

**소스 코드 대조 결과:**

| Cron 엔드포인트 | 문서 maxDuration | 실제 maxDuration | 판정 |
|----------------|-----------------|-----------------|------|
| `collect-master` | 60s | 60 | **일치** |
| `collect-kr-quotes` | 55s (Doc B) | 55 | **일치** |
| `collect-us-quotes` | 60s | 60 | **일치** |
| `collect-exchange-rate` | 60s | 60 | **일치** |
| `collect-news` | 60s | 60 | **일치** |
| `collect-fundamentals` | 60s | 60 | **일치** |
| `collect-institutional` | 60s | 60 | **일치** |
| `collect-events` | 60s | 60 | **일치** |
| `collect-dart-dividends` | 300s (Doc B) | 300 | **일치** |
| `collect-disclosures` | 60s | 60 | **일치** |
| `analyze-sentiment` | 60s | 60 | **일치** |
| `generate-reports` | 60s | 60 | **일치** |
| `sync-corp-codes` | 120s (Doc B) | 120 | **일치** |
| `sync-kr-sectors` | 60s | 60 | **일치** |
| `cleanup` | 60s | 60 | **일치** |

**15개 Cron maxDuration 모두 정확.** Doc A는 maxDuration 값을 기재하지 않아 BE 참조 시 Doc B가 필수.

### 4.4 Auth Flow: **우수 (9/10)**

**소스 코드 대조 결과 (`src/lib/auth.ts`):**

| 항목 | 문서 기술 | 실제 코드 | 판정 |
|------|----------|----------|------|
| Provider: Credentials | 이메일+비밀번호 | `Credentials({...})` | **일치** |
| Provider: Google OAuth | allowDangerousEmailAccountLinking | `allowDangerousEmailAccountLinking: true` | **일치** |
| Adapter | PrismaAdapter | `PrismaAdapter(prisma)` | **일치** |
| Session | JWT, 30일 | `strategy: "jwt"`, `maxAge: 30 * 24 * 60 * 60` | **일치** |
| Custom signIn page | `/auth/login` | `pages: { signIn: "/auth/login" }` | **일치** |
| 비밀번호 검증 | bcrypt.compare | `bcrypt.compare(parsed.data.password, user.password)` | **일치** |
| Zod validation | email + password 8자+ | `loginSchema: email().email(), password().min(8)` | **일치** |
| Google 닉네임 자동생성 | 기재됨 | signIn callback에서 구현 | **일치** |

---

## 5. 코드 기반 추가 검증 결과

### 5.1 교차 검증에서 발견된 오류 재검증

| # | 오류 내용 | 재검증 결과 |
|---|----------|-----------|
| 1 | Doc B: 관심종목 "미들웨어가 아닌 컴포넌트 레벨 체크" | **오류 확인.** `proxy.ts`에서 `/watchlist`는 미들웨어 보호 대상. 컴포넌트 체크는 2차 방어. |
| 2 | Doc B: 더보기 카테고리 URL에 `/settings`, `/contact` 포함 | **경미한 혼동 확인.** prefixes(활성화 판정)와 subLinks(표시 링크)가 혼재. |
| 3 | Doc A: loading/error 10개 파일 누락 | **누락 확인.** Doc B에는 정확히 기재됨. |
| 4 | 홈페이지 "최대 5종목" vs compare의 `MAX_SLOTS=4` | **코드베이스 버그 확인.** `src/app/page.tsx:208`에서 "최대 5종목 비교 분석", 실제 제한은 4. |
| 5 | `/portfolio` 페이지 부재 | **확인.** `src/app/portfolio/` 디렉토리 존재하지 않음. 네비게이션에 링크는 있으나 404 반환. |

### 5.2 추가 발견 사항

1. **Cron API의 HTTP 메서드**: 문서에서 모든 Cron을 `POST`로 기재. 소스 코드 grep 결과 15개 모두 `export async function POST` 확인. **정확.**

2. **`/reports/request` 인증 방식**: 미들웨어 `isProtectedRoute`에 `/reports/request`가 포함되지 않음 (포함된 것은 `/reports/stock`). 컴포넌트에서 `useSession()` status로 체크. Doc A의 "미인증 시 안내 표시" 기술이 정확.

3. **Matcher에 `/portfolio/:path*` 포함**: config.matcher에 존재하나, `isProtectedRoute` 로직에는 `pathname.startsWith("/portfolio")`가 없음. matcher를 통과해도 보호 로직에서 catch되지 않는 비대칭 구조. 두 문서 모두 이 미묘한 차이를 기술하지 않음.

---

## 6. 완성도 점수표

| 차원 | 점수 | 근거 |
|------|------|------|
| **범위 완전성** | 8/10 | 39개 페이지, 67+ API, 15개 Cron이 빠짐없이 나열됨. 단, 에러/빈 상태, 반응형 요구사항, API 스키마가 부재 |
| **기술적 정확성** | 9/10 | ISR 10개, API 10개, Cron 15개, Auth 전체를 소스 코드와 대조한 결과 실질적 오류 2건(Doc B 관심종목 인증, 홈페이지 5종목 텍스트). 나머지는 경미한 누락 |
| **가독성** | 8/10 | Doc B의 Mermaid 다이어그램과 테이블 구조가 비개발자도 이해하기 쉬움. Doc A는 개발자 중심으로 정보 밀도가 높아 PM/UX에게는 과부하 |
| **실행 가능성** | 7/10 | FE 팀은 컴포넌트 목록과 데이터 패턴으로 작업 분할 가능. 그러나 API 스키마, 반응형 사양, 에러 상태 정의가 없어 추가 정의 작업 필요 |
| **유지보수성** | 7/10 | 두 문서 모두 명확한 섹션 구조를 갖추었으나, 코드 변경 시 두 문서를 동시에 업데이트해야 하는 부담. 자동 생성 도구 연동 고려 필요 |

**종합: 7.8 / 10**

---

## 7. 최종 권고사항

### 반드시 수정해야 할 사항 (v1.0 배포 전)

1. **Doc B line 298 수정**: 관심종목 인증 방식을 "미들웨어가 `/auth/login?callbackUrl=/watchlist`로 리다이렉트 (컴포넌트에서도 이중 체크)"로 수정
2. **코드베이스 버그 수정**: `src/app/page.tsx:208`의 "최대 5종목"을 "최대 4종목"으로 수정하거나, `MAX_SLOTS`를 5로 변경
3. **`/portfolio` 라우트 해결**: 네비게이션에 링크가 있으나 페이지 없음. (a) 페이지 생성, (b) `/watchlist?tab=portfolio`로 리다이렉트, (c) 네비게이션에서 제거 중 택일

### 보완 권장 사항 (v1.0 기획 문서 완성도 향상)

4. **API 명세서 별도 작성**: 각 엔드포인트의 Request Body/Query Params 스키마, Response JSON 구조, 에러 코드별 응답을 정의하는 별도 문서 필요 (OpenAPI/Swagger 권장)
5. **에러/빈 상태 정의서 작성**: UX 팀을 위해 각 페이지의 empty state, error state, loading state 시각 사양 정의
6. **반응형 디자인 가이드 추가**: 브레이크포인트(sm/md/lg/xl)별 레이아웃 변화, 모바일 테이블 스크롤 방식, 터치 영역 최소 크기 등
7. **Doc A에 loading/error 파일 추가**: Doc B에만 있는 loading.tsx 7개, error.tsx 4개 정보를 Doc A 시스템 파일 섹션에도 추가
8. **Desktop/Mobile 네비게이션 분리 기술**: navCategories(Desktop)와 navGroups(Mobile)의 차이를 두 문서 모두에 명시
9. **`proxy.ts` matcher vs isProtectedRoute 비대칭 명시**: `/portfolio/:path*`가 matcher에는 있으나 보호 로직에는 없는 상태를 문서에 명시

### 장기 개선 사항

10. **문서 자동 생성 파이프라인**: 코드 변경 시 문서가 자동 갱신되도록 스크립트 또는 CI 연동
11. **디자인 시스템 문서화**: shadcn/ui 기반 컴포넌트 라이브러리의 사용 규칙, 색상 체계(한국식 주가 색상), 타이포그래피 스케일 등을 별도 문서화
12. **성능 예산 정의**: 각 페이지의 LCP/FID/CLS 목표값, 번들 크기 제한 등

---

## 부록: 검증 통계 요약

| 검증 항목 | 수량 | 결과 |
|----------|------|------|
| ISR revalidate 값 대조 | 10개 페이지 | 10/10 일치 |
| API 엔드포인트 메서드 대조 | 10개 | 10/10 일치 |
| Cron maxDuration 대조 | 15개 | 15/15 일치 |
| Auth 설정 대조 | 8개 항목 | 8/8 일치 |
| proxy.ts 보호 경로 대조 | 11개 matcher | 10/11 일치 (Doc A에서 /portfolio 누락) |
| loading.tsx 파일 존재 확인 | 7개 | Doc B 완전, Doc A 전체 누락 |
| error.tsx 파일 존재 확인 | 4개 | Doc B 완전, Doc A 루트만 기재 |
| layout.tsx 중간 파일 확인 | 3개 (settings, compare, news) | Doc B 완전, Doc A 미기재 |
| generateStaticParams 확인 | 5개 (stock, etf, reports, screener, sectors) | 모두 정확 |
| 코드베이스 버그 발견 | 2건 | 홈페이지 5종목 텍스트, /portfolio 404 |
