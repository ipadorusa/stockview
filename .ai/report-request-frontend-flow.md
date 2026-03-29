# AI 분석 요청 프론트엔드 플로우 추적

## 📋 프로젝트 구조

### 페이지 계층
```
/reports
├── /reports/request          (요청 생성 페이지)
├── /reports?tab=requests     (요청 목록 탭)
└── /reports?tab=reports      (완성된 리포트 탭)
```

### 컴포넌트 구조
```
src/app/reports/
├── page.tsx                      (메인 페이지 - SSR)
├── request/page.tsx              (요청 생성 - Client Component)
├── reports-page-tabs.tsx         (탭 네비게이션 - Client)
└── reports-client.tsx            (리포트 목록 렌더링)

src/components/report-request/
├── request-list-client.tsx       (요청 목록 테이블 - Client)
├── report-status-badge.tsx       (상태 배지 컴포넌트)
└── request-comments.tsx          (댓글 섹션 - Client)
```

---

## 🔄 사용자 플로우

### 1️⃣ 요청 생성 (`/reports/request`)

**파일:** `src/app/reports/request/page.tsx`

**UI 구성:**
- 페이지 제목: "AI 분석 요청"
- 카드 형식 폼:
  - `StockSearchInput` 컴포넌트 (종목 검색 & 선택)
  - 안내 텍스트:
    - "요청은 관리자 승인 후 AI가 분석을 생성합니다"
    - "하루 최대 3건까지 요청할 수 있습니다"
    - "이미 진행 중인 종목은 중복 요청할 수 없습니다"
  - "분석 요청하기" 제출 버튼

**상태 관리:**
```typescript
const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null)

// ticker 파라미터로 자동 프리필 (예: ?ticker=AAPL)
useQuery({
  queryKey: ["stock-search-prefill", tickerParam],
  queryFn: async () => { /* ... */ },
  enabled: !!tickerParam && !selectedStock,
})
```

**폼 제출 플로우:**
```
제출 버튼 클릭
  ↓
submitMutation.mutate(selectedStock)
  ↓
POST /api/report-requests { stockId, ticker }
  ↓
성공: toast.success("분석 요청이 등록되었습니다")
      router.push("/reports?tab=requests")
오류: toast.error(error.message)
```

**접근 제어:**
- 비로그인: "로그인하면 AI 종목 분석을 요청할 수 있어요" 메시지
- 로그인: 폼 표시

---

### 2️⃣ 요청 목록 조회 (`/reports?tab=requests`)

**파일:** `src/components/report-request/request-list-client.tsx`

**UI 구성:**

#### 헤더
- "분석 요청 게시판" 제목
- "+ 요청하기" 버튼 (→ `/reports/request`)

#### 테이블 구조
| 컬럼 | 내용 | 반응형 |
|------|------|--------|
| 종목 | 이름 + 티커 + 댓글 아이콘 | 항상 표시 |
| 요청자 | 닉네임 | sm 이상 |
| 상태 | 배지 (PENDING, APPROVED 등) | 항상 표시 |
| 요청일 | 날짜 (M/D) | sm 이상 |
| 완료일 | 날짜 또는 "-" | md 이상 |
| 관리 | 승인/거절/취소 버튼 | 필요시 |

#### 행 인터랙션
```typescript
// 행 클릭 → 댓글 섹션 펼침/접음
onClick={() => setExpandedId(isExpanded ? null : req.id)}

// 클릭 시 ChevronDown 아이콘 회전
<ChevronDown className={cn("transition-transform", isExpanded && "rotate-180")} />
```

#### 관리 버튼 (조건부 표시)
**관리자 (isAdmin=true) + PENDING 상태:**
- "승인" 버튼 → PATCH /api/report-requests/{id} { status: "APPROVED" }
- "거절" 버튼 → PATCH /api/report-requests/{id} { status: "REJECTED" }

**본인 (isOwner=true) + PENDING 상태:**
- "취소" 버튼 → DELETE /api/report-requests/{id}

---

### 3️⃣ 요청 상태 시각화

**파일:** `src/components/report-request/report-status-badge.tsx`

| 상태 | 라벨 | 스타일 |
|------|------|--------|
| PENDING | "대기" | gray |
| APPROVED | "승인" | blue |
| GENERATING | "생성 중" | yellow |
| COMPLETED | "완료" | green |
| FAILED | "실패" | red |
| REJECTED | "거절" | gray (line-through) |

**COMPLETED 상태 특수 처리:**
```typescript
if (req.status === "COMPLETED" && req.aiReportId) {
  // 링크로 감싸서 /reports로 이동 가능
  <Link href="/reports">
    <ReportStatusBadge status={req.status} />
  </Link>
}
```

---

### 4️⃣ 댓글 시스템

**파일:** `src/components/report-request/request-comments.tsx`

**위치:** 요청 행 클릭 시 아래에 확장되는 행

**UI 구성:**

#### 댓글 목록
```
[작성자명] [관리자 배지] [작성시간]
댓글 내용 (여러 줄 표시)
```

**작성자 정보:**
- `author` (닉네임)
- `isAdmin` 플래그 → "관리자" 배지 표시

#### 댓글 입력 폼 (로그인 시에만)
```
[Textarea: 댓글 입력...]  [작성 버튼]
```

**폼 제출:**
```
POST /api/report-requests/{requestId}/comments
{ content: "텍스트" }
  ↓
성공:
  - 입력창 초기화
  - query 캐시 무효화
  - "댓글이 작성되었습니다" 토스트
오류: "댓글 작성에 실패했습니다" 토스트
```

**캐시 무효화:**
```typescript
queryClient.invalidateQueries({ queryKey: ["request-comments", requestId] })
queryClient.invalidateQueries({ queryKey: ["report-requests"] }) // 댓글 수 업데이트
```

---

## 🔌 API 엔드포인트

### 요청 생성
```
POST /api/report-requests
Body: { stockId: string, ticker: string }
Response: { request: { id, stockId, ticker, status, requestedAt } }

검증:
- 로그인 필수
- 종목 존재 확인
- 중복 방지: 같은 종목에 PENDING/APPROVED/GENERATING 상태 확인
- 일일 제한: 사용자당 3건 (UTC 기준)
```

### 요청 목록 조회
```
GET /api/report-requests?page=1&limit=20&status=PENDING
Response: {
  requests: [
    {
      id, stockId, ticker, stockName, market,
      status, requester, isOwner, commentCount,
      requestedAt, approvedAt, completedAt, aiReportId
    }
  ],
  pagination: { page, limit, total, totalPages }
}
```

### 요청 상태 변경 (관리자)
```
PATCH /api/report-requests/{id}
Body: { status: "APPROVED" | "REJECTED" }
Response: { request: { id, status, approvedAt } }

검증:
- 관리자 권한 필수
- PENDING 상태만 처리 가능
```

### 요청 취소
```
DELETE /api/report-requests/{id}
검증:
- 로그인 필수
- 본인의 요청 또는 관리자만
- PENDING 상태만 취소 가능
```

### 댓글 조회
```
GET /api/report-requests/{requestId}/comments
Response: {
  comments: [
    {
      id, content, authorId, author,
      isAdmin, createdAt
    }
  ]
}
```

### 댓글 작성
```
POST /api/report-requests/{requestId}/comments
Body: { content: string }
Response: { comment: { id, content, authorId, author, isAdmin, createdAt } }

검증:
- 로그인 필수
- 요청 존재 확인
```

---

## 🔄 상태 관리 (React Query)

**주요 Query Keys:**
```typescript
["report-requests", page]          // 요청 목록 (페이지별)
["request-comments", requestId]    // 댓글 목록
["stock-search-prefill", ticker]   // 종목 검색 프리필
```

**Mutations:**
```typescript
submitMutation         // POST /api/report-requests (요청 생성)
approveMutation        // PATCH /api/report-requests/{id} (승인/거절)
deleteMutation         // DELETE /api/report-requests/{id} (취소)
submitMutation         // POST /api/report-requests/{requestId}/comments (댓글 작성)
```

**리프레시 전략:**
```typescript
// 요청 목록 자동 갱신 (30초 간격)
useQuery({
  queryKey: ["report-requests", page],
  queryFn: async () => { /* ... */ },
  refetchInterval: 30000,
})

// 변경 후 캐시 무효화
queryClient.invalidateQueries({ queryKey: ["report-requests"] })
```

---

## 🔗 탭 네비게이션

**파일:** `src/app/reports/reports-page-tabs.tsx`

```typescript
// URL 파라미터로 탭 관리
const tab = searchParams.get("tab") === "requests" ? "requests" : "reports"

// 탭 변경 시 URL 업데이트 (스크롤 없이)
router.replace(`/reports${params.size > 0 ? `?${params}` : ""}`, { scroll: false })
```

**탭 목록:**
- "AI 리포트" → ReportsClient 컴포넌트
- "분석 요청" → RequestListClient 컴포넌트

---

## 📌 주요 특징

### 1. 일일 요청 제한
- 사용자당 하루 최대 3건 (UTC 기준)
- 제한 초과 시: HTTP 429 + "일일 요청 한도(3건)를 초과했습니다"

### 2. 중복 요청 방지
- 같은 종목에 PENDING/APPROVED/GENERATING 상태가 있으면 거부
- HTTP 409 + "이미 해당 종목에 대한 요청이 진행 중입니다"

### 3. 권한 기반 UI
```
관리자:
  - 모든 요청의 승인/거절 버튼 표시
  - 모든 요청 수정/삭제 가능

일반 사용자:
  - 자신의 PENDING 요청만 취소 가능
  - 댓글 작성 가능

비로그인:
  - 요청 목록 조회 가능
  - 댓글 작성 불가
  - 요청 생성 불가 (로그인 페이지로)
```

### 4. Telegram 알림
```typescript
// 요청 생성 시 비동기 알림 (실패해도 무시)
sendReportRequestNotification(
  stockName,
  ticker,
  requesterNickname
).catch(() => {})
```

---

## ❌ 게시판과의 연결점

**결론: 연결점 없음**

- **게시판** (`/board`): 기능 요청, 버그 제보, 데이터 요청 등 일반 게시판
- **AI 분석 요청** (`/reports/request`): 전담 AI 분석 요청 시스템

두 기능은 완전히 독립적이고 별개의 데이터베이스 테이블 사용:
- 게시판: `BoardPost`, `BoardComment`
- 요청 시스템: `ReportRequest`, `RequestComment`

---

## 📊 데이터 흐름 다이어그램

```
사용자 (비로그인)
  ↓
/reports/request 방문
  ↓
"로그인하면 요청할 수 있어요" 메시지
  ↓
로그인 페이지로 이동

========================================

사용자 (로그인)
  ↓
/reports/request 방문
  ↓
종목 검색 & 선택
  ↓
"분석 요청하기" 제출
  ↓
POST /api/report-requests
  ├─ 검증: 로그인, 종목 존재, 중복, 일일 제한
  ├─ 성공 → DB 저장
  └─ 실패 → 오류 메시지
  ↓
성공 시: /reports?tab=requests 이동
  ↓
요청 목록에서 "대기" 상태로 표시

========================================

관리자
  ↓
/reports?tab=requests 방문
  ↓
요청 목록 테이블 보기
  ↓
"승인" 또는 "거절" 버튼 클릭
  ↓
PATCH /api/report-requests/{id}
  ├─ 검증: 관리자 권한, PENDING 상태
  ├─ 상태 변경
  └─ cache 무효화
  ↓
요청 상태 즉시 업데이트 (optimistic)

========================================

모든 사용자
  ↓
요청 행 클릭
  ↓
댓글 섹션 펼침
  ↓
GET /api/report-requests/{requestId}/comments
  ↓
댓글 목록 표시
  ↓
로그인 시: 댓글 입력 폼 표시
  ↓
POST /api/report-requests/{requestId}/comments
  ↓
cache 무효화 & 새 댓글 추가
```

---

## 🎯 다음 단계

- [ ] 백엔드: 분석 요청 처리 워크플로우 (APPROVED → GENERATING → COMPLETED)
- [ ] 백엔드: AI 분석 생성 자동화 (스케줄링 또는 트리거)
- [ ] 알림: 분석 완료 시 사용자 알림 (이메일/웹 푸시)
- [ ] UI: 요청 상태별 진행률 표시 (GENERATING 중)
