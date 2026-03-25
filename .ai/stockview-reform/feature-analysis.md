# StockView 기능/데이터 분석 보고서

> 분석일: 2026-03-25

---

## 1. 현재 서비스 구조 요약

### 1.1 페이지 구조 (38개 페이지)
| 영역 | 페이지 | 비고 |
|------|--------|------|
| 홈 | `/` | 지수, 환율, 인기종목, 최신뉴스 |
| 종목상세 | `/stock/[ticker]` | 차트/정보/뉴스/공시/배당/실적 6탭 |
| ETF | `/etf`, `/etf/[ticker]` | ETF 목록 및 상세 |
| 마켓 | `/market` | 시장 개요 |
| 섹터 | `/sectors`, `/sectors/[name]` | 업종별 종목 |
| 뉴스 | `/news` | 카테고리별 뉴스 |
| 스크리너 | `/screener`, `/screener/[signal]` | 기술적 시그널 5종 |
| 비교 | `/compare` | 종목 비교 |
| 배당 | `/dividends` | 배당 캘린더 |
| 실적 | `/earnings` | 실적 캘린더 |
| AI 리포트 | `/reports`, `/reports/[slug]`, `/reports/stock/[ticker]` | AI 종목 분석 |
| 관심종목 | `/watchlist` | 로그인 필요 |
| 게시판 | `/board`, `/board/[id]`, `/board/new`, `/board/[id]/edit` | 커뮤니티 |
| 가이드 | `/guide/*` (5개) | 투자 교육 콘텐츠 |
| 설정 | `/settings`, `/mypage` | 프로필/비밀번호 |
| 관리자 | `/admin/data-health`, `/admin/contacts` | 데이터 모니터링 |
| 기타 | `/about`, `/contact`, `/privacy`, `/terms` | 정보 페이지 |

### 1.2 API 구조 (42개 엔드포인트)
| 카테고리 | 엔드포인트 | 메서드 |
|----------|-----------|--------|
| **종목** | `/api/stocks/[ticker]` | GET — 종목 상세 (시세+펀더멘탈) |
| | `/api/stocks/[ticker]/chart` | GET — OHLCV 차트 데이터 |
| | `/api/stocks/[ticker]/news` | GET — 종목별 뉴스 |
| | `/api/stocks/[ticker]/peers` | GET — 동종업종 종목 |
| | `/api/stocks/[ticker]/earnings` | GET — 실적 이력 |
| | `/api/stocks/[ticker]/dividends` | GET — 배당 이력 |
| | `/api/stocks/[ticker]/disclosures` | GET — 공시 목록 |
| | `/api/stocks/search` | GET — 종목 검색 |
| | `/api/stocks/popular` | GET — 인기 종목 |
| **마켓** | `/api/market/indices` | GET — 주요 지수 |
| | `/api/market/kr/movers` | GET — KR 등락 상위 |
| | `/api/market/us/movers` | GET — US 등락 상위 |
| | `/api/market/sectors` | GET — 섹터 목록 |
| | `/api/market/sectors/[name]/stocks` | GET — 섹터별 종목 |
| | `/api/market/exchange-rate` | GET — 환율 |
| **ETF** | `/api/etf/popular` | GET — 인기 ETF |
| **뉴스** | `/api/news` | GET — 뉴스 목록 |
| | `/api/news/latest` | GET — 최신 뉴스 |
| **스크리너** | `/api/screener` | GET — 시그널 스크리닝 |
| **리포트** | `/api/reports` | GET — AI 리포트 목록 |
| | `/api/reports/[slug]` | GET — AI 리포트 상세 |
| **관심종목** | `/api/watchlist` | GET/POST — 목록조회/추가 |
| | `/api/watchlist/[ticker]` | DELETE — 제거 |
| **게시판** | `/api/board` | GET/POST |
| | `/api/board/[id]` | GET/PUT/DELETE |
| | `/api/board/[id]/comments` | GET/POST |
| | `/api/board/comments/[commentId]` | PUT/DELETE |
| **설정** | `/api/settings/profile` | PUT |
| | `/api/settings/password` | PUT |
| **인증** | `/api/auth/[...nextauth]` | NextAuth |
| | `/api/auth/register` | POST |
| **관리** | `/api/admin/data-health` | GET |
| | `/api/admin/contacts` | GET |
| | `/api/contact` | POST |
| **크론 (13개)** | 아래 별도 정리 | POST (Bearer auth) |

### 1.3 DB 스키마 (18개 모델)
| 모델 | 레코드 특성 | 갱신 주기 |
|------|------------|----------|
| Stock | ~4,800 (KR ~4,300 + US ~500) | 주 1회 마스터 동기화 |
| StockQuote | 1:1 (종목당 최신 시세 1건) | 평일 1회 (장마감 후) |
| DailyPrice | 종목×일수 | 평일 1회 |
| StockFundamental | 1:1 | 주 1회 |
| TechnicalIndicator | 종목×일수 | 평일 1회 (quotes 후 계산) |
| News / StockNews | N:M 관계 | 2시간 간격 |
| Dividend | 종목×배당일 | 별도 크론 |
| EarningsEvent | 종목×분기 | 별도 크론 |
| Disclosure | 종목×공시 | 별도 크론 |
| MarketIndex | 4건 (KOSPI, KOSDAQ, SPX, IXIC) | KR 시세와 동시 |
| ExchangeRate | 1건 (USD/KRW) | 별도 크론 |
| AiReport | 종목×날짜 | 외부 트리거 |
| CronLog | 작업 이력 | 자동 |
| User / Account / Session | 사용자 | 사용자 액션 |
| Watchlist | 사용자×종목 | 사용자 액션 |
| BoardPost / BoardComment | 게시판 | 사용자 액션 |
| ContactMessage | 문의 | 사용자 액션 |

### 1.4 크론잡 스케줄
| 크론잡 | 스케줄 | 파이프라인 |
|--------|--------|-----------|
| `collect-master` | 토요일 22:00 KST | 단독 |
| `collect-kr-quotes` + `compute-indicators` | 평일 16:00 KST | KR 파이프라인 (순차) |
| `collect-kr-etf-quotes` | 별도 | 단독 |
| `collect-us-quotes` + `compute-indicators` | 평일 21:15 UTC (16:15 ET) | US 파이프라인 (순차) |
| `collect-news` | 2시간 간격 24/7 | 단독 |
| `collect-fundamentals` | 토요일 23:00 KST | 단독 |
| `collect-exchange-rate` | 별도 | 단독 |
| `collect-events` | 별도 | 단독 (earnings) |
| `collect-disclosures` | 별도 | 단독 (DART 공시) |
| `collect-dart-dividends` | 별도 | 단독 (OpenDART 배당) |
| `sync-corp-codes` | 별도 | 단독 (DART 기업코드) |
| `sync-kr-sectors` | 별도 | 단독 |
| `cleanup` | 별도 | 21일 초과 데이터 삭제, 90일 비활성화 |

### 1.5 외부 데이터 소스
| 소스 | 대상 | 방식 | 비고 |
|------|------|------|------|
| Naver Finance | KR 종목 시세, 마스터, 펀더멘탈, 52주 고저, 배당 | HTML 스크래핑 (EUC-KR) + fchart API | Rate limit: 200ms/req |
| Yahoo Finance v8 | US 종목 시세, 차트, 펀더멘탈, 실적, 배당 | REST API (no crumb) | 5 concurrent |
| Google News RSS | 뉴스 | RSS 파싱 | 키워드 기반 카테고리 분류 |
| Yahoo Finance RSS | 뉴스 | RSS 파싱 | |
| OpenDART | KR 배당, 공시, 기업코드 | REST API | OPENDART_API_KEY 필요 |
| KRX | 마지막 거래일 계산 | 레거시 | |
| S&P 500 CSV | US 종목 마스터 | 정적 파일 | |

---

## 2. 강점 분석

### 2.1 데이터 아키텍처
- **이중 시장 지원**: KR/US 시장을 단일 스키마로 통합 관리 (Market enum)
- **파이프라인 설계**: quotes → indicators 순차 의존성을 GitHub Actions에서 `needs`로 관리
- **Upsert 패턴**: `[stockId, date]` 복합 유니크로 멱등적 데이터 수집
- **에러 격리**: `Promise.allSettled()` + 배치 처리로 단일 실패가 전체에 영향 미치지 않음
- **CronLog 모델**: 크론 실행 이력 추적 가능

### 2.2 기능 완성도
- 종목상세 6탭 구조 (차트/정보/뉴스/공시/배당/실적)로 종합 정보 제공
- 기술적 스크리너 5종 시그널 (골든크로스, RSI, 거래량, 볼린저, MACD)
- AI 리포트 기능으로 차별화
- 투자 가이드 5종 (ETF, 재무제표, 지수, 배당, 기술지표)으로 초보자 교육

### 2.3 SEO/성능
- ISR 15분 revalidate + s-maxage 캐싱 전략
- `generateStaticParams`로 상위 200개 종목 사전 렌더링
- JSON-LD 구조화 데이터 + OpenGraph 메타데이터
- GTM 페이지뷰 추적

---

## 3. 개선 필요 영역

### 3.1 데이터 갱신 주기 (Critical)
| 문제 | 현상 | 영향 |
|------|------|------|
| **시세 갱신 1일 1회** | 장중 실시간 데이터 없음 | 사용자가 장중에 방문하면 전일 종가만 보임 |
| **뉴스 2시간 간격** | 속보성 뉴스 지연 | 경쟁 서비스 대비 느림 |
| **펀더멘탈 주 1회** | 실적 발표 후 반영 지연 | 분기 실적 시즌에 부정확한 데이터 |
| **US 종목 500개 한정** | S&P 500 CSV 기반 | NASDAQ, Russell 등 미포함 |

### 3.2 누락 기능 (경쟁 서비스 대비)
| 기능 | 네이버 증권 | 키움 | StockView |
|------|-----------|------|-----------|
| 실시간 호가 | O | O | X |
| 프리/포스트마켓 시세 | - | O | 필드만 존재 (수집 미구현) |
| 포트폴리오 관리 (매수가/수량) | - | O | X (관심종목만) |
| 알림 (가격/뉴스) | O | O | X |
| 종목 토론방 | O | - | X (게시판만) |
| 외국인/기관 수급 | O | O | X |
| 신용/대차잔고 | O | O | X |
| 테마별 종목 | O | - | X |
| 차트 드로잉 도구 | - | O | X |
| 재무제표 분기별 추이 | O | O | X (최신 스냅샷만) |

### 3.3 데이터 모델 한계
1. **StockFundamental 1:1**: 분기별 이력이 없어 추이 분석 불가. 현재 최신 값만 덮어쓰기
2. **StockQuote 1:1**: 장중 시세 이력(분봉/틱) 저장 불가
3. **MarketIndex 히스토리 없음**: 지수 차트 제공 불가
4. **News sentiment 미활용**: `sentiment` 필드 존재하나 실제 값 채워지지 않음
5. **Watchlist 단순 구조**: 매수가, 수량, 메모 등 포트폴리오 기능 부재
6. **섹터 데이터**: Stock.sector가 문자열 — 정규화된 섹터 모델 없음

### 3.4 데이터 품질 이슈
1. **KR 52주 고저**: StockQuote에 null일 때 개별 요청으로 Naver 스크래핑 — 응답 지연 발생
2. **PBR 이중 저장**: StockFundamental과 StockQuote 양쪽에 PBR 존재 — 불일치 가능
3. **cleanup 21일**: DailyPrice 21일 초과 삭제 — 장기 차트(1년, 5년) 데이터 부족
4. **Fundamentals 배치 100개**: ~4,800개 종목 중 100개만 갱신 — 전체 갱신에 48주 소요
5. **뉴스-종목 매칭**: 제목 기반 키워드 매칭만 — 오매칭 가능성

### 3.5 기술적 이슈
1. **Compare 페이지 API 경로 오류**: `/api/stock/${ticker}` 호출하지만 실제 라우트는 `/api/stocks/${ticker}`
2. **스크리너 raw SQL**: Prisma `$queryRaw` 사용 — 타입 안전성 저하, 유지보수 부담
3. **KR ETF 크론 분리**: KR 주식과 ETF 시세 수집이 별도 — 파이프라인 복잡도 증가
4. **pre/postMarketPrice**: 필드만 존재, 실제 수집 로직 미확인

---

## 4. 개편 제안 (우선순위별)

### Priority 1: 데이터 품질 및 신뢰도 (즉시)
| 항목 | 상세 | 난이도 |
|------|------|--------|
| Fundamentals 갱신 속도 개선 | 배치 크기 100→500, 주1회→주2~3회 | Low |
| DailyPrice 보존 기간 확장 | 21일→365일 (또는 무제한, 별도 아카이브) | Low |
| PBR 저장 위치 일원화 | StockFundamental로 통합, StockQuote에서 제거 | Medium |
| 52주 고저 일괄 수집 | 크론에서 사전 수집하여 StockQuote에 저장 | Medium |
| News sentiment 채우기 | LLM 기반 감성 분석 파이프라인 추가 | Medium |
| Compare 페이지 API 경로 수정 | `/api/stock/` → `/api/stocks/` | Low |

### Priority 2: 핵심 기능 확장 (1~2개월)
| 항목 | 상세 | 난이도 |
|------|------|--------|
| 포트폴리오 기능 | Watchlist 확장: 매수가, 수량, 메모, 수익률 계산 | Medium |
| StockFundamental 이력화 | FundamentalHistory 모델 추가, 분기별 추이 차트 | Medium |
| 장중 시세 갱신 | KR 장중 5분 간격 폴링 (09:00~15:30 KST) | High |
| 알림 시스템 | 가격 알림 (목표가 도달), 뉴스 알림 | High |
| US 종목 확대 | S&P 500 → NASDAQ 100 + Russell 2000 주요 종목 | Medium |

### Priority 3: 차별화 기능 (3개월+)
| 항목 | 상세 | 난이도 |
|------|------|--------|
| 외국인/기관 수급 데이터 | KRX 일별 매매동향 수집 | High |
| 테마/ETF 연관 종목 | 테마 모델 + 종목 매핑 | Medium |
| MarketIndex 이력 | 지수 차트 기능 | Low |
| Sector 모델 정규화 | Sector 테이블 + 업종 지수 | Medium |
| 종목 토론방 | 종목별 게시판 (현재는 범용 게시판) | Medium |
| AI 리포트 자동화 | 크론 기반 자동 생성 파이프라인 | High |

---

## 5. 크론잡 최적화 제안

### 현재 문제
- 13개 크론이 개별 GitHub Actions → 관리 포인트 과다
- Vercel 60초 타임아웃 제약으로 대량 배치 처리 어려움
- `compute-indicators`가 KR/US 파이프라인 양쪽에서 중복 실행

### 개선안
1. **크론 통합**: 유사 주기 크론 병합 (e.g., exchange-rate + indices를 KR quotes 파이프라인에 포함)
2. **장중 폴링 도입 시**: GitHub Actions 대신 별도 워커 (Vercel Cron / 외부 서비스) 검토
3. **indicators 중복 방지**: market 파라미터 추가하여 KR/US 분리 실행

---

## 6. 데이터 소스 리스크

| 소스 | 리스크 | 대안 |
|------|--------|------|
| Naver Finance 스크래핑 | HTML 구조 변경 시 즉시 장애 | KRX API, 한국투자증권 OpenAPI |
| Yahoo Finance v8 | 비공식 API, 차단 가능성 | Alpha Vantage, Polygon.io, Financial Modeling Prep |
| Google News RSS | 품질 불안정, 중복 많음 | NewsAPI, 직접 언론사 RSS |
| OpenDART | API 호출 제한 (일 10,000건) | 충분하지만 모니터링 필요 |

---

## 7. 요약

StockView는 KR/US 이중시장 지원, 기술적 스크리너, AI 리포트 등 차별화 포인트를 갖춘 서비스이나, **데이터 갱신 주기(1일 1회)**, **Fundamental 이력 부재**, **포트폴리오 기능 미비**가 핵심 약점이다. DailyPrice 21일 삭제 정책은 장기 차트를 제공할 수 없게 만들고, 4,800개 종목에 100개씩 펀더멘탈 갱신은 현실적이지 않다.

개편 우선순위는: (1) 데이터 품질/신뢰도 즉시 개선 → (2) 포트폴리오 + 장중 시세 → (3) 수급/테마 등 차별화.
