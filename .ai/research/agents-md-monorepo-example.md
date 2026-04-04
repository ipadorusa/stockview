# AGENTS.MD 모노레포 구성 예시 — 실전 템플릿

> 작성일: 2026-04-04 | 기반: 3-Agent Team 리서치 (Sentry, Next.js, Datadog, OpenAI 패턴 종합)

---

## 가상 프로젝트: "TaskFlow" — B2B SaaS 태스크 관리 플랫폼

### 기술 스택
- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5.8
- **Backend API**: Node.js + Hono (REST + WebSocket)
- **Shared**: Zod schemas, Design System
- **Infra**: Docker, Terraform, GitHub Actions
- **DB**: PostgreSQL (Prisma), Redis (BullMQ)

---

## 파일 트리 & 크기 예산

```
taskflow/
├── AGENTS.md                          ← Root: 허브 + 라우터 (~120줄, ~3KB)
├── CLAUDE.md → AGENTS.md              ← 심링크 (Claude Code 호환)
│
├── packages/
│   ├── web/AGENTS.md                  ← 프론트엔드 규칙 (~80줄, ~2KB)
│   ├── api/AGENTS.md                  ← 백엔드 API 규칙 (~70줄, ~1.8KB)
│   ├── shared/AGENTS.md               ← 공유 패키지 규칙 (~40줄, ~1KB)
│   └── design-system/AGENTS.md        ← 디자인 시스템 규칙 (~50줄, ~1.2KB)
│
├── infra/AGENTS.md                    ← 인프라 규칙 (~40줄, ~1KB)
│
└── .agents/                           ← Skills (on-demand)
    └── skills/
        ├── migration/SKILL.md         ← DB 마이그레이션 가이드
        ├── pr-review/SKILL.md         ← PR 리뷰 체크리스트
        └── incident-response/SKILL.md ← 장애 대응 가이드
```

### 크기 예산 총괄

| 파일 | 줄수 | 크기 | 로딩 |
|------|------|------|------|
| Root AGENTS.md | ~120줄 | ~3KB | 항상 |
| packages/web/ | ~80줄 | ~2KB | web 편집 시 |
| packages/api/ | ~70줄 | ~1.8KB | api 편집 시 |
| packages/shared/ | ~40줄 | ~1KB | shared 편집 시 |
| packages/design-system/ | ~50줄 | ~1.2KB | ds 편집 시 |
| infra/ | ~40줄 | ~1KB | infra 편집 시 |
| **상시 로딩 합산** | **~120줄** | **~3KB** | Root만 |
| **최대 동시 로딩** | **~200줄** | **~5KB** | Root + 1개 하위 |
| Skills (on-demand) | 각 50~150줄 | 각 1~4KB | 필요 시에만 |

---

## 1. Root `AGENTS.md` (~120줄)

**심링크 설정** (프로젝트 루트에서 1회 실행):
```bash
# AGENTS.md를 원본으로, CLAUDE.md를 심링크로 생성
# → Claude Code는 CLAUDE.md를 읽고, 다른 도구는 AGENTS.md를 읽음
ln -s AGENTS.md CLAUDE.md

# 확인
ls -la CLAUDE.md
# lrwxr-xr-x  CLAUDE.md -> AGENTS.md

# Git은 심링크를 네이티브로 추적하므로 별도 설정 불필요
# 단, git config core.symlinks가 true인지 확인 (Windows에서는 기본 false)
git config core.symlinks
```

> **주의**: Windows (Developer Mode 미활성), 일부 CI 환경에서 심링크가 깨질 수 있음.
>
> **대안 1 (빌드 스크립트)**: CI/hook에서 자동 복사
> ```bash
> # package.json scripts 또는 husky pre-commit hook
> cp AGENTS.md CLAUDE.md
> ```
>
> **대안 2 (Datadog 방식)**: `CLAUDE.md`에 최소 내용만 작성
> ```markdown
> # Claude Code Configuration
> All project instructions are in AGENTS.md. Read that file first.
> ```

---

```markdown
# TaskFlow — AI Agent Guide

## Project Overview
B2B SaaS task management platform. Monorepo with pnpm workspaces + Turborepo.

## Quick Commands

### Build & Dev
- `pnpm install` — Install all dependencies
- `pnpm dev` — Start all packages in dev mode (turbo)
- `pnpm dev --filter=web` — Frontend only
- `pnpm dev --filter=api` — Backend only
- `pnpm build` — Production build (turbo, cached)
- `pnpm typecheck` — TypeScript check across all packages

### Test
- `pnpm test` — Run all tests (vitest)
- `pnpm test --filter=web` — Frontend tests only
- `pnpm test --filter=api` — Backend tests only
- `pnpm test -- path/to/file.test.ts` — Single file
- `pnpm e2e` — Playwright E2E tests (requires `pnpm dev` running)

### Lint & Format
- `pnpm lint` — ESLint across all packages
- `pnpm format` — Prettier check
- `pnpm format:fix` — Prettier fix

### Database
- `pnpm db:generate` — Prisma generate (run after schema changes)
- `pnpm db:migrate` — Create & apply migration
- `pnpm db:seed` — Seed development data
- `pnpm db:studio` — Open Prisma Studio

## Project Structure

```
packages/
├── web/           → Next.js 16 frontend (App Router)
├── api/           → Hono REST API + WebSocket server
├── shared/        → Zod schemas, types, utilities
└── design-system/ → React component library (Radix + Tailwind)

infra/             → Terraform (AWS), Docker, GitHub Actions
docs/              → Architecture decisions, API specs
```

## Context Map — Read the Right File

| You're editing... | Also read |
|---|---|
| `packages/web/**` | `packages/web/AGENTS.md` |
| `packages/api/**` | `packages/api/AGENTS.md` |
| `packages/shared/**` | `packages/shared/AGENTS.md` |
| `packages/design-system/**` | `packages/design-system/AGENTS.md` |
| `infra/**` | `infra/AGENTS.md` |

> **크로스 패키지 작업** (예: API 엔드포인트 + 프론트 페이지 + 공유 스키마):
> 관련 패키지의 AGENTS.md를 모두 참조하되, 동시 로딩되는 총 크기가 ~10KB를 넘지 않도록 주의.

## Skills — On-Demand 전문 가이드

특정 작업에서만 필요한 심층 지식은 `.agents/skills/`에 배치:

| 작업 | 읽을 파일 |
|------|-----------|
| DB 마이그레이션 | `.agents/skills/migration/SKILL.md` |
| PR 리뷰 | `.agents/skills/pr-review/SKILL.md` |
| 장애 대응 | `.agents/skills/incident-response/SKILL.md` |

## Shared Conventions

### TypeScript
- Strict mode enabled. Never use `any` — use `unknown` + type guard.
- Named exports only. No default exports except Next.js pages.
- Import from package name (`@taskflow/shared`), not relative paths across packages.

### Git & PR
- Branch: `feat/TF-123-short-desc`, `fix/TF-456-short-desc`
- Commit: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- PR title: `feat(web): add kanban board view`
- PR must pass CI (typecheck + lint + test) before merge.
- One approval required. Self-merge allowed for `chore:` and `docs:`.

### Environment Variables
- Never commit `.env` files. Use `.env.example` as template.
- Server secrets: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`
- Client-safe only: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- Never prefix secrets with `NEXT_PUBLIC_`.

## Before Completing a Task
1. Run `pnpm typecheck` — must pass
2. Run `pnpm lint` — must pass
3. Run relevant tests — must pass
4. If you changed `packages/shared/`, run tests in ALL dependent packages
```

---

## 2. `packages/web/AGENTS.md` (~80줄)

```markdown
# TaskFlow Web — Frontend Agent Guide

> For build/test commands and shared conventions, see /AGENTS.md

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript 5.8 strict
- TanStack Query v5 for server state
- Zustand for client state (minimal — prefer server state)
- Tailwind CSS 4 + @taskflow/design-system components
- Playwright for E2E tests

## Directory Structure
```
src/
├── app/              → Routes (App Router file conventions)
│   ├── (auth)/       → Auth-required routes (layout with session check)
│   ├── (public)/     → Public routes (landing, pricing)
│   └── api/          → Route handlers (prefer packages/api for business logic)
├── components/       → Page-specific components
├── hooks/            → Custom React hooks
├── lib/              → Utilities, API client, constants
└── styles/           → Global styles, Tailwind config
```

## Patterns

### Data Fetching
- Server Components by default. Use `'use client'` only when needed.
- API calls: use `@taskflow/shared` Zod schemas for request/response validation.
- Mutations: TanStack Query `useMutation` + optimistic updates for UX.

### Components
- Use `@taskflow/design-system` components. Don't create custom Button, Input, etc.
- File naming: `kebab-case.tsx` for components, `use-kebab-case.ts` for hooks.
- Co-locate test file: `kanban-board.tsx` → `kanban-board.test.tsx`

### Routing
- Dynamic routes: `[taskId]` not `[id]` — descriptive param names.
- Loading states: always provide `loading.tsx` for async routes.
- Error boundaries: `error.tsx` at each route group level.

## Don'ts
- No `useEffect` for data fetching — use TanStack Query or Server Components.
- No CSS files — Tailwind only. No inline `style={}`.
- No `any` type. No `as` type assertion unless in test files.
- No direct DOM manipulation — React refs only when absolutely needed.
- No `localStorage` for auth tokens — httpOnly cookies via API.

## Testing
- Unit: Vitest + React Testing Library
- E2E: Playwright (`pnpm e2e`)
- Test user interactions, not implementation details.
- Mock API calls with MSW (Mock Service Worker), not manual fetch mocks.
```

---

## 3. `packages/api/AGENTS.md` (~70줄)

```markdown
# TaskFlow API — Backend Agent Guide

> For build/test commands and shared conventions, see /AGENTS.md

## Tech Stack
- Hono (lightweight, edge-compatible framework)
- Prisma 7 (PostgreSQL)
- BullMQ (Redis-based job queue)
- Zod validation on all inputs (from @taskflow/shared)
- JWT auth (access: 15min, refresh: 7d)

## Directory Structure
```
src/
├── routes/           → Hono route handlers (grouped by domain)
│   ├── tasks/        → /api/tasks/* CRUD + filters
│   ├── auth/         → /api/auth/* login, register, refresh
│   ├── teams/        → /api/teams/* team management
│   └── webhooks/     → /api/webhooks/* Stripe, GitHub
├── middleware/        → Auth, rate-limit, error handler, logging
├── services/         → Business logic (called by routes)
├── jobs/             → BullMQ job processors
├── lib/              → DB client, Redis client, utilities
└── prisma/           → Schema, migrations, seed
```

## Patterns

### Route Handler
```typescript
// Always: validate → authorize → service → respond
app.post('/tasks', authMiddleware, async (c) => {
  const body = createTaskSchema.parse(await c.req.json())
  const task = await taskService.create(body, c.get('userId'))
  return c.json({ data: task }, 201)
})
```

### Error Handling
- Services throw `AppError(code, message, statusCode)`.
- Global error middleware catches and formats: `{ error: { code, message } }`.
- Never expose stack traces or internal details in responses.

### Database
- Always use Prisma transactions for multi-table writes.
- Upsert for idempotent operations.
- Soft delete (`deletedAt` timestamp), never hard delete user data.
- Index frequently filtered columns. Check `prisma/schema.prisma` before adding.

### Security
- Rate limit: 100 req/min per user (auth routes: 10 req/min).
- Input validation: Zod on every route. No raw `req.body` access.
- SQL injection: impossible with Prisma, but never use `$queryRaw` with interpolation.
- CORS: explicit allowlist, not `*`.

## Don'ts
- No business logic in route handlers — extract to services/.
- No direct `prisma` import in routes — use service layer.
- No `console.log` — use structured logger (`lib/logger.ts`).
- No synchronous heavy computation — offload to BullMQ jobs.
```

---

## 4. `packages/shared/AGENTS.md` (~40줄)

```markdown
# TaskFlow Shared — Shared Package Agent Guide

> For build/test commands and shared conventions, see /AGENTS.md

## Purpose
Cross-package types, Zod schemas, and utilities. Zero runtime dependencies.

## Structure
```
src/
├── schemas/     → Zod schemas (source of truth for API contracts)
├── types/       → TypeScript types derived from schemas
├── constants/   → Shared constants (roles, statuses, limits)
└── utils/       → Pure utility functions (date, string, validation)
```

## Rules
- This package is imported by BOTH web and api. Keep it dependency-free.
- Zod schemas define the API contract. Change here = change everywhere.
- Export types with `z.infer<typeof schema>` — don't duplicate type definitions.
- All functions must be pure (no side effects, no I/O).
- 100% test coverage required — these are shared foundations.

## When Modifying Schemas
1. Update the Zod schema in `schemas/`
2. Run `pnpm typecheck` across ALL packages (breaking change detection)
3. Run `pnpm test --filter=api --filter=web` (both consumers)
4. Update API docs if endpoint contract changed

## Don'ts
- No React imports — this package must work in Node.js too.
- No environment-specific code (no `process.env`, no `window`).
- No barrel exports (`index.ts`) — import from specific files.
```

---

## 5. `packages/design-system/AGENTS.md` (~50줄)

```markdown
# TaskFlow Design System — Component Library Agent Guide

> For build/test commands and shared conventions, see /AGENTS.md

## Tech Stack
- React 19, TypeScript 5.8
- Radix UI primitives (accessibility built-in)
- Tailwind CSS 4 + tailwind-variants for variant styling
- Storybook 8 for component documentation

## Structure
```
src/
├── components/    → UI components (Button, Input, Dialog, etc.)
│   └── button/
│       ├── button.tsx         → Component implementation
│       ├── button.test.tsx    → Unit tests
│       └── button.stories.tsx → Storybook stories
├── tokens/        → Design tokens (colors, spacing, typography)
└── utils/         → Component utilities (cn, variants)
```

## Patterns
- Every component: `ComponentProps` interface extending HTML element props.
- React 19: `ref` is a regular prop — no `forwardRef` needed.
- Variants via `tailwind-variants` (tv function), not conditional classNames.
- Compound components for complex UI (Dialog.Root, Dialog.Trigger, Dialog.Content).

## Accessibility
- All interactive components must be keyboard navigable.
- Use Radix primitives — don't build custom dropdowns, modals, etc.
- ARIA labels required for icon-only buttons.
- Color contrast: WCAG AA minimum (4.5:1 text, 3:1 large text).

## Testing
- Unit: interaction tests with React Testing Library.
- Visual: Storybook stories (one per variant combination).
- `pnpm storybook` — Start Storybook dev server (port 6006).

## Don'ts
- No business logic — components are pure UI.
- No API calls or data fetching inside components.
- No hardcoded colors — use design tokens only.
- No `px` units — use Tailwind spacing scale.
```

---

## 6. `infra/AGENTS.md` (~40줄)

```markdown
# TaskFlow Infra — Infrastructure Agent Guide

> For shared conventions, see /AGENTS.md

## Tech Stack
- Terraform 1.8+ (AWS provider)
- Docker (multi-stage builds)
- GitHub Actions (CI/CD)

## Structure
```
infra/
├── terraform/
│   ├── modules/       → Reusable modules (vpc, rds, ecs, redis)
│   ├── environments/  → Per-env configs (dev, staging, prod)
│   └── backend.tf     → S3 state backend
├── docker/
│   ├── web.Dockerfile
│   └── api.Dockerfile
└── .github/workflows/ → CI/CD pipelines
```

## Rules
- Always `terraform plan` before `terraform apply`.
- Never modify prod resources without PR review.
- Use modules for reusable infrastructure. No inline resources in environments/.
- All secrets in AWS Secrets Manager, referenced via data sources.
- Docker images: multi-stage build, final stage from `distroless`.

## Don'ts
- No hardcoded IPs, ARNs, or account IDs — use variables/data sources.
- No `terraform apply` on prod from local machine — CI/CD only.
- No root credentials — IAM roles with least privilege.
- Never commit `.tfstate` files — S3 backend only.
```

---

## 7. Skills (On-Demand) 예시

### `.agents/skills/migration/SKILL.md`

```markdown
---
name: database-migration
description: Guide for creating and applying Prisma database migrations safely
trigger:
  - "prisma/migrations/**"
  - "schema.prisma"
  - "db:migrate"
---

# Database Migration Guide

## When to Use
- Adding/modifying tables or columns
- Creating indexes
- Data migrations

## Steps

### 1. Schema Change
Edit `packages/api/prisma/schema.prisma`

### 2. Generate Migration
```bash
cd packages/api
pnpm db:migrate --name descriptive_name
```

### 3. Review Generated SQL
- Check `prisma/migrations/<timestamp>_descriptive_name/migration.sql`
- Verify no data loss (ALTER vs DROP+CREATE)
- Verify indexes on foreign keys

### 4. Test
- Run `pnpm db:seed` to verify seed still works
- Run `pnpm test --filter=api` to verify existing tests pass

### 5. Rollback Plan
- Document rollback SQL in PR description
- For destructive changes (column removal), use 2-phase:
  1. PR1: Stop writing to column, add new column
  2. PR2: Migrate data, remove old column

## Don'ts
- Never use `db push` in production — always `migrate deploy`
- Never rename columns — add new, migrate data, drop old
- Never make columns NOT NULL without a default value on existing data
```

---

## 8. 설계 원칙 요약

### 콘텐츠 배분 공식

```
Root에 넣을 것:
  = "모든 세션에서 항상 필요한가?" → Yes → Root

하위에 넣을 것:
  = "이 디렉토리에서만 필요한가?" → Yes → 해당 디렉토리

Skills에 넣을 것:
  = "가끔 특정 작업에서만 필요한가?" → Yes → SKILL.md

어디에도 넣지 말 것:
  = "에이전트가 코드를 읽으면 알 수 있는가?" → Yes → 삭제
  = "린터/포맷터가 처리하는가?" → Yes → 삭제
```

### 크기 체크리스트

- [ ] Root AGENTS.md < 200줄 / 4KB
- [ ] 각 하위 파일 < 100줄 / 2KB
- [ ] 상시 로딩 합산 < 300줄 / 5KB
- [ ] **전체 합산 < 32 KiB** (OpenAI Codex 하드 리밋, 초과 시 조용히 잘림)
- [ ] 레벨 간 내용 중복 없음
- [ ] 하위 파일은 `> See /AGENTS.md` 로 Root 참조
- [ ] 빌드/테스트 명령이 Root 상단에 배치
- [ ] "하지 말 것" 섹션이 각 파일에 존재
- [ ] LLM 자동 생성이 아닌 인간 작성
- [ ] 각 파일에 `Last reviewed: YYYY-QN` 날짜 표기 (분기별 리뷰 권장)
- [ ] 모든 줄이 ETH Zurich 테스트 통과: "이 줄을 제거하면 복구 불가능한 실수가 발생하는가?"

### 지시 수용 능력 참고 (HumanLayer 연구)

```
LLM 지시 수용 능력:    ~150-200개 지시 (동시 처리 가능)
시스템 프롬프트 사용:   ~50개 (Claude Code, Codex 등 내부)
실효 예산:             ~100-150개 지시 ← 당신의 AGENTS.md 전체가 이 안에 들어와야 함
```

> **팁**: "지시 1개 = 마크다운 리스트 아이템 1개 또는 규칙 1문장"으로 세면
> Root ~50개 + 하위 ~30개 + Skill ~20개 = ~100개 — 안전 구간

---

## 9. 리뷰 반영 이력

| 날짜 | 리뷰어 | 주요 변경 |
|------|--------|-----------|
| 2026-04-04 | Reviewer A | .gitattributes 삭제, @import 제거, SKILL.md trigger 추가 |
| 2026-04-04 | Reviewer B | forwardRef→React 19 수정, 32KiB 리밋 추가, 지시 수용 능력 추가 |

---

*가상 모노레포 AGENTS.md 구성 예시 완료: 2026-04-04 (리뷰 반영 v2)*
