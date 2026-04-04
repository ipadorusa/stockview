# AGENTS.md Plan — Pass 2 Review (Feasibility & Technical Accuracy)

**Reviewer**: Claude Opus 4.6 | **Date**: 2026-04-05

---

## 1. `@AGENTS.md` Import — Does It Actually Work?

**Verdict: WORKS (confirmed)**

The compatibility research (`claude-md-agents-md-compatibility.md`) confirms:
- `@import` syntax is officially supported by Claude Code
- Anthropic docs explicitly recommend `@AGENTS.md` in CLAUDE.md
- Real-world usage: Vercel/next.js, Grafana, Ruby/rdoc all use this pattern
- Relative paths resolved from the importing file's location
- Recursive imports supported (max depth: 5 hops)

No technical risk here.

---

## 2. Size Estimate: 100-120 Lines / Under 4KB

**Verdict: TIGHT but feasible**

Math check:
- 11 sections with headers = ~22 lines (headers + blank lines)
- Remaining ~80-98 lines for content = ~7-9 lines per section average
- At ~40 bytes/line average, 120 lines = ~4.8KB

**Problem**: 120 lines will likely exceed 4KB unless content is very terse. The Vercel root AGENTS.md is 176 lines / ~4KB, but it uses extremely compact formatting.

Current CLAUDE.md is 88 lines / ~4.2KB (including the Vercel boilerplate section).

Recommendation: Budget 120-150 lines / 5KB. The 4KB target is artificially tight. Research says the effective ceiling is 150-200 lines before splitting becomes necessary.

---

## 3. Migration Risk: CLAUDE.md to 10-Line Wrapper

**Verdict: MEDIUM RISK — Vercel section is NOT transferable**

Current CLAUDE.md content breakdown:
| Section | Lines | Transferable to AGENTS.md? |
|---|---|---|
| Project Overview (L1-7) | 7 | YES |
| Commands (L9-27) | 19 | YES |
| Architecture - Tech Stack (L30-38) | 9 | YES |
| Architecture - Data Sources (L40-46) | 7 | YES |
| Architecture - Data Flow (L48-53) | 6 | YES |
| Architecture - Key Conventions (L55-60) | 6 | YES |
| Environment Variables (L62-63) | 2 | YES |
| **Vercel Best Practices (L65-88)** | **24** | **NO** |

The Vercel Best Practices section (24 lines, ~29% of file) is:
- Auto-injected by Vercel (`<!-- VERCEL BEST PRACTICES START/END -->`)
- Vercel-managed content that may auto-update
- Claude Code-specific deployment guidance

**If you move everything to AGENTS.md except the Vercel section**, the CLAUDE.md wrapper becomes:
```markdown
@AGENTS.md

## Claude Code Specific
<!-- VERCEL BEST PRACTICES START -->
... (Vercel auto-managed content)
<!-- VERCEL BEST PRACTICES END -->
```

This is ~27 lines, not 10. The plan's "10-line CLAUDE.md" claim is inaccurate.

---

## 4. Agent Role Enforcement

**Verdict: NOT ENFORCEABLE as described**

The plan proposes 5 agent roles (CTO Lead/opus, Plan/sonnet, Code/sonnet, Gap Detector/sonnet, Review/sonnet). Reality check:

- Claude Code's `settings.local.json` permissions are **global**, not per-agent. There is no mechanism to restrict tool access per agent role.
- The current `agent-state.json` shows bkit already tracks agent roles ("Plan", "general-purpose", "superpowers:code-reviewer"), but these are bkit orchestration concepts, not Claude Code native features.
- Claude Code sub-agents (via SendMessage/TaskCreate) all inherit the same permission set.
- **Per-agent tool restrictions are not possible** in the current Claude Code architecture.

The roles can exist as **conventions** (prompt-based), but cannot be technically enforced.

---

## 5. bkit Compatibility

**Verdict: NO CONFLICT**

bkit operates independently:
- `.bkit/state/` — agent-state.json, memory.json, session-history.json, pdca-status.json
- `.bkit/audit/` — daily JSONL audit logs
- `.bkit/runtime/` — runtime agent state

bkit does not read or depend on CLAUDE.md or AGENTS.md content. It tracks its own orchestration state. The AGENTS.md migration will not affect bkit at all.

One note: bkit's `agent-state.json` already implements its own role system. The plan's agent roles should align with bkit's existing role taxonomy to avoid confusion.

---

## 6. settings.local.json Permission Changes

**Verdict: SAFE with caveats**

Current permissions are already relatively permissive (context-mode MCP, gh workflow/secret/run, brew, bun, claude CLI). The plan proposes adding:
- Permission refinements for agent roles

Since Claude Code permissions are global (not per-role), any additions apply to ALL agents. The current set is reasonable. Adding more `Bash()` patterns should be done conservatively.

No security holes identified in current config.

---

## 7. Day-to-Day Workflow

**Verdict: MINIMAL CHANGE for developers**

Typical task flow after migration:
1. Developer opens Claude Code session
2. Claude Code reads CLAUDE.md, which `@import`s AGENTS.md
3. Both files are expanded into context (same as today but from two sources)
4. Developer works normally

The only behavioral difference: instructions now come from AGENTS.md (via import) instead of directly from CLAUDE.md. This is transparent to the user.

If using Cursor or other tools simultaneously, they read AGENTS.md natively — that's the actual benefit.

---

## 8. Cost/Token Implications

**Verdict: NEGLIGIBLE increase**

The `@import` pattern loads AGENTS.md content into CLAUDE.md at session start. Token usage:
- **Before**: ~4.2KB CLAUDE.md loaded per request
- **After**: ~5KB AGENTS.md + ~1KB CLAUDE.md wrapper = ~6KB loaded per request
- **Increase**: ~1.8KB (~450 tokens) per request

At Claude's pricing, this is negligible (<$0.01/day for typical usage). But it means the total context budget is ~6KB, not the plan's stated ~5KB.

The Vercel section staying in CLAUDE.md adds overhead that the plan didn't account for.

---

## 9. Rollback Plan

**Verdict: TRIVIAL — git revert**

Since this is just two file changes (create AGENTS.md, modify CLAUDE.md):
- `git revert <commit>` restores original CLAUDE.md
- Delete AGENTS.md
- Total rollback time: <1 minute

No database changes, no config migrations, no dependency changes.

---

## Summary

### Technically Sound
- `@AGENTS.md` import pattern: confirmed working, officially documented
- bkit compatibility: no conflicts
- Rollback: trivial (git revert)
- Day-to-day workflow: transparent to developers
- Token cost: negligible increase

### Feasibility Concerns (Medium Risk)
- **Size estimate too aggressive**: 4KB target will be exceeded. Budget 5-6KB total.
- **"10-line CLAUDE.md" is inaccurate**: Vercel boilerplate forces ~27 lines minimum. The plan needs to account for the Vercel auto-managed section.
- **Token budget underestimated**: Plan says <5KB total, reality will be ~6KB due to Vercel section.

### Blockers / Inaccuracies (High Risk)
- **Per-agent tool restrictions are NOT possible** in Claude Code. The plan's agent role enforcement strategy is aspirational, not implementable. Roles can only be enforced via prompt conventions (unreliable).
- **Vercel Best Practices section was overlooked**: This auto-managed section cannot be moved to AGENTS.md and will break the "thin wrapper" design.

### Concrete Suggestions
1. **Acknowledge the Vercel section**: CLAUDE.md will be ~27 lines (import + Vercel section), not 10. Update the plan accordingly.
2. **Relax size target**: 5-6KB total (AGENTS.md + CLAUDE.md) instead of <4KB AGENTS.md alone.
3. **Reframe agent roles as conventions**: Drop the claim of "enforcement" — describe them as prompt-based guidance that bkit can track but Claude Code cannot enforce.
4. **Align with bkit role taxonomy**: The plan's 5 roles should map to bkit's existing role system (Plan, general-purpose, superpowers:code-reviewer) to avoid a parallel taxonomy.
5. **Consider keeping Data Sources detail in CLAUDE.md**: The Naver Finance EUC-KR scraping details, Yahoo v8 API specifics, and KRX legacy notes are Claude Code-specific debugging context. Other tools don't need this level of detail. Moving them to AGENTS.md wastes context for non-Claude tools.

---

## Overall Feasibility Score: 7/10

The core strategy (AGENTS.md + CLAUDE.md bridge) is technically sound and well-researched. The main risks are:
- Overly optimistic size estimates (cosmetic fix)
- Agent role enforcement claim (needs reframing, not blocking)
- Vercel section oversight (easy to accommodate)

None of these are blockers. With the adjustments above, the plan is ready for execution.
