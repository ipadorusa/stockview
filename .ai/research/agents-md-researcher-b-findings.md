# Researcher B: AGENTS.md Real-World Implementation Findings

## 1. Korean Developer Community Examples

### dkmin/devBrother — AGENTS.md Master Prompt (Gist)
- **URL**: https://gist.github.com/dkmin/2321c7568571975d9819937be23885ab
- Korean-language "AI Context & Governance Architect" prompt that designs a **centralized control & delegation structure** (중앙 통제 및 위임 구조) rule system
- Approach: treats AGENTS.md as a governance system, not just instructions — designs hierarchical rule files implemented as actual files

### Facebook/hacker.golbin Post
- **URL**: https://www.facebook.com/hacker.golbin/posts/ (AGENTS.md 정리)
- Korean developer summarized AGENTS.md basics as language/framework-independent content applicable to most projects

### awesome-agent-skills Korean README
- **URL**: https://github.com/heilcheng/awesome-agent-skills/blob/main/README.ko.md
- Curated Korean-language list of AI coding agent skills, tools, and capabilities

### GitHub Docs Korean Localization
- **URL**: https://docs.github.com/ko/copilot/tutorials/coding-agent/get-the-best-results
- Official GitHub docs on Copilot coding agent best practices, available in Korean

---

## 2. Enterprise/Company Repos

### Vercel — vercel/vercel AGENTS.md (176 lines, 4.14KB)
- **URL**: https://github.com/vercel/vercel/blob/main/AGENTS.md
- **Structure**: Repository Structure → Essential Commands → Changesets → Code Style → Testing Rules
- **Key patterns**: pnpm monorepo with 44+ packages; exact commands with flags (`pnpm test-unit`, `pnpm type-check`); changeset rules with examples; explicit code style (TypeScript strict, no `any`)
- **Notable**: Always requires changeset for PRs; has changeset examples for both package changes and non-package changes

### Vercel — next.js AGENTS.md
- Referenced in Augment Code guide as a production example (https://github.com/vercel/next.js/blob/canary/AGENTS.md)

### Inngest — website repo AGENTS.md
- Referenced in Augment Code's template as a production example (https://github.com/inngest/website/blob/main/AGENTS.md)

---

## 3. AI Harness Engineering Blog Posts

### OpenAI — "Harness Engineering: Leveraging Codex in an Agent-First World" (Feb 11, 2026)
- **Key insight**: The "one big AGENTS.md" approach **failed**. Problems:
  - Context is scarce — giant file crowds out the task and code
  - Too much guidance becomes non-guidance
  - Monolithic files rot instantly
  - Hard to verify mechanically
- **Solution**: Treat AGENTS.md as **table of contents** (~100 lines), with docs/ directory as system of record
- 3 engineers built a million-line codebase; bottleneck was infrastructure, not intelligence

### Louis Bouchard — "Harness Engineering: The Missing Layer Behind AI Agents" (Mar 2026)
- **URL**: https://www.louisbouchard.ai/harness-engineering/
- Distinguishes: Prompt engineering (what to ask) → Context engineering (what to send) → Harness engineering (how the whole thing operates)
- AGENTS.md is part of context engineering, which lives inside harness engineering

### Alex Lavaee — "How to Harness Coding Agents with the Right Infrastructure"
- **URL**: https://alexlavaee.me/blog/harness-engineering-why-coding-agents-need-infrastructure/
- Five independent teams (OpenAI, Anthropic, Huntley, Horthy, Vasilopoulos) converged on same finding
- **Key metric**: Performance degrades beyond ~40% context utilization
- Single-file instruction sets (lone AGENTS.md) break down at scale
- Four pillars: tiered context, agent specialization, persistent memory, structured execution

---

## 4. Comparison Articles & Analysis

### Augment Code — "How to Build Your AGENTS.md (2026)"
- **URL**: https://www.augmentcode.com/guides/how-to-build-agents-md
- Most comprehensive comparison article with ETH Zurich data
- **Metrics table**:

| Context File Type | Cost Increase | Task Success Change |
|---|---|---|
| LLM-generated (auto-init) | +20-23% | -0.5% to -2% |
| Developer-written (human-curated) | Up to 19% | +4% marginal improvement |
| No context file | Baseline | Baseline |

- **Template** synthesizes patterns from OpenAI, GitHub, Vercel, and Inngest repos

### AIDevMe — "agents.md Best Practices: The Complete Developer Playbook" (Feb 28, 2026)
- **URL**: https://aidevme.com/agents-md-best-practices/
- **Six Pillars of High-Performing agents.md**:
  1. Executable Commands — put them first, exact flags
  2. Code Examples over written explanations
  3. Three-Tier Boundaries: Always / Ask First / Never
  4. Specific Stack Information with versions
  5. Project Structure with purpose, not just paths
  6. Git Workflow and Commit Standards

### DevGenius — "Vercel says AGENTS.md matters more than skills, should we listen?"
- **URL**: https://blog.devgenius.io/vercel-says-agents-md-matters-more-than-skills-should-we-listen-d83d7dc2d978
- Critique: one AGENTS.md example consumed ~22,000 tokens just for a dark mode toggle
- Questions whether persistent context overhead is always justified

### InfoQ — "New Research Reassesses the Value of AGENTS.md Files" (Mar 6, 2026)
- **URL**: https://www.infoq.com/news/2026/03/agents-context-file-value-review/
- 60,000 open-source repos now contain context files
- ETH Zurich recommends: omit LLM-generated files entirely; limit human-written to non-inferable details

---

## 5. GitHub Blog's 2,500 Repo Analysis

### "How to write a great agents.md" — Matt Nigh (Nov 19, 2025)
- **URL**: https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/
- **Core finding**: Most agent files fail because they're too vague
- "You are a helpful coding assistant" does NOT work
- "You are a test engineer who writes tests for React components, follows these examples, and never modifies source code" DOES work
- **What works**:
  - Put executable commands early (with flags, not just tool names)
  - Give agents a specific job/persona
  - Set well-defined boundaries
  - Provide clear examples of good output
  - Define what NOT to do

---

## 6. ETH Zurich Academic Research (arXiv)

### "Evaluating AGENTS.md" (Feb 2026) — arXiv:2602.11988
- **URL**: https://arxiv.org/html/2602.11988v1
- Tested 4 agents (Claude 3.5 Sonnet, Codex GPT-5.2, GPT-5.1 mini, Qwen Code) on 138 real-world Python tasks
- **LLM-generated files**: Hurt performance in 5/8 settings; agents took 2.45-3.92 additional steps per task
- **When docs removed from repo**: LLM-generated files improved by 2.7% — proving they're **redundant** with existing documentation
- **Practical rule**: Every line must pass "Would removing this cause a mistake the agent cannot recover from?"

---

## 7. Vercel's Eval Results (Jan 27, 2026)

### "AGENTS.md outperforms skills in our agent evals"
- **URL**: https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals
- **Results**: Compressed 8KB docs index in AGENTS.md → **100% pass rate**
- Skills alone → **53%** (same as no docs)
- Skills with explicit instructions → **79%**
- Problem: agents don't reliably invoke skills; persistent context always available
- Focused on Next.js 16 APIs (use cache, connection(), forbidden()) not in training data

---

## Key Effectiveness Patterns (Synthesis)

### What Makes AGENTS.md Effective:
1. **Short and human-curated** — under 100 lines ideal (OpenAI), under 4KB good (Vercel repo)
2. **Commands first** — exact executable commands with flags at the top
3. **Non-inferable content only** — don't restate what's in the code
4. **Boundaries** — explicit "never do X" rules
5. **Table of contents approach** — point to docs/, don't inline everything
6. **Monorepo hierarchy** — root + package-level files that merge

### What Makes AGENTS.md Ineffective:
1. **LLM-generated content** — consistently worse than no file at all (-2 to -3%)
2. **Bloated files** — 22K+ tokens waste context, cause "lost in the middle" drops
3. **Stale references** — actively mislead agents
4. **Redundant documentation** — duplicating README/existing docs adds cost without benefit
5. **Vague personas** — "helpful coding assistant" provides zero signal
