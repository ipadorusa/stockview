# AGENTS.md & Harness Strategy — Pass 1 Review (Completeness & Gaps)

**Reviewer**: Claude Opus 4.6 | **Date**: 2026-04-05

---

## Strengths

1. **@import bridge is correct and well-researched.** The plan correctly identifies that Claude Code does not read AGENTS.md natively, and the `@AGENTS.md` import in CLAUDE.md is the Anthropic-documented workaround. The compatibility research in `.ai/research/claude-md-agents-md-compatibility.md` is thorough — covering next.js, grafana, sentry patterns.

2. **Size budget is realistic.** Targeting ~100-120 lines / under 4KB aligns with Researcher C's content allocation findings (100-200 lines max for root, combined under 5KB). The Vercel benchmark used 8KB and achieved 100% — so 4KB for a smaller project is proportionate.

3. **"No auto-generation" stance is correct.** Explicitly calling out the ETH Zurich finding (3% success rate drop, 20% cost increase from auto-generated content) shows the plan authors read the research.

4. **Phase ordering is mostly sound.** Creating AGENTS.md before expanding skills/sub-directories follows the "start small, split later" principle from the GitHub Blog 2,500-repo analysis.

5. **Existing hooks deemed sufficient.** Not over-engineering the hook layer is pragmatic for a single-app repo.

---

## Gaps Found

### G1: Vercel Best Practices Section — Duplication Risk (High)

The current CLAUDE.md has a 20-line `<!-- VERCEL BEST PRACTICES -->` block (lines 65-88) that was auto-injected. The plan proposes 11 sections for AGENTS.md but does not explicitly address whether this Vercel block moves to AGENTS.md, stays in CLAUDE.md, or gets dropped entirely. This block is generic (not StockView-specific) and adds ~800 tokens of non-project context. **Recommendation**: Exclude it from AGENTS.md. Keep only the 2-3 Vercel rules actually relevant to StockView (stateless functions, cron UTC, regions near DB). The rest is noise.

### G2: Existing `.agents/skills/` Directory Not Addressed (High)

The project already has `.agents/skills/vercel-react-best-practices/` with its own `AGENTS.md`, `SKILL.md`, and 60+ rule files. The plan's Phase 3 proposes adding `data-pipeline` and `prisma-migration` skills but never mentions the existing skills directory or how root AGENTS.md relates to `.agents/skills/*/AGENTS.md`. **Recommendation**: Add a note that root `AGENTS.md` is for Claude Code context (via @import), while `.agents/skills/` is for on-demand skill loading — they serve different purposes and should not duplicate content.

### G3: No Rollback or Validation Criteria (Medium)

The plan defines 5 phases but no success criteria or rollback triggers. How do you know if the AGENTS.md is working? The Vercel benchmark had a test suite — StockView has no test framework. **Recommendation**: Define 2-3 observable signals: (a) agent correctly uses `withRetry()` pattern without being told in-prompt, (b) agent respects Korean color convention without reminder, (c) agent runs `npx prisma generate` before `npm run build` without explicit instruction.

### G4: bkit Integration is Vague (Medium)

The plan mentions "routing hints in AGENTS.md for bkit PDCA" but doesn't specify what these hints look like. The `pdca-status.json` is 37K+ tokens — clearly an active workflow. **Recommendation**: Define 1-2 concrete routing hints, e.g., "After completing a feature, run `bkit checkpoint` to record progress" or "Check `bkit pdca status` before starting work on a new phase."

### G5: 5-Agent Harness Roles vs. Single-Developer Reality (Medium)

The plan defines 5 agent roles (CTO Lead/opus, Plan/sonnet, Code/sonnet, Gap Detector/sonnet, Review/sonnet). This is a solo-developer project with a single Next.js app. Running 5 specialized agents adds orchestration complexity that may not pay off. **Recommendation**: Start with 2 roles: (a) Plan+Review (opus) and (b) Code (sonnet). Add Gap Detector only after you have enough bkit audit history to feed it. The CTO Lead role is redundant when you are the CTO.

### G6: Permission Model Gaps (Medium)

Current `settings.local.json` allows specific commands (`gh workflow`, `gh run`, `gh secret`, `bun install`, `brew uninstall`, `claude`). The plan mentions "permission model refinement" but doesn't specify what changes. Notably missing: `npx prisma` commands are not in the allow list — agents will be prompted every time they run migrations. **Recommendation**: Add `Bash(npx prisma:*)` and `Bash(npm run seed:*)` to the allow list, since these are safe read/write operations against the dev database.

### G7: No Mention of CLAUDE.md Override Behavior (Low)

The plan says CLAUDE.md becomes a "thin wrapper" but doesn't address what happens to instructions that exist in both files. Claude Code's merge behavior is: all CLAUDE.md files are merged (global > project root > subdirectory), with later/closer files taking precedence. If AGENTS.md says "use Prisma for all DB access" and CLAUDE.md has a conflicting instruction, the CLAUDE.md instruction wins. **Recommendation**: Add a brief note about conflict resolution — AGENTS.md is the source of truth, CLAUDE.md should only ADD, never contradict.

### G8: Missing "Common Mistakes" Section (Low)

The Vercel benchmark AGENTS.md and the GitHub Blog best practices both highlight that a "Common Mistakes / Gotchas" section is highly effective. The plan's 11 sections include "Don'ts" but not "Common Mistakes." These are different — Don'ts are prohibitions, while Common Mistakes are "if you see X error, the fix is Y." For StockView, examples: EUC-KR encoding issues with Naver scraping, NXT price contamination in KR quotes (commit d15cd6f), exchange rate fetch timing.

---

## Specific Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Address G1: Decide Vercel block fate before writing AGENTS.md | 5 min |
| P0 | Address G2: Document `.agents/skills/` vs root `AGENTS.md` scope distinction | 10 min |
| P1 | Address G3: Define 3 observable validation signals | 15 min |
| P1 | Address G5: Reduce to 2 agent roles initially | 5 min |
| P1 | Address G6: Add Prisma/seed commands to permission allow list | 2 min |
| P2 | Address G4: Write 2 concrete bkit routing hints | 10 min |
| P2 | Address G8: Add "Common Mistakes" as 12th section | 15 min |
| P3 | Address G7: Add conflict resolution note to implementation guide | 5 min |

---

## Overall Assessment: 7.5 / 10

**Justification**: The plan is well-researched (the `.ai/research/` corpus is thorough and covers compatibility, content allocation, and ecosystem patterns). The core strategy — AGENTS.md as single source of truth with CLAUDE.md as thin wrapper — is the industry-standard pattern used by next.js, grafana, and recommended by Anthropic's own docs. The 5-phase rollout is sensible.

The 2.5 point deduction comes from: (a) the 5-agent role model is over-engineered for a solo project (-1), (b) no validation criteria to know if the AGENTS.md is actually improving agent behavior (-0.5), (c) the existing `.agents/skills/` directory and Vercel best practices block are unaddressed elephants that will cause confusion during implementation (-0.5), and (d) bkit integration remains hand-wavy (-0.5).

The plan is ready for implementation after addressing G1, G2, and G5. The remaining gaps are refinements that can be handled during Phase 5 (iteration).
