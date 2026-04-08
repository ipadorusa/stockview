---
name: invoke-agent
description: |
  Invoke a custom agent defined in .claude/agents/ programmatically.
  Workaround for the limitation that custom agents (.claude/agents/*.md)
  can only be triggered via @mention, not via the Agent tool's subagent_type.

  This skill reads the agent definition file, extracts frontmatter (model, tools)
  and system prompt, then spawns a general-purpose agent with the correct configuration.

  <example>
  user: "invoke-agent data-source-analyzer 'Naver 수집 실패 원인 분석해줘'"
  assistant: Reads .claude/agents/data-source-analyzer.md, spawns agent with its system prompt
  </example>

  <example>
  user: "invoke-agent cron-reviewer '크론 워크플로우 전체 점검'"
  assistant: Reads .claude/agents/cron-reviewer.md, spawns haiku agent with cron review prompt
  </example>
user-invocable: true
---

# invoke-agent

Custom agent를 Agent tool로 프로그래밍적으로 호출하는 래퍼 스킬.

## 사용법

```
/invoke-agent {agent-name} '{task-description}'
```

## 실행 절차

### Step 1: 에이전트 정의 파일 읽기

`.claude/agents/{agent-name}.md` 파일을 Read 도구로 읽는다.

파일이 없으면 에러: "에이전트 '{agent-name}'을 찾을 수 없습니다. `.claude/agents/` 디렉토리를 확인하세요."

### Step 2: Frontmatter 파싱

YAML frontmatter에서 추출:
- `model`: haiku / sonnet / opus (없으면 부모 상속)
- `tools`: 콤마 구분 도구 목록 (없으면 전체)
- `name`: 에이전트 식별자

### Step 3: Agent tool로 스폰

```
Agent tool 호출:
  subagent_type: "general-purpose"
  model: {frontmatter에서 추출한 model}
  prompt: |
    {시스템 프롬프트 전문}

    ---
    ## Task
    {사용자가 전달한 task-description}
  description: "invoke {agent-name}"
```

### Step 4: 도구 제한 안내

frontmatter에 `tools` 필드가 있으면 프롬프트에 다음을 추가:

```
## Tool Restrictions
You may ONLY use these tools: {tools 목록}
Do NOT use Write, Edit, or Bash unless explicitly listed above.
```

> **참고**: Agent tool의 general-purpose 타입은 모든 도구에 접근 가능하므로,
> 도구 제한은 시스템 프롬프트 내 instruction으로만 강제됩니다.
> 진정한 도구 차단이 아닌 soft restriction입니다.

## 사용 가능한 에이전트

### 분석 에이전트 (Opus, read-only)

| 에이전트 | 도구 | 용도 |
|---------|------|------|
| `data-source-analyzer` | Read, Grep, Glob | Naver/Yahoo/KRX 데이터소스 분석 |
| `cron-reviewer` | Read, Grep, Glob | 크론 워크플로우 정합성 검증 |
| `schema-reviewer` | Read, Grep, Glob | Prisma 스키마 영향도 분석 |

### 수정 에이전트 (Sonnet, write-capable)

| 에이전트 | 도구 | 용도 |
|---------|------|------|
| `code-fixer` | Read, Grep, Glob, Write, Edit, Bash | 분석/Design 결과 기반 코드 수정 |

## 모델 배치 원칙

- **분석 에이전트**: `model: opus` (복잡한 추론, 패턴 파악)
- **수정 에이전트**: `model: sonnet` (명확한 지시 기반 코드 편집)
- 리서치 참조: `.ai/research/subagent-usage-patterns.md` §12.1
