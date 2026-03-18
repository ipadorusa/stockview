# StockView 시장개요 개선 + 신규 기능 계획

## Context
시장개요 페이지 버그 수정 및 기능 기획. 총 5개 항목.

---

## Phase 1: 상승/하락 종목 TOP5 버그 수정 (changePercent 부호 버그)
- **Status**: ⬜ Not started
- **File**: `src/lib/data-sources/naver.ts` (line 106)
- **Bug**: `parseKrNum()`이 `-` 부호를 보존하는데, 이후 `startsWith("-")` 체크로 다시 `-1`을 곱함 → 이중 부정으로 음수가 양수로 저장
- **증상**: 스튜디오산타클로스 -66.77% → DB에 +66.77%로 저장 → 상승 1위로 표시. 하락 종목은 모두 양수로 저장되어 하락 TOP5에 아무것도 안 나옴
- **Fix**: `Math.abs(parseKrNum(changePctRaw)) * (isDown ? -1 : 1)` — 네이버 HTML의 "하락" 텍스트 기반 부호 판정 사용 (change 필드와 동일 패턴)

## Phase 2: 섹터별 성과 클릭 시 상세 기획
- **Status**: ⬜ Not started
- **File**: `src/components/market/sector-performance.tsx`
- **현재**: 섹터 카드는 읽기 전용 (onClick 핸들러 없음)
- **기획안**:
  - 섹터 카드 클릭 → 해당 섹터 소속 종목 리스트 표시 (모달 또는 expandable)
  - 표시 항목: 종목명, 현재가, 등락률, 거래량
  - changePercent 기준 정렬 (상승순)
  - API: `/api/market/sectors/[name]/stocks` 엔드포인트 신규 생성
  - 또는 기존 `/api/market/sectors` 확장하여 섹터별 종목 조회 지원

## Phase 3: 종목 검색 접근성 개선
- **Status**: ⬜ Not started
- **현재 상태**: SearchBar 컴포넌트 존재 (`src/components/search/search-bar.tsx`)
  - 데스크탑: 헤더 우측 `w-64` 크기로 배치 (작아서 잘 안 보일 수 있음)
  - 모바일: 햄버거 메뉴 안에 숨겨져 있음
- **개선 방향**:
  - 검색 아이콘 + 키보드 단축키 (Cmd+K / Ctrl+K) 추가
  - 모바일에서도 검색 아이콘 노출 → 클릭 시 전체화면 검색
  - 또는 시장 개요 페이지에 직접 검색바 배치

## Phase 4: 매매기법 기반 관심 종목 리스트 페이지 (신규)
- **Status**: ⬜ Not started
- **기획 내용**:
  - 신규 페이지: `/screener` (또는 `/signals`)
  - 매매기법(기술적 분석) 기준으로 한국/미국 각 20개 종목 자동 선별
  - 기법 후보:
    1. **골든크로스** — MA5 > MA20 크로스
    2. **RSI 과매도 반등** — RSI < 30 이후 상승 전환
    3. **거래량 급증** — 최근 거래량 > 20일 평균 × 2
    4. **볼린저밴드 하단 터치** — 가격이 하단밴드 근접 후 반등
    5. **MACD 골든크로스** — MACD > Signal 크로스
    6. **하이킨아시 강한 상승 전환** — 하락 → 상승 전환 (이미 구현된 함수 활용)
  - 이미 `technical-indicators.ts`에 MA, RSI, MACD, 볼린저밴드 등 계산 함수 존재
  - DB에 3개월 일봉 데이터 저장되어 있으므로 서버사이드 스크리닝 가능
  - API: `/api/screener` → 기법별 종목 리스트 반환
  - UI: 탭(기법별) + 종목 카드 리스트

## Phase 5: 빌드 검증
- **Status**: ⬜ Not started
- `npm run build` 성공 확인
- 전체 변경사항 통합 테스트

---

## Decisions
| # | Decision | Reason |
|---|----------|--------|
| 1 | changePercent 부호는 `isDown` 변수 기반으로 통일 | 네이버 HTML 포맷이 `"+2.83%"` / `"2.83%"` 등 일관되지 않을 수 있으므로, "하락" 텍스트 기반 판정이 가장 안정적 |
| 2 | `Math.abs()` 감싸서 이중 부정 방지 | `parseKrNum`이 `-` 부호를 보존하므로 먼저 절대값으로 변환 후 부호 적용 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |
