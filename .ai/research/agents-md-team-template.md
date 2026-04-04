# AGENTS.MD 팀 도입 템플릿 — 실전 구성 가이드

> 작성일: 2026-04-04 | 대상: 10명 팀 (Cursor 10명, Claude Code 3명, Codex 1명)
> 공통 스택: Next.js (App Router) + React Query + Zustand + TypeScript

---

## 전제 조건

- 여러 개의 모노레포에서 **공통 스택**이 동일
- 프로젝트마다 도메인은 다르지만 기술 컨벤션은 통일
- 목표: **파일 1개(AGENTS.md)로 10명 전원 동일 규칙**

---

## 파일 구조

```
project/
├── AGENTS.md                    ← Root: 공통 규칙 + 라우팅 (~120줄)
├── CLAUDE.md                    ← "@AGENTS.md" 한 줄 (Claude Code 3명용)
│
├── src/
│   ├── app/
│   │   ├── AGENTS.md            ← App Router + API Route 규칙 (~60줄)
│   │   └── api/
│   │       └── AGENTS.md        ← API 엔드포인트 전용 규칙 (~50줄)
│   │
│   ├── components/
│   │   └── AGENTS.md            ← 컴포넌트 설계 규칙 (~50줄)
│   │
│   ├── hooks/
│   │   └── AGENTS.md            ← React Query + Zustand 규칙 (~40줄)
│   │
│   └── lib/
│       └── AGENTS.md            ← 유틸리티 + 외부 API 규칙 (~30줄)
│
└── .cursor/rules/
    └── common.mdc               ← Cursor 전용 설정 (있으면 유지, AGENTS.md 우선)
```

### 크기 예산

| 파일 | 줄수 | 로딩 시점 |
|------|------|-----------|
| Root AGENTS.md | ~120줄 | 항상 |
| src/app/AGENTS.md | ~60줄 | app/ 편집 시 |
| src/app/api/AGENTS.md | ~50줄 | api/ 편집 시 |
| src/components/AGENTS.md | ~50줄 | components/ 편집 시 |
| src/hooks/AGENTS.md | ~40줄 | hooks/ 편집 시 |
| src/lib/AGENTS.md | ~30줄 | lib/ 편집 시 |
| **상시 로딩** | **~120줄** | Root만 |
| **최대 동시 로딩** | **~180줄** | Root + 1~2개 하위 |

---

## 1. Root `AGENTS.md` (~120줄)

```markdown
# [프로젝트명] — AI Agent Guide

## 기술 스택
- Next.js (App Router) + React 19 + TypeScript strict
- TanStack React Query v5 (서버 상태)
- Zustand (클라이언트 상태 — 최소한으로 사용)
- Tailwind CSS

## 명령어

### 개발
- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm typecheck` — TypeScript 검사
- `pnpm lint` — ESLint

### 테스트
- `pnpm test` — 전체 테스트
- `pnpm test -- path/to/file.test.ts` — 단일 파일

## 프로젝트 구조

```
src/
├── app/           → 라우트 + API (App Router)
├── components/    → 재사용 UI 컴포넌트
├── hooks/         → React Query 훅 + Zustand 스토어
└── lib/           → 유틸리티, API 클라이언트, 상수
```

## 폴더별 가이드 — 편집 시 해당 파일도 읽을 것

| 편집 위치 | 추가로 읽을 파일 |
|---|---|
| `src/app/**` (페이지/레이아웃) | `src/app/AGENTS.md` |
| `src/app/api/**` (API 라우트) | `src/app/api/AGENTS.md` |
| `src/components/**` | `src/components/AGENTS.md` |
| `src/hooks/**` | `src/hooks/AGENTS.md` |
| `src/lib/**` | `src/lib/AGENTS.md` |

## 공통 TypeScript 규칙
- strict 모드. `any` 금지 — `unknown` + 타입 가드 사용.
- named export만. default export는 Next.js 페이지(page.tsx, layout.tsx)만 허용.
- 인터페이스보다 `type` 선호 (union, intersection 활용).
- 매직 넘버 금지 — 상수로 추출하여 `lib/constants.ts`에 배치.

## 서버 vs 클라이언트 구분
- **기본은 Server Component**. `'use client'`는 상호작용이 필요할 때만.
- 서버에서 할 수 있는 일(데이터 fetch, 메타데이터)은 서버에서.
- `'use client'` 경계는 가능한 트리 하단으로 내림 (최소 범위).

## 상태 관리 원칙
- **서버 상태 = React Query** (API 데이터, 캐시, 동기화).
- **클라이언트 상태 = Zustand** (UI 상태, 모달, 사이드바).
- Zustand 스토어가 3개 이상이면 설계 재검토.
- React Query로 충분한 곳에 Zustand 쓰지 말 것.

## Git & PR
- 커밋: Conventional Commits (`feat:`, `fix:`, `chore:`)
- PR: 400줄 이하 권장. 넘으면 분리.
- 머지 전 `pnpm typecheck && pnpm lint && pnpm test` 통과 필수.

## 환경 변수
- 서버 전용: `DATABASE_URL`, `API_SECRET` 등 — 절대 `NEXT_PUBLIC_` 붙이지 말 것.
- 클라이언트 허용: `NEXT_PUBLIC_API_URL` 등 노출 가능한 것만.
- `.env` 파일 커밋 금지. `.env.example`만 커밋.

## 작업 완료 전 체크리스트
1. `pnpm typecheck` 통과
2. `pnpm lint` 통과
3. 관련 테스트 통과
4. `'use client'` 남용 없는지 확인
```

---

## 2. `src/app/AGENTS.md` — 페이지 & 레이아웃 (~60줄)

```markdown
# App Router — 페이지 & 레이아웃 규칙

> 공통 명령어와 TypeScript 규칙은 /AGENTS.md 참조

## App Router 파일 컨벤션
- `page.tsx` — 라우트의 UI (default export 필수)
- `layout.tsx` — 공유 레이아웃 (children prop)
- `loading.tsx` — Suspense 폴백 (비동기 페이지에 반드시 제공)
- `error.tsx` — 에러 바운더리 (`'use client'` 필수)
- `not-found.tsx` — 404 처리

## 데이터 페칭
- Server Component에서 직접 `fetch` 또는 서버 함수 호출.
- 클라이언트에서 데이터가 필요하면 React Query 훅 사용 (`src/hooks/` 참조).
- `getServerSideProps`, `getStaticProps` 사용 금지 — App Router 패턴 사용.

## 라우트 구성
- 동적 세그먼트: `[slug]` — 의미 있는 이름 사용 (`[id]` 지양).
- 라우트 그룹: `(auth)`, `(public)` — 레이아웃 공유 용도.
- 인터셉팅/패러렐 라우트: 모달에만 사용, 남용 금지.

## 메타데이터
- 정적: `export const metadata: Metadata = { ... }`
- 동적: `export async function generateMetadata({ params })`
- 모든 페이지에 title + description 필수.

## Don'ts
- page.tsx에 비즈니스 로직 넣지 말 것 — 데이터 fetch + 컴포넌트 조합만.
- page.tsx에 `'use client'` 넣지 말 것 — 하위 컴포넌트에서 처리.
- `useRouter` (next/navigation) 이외의 라우팅 방법 사용 금지.
- `redirect()`는 Server Component/Server Action에서만.
```

---

## 3. `src/app/api/AGENTS.md` — API Route 전용 (~50줄)

```markdown
# API Route 규칙

> 공통 명령어와 TypeScript 규칙은 /AGENTS.md 참조

## Route Handler 패턴
```typescript
// 표준 구조: 검증 → 인증 → 비즈니스 로직 → 응답
export async function POST(request: Request) {
  const body = schema.parse(await request.json())  // Zod 검증
  const session = await auth()                      // 인증 확인
  const result = await service.create(body)         // 로직은 lib/에
  return Response.json({ data: result }, { status: 201 })
}
```

## 응답 형식
- 성공: `{ data: T }`
- 에러: `{ error: { code: string, message: string } }`
- 목록: `{ data: T[], total: number, page: number }`

## 입력 검증
- 모든 요청 body는 Zod 스키마로 검증.
- `request.json()`을 직접 사용하지 말고 항상 parse 통과.
- Query params도 Zod로 검증 (`searchParams`).

## 에러 처리
- try-catch로 감싸고, 에러 형식 통일.
- 내부 에러 메시지/스택 트레이스 절대 클라이언트에 노출 금지.
- 적절한 HTTP 상태 코드 사용 (200, 201, 400, 401, 403, 404, 500).

## Don'ts
- Route Handler에 직접 DB 쿼리 넣지 말 것 — `lib/` 서비스 레이어 사용.
- `console.log` 대신 구조화된 로깅 사용.
- GET 요청으로 데이터 변경 금지.
- API Route에서 다른 API Route 호출 금지 — 서비스 함수를 직접 호출.
```

---

## 4. `src/components/AGENTS.md` — 컴포넌트 설계 (~50줄)

```markdown
# 컴포넌트 규칙

> 공통 TypeScript 규칙은 /AGENTS.md 참조

## 파일 구조
```
components/
├── ui/              → 범용 UI (Button, Input, Modal, Card)
├── feature/         → 도메인 특화 (TaskCard, UserAvatar, PriceChart)
└── layout/          → 레이아웃 (Header, Sidebar, Footer)
```

## 네이밍
- 파일: `kebab-case.tsx` (예: `task-card.tsx`)
- 컴포넌트: `PascalCase` (예: `TaskCard`)
- Props: `[컴포넌트명]Props` (예: `TaskCardProps`)
- 테스트: 같은 위치에 `task-card.test.tsx`

## 컴포넌트 작성 규칙
- 함수 선언문 사용: `function TaskCard()` (not `const TaskCard = () =>`)
- Props는 `type`으로 정의, 구조 분해로 받기.
- React 19: `ref`는 일반 prop — `forwardRef` 불필요.
- children이 있으면 `PropsWithChildren` 또는 명시적 `children: ReactNode`.

## Server vs Client
- **기본 Server Component** — `'use client'` 없이 시작.
- 이벤트 핸들러(onClick, onChange), 훅(useState, useEffect), 브라우저 API 사용 시에만 `'use client'`.
- `'use client'` 컴포넌트는 가능한 작게 — 큰 컴포넌트의 상호작용 부분만 분리.

## 스타일링
- Tailwind 클래스만 사용. CSS 파일, inline style 금지.
- 조건부 클래스: `cn()` 유틸 사용 (clsx + twMerge).
- 반응형: mobile-first (`sm:`, `md:`, `lg:`).

## Don'ts
- 컴포넌트 안에서 직접 fetch 금지 — React Query 훅 또는 Server Component에서 처리.
- Props drilling 3단계 이상이면 구조 재설계 (composition 패턴 또는 Zustand).
- `useEffect`로 데이터 fetch 금지 — React Query 사용.
- `any` 타입의 props 금지.
```

---

## 5. `src/hooks/AGENTS.md` — React Query + Zustand (~40줄)

```markdown
# Hooks 규칙 — React Query + Zustand

> 공통 TypeScript 규칙은 /AGENTS.md 참조

## React Query 훅

### 네이밍
- 조회: `useTask`, `useTasks`, `useTasksByStatus`
- 변경: `useCreateTask`, `useUpdateTask`, `useDeleteTask`
- 파일: `use-tasks.ts` (도메인 단위로 그룹)

### 패턴
```typescript
// 조회 훅
export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.tasks.list(filters),
  })
}

// 변경 훅
export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.tasks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

### queryKey 규칙
- 배열 형태: `['도메인', ...params]`
- 계층적: `['tasks']` → `['tasks', taskId]` → `['tasks', taskId, 'comments']`
- invalidation은 상위 키로: `queryKey: ['tasks']`하면 하위 전체 무효화.

## Zustand 스토어

### 사용 범위
- UI 상태만: 모달 열림/닫힘, 사이드바 토글, 테마, 필터 상태.
- API 데이터는 React Query에서. Zustand에 서버 데이터 복사 금지.

### 패턴
```typescript
// 슬라이스 패턴 — 스토어당 1파일
export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

## Don'ts
- React Query 있는 곳에 `useEffect` + `useState`로 fetch 금지.
- Zustand에 서버 데이터 저장 금지 — 캐시 동기화 지옥됨.
- 전역 스토어 남용 금지 — prop으로 충분하면 prop 사용.
- `queryKey`에 객체 직접 넣지 말 것 — 직렬화 문제.
```

---

## 6. `src/lib/AGENTS.md` — 유틸리티 & API 클라이언트 (~30줄)

```markdown
# Lib 규칙 — 유틸리티 & API 클라이언트

> 공통 TypeScript 규칙은 /AGENTS.md 참조

## 구조
```
lib/
├── api.ts          → API 클라이언트 (fetch wrapper)
├── constants.ts    → 공유 상수
├── utils.ts        → 범용 유틸 (날짜, 문자열, 포맷)
└── validators.ts   → 공유 Zod 스키마
```

## API 클라이언트 규칙
- `fetch` 래퍼로 base URL, 인증 헤더, 에러 처리 통일.
- 응답 타입은 제네릭: `api.get<Task[]>('/tasks')`.
- 에러 시 throw — React Query의 onError에서 처리.

## 유틸리티 규칙
- 순수 함수만. 부수 효과(I/O, DOM, 전역 상태 변경) 금지.
- 단위 테스트 필수 — 모든 유틸 함수에 `.test.ts` 파일.
- 범용이 아니면 여기 넣지 말 것 — 특정 도메인 로직은 해당 폴더에.

## Don'ts
- `lib/`에 컴포넌트 넣지 말 것.
- `lib/`에 훅 넣지 말 것 — `hooks/`에 배치.
- 외부 API 키를 코드에 하드코딩 금지 — 환경 변수 사용.
```

---

## 7. `CLAUDE.md` — Claude Code 사용자용 (1줄)

```markdown
@AGENTS.md
```

이것만 있으면 Claude Code가 세션 시작 시 AGENTS.md 전체를 로딩합니다.

Claude Code 전용 설정이 필요하면 아래에 추가:

```markdown
@AGENTS.md

## Claude Code 전용
- plan mode 사용: `src/app/api/` 변경 시
- 대규모 리팩토링은 worktree에서 진행
```

---

## 8. 도입 실행 계획

### Day 1 (30분)
```bash
# 1. Root AGENTS.md 생성 (위 템플릿 복사 후 프로젝트에 맞게 수정)
# 2. Claude Code 호환
echo "@AGENTS.md" > CLAUDE.md
# 3. 커밋
git add AGENTS.md CLAUDE.md
git commit -m "chore: add AGENTS.md for cross-tool AI agent instructions"
```

### Day 2~3 (각 15분)
- 하위 폴더 AGENTS.md 추가 (가장 자주 작업하는 폴더부터)
- `.cursor/rules/`에 중복 내용 있으면 AGENTS.md로 이동

### Week 2~
- AI가 실수할 때마다 해당 규칙을 AGENTS.md에 추가
- **"실패 일지가 최고의 AGENTS.md"** — 사전에 완벽하게 쓰려 하지 말 것

### 분기별
- `Last reviewed: YYYY-QN` 업데이트
- 낡은 규칙 정리 (잘못된 지시 > 지시 없음)

---

## 9. 콘텐츠 배분 요약표

| 위치 | 넣을 것 | 넣지 말 것 |
|------|---------|-----------|
| **Root** | 빌드/테스트 명령, TS 규칙, 서버/클라이언트 구분, 상태 관리 원칙, Git 규칙, 환경 변수 | 폴더별 세부 패턴, 코드 예시 남발 |
| **app/** | App Router 컨벤션, 메타데이터, 라우팅 | 컴포넌트 스타일링, API 상세 |
| **app/api/** | Route Handler 패턴, 응답 형식, 에러 처리 | DB 쿼리 방법, 인증 구현 상세 |
| **components/** | 파일 구조, 네이밍, Server/Client 구분, 스타일링 | 비즈니스 로직, 데이터 fetch |
| **hooks/** | React Query 패턴, Zustand 패턴, queryKey 규칙 | API 엔드포인트 목록, DB 스키마 |
| **lib/** | API 클라이언트 규칙, 유틸 규칙 | 도메인 로직, 컴포넌트, 훅 |

---

*팀 도입 템플릿 완료: 2026-04-04*
*대상: Next.js + React Query + Zustand + TypeScript 모노레포 공통*
