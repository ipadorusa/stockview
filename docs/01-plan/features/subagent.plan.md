# Plan: Sub-Agent 설정 및 활용 (v2)

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | StockView 프로젝트용 커스텀 서브에이전트 설계 및 적용 |
| 시작일 | 2026-04-07 |
| 예상 기간 | 1일 |
| 리서치 | `.ai/research/subagent-usage-patterns.md` (2라운드 리서치 + 검증 완료, 정확도 82%) |

### Value Delivered

| 관점 | 설명 |
|------|------|
| **Problem** | 단일 에이전트가 모든 작업을 처리하면 컨텍스트 윈도우가 오염되고, 도메인별 전문성이 희석됨 |
| **Solution** | Skills(도메인 지식) + Subagents(격리 분석) + Hooks(결정적 규칙) 3계층 하네스 완성 |
| **Function UX Effect** | 병렬 read-only 분석으로 응답 속도 향상, 도메인 전문 컨텍스트로 정확도 개선 |
| **Core Value** | AI 하네스 엔지니어링 "Constrain" 원칙 — 최소 권한, 컨텍스트 격리, 비용 최적화 |

---

## 1. 현재 하네스 상태 & 갭 분석

### 1.1 현재 구성

| 계층 | 현황 | 상태 |
|------|------|------|
| **Instructions** | `CLAUDE.md` → `AGENTS.md` wrapper | ✅ 완성 |
| **Skills** | 7개 (naver-scraping, yahoo-finance, cron-workflows, prisma-patterns 등) | ✅ 완성 |
| **Hooks** | 3개 (protected file blocking, auto-lint, prisma validate) | ✅ 완성 |
| **Subagents** | 없음 (`.claude/agents/` 디렉토리 미존재) | ❌ 갭 |
| **Agent Teams** | bkit CTO-led 팀 구성 (Dynamic 3명) | ✅ 사용 가능 |

### 1.2 왜 서브에이전트가 필요한가

리서치에서 확인된 Anthropic 공식 의사결정 기준:

| 도구 | 특성 | StockView 해당 시나리오 |
|------|------|----------------------|
| **Skills** | on-demand 도메인 지식, 부모 컨텍스트 포함 | Naver EUC-KR, Yahoo API, Prisma 패턴 → **이미 완성** |
| **Subagents** | 격리 컨텍스트, 병렬 가능, 요약 반환 | 데이터소스 분석, 크론 정합성 → **갭** |
| **Hooks** | 100% 결정적, 토큰 0 | 린트, 검증, 차단 → **이미 완성** |

**핵심 판단**: Skills은 "지식 제공", Subagents는 "격리된 분석 실행". 현재 Skills는 있지만 분석 실행용 서브에이전트가 없어 메인 컨텍스트가 무거운 분석 작업에 오염됨.

---

## 2. 서브에이전트 기술 스펙 (검증 완료)

### 2.1 파일 구조

```
.claude/agents/{agent-name}.md    # 프로젝트 로컬 (git 커밋, 팀 공유)
~/.claude/agents/{agent-name}.md  # 글로벌 (모든 프로젝트)
```

### 2.2 Frontmatter (검증된 4개 핵심 필드만 사용)

```yaml
---
name: agent-identifier           # 필수. kebab-case. @name 으로 호출
description: |                    # 필수. <example> 블록 2-3개로 자동 트리거 신뢰성 확보
  Use this agent when [조건].
  <example>
  user: "데이터소스 분석해줘"
  assistant: "data-source-analyzer 에이전트를 호출합니다."
  </example>
model: sonnet                     # 선택. 생략 시 부모 상속. haiku/sonnet/opus
tools: Read, Grep, Glob           # 선택. 콤마 구분 문자열. 생략 시 전체 도구 상속
---

에이전트 시스템 프롬프트 (마크다운)
```

> **검증 노트**: `memory`, `maxTurns`, `color` 필드는 공식 문서 미확인 (실험적). 핵심 4필드(`name`, `description`, `model`, `tools`)만 의존.

### 2.3 핵심 메커니즘

| 메커니즘 | 검증 상태 | 설명 |
|---------|----------|------|
| **컨텍스트 격리** | ✅ | 각 서브에이전트는 독립 컨텍스트 윈도우 (1M), 부모에게 요약만 반환 |
| **도구 제한** | ✅ | `tools` 필드로 최소 권한. read-only = `Read, Grep, Glob` |
| **모델 선택** | ✅ | haiku(저렴) → sonnet(균형) → opus(복잡). 생략 시 부모 상속 |
| **비용 분리** | ✅ | 총 비용 = 부모 토큰 + Σ(서브에이전트 토큰). 완전 별도 과금 |
| **호출 방식** | ✅ | `@agent-name` 멘션 또는 Agent 도구의 `subagent_type` |

---

## 3. StockView 서브에이전트 설계

### 3.1 설계 원칙 (리서치 기반)

1. **read-only 우선** — 분석 에이전트는 `Read, Grep, Glob` 만 부여 (안티패턴 #2 방지)
2. **시스템 프롬프트 간결** — 핵심 도메인 지식만, 상세는 Skills 참조 유도 (안티패턴 #5 방지)
3. **모델 분화** — 단순 작업은 haiku, 복잡 분석은 sonnet (안티패턴 #7 방지)
4. **git 커밋** — `.claude/agents/` 를 버전 관리 (안티패턴 #3 방지)
5. **`<example>` 블록 필수** — 자동 트리거 신뢰성 확보

### 3.2 에이전트 목록

| # | 에이전트명 | 역할 | 모델 | 도구 | 근거 |
|---|-----------|------|------|------|------|
| 1 | `data-source-analyzer` | Naver/Yahoo/KRX 데이터소스 분석 | sonnet | Read, Grep, Glob | 무거운 분석, 별도 컨텍스트 필요 |
| 2 | `cron-reviewer` | 크론 워크플로우 ↔ API 정합성 검증 | haiku | Read, Grep, Glob | 패턴 매칭 중심, 저비용 |
| 3 | `schema-reviewer` | Prisma 스키마 변경 영향도 분석 | haiku | Read, Grep, Glob | 참조 추적 작업, 저비용 |

> **v1 대비 변경**: `build-checker` 제거 — 빌드/린트는 Hook(결정적 규칙)이 더 적합. 서브에이전트는 분석 전용으로 집중.

### 3.3 에이전트별 상세

#### `data-source-analyzer` (sonnet, read-only)

**목적**: 데이터소스 코드 분석, API 응답 패턴 파악, 버그 원인 추적

**스코프**: `src/lib/data-sources/`, `src/app/api/cron/`, `scripts/`

**시스템 프롬프트 포함 내용**:
- Naver: EUC-KR 인코딩, fchart OHLCV API, NXT 야간거래 필터링, 200ms 레이트 리밋
- Yahoo: v8 chart API, 5개 동시 요청 제한, withRetry 패턴, USD/KRW 환율 타이밍
- KRX: 레거시 API, timeout 10s→fallback 구조
- 한국 시장 컨벤션 (장 시간 09:00-15:30 KST, 공휴일)

**모델 선택 이유**: 복잡한 데이터 흐름 분석 → sonnet 필요

#### `cron-reviewer` (haiku, read-only)

**목적**: GitHub Actions 워크플로우 17개 ↔ API 크론 엔드포인트 매핑 검증

**스코프**: `.github/workflows/`, `src/app/api/cron/`

**시스템 프롬프트 포함 내용**:
- CRON_SECRET 인증 패턴
- Vercel Function timeout (55s) 제약 + 배치 사이즈 (100-500)
- MarketIndex 우선 수집 구조
- 워크플로우 → API 매핑 테이블 (17개)

**모델 선택 이유**: 패턴 매칭/체크리스트 중심 → haiku로 충분

#### `schema-reviewer` (haiku, read-only)

**목적**: Prisma 스키마 변경 시 영향 받는 쿼리/API/컴포넌트 추적

**스코프**: `prisma/schema.prisma`, `src/lib/queries/`, `src/app/api/`

**시스템 프롬프트 포함 내용**:
- Prisma 7 + Supabase PostgreSQL 구조
- DATABASE_URL(pooler) vs DIRECT_URL(direct) 구분
- upsert 패턴 (unique on `ticker`, `[stockId, date]`)
- 마이그레이션 불변성 규칙

**모델 선택 이유**: 참조 그래프 추적 → haiku로 충분

### 3.4 비용 예측

| 시나리오 | 추가 비용 |
|---------|----------|
| data-source-analyzer 1회 호출 (sonnet) | +15K 토큰 (~+30%) |
| cron-reviewer 1회 호출 (haiku) | +5K 토큰 (~+10%) |
| schema-reviewer 1회 호출 (haiku) | +5K 토큰 (~+10%) |
| 3개 병렬 호출 | +25K 토큰 (~+50%) |

> Skills 대비: Skills는 부모 컨텍스트에 내장되어 추가 비용 없음. Subagents는 별도 윈도우이므로 호출 시에만 비용 발생.

---

## 4. 구현 계획

### Phase 1: 에이전트 정의 파일 생성

1. `.claude/agents/` 디렉토리 생성
2. `data-source-analyzer.md` 작성 (frontmatter + 시스템 프롬프트)
3. `cron-reviewer.md` 작성
4. `schema-reviewer.md` 작성

### Phase 2: 동작 검증

5. 각 에이전트를 `@agent-name`으로 호출하여 응답 품질 확인
6. read-only 도구 제한 확인 (Write/Edit/Bash 차단되는지)
7. 컨텍스트 격리 확인 (부모에게 요약만 반환되는지)

### Phase 3: 하네스 통합

8. AGENTS.md에 `## Sub-Agents` 섹션 추가
9. git commit: `.claude/agents/` 디렉토리

---

## 5. 성공 기준

| 기준 | 측정 방법 |
|------|----------|
| 3개 에이전트 정상 동작 | `@agent-name`으로 호출 시 도메인 맥락 있는 응답 반환 |
| read-only 도구 제한 동작 | Write/Edit 시도 시 차단됨 |
| 모델 분화 동작 | data-source-analyzer는 sonnet, 나머지는 haiku 사용 확인 |
| AGENTS.md 서브에이전트 섹션 추가 | 미래 세션에서 활용 가이드 제공 |

---

## 6. Skills와의 공존 전략

리서치 검증 결과, Skills와 Subagents는 **대체가 아닌 보완** 관계:

| 현재 Skill | 유지/전환 | 이유 |
|-----------|----------|------|
| `naver-scraping` | **유지** (Skill) | on-demand 도메인 지식, 메인 세션에서 항상 참조 |
| `yahoo-finance` | **유지** (Skill) | on-demand 충분 |
| `prisma-patterns` | **유지** (Skill) | 거의 매 작업에서 참조, 격리 불필요 |
| `cron-workflows` | **유지** (Skill) | on-demand 도메인 지식 |
| — | **신규** (Subagent) `data-source-analyzer` | Skill 지식을 활용한 격리 분석 실행 |
| — | **신규** (Subagent) `cron-reviewer` | Skill 지식을 활용한 격리 정합성 검증 |
| — | **신규** (Subagent) `schema-reviewer` | Skill 지식을 활용한 격리 영향도 분석 |

**원칙**: Skill = 지식 제공 (what to know), Subagent = 분석 실행 (what to do)

---

## 7. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| 시스템 프롬프트 비대 → 토큰 낭비 | 중 | 핵심만 포함, "자세한 내용은 Skill 참조" 패턴 |
| read-only 에이전트 한계 (수정 불가) | 낮 | 분석 결과를 메인에 반환 → 메인이 수정 |
| `memory`, `color` 등 실험적 필드 | 낮 | 검증된 4필드만 사용 (`name`, `description`, `model`, `tools`) |
| Hook 자동 트리거 무한 루프 | 중 | Phase 3에서 별도 검토. read-only 에이전트는 본질적으로 안전 |

---

## 8. 참고 자료

- **리서치 파일**: `.ai/research/subagent-usage-patterns.md` (검증 보고서 포함)
- **하네스 리서치**: `.ai/research-harness-engineering.md` §6, §9.2E
- **공식 문서**: https://code.claude.com/docs/en/sub-agents
- **커뮤니티 레포**: VoltAgent/awesome-claude-code-subagents (100+ 에이전트)
- **의사결정 가이드**: https://dev.to/nunc/claude-code-skills-vs-subagents-when-to-use-what-4d12
