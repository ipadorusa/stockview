# AI Harness Engineering Research Report

**Date:** 2026-04-05
**Scope:** How teams configure AI coding agents for real-world projects
**Sources:** Anthropic docs, GitHub Blog (2,500+ repos analysis), Escape.tech SF field report, NXCode guide, Decoding AI, OpenAI Codex case study, Atomic framework

---

## 1. What Is Harness Engineering?

The term emerged from the horse-tack metaphor: the model is the horse (powerful but directionless), the harness is the infrastructure (constraints, guardrails, feedback loops), and the rider is the engineer (providing direction, not doing the running).

**Formal definition** (4 pillars):
1. **Constrain** — Architectural boundaries, dependency rules, permission modes
2. **Inform** — Context engineering: CLAUDE.md, AGENTS.md, skills, documentation-as-code
3. **Verify** — Testing, linting, CI validation, structural tests
4. **Correct** — Feedback loops, self-repair mechanisms, iterative AGENTS.md updates

**Key evidence:** TerminalBench 2.0 showed that changing *only the harness* (not the model) moved LangChain's DeepAgent from outside the top 30 to the top 5. OpenAI's Codex team built 1M+ lines of production code with zero hand-written lines — the engineers' job was designing the harness.

---

## 2. Instruction Files: CLAUDE.md / AGENTS.md / .cursorrules

### 2.1 GitHub's Analysis of 2,500+ AGENTS.md Files

**What works:**
- **Put commands early:** `npm test`, `npm run build`, `pytest -v` — include flags and options
- **Code examples over explanations:** One real snippet beats three paragraphs
- **Set clear boundaries:** Files to never touch, secrets never to commit, production configs off-limits
- **Be specific about your stack:** "React 19 with TypeScript, Next.js 16, Tailwind CSS 4" not "React project"
- **Cover six core areas:** Commands, Testing, Project Structure, Code Style, Git Workflow, Boundaries

**What fails:** "You are a helpful coding assistant" — too vague. Successful agents have specific personas.

### 2.2 File Hierarchy (Claude Code)

| Scope | Location | Purpose |
|-------|----------|---------|
| Managed policy | `/Library/Application Support/ClaudeCode/CLAUDE.md` | Org-wide (IT/DevOps) |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team-shared via source control |
| User | `~/.claude/CLAUDE.md` | Personal preferences, all projects |
| Local | `./CLAUDE.local.md` | Personal project-specific (.gitignored) |

**AGENTS.md** is the vendor-neutral counterpart. Best practice: symlink `CLAUDE.md → AGENTS.md` for multi-tool teams.

### 2.3 Cursor Rules (.cursor/rules/)

Cursor evolved from a single `.cursorrules` file (deprecated) to `.cursor/rules/*.mdc` files with four scopes:
- **Always On** — Every interaction
- **Auto Attached** — Activated when matching files are open
- **Model Decision** — AI decides based on description field
- **Manual** — Only when explicitly mentioned via `@`

This is the most granular system — `frontend.mdc` for React, `backend.mdc` for API patterns.

### 2.4 Cross-Tool Comparison

| Feature | CLAUDE.md | Cursor .mdc | copilot-instructions | .windsurf/rules |
|---------|-----------|-------------|---------------------|-----------------|
| Multi-file | Yes | Yes (.cursor/rules/) | Yes (.github/instructions/) | Not documented |
| File scoping | User vs. project level | Per-rule scope | Path-specific .instructions.md | — |
| Auto-memory | Built-in | Unknown | Yes (Copilot Memory) | Yes |
| Agent-decided inclusion | No | Yes (description field) | No | No |

### 2.5 What NOT to Put in Instruction Files

- **Code style rules** — Use ESLint/Prettier instead (faster, deterministic)
- **Obvious things** — "Write clean code" wastes tokens
- **Full API docs** — Link to them or use `docs/` directory
- **Task-specific instructions** — Belong in prompts, not persistent config

---

## 3. Hook Systems

### 3.1 Claude Code Hook Events

| Event | Purpose | Key Use Case |
|-------|---------|-------------|
| `SessionStart` | Runs at session init | Inject env vars, load dynamic context |
| `InstructionsLoaded` | After CLAUDE.md loads | Modify or augment instructions |
| `UserPromptSubmit` | Before prompt processed | Validate/transform user input |
| `PreToolUse` | Before tool execution | Block dangerous operations, require confirmation |
| `PostToolUse` | After tool success | Lint generated code, log changes, provide feedback |
| `TeammateIdle` | Agent team member idle | Send feedback to keep working |
| `TaskCreated/Completed` | Task lifecycle | Enforce quality gates |

### 3.2 Hook Handler Types

- **Command hooks** — Shell command execution (`command` field)
- **HTTP hooks** — POST to external URL (`url` field, with header env var interpolation)
- **Prompt/Agent hooks** — Trigger prompts or spawn sub-agents

### 3.3 Practical Hook Patterns

**Pre-commit quality gate:**
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "command": "eslint --fix ${file_path} && prettier --write ${file_path}"
    }]
  }
}
```

**Block dangerous file edits:**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",
      "command": "echo ${tool_input} | jq -r '.file_path' | grep -v '.env' || exit 2"
    }]
  }
}
```

**Agent team quality gate:** Use `TeammateIdle` hook with exit code 2 to send feedback and keep a teammate working until quality bar is met.

---

## 4. MCP Server Patterns

### 4.1 Three Installation Scopes

- **Local scope** (default): `~/.claude.json` — Private, per-project
- **Project scope**: `.mcp.json` in repo — Shared with team via source control
- **User scope**: `~/.claude.json` global — Available across all projects

### 4.2 Practical MCP Configurations for StockView-type Projects

**PostgreSQL (Supabase):**
```json
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "${DATABASE_URL}"]
    }
  }
}
```

**Sentry for error monitoring:**
```json
{
  "mcpServers": {
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/sse",
      "headers": { "Authorization": "Bearer $SENTRY_TOKEN" }
    }
  }
}
```

**GitHub for code reviews and PR management:**
```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

### 4.3 Environment Variable Expansion

`.mcp.json` supports `${VAR}` and `${VAR:-default}` syntax in `command`, `args`, `env`, `url`, and `headers` — enabling team-shared configs with per-machine secrets.

---

## 5. Skills System

### 5.1 Key Differentiation from CLAUDE.md

Skills load **on demand** based on description matching, while CLAUDE.md loads entirely at session start. This is critical for context window management.

### 5.2 Unique Capabilities

1. **Script execution** — Skills can include executable scripts (deployment checklists, etc.)
2. **Auto-triggering** — `description` field in frontmatter triggers when task matches
3. **Access control** — `disable-model-invocation: true` (user-only), `user-invocable: false` (background knowledge), `allowed-tools` (restrict tool access within skill)

### 5.3 Skill Architecture for StockView

Recommended skill structure:
```
.claude/skills/
├── data-source-scraping/SKILL.md    # Naver EUC-KR encoding patterns, Yahoo API details
├── cron-workflow/SKILL.md           # GitHub Actions cron debugging, CRON_SECRET patterns
├── prisma-migration/SKILL.md        # DIRECT_URL requirement, upsert patterns
├── vercel-deployment/SKILL.md       # Vercel-specific best practices
└── shadcn-components/SKILL.md       # Component patterns, Korean color conventions
```

---

## 6. Multi-Agent Orchestration

### 6.1 Claude Code Agent Teams

- **Lead agent** creates and manages the team via git worktrees (isolated file systems)
- **Teammates** each get their own tmux session and worktree
- Communication via shared task board (`~/.claude/teams/teams.json`)
- Subagent definitions reusable as teammate roles
- Quality gates enforced via `TeammateIdle`, `TaskCreated`, `TaskCompleted` hooks

### 6.2 Parallel Agent Tooling (Ecosystem)

| Tool | What It Solves |
|------|---------------|
| **Superset** | Git worktree isolation per agent — no shared mutable state |
| **cmux** | macOS terminal with per-agent status indicators |
| **Conductor (gstack)** | Runs 10-15 parallel Claude Code sessions (Garry Tan pattern) |
| **Claude Manager** | Rust TUI for session organization, diff preview |

### 6.3 Specialized Sub-Agent Pattern (Atomic Framework)

10 specialized agents in two categories:
- **Research agents** (read-only): codebase-analyzer, dependency-mapper, pattern-identifier — only Read/Grep/Glob tools
- **Workflow agents** (scoped writes): planner (no write), worker (single task), reviewer (flag but not fix), debugger

**Key principle:** Each sub-agent operates in its own context window. The main agent receives condensed results. This prevents context pollution.

### 6.4 OpenAI's Graph-Based Execution

Three-phase DAG workflow:
1. **Task Decomposition** — Read-only planner decomposes spec into structured tasks
2. **Worker Loop** — All ready tasks dispatched concurrently as parallel workers
3. **Review & Fix** — Reviewer audits, conditionally routes to debugger

---

## 7. Metrics Teams Report

### 7.1 Productivity Claims

- **OpenAI Codex team:** 3.5 PRs per engineer per day, throughput *increasing* as team grew
- **SF fast adopters (Escape.tech report):** Claim "10x since December 2025" — directional, not audited
- **TerminalBench:** Harness-only changes moved agent from bottom-30 to top-5

### 7.2 Recommended Metrics to Track

| Metric | What It Measures |
|--------|-----------------|
| Lead time (issue → merged PR) | End-to-end velocity |
| Agent autonomy rate | % of tasks without human intervention |
| Reopen/rollback rate | Quality of agent-authored changes |
| Wasted work rate | Features reverted/unused within 30 days |
| Issue clarity | % of issues agents can act on without clarification |
| Monthly agent API cost per engineer | Cost efficiency |
| Cycle time (customer signal → shipped) | Business impact |

### 7.3 Cost Considerations

- Token optimization tools (e.g., RTK — Rust Token Killer) claim 60-90% savings
- Context-mode MCP plugins reduce context window flooding
- Skills on-demand loading vs. always-on CLAUDE.md reduces baseline token cost

---

## 8. Anti-Patterns and Common Mistakes

### 8.1 Instruction File Anti-Patterns

1. **Vague personas** — "You are a helpful coding assistant" fails; specific roles work
2. **Information overload** — Stuffing everything into CLAUDE.md wastes context budget
3. **Static harness** — AGENTS.md must evolve as models improve and failures are discovered
4. **Human-only documentation** — If architectural decisions live in people's heads or Confluence, agents can't access them. Everything must be in-repo
5. **No verification loop** — Writing instructions without testing if agents follow them

### 8.2 Execution Anti-Patterns

6. **No git isolation** — Parallel agents stepping on each other's files
7. **Over-permissive tool access** — Agents with write access to production configs
8. **Skipping CI for agent PRs** — Agent code needs *more* review gates, not fewer
9. **Framework over-engineering** — Complex RAG pipelines when plain API calls + harness work better (Decoding AI lesson)
10. **Model-swapping instead of harness-fixing** — When output quality drops, teams swap models instead of improving constraints and context

### 8.3 Organizational Anti-Patterns

11. **Bottom-up adoption** — Y Combinator says adoption must come from CTO/CPO, not individual devs
12. **Standardizing on day one** — Run agents on real work for 2 weeks first, log every failure, *then* build guardrails
13. **Ignoring CPO-side** — When agents make CTO side 10x faster, every CPO mistake compounds 10x faster

---

## 9. Actionable Recommendations for StockView (2026-stock)

### 9.1 Current State Assessment

Your existing harness is already solid:
- CLAUDE.md → AGENTS.md wrapper pattern (vendor-neutral)
- Detailed tech stack, data sources, conventions, don'ts
- Skills for vercel, web-design, google-search-console
- `.bkit/` for audit and state management

### 9.2 Recommended Improvements

**A. Upgrade AGENTS.md with the "Six Core Areas" Pattern:**
- [x] Commands — already covered
- [x] Project structure — already covered
- [x] Code style — partially covered (Korean color convention)
- [ ] Testing — add: "No test framework configured" → recommend adding Vitest + example test patterns
- [ ] Git workflow — add: branch naming, PR description template, commit message conventions
- [ ] Boundaries — expand: add explicit "never modify" file list (e.g., `prisma/migrations/`, `.github/workflows/`)

**B. Add Data Source Skills (On-Demand Loading):**
```
.claude/skills/
├── naver-scraping/SKILL.md        # EUC-KR encoding, fchart API, NXT price filtering
├── yahoo-finance/SKILL.md         # v8 chart API patterns, rate limiting (5 concurrent)
├── cron-debugging/SKILL.md        # GitHub Actions → /api/cron/* flow, CRON_SECRET validation
└── prisma-patterns/SKILL.md       # Upsert patterns, DIRECT_URL for DDL, batch sizes
```
This moves specialized knowledge out of always-loaded AGENTS.md into demand-loaded skills.

**C. Add MCP Servers (.mcp.json, project scope):**
```json
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "${DATABASE_URL}"]
    }
  }
}
```
Enables agents to directly query the database for debugging data issues.

**D. Add Hooks for Quality Gates:**
- `PostToolUse` on `Write` for `src/lib/data-sources/` — auto-run lint
- `PreToolUse` on `Write` — block edits to `.env`, `prisma/migrations/`
- `PostToolUse` on `Bash` with `npm run build` — verify build succeeds after changes

**E. Consider Sub-Agents:**
- `data-source-debugger` — Read-only agent that analyzes Naver/Yahoo API responses
- `cron-monitor` — Agent scoped to `.github/workflows/` and `src/app/api/cron/`
- `schema-reviewer` — Read-only agent for Prisma schema changes

**F. Adopt "First 30 Days" Playbook:**
1. Week 1-2: Run agents on real work, log every revert/rework
2. Week 3: Build guardrails around actual failure modes (not hypothetical)
3. Week 4: Formalize into AGENTS.md updates, hooks, and skills
4. Track: lead time, reopen rate, agent autonomy rate

---

## 10. Key Sources

| Source | URL | Key Insight |
|--------|-----|-------------|
| GitHub Blog: AGENTS.md Lessons | https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/ | Six core areas from 2,500+ repos |
| Escape.tech: SF Field Report | https://escape.tech/blog/everything-i-learned-about-harness-engineering-and-ai-factories-in-san-francisco-april-2026/ | CTO/CPO playbook, metrics, tooling |
| NXCode: Complete Guide | https://www.nxcode.io/resources/news/harness-engineering-complete-guide-ai-agent-codex-2026 | 4 pillars, 3 levels, anti-patterns |
| Decoding AI: Agentic Harness | https://www.decodingai.com/p/agentic-harness-engineering | LLM-as-OS architecture, financial app case study |
| Claude Code Docs: Hooks | https://docs.anthropic.com/en/docs/claude-code/hooks | Hook events, JSON I/O, decision control |
| Claude Code Docs: MCP | https://docs.anthropic.com/en/docs/claude-code/mcp | 3 scopes, PostgreSQL/Sentry examples |
| Claude Code Docs: Skills | https://docs.anthropic.com/en/docs/claude-code/skills | On-demand loading, frontmatter, access control |
| Claude Code Docs: Agent Teams | https://docs.anthropic.com/en/docs/claude-code/agent-teams | Worktree isolation, quality gate hooks |
| Claude Code Docs: Sub-Agents | https://docs.anthropic.com/en/docs/claude-code/sub-agents | Scoped agents, tool restrictions |
