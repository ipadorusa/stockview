# Hierarchical AGENTS.md Best Practices — Research Findings

Research date: 2026-04-04
Sources: agents.md official site, OpenAI Codex docs, Datadog (dev.to), Nx blog, Cursor docs, AI Hero guide

---

## 1. Official AGENTS.md Spec (agents.md)

**Inheritance model**: Nearest-file-wins. The closest AGENTS.md to the edited file takes precedence. Explicit user chat prompts override everything.

**No formal spec for merging** — the site says "agents automatically read the nearest file in the directory tree." Implementation details vary by tool.

**Content recommendations** (what to include):
- Project overview
- Build and test commands
- Code style guidelines
- Testing instructions
- Security considerations
- Commit/PR guidelines, deployment steps

**Scale reference**: OpenAI's main repo has 88 AGENTS.md files.

**No size limits specified** at the spec level — that's tool-specific.

---

## 2. OpenAI Codex — Most Detailed Discovery Spec

**Source**: https://developers.openai.com/codex/guides/agents-md/

### Discovery Precedence (3 layers)

1. **Global scope** (`~/.codex/`): Reads `AGENTS.override.md` first, else `AGENTS.md`. Only one file at this level.
2. **Project scope** (git root → cwd): Walks each directory from root down to cwd. Per directory checks: `AGENTS.override.md` → `AGENTS.md` → fallback filenames. At most one file per directory.
3. **Merge order**: Concatenates root-down, joined by blank lines. **Later files (closer to cwd) override earlier ones** because they appear later in the prompt.

### Size Limit
- **32 KiB default** (`project_doc_max_bytes`), configurable up to 64 KiB+.
- Stops adding files once combined size hits the cap.
- Workaround: split instructions across nested directories.

### Override Mechanism
- `AGENTS.override.md` in any directory replaces `AGENTS.md` in that same directory (the regular file is ignored).
- Use case: team-specific or temporary overrides without deleting shared file.

### Content Allocation by Level

| Level | Content |
|-------|---------|
| **Global** (`~/.codex/`) | Personal preferences: test runner, package manager, confirmation policies |
| **Repo root** | Repo-wide expectations: lint commands, PR guidelines, doc conventions |
| **Subdirectory** | Team/service-specific rules: custom test commands, security policies |

### Anti-patterns
- Empty files (silently skipped)
- Files exceeding 32 KiB combined (truncated)
- Override files left accidentally higher in tree (wrong guidance loads)

---

## 3. Datadog — "Steering AI Agents in Monorepos"

**Source**: https://dev.to/datadog-frontend-dev/steering-ai-agents-in-monorepos-with-agentsmd-13g0

### Key Principles
- AGENTS.md is "the **contract** between your codebase and the agent ecosystem"
- Written for AI agents, not humans. **Keep concise and terse** — characters consume context window.
- Nearest-file-wins is "quite limited on its own" for monorepos.

### Root as Router Pattern (Datadog's recommendation)
Root AGENTS.md acts as a **task-based router** pointing to sub-docs:

```
# Tasks
To create an email, read @emails/AGENTS.md
To create a Go service, read @go/services/AGENTS.md
To add unit tests, read @.agents/unit-tests.md
```

### Content Allocation

| Location | Content |
|----------|---------|
| **Root AGENTS.md** | Task-based routing table (map/index) |
| **Folder-level AGENTS.md** | Contextual to folder's content (domain-specific) |
| **`.agents/` directory** | Generic cross-cutting concerns (unit testing guide, etc.) |
| **`AGENTS.local.md`** (.gitignored) | User-specific overrides (scope, owned services) |

### Organizational Model
- **Central team** provides scaffolding (AGENTS.md, routing, shared configs)
- **Each partner team** fills in domain-specific instructions
- Root AGENTS.md instructs: `If present, prioritize instructions inside @AGENTS.local.md`

### Testing Steering Docs
1. Create collection of example prompts per task
2. Store them durably (Google Doc/Confluence)
3. Run prompts across all supported tools (Claude, Cursor, Codex)
4. Observe breakdowns, edit steering doc, retry until agent one-shots

### Claude Code Compatibility
```
echo "Read @AGENTS.md" > CLAUDE.md
```
One-liner bridge. Keeps flexibility for Claude-specific features.

---

## 4. Nx — "Teach Your AI Agent How to Work in a Monorepo"

**Source**: https://nx.dev/blog/nx-ai-agent-skills

### Approach: Skills over Bloated Config
Nx moved away from dumping everything into AGENTS.md/CLAUDE.md. Instead:
- `npx nx configure-ai-agents` generates AGENTS.md + CLAUDE.md with **workspace-specific guidelines**
- **Skills** = structured knowledge loaded incrementally, only when the agent needs them
- Skills are procedural guides, not static context dumps

### What goes in AGENTS.md vs Skills

| Location | Content |
|----------|---------|
| **AGENTS.md/CLAUDE.md** | Workspace guidelines, how to explore workspace, basic conventions |
| **Skills (loaded on demand)** | `nx-workspace` (explore project graph), `nx-generate` (code gen), `nx-run-tasks` (task execution), `ci-monitor` (CI integration), `link-workspace-packages` (package linking) |

### Key Insight
> "Skills are loaded incrementally, only when the agent actually needs them. This keeps your agent's context focused and efficient."

Anti-pattern: dumping all knowledge into system prompt / AGENTS.md.

---

## 5. Cursor Rules (.cursor/rules/) — Comparison

**Source**: https://cursor.com/docs/rules (description from search results + AI config comparison guide)

### Scoping Model (4 types)

| Type | Activation | Use Case |
|------|-----------|----------|
| **Always On** | Every interaction | Global conventions, style rules |
| **Auto Attached** | When glob pattern matches open files (e.g., `**/*.py`) | Language/framework-specific rules |
| **Model Decision** | AI decides based on description | Conditional/situational rules |
| **Manual** | Only when explicitly `@`-mentioned | Specialized workflows |

### Key Differences from AGENTS.md
- **Glob-based scoping** instead of directory hierarchy
- **Multiple files** in `.cursor/rules/` (e.g., `frontend.mdc`, `backend.mdc`)
- Each `.mdc` file has frontmatter with scope type + glob pattern
- More granular: rules activate per-file-type, not per-directory

### MDC Format
```
---
description: React component conventions
globs: ["**/*.tsx", "**/*.jsx"]
alwaysApply: false
---
# React Rules
- Use functional components...
```

---

## 6. Cross-Source Synthesis: Content Allocation Rules

### What Belongs at Each Level

| Level | Content | Size Guide |
|-------|---------|------------|
| **Global** (`~/`) | Personal preferences, tone, tool choices, confirmation policies | < 1 KB |
| **Repo Root** | Project purpose, navigation guide, shared tools, PR/commit conventions, lint/test commands, routing table to sub-docs | < 4 KB |
| **Package/Service** | Package-specific tech stack, build commands, testing approach, security rules, team conventions | < 2 KB per package |
| **Feature/Deep** | Narrow scope: API conventions for one service, migration guides, specific workflow steps | < 1 KB |

### Conflict Resolution (consensus across sources)

1. **Closest file wins** (agents.md spec, all tools)
2. `AGENTS.override.md` replaces `AGENTS.md` in same directory (Codex-specific)
3. Explicit user chat prompts override everything (agents.md spec)
4. Files concatenated root→leaf; later content takes precedence (Codex)
5. Combined limit: 32 KiB default (Codex)

### Anti-patterns (aggregated)

1. **Overloading any single level** — agent sees all merged files, each level should be focused
2. **Human-oriented prose** — write for agents, not people; be terse
3. **Duplicating instructions** across levels — wastes context window
4. **Leaving stale override files** — causes wrong guidance to load
5. **Dumping everything into root** — use routing/skills for progressive disclosure
6. **Exceeding size limits** — instructions get silently truncated
7. **Empty files** — silently skipped, confusing during debugging

### Best Practice: Progressive Disclosure

Datadog's "root as router" + Nx's "skills loaded on demand" converge on the same principle:
**Root provides a map; details are loaded only when relevant to the current task.**

This preserves context window budget and avoids overwhelming the agent with irrelevant instructions.
