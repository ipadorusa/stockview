# StockView SEO 개선 계획

> **날짜**: 2026-04-01
> **방법론**: Planner → Executor → Evaluator
> **범위**: 기술 SEO + 온페이지 SEO + 구조화 데이터

---

## 감사 결과 요약

### 잘 되어 있는 것 (유지)
- JSON-LD 구조화 데이터: Organization, WebSite, FinancialProduct, BreadcrumbList, WebPage, FAQPage, Article
- generateMetadata + canonical URL: stock/etf/market/news/reports/board/screener/sectors 페이지
- 동적 OG Image: stock/etf 상세 페이지 (`opengraph-image.tsx`)
- Breadcrumb 컴포넌트 + JSON-LD 자동 생성
- robots.ts 적절한 disallow 규칙
- sitemap-index.xml + 하위 사이트맵 4개
- Google/Naver 사이트 인증
- GTM + Vercel Analytics + Speed Insights
- Cookie Consent + GDPR consent 기본값

---

## 발견된 이슈 (우선순위별)

### P1 — Critical (색인/크롤링 직접 영향)

#### 1.1 compare 페이지 SEO 전무
- **파일**: `src/app/compare/page.tsx`
- **문제**: `"use client"` 전체 페이지 → metadata export 불가, 구조화 데이터 없음, canonical 없음
- **영향**: 구글 크롤러가 빈 페이지로 인식, 색인 불가
- **수정**: layout.tsx 또는 별도 server wrapper로 metadata 분리

#### 1.2 홈페이지 canonical URL 누락
- **파일**: `src/app/page.tsx`
- **문제**: metadata에 `alternates: { canonical: "/" }` 없음
- **영향**: layout.tsx의 `alternates: { canonical: "./" }`에 의존하나, 홈페이지는 명시적 설정 권장
- **수정**: `alternates: { canonical: "/" }` 추가

#### 1.3 about 페이지 canonical/OG 누락
- **파일**: `src/app/about/page.tsx`
- **문제**: metadata에 canonical, openGraph 없음
- **수정**: `alternates: { canonical: "/about" }`, openGraph 추가

### P2 — High (검색 품질 영향)

#### 2.1 reports 상세 페이지 Article 스키마 검증 필요
- **파일**: `src/app/reports/[slug]/page.tsx`
- **문제**: buildArticle 사용 여부 확인 필요 (감사 시 확인됨), datePublished/dateModified 정확성
- **수정**: Article 스키마의 image 필드 추가 권장

#### 2.2 next/image 미사용
- **문제**: `<img>` 태그 직접 사용 가능성 높음 → LCP 최적화, WebP 변환, lazy loading 누락
- **영향**: Core Web Vitals (LCP) 저하
- **수정**: 주요 이미지를 `next/image`로 전환

#### 2.3 홈페이지 Breadcrumb 누락
- **파일**: `src/app/page.tsx`
- **문제**: 홈페이지에 Breadcrumb 없음 (UX상 불필요하지만 JSON-LD BreadcrumbList는 권장)
- **수정**: 시각적으로는 숨기되 JSON-LD만 출력하거나, 생략 유지 (선택)

### P3 — Medium (개선 사항)

#### 3.1 hreflang 미설정
- **문제**: 한국어 전용 사이트이나 US 주식도 다루므로, 향후 다국어 확장 시 필요
- **수정**: 현재는 불필요, 영문 버전 추가 시 설정

#### 3.2 FAQ 스키마 확장
- **문제**: guide 페이지에만 FAQPage 스키마 적용. screener/dividends/earnings에도 FAQ 추가 가능
- **영향**: 검색 결과에 FAQ 리치 스니펫 표시 기회
- **수정**: 각 페이지에 자주 묻는 질문 섹션 + FAQPage 스키마 추가

#### 3.3 WebSite SearchAction URL 패턴
- **파일**: `src/lib/seo.ts`
- **문제**: `urlTemplate: ${BASE_URL}/stock/{search_term_string}` → 실제 검색은 stock 페이지가 아닌 별도 검색 경로가 있을 수 있음
- **수정**: 실제 검색 URL 패턴과 일치시키기

#### 3.4 sitemap lastmod 정확도
- **문제**: sitemap.ts의 정적 페이지들이 `new Date()` (현재 시각)을 lastmod로 사용 → 실제 변경 없어도 매번 변경으로 표시
- **영향**: 구글 크롤러가 lastmod를 신뢰하지 않게 됨
- **수정**: 정적 페이지는 실제 마지막 수정일 고정, 동적 페이지만 DB 기준

---

## 실행 계획

### Step 1: compare 페이지 SEO 추가 (P1)
**파일**: `src/app/compare/page.tsx` → `src/app/compare/layout.tsx` (신규)
**작업**:
- [ ] `src/app/compare/layout.tsx` 생성하여 metadata export
- [ ] canonical, openGraph, description 설정
- [ ] Breadcrumb + JsonLd(WebPage) 추가

### Step 2: 홈페이지 canonical 추가 (P1)
**파일**: `src/app/page.tsx`
**작업**:
- [ ] metadata에 `alternates: { canonical: "/" }` 추가

### Step 3: about 페이지 canonical/OG 추가 (P1)
**파일**: `src/app/about/page.tsx`
**작업**:
- [ ] metadata에 `alternates: { canonical: "/about" }` 추가
- [ ] openGraph 추가

### Step 4: sitemap lastmod 정확도 개선 (P3.4)
**파일**: `src/app/sitemap.ts`
**작업**:
- [ ] 정적 페이지의 lastmod를 실제 마지막 수정일로 고정
- [ ] `new Date()`는 동적 데이터가 있는 페이지에만 사용

### Step 5: 빌드 검증 + 프로덕션 확인
**작업**:
- [ ] `npm run build` 성공 확인
- [ ] 프로덕션 배포 후 주요 페이지 meta 태그 확인
- [ ] GSC에서 sitemap 재제출

---

## 범위 밖 (후속)
- next/image 전환 (별도 PR, 영향 범위 넓음)
- FAQ 스키마 확장 (콘텐츠 작성 필요)
- hreflang (다국어 미계획)
- AI 검색 최적화 (AEO/GEO — 별도 스킬)
