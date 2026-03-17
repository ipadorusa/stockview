# Phase 6 — 뉴스 수집 강화 (구현 완료)

**날짜:** 2026-03-18
**커밋 기준:** Phase 6 구현

---

## 구현 내용

### 6-1. 종목별 뉴스 수집 추가
- `fetchNaverStockNews(ticker)` — `finance.naver.com/item/news_news.naver?code={ticker}` EUC-KR 스크래핑
- `fetchGoogleStockNews(ticker, stockName, isKR)` — Google News RSS 종목별 쿼리 (KR: `{종목명} 주식`, US: `{TICKER} stock`)
- `fetchTopStocksNews(stocks)` — 상위 50개 종목 병렬 수집 (KR: Naver+Google, US: Google만)
- KR 종목 Naver 요청 사이 200ms 간격

### 6-2. 기사 요약/본문 추출
- `extractArticleContent(url)` — `@mozilla/readability` + `jsdom`으로 본문 추출, 첫 300자만 저장
- 5초 타임아웃, 실패 시 null 반환 (에러 전파 없음)
- News 테이블 `content` 필드 추가 (마이그레이션: `20260318000000_add_news_content_field`)
- cron에서 각 기사 URL로 content 추출 후 DB 저장
- Stock news API 응답에 `content` 필드 포함

### 6-3. 뉴스 매칭 정확도 개선
- `matchStockNews()` — `summary`/`content` 파라미터 추가, 제목+요약+본문 모두 검색
- 2자 이하 한국 종목명: `FALSE_POSITIVE_NAMES` 허용 목록에만 포함 시 문맥 키워드(`CONTEXT_KEYWORDS_KR`) 필요
- 3자 이상 한국 종목명: 정규화된 전체 텍스트에서 매칭

### 6-4. 뉴스 카드 UI 개선
- `ImageFallback` 컴포넌트 — 이미지 없을 때 `Newspaper` 아이콘 플레이스홀더
- compact/featured variant에 이미지 fallback 적용
- minimal variant에 content/summary excerpt 표시 (`line-clamp-2`)
- minimal variant에 hover 시 ExternalLink 아이콘 표시
- 뉴스 탭 빈 상태 개선 (아이콘 + 2줄 안내 문구)
- 뉴스 limit 5 → 10으로 증가

---

## 파일 생성/수정

| 파일 | 변경 |
|------|------|
| `src/lib/data-sources/news-stock-specific.ts` | 신규 — 종목별 뉴스 수집 |
| `src/lib/utils/article-extractor.ts` | 신규 — 기사 본문 추출 |
| `prisma/migrations/20260318000000_add_news_content_field/migration.sql` | 신규 — News.content 컬럼 추가 |
| `prisma/schema.prisma` | 수정 — News.content 필드 추가 |
| `package.json` | 수정 — `@mozilla/readability`, `jsdom` 의존성 추가 |
| `src/lib/data-sources/news-rss.ts` | 수정 — `matchStockNews` 시그니처/로직 개선 |
| `src/app/api/cron/collect-news/route.ts` | 수정 — 종목별 뉴스 수집 + content 추출 통합 |
| `src/app/api/stocks/[ticker]/news/route.ts` | 수정 — content 필드 반환 |
| `src/types/news.ts` | 수정 — `NewsItem.content` 추가 |
| `src/components/news/news-card.tsx` | 수정 — fallback 이미지, content 표시 |
| `src/app/stock/[ticker]/stock-detail-client.tsx` | 수정 — 빈 상태 개선, limit 증가 |

---

## 결정 사항
- 기사 본문: 300자 저장 (저작권 최소화, task plan의 "200자 vs 300자"에서 300자 선택)
- content 추출 실패 시 무시 (뉴스 수집 실패로 이어지지 않도록)
- Google News RSS가 가장 접근성 좋아 US 종목은 Google만 사용
- Naver 검색 API (NAVER_CLIENT_ID) 미구현 — 환경변수 발급 필요, 스크래핑으로 대체

## 주의사항
- `npm install` 실행 필요 (`@mozilla/readability`, `jsdom` 설치)
- Prisma migrate 실행 필요 (`npx prisma migrate dev`)
- article-extractor는 서버사이드 전용 (동적 import 사용)
