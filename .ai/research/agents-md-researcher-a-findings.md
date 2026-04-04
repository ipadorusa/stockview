# Researcher A: AGENTS.md Major Repository Findings

Research date: 2026-04-03

---

## 1. vercel/next.js (139k stars)
- **URL**: https://github.com/vercel/next.js/blob/canary/AGENTS.md
- **Size**: 438 lines / 20.9 KB (largest studied)
- **Note**: `CLAUDE.md` is a symlink to `AGENTS.md`
- **Key sections**: Codebase structure, Build commands, Fast local dev (watch mode), Bundler selection, Testing (8+ test commands), Writing tests (good/bad examples), PR status/CI triage, Dev tips, Secrets/Env safety, Specialized skills, Context-efficient workflows, Anti-patterns, Test gotchas, Rust/Cargo, Internal header security
- **Notable patterns**:
  - Skill-based architecture: `.agents/skills/` with named skills (`$pr-status-triage`, `$flags`, `$dce-edge`, `$react-vendoring`, `$runtime-debug`)
  - Context-efficiency guidance: how to read large files, batch edits, avoid re-running tests
  - Explicit anti-patterns with "do NOT" directives
  - Task decomposition and verification methodology
  - Security review guidance for internal headers

## 2. openai/codex (72.9k stars)
- **URL**: https://github.com/openai/codex/blob/main/AGENTS.md
- **Size**: 209 lines / 16.2 KB
- **Key sections**: Rust/codex-rs conventions, codex-core crate guidance, TUI style/code conventions, Snapshot tests (insta), App-server API best practices
- **Notable patterns**:
  - Sandbox-awareness: Explains `CODEX_SANDBOX_NETWORK_DISABLED` and tells agents never to modify sandbox code
  - Rust/Clippy lint references (collapsible_if, uninlined_format_args)
  - `argument_comment_lint` convention for opaque literal arguments
  - Module size limits: 500 LoC target, 800 LoC hard cap
  - "Resist adding code to codex-core" architectural guidance
  - Bazel + Cargo dual build system instructions
  - API naming conventions (`*Params`, `*Response`, `*Notification`)

## 3. getsentry/sentry (43.5k stars)
- **URL**: https://github.com/getsentry/sentry/blob/master/AGENTS.md
- **Size**: 244 lines / 7.59 KB
- **Key sections**: Overview, Project structure, Command execution guide, Backend/Frontend commands, Git worktrees, Context-aware loading, Agent skills, Feature flags, Pull requests
- **Notable patterns**:
  - Hierarchical AGENTS.md: Root + `src/AGENTS.md` + `tests/AGENTS.md` + `static/AGENTS.md`
  - `.agents/skills/` directory for workflow steering
  - "AGENTS.md files are the source of truth" over CLAUDE.md/Cursor rules
  - Context-aware loading map: file patterns -> relevant AGENTS.md
  - Virtual environment requirements with `required_permissions: ['all']`
  - Frontend/backend split PR policy

## 4. agno-agi/agno (39.1k stars)
- **URL**: https://github.com/agno-agi/agno/blob/main/AGENTS.md
- **Size**: 241 lines / 6.09 KB
- **Key sections**: Repo structure, Conductor notes, Virtual environments, Testing cookbooks, Code locations, Coding patterns, Before submitting code, Don't list
- **Notable patterns**:
  - `.context/` directory for agent-to-agent handoff artifacts
  - Dual virtual environments (`.venv/` for dev, `.venvs/demo/` for cookbooks)
  - TEST_LOG.md pattern for tracking cookbook test results
  - Explicit "Don't" section (no emojis, no f-strings without variables)
  - Workaround for `gh pr edit` GraphQL failures

## 5. agentsmd/agents.md (19.7k stars) -- The Standard Itself
- **URL**: https://github.com/agentsmd/agents.md
- **Created by**: OpenAI (Romain Huet contributor)
- **Standard**: Open format adopted by 60k+ projects, supported by Codex, Claude Code, Copilot, Cursor, Windsurf, Augment Code
- **Minimal example** focuses on: pnpm/turbo commands, testing workflow, PR title format

## 6. Automattic/jetpack (1.8k stars)
- **URL**: https://github.com/Automattic/jetpack/blob/trunk/AGENTS.md
- **Size**: 256 lines / 12.1 KB
- **Key sections**: Confidentiality, Project structure, Jetpack CLI, Coding conventions (PHP/JS/React/CSS), Testing, Changelog entries (AI-generated option), PRs, Code review, Common pitfalls
- **Notable patterns**:
  - Confidentiality warning for public repo (no private WordPress.com URLs)
  - `$$next-version$$` placeholder system for DocBlock versions
  - AI-generated changelog checkbox with explicit conditions
  - Changelog quality rules (imperative mood, user perspective)
  - CSS logical properties for RTL support
  - "Maintaining This File" meta-section

## 7. OpenHands/docs (OpenHands ecosystem)
- **URL**: https://github.com/OpenHands/docs/blob/main/AGENTS.md
- **Size**: 189 lines / 6.09 KB
- **Key sections**: Quick orientation, llms.txt generation, Local dev, Cross-repo sync, Docs conventions, Validation
- **Notable patterns**:
  - llms.txt override: Serves V1-only context to LLMs while keeping V0 pages for humans
  - 3 separate cross-repo sync mechanisms
  - `uv run` for ephemeral Python environments
  - LLM pricing table validation via CI

## 8. finos/morphir-rust (small but exceptional)
- **URL**: https://github.com/finos/morphir-rust/blob/main/AGENTS.md
- **Size**: 290 lines / 16 KB
- **Key sections**: Morphir ecosystem, Tech stack, Coding standards (docs, testing, functional design, code org, git), Temp output mgmt, Logging standards, CLI doc generation, Release management, Session completion
- **Notable patterns**:
  - "Expected Knowledge" prereqs for agents
  - TDD + BDD with Cucumber/Gherkin, Object Mother pattern, TestDriver pattern
  - Functional design principles: ADTs, immutability, illegal states unrepresentable
  - "Landing the Plane" mandatory session completion checklist (push, clean, handoff)
  - CLA restriction: NEVER add AI agents as co-author (FINOS legal)
  - `.agents/out/` gitignored directory for temp output
  - `/release-manager` skill for AI-assisted releases

## 9. vercel-labs/agent-skills (React Best Practices)
- **URL**: https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/AGENTS.md
- **Size**: 143k+ characters (compiled from 40+ rule files)
- **Notable**: Compiled/generated AGENTS.md -- individual rules aggregated into single document
- **Concept**: "Package manager for AI coding agents"

## 10. GitHub Blog Analysis (2,500+ repos)
- **URL**: https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/
- **Key findings**:
  - Top-tier files cover 6 areas: commands, testing, project structure, code style, git workflow, boundaries
  - Three-tier boundary system: Always do / Ask first / Never do
  - Code examples beat explanations
  - "Never commit secrets" = most common helpful constraint
  - GitHub Copilot supports custom agent personas via `.github/agents/` frontmatter

---

## Cross-Cutting Themes

### Hierarchical AGENTS.md
- Sentry: Root + src/ + tests/ + static/ subdirectory files
- Next.js: Root + `.agents/skills/` for specialized workflows
- Codex: Supports subdirectory AGENTS.md with scope/precedence

### Skills System
- Next.js: `$pr-status-triage`, `$flags`, `$dce-edge`, `$react-vendoring`
- Sentry: `.agents/skills/` with diff-first review workflows
- Morphir-rust: `/release-manager` skill
- Vercel-labs: Compiled skills from individual rule files

### Agent-to-Agent Collaboration
- Agno: `.context/` for handoff artifacts
- Morphir-rust: "Landing the Plane" handoff protocol

### Security/Legal
- Jetpack: Confidentiality rules for public repos
- Next.js: Header security review, secrets safety
- Morphir-rust: CLA restriction on AI authorship
- Sentry: AGENTS.md as canonical source of truth

### Context Efficiency
- Next.js: Read large files with grep-first, batch edits, capture output once
- Sentry: Context-aware loading map

### Session Management
- Morphir-rust: Mandatory push-before-done checklist
- Agno: TEST_LOG.md for persistent tracking
