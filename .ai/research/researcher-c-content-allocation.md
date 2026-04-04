# Researcher C: AGENTS.md Content Allocation Strategy

## 1. Content Taxonomy — What Goes Where

### INCLUDE in AGENTS.md (high-value categories)
| Category | Priority | Example |
|---|---|---|
| **Build/test commands** | Highest | `npm run build`, `npm test -- path/to/test.ts` |
| **Tech stack & versions** | High | "Next.js 15 (App Router), TypeScript 5.7 strict" |
| **Project structure** | High | Directory map for monorepos |
| **Critical conventions** | High | "Use named exports", "API returns {data, error}" |
| **PR/Git workflow** | Medium | Title format, required checks before commit |
| **Security rules** | Medium | Only if non-obvious (e.g., "never commit .env") |

### EXCLUDE from AGENTS.md (move elsewhere)
| Category | Reason | Alternative |
|---|---|---|
| **Code style rules** | Deterministic tools do it better | ESLint, Prettier configs |
| **Obvious platitudes** | Wastes tokens ("write clean code") | Delete entirely |
| **Full API docs** | Too large for instruction budget | `docs/` directory, link to it |
| **Task-specific instructions** | Ephemeral, not persistent | Put in prompt, not config |
| **Domain knowledge** | Too verbose | Skills (SKILL.md) or `agent_docs/` |

**Source**: AI config files comparison guide, AI Hero complete guide

## 2. Size Budgets Per Level

### Hard Numbers
| Metric | Value | Source |
|---|---|---|
| **LLM instruction capacity** | ~150-200 instructions reliably followed | HumanLayer (Kyle) |
| **System prompt overhead** | ~50 instructions already used by Claude Code | AI config comparison guide |
| **Effective budget** | ~100-150 instructions for your CLAUDE.md/AGENTS.md | Derived |
| **Root file threshold** | 150-200 lines max before splitting | Augment Code guide |
| **Upper bound (single file)** | 371 lines (canonical/maas repo) | Augment Code guide |
| **Vercel root example** | 176 lines / ~4KB | Vercel repo AGENTS.md |
| **Recommended max (Claude Code)** | Under 300 lines total | AI config comparison guide |

### Split Decision Table
| Condition | Approach |
|---|---|
| Single file under 150-200 lines | Monolithic root file sufficient |
| Rules exceed 150-200 lines | Split: root for org standards, subdirectory for specifics |
| Cross-cutting concerns (security, testing, CI) | Consider tool-specific rule files (e.g., Cursor .mdc) with glob patterns |
| Multiple AI tools | Canonical AGENTS.md + tool-specific symlinks/fallbacks |

**Source**: Augment Code guide

## 3. Content Split — Root vs. Subdirectory

### What Goes Where (AI Hero)
| Level | Content |
|---|---|
| **Root AGENTS.md** | Monorepo purpose, how to navigate packages, shared tools (pnpm workspaces), global build/lint/test commands, repo-wide conventions |
| **Package AGENTS.md** | Package purpose, specific tech stack, package-specific conventions, package-specific test commands |

### Real Example: Vercel Monorepo (44+ packages)
Root AGENTS.md (176 lines) contains:
- Repository structure (`/packages/*`, `/internals/*`, `/crates`, `/examples`, `/utils`)
- Global build commands
- Shared testing conventions

Subdirectory AGENTS.md files contain package-specific overrides.

### Real Example: OpenAI Internal Repo
- **88 AGENTS.md files** across the monorepo
- Each package ships tailored instructions
- "Agents automatically read the nearest file in the directory tree, so the closest one takes precedence"

**Source**: agents.md official website, Vercel repo

### Loading Mechanics
- **Claude Code**: Reads CLAUDE.md from `~/`, project root, and subdirectories — merged in order. Falls back to AGENTS.md if no CLAUDE.md found.
- **Codex/General**: More deeply nested files take precedence in case of conflict.
- **Skills (SKILL.md)**: Load on demand (not at session start), keeping baseline context lean. Specialized knowledge should live in skills.

## 4. Context Window Budget

### The 40% Rule (Dex Horthy)
- For a ~168K token context window, **performance starts declining around 40% utilization** (~67K tokens)
- **Smart Zone** (first ~40%): Focused, accurate reasoning
- **Dumb Zone** (beyond ~40%): Hallucinations, looping, malformed tool calls
- This means AGENTS.md + conversation + tool output must all fit within ~40% for optimal performance

### Budget Calculation Framework
```
Total context window:     ~200K tokens (Claude Opus 4)
Smart zone (40%):          ~80K tokens
  - System prompt:         ~15-20K tokens (Claude Code internals)
  - CLAUDE.md (all levels): ~2-5K tokens (target)
  - MCP tool definitions:  ~5-10K tokens
  - Remaining for work:    ~45-58K tokens
```

### Key Insight: Every Token Loaded on Every Request
"Every token in your AGENTS.md file gets loaded on every single request, regardless of whether it's relevant. This creates a hard budget problem."

Therefore:
- Keep AGENTS.md as small as possible
- Use skills/on-demand loading for specialized knowledge
- Specialized agents with restricted tools outperform general-purpose agents (context management strategy)

## 5. Summary Rules

1. **Root AGENTS.md**: 100-200 lines max. Global commands, structure, conventions.
2. **Subdirectory AGENTS.md**: 50-100 lines each. Package-specific overrides only.
3. **Split at 150-200 lines** — never let a single file exceed 371 lines.
4. **Total across all levels**: Keep combined AGENTS.md under ~5KB / 300 lines.
5. **Exclude**: Style rules (use linters), obvious advice, full docs, task-specific instructions.
6. **Include**: Build commands (#1 priority), tech stack, structure, critical conventions.
7. **Use skills/on-demand** for domain knowledge, API docs, specialized workflows.
8. **40% context utilization** is the empirical ceiling for good LLM performance.
