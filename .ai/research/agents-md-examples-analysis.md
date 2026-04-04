# AGENTS.MD 실전 사례 분석 — AI Harness Engineering 관점

> 리서치일: 2026-04-03 | 3-Agent Team (Researcher A: GitHub 실제 파일 수집, B: 기업·커뮤니티 사례, C: Harness Engineering 트렌드)

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 분석 GitHub 저장소 | 10개 (총 ⭐ 350K+) |
| 참조 블로그/논문 | 15+ |
| 식별된 핵심 패턴 | 7가지 |
| AGENTS.md 평균 크기 | 4~20KB (100~440줄) |

**핵심 발견**: AGENTS.md는 단순 지시 파일이 아니라 **AI Harness Engineering의 configuration layer**로 진화 중. OpenAI는 "하나의 큰 AGENTS.md"가 실패했다고 밝히며 **목차형(~100줄) + docs/ 참조 구조**를 권장.

---

## Part 1: GitHub 주요 저장소 AGENTS.md 분석

### 저장소 리스트 (스타 순)

| # | 저장소 | ⭐ | 크기 | 핵심 특징 |
|---|--------|-----|------|-----------|
| 1 | **vercel/next.js** | 139K | 20.9KB / 438줄 | Skills 시스템, 컨텍스트 효율 가이드, CLAUDE.md→AGENTS.md 심링크 |
| 2 | **openai/codex** | 72.9K | 16.2KB / 209줄 | 샌드박스 인식, Rust 린트, 모듈 크기 제한(500 LoC) |
| 3 | **getsentry/sentry** | 43.5K | 7.59KB / 244줄 | 계층형 AGENTS.md (root + src/ + tests/ + static/) |
| 4 | **agno-agi/agno** | 39.1K | 6.09KB / 241줄 | .context/ 에이전트 간 핸드오프, 듀얼 가상환경 |
| 5 | **agentsmd/agents.md** | 19.7K | — | 표준 자체, OpenAI 창시 |
| 6 | **Automattic/jetpack** | 1.8K | 12.1KB / 256줄 | 기밀성 경고, AI 생성 체인지로그, $$next-version$$ 플레이스홀더 |
| 7 | **OpenHands/docs** | — | 6.09KB / 189줄 | llms.txt 오버라이드, 크로스 레포 싱크 |
| 8 | **finos/morphir-rust** | — | 16KB / 290줄 | "Landing the Plane" 세션 종료 프로토콜, CLA AI 제한 |
| 9 | **vercel/vercel** | — | 4.14KB / 176줄 | 최소화된 골드 스탠다드, 명령어 우선 배치 |
| 10 | **vercel-labs/agent-skills** | — | 143K+ chars | 40+ 규칙 파일 컴파일, "에이전트 패키지 매니저" 컨셉 |

---

### 저장소별 상세 분석

#### 1. vercel/next.js — 가장 정교한 AGENTS.md (139K ⭐)

**URL**: https://github.com/vercel/next.js/blob/canary/AGENTS.md

**구조**:
- Codebase structure → Build commands → Fast local dev → Testing (8+ 명령) → PR triage → Skills → Anti-patterns

**혁신적 패턴**:
- **Skills 아키텍처**: `.agents/skills/` 디렉토리에 named skills (`$pr-status-triage`, `$flags`, `$dce-edge`, `$react-vendoring`, `$runtime-debug`)
- **컨텍스트 효율 가이드**: 대용량 파일 읽기는 grep-first, 배치 편집, 출력 한 번만 캡처
- **명시적 안티패턴**: "do NOT" 지시어로 금지사항 강조
- **CLAUDE.md → AGENTS.md 심링크**: 크로스 툴 호환 전략의 실전 적용

**시사점**: 대규모 오픈소스에서 Skills 시스템으로 AGENTS.md를 모듈화하는 최선진 사례

---

#### 2. openai/codex — 창시자의 자기 적용 (72.9K ⭐)

**URL**: https://github.com/openai/codex/blob/main/AGENTS.md

**구조**:
- Rust/codex-rs 컨벤션 → codex-core 가이드 → TUI 스타일 → 스냅샷 테스트 → API 네이밍

**핵심 패턴**:
- **샌드박스 인식**: `CODEX_SANDBOX_NETWORK_DISABLED` 환경변수 설명, 샌드박스 코드 수정 금지
- **아키텍처 가드레일**: "Resist adding code to codex-core" — 핵심 모듈 비대화 방지
- **모듈 크기 제한**: 500 LoC 목표, 800 LoC 하드캡
- **네이밍 컨벤션**: `*Params`, `*Response`, `*Notification` 패턴 강제

**시사점**: AGENTS.md 창시자가 자기 프로젝트에서도 실제로 활용 — "dogfooding"의 모범

---

#### 3. getsentry/sentry — 계층형 AGENTS.md의 교과서 (43.5K ⭐)

**URL**: https://github.com/getsentry/sentry/blob/master/AGENTS.md

**구조**:
```
sentry/
├── AGENTS.md              ← 전역 (프로젝트 구조, 명령어, Git)
├── src/AGENTS.md          ← 백엔드 코드 규칙
├── tests/AGENTS.md        ← 테스트 패턴
└── static/AGENTS.md       ← 프론트엔드 규칙
```

**핵심 패턴**:
- **"AGENTS.md is source of truth"** — CLAUDE.md, .cursorrules보다 AGENTS.md 우선 선언
- **컨텍스트 인식 로딩 맵**: 파일 패턴 → 관련 AGENTS.md 매핑
- **프론트엔드/백엔드 분리 PR 정책**

**시사점**: 모노레포에서 디렉토리별 AGENTS.md 분리의 가장 깔끔한 구현

---

#### 4. finos/morphir-rust — 가장 엄격한 AGENTS.md

**URL**: https://github.com/finos/morphir-rust/blob/main/AGENTS.md

**핵심 패턴**:
- **"Expected Knowledge" 사전조건**: 에이전트에게 필요한 도메인 지식 명시
- **TDD + BDD**: Cucumber/Gherkin, Object Mother 패턴, TestDriver 패턴
- **"Landing the Plane"**: 세션 종료 시 필수 체크리스트 (push, clean, handoff)
- **CLA 법적 제한**: AI 에이전트를 co-author로 추가 금지 (FINOS 법무)
- **`.agents/out/`**: gitignored 임시 출력 디렉토리

**시사점**: 금융 오픈소스(FINOS)의 엄격한 컴플라이언스 요구가 AGENTS.md에 반영된 사례

---

#### 5. Automattic/jetpack — 엔터프라이즈 실전

**URL**: https://github.com/Automattic/jetpack/blob/trunk/AGENTS.md

**핵심 패턴**:
- **기밀성 경고**: 퍼블릭 레포에서 프라이빗 WordPress.com URL 노출 금지
- **AI 생성 체인지로그**: 체크박스 조건부 허용
- **`$$next-version$$` 플레이스홀더**: DocBlock 버전 자동화
- **"Maintaining This File" 메타 섹션**: AGENTS.md 자체의 유지보수 가이드

**시사점**: 대규모 팀에서 AGENTS.md 관리 체계까지 문서화한 성숙한 사례

---

## Part 2: AI Harness Engineering과 AGENTS.md

### Harness Engineering이란?

| 항목 | 내용 |
|------|------|
| **정의** | AI 에이전트를 신뢰성 있게 만드는 시스템, 제약, 피드백 루프, 인프라 설계 학문 |
| **공식** | **Agent = Model + Harness** |
| **창시** | OpenAI, 2026년 2월, Ryan Lopopolo |
| **배경** | 3명의 엔지니어가 100만+ LoC 제품을 인간 코드 0줄로 구축 |

### 계층 구조

```
Prompt Engineering  (무엇을 물을 것인가)
    ↓
Context Engineering  (무엇을 보여줄 것인가)  ← AGENTS.md가 여기
    ↓
Harness Engineering  (전체 시스템을 어떻게 운영할 것인가)
```

### 핵심 참조

| 소스 | URL |
|------|-----|
| OpenAI 원문 | https://openai.com/index/harness-engineering/ |
| Martin Fowler 분석 | https://martinfowler.com/articles/harness-engineering.html |
| Anthropic 가이드 | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| Louis Bouchard | https://www.louisbouchard.ai/harness-engineering/ |

---

### OpenAI의 "하나의 큰 AGENTS.md는 실패" 고백

OpenAI 팀이 직접 밝힌 교훈:

| 문제 | 설명 |
|------|------|
| 컨텍스트 부족 | 거대 파일이 실제 코드 컨텍스트를 밀어냄 |
| 과다 가이드 = 무가이드 | 너무 많은 지시는 지시 없는 것과 같음 |
| 모놀리식 파일 부패 | 단일 파일은 즉시 낡아짐 |
| 기계적 검증 불가 | 큰 파일은 정확성 검증이 어려움 |

**해결책**: AGENTS.md를 **~100줄 목차**로 축소, `docs/` 디렉토리를 system of record로 사용

**핵심 지표**: 컨텍스트 활용률 **~40% 초과 시** 성능 저하 시작 (Alex Lavaee 연구)

---

## Part 3: 효과성 벤치마크 & 연구

### Vercel 벤치마크 (2026.01)

| 설정 | 통과율 | 개선 |
|------|--------|------|
| Baseline (문서 없음) | 53% | — |
| Skill (기본) | 53% | +0% |
| Skill + 명시적 지시 | 79% | +26% |
| **AGENTS.md (8KB)** | **100%** | **+47%** |

> Skills만으로는 baseline과 동일. AGENTS.md의 **상시 컨텍스트**가 핵심 — 에이전트가 skill을 호출하지 않는 문제를 원천 해결.

### ETH Zurich 연구 (arXiv:2602.11988)

| 파일 유형 | 비용 변화 | 성공률 변화 |
|-----------|-----------|-------------|
| LLM 자동생성 | +20~23% | **-0.5% ~ -2%** |
| 인간 작성 | ~19% 이내 | +4% (한계적) |
| 파일 없음 | 기준선 | 기준선 |

> **핵심 규칙**: 모든 줄은 "이 줄을 제거하면 에이전트가 복구 불가능한 실수를 하는가?" 테스트 통과 필요

### Augment Code 종합 (2026)

> 5개 독립 팀(OpenAI, Anthropic, Huntley, Horthy, Vasilopoulos)이 동일한 결론 도달:
> 1. 계층형 컨텍스트
> 2. 에이전트 특화
> 3. 영속적 메모리
> 4. 구조화된 실행

---

## Part 4: 식별된 7가지 핵심 패턴

### Pattern 1: 계층형 AGENTS.md (Hierarchical)

```
repo/
├── AGENTS.md              ← 전역 (빌드, 컨벤션, PR)
├── packages/frontend/
│   └── AGENTS.md          ← React 규칙
└── packages/backend/
    └── AGENTS.md          ← API 규칙
```

- **사용처**: Sentry, Next.js, GitLab Duo, Codex
- **동작**: 에이전트가 root→leaf 모든 레벨을 병합, 가장 가까운 파일이 충돌 시 우선
- **장점**: progressive disclosure, 패키지별 자율성

### Pattern 2: Skills 시스템 (Modular Skills)

```
.agents/skills/
├── pr-status-triage.md
├── flags.md
└── release-manager.md
```

- **사용처**: Next.js (`$pr-status-triage`), Sentry (`.agents/skills/`), morphir-rust (`/release-manager`)
- **장점**: AGENTS.md 자체는 작게 유지하면서 전문 지식 모듈화

### Pattern 3: 목차형 AGENTS.md (Table of Contents)

- **사용처**: OpenAI 내부 프로젝트
- **구조**: AGENTS.md ~100줄, `docs/` 디렉토리를 system of record로 참조
- **이유**: 컨텍스트 윈도우 40% 초과 시 성능 저하

### Pattern 4: 3단계 경계 시스템 (Three-Tier Boundaries)

```markdown
## Always Do
- Run tests before committing
- Use TypeScript strict mode

## Ask First
- Changing public API signatures
- Modifying database schema

## Never Do
- Commit secrets
- Use `any` type
- Force push to main
```

- **사용처**: GitHub Blog 2,500 저장소 분석에서 최상위 패턴으로 식별
- **효과**: 금지사항이 허용사항만큼 중요

### Pattern 5: 에이전트 간 핸드오프 (Agent-to-Agent)

- **사용처**: agno (`.context/` 디렉토리), morphir-rust ("Landing the Plane" 프로토콜)
- **구조**: 세션 종료 시 상태를 파일로 저장 → 다음 에이전트가 이어받음
- **미래**: 다중 에이전트 협업의 핵심 인프라

### Pattern 6: 크로스 툴 호환 (Cross-Tool Compatibility)

- **사용처**: Next.js (`CLAUDE.md` → `AGENTS.md` 심링크)
- **전략**: AGENTS.md에 범용 내용, 도구별 파일에 특화 설정
- **현실**: Sentry는 "AGENTS.md is source of truth" 선언

### Pattern 7: 법적/보안 가드레일 (Legal & Security)

- **사용처**: Jetpack (기밀성 경고), morphir-rust (CLA AI 저작권 제한), Next.js (헤더 보안)
- **내용**: 퍼블릭 레포 비밀 노출 방지, AI 생성 코드 법적 제한, 보안 리뷰 요구

---

## Part 5: 생태계 도구

| 도구 | 유형 | 설명 |
|------|------|------|
| **AgentLinter** | 린터/검증 | 5차원 점수 (구조, 명확성, 완성도, 보안, 일관성). `npx agentlinter` |
| **Packmind** | 드리프트 감지 | 코드 변경 시 AGENTS.md 정확성 자동 검증 |
| **Factory** | 엔터프라이즈 | AGENTS.md 관리 플랫폼 |
| **GitLab Duo** | 네이티브 지원 | 디렉토리별 상속 구현 |
| **AX Benchmark** | 측정 프레임워크 | Agent Experience 표준 측정 |

### AgentLinter 상세

- 5개 차원: structure, clarity, completeness, security, cross-file consistency (각 0~100점)
- 통계: **워크스페이스 5개 중 1개에 자격증명 노출**, 40%가 Clarity 60점 미달
- 기반: Gloaguen et al. (2026) — "A Taxonomy of Agent Instruction Failures"

---

## Part 6: AAIF & Agent Experience (AX)

### AAIF (Agentic AI Foundation) 현황

| 항목 | 내용 |
|------|------|
| 소속 | Linux Foundation |
| 멤버 | **146개** (2026.02 기준) |
| 골드 멤버 | JPMorgan, Red Hat, Huawei, ServiceNow 등 18개 신규 |
| 의장 | David Nalley (AWS) |
| 3대 프로젝트 | AGENTS.md, MCP, goose |
| 이벤트 | MCP Dev Summit NYC (2026.04.02~03), Amsterdam (2026.09) |

### Agent Experience (AX)

| 항목 | 내용 |
|------|------|
| 정의 | AI 에이전트가 제품/플랫폼과 상호작용하는 총체적 경험 |
| 창시 | Mathias Biilmann (Netlify CEO, 2025.01) |
| 허브 | https://agentexperience.ax |
| DX와의 관계 | DX = 개발자가 빌드하는 경험, AX = AI 에이전트가 운영하는 경험 |
| 전망 | Gartner: 2028년까지 엔터프라이즈 앱 33%에 에이전틱 AI 포함 |

---

## Part 7: 한국어 커버리지

| 소스 | 내용 |
|------|------|
| **dkmin/devBrother** (Gist) | AGENTS.md를 "거버넌스 아키텍처"로 프레이밍 — 중앙 통제 및 위임 구조 |
| **awesome-agent-skills** | 한국어 AI 코딩 에이전트 스킬 큐레이션 리스트 |
| **GitHub Docs 한국어** | Copilot 코딩 에이전트 모범 사례 공식 번역 |
| **GeekNews** | 3+ 전용 스레드, 활발한 토론 |

---

## Part 8: 발표용 핵심 인사이트 5선

### 1. "AGENTS.md는 configuration layer다"
> Harness Engineering 스택에서 AGENTS.md는 컨텍스트와 하네스의 교차점 — 인간 의도와 에이전트 행동 사이의 primary interface.

### 2. "하나의 큰 파일은 실패한다" (OpenAI 직접 고백)
> 컨텍스트 40% 초과 시 성능 저하. 해결: ~100줄 목차 + docs/ 참조 구조.

### 3. "자동 생성은 독이다" (ETH Zurich 증명)
> LLM 생성 AGENTS.md는 성공률 -2%, 비용 +20%. 매 줄이 "제거 시 복구 불가 실수?" 테스트 통과해야 함.

### 4. "3단계 경계가 핵심이다" (GitHub 2,500 저장소)
> Always Do / Ask First / Never Do — 금지사항이 허용사항만큼 중요.

### 5. "AX가 DX 옆의 새 설계축이다"
> Agent Experience를 고려하지 않는 플랫폼은 에이전트 시대에 뒤처진다.

---

## 전체 소스 URL

### Harness Engineering
- https://openai.com/index/harness-engineering/
- https://martinfowler.com/articles/harness-engineering.html
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- https://www.louisbouchard.ai/harness-engineering/
- https://alexlavaee.me/blog/harness-engineering-why-coding-agents-need-infrastructure/

### GitHub 저장소
- https://github.com/vercel/next.js/blob/canary/AGENTS.md
- https://github.com/openai/codex/blob/main/AGENTS.md
- https://github.com/getsentry/sentry/blob/master/AGENTS.md
- https://github.com/agno-agi/agno/blob/main/AGENTS.md
- https://github.com/Automattic/jetpack/blob/trunk/AGENTS.md
- https://github.com/finos/morphir-rust/blob/main/AGENTS.md
- https://github.com/vercel/vercel/blob/main/AGENTS.md

### 벤치마크 & 연구
- https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals
- https://arxiv.org/html/2602.11988v1
- https://www.augmentcode.com/guides/how-to-build-agents-md
- https://aidevme.com/agents-md-best-practices/

### 생태계
- https://agentlinter.com/
- https://packmind.com/evaluate-context-ai-coding-agent/
- https://docs.factory.ai/cli/configuration/agents-md
- https://docs.gitlab.com/user/duo_agent_platform/customize/agents_md/

### AAIF & AX
- https://aaif.io/
- https://agentexperience.ax/
- https://techstackups.com/guides/introducing-ax-benchmark-agent-experience/

### 모노레포 패턴
- https://dev.to/datadog-frontend-dev/steering-ai-agents-in-monorepos-with-agentsmd-13g0
- https://nx.dev/blog/nx-ai-agent-skills

---

*3-Agent Team 종합 리서치 완료: 2026-04-03*
