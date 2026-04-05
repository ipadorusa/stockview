# Plan: AI Harness Engineering — StockView 에이전트 개발 환경 고도화

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | AGENTS.md에 모든 컨텍스트가 집중되어 토큰 낭비, 데이터소스별 전문 지식(EUC-KR 인코딩, Yahoo API 패턴 등)이 항상 로드됨, 에이전트 실수 방지 가드레일 부재, 크론/마이그레이션 파일 오수정 위험 |
| **Solution** | 4단계 Harness 구축: AGENTS.md 6대 영역 강화 → 도메인 Skills 분리(on-demand) → Hooks 품질 게이트 → MCP 서버 연동(PostgreSQL) |
| **Function UX Effect** | 세션당 컨텍스트 토큰 ~40% 절감, 데이터소스 코드 변경 시 자동 lint, 위험 파일 수정 사전 차단, DB 직접 쿼리로 디버깅 시간 단축 |
| **Core Value** | "에이전트가 StockView 도메인 전문가처럼 동작하는 환경" — 금융 데이터 특수성(EUC-KR, NXT 필터, 한국식 색상 규칙)을 하네스에 내장하여 반복 실수 제로화 |

---

## 1. 배경 및 목적

### 1.1 현재 상황
- StockView는 CLAUDE.md → AGENTS.md 래퍼 패턴을 이미 적용 중 (벤더 중립)
- AGENTS.md에 기술 스택, 데이터소스, 컨벤션, Don'ts 등 상세 기술됨
- 그러나 **모든 지식이 항상 로드**되어 토큰 비용이 높고, 도메인별 전문 가이드 부재
- Hooks, Skills, MCP 등 Claude Code의 하네스 기능을 아직 충분히 활용하지 못함

### 1.2 AI Harness Engineering이란?

OpenAI가 2026년 2월 제안한 개념. 핵심 공식: **Agent = Model + Harness**

| 계층 | 역할 | StockView 예시 |
|------|------|---------------|
| **Model** | 지능 | Claude Opus 4.6 |
| **Context** | 모델이 보는 것 | AGENTS.md, Skills, 코드베이스 |
| **Harness** | 시스템 운영 방식 | Hooks, MCP, CI/CD, 가드레일 |
| **Observability** | 모니터링 | 감사 로그, 에이전트 메트릭 |

4대 원칙: **Constrain**(경계 설정) → **Inform**(컨텍스트 제공) → **Verify**(검증) → **Correct**(피드백 루프)

### 1.3 핵심 원칙
- **점진적 도입** — Escape.tech 30일 플레이북 기반, 2주 단위 반복
- **실패 기반 가드레일** — 가설이 아닌 실제 실패 모드에서 규칙 도출
- **토큰 효율** — Skills on-demand 로딩으로 컨텍스트 절감
- **기존 자산 활용** — bkit 플러그인, RTK 등 이미 설치된 도구 최대 활용

### 1.4 범위

| 포함 | 제외 |
|------|------|
| AGENTS.md 6대 영역 강화 | Agent Teams 멀티에이전트 오케스트레이션 |
| 도메인 Skills 4개 신규 생성 | Cursor/.cursorrules 크로스 툴 지원 |
| Hooks 품질 게이트 3개 | CI/CD 파이프라인 변경 |
| MCP PostgreSQL 서버 연동 | Sentry/모니터링 MCP 연동 |
| AgentLinter 검증 | AAIF 표준 준수 인증 |

---

## 2. 개선 항목 상세

### 2.1 [P0] AGENTS.md 6대 영역 강화

**문제**: GitHub 2,500+ 레포 분석 결과, 우수한 AGENTS.md는 6대 영역을 갖춤. StockView는 Commands, Project Structure, Code Style은 갖추었으나 Testing, Git Workflow, Boundaries가 부족.

**솔루션**:

| 영역 | 현재 | 개선 |
|------|------|------|
| Commands | `npm run dev/build/lint` 기술 | 충분 — 유지 |
| Testing | "No test framework" 한 줄 | Vitest 권장 + 수동 검증 패턴 기술 |
| Project Structure | 디렉토리 구조 기술 | 충분 — 유지 |
| Code Style | 한국식 색상 컨벤션만 | Tailwind-only, functional-only 등 기존 Don'ts를 Code Style로 재구성 |
| Git Workflow | 없음 | 브랜치 네이밍, 커밋 메시지 컨벤션, PR 템플릿 추가 |
| Boundaries | Don'ts에 일부 | 명시적 "절대 수정 금지" 파일 목록 추가 |

**수정 대상 파일**: `AGENTS.md`

**절대 수정 금지 파일 목록** (Boundaries에 추가):
```
- prisma/migrations/          # 기존 마이그레이션 수정 금지
- .github/workflows/          # 크론 워크플로우 직접 수정 금지
- .env, .env.local            # 환경변수 파일 수정 금지
- src/proxy.ts                # 인증 미들웨어 신중하게
- scripts/                    # 시딩 스크립트 신중하게
```

**공수**: 0.5일
**의존성**: 없음

---

### 2.2 [P0] 도메인 Skills 신규 생성 (4개)

**문제**: Naver EUC-KR 인코딩, Yahoo v8 API, 크론 디버깅, Prisma 패턴 등 도메인 전문 지식이 AGENTS.md에 항상 로드됨. Skills on-demand 로딩으로 전환하면 세션당 ~40% 토큰 절감 가능.

**솔루션**: `.claude/skills/` 디렉토리에 4개 도메인 스킬 생성

#### Skill 1: `naver-scraping/SKILL.md`
```yaml
name: naver-scraping
description: Naver Finance 스크래핑 — EUC-KR 디코딩, fchart OHLCV API, NXT 야간거래 필터링, 200ms 레이트리밋
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
```
- EUC-KR → UTF-8 디코딩 패턴 + 코드 예시
- fchart API URL 구조 및 파라미터
- NXT 야간거래 가격 필터링 규칙
- 200ms throttle 패턴 코드
- KOSPI/KOSDAQ 인덱스 폴링 API

#### Skill 2: `yahoo-finance/SKILL.md`
```yaml
name: yahoo-finance
description: Yahoo Finance v8 chart API — 크럼 불필요, 5 concurrent 레이트리밋, USD/KRW 환율 주의사항
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
```
- v8 chart API 엔드포인트 및 파라미터
- 5 concurrent 요청 제한 패턴
- USD/KRW 환율 시장 시간 차이 주의점
- `withRetry()` 패턴 코드

#### Skill 3: `cron-workflows/SKILL.md`
```yaml
name: cron-workflows
description: GitHub Actions 크론 → /api/cron/* 엔드포인트 디버깅 — CRON_SECRET 인증, 배치 사이즈, Vercel 타임아웃
allowed-tools: Read, Grep, Glob, Bash
```
- GitHub Actions → API 엔드포인트 플로우
- CRON_SECRET bearer token 검증
- 배치 사이즈(100-500) 및 throttle 패턴
- Vercel Function 타임아웃 대응
- 17개 워크플로우 파일 매핑 테이블

#### Skill 4: `prisma-patterns/SKILL.md`
```yaml
name: prisma-patterns
description: Prisma 7 + Supabase — DIRECT_URL 마이그레이션 필수, upsert 패턴, 풀러 vs 다이렉트 연결 차이
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
```
- DATABASE_URL(풀러) vs DIRECT_URL(다이렉트) 사용 구분
- `prisma migrate dev` 시 DIRECT_URL 필수
- upsert 패턴 (ticker, [stockId, date] unique)
- `Promise.allSettled()` 배치 패턴

**수정 대상**: `.claude/skills/` 디렉토리 (신규 4개 파일)
**공수**: 1일
**의존성**: 없음

---

### 2.3 [P1] Hooks 품질 게이트 (3개)

**문제**: 에이전트가 위험 파일(마이그레이션, 환경변수)을 수정하거나, 데이터소스 코드 변경 후 린트를 건너뛰는 경우가 있음.

**솔루션**: `.claude/settings.local.json`에 3개 Hook 추가

#### Hook 1: PreToolUse — 위험 파일 수정 차단
```json
{
  "event": "PreToolUse",
  "matcher": { "tool_name": "Write|Edit" },
  "command": "node .claude/hooks/block-protected-files.mjs"
}
```
- 대상: `.env*`, `prisma/migrations/**`, `.github/workflows/**`
- 동작: exit code 2 → 사유 메시지와 함께 차단

#### Hook 2: PostToolUse — 데이터소스 변경 시 자동 lint
```json
{
  "event": "PostToolUse",
  "matcher": { "tool_name": "Write|Edit", "file_path": "src/lib/data-sources/**" },
  "command": "npx eslint --no-warn-ignored ${file_path}"
}
```

#### Hook 3: PostToolUse — Prisma 스키마 변경 감지
```json
{
  "event": "PostToolUse",
  "matcher": { "tool_name": "Write|Edit", "file_path": "prisma/schema.prisma" },
  "command": "npx prisma validate"
}
```

**수정 대상**: `.claude/settings.local.json`, `.claude/hooks/` (신규)
**공수**: 0.5일
**의존성**: 없음

---

### 2.4 [P1] MCP PostgreSQL 서버 연동

**문제**: 데이터 이슈 디버깅 시 Prisma Studio를 별도로 열거나, 에이전트가 스크립트를 작성해야 함. MCP로 에이전트가 직접 DB를 조회하면 디버깅 시간 단축.

**솔루션**: `.mcp.json` (프로젝트 스코프)에 PostgreSQL MCP 서버 추가

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

**보안 고려사항**:
- READ-ONLY 쿼리만 허용 (MCP 서버 설정)
- `.mcp.json`은 git 추적 가능 (시크릿은 `${DATABASE_URL}` 환경변수로 참조)
- 프로덕션 DB 직접 연결 금지 → 개발/스테이징 DB만 허용

**수정 대상**: `.mcp.json` (신규)
**공수**: 0.5일
**의존성**: `@modelcontextprotocol/server-postgres` 패키지

---

### 2.5 [P2] AGENTS.md 토큰 다이어트 + AgentLinter 검증

**문제**: Skills로 분리한 도메인 지식을 AGENTS.md에서 제거하고, AgentLinter로 품질 검증.

**솔루션**:
1. AGENTS.md에서 Data Sources 섹션을 요약으로 축소 (상세 → Skills 참조)
2. Data Flow 섹션을 1~2줄 요약으로 축소
3. `npx agentlinter` 실행하여 5개 차원(구조, 명확성, 완전성, 보안, 일관성) 점수 확인
4. 점수 60 미만 항목 개선

**목표 점수**: 5개 차원 모두 70+

**수정 대상**: `AGENTS.md`
**공수**: 0.5일
**의존성**: 2.2 (Skills 생성 완료 후)

---

## 3. 구현 순서 및 일정

```
Week 1 (3일)
├── Day 1: [2.1] AGENTS.md 6대 영역 강화
├── Day 2: [2.2] 도메인 Skills 4개 생성
└── Day 3: [2.3] Hooks 3개 + [2.4] MCP PostgreSQL

Week 2 (1일)
└── Day 4: [2.5] AGENTS.md 다이어트 + AgentLinter 검증
```

**총 공수**: 3~4일
**병렬 가능**: 2.1과 2.2는 병렬 진행 가능

---

## 4. 의존성

| 항목 | 외부 의존성 | 비용 |
|------|-------------|------|
| Skills | 없음 (파일 생성만) | 0원 |
| Hooks | 없음 (로컬 설정만) | 0원 |
| MCP PostgreSQL | `@modelcontextprotocol/server-postgres` (npx) | 0원 |
| AgentLinter | `agentlinter` (npx) | 0원 |

---

## 5. 성공 지표

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|-----------|
| AGENTS.md 토큰 | ~2,500 토큰 (추정) | ~1,500 토큰 (-40%) | `wc -w AGENTS.md` |
| AgentLinter 점수 | 미측정 | 5개 차원 70+ | `npx agentlinter` |
| 위험 파일 오수정 | 가끔 발생 | 0건 (Hook 차단) | Hook 로그 |
| DB 디버깅 | 스크립트 작성 필요 | MCP 직접 쿼리 | 워크플로우 관찰 |
| 데이터소스 변경 후 lint 누락 | 가끔 발생 | 자동 실행 100% | Hook 실행 로그 |

---

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Skills description이 너무 포괄적이면 불필요하게 로드됨 | 토큰 절감 효과 감소 | description을 구체적으로 작성, 2주 후 트리거 빈도 검토 |
| Hook이 워크플로우를 과도하게 차단 | 생산성 저하 | 처음 2주는 경고만(exit 0), 이후 차단(exit 2)으로 전환 |
| MCP PostgreSQL 보안 | 데이터 노출 | READ-ONLY 설정, 개발 DB만 연결 |
| AgentLinter 점수 기준이 StockView에 부적합 | 불필요한 수정 | 점수는 참고만, 실제 에이전트 행동 관찰이 우선 |

---

## 7. 참고 자료

- [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/) — 하네스 엔지니어링 원문
- [GitHub Blog: AGENTS.md Lessons from 2,500+ Repos](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) — 6대 영역
- [Escape.tech SF Field Report](https://escape.tech/blog/everything-i-learned-about-harness-engineering-and-ai-factories-in-san-francisco-april-2026/) — 30일 플레이북
- [NXCode: Complete Guide](https://www.nxcode.io/resources/news/harness-engineering-complete-guide-ai-agent-codex-2026) — 4원칙, 3레벨, 안티패턴
- [Anthropic: Effective Harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — 장기 실행 에이전트
- [Claude Code Docs: Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) — Hook 이벤트
- [Claude Code Docs: Skills](https://docs.anthropic.com/en/docs/claude-code/skills) — 스킬 시스템
- [Claude Code Docs: MCP](https://docs.anthropic.com/en/docs/claude-code/mcp) — MCP 서버 연동
