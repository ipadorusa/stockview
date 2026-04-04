# CLAUDE.md + AGENTS.md 크로스 툴 호환성 리서치

**작성일**: 2026-04-04
**현재 상태**: Claude Code는 AGENTS.md를 네이티브로 읽지 **않음**. 우회 방법이 존재하며 검증됨.

---

## 1. Claude Code 공식 동작 (Anthropic 공식 문서)

**출처**: https://docs.anthropic.com/en/docs/claude-code/memory#agents-md

> Claude Code는 `CLAUDE.md`를 읽지, `AGENTS.md`를 읽지 않습니다. 저장소에 이미 다른 코딩 에이전트용 `AGENTS.md`가 있다면, 이를 import하는 `CLAUDE.md`를 만들어 양쪽 도구가 동일한 지시를 중복 없이 읽도록 하세요.

공식 권장 패턴:

```markdown
# CLAUDE.md
@AGENTS.md

## Claude Code
Use plan mode for changes under `src/billing/`.
```

### 핵심 사실:
- **`@import` 문법은 공식 지원** — CLAUDE.md 안에서 `@파일경로`를 쓰면 세션 시작 시 해당 파일을 확장
- 상대 경로는 import를 포함한 파일 기준으로 해석
- 재귀 import 지원 (최대 깊이: 5 hops)
- 외부 import는 첫 실행 시 승인 다이얼로그 표시
- **Claude Code는 AGENTS.md로 폴백하지 않음** — CLAUDE.md만 읽음
- **심링크는 따라감** — CLAUDE.md가 심링크면 원본 파일 내용을 읽음

---

## 2. vercel/next.js — "심링크" 주장의 진실

**실제**: next.js는 심링크를 사용하지 **않음**. `CLAUDE.md` 파일에는 한 줄만 있음:

```
AGENTS.md
```

이것은 **@import 방식** — CLAUDE.md가 AGENTS.md를 import하는 것. GitHub API로 확인한 결과 `type: "file"`, `target: null` (심링크 아님). 파일 내용은 문자 그대로 "AGENTS.md"이며, Claude Code가 이를 `@AGENTS.md`로 해석.

**출처**: `gh api repos/vercel/next.js/contents/CLAUDE.md` — type은 "file", "symlink"이 아님

---

## 3. 주요 프로젝트의 실전 패턴

### 패턴 A: @import (권장 — 가장 인기)

**grafana/docker-otel-lgtm** — CLAUDE.md 내용:
```markdown
<!-- markdownlint-disable-file -->
@AGENTS.md
```

**ruby/rdoc** — CLAUDE.md 내용:
```markdown
Please refer to `AGENTS.md` for comprehensive project documentation...
All project-specific instructions are maintained in `AGENTS.md`.
```

**freema/mcp-jira-stdio** — CLAUDE.md 내용:
```markdown
This document has been consolidated into AGENTS.md (the single source of truth).
```

### 패턴 B: 강제 Read 지시

**getsentry/sentry-java** — CLAUDE.md 내용:
```markdown
## STOP -- 필수 읽기 (먼저 이것부터)

다른 어떤 작업보다 먼저 (질문 답변 포함), 반드시 Read 도구를 사용하여
[AGENTS.md](AGENTS.md)를 로드하고 모든 지시를 따르세요.
참조하는 `.cursor/rules/*.mdc` 파일도 포함하여 읽어야 합니다.
이 단계를 건너뛰지 마세요. 이 파일들을 읽지 않고 진행하지 마세요.
```

"프롬프트 엔지니어링" 접근 — @import를 사용하지 않고, Claude에게 Read 도구로 파일을 직접 읽으라고 지시.

### 패턴 C: 심링크

**parfenovvs** (이슈 #6235 댓글에서):
```bash
ln -s AGENTS.md CLAUDE.md
```
macOS/Linux에서 동작. Claude Code는 심링크를 따라가서 AGENTS.md 내용을 읽음. **제한**: Claude 전용 지시를 추가할 수 없음 (전부 아니면 전무).

**apache/superset** — CLAUDE.md, GEMINI.md 등에 심링크를 사용하는 것으로 언급됨.

### 패턴 D: 훅 (SessionStart)

**DylanLIiii** (이슈 #6235 원저자)가 Claude Code 훅을 사용하는 방법을 제안:
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_CODE_SESSION_DIR/load-agents.sh"
      }]
    }]
  }
}
```
세션 시작 시 저장소 내 모든 AGENTS.md 파일을 자동 로딩.

---

## 4. GitHub 이슈 #6235 — 현황 및 커뮤니티 반응

**URL**: https://github.com/anthropics/claude-code/issues/6235
- **등록일**: 2025년 8월, DylanLIiii
- **상태**: OPEN (2026년 4월 현재)
- **투표**: 3,020+
- **댓글**: 224+
- **Anthropic 공식 응답**: **없음** (팀 응답 0건)

관련 이슈 (모두 오픈, 공식 응답 없음):
- **#34235** — "CLAUDE.md와 함께 AGENTS.md를 네이티브 컨텍스트 파일로 지원해달라"
- **#31005** — "2025년 8월부터 커뮤니티가 요청 중인 AGENTS.md 지원" (7개월+ 침묵 기록)
- **#41172** — "/init 스킬이 AGENTS.md를 발견하지 못함" (완료로 종료 — /init 스킬이 업데이트됨)

이슈 #31005 요약: **"7개월. 3,020 upvote. 인정 0건."**

---

## 5. `echo "Read @AGENTS.md" > CLAUDE.md`는 동작하는가?

**동작하지만 뉘앙스가 있음.** `@AGENTS.md` import 문법은 공식 지원. CLAUDE.md에 `@AGENTS.md`만 쓰면 세션 시작 시 Claude Code가 AGENTS.md를 확장 로딩함. 단:

- "Read" 접두사는 **불필요** — `@AGENTS.md`만으로 충분
- `@` 접두사가 import를 트리거하는 것이지, "Read"라는 단어가 아님
- `@` 없이 bare `AGENTS.md`만 써도 (next.js처럼) 동작하는 것으로 보임 — Claude Code 파서가 파일명을 import로 인식하는 듯

---

## 6. 접근 방식 비교

| 방식 | 동작? | Claude 전용 추가? | Git 깔끔? | 크로스 플랫폼? |
|---|---|---|---|---|
| CLAUDE.md에 `@AGENTS.md` | ✅ (공식) | ✅ import 아래에 추가 | 2개 파일 커밋 | ✅ |
| `ln -s AGENTS.md CLAUDE.md` | ✅ | ❌ 전부 아니면 전무 | git이 심링크 추적 | macOS/Linux만 |
| 강제 Read 지시 | ✅ (불안정) | ✅ | 2개 파일 커밋 | ✅ |
| SessionStart 훅 | ✅ | ✅ (훅 스크립트 필요) | .claude/settings.json 필요 | ✅ |
| 내용 복제 | ✅ | ✅ | 2개 파일 유지 관리 | ✅ |

---

## 7. 권장 설정

크로스 툴 호환 (Claude Code + Cursor + Codex)을 위한 가장 깔끔한 접근:

1. **AGENTS.md** — 모든 공유 지시의 단일 소스 of truth
2. **CLAUDE.md** — 얇은 래퍼:
   ```markdown
   @AGENTS.md

   ## Claude Code 전용
   (Claude만의 지시를 여기에)
   ```
3. **.cursor/rules/** — 필요 시 Cursor 전용 규칙
4. CLAUDE.md를 버전 관리에 포함 (파일 크기가 극히 작음)

이 패턴은 grafana, next.js가 사용하며, Anthropic 공식 문서에서 권장하는 방식.

---

## 참조 링크

### 공식 문서
- https://docs.anthropic.com/en/docs/claude-code/memory — Claude Code 메모리 & CLAUDE.md 공식 문서 (`@import` 문법, AGENTS.md 호환 가이드 포함)
- https://agents.md/ — AGENTS.md 공식 사이트
- https://github.com/agentsmd/agents.md — AGENTS.md 공식 GitHub 저장소

### GitHub 이슈 (Claude Code AGENTS.md 지원 요청)
- https://github.com/anthropics/claude-code/issues/6235 — 원본 이슈 (3,020+ upvote, DylanLIiii)
- https://github.com/anthropics/claude-code/issues/34235 — "CLAUDE.md와 함께 네이티브 지원 요청"
- https://github.com/anthropics/claude-code/issues/31005 — "7개월+ 커뮤니티 요청" 기록

### 실제 프로젝트 CLAUDE.md 파일 (GitHub)
- https://github.com/vercel/next.js/blob/canary/CLAUDE.md — Next.js (`AGENTS.md` 한 줄 import)
- https://github.com/grafana/docker-otel-lgtm/blob/main/CLAUDE.md — Grafana (`@AGENTS.md` import)
- https://github.com/ruby/rdoc/blob/master/CLAUDE.md — Ruby rdoc (AGENTS.md 참조 안내)
- https://github.com/getsentry/sentry-java/blob/main/CLAUDE.md — Sentry Java (강제 Read 지시 패턴)
- https://github.com/apache/superset — Apache Superset (심링크 사용 언급)

### 실제 프로젝트 AGENTS.md 파일 (GitHub)
- https://github.com/vercel/next.js/blob/canary/AGENTS.md — Next.js (Skills 모델, 21.4KB)
- https://github.com/getsentry/sentry/blob/master/AGENTS.md — Sentry (계층형 모델, 7.8KB root)

### 가이드 & 블로그
- https://thepromptshelf.dev/blog/agents-md-vs-claude-md/ — AGENTS.md vs CLAUDE.md 비교 분석
- https://medium.com/data-science-collective/the-complete-guide-to-ai-agent-memory-files-claude-md-agents-md-and-beyond-49ea0df5c5a9 — AI 에이전트 메모리 파일 완전 가이드
- https://www.augmentcode.com/guides/how-to-build-agents-md — Augment Code의 AGENTS.md 빌드 가이드
- https://dev.to/datadog-frontend-dev/steering-ai-agents-in-monorepos-with-agentsmd-13g0 — Datadog 모노레포 AGENTS.md 가이드 (`echo "Read @AGENTS.md" > CLAUDE.md` 원라이너 출처)

### 예측 시장
- https://manifold.markets/bessarabov/will-claude-code-support-agentsmd-i — "Claude Code가 2026년 내 AGENTS.md를 지원할까?" 예측 시장

---

*리서치 완료: 2026-04-04*
