# StockView 개편 1차 팀 회의록

> 일시: 2026-03-26 | 참석자: PM (pm-lead), UX 기획자 (planner-ux), 기능 기획자 (planner-feature), 프론트엔드 개발자 (dev-frontend), 백엔드 개발자 (dev-backend)

---

## 0. 회의 목적

- 프론트엔드/백엔드 개발자의 기획서 분석 결과 공유
- 기획서 간 충돌 사항 정리 및 PM 결정 확인
- 기획서에서 누락된 기술적 제약 논의
- Phase 1 구현 우선순위 및 일정 합의

---

## 1. 개발자 분석 핵심 발견 사항

### 1.1 프론트엔드 개발자 (dev-frontend) 주요 발견

| # | 발견 | 심각도 | 상세 |
|---|------|--------|------|
| F1 | **NavigationMenu 미설치** | 중 | 기획서에서 "shadcn/ui에 포함"이라 했으나, 실제 프로젝트에 설치 안 됨. `npx shadcn@latest add navigation-menu` 필요 |
| F2 | **시간 추정 과소** | 중 | 네비게이션 재설계 기획서 "~3시간" → 실제 예상 **5~7시간**. Phase 1 UI 전체 **~11시간** |
| F3 | **`/stock/[ticker]` 탭 귀속 문제** | 중 | "분석" 탭에 종목 상세를 넣으면 시장/뉴스/검색 등 다른 경로에서 진입 시 혼란 |
| F4 | **히어로 섹션 ISR 충돌** | 하 | 홈페이지 ISR(revalidate=900)과 localStorage 기반 조건부 렌더링 시 CLS 발생 가능 |
| F5 | **탭 6→4개 통합 복잡도** | 중 | Server Component slot 패턴 사용 중 → "이벤트" 탭 통합 시 slot 구조 변경 + 래퍼 컴포넌트 필요 (2~3시간) |
| F6 | **Compare 버그 확인** | 극상 | `/api/stock/` → `/api/stocks/` 오타. 기능 완전 미작동 |

### 1.2 백엔드 개발자 (dev-backend) 주요 발견

| # | 발견 | 심각도 | 상세 |
|---|------|--------|------|
| B1 | **collect-kr-quotes maxDuration=300 (Hobby 비호환)** | **극상** | 4,300개 KR 종목의 StockQuote upsert가 43배치 x ~2초 = ~86초. **Hobby 60초 초과 가능**. 기획서 모두 누락 |
| B2 | **기획서-PM 결정 충돌** | 상 | spec-data-quality.md는 BATCH=250/maxDuration=300/3년 보존 제안, PM은 BATCH=100/60초/365일로 축소. **PM 결정 우선** |
| B3 | **PBR 매일 리셋 확인** | 상 | collect-kr-quotes가 매일 `pbr: null`로 덮어씀. 토요일 fundamentals 갱신 후 월~금 null 상태 |
| B4 | **포트폴리오 환율 혼합 문제** | 중 | KRW+USD 단순 합산 시 의미 없는 숫자. 시장별 분리 또는 환율 변환 필요 |
| B5 | **시그널 쿼리 중복 확인** | 중 | screener.ts와 ai-report.ts에 거의 동일한 5개 시그널 SQL이 중복 존재 |
| B6 | **GitHub Actions 한도 검증** | 중 | 현재 ~552분/월. 장중 5분 폴링 시 +3,432분으로 2배 초과. 30분 간격만 가능 |

---

## 2. 기획서 간 충돌 사항 정리

### 2.1 PM 결정 vs 기능 기획서 충돌 (PM 결정 확정)

| 항목 | spec-data-quality.md (기획) | pm-review (PM 결정) | 회의 결정 |
|------|---------------------------|---------------------|----------|
| DailyPrice 보존 | 3년 (1,095일, ~420MB) | **365일 유지** (140MB) | **PM 결정 따름**. 변경 불필요 |
| Fundamentals 배치 | 250개, maxDuration 300 (Pro) | **100개, maxDuration 60** (Hobby) | **PM 결정 따름**. 60초 내 처리 가능 확인됨 |
| Fundamentals 스케줄 | 주 3회 (화/목/토) | **평일 매일** (주 5회) | **PM 결정 따름**. GA 한도 내 (+22분/월) |
| AI 리포트 | Cloud LLM (유료) | **Groq 무료 or Oracle Free Tier** | **PM 결정 따름** |
| 장중 시세 폴링 | 5분 간격 | **30분 간격** (GA 한도 내) | **PM 결정 따름** |

> **기능 기획자 액션**: spec-data-quality.md를 PM 결정에 맞게 수정 필요

---

## 3. 논의 안건 및 결정

### 안건 1: [블로커] collect-kr-quotes Hobby 60초 호환성

**상황**: KR quotes 크론에 `maxDuration=300`이 설정되어 있으며, 4,300개 종목 처리에 60초 초과 가능성
**백엔드 제안**: 크론 분할 (KOSPI/KOSDAQ) 또는 bulk upsert 변환

**논의**:
- `dev-backend`: StockQuote upsert를 Promise.allSettled 대신 `prisma.$transaction`으로 bulk 처리하면 시간 단축 가능. 또는 KOSPI/KOSDAQ 2회 분할 실행
- `pm-lead`: 먼저 실측이 필요. 현재 Vercel 환경에서 실제 실행 시간을 측정한 후 결정

**결정**:
1. **즉시**: dev-backend가 로컬에서 실행 시간 측정
2. **60초 초과 시**: KOSPI/KOSDAQ 분할 방안 채택 (GitHub Actions YAML 2개로 분리)
3. **60초 이내 시**: 현행 유지, maxDuration=60으로 변경

---

### 안건 2: 데스크톱 네비게이션 방식

**상황**: UX 기획서에 메가메뉴(안 A)와 2단 네비게이션(안 B) 두 가지 제안
**프론트엔드 의견**: NavigationMenu 미설치 상태. 메가메뉴 2.5시간, 2단 네비 1.5시간. Phase 1에서는 2단 네비 권장

**논의**:
- `planner-ux`: 메가메뉴가 UX 면에서 우수하지만 Phase 1 목표는 "접근성 확보"이므로 2단도 수용 가능
- `dev-frontend`: 2단이면 NavigationMenu 설치 불필요. 기존 컴포넌트만으로 구현 가능
- `pm-lead`: Phase 1은 속도 우선

**결정**:
- **Phase 1**: 2단 네비게이션 (1.5시간)
- **Phase 2**: 사용자 피드백 후 메가메뉴 검토

---

### 안건 3: `/stock/[ticker]`의 BottomTabBar 탭 귀속

**상황**: 기획서는 "분석" 탭에 포함시켰으나, 프론트엔드가 다양한 진입 경로 문제 제기

**논의**:
- `dev-frontend`: 종목 상세는 홈/시장/뉴스/검색 등 어디서든 진입 → 특정 탭에 넣으면 혼란
- `planner-ux`: 동의. "어디에도 활성화하지 않음"이 더 자연스러움

**결정**: `/stock/[ticker]` 방문 시 **BottomTabBar 어떤 탭도 활성화하지 않음**

---

### 안건 4: 포트폴리오 환율 혼합 문제

**상황**: KRW+USD 종목이 혼재된 포트폴리오에서 totalCost/totalValue 단순 합산은 의미 없음

**논의**:
- `dev-backend`: ExchangeRate 모델이 이미 있으므로, 환율 변환 1회 조회로 원화 합산 가능
- `planner-feature`: Phase 2 기획에서 "환율 변환은 Phase 3"이라 했으나, 합산이 의미 없으면 Phase 2에서 바로 해야 함
- `pm-lead`: 최소한 시장별 분리 표시는 필수

**결정**:
1. **기본**: 시장별 소계 분리 표시 (KR 소계 / US 소계)
2. **전체 합산**: ExchangeRate로 원화 환산 후 표시 (추가 공수 30분, Phase 2 내 포함)
3. planner-feature가 spec-portfolio.md 수정

---

### 안건 5: 탭 6→4개 통합 시기

**상황**: Server Component slot 패턴 변경이 필요하여 예상보다 복잡 (2~3시간)

**논의**:
- `dev-frontend`: Phase 1에 넣기엔 공수 대비 우선순위 낮음. 현재 6탭도 KR만 6개, US는 5개라 치명적이지 않음
- `planner-ux`: Phase 2로 미룰 수 있음. 단, 모바일에서 flex-wrap 2줄 문제는 있음
- `dev-frontend`: 2줄 방지는 `overflow-x-auto` 가로 스크롤로 15분이면 해결

**결정**:
- **Phase 1**: 탭 6개 유지, 모바일에서 가로 스크롤 적용 (15분)
- **Phase 2**: 탭 통합 검토

---

### 안건 6: AI 리포트 자동화 방식

**상황**: Oracle Cloud Free Tier vs Groq API 무료

**논의**:
- `dev-backend`: Oracle Free Tier는 초기 설정 3~4시간 + idle 회수 리스크. Groq는 2시간이면 연동 가능하고 안정적
- `pm-lead`: Groq를 primary로, Ollama를 로컬 개발용 fallback으로

**결정**:
- **Phase 1**: Groq API 연동 (환경변수 분기)
- **로컬**: Ollama 유지 (개발/테스트용)
- **Oracle Cloud**: 보류 (필요 시 Phase 3)

---

### 안건 7: 광고 위치 이동

**논의**:
- `dev-frontend`: 1줄 코드 이동. 다만 above-the-fold에서 벗어나면 수익 감소 가능
- `pm-lead`: 이동 후 2주 모니터링. 수익 20% 이상 감소 시 원복

**결정**: 광고 위치 이동 실행. 2주 후 수익 데이터 리뷰.

---

### 안건 8: 브랜드 컬러

**논의**:
- `dev-frontend`: CSS 변수 4~6줄 수정이면 끝. 다만 주식 빨강/파랑과 충돌하지 않는 색상 필요
- `planner-ux`: 초록 계열(`oklch(0.55 0.15 145)`) 또는 보라 계열 제안
- `pm-lead`: 금융 서비스에 그린이 적합

**결정**:
- **컬러 후보 3개**를 dev-frontend가 적용한 스크린샷으로 제시 → PM 최종 선택
- Phase 1 마지막에 적용 (다른 UI 변경 완료 후)

---

## 4. Phase 1 확정 구현 계획

### 4.1 백엔드 (dev-backend) — 예상 8~10시간

| 순서 | 항목 | 예상 | 담당 | 비고 |
|------|------|------|------|------|
| 1 | Compare API 버그 수정 | 1분 | dev-backend | 핫픽스, 즉시 |
| 2 | PBR null 덮어쓰기 제거 | 15분 | dev-backend | upsert 구조 분리 |
| 3 | compute-indicators market 파라미터 | 20분 | dev-backend | 코드 + YAML |
| 4 | 시그널 쿼리 중복 제거 | 1시간 | dev-backend | screener.ts 통합 |
| 5 | Fundamentals 스케줄 변경 + 우선순위 큐 | 30분 | dev-backend | YAML + 2단계 쿼리 |
| 6 | **KR quotes Hobby 60초 호환** | 2~3시간 | dev-backend | 실측 후 분할 결정 |
| 7 | 52주 고저 API 개별 스크래핑 제거 | 20분 | dev-backend | 크론 fallback은 #6 이후 |
| 8 | Groq API 연동 | 2시간 | dev-backend | 환경변수 분기 |
| 9 | 크론 에러 알림 (Discord) | 1시간 | dev-backend | 추가 제안 채택 |

### 4.2 프론트엔드 (dev-frontend) — 예상 8~9시간

| 순서 | 항목 | 예상 | 담당 | 비고 |
|------|------|------|------|------|
| 1 | BottomTabBar 5탭 + safe-area | 20분 | dev-frontend | /stock/ 비활성 |
| 2 | 종목 상세 광고 위치 이동 | 5분 | dev-frontend | 1줄 이동 |
| 3 | Sheet 메뉴 그룹핑 + 누락 페이지 | 45분 | dev-frontend | navGroups 구조 |
| 4 | 데스크톱 2단 네비게이션 | 1.5시간 | dev-frontend | 기존 컴포넌트 활용 |
| 5 | 차트 컨트롤 기본/고급 분리 | 1시간 | dev-frontend | localStorage 선호 저장 |
| 6 | 퀵 액세스 카드 (홈/시장/스크리너) | 1시간 | dev-frontend | QuickLinkCard 컴포넌트 |
| 7 | 홈페이지 히어로 섹션 | 1.5시간 | dev-frontend | Client Component 분리 |
| 8 | 모바일 탭 가로 스크롤 (6탭 유지) | 15분 | dev-frontend | overflow-x-auto |
| 9 | 브랜드 컬러 적용 | 0.5시간 + 2시간 QA | dev-frontend | 마지막에 적용 |

### 4.3 기획자 액션 아이템

| 담당 | 액션 | 기한 |
|------|------|------|
| planner-feature | spec-data-quality.md PM 결정 반영 수정 | 2026-03-27 |
| planner-feature | spec-portfolio.md 환율 합산 정책 추가 | 2026-03-27 |
| planner-feature | spec-portfolio.md 항목 수 제한 (200개) 추가 | 2026-03-27 |
| planner-ux | spec-navigation-redesign.md 2단 네비로 변경 | 2026-03-27 |
| planner-ux | /stock/[ticker] 탭 비활성 반영 | 2026-03-27 |
| pm-lead | 브랜드 컬러 후보 중 최종 선택 | 2026-03-28 |

---

## 5. 전체 Phase 1 일정

```
3/26 (오늘)  회의 완료, 핫픽스 (Compare 버그, PBR)
3/27~28      백엔드: KR quotes 60초 검증 + 크론 최적화
             프론트엔드: BottomTabBar + Sheet + 2단 네비
             기획자: 기획서 수정
3/29~30      백엔드: Groq 연동, 에러 알림
             프론트엔드: 차트 컨트롤, 퀵 카드, 히어로
3/31         프론트엔드: 브랜드 컬러 + QA
4/1          통합 테스트 + 배포
```

**Phase 1 총 예상**: 백엔드 8~10시간 + 프론트엔드 8~9시간 = **약 17~19시간 (4~5일)**

---

## 6. Phase 2 예고 (다음 회의에서 상세화)

| 항목 | 담당 | 의존성 |
|------|------|--------|
| 포트폴리오 (스키마+API+UI) | dev-backend + dev-frontend | Phase 1 완료 |
| 장중 시세 30분 폴링 | dev-backend | KR quotes 60초 검증 |
| 스크리너 펀더멘탈 필터 | dev-backend + dev-frontend | - |
| 종목 비교 개선 (자동완성, 4종목) | dev-frontend | Compare 버그 수정 |
| 온보딩 플로우 | dev-frontend | 히어로 섹션 |
| 탭 6→4개 통합 | dev-frontend | - |

---

## 7. 회의 결론

1. **PM 결정 확정**: 무료 제약(Hobby/Free Tier) 내 운영 원칙 재확인. 기획서 충돌 사항은 PM 결정으로 통일.
2. **블로커 발견**: `collect-kr-quotes`의 Hobby 60초 호환성이 모든 기획서에서 누락됨 → 최우선 실측 필요
3. **시간 추정 현실화**: 기획서 합산 ~4시간 → 실제 **~17~19시간**. 일정 조정 반영.
4. **즉시 실행**: Compare 버그 + PBR 수정은 오늘 핫픽스
5. **기획서 수정**: 3개 문서(spec-data-quality, spec-portfolio, spec-navigation-redesign) PM 결정 반영 업데이트

---

*다음 회의: Phase 1 완료 시점 (4/1 예정) — Phase 2 상세 기획 리뷰*
