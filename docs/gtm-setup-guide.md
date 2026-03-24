# GTM 설정 가이드

## 사전 지식: 변수 이름 구분

GTM 변수에는 두 가지 이름이 있습니다.

| 구분 | 설명 | 예시 |
|---|---|---|
| **GTM 변수 이름** | GTM UI에서 보이는 표시용 이름 (자유롭게 작성) | `dlv - page_name` |
| **데이터 영역 변수 이름** | dataLayer에서 실제로 읽어오는 키값 (코드와 일치해야 함) | `page_name` |

> `dlv -` 접두사는 Data Layer Variable임을 구분하기 위한 컨벤션입니다.

---

## 1. 변수 (Variables)

**경로**: GTM 콘솔 → 변수 → 사용자 정의 변수 → 새로 만들기
**유형**: 데이터 영역 변수

| GTM 변수 이름 | 데이터 영역 변수 이름 |
|---|---|
| `dlv - page_name` | `page_name` |
| `dlv - method` | `method` |
| `dlv - success` | `success` |
| `dlv - search_term` | `search_term` |
| `dlv - results_count` | `results_count` |
| `dlv - content_type` | `content_type` |
| `dlv - item_id` | `item_id` |
| `dlv - ticker` | `ticker` |
| `dlv - period` | `period` |
| `dlv - title` | `title` |
| `dlv - source` | `source` |
| `dlv - category` | `category` |
| `dlv - market` | `market` |
| `dlv - signal` | `signal` |

---

## 2. 트리거 (Triggers)

**경로**: GTM 콘솔 → 트리거 → 새로 만들기
**유형**: 맞춤 이벤트

| GTM 트리거 이름 | 이벤트 이름 (dataLayer event 값) |
|---|---|
| `CE - page_view` | `page_view` |
| `CE - login` | `login` |
| `CE - sign_up` | `sign_up` |
| `CE - search` | `search` |
| `CE - select_content` | `select_content` |
| `CE - watchlist_add` | `watchlist_add` |
| `CE - watchlist_remove` | `watchlist_remove` |
| `CE - chart_period_change` | `chart_period_change` |
| `CE - news_click` | `news_click` |
| `CE - screener_filter` | `screener_filter` |

---

## 3. 태그 (Tags)

**경로**: GTM 콘솔 → 태그 → 새로 만들기
**유형**: Google 애널리틱스: GA4 이벤트
**GA4 측정 ID**: 모든 태그에 동일하게 입력

### GA4 - page_view
- **이벤트 이름**: `page_view`
- **트리거**: `CE - page_view`
- **이벤트 매개변수**:
  - `page_path` → `{{Page Path}}`
  - `page_name` → `{{dlv - page_name}}`

### GA4 - login
- **이벤트 이름**: `login`
- **트리거**: `CE - login`
- **이벤트 매개변수**:
  - `method` → `{{dlv - method}}`
  - `success` → `{{dlv - success}}`

### GA4 - sign_up
- **이벤트 이름**: `sign_up`
- **트리거**: `CE - sign_up`
- **이벤트 매개변수**:
  - `method` → `{{dlv - method}}`
  - `success` → `{{dlv - success}}`

### GA4 - search
- **이벤트 이름**: `search`
- **트리거**: `CE - search`
- **이벤트 매개변수**:
  - `search_term` → `{{dlv - search_term}}`
  - `results_count` → `{{dlv - results_count}}`

### GA4 - select_content
- **이벤트 이름**: `select_content`
- **트리거**: `CE - select_content`
- **이벤트 매개변수**:
  - `content_type` → `{{dlv - content_type}}`
  - `item_id` → `{{dlv - item_id}}`

### GA4 - watchlist_add
- **이벤트 이름**: `watchlist_add`
- **트리거**: `CE - watchlist_add`
- **이벤트 매개변수**:
  - `ticker` → `{{dlv - ticker}}`

### GA4 - watchlist_remove
- **이벤트 이름**: `watchlist_remove`
- **트리거**: `CE - watchlist_remove`
- **이벤트 매개변수**:
  - `ticker` → `{{dlv - ticker}}`

### GA4 - chart_period_change
- **이벤트 이름**: `chart_period_change`
- **트리거**: `CE - chart_period_change`
- **이벤트 매개변수**:
  - `ticker` → `{{dlv - ticker}}`
  - `period` → `{{dlv - period}}`

### GA4 - news_click
- **이벤트 이름**: `news_click`
- **트리거**: `CE - news_click`
- **이벤트 매개변수**:
  - `title` → `{{dlv - title}}`
  - `source` → `{{dlv - source}}`
  - `category` → `{{dlv - category}}`

### GA4 - screener_filter
- **이벤트 이름**: `screener_filter`
- **트리거**: `CE - screener_filter`
- **이벤트 매개변수**:
  - `market` → `{{dlv - market}}`
  - `signal` → `{{dlv - signal}}`

---

## 4. GA4 맞춤 정의 (GA4 콘솔 별도 작업)

**경로**: GA4 관리 → 맞춤 정의 → 맞춤 측정기준 → 만들기
**범위**: 이벤트

| 맞춤 측정기준 이름 | 매개변수 이름 |
|---|---|
| Page Name | `page_name` |
| Ticker | `ticker` |
| Period | `period` |
| News Source | `source` |
| News Category | `category` |
| Market | `market` |
| Signal | `signal` |

---

## 5. 검증 순서

1. GTM **미리보기(Preview)** 모드 진입
2. 사이트에서 각 액션 수행 (로그인, 검색, 차트 클릭 등)
3. Tag Assistant 패널에서 이벤트 수신 확인
4. GA4 **DebugView**에서 매개변수 정상 전달 확인
5. 이상 없으면 GTM **게시(Publish)**
