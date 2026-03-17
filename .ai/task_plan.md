# Task Plan: Phase 6~7 — 뉴스 강화 & 기술지표 확장

## Goal
1. 뉴스 수집을 강화하여 종목 상세 "기사" 탭에서 풍부한 콘텐츠 제공
2. 기술지표를 확장하여 차트 하단에 실용적인 분석 도구 추가

## Current Phase
Phase 6 대기 (계획 수립 완료)

---

## Phases

### Phase 6: 뉴스 수집 강화
목표: 종목별 뉴스 정확도 향상 + 기사 요약 콘텐츠 확보

#### 6-1. 종목별 뉴스 수집 추가
- [ ] Naver 종목뉴스 스크래퍼 (`finance.naver.com/item/news_news.naver?code={ticker}`)
  - 종목 코드로 직접 검색 → 정확한 매칭
  - 기사 제목 + 요약 + 날짜 + 언론사 추출
- [ ] Google News RSS 종목별 검색 (US: `{TICKER}+stock`, KR: `{종목명}+주식`)
  - 현재 시장 전체 RSS → 종목별 RSS로 전환
- [ ] 수집 주기 최적화 (종목별 뉴스: 4시간, 시장 전체: 2시간 유지)

#### 6-2. 기사 요약/본문 추출
- [ ] `@mozilla/readability` + `jsdom` 도입
- [ ] 뉴스 수집 시 URL에서 본문 추출 → 첫 200자 summary 저장
- [ ] News 테이블에 `content` 필드 추가 (마이그레이션)
- [ ] 기사 상세 모달/페이지 UI 구현 (종목 탭 내)

#### 6-3. 뉴스 매칭 정확도 개선
- [ ] StockNews 매칭 로직 개선 (제목+본문 모두 검색)
- [ ] 오매칭 필터링 (짧은 종목명 2글자 이하 → 문맥 검증)
- [ ] 뉴스 카드 UI 개선 (이미지 없을 때 fallback, 요약 표시 강화)

#### 6-4. 추가 한국 뉴스 소스
- [ ] Naver 검색 API 연동 (`openapi.naver.com/v1/search/news.json`)
  - 환경변수: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- [ ] 연합뉴스/이데일리 RSS 추가 (선택적)

**Status:** complete

---

### Phase 7: 기술지표 확장
목표: 초보자에게 유용한 추가 지표 구현 + 차트 UI 개선

#### 7-1. 높은 우선순위 지표 추가
- [ ] ROC (Rate of Change) — 가격 변화율 %, 서브패널
- [ ] MFI (Money Flow Index) — 자금 흐름, RSI와 유사한 서브패널
- [ ] A/D Line (Accumulation/Distribution) — 매집/배분, 서브패널
- [ ] Pivot Points — 일일 지지/저항선, 메인 차트 오버레이

#### 7-2. 캔들패턴 확장
- [ ] Morning Star (샛별형) — 3봉 반전 패턴
- [ ] Evening Star (석별형) — 3봉 하락 반전
- [ ] Harami (잉태형) — 2봉 반전 패턴
- [ ] Three White Soldiers (적삼병) — 3봉 상승
- [ ] Three Black Crows (흑삼병) — 3봉 하락

#### 7-3. 중간 우선순위 지표
- [ ] ADX (Average Directional Index) — 추세 강도
- [ ] Parabolic SAR — 추세 반전 포인트, 메인 차트 점 표시
- [ ] Keltner Channel — ATR 기반 변동성 채널

#### 7-4. 차트 UI 개선
- [ ] 지표 선택 UI 개선 (카테고리별 그룹핑: 추세/모멘텀/거래량/변동성)
- [ ] 지표 파라미터 커스터마이징 (RSI 기간 변경 등)
- [ ] 지표 설명 툴팁 추가 (초보자용 한글 설명)
- [ ] indicator-summary에 새 지표 반영

**Status:** complete (Keltner Channel, 파라미터 커스터마이징, 설명 툴팁은 미구현)

---

## Dependencies
| Phase | 의존성 |
|-------|--------|
| Phase 6 | 독립적, 바로 시작 가능 |
| Phase 7 | 독립적, Phase 6과 병행 가능 |

## Key Decisions (To Make)
| 질문 | 옵션 | 결정 |
|------|------|------|
| Naver API 키 발급? | 필요 시 사용자 발급 | 미발급, 스크래핑으로 대체 |
| 기사 본문 저장 범위? | 200자 vs 300자 vs 전체 | 300자 |
| Phase 6, 7 순서? | 순차 vs 병행 | 병행 실행 (Sonnet subagent x2) |
| 지표 우선순위 조정? | 사용자 확인 | TBD |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       |         |            |

## Notes
- 기존 Phase 1~5 기록은 `.ai/progress.md`에 보존
- 상세 리서치 결과는 `docs/research-news-and-indicators.md`에 저장됨
- 저작권 주의: 기사 본문 전체 저장 금지, 요약만 저장 + 원문 링크 제공
