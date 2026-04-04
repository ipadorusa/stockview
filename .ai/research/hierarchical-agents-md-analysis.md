# Hierarchical AGENTS.md Analysis — Real Repository Content

## 1. getsentry/sentry — Directory-Level Split

### File Tree & Sizes

| Path | Size | Lines (est.) | Scope |
|------|------|-------------|-------|
| `AGENTS.md` | 7.8 KB | ~200 | Global: overview, commands, routing |
| `src/AGENTS.md` | 22.9 KB | ~600 | Backend: Django, API, security, patterns |
| `static/AGENTS.md` | 19.3 KB | ~500 | Frontend: React, TypeScript, components |
| `tests/AGENTS.md` | 4.1 KB | ~100 | Testing: pytest, factories, fixtures |
| **Total** | **54.1 KB** | **~1400** | |

### Content at Each Level

#### Root `AGENTS.md` (7.8 KB) — "Hub & Commands"
- Project overview (what Sentry is)
- Project structure tree (top-level directories)
- **Command Execution Guide** — virtualenv requirements, `.venv/bin/` prefix rules
- Setup commands (`make develop`, `devenv sync`, `devservices up`)
- Linting commands (`pre-commit run --files`)
- **Context Map / Routing Table**: explicitly routes agents to sub-files:
  - Backend (`src/**/*.py`) → `src/AGENTS.md`
  - Tests (`tests/**/*.py`) → `tests/AGENTS.md`
  - Frontend (`static/**/*.{ts,tsx}`) → `static/AGENTS.md`
- Pre-commit "before completing a task" checklist

#### `src/AGENTS.md` (22.9 KB) — "Backend Bible"
- Opens with: `> For critical commands, see "Command Execution Guide" in /AGENTS.md`
- Full tech stack (Python 3.13+, Django 5.2+, Celery, ClickHouse, Kafka, GCP)
- Detailed project structure (src/sentry/ subdirectories)
- **Security Guidelines** — IDOR prevention, `self.get_projects()`, organization scoping
- API endpoint patterns (Django REST Framework)
- Model/migration conventions
- Celery task patterns
- Integration development guide

#### `static/AGENTS.md` (19.3 KB) — "Frontend Bible"
- Opens with: `> For critical commands, see "Command Execution Guide" in /AGENTS.md`
- Frontend tech stack (TypeScript, React 19, Rspack, Emotion, Jest)
- File/directory conventions (components, views, stores, actions, utils, types)
- Routing patterns (React Router v6)
- API call patterns (TanStack Query + `apiOptions`)
- **General Rules**: no Reflux stores, no class components, no CSS files, always TypeScript
- UI patterns, core components, design system
- Testing patterns (Jest, React Testing Library)
- Fixture locations

#### `tests/AGENTS.md` (4.1 KB) — "Testing Rules"
- Opens with: `> For critical test commands, see "Command Execution Guide" in /AGENTS.md`
- Test file location convention: `src/sentry/foo/bar.py` → `tests/sentry/foo/test_bar.py`
- "Add to existing test files, don't create new ones"
- pytest patterns, factory methods, fixture usage
- Date-stable test rules (no current/future year hardcoding)
- **MUST use factories** not `Model.objects.create`
- Snuba compatibility tests go in `tests/snuba/`

### Inheritance Pattern
- Sub-files **do NOT repeat** root content; they reference it: `> See /AGENTS.md`
- Root provides the **routing table** pointing to sub-files
- Root owns **shared commands** (setup, linting, venv rules)
- Sub-files own **domain-specific patterns** (security, API design, testing rules)
- No explicit "override" mechanism — each file is additive for its scope

---

## 2. vercel/next.js — Root + Skills Model

### File Tree & Sizes

| Path | Size | Scope |
|------|------|-------|
| `AGENTS.md` (= `CLAUDE.md` symlink) | 21.4 KB | Global: monorepo structure, build, test |
| `.agents/skills/README.md` | 4.5 KB | Skills authoring guide |
| `.agents/skills/authoring-skills/SKILL.md` | 4.1 KB | Meta: how to write skills |
| `.agents/skills/dce-edge/SKILL.md` | 4.1 KB | Dead code elimination edge cases |
| `.agents/skills/flags/SKILL.md` | 3.0 KB | Feature flag implementation |
| `.agents/skills/pr-status-triage/SKILL.md` | 1.8 KB | PR status debugging |
| `.agents/skills/react-vendoring/SKILL.md` | 3.9 KB | React vendoring workflow |
| `.agents/skills/router-act/SKILL.md` | 10.6 KB | Router + React act() testing |
| `.agents/skills/runtime-debug/SKILL.md` | 2.4 KB | Runtime debugging |
| `.agents/skills/update-docs/SKILL.md` | 7.6 KB | Documentation updates |
| `.agents/skills/v8-jit/SKILL.md` | 14.5 KB | V8 JIT optimization |
| `.agents/skills/write-api-reference/SKILL.md` | 7.5 KB | API reference writing |
| `.agents/skills/write-guide/SKILL.md` | 5.1 KB | Guide writing |
| `.claude-plugin/.../SKILL.md` | 16.3 KB | Cache components plugin |
| **Total** | **~106 KB** | |

### Content Split

#### Root `AGENTS.md` (21.4 KB) — "Always Loaded"
- Monorepo overview (packages, turbopack, crates, test, examples, docs)
- Core package (`packages/next`) entry points
- Build commands (`pnpm --filter=next build`, `pnpm build-all`)
- Fast local dev workflow (`pnpm --filter=next dev` watch mode)
- Test commands (unit, integration, e2e with Playwright)
- README reading convention (read all READMEs in directory path before editing)

#### SKILL.md Files — "Loaded On-Demand"
- Each skill has YAML frontmatter: `name`, `description` (key for auto-triggering)
- Only the `description` strings are loaded at session start (cheap)
- Full content loads only when the task matches
- Contains: multi-step workflows, code templates, verification steps, diagnostic procedures
- Example: `v8-jit/SKILL.md` (14.5 KB) — deeply specialized V8 optimization guide

### Key Difference from Sentry
- Next.js uses **on-demand loading** (skills) instead of **directory-scoped** files
- Skills are **task-based** (flag implementation, PR triage) not **location-based** (src/, tests/)
- AGENTS.md holds everything that every session needs; skills hold specialized knowledge

---

## 3. Comparison Summary

| Aspect | Sentry (directory model) | Next.js (skills model) |
|--------|------------------------|----------------------|
| Strategy | One AGENTS.md per major directory | Root AGENTS.md + on-demand SKILL.md |
| Routing | Root has explicit "context map" table | Description-based auto-matching |
| Loading | All files in scope loaded immediately | Only root + matched skills loaded |
| Granularity | By code location (src, tests, static) | By task type (flags, debugging, docs) |
| Root size | 7.8 KB (slim hub) | 21.4 KB (comprehensive) |
| Sub-file size | 4-23 KB each | 2-16 KB each |
| Total instructions | 54 KB | ~106 KB |
| Inheritance | Sub-files reference root with `>` blockquote | Skills are independent; supplement root |

## 4. Key Design Principles Observed

1. **Root = shared commands + routing**: Both repos keep setup/build/lint commands at root level.
2. **No duplication**: Sub-files explicitly reference root (`> See /AGENTS.md`) rather than repeating.
3. **Domain boundaries**: Sentry splits by code area (backend/frontend/tests); Next.js splits by task workflow.
4. **Additive, not override**: Sub-level files add context, they don't contradict or override root rules.
5. **Size sweet spot**: Individual files stay under 25 KB; total can be large because not all loads at once.
6. **Cross-references are explicit**: Sentry root has a routing table; Next.js uses frontmatter descriptions.
