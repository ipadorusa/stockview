# 하이킨아시(Heikin-Ashi) 기능 고도화 계획

## Context
종목 상세 페이지의 기술적 지표 영역에서 하이킨아시를 더 풍부하게 활용.
현재 기본 HA 계산/해석은 구현되어 있으나, 차트 시각화와 복합 신호 시스템이 없음.

---

## Phase 1: HA 차트 전환 토글 (StockChart)
- **Status**: ⬜ Not started
- **목표**: StockChart에 "하이킨아시" 토글 버튼 추가, 활성화 시 캔들 데이터를 HA 데이터로 전환
- **파일**: `src/components/stock/stock-chart.tsx`
- **구현**:
  1. `showHA` boolean state 추가 (기존 showBB, showSAR 패턴 따름)
  2. 차트 오버레이 토글 영역에 "HA" 버튼 추가
  3. `showHA` 활성화 시: `calculateHeikinAshi(data)` 결과로 candlestickSeries.setData() 호출
  4. 비활성화 시: 원본 OHLC 데이터로 복원
  5. HA 모드 활성 시 차트 좌상단에 "HA" 뱃지 표시
- **주의**: HA 데이터는 평균값이므로 MA/BB 등 오버레이 지표는 원본 기준으로 유지

## Phase 2: HA 패턴 인식 고도화 (interpretHeikinAshi 확장)
- **Status**: ⬜ Not started
- **목표**: 기존 5가지 신호를 12가지로 확장하여 더 세밀한 추세 분석 제공
- **파일**: `src/lib/utils/technical-indicators.ts`
- **현재 신호 (5가지)**: 강한 상승, 강한 하락, 상승 추세, 하락 추세, 추세 전환 가능
- **추가할 신호**:
  1. **추세 시작** — 색상 전환 후 1~2봉 (이전 반대색 3봉 이상 → 전환)
  2. **추세 약화** — 몸통 크기가 점점 줄어드는 3연속 봉
  3. **강한 반전 도지** — 도지 + 직전 5봉 이상 같은 방향 streak
  4. **추세 가속** — 몸통 크기가 점점 커지는 3연속 봉 + 한쪽 꼬리 없음
  5. **약한 반등/하락** — 반대 방향 전환 후 1봉만에 다시 원래 방향 (whipsaw)
  6. **수렴 구간** — 최근 5봉 중 도지 2개 이상
  7. **추세 확정** — 같은 방향 5봉 이상 + 몸통 증가 추세
- **반환 타입 확장**:
  ```typescript
  interface HeikinAshiSignal {
    label: string           // 한글 설명
    color: string           // Tailwind 색상 클래스
    streak: number          // 연속 봉 수
    type: 'strong_up' | 'strong_down' | 'up' | 'down' | 'reversal_warning'
          | 'trend_start' | 'trend_weakening' | 'strong_reversal'
          | 'acceleration' | 'whipsaw' | 'consolidation' | 'trend_confirmed'
    strength: 1 | 2 | 3    // 신호 강도 (1=약, 2=보통, 3=강)
    description: string     // 상세 해석 문장
  }
  ```
- **하위호환**: 기존 `{ label, color, streak }` 리턴 형태 유지 + 필드 추가

## Phase 3: HA + 보조지표 복합 신호 시스템
- **Status**: ⬜ Not started
- **목표**: HA 신호와 RSI, MACD, MA 크로스를 결합한 복합 매매 신호 생성
- **파일**: `src/lib/utils/technical-indicators.ts` (새 함수 추가)
- **구현**:
  1. `generateCompositeSignal()` 함수 신규 작성
     ```typescript
     interface CompositeSignal {
       action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
       confidence: number    // 0~100
       reasons: string[]     // 복합 판단 근거 배열
       indicators: {
         ha: HeikinAshiSignal
         rsi?: { value: number; condition: string }
         macd?: { histogram: number; crossover: string }
         maCross?: { type: 'golden' | 'dead' | null }
       }
     }
     ```
  2. 신호 결합 규칙 (findings.md의 복합 전략표 기반):
     - HA 양봉 전환 + RSI 과매도 탈출 → strong_buy (confidence 85+)
     - HA 양봉 + MACD 골든크로스 + 골든크로스(MA) → strong_buy (confidence 90+)
     - HA 도지 + MACD 히스토그램 축소 → hold + "추세 전환 경계" (confidence 60)
     - HA 음봉 전환 + RSI 과매수 탈출 → strong_sell (confidence 85+)
     - 단일 HA 신호만 있을 때 → 기본 confidence 50
  3. `stock-detail-client.tsx`에서 복합 신호 계산 로직 추가

## Phase 4: IndicatorSummary UI 확장
- **Status**: ⬜ Not started
- **목표**: 기존 작은 카드 → 풍부한 HA 분석 섹션으로 확장
- **파일**: `src/components/stock/indicator-summary.tsx`
- **구현**:
  1. **HA 전용 섹션** 추가 (기존 추가지표 그리드 아래)
     - 추세 방향 아이콘 + 라벨 (큰 폰트)
     - streak 막대 시각화 (최근 10봉의 방향을 색상 블록으로 표시)
     - 패턴 타입 뱃지 (Phase 2의 세분화된 타입)
  2. **복합 신호 표시** (Phase 3 결과)
     - action 뱃지 (Strong Buy ~ Strong Sell, 5단계 색상)
     - confidence 게이지 바
     - reasons 리스트 (판단 근거 2~3줄)
  3. **면책 문구**: "투자 참고용이며 투자 조언이 아닙니다" 작은 텍스트

## Phase 5: 빌드 검증 + 최종 정리
- **Status**: ⬜ Not started
- `npm run build` 성공 확인
- TypeScript 에러 없음 확인
- UI 렌더링 확인 (dev 서버)

---

## Decisions
| # | Decision | Reason |
|---|----------|--------|
| 1 | HA 차트는 "전환" 방식 (오버레이 X) | lightweight-charts에 HA 네이티브 미지원. 오버레이는 가독성 저하. 토글로 캔들 데이터 교체가 가장 깔끔 |
| 2 | interpretHeikinAshi 반환 타입은 기존 필드 유지 + 확장 | 하위호환 보장. 기존 IndicatorSummary가 { label, color, streak }을 사용 중 |
| 3 | 복합 신호는 클라이언트 계산 | 현재 모든 지표가 client-side 계산. 별도 API 추가 없이 일관성 유지 |
| 4 | 면책 문구 필수 | 기술적 지표 → 투자 조언으로 오해 방지 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|

---

## Review Log

### Review #1 (초안 검토)
**검토 관점**: 기술적 실현 가능성 + 사용자 가치

- **Phase 1 개선**: HA 모드 시 MA/BB 오버레이를 HA 데이터 기준으로 재계산할지 여부 → 원본 유지가 정확. HA는 시각화용, 지표는 실제가 기준
- **Phase 2 개선**: "whipsaw" 탐지는 노이즈에 민감 → 최소 2봉 확인 후 판정으로 변경
- **Phase 3 대안 검토**: 서버사이드 계산 vs 클라이언트 → 3개월 데이터(~63봉)는 클라이언트 계산 부담 없음. 유지
- **Phase 4 대안**: streak 시각화를 미니 차트로? → 색상 블록이 더 가볍고 직관적. 유지
- **결론**: 전체 흐름 유지, whipsaw 판정 로직만 보수적으로 조정

### Review #2 (UX 관점 검토)
**검토 관점**: 정보 과부하 방지 + 직관성

- **Phase 4 개선점 발견**: 복합 신호 5단계(strong_buy ~ strong_sell)가 초보 사용자에게 부담 → **3단계로 단순화** (매수 관심 / 관망 / 매도 관심) + 상세 펼치기 옵션
- **Phase 2 개선점**: 12가지 패턴이 UI에 모두 노출되면 혼란 → 상위 3가지만 우선 표시, 나머지는 "더보기"로
- **Phase 1 개선점**: HA 토글 시 사용자가 "실제가가 아님"을 인지해야 함 → HA 모드 활성 시 상단에 "평균가 기반 차트" 안내 텍스트 표시
- **결론**: 3단계 신호 + 접을 수 있는 상세 정보 구조로 수정

### Review #3 (코드 품질 + 확장성 검토)
**검토 관점**: 유지보수성 + 성능 + 기존 코드 패턴 준수

- **Phase 2 타입 호환성**: `HeikinAshiSignal` 인터페이스가 기존 `{ label, color, streak }` 를 extends 하도록 확인 필요 → 명시적으로 interface 상속 구조 설계
- **Phase 3 성능**: `generateCompositeSignal()`이 여러 지표를 재계산하면 비효율 → 이미 계산된 값을 매개변수로 받는 구조로 설계 (재계산 없음)
- **Phase 1 데이터 캐싱**: HA 데이터를 토글 때마다 재계산하면 낭비 → useMemo로 캐싱
- **대안 검토**: HA 계산을 Web Worker로 이동? → 63봉 데이터는 < 1ms 계산. 불필요한 복잡성. 기각
- **기존 패턴 준수**: StockChart의 show* 토글, indicator import 패턴 동일하게 적용
- **결론**: useMemo 캐싱 + 매개변수 주입 패턴으로 확정. Web Worker 불필요
