# Researcher C: AI Harness Engineering & AGENTS.md Ecosystem

## 1. AI Harness Engineering — Definition & Origin

**Coined by:** OpenAI's engineering team, February 2026, in a blog post by Ryan Lopopolo describing how they built a 1M+ LOC product with zero human-written code.

**Definition:** Harness engineering is the discipline of designing the systems, constraints, feedback loops, and infrastructure that wrap around AI agents to make them reliable. The formula: **Agent = Model + Harness**. The harness is everything except the model itself.

**Hierarchy:** Prompt engineering (what to ask) < Context engineering (what to send) < Harness engineering (how the whole thing operates). Each layer adds scope without eliminating the previous.

**Key components:** AGENTS.md files, linters/CI, MCP servers, sub-agents, hooks, back-pressure mechanisms, observability, guardrails, tool access control, verification loops.

**Key sources:**
- [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/) — The origin post
- [Martin Fowler: Harness Engineering](https://martinfowler.com/articles/harness-engineering.html) — Independent analysis
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [HumanLayer: Skill Issue — Harness Engineering for Coding Agents](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents)

---

## 2. AGENTS.md Ecosystem & Tooling

### Official Standard
- **Website:** https://agents.md
- **GitHub:** https://github.com/agentsmd/agents.md
- **Now governed by:** Agentic AI Foundation (AAIF) under the Linux Foundation

### Tools & Frameworks

| Tool | Type | URL |
|------|------|-----|
| **AgentLinter** | Linter/validator (CLI + web) | https://agentlinter.com / `npx agentlinter` |
| **Packmind** | Drift detection — validates AGENTS.md stays accurate as code changes | https://packmind.com/evaluate-context-ai-coding-agent/ |
| **Factory** | Enterprise AGENTS.md management | https://docs.factory.ai/cli/configuration/agents-md |
| **GitLab Duo** | Native AGENTS.md support with directory-level inheritance | https://docs.gitlab.com/user/duo_agent_platform/customize/agents_md/ |

### AgentLinter Details
- Evaluates 5 dimensions: **structure, clarity, completeness, security, cross-file consistency** (each 0-100)
- Supports: Claude Code, OpenClaw, Cursor, Windsurf, Moltbot, any Agent Skills-compatible workspace
- Catches: leaked secrets in markdown, vague instructions, contradictions across multi-file configs
- Stat: 1 in 5 workspaces have exposed credentials; 40% of agent configs score below 60 on Clarity
- Based on: Gloaguen et al. (2026) — "A Taxonomy of Agent Instruction Failures"

### Warnings Against Auto-Generators
- GitHub Blog analysis of 2,500+ repos found that auto-generated AGENTS.md files tend to be generic and low-value
- Best practice: start from auto-generated scaffold (e.g., Claude Code `/init`), then hand-tune with project-specific knowledge

**Key sources:**
- [GitHub Blog: How to Write a Great AGENTS.md](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
- [AgentLinter](https://agentlinter.com/)
- [A Complete Guide to AGENTS.md](https://www.aihero.dev/a-complete-guide-to-agents-md)

---

## 3. AAIF (Agentic AI Foundation) — Latest News

**Founded:** 2025 under the Linux Foundation
**Anchored by:** MCP (Model Context Protocol), goose, and AGENTS.md
**Co-founders:** Block, Anthropic, OpenAI

### 2026 Updates (February)
- **97 new members** announced → total **146 members**
- **18 new Gold Members:** Akamai, American Express, Autodesk, Circle, Equinix, Hitachi, Huawei, JPMorgan Chase, Lenovo, Red Hat, ServiceNow, TELUS, UiPath, Workato, and others
- **New Governing Board Chair:** David Nalley (AWS, Director of Developer Experience) — 20+ years open source leadership
- **MCP Dev Summit NYC:** April 2-3, 2026
- **MCP Dev Summit Europe:** Amsterdam, Sep 17-18, 2026

**Key sources:**
- [AAIF Homepage](https://aaif.io/)
- [LF: AAIF Formation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [LF: 97 New Members](https://www.linuxfoundation.org/press/agentic-ai-foundation-welcomes-97-new-members)
- [OpenAI: Co-founds AAIF](https://openai.com/index/agentic-ai-foundation/)

---

## 4. Claude Code + AGENTS.md — Feature Request Status

**Issue:** [anthropics/claude-code#6235](https://github.com/anthropics/claude-code/issues/6235)
**Opened:** August 21, 2025 by DylanLIiii
**Votes:** 3,200+ upvotes (one of the most upvoted issues)
**Labels:** `area:core`, `enhancement`, `memory`
**Related PR:** [#29835](https://github.com/anthropics/claude-code/pull/29835) (open)

**Current status:** Claude Code does NOT natively support AGENTS.md. It uses CLAUDE.md exclusively. No official Anthropic response confirming a timeline.

**Community workaround:** Put shared instructions in AGENTS.md, keep Claude-specific features in CLAUDE.md. Some users symlink or use a pre-hook to copy AGENTS.md content into CLAUDE.md.

**Competitive pressure:** Every major competitor now supports AGENTS.md natively:
- OpenAI Codex, Cursor, GitHub Copilot, Gemini CLI, Windsurf, Aider, Zed, Warp, RooCode, GitLab Duo, Factory

**Prediction market:** [Manifold](https://manifold.markets/bessarabov/will-claude-code-support-agentsmd-i) — active market on whether Claude Code will support AGENTS.md in 2026

**Key sources:**
- [GitHub Issue #6235](https://github.com/anthropics/claude-code/issues/6235)
- [The Prompt Shelf: AGENTS.md vs CLAUDE.md](https://thepromptshelf.dev/blog/agents-md-vs-claude-md/)
- [Medium: Complete Guide to CLAUDE.md and AGENTS.md](https://medium.com/data-science-collective/the-complete-guide-to-ai-agent-memory-files-claude-md-agents-md-and-beyond-49ea0df5c5a9)

---

## 5. Emerging Patterns — Directory-Level AGENTS.md & Monorepo Strategies

### Inheritance Model
```
repo/
├── AGENTS.md              ← global defaults (CI, coding style, PR conventions)
├── packages/
│   ├── frontend/
│   │   └── AGENTS.md      ← React-specific rules, component patterns
│   └── backend/
│       └── AGENTS.md      ← API conventions, DB migration rules
└── infra/
    └── AGENTS.md          ← Terraform/IaC specific instructions
```

**How it works:**
- Agent reads ALL AGENTS.md files from root to the directory of the file being edited
- **Closest file wins** on conflicts (most specific override)
- Explicit user prompts override everything

### Key Patterns
1. **Progressive disclosure:** Each level only contains what's relevant at that scope
2. **Package-level autonomy:** In monorepos, each package ships tailored instructions
3. **Merge behavior:** Agent sees merged context from all levels, not just the nearest file
4. **GitLab Duo implementation:** Reads relevant AGENTS.md before editing files in that directory

**Key sources:**
- [Datadog: Steering AI Agents in Monorepos](https://dev.to/datadog-frontend-dev/steering-ai-agents-in-monorepos-with-agentsmd-13g0)
- [Nx Blog: Teach Your AI Agent How to Work in a Monorepo](https://nx.dev/blog/nx-ai-agent-skills)
- [GitLab: AGENTS.md Customization](https://docs.gitlab.com/user/duo_agent_platform/customize/agents_md/)
- [GitHub Issue: Monorepo inheritance question](https://github.com/agentsmd/agents.md/issues/53)

---

## 6. Agent Experience (AX) — The New Paradigm

**Coined by:** Mathias Biilmann, Netlify CEO, January 2025

**Definition:** Agent Experience (AX) is the holistic experience AI agents have when interacting with a product, platform, or system — how easily agents can discover, evaluate, and operate within digital environments to achieve user-defined goals.

**Relationship to DX:**
- **DX (Developer Experience):** How developers successfully build with your product
- **AX (Agent Experience):** How AI agents (the new "users") discover and operate your platform, often without a human in the loop

**Dedicated hub:** https://agentexperience.ax — curated resource site

### AX Benchmark
- [Tech Stackups: AX Benchmark](https://techstackups.com/guides/introducing-ax-benchmark-agent-experience/) — a standardized measurement framework for agent experience across developer platforms

### Key Insight
Platforms that optimize for AX will win in the agent era. This means: machine-readable docs, structured API descriptions, AGENTS.md files, clear error messages, and predictable behavior patterns.

**Gartner prediction:** 33% of enterprise apps will include agentic AI by 2028, making 15% of day-to-day work decisions autonomously.

**Key sources:**
- [Netlify: AI Better Pair Programmer with Agent Experience](https://www.netlify.com/blog/ai-better-pair-programmer-with-agent-experience/)
- [Nordic APIs: What Is Agent Experience (AX)?](https://nordicapis.com/what-is-agent-experience-ax/)
- [Agent Experience Hub](https://agentexperience.ax/)
- [Tech Stackups: AX Benchmark](https://techstackups.com/guides/introducing-ax-benchmark-agent-experience/)
- [Leonie Monigatti: Agent Journey Map](https://www.leoniemonigatti.com/blog/agent-experience.html)

---

## 7. Summary: How AGENTS.md Fits Into AI Harness Engineering

AGENTS.md is the **configuration layer** of the harness. In the harness engineering stack:

| Layer | Purpose | Example |
|-------|---------|---------|
| **Model** | Intelligence | Claude, GPT-5, Gemini |
| **Context** | What the model sees | AGENTS.md, codebase indexing, RAG |
| **Harness** | How the system operates | CI/CD loops, linters, MCP servers, guardrails, hooks |
| **Observability** | How humans monitor | Logs, traces, agent analytics |

AGENTS.md sits at the intersection of context and harness — it provides both contextual instructions AND operational constraints. As harness engineering matures, AGENTS.md files are becoming the primary interface between human intent and agent behavior, making them the most important non-code artifact in an agent-first codebase.
