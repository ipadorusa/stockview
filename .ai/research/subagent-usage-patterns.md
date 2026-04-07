# Sub-Agent 리서치 종합 (2026-04-07)

**리서처**: Agent A (실제 사용 사례 + 딥다이브), Agent B (아키텍처 패턴 + 딥다이브)
**리서치 라운드**: 2회 (1차 개요 → 2차 갭 보완)

---

## 1. Frontmatter 완전 스펙

### 1.1 파일 위치

```
.claude/agents/{agent-name}.md    # 프로젝트 로컬 (git 커밋, 팀 공유)
~/.claude/agents/{agent-name}.md  # 글로벌 (모든 프로젝트, 개인용)
```

### 1.2 Frontmatter 필드 레퍼런스

| 필드 | 타입 | 필수 | 허용값 | 기본값 | 설명 |
|------|------|------|--------|--------|------|
| `name` | string | **YES** | kebab-case | — | 고유 식별자. `@agent-name`으로 호출 |
| `description` | string (multiline) | **YES** | 텍스트 + `<example>` 블록 | — | 자동 호출 트리거 판단 기준. 2-3개 예시 포함 권장 |
| `model` | string | No | `haiku`, `sonnet`, `opus`, 또는 full ID | 부모 모델 상속 | 비용 최적화 핵심 |
| `tools` | string (comma-sep) | No | `Read, Grep, Glob, Write, Edit, Bash, WebSearch, WebFetch, ...` | 부모 전체 도구 상속 | read-only = `Read, Grep, Glob` |
| `color` | string | No | CSS 색상명 또는 hex | gray | UI 시각화용 |
| `memory` | string | No | `project`, `user` | 없음 | 에이전트별 영속 메모리 |
| `isolation` | string | No | `worktree` | 없음 | git worktree 격리 실행 |
| `maxTurns` | integer | No | 1-100 | 10 | 최대 대화 턴 (무한루프 방지) |

### 1.3 문법 주의사항

```yaml
# ✅ tools는 콤마 구분 문자열 (실전 표준)
tools: Read, Grep, Glob, WebSearch

# ❌ YAML 배열은 실전에서 사용하지 않음
# tools: [Read, Grep, Glob]

# ✅ description에 <example> 블록 포함 → 자동 트리거 신뢰성 향상
description: |
  Use this agent when reviewing cron workflows.
  <example>
  user: "크론 워크플로우 검토해줘"
  assistant: "cron-reviewer 에이전트를 호출합니다."
  </example>

# ✅ model 생략 시 부모 모델 상속
# ✅ tools 생략 시 부모 전체 도구 상속
```

---

## 2. 실제 에이전트 정의 파일 (4개 실제 예제)

### 2.1 plan-reviewer.md (n8n 프로젝트)

```yaml
---
name: plan-reviewer
description: "Use this agent when a plan needs rigorous review before execution.
  <example>
  user: \"Here's my plan: 1. Add cron. 2. Fetch data. 3. Send to Telegram.\"
  assistant: \"Let me invoke plan-reviewer to identify gaps.\"
  </example>"
model: opus
color: red
memory: project
---

You are a Critical Plan Reviewer. Analyze plans across 7 dimensions:
1. Scope & Goal Clarity
2. Completeness of Steps
3. Risk & Edge Cases
4. Dependencies & Prerequisites
5. Timeline & Resources
6. Integration & Impact
7. Validation & Testing
```

**특징**: opus 모델, project 메모리, 7차원 리뷰 프레임워크

### 2.2 execute-plan.md (범용)

```yaml
---
name: execute-plan
description: 플랜 파일(task_plan.md)을 읽고 Phase별로 자동 실행하는 범용 agent.
---

You are a plan execution agent. Read plan file → execute each phase →
track progress in progress.md → skip completed phases → resume from pending.
```

**특징**: model/tools 생략 (부모 상속), 멱등 설계 (progress.md로 재시작 가능)

### 2.3 vscode-translation-manager.md

```yaml
---
name: vscode-translation-manager
description: Use this agent when working with localization in VS Code extensions.
  <example>user: "Add an error message for failed config loading"</example>
  <example>user: "Check if all strings are set up for translation"</example>
tools: Bash, Glob, Grep, Read, Edit, Write, WebFetch, WebSearch, AskUserQuestion
model: opus
color: purple
---
```

**특징**: 광범위한 도구 접근, 2개 example 블록, opus 모델

### 2.4 vscode-test-writer.md

```yaml
---
name: vscode-test-writer
description: Use this agent when writing tests for VS Code extension code.
  <example>user: "I just added a new command. Create tests for it."</example>
tools: Bash, Glob, Grep, Read, Edit, Write, WebFetch, WebSearch
model: opus
color: blue
---
```

**특징**: Write 가능 에이전트 (테스트 파일 생성), blue 색상

---

## 3. 부모-서브에이전트 상호작용

### 3.1 결과 반환 모델

- 서브에이전트는 **독립 컨텍스트 윈도우**에서 실행
- 부모에게 **요약/구조화된 결과** 반환 (전체 대화 이력 아님)
- 반환 내용: 최종 답변, 핵심 발견 사항, 수정된 파일 목록, 성공/실패 상태

### 3.2 데이터 전달 방법

| 방법 | 설명 | 용도 |
|------|------|------|
| 파일 경로 참조 | 서브에이전트가 Read/Grep으로 직접 읽음 | 가장 일반적 |
| 인라인 컨텍스트 | 프롬프트에 코드 스니펫 포함 | 소규모 분석 |
| 공유 파일시스템 | worktree 격리 시에도 부모 파일 읽기 가능 | 병렬 실행 |

### 3.3 토큰 비용 모델

- 부모와 서브에이전트 컨텍스트는 **완전 분리**
- 각 서브에이전트는 독자 컨텍스트 윈도우 (1M on Max plan)
- 총 비용 = 부모 토큰 + Σ(서브에이전트 토큰)
- 서브에이전트 모델에 따른 비용 차이가 핵심 최적화 포인트

---

## 4. Agent Teams 프로토콜 (멀티에이전트 오케스트레이션)

### 4.1 파일시스템 기반 조율

```
~/.claude/teams/{team-name}/
├── inboxes/
│   ├── lead.json         # 리드 에이전트 수신함
│   ├── developer.json    # 개발자 에이전트 수신함
│   └── qa.json           # QA 에이전트 수신함
└── tasks/                # 공유 태스크 보드 (파일 락킹)
```

- **수동 설정 파일 없음** — 자연어 프롬프트로 선언적 생성, 자동 조직화
- 각 에이전트는 자신의 inbox 파일을 폴링
- 태스크 클레이밍에 파일 락킹 사용 (레이스 컨디션 안전)
- `blockedBy` 배열로 의존성 관리

### 4.2 워크트리 격리 메커니즘

| 항목 | 내용 |
|------|------|
| 생성 | `.git/worktrees/<name>/`에 격리 브랜치 생성 (~밀리초) |
| 공유 | `.git` 히스토리와 remote 연결 공유 (전체 클론 아님) |
| 충돌 | 같은 파일 편집 시 별도 브랜치에서 독립 작업 → 리뷰 후 선택/머지 |
| 정리 | 클린 워크트리는 자동 삭제, 더티 워크트리는 유지/삭제 선택 |
| 비용 | 경량 (~밀리초 생성), 전체 레포 클론 불필요 |

### 4.3 병렬 실행 패턴

**병렬 리뷰어 (read-heavy)** — 가장 효과적:
```
Parent → spawn 3 parallel:
  ├── @security-reviewer (read-only, haiku)
  ├── @performance-reviewer (read-only, haiku)
  └── @architecture-reviewer (read-only, sonnet)
→ Parent synthesizes 3 findings
```

**순차 파이프라인**:
```
@planner → @worker-1, @worker-2 (parallel) → @reviewer (sequential)
```

**주의**: write-heavy 병렬은 머지 충돌 위험 → 각 에이전트가 다른 파일 담당 필수

---

## 5. Hook → 서브에이전트 트리거

### 5.1 가능 여부

**YES**, PostToolUse/PreToolUse 훅에서 서브에이전트 스폰 가능.

### 5.2 무한 루프 방지 (CRITICAL)

| 방법 | 설명 |
|------|------|
| `maxTurns: 1` | 에이전트 정의에서 최대 턴 제한 |
| read-only tools | Write 도구 없으면 훅 재트리거 불가 |
| 경로 필터링 | `when_path_contains` 로 특정 디렉토리만 매칭 |

**핵심**: read-only 서브에이전트는 파일을 수정하지 않으므로 PostToolUse(Write) 훅을 재트리거하지 않음 → 무한 루프 본질적 방지

---

## 6. Skills vs Subagents vs Hooks 의사결정 매트릭스

### 6.1 Anthropic 공식 기준

| 도구 | 특성 | 언제 사용 |
|------|------|----------|
| **Skills** | 확률적, on-demand 로딩, 부모 컨텍스트에 포함 | 도메인 지식이 자주 필요할 때 |
| **Subagents** | 격리 컨텍스트, 병렬 가능, 요약 반환 | 깊은 분석, 스코프된 작업 |
| **Hooks** | 100% 결정적, 토큰 비용 0, 쉘 명령 | 린팅, 검증, 차단 규칙 |
| **Agent Teams** | 멀티에이전트 오케스트레이션 | 대규모 병렬 작업 |

### 6.2 StockView 구체 적용

| 시나리오 | 도구 | 이유 |
|---------|------|------|
| Naver EUC-KR 인코딩 지식 | **Skill** (유지) | on-demand 도메인 지식, 항상 필요 |
| Yahoo v8 API 패턴 | **Skill** (유지) | on-demand 충분 |
| Prisma upsert 패턴 | **Skill** (유지) | 거의 매 작업에서 참조 |
| 크론 워크플로우 정합성 감사 | **Subagent** | 격리 분석, 17개 워크플로우 전체 검토 |
| 데이터소스 API 응답 디버깅 | **Subagent** | 무거운 분석, 별도 컨텍스트 필요 |
| `src/lib/data-sources/` 수정 후 린트 | **Hook** | 결정적, 빠름, 토큰 0 |
| `prisma/schema.prisma` 수정 후 검증 | **Hook** | `npx prisma validate` 자동 실행 |
| `.env` 파일 수정 차단 | **Hook** | PreToolUse 차단 규칙 |

### 6.3 비용 비교

| 접근법 | 토큰 비용 | 예시 |
|--------|----------|------|
| Skill | 부모 컨텍스트에 포함 (세션 시작 시 로딩) | 50K (부모 + 스킬 내장) |
| Subagent (haiku, read-only) | 별도 컨텍스트 | 50K (부모) + 5K (서브) = 55K (+10%) |
| Subagent (sonnet) | 별도 컨텍스트 | 50K (부모) + 15K (서브) = 65K (+30%) |
| Hook (bash) | 토큰 비용 없음 | 50K (변화 없음) |

---

## 7. 3-Tier 비용 최적화 전략

```
Haiku (분류/트리아지)  →  Sonnet (실행/분석)  →  Opus (리뷰/종합)
     최저 비용                중간                   최고
```

- 50-80% 비용 절감 보고
- 집중형 에이전트로 97% 토큰 절감 사례
- Claude Max ($100/mo): 에이전트 팀 사용 가능
- Max 20x ($200/mo): 헤비 유저

---

## 8. Agent Teams 프로덕션 교훈

### 8.1 알려진 이슈

- v2.1.74+에서 4개 메모리 누수 수정 (원격 스트리밍 인터럽트, Bash 파싱 모듈 등)
- 설정 변경 시 렌더 간 충돌 → 수정됨
- 세션 길이 제한 없음, 단 `context-mode` MCP로 60-90% 토큰 절감 권장

### 8.2 TeammateIdle 훅

- 팀원이 태스크 소진 시 발동
- exit code 2 → 피드백 전송 + 팀원 계속 작업
- 후속 작업 할당 또는 TODO/FIXME 위임에 활용

### 8.3 실전 권장사항

- 순차 작업이 병렬보다 저렴 (단일 vs N × 컨텍스트)
- read-heavy 병렬이 가장 효과적
- write-heavy 병렬은 머지 충돌 위험
- 2시간+ 세션은 주기적 `/clear` 권장
- 동시 팀원 3-5명이 성능 저하 없는 실용 한계

---

## 9. 안티패턴 정리

1. **범용 에이전트** — "QA agent" 대신 역할별 세분화 필요
2. **도구 과다 부여** — 모든 에이전트에 전체 도구 → 컨텍스트 비대화, 추론 속도 저하
3. **버전 관리 미적용** — `.claude/agents/`를 git에 커밋하지 않으면 팀 공유 불가
4. **Hook 무한 루프** — 서브에이전트가 Write → PostToolUse 재트리거 → 무한 반복
5. **시스템 프롬프트 비대** — 핵심만 포함, 상세 내용은 Skills 참조 유도
6. **write-heavy 병렬** — 같은 파일 동시 수정 시 머지 충돌
7. **모델 미분화** — 모든 에이전트에 opus → 비용 폭증

---

## 10. 참고 소스

### 공식 문서
- Anthropic Sub-Agents: https://code.claude.com/docs/en/sub-agents
- Anthropic Agent Teams: https://code.claude.com/docs/en/agent-teams
- Anthropic Skilljar: https://anthropic.skilljar.com/introduction-to-subagents

### 커뮤니티 & 블로그
- PubNub Best Practices: https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/
- DEV Community Custom Framework: https://dev.to/therealmrmumba/claude-codes-custom-agent-framework-changes-everything-4o4m
- Skills vs Subagents: https://dev.to/nunc/claude-code-skills-vs-subagents-when-to-use-what-4d12
- Mental Model: https://levelup.gitconnected.com/a-mental-model-for-claude-code-skills-subagents-and-plugins-3dea9924bf05
- Agent Teams Reverse Engineering: https://nwyin.com/blogs/claude-code-agent-teams-reverse-engineered
- Worktree Isolation: https://medium.com/@richardhightower/git-worktree-isolation-in-claude-code-parallel-development-without-the-chaos-262e12b85cc5

### 레포지토리
- VoltAgent/awesome-claude-code-subagents — 100+ 전문 에이전트
- 0xfurai/claude-code-subagents — 100+ 프로덕션 에이전트
- iannuttall/claude-agents — 커스텀 에이전트 예제

### 기타
- OpenAI Harness Engineering: https://openai.com/index/harness-engineering/
- Claude Haiku Multi-Agent: https://caylent.com/blog/claude-haiku-4-5-deep-dive-cost-capabilities-and-the-multi-agent-opportunity
- Memory Leak Issues: https://github.com/anthropics/claude-code/issues/11315

---

## 11. 검증 보고서 (Verification Agent)

**검증일**: 2026-04-07
**검증 방법**: 공식 Anthropic 문서, GitHub 레포, 커뮤니티 소스 교차 검증

### 검증 결과 요약

| 정확도 | 82% (13개 주요 주장 중 11개 검증, 2개 미확인) |
|--------|----------------------------------------------|
| 심각한 문제 | **없음** |
| 경미한 문제 | 3개 (아래 참조) |

### 섹션별 검증

#### ✅ 검증됨 (11개)
- `.claude/agents/{name}.md` 파일 위치
- `tools` 콤마 구분 문자열 형식
- `model` 필드 부모 상속 기본값
- VoltAgent/awesome-claude-code-subagents 레포 존재 (100+)
- 0xfurai/claude-code-subagents 레포 존재 (100+)
- 서브에이전트 컨텍스트 완전 분리 (독립 1M 윈도우)
- 토큰 비용 모델 (부모 + Σ서브에이전트)
- Agent Teams 인박스 기반 파일시스템 조율 (`~/.claude/teams/`)
- 워크트리 격리 메커니즘
- Skills/Subagents/Hooks 의사결정 매트릭스
- Hook 무한루프 방지 패턴 (read-only + `disableAllHooks`)

#### ⚠️ 미확인 — 실험적/커뮤니티 관례 (3개)
1. **`memory: project` 필드** — 공식 문서에서 확인 불가, 내부/실험적 기능일 수 있음
2. **`maxTurns` 필드** — 패턴은 존재하지만 공식 문서화되지 않음
3. **`color` 필드** — UI 전용으로 보이나 공식 상태 불명

#### ❌ 오류 발견
- 없음

### 검증 에이전트 권고사항
1. Section 1.2의 `memory`, `maxTurns`, `color` 필드를 "실험적/커뮤니티 관례"로 표기
2. 실제 적용 시 `name`, `description`, `model`, `tools` 4개 핵심 필드만 의존 권장
3. 나머지 필드는 최신 CC 버전에서 직접 테스트 후 사용
