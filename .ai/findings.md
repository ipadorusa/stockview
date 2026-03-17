# Findings & Research — Phase 6+: 뉴스 강화 & 기술지표 확장

## 1. 뉴스 수집 현황 분석

### 현재 소스 & 스케줄
| 소스 | 대상 | 수집 방식 | 스케줄 |
|------|------|-----------|--------|
| Google News RSS | KR/US | RSS 파싱 (4개 쿼리) | 2시간마다 |
| Yahoo Finance RSS | US | RSS 파싱 | 2시간마다 |
| Naver Finance | KR | HTML 스크래핑 | 2시간마다 |
| 한국경제/매일경제 RSS | KR | RSS 파싱 | 2시간마다 |

### 현재 DB 저장 필드
`title`, `summary`(optional), `source`, `url`(unique), `imageUrl`, `category`, `sentiment`, `publishedAt`

### 현재 문제점
1. **기사 본문 없음** — RSS description만 저장, 종목 상세 "기사" 탭에서 제목+요약만 보임
2. **종목별 뉴스 매칭 부정확** — 제목에서 종목명/티커 매칭 (greedy), 관련 없는 뉴스도 매칭됨
3. **수집량 부족** — 2시간 주기로 RSS만 수집, 종목별 전용 뉴스 없음
4. **이미지 없는 뉴스 많음** — RSS에 이미지 없는 경우 빈 카드

---

## 2. 뉴스 수집 개선 방안 리서치

### 한국 뉴스 추가 소스
| 소스 | 방식 | 장점 | 제한 |
|------|------|------|------|
| **Naver 검색 API** (`openapi.naver.com/v1/search/news.json`) | REST API | 종목명 검색 가능, 요약 제공, 25,000건/일 | API 키 필요 |
| **Naver 종목뉴스** (`finance.naver.com/item/news_news.naver?code={ticker}`) | HTML 스크래핑 | 종목별 정확한 뉴스, 제목+요약+날짜 | 스크래핑 부하, rate limit |
| **연합뉴스 RSS** | RSS | 속보성, 무료 | 경제 전용 피드 제한적 |
| **이데일리/서울경제 RSS** | RSS | 증권 특화 | 피드 안정성 확인 필요 |

### 미국 뉴스 추가 소스
| 소스 | 방식 | 장점 | 제한 |
|------|------|------|------|
| **Google News RSS + 티커 필터** (`/rss/search?q={TICKER}+stock`) | RSS | 종목별 검색, 무료 | rate limit 주의 |
| **Alpha Vantage News** | REST API | 감성분석 포함, 티커별 | 25건/일 (무료) |
| **Finviz** | HTML 스크래핑 | 종목별 뉴스 집약, 무료 | 스크래핑, ToS |

### 기사 본문 추출
- `@mozilla/readability` + `jsdom` — URL에서 본문 추출 가능
- 저작권 고려: 첫 200~300자만 summary로 저장
- 전체 본문은 저장하지 않고 원문 링크 제공

---

## 3. 기술지표 현황 분석

### 현재 구현된 지표 (12개)
| 카테고리 | 지표 | 파일 위치 |
|----------|------|-----------|
| 추세 | SMA (5/20/60), EMA (12/26) | `technical-indicators.ts:10-88` |
| 추세 | MACD (12,26,9) | `technical-indicators.ts:94-135` |
| 모멘텀 | RSI (14) | `technical-indicators.ts:23-55` |
| 모멘텀 | Stochastic (14,3) | `technical-indicators.ts:170-203` |
| 변동성 | Bollinger Bands (20,2) | `technical-indicators.ts:141-164` |
| 변동성 | ATR (14) | `technical-indicators.ts:223-254` |
| 거래량 | OBV | `technical-indicators.ts:209-217` |
| 지지/저항 | Fibonacci Retracement | `technical-indicators.ts:260-283` |
| 패턴 | 캔들패턴 5개 (Doji, Hammer, Hanging Man, Engulfing, Shooting Star) | `technical-indicators.ts:296-373` |

### 차트 표시
- `stock-chart.tsx` (624줄): 메인 캔들+볼륨, MA/EMA 오버레이, BB, 피보나치, 서브패널 (MACD/RSI/Stoch/OBV/ATR)
- `indicator-summary.tsx`: MA5/20/60 비교, RSI 상태, 거래량 비율, 골든/데드 크로스

---

## 4. 추가 기술지표 리서치

### 높은 우선순위 (초보자 친화적, 구현 쉬움)
| 지표 | 측정 대상 | 필요 데이터 | 초보자 유용성 |
|------|-----------|-------------|---------------|
| **ROC (Rate of Change)** | 가격 변화율 (%) | 최소 10일 | 추세 강도 직관적 이해 |
| **MFI (Money Flow Index)** | 자금 유입/유출 (거래량+가격) | 14일 | RSI와 유사하나 거래량 반영 |
| **A/D Line (Accumulation/Distribution)** | 매집/배분 압력 | 일봉 데이터 | 거래량 기반 추세 확인 |
| **Pivot Points** | 일일 지지/저항선 | 전일 OHLC | 매매 타점 시각적으로 표시 |
| **추가 캔들패턴** | Morning Star, Evening Star, Harami, Three Soldiers/Crows | 3일 | 반전 신호 직관적 |

### 중간 우선순위
| 지표 | 측정 대상 | 필요 데이터 |
|------|-----------|-------------|
| **ADX (Average Directional Index)** | 추세 강도 (방향 무관) | 14일+ |
| **Keltner Channel** | 변동성 채널 (ATR 기반) | 20일 |
| **Parabolic SAR** | 추세 반전 포인트 | 일봉 데이터 |

### 낮은 우선순위 (기존 지표와 중복)
- WMA — SMA/EMA로 충분
- Williams %R — Stochastic과 거의 동일
- CCI — RSI와 유사

---

## 5. 주요 참고 파일 경로
| 파일 | 역할 |
|------|------|
| `src/lib/data-sources/news-rss.ts` | RSS 뉴스 수집 |
| `src/lib/data-sources/news-kr-direct.ts` | 한경/매경 RSS |
| `src/lib/data-sources/naver.ts` | Naver 스크래핑 |
| `src/lib/utils/news-sentiment.ts` | 감성분석 |
| `src/app/api/cron/collect-news/route.ts` | 뉴스 수집 cron |
| `src/lib/utils/technical-indicators.ts` | 기술지표 계산 |
| `src/components/stock/stock-chart.tsx` | 차트 컴포넌트 |
| `src/components/stock/indicator-summary.tsx` | 지표 요약 |
| `src/app/api/cron/compute-indicators/route.ts` | 지표 배치 계산 |

---
*Updated: 2026-03-18*
