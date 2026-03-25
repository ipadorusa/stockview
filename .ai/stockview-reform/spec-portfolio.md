# Phase 2: 포트폴리오 기능 상세 기획서

> 작성일: 2026-03-25 | 근거: 코드베이스 직접 확인

---

## 1. DB 스키마 설계

### 1.1 기존 Watchlist 모델 확장 vs 별도 Portfolio 모델

**현재 Watchlist 모델** (`prisma/schema.prisma` line 143-154):
```prisma
model Watchlist {
  id        String   @id @default(cuid())
  userId    String
  stockId   String
  createdAt DateTime @default(now())
  user  User  @relation(...)
  stock Stock @relation(...)
  @@unique([userId, stockId])
  @@index([userId])
}
```

| | 방안 A: Watchlist 확장 | 방안 B: 별도 PortfolioEntry 신규 (권장) |
|---|---|---|
| **장점** | 마이그레이션 간단, 기존 데이터 유지 | 관심종목과 포트폴리오 명확 분리, 같은 종목 여러 번 매수 가능 |
| **단점** | nullable 필드 다수 (기존 항목은 buyPrice=null), 같은 종목 복수 매수 불가 (unique 제약) | 새 모델+API 생성 필요, 관심종목↔포트폴리오 전환 UX 고민 |
| **데이터 호환** | 기존 Watchlist 레코드 그대로 유지 | 기존 Watchlist 유지 + Portfolio 별도 관리 |

**권장: 방안 B (별도 PortfolioEntry 모델)**

이유:
1. 같은 종목 여러 번 매수(물타기, 분할매수) 지원 필수
2. Watchlist의 `@@unique([userId, stockId])` 제약을 제거하면 관심종목 중복 추가 버그 발생
3. 관심종목(간편)과 포트폴리오(상세)는 사용 패턴이 다름 — 분리가 자연스러움

### 1.2 PortfolioEntry 모델 설계

```prisma
model PortfolioEntry {
  id        String   @id @default(cuid())
  userId    String
  stockId   String
  buyPrice  Decimal  @db.Decimal(18, 4)
  quantity  Decimal  @db.Decimal(18, 4)  // 소수점 허용 (US 소수점 매수)
  buyDate   DateTime @db.Date
  memo      String?  @db.VarChar(500)
  groupName String?  @db.VarChar(50)     // 사용자 정의 그룹 (예: "IT", "배당주")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  stock Stock @relation(fields: [stockId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, groupName])
  @@index([stockId])
}
```

**Stock 모델에 relation 추가**:
```prisma
model Stock {
  ...
  portfolioEntries PortfolioEntry[]
  ...
}
```

**User 모델에 relation 추가**:
```prisma
model User {
  ...
  portfolioEntries PortfolioEntry[]
  ...
}
```

### 1.3 마이그레이션 전략

1. `npx prisma migrate dev --name add-portfolio-entry` 로 새 모델 생성
2. **기존 Watchlist 데이터 유지** — 별개 모델이므로 간섭 없음
3. 관심종목 → 포트폴리오 전환: UI에서 "매수 정보 추가" 버튼으로 Watchlist → PortfolioEntry 복사 기능 제공 (선택사항)

### 1.4 필드 상세

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `buyPrice` | Decimal(18,4) | Y | 매수 단가 (KRW: 원, USD: 달러) |
| `quantity` | Decimal(18,4) | Y | 매수 수량 (US 소수점 매수 지원) |
| `buyDate` | Date | Y | 매수일 |
| `memo` | VarChar(500) | N | 투자 메모 ("실적 서프라이즈 기대", "분할매수 2차") |
| `groupName` | VarChar(50) | N | 사용자 정의 그룹 (null = "기본") |

---

## 2. API 설계

### 2.1 엔드포인트 목록

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/portfolio` | 포트폴리오 조회 (그룹별, 수익률 포함) | 필수 |
| POST | `/api/portfolio` | 종목 추가 (매수 정보) | 필수 |
| PATCH | `/api/portfolio/[id]` | 수정 (매수가, 수량, 메모, 그룹) | 필수 |
| DELETE | `/api/portfolio/[id]` | 삭제 | 필수 |

### 2.2 GET /api/portfolio

**Query Parameters**:
- `group` (optional): 특정 그룹만 조회. 미지정 시 전체.

**Response**:
```typescript
{
  portfolio: {
    groups: [
      {
        name: "IT" | null,  // null = "기본" 그룹
        entries: [
          {
            id: string,
            ticker: string,
            name: string,
            market: "KR" | "US",
            stockType: "STOCK" | "ETF",
            buyPrice: number,
            quantity: number,
            buyDate: string,       // "2026-03-01"
            memo: string | null,
            currentPrice: number,
            change: number,
            changePercent: number,
            profitLoss: number,          // (currentPrice - buyPrice) * quantity
            profitLossPercent: number,   // (currentPrice - buyPrice) / buyPrice * 100
            totalValue: number,          // currentPrice * quantity
            totalCost: number,           // buyPrice * quantity
          }
        ],
        subtotal: {
          totalCost: number,
          totalValue: number,
          profitLoss: number,
          profitLossPercent: number,
        }
      }
    ],
    summary: {
      totalCost: number,
      totalValue: number,
      profitLoss: number,
      profitLossPercent: number,
      entryCount: number,
      stockCount: number,        // 고유 종목 수
    }
  }
}
```

**수익률 계산 로직**:
```typescript
// 개별 종목 수익률
const profitLoss = (currentPrice - buyPrice) * quantity
const profitLossPercent = ((currentPrice - buyPrice) / buyPrice) * 100

// 그룹/전체 수익률 (가중평균)
const totalCost = entries.reduce((sum, e) => sum + e.buyPrice * e.quantity, 0)
const totalValue = entries.reduce((sum, e) => sum + e.currentPrice * e.quantity, 0)
const profitLossPercent = ((totalValue - totalCost) / totalCost) * 100
```

**참고**: 환율 변환 (USD→KRW)은 Phase 3에서 검토. 현재는 시장별 통화 그대로 표시.

### 2.3 POST /api/portfolio

**Request Body**:
```typescript
const addSchema = z.object({
  ticker: z.string().min(1).max(10),
  buyPrice: z.number().positive(),
  quantity: z.number().positive(),
  buyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memo: z.string().max(500).optional(),
  groupName: z.string().max(50).optional(),
})
```

**Response**: `201 Created`
```typescript
{ id: string, message: "포트폴리오에 추가되었습니다." }
```

**구현 참고**:
```typescript
// stock 존재 확인
const stock = await prisma.stock.findUnique({
  where: { ticker: parsed.data.ticker.toUpperCase() },
})
if (!stock) return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })

// 생성 (같은 종목 복수 매수 허용)
const entry = await prisma.portfolioEntry.create({
  data: {
    userId: session.user.id,
    stockId: stock.id,
    buyPrice: parsed.data.buyPrice,
    quantity: parsed.data.quantity,
    buyDate: new Date(parsed.data.buyDate),
    memo: parsed.data.memo,
    groupName: parsed.data.groupName,
  },
})
```

### 2.4 PATCH /api/portfolio/[id]

**Request Body** (모두 optional):
```typescript
const updateSchema = z.object({
  buyPrice: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  buyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  memo: z.string().max(500).nullable().optional(),
  groupName: z.string().max(50).nullable().optional(),
})
```

**권한 체크**: `entry.userId === session.user.id` 확인 필수

### 2.5 DELETE /api/portfolio/[id]

**권한 체크**: 본인 항목만 삭제 가능
**Response**: `200 OK`

### 2.6 미들웨어 보호

`src/proxy.ts`에 포트폴리오 경로 추가:
```typescript
// 기존 보호 경로
const protectedPaths = ["/watchlist", "/settings", "/api/watchlist"]

// 추가
const protectedPaths = ["/watchlist", "/settings", "/portfolio", "/api/watchlist", "/api/portfolio"]
```

---

## 3. UI 설계

### 3.1 페이지 구조: 별도 `/portfolio` 페이지 (권장)

**이유**: 관심종목(간편 리스트)과 포트폴리오(매수 정보+수익률)는 정보량과 사용 패턴이 다름

| 경로 | 설명 | 기존 유지 |
|------|------|----------|
| `/watchlist` | 관심종목 (기존 유지) — 간편 리스트, 원터치 추가/삭제 | O |
| `/portfolio` | 포트폴리오 (신규) — 매수 정보, 수익률, 그룹 관리 | 신규 |

### 3.2 포트폴리오 페이지 구조

```
/portfolio
├── [요약 카드] 총 투자금 / 총 평가금 / 총 수익률 / 일간 변동
├── [그룹 탭] 전체 | IT | 배당주 | 미국주 | ... (사용자 정의)
├── [종목 리스트]
│   ├── StockRow (확장: + 매수가, 수량, 수익률, 메모)
│   ├── StockRow ...
│   └── [그룹 소계] 투자금 / 평가금 / 수익률
├── [추가 버튼] "+ 종목 추가" → 모달/시트
└── [빈 상태] EmptyState ("포트폴리오에 종목을 추가해보세요")
```

### 3.3 종목 추가 모달 (Sheet)

```
[종목 추가]
├── 종목 검색 (SearchCommand 연동 — 자동완성)
├── 매수 단가: [Input] (자동: 현재가 prefill)
├── 매수 수량: [Input]
├── 매수일: [DatePicker] (자동: 오늘)
├── 그룹: [Select] (기존 그룹 목록 + "새 그룹 만들기")
├── 메모: [Textarea] (선택)
└── [추가] [취소]
```

### 3.4 포트폴리오 StockRow 확장

기존 `StockRow` 컴포넌트는 수정하지 않고, 포트폴리오 전용 `PortfolioRow` 컴포넌트 신규 생성:

```typescript
interface PortfolioRowProps {
  id: string
  ticker: string
  name: string
  market: Market
  stockType: StockType
  currentPrice: number
  change: number
  changePercent: number
  buyPrice: number
  quantity: number
  profitLoss: number
  profitLossPercent: number
  memo?: string | null
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}
```

레이아웃:
```
[삼성전자]          매수 72,000원 x 10주
 005930              현재 75,300원  +4.58%
                     수익 +33,000원
                     [편집] [삭제]
```

### 3.5 뷰 모드

포트폴리오 페이지에서 토글:
- **간략 보기**: 종목명, 현재가, 수익률만
- **상세 보기**: 매수가, 수량, 투자금, 평가금, 수익금, 메모 모두 표시

### 3.6 그룹 관리

- 그룹은 별도 DB 모델 없이 `PortfolioEntry.groupName`으로 관리
- 그룹 목록: `SELECT DISTINCT groupName FROM PortfolioEntry WHERE userId = ?`
- 그룹 이름 변경: 해당 그룹 모든 항목의 groupName 일괄 UPDATE
- 그룹 삭제: groupName을 null로 일괄 UPDATE (항목은 유지)

---

## 4. 종목 리스트 관심종목 원터치 추가

### 4.1 현황

- `WatchlistButton` 컴포넌트 (`src/components/stock/watchlist-button.tsx`): Star 아이콘 토글
- 현재 사용처: `src/app/stock/[ticker]/stock-tabs.tsx` — 종목 상세 페이지에서만 사용
- `StockRow` 컴포넌트 (`src/components/market/stock-row.tsx`): 관심종목 기능 없음

### 4.2 변경: StockRow에 선택적 WatchlistButton 추가

**`src/components/market/stock-row.tsx`** 변경:

```typescript
interface StockRowProps {
  // 기존 props...
  showWatchlist?: boolean       // 새 prop (기본값 false)
  isWatched?: boolean           // 새 prop
  onToggleWatchlist?: (ticker: string, isWatched: boolean) => Promise<void>  // 새 prop
}

export const StockRow = memo(function StockRow({
  // 기존 props...
  showWatchlist = false,
  isWatched = false,
  onToggleWatchlist,
}: StockRowProps) {
  return (
    <div className="flex items-center justify-between ...">
      <Link href={href} className="flex-1 flex items-center justify-between ...">
        {/* 기존 내용 */}
      </Link>
      {showWatchlist && onToggleWatchlist && (
        <WatchlistButton
          ticker={ticker}
          isWatched={isWatched}
          onToggle={onToggleWatchlist}
          className="ml-2 shrink-0"
        />
      )}
    </div>
  )
})
```

### 4.3 관심종목 상태 관리

StockRow에 관심종목 기능을 추가하려면 **현재 사용자의 관심종목 목록**을 리스트 페이지에서 알아야 함.

**방안: React Query로 관심종목 목록 prefetch**

```typescript
// 리스트 페이지 (시장, ETF, 스크리너 등)에서
const { data: session } = useSession()
const { data: watchlistData } = useQuery({
  queryKey: ["watchlist"],
  queryFn: () => fetch("/api/watchlist").then(r => r.json()),
  enabled: !!session,
  staleTime: 60_000,
})
const watchedTickers = new Set(
  watchlistData?.watchlist?.map((w: { ticker: string }) => w.ticker) ?? []
)
```

### 4.4 적용 대상 페이지

| 페이지 | 컴포넌트 | 변경 |
|--------|---------|------|
| `/market` | 상승/하락 TOP5 StockRow | `showWatchlist={true}` |
| `/etf` | ETF 목록 StockRow | `showWatchlist={true}` |
| `/screener` | 스크리너 결과 StockRow | `showWatchlist={true}` |
| `/sectors/[name]` | 섹터 종목 StockRow | `showWatchlist={true}` |
| `/` (홈) | 인기종목 StockRow | `showWatchlist={true}` |

**주의**: `showWatchlist`는 optional이므로 기존 StockRow 사용처는 변경 불필요

### 4.5 관심종목 토글 핸들러 (공통)

재사용을 위해 커스텀 훅 생성:

```typescript
// src/hooks/use-watchlist.ts
export function useWatchlistToggle() {
  const queryClient = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: async ({ ticker, isWatched }: { ticker: string; isWatched: boolean }) => {
      if (isWatched) {
        await fetch(`/api/watchlist/${ticker}`, { method: "DELETE" })
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] })
    },
  })

  const handleToggle = async (ticker: string, isWatched: boolean) => {
    await toggleMutation.mutateAsync({ ticker, isWatched })
  }

  return { handleToggle, isLoading: toggleMutation.isPending }
}
```

---

## 5. 네비게이션 추가

포트폴리오 페이지를 헤더에 추가:

| 위치 | 현재 | 변경 |
|------|------|------|
| AppHeader (데스크톱) | ... 관심종목 | ... 포트폴리오, 관심종목 |
| BottomTabBar (모바일) | MY → /mypage | MY → /mypage (포트폴리오 링크 포함) |
| /mypage | 관심종목 미리보기 | + 포트폴리오 미리보기 카드 |

---

## 6. 변경 파일 요약

### 신규 파일

| 파일 | 설명 |
|------|------|
| `prisma/migrations/xxx_add_portfolio_entry/migration.sql` | DB 마이그레이션 |
| `src/app/portfolio/page.tsx` | 포트폴리오 페이지 |
| `src/app/api/portfolio/route.ts` | GET (조회) + POST (추가) |
| `src/app/api/portfolio/[id]/route.ts` | PATCH (수정) + DELETE (삭제) |
| `src/components/portfolio/portfolio-row.tsx` | 포트폴리오 종목 행 |
| `src/components/portfolio/portfolio-summary.tsx` | 수익률 요약 카드 |
| `src/components/portfolio/add-entry-sheet.tsx` | 종목 추가 모달 |
| `src/hooks/use-watchlist.ts` | 관심종목 토글 커스텀 훅 |

### 수정 파일

| 파일 | 변경 |
|------|------|
| `prisma/schema.prisma` | PortfolioEntry 모델 추가, Stock/User에 relation 추가 |
| `src/proxy.ts` | `/portfolio`, `/api/portfolio` 보호 경로 추가 |
| `src/components/market/stock-row.tsx` | showWatchlist 선택적 prop 추가 |
| `src/components/layout/app-header.tsx` | 포트폴리오 네비게이션 링크 추가 |
| `src/app/mypage/page.tsx` | 포트폴리오 미리보기 카드 추가 |

---

## 7. 구현 순서

| 순서 | 항목 | 예상 시간 | 의존성 |
|------|------|----------|--------|
| 1 | Prisma schema + migration | 15분 | - |
| 2 | API routes (CRUD) | 1시간 | #1 |
| 3 | `use-watchlist` 커스텀 훅 | 20분 | - |
| 4 | 포트폴리오 페이지 (UI) | 2시간 | #2 |
| 5 | StockRow 관심종목 버튼 추가 | 30분 | #3 |
| 6 | 적용 페이지 (시장, ETF, 스크리너 등) | 1시간 | #5 |
| 7 | 네비게이션 + 미들웨어 | 20분 | #4 |
| 8 | 테스트 + 버그 수정 | 1시간 | #7 |

**총 예상 시간: ~6시간**

---

## 8. 향후 확장 (Phase 3+)

| 기능 | 설명 |
|------|------|
| 환율 변환 | USD 종목을 KRW로 환산하여 총 수익률 계산 |
| 배당 수익 추적 | 보유 종목의 배당금 자동 집계 |
| 거래 이력 | 매수/매도 이력 기록, FIFO/평균단가 계산 |
| 차트 | 포트폴리오 가치 변동 시계열 차트 |
| 목표가 알림 | 알림 시스템 연계 |
| 가져오기/내보내기 | CSV 업로드/다운로드 |
