# 세분화 계획 검토 (5차)

> **리뷰어**: 세분화 계획 검토자
> **날짜**: 2026-03-30
> **대상**: implementation-plan-v3-granular.md (40-step)
> **비교 기준**: implementation-plan-v2.md, review-4-final-verification.md

---

## 판정: 구현 착수 가능 (경미 보완 권장)

40-step 세분화 계획은 v2의 핵심 내용을 충실히 분해하였으며, 각 Step이 1~3 파일 범위로 제한되어 롤백이 용이합니다. 아래 발견 사항 중 **높음** 심각도 이슈는 없으며, 구현 착수에 블로커가 되는 항목은 없습니다.

---

## 발견 사항 (심각도별)

### 중간 심각도

#### M-1. 의존성 그래프 오류 — Step 22(StockRow) → Step 23/24/25 불필요 의존

- **Step**: 의존성 그래프 (line 571-574)
- **문제**: 그래프에서 Step 23(티커 테이프), 24(환율 위젯), 25(퀵 액션)이 Step 22(StockRow)의 하위로 표시됨. 그러나 이 세 컴포넌트는 StockRow를 사용하지 않으며, Step 9(유틸리티 CSS) 완료 후 바로 시작 가능.
- **영향**: 병렬 진행 기회 상실. Step 22가 지연되면 불필요하게 홈페이지 전체가 블록됨.
- **제안**: Step 23/24/25를 Step 9의 직접 하위로 이동. Step 26(홈페이지 레이아웃)만 Step 22/23/24/25 전부 완료를 전제조건으로 유지.
  ```
  Step 9
    ├→ Step 22 (StockRow) ──┐
    ├→ Step 23 (티커 테이프) ─┤
    ├→ Step 24 (환율 위젯) ──┼→ Step 26 (홈페이지 레이아웃)
    └→ Step 25 (퀵 액션) ───┘
  ```

#### M-2. Step 26(홈페이지 레이아웃) 과대 — 분할 권장

- **Step**: Step 26 (line 362-378)
- **문제**: 단일 Step에서 HeroSection 제거 + CompactIndexBar 제거 + CSS Grid 적용 + 4개 신규 컴포넌트 통합 + QuickLinkGrid 교체를 수행. 이는 "1~3 파일, 즉시 검증 가능" 원칙에 부합하나 **변경 밀도가 높음**. 한 파일(`page.tsx`)이지만 6가지 작업이 동시에 진행되어 문제 발생 시 원인 특정이 어려움.
- **제안**: 2단계로 분할:
  - Step 26a: CSS Grid 레이아웃 + 기존 HeroSection/CompactIndexBar 제거 + 기존 지수/인기종목 섹션 재배치
  - Step 26b: 신규 컴포넌트(티커테이프, 환율위젯, 퀵액션) 통합 + QuickLinkGrid 교체

#### M-3. v3에서 누락 — `price-large/medium/small` 타이포그래피 유틸리티

- **Step**: Step 9 (line 164-178)
- **문제**: v2 Phase 1-3에 명시된 `.price-large`, `.price-medium`, `.price-small` 유틸리티 클래스가 v3 Step 9에 없음. `.font-price`만 존재. 4차 리뷰(R2-#9)에서도 이 항목이 "반영됨"으로 표기되었으나 v3 세분화에서 탈락.
- **제안**: Step 9에 `.price-large` (text-4xl font-price), `.price-medium` (text-2xl font-price), `.price-small` (text-base font-price) 추가. 또는 `.font-price`로 통합한 근거를 명시.

#### M-4. v3에서 누락 — shadcn 호환 매핑 9항목 명시 부재

- **Step**: Step 2 (line 41-42)
- **문제**: v2 Phase 1-1의 "shadcn 호환 매핑" 9개 항목(`--background` = `--bg-base`, `--card` = `--bg-card`, `--popover` = `--bg-floating`, `--muted` = `--bg-surface`, `--foreground` = `--fg-primary` 등)이 v3에서는 Step 2의 1줄 체크리스트로 축약됨. Step 3~5에서도 해당 매핑이 명시되지 않음.
- **영향**: 구현자가 shadcn 변수와 새 토큰의 동기화를 놓칠 위험.
- **제안**: Step 5(브랜드/시맨틱 컬러)에 shadcn 매핑 전체 목록을 체크리스트로 추가하거나, 별도 Step 5.5로 "shadcn 매핑 동기화" 단계 신설.

#### M-5. `dark:` 유틸리티 전수 점검 Step 누락

- **Step**: 해당 없음 (v2 Phase 1-4에 대응하는 Step 없음)
- **문제**: v2는 Phase 1-4에서 "30+파일 `dark:` 유틸리티 전수 조사" + "shadcn `--secondary`/`--accent` 의미 변경으로 인한 시각 변화 개별 확인"을 독립 단계로 가짐. v3에서는 Step 16(shadcn 점검)이 secondary/accent만 다루고, `dark:` 유틸리티 전수 조사가 어디에도 없음.
- **영향**: Step 1에서 `.dark` 클래스 유지로 호환성 보장이 되므로 실제 깨짐 위험은 낮으나, v2에서 명시한 검증 단계의 의도적 탈락인지 불분명.
- **제안**: Step 40(최종 검증)에 "`dark:` 유틸리티 사용 파일 대상 시각 확인" 항목 추가. 또는 의도적 생략이면 그 근거 명시.

---

### 낮음 심각도

#### L-1. Step 39(Gradient Border) 의존 경로 오류

- **Step**: 의존성 그래프 (line 576)
- **문제**: 그래프에서 Step 39(gradient border)가 Step 27(뉴스 카드) 하위로 표시. 그러나 Step 39는 `popular-stocks-tabs.tsx`에 적용하는 작업이므로 Step 27(뉴스 카드)과 무관. Step 22(StockRow) 또는 Step 26(홈페이지 레이아웃) 이후면 가능.
- **제안**: Step 39를 Step 26 하위로 이동하거나, Step 38(가격 틱)과 함께 최종 폴리시 그룹으로 분류.

#### L-2. 섹터 미니 히트맵 — 범위 밖 이동의 영향

- **Step**: 범위 밖 (line 611)
- **문제**: v2 Phase 3-4에서 인라인으로 포함되었던 "섹터 미니 히트맵"이 v3에서 범위 밖으로 이동. v2에서는 "데이터 가용 시 + graceful degradation(섹터 목록 링크)"으로 처리했으므로 Phase 3-4 안에서 최소 구현이 가능했음.
- **영향**: 홈페이지 마켓 펄스 패널에 빈 공간 발생 가능.
- **제안**: Step 26에서 히트맵 자리에 "섹터 목록 링크" placeholder를 배치하는 1줄 작업을 포함. 히트맵 본체는 Step 29 완성 후 후속.

#### L-3. `compare-chart.tsx` 차트 색상 전환 타이밍

- **Step**: Step 20 (line 290-298)
- **문제**: v2 Phase 0-2에서 `compare-chart.tsx`의 캔들 색상 hex → `getComputedStyle` 전환을 **Phase 0**(인프라 준비)에 배치했으나, v3에서는 **Step 20**으로 후순위 배치. 현재 `compare-chart.tsx`는 `classList.contains("dark")`만 사용 중(line 60 확인). `getComputedStyle` 전환이 Step 20까지 미뤄져도 기능상 문제 없으나, v2 의도와 다름.
- **영향**: Step 1~19 사이에 다크/라이트 전환 시 차트 색상이 CSS 변수를 따르지 않음 (기존 hex 하드코딩 유지). 기능적으로 문제없으나 중간 단계에서 불일치 발생.
- **제안**: 현행 유지 가능 (Step 20이 적절한 타이밍). v2와의 차이를 인지하고 있음을 주석으로 남기면 충분.

#### L-4. `.mesh-gradient` 빈 상태 배경 미처리 (4차 리뷰 B-3 미반영)

- **Step**: 해당 없음
- **문제**: 4차 리뷰 B-3에서 지적된 `.mesh-gradient`(빈 상태 배경: 관심종목 없음, 검색 결과 없음 등)가 v3에서도 여전히 없음.
- **제안**: Step 9 유틸리티 클래스에 `.mesh-gradient` 추가하거나, 명시적 제외 결정 기록.

#### L-5. v3 Step 28 쿼리 함수명 v2와 불일치

- **Step**: Step 28 (line 395)
- **문제**: v2에서 `getSectorHeatmapData(market)`, v3에서 `getSectorPerformance(market)`로 함수명 변경. 동일 기능이나 네이밍 불일치.
- **영향**: 구현 시 혼란 가능.
- **제안**: 하나로 통일 (v3의 `getSectorPerformance`가 더 범용적이므로 v3 채택 권장).

#### L-6. `"use client"` 필요 컴포넌트 표시 부재 (4차 리뷰 R1-#10 미반영)

- **Step**: Step 23(티커 테이프), Step 38(usePriceTick) 등
- **문제**: 4차 리뷰에서 "신규 클라이언트 컴포넌트에 `"use client"` 필요 여부 명시" 권장. v3에서도 미표시.
- **제안**: Step 23, 24, 29, 30, 31, 38에 `"use client"` 필요 여부 1줄 추가.

#### L-7. 최종 검증(Step 40) — v2 대비 약화

- **Step**: Step 40 (line 540-548)
- **문제**: v2 검증 체크리스트의 "10페이지 before/after 스크린샷 비교"가 v3 Step 40에서 "범위 밖 페이지 시각적 이상 없음"으로 축약됨. 구체적 페이지 목록 없음.
- **제안**: Step 40에 v2의 10페이지 목록(홈, 시장, 종목상세, 관심종목, 뉴스, 섹터, 스크리너, 리포트, 로그인, 마이페이지) 명시 복원.

---

## 의존성 그래프 검증 요약

| 구간 | 판정 | 비고 |
|------|------|------|
| Step 1 → 2~7 (독립) | **정확** | 토큰 추가만, 상호 의존 없음 |
| Step 2~7 → 8 (@theme) | **정확** | 토큰 등록 전에 정의 필요 |
| Step 8 → 9 (유틸리티) | **정확** | Tailwind 유틸리티가 토큰 참조 |
| Step 9 → 10~22 (독립) | **정확** | 레이아웃/컴포넌트 각각 독립 |
| Step 22 → 23/24/25 | **⚠️ 오류** | M-1 참조. 23/24/25는 Step 9 직접 하위 |
| Step 23/24/25/22 → 26 | **정확** | 홈 레이아웃이 전부 통합 |
| Step 27 → 39 | **⚠️ 오류** | L-1 참조. 39는 popular-stocks 대상 |
| Step 28 → 29/30/31 (독립) | **정확** | 데이터 쿼리 후 개별 컴포넌트 |
| Step 34 → 35 → 36/37 | **정확** | StockTabs 리팩토링 → Grid → 세부 |
| Step 38 → 40 | **정확** | 가격 틱 후 최종 검증 |

---

## v2 대비 누락 항목 추적

| v2 항목 | v3 반영 | 비고 |
|---------|---------|------|
| Phase 0-2 `compare-chart.tsx` | ✅ Step 20 | 타이밍 변경 (L-3) |
| D3 oklch fallback (주식 hex 유지) | ✅ Step 8 "hex 유지" | 정확히 반영 |
| D6 StockRow optional prop | ✅ Step 22 | 정확히 반영 |
| R2-#8 모바일 전용 패턴 | ✅ 범위 밖 | v2와 동일 |
| Phase 1-3 `.price-large/medium/small` | **❌ 누락** | M-3 참조 |
| Phase 1-4 `dark:` 유틸리티 전수 점검 | **❌ 누락** | M-5 참조 |
| shadcn 호환 매핑 9항목 | **⚠️ 축약** | M-4 참조 |
| Phase 3-4 섹터 미니 히트맵 | **범위 밖 이동** | L-2 참조 |
| `.mesh-gradient` | **❌ 누락** | L-4 참조 |
| 검증 10페이지 목록 | **⚠️ 축약** | L-7 참조 |
| `"use client"` 표시 | **❌ 누락** | L-6 참조 |

---

## Prisma 스키마 검증 결과

4차 리뷰 B-4의 "Prisma 스키마 변경 불필요" 주장을 실제 스키마로 검증:

- `Stock.changePercent`: ✅ 존재 (schema.prisma:118, `Decimal(10,4)`)
- `Stock.marketCap`: ✅ 존재 (schema.prisma:123, `BigInt?`)
- `Stock.sectorId` → `Sector` FK: ✅ 존재 (schema.prisma:66, 73, index:93)
- `Sector` 모델: ✅ 존재 (schema.prisma:423)

**결론**: Step 28의 "Prisma 스키마 변경 불필요" 주장은 **타당**. `getSectorPerformance`의 JOIN/GROUP BY 쿼리가 기존 모델로 가능.

---

## 최종 평가

| 항목 | 평가 |
|------|------|
| Step 크기 적정성 | ✅ 양호 (Step 26만 분할 권장) |
| 의존성 그래프 | ⚠️ 2개 오류 (M-1, L-1) — 병렬 최적화 기회 |
| v2 대비 누락 | ⚠️ 5건 누락/축약 — 모두 중간~낮음 심각도 |
| 검증 방법 | ✅ 양호 (Step 40 보완 권장) |
| 블로커 | ✅ 없음 |

**구현 착수 가능**. 위 보완 사항은 구현 중 반영해도 무방합니다.
