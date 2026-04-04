# 종목 상세 페이지 롤백 원인 분석 및 대안

> **날짜**: 2026-03-30
> **증상**: 종목 상세 페이지 레이아웃 깨짐 + 차트 미표시
> **조치**: stock-tabs.tsx, stock-chart.tsx, compare-chart.tsx를 363a1cc (개편 전)로 롤백

---

## 원인 분석

### 1. StockTabs 구조 과도 변경 (핵심 원인)

**변경 내용**: sonnet 에이전트가 StockTabs의 전체 레이아웃을 재구성함
- 기존: `hidden md:grid md:grid-cols-[2fr_1fr]` 2칼럼 분할 (차트+서브탭 | 정보패널)
- 변경: `hidden lg:grid` + inline `style={{ gridTemplateColumns: "1fr 320px", gridTemplateAreas: ... }}` 3영역 분할
- **동시에 모바일 레이아웃도 전면 교체**: 기존 탭 구조를 `lg:hidden` 블록으로 복제

**문제점**:
1. **차트 렌더링 컨텍스트 변경**: 기존에는 차트가 `md:grid-cols-[2fr_1fr]`의 좌측 칼럼에서 자연스럽게 너비를 받았으나, 새 구조에서 `gridArea: "chart"` + `min-w-0`으로 감싸면서 lightweight-charts의 `ResizeObserver` 기반 너비 계산이 깨짐
2. **card-chart 래퍼 추가**: `<div className="card-chart h-full">{chartSlot}</div>`가 차트를 `overflow: hidden; padding: 0`으로 감싸면서 차트 캔버스가 잘리거나 사이즈 0이 됨
3. **모바일/데스크톱 이중 렌더링**: `hidden lg:grid` + `lg:hidden` 블록으로 같은 콘텐츠를 2번 렌더하면서 chartSlot이 React 트리에서 2곳에 동시 마운트 → lightweight-charts가 혼란

### 2. StockSidebar import (secondary 원인)

`StockSidebar` 컴포넌트가 `stock-sidebar.tsx`로 신규 생성되었는데, stock-tabs.tsx에서 import 시도. 이 컴포넌트가 기존에 없던 데이터 구조(`stock.quote.open`, `stock.quote.high` 등)에 직접 접근하면서 null 가능성 처리 부족.

### 3. stock-chart.tsx CSS 변수 전환 (minor)

`getComputedStyle` 기반 CSS 변수 읽기는 기술적으로 올바르지만:
- oklch 값이 `getComputedStyle`에서 반환될 때 브라우저마다 포맷이 다를 수 있음 (Chrome은 `oklch()`, Safari는 `color()`)
- lightweight-charts는 hex/rgb만 지원하므로, oklch 값이 그대로 전달되면 파싱 실패 가능
- fallback 값(`|| "#..."`)이 있으므로 치명적이진 않지만, 다크 모드 전환 시 한 번의 깜빡임 발생 가능

---

## 왜 빌드에서 못 잡았나

- `npm run build`는 **타입 체크 + SSR 프리렌더링**만 수행
- lightweight-charts는 **클라이언트 전용** 동적 import (`import("lightweight-charts")`)이므로 빌드 시점에 실행 안 됨
- CSS Grid `gridTemplateAreas` 오류는 런타임 브라우저에서만 발현
- StockSidebar의 데이터 접근 오류도 클라이언트 하이드레이션 시점에서만 발생

---

## 대안

### 대안 A: 최소 변경 접근 (권장)

기존 stock-tabs.tsx의 2칼럼 구조(`md:grid-cols-[2fr_1fr]`)를 **유지**하면서 점진적 개선:

1. **차트 래퍼 제거**: `card-chart` 클래스 감싸지 않음. 차트는 기존대로 `<div>{chartSlot}</div>`
2. **사이드바는 기존 우측 패널 영역에 통합**: 새 `StockSidebar` 대신, 기존 우측 칼럼(정보 패널)의 스타일만 변경
3. **헤더 재설계는 기존 PriceDisplay 수정으로**: 새 마크업 대신 PriceDisplay 컴포넌트에 `font-price`, `change-pill` 클래스만 추가
4. **브레드크럼은 PageContainer 앞에 추가**: StockTabs 내부가 아닌 page.tsx 레벨에서

```
변경 범위: stock-tabs.tsx 10줄 이내 수정
리스크: 매우 낮음
```

### 대안 B: 차트 분리 + 사이드바 (중간 리스크)

차트를 StockTabs 밖으로 분리하되, 더 신중하게:

1. **page.tsx에서 차트 영역과 탭 영역 분리**: StockTabs에 chartSlot 전달하지 않고, page.tsx에서 직접 렌더
2. **Grid는 page.tsx에서 적용**: stock-tabs.tsx는 탭 콘텐츠만 담당
3. **사이드바는 page.tsx에서 렌더**: StockTabs와 독립적
4. **차트 래퍼 없음**: lightweight-charts 자유 리사이즈

```
변경 범위: page.tsx 50줄 + stock-tabs.tsx 30줄 수정
리스크: 중간 (Suspense 경계 재배치 필요)
```

### 대안 C: chart-tab 제거 + hero chart (높은 리스크)

Step 34 원래 계획대로 실행하되, 아래 주의사항 반영:

1. **chartSlot을 한 곳에서만 렌더**: `lg:hidden` / `hidden lg:block` 이중 렌더 금지. 대신 CSS로 위치만 변경
2. **card-chart 래퍼 사용 금지**: lightweight-charts와 호환 안 됨
3. **StockSidebar는 null-safe**: 모든 데이터 접근에 옵셔널 체이닝
4. **stock-chart.tsx CSS 변수 전환은 별도 Step으로**: StockTabs 리팩토링과 동시 진행 금지

```
변경 범위: page.tsx 80줄 + stock-tabs.tsx 전면 수정
리스크: 높음 (테스트 범위 넓음)
선행 조건: dev 서버에서 수동 검증 필수
```

---

## 권장 순서

1. **대안 A 먼저 적용** → 즉시 시각 개선 (브레드크럼, font-price, change-pill만 적용)
2. dev 서버에서 차트 정상 동작 확인 후 커밋
3. **대안 B는 별도 브랜치에서 진행** → PR 리뷰 후 머지
4. 대안 C는 보류 (리스크 대비 추가 가치가 낮음)

---

## chart CSS 변수 전환 관련

stock-chart.tsx의 `getComputedStyle` 방식은 원리적으로 올바르나, 다음 조건 충족 시에만 안전:

1. `getPropertyValue('--color-stock-up')`가 hex 문자열을 반환하는지 확인 (oklch가 아닌 hex가 `@theme inline`에 등록됨)
2. 반환값이 빈 문자열이면 fallback 사용 (이미 구현됨: `|| "#ef4444"`)
3. 테마 전환 시 차트 재생성 로직 (현재 `useEffect` deps에 theme 없음 — 추가 필요)

→ chart CSS 변수 전환은 **StockTabs 리팩토링과 분리**하여 단독 진행 권장.
