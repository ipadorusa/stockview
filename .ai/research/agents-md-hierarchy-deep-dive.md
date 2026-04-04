# AGENTS.MD 계층 구조 딥다이브 — 어느 레벨에 무엇을, 얼마만큼

> 리서치일: 2026-04-04 | 3-Agent Team (A: 실제 파일 분석, B: 공식 스펙·가이드, C: 콘텐츠 배분 전략)

---

## Executive Summary

| 항목 | 결론 |
|------|------|
| **Root 파일 크기** | 100~200줄 / ~4KB 이하 |
| **하위 파일 크기** | 50~100줄 / ~2KB 이하 (각각) |
| **전체 합산** | ~300줄 / ~5KB 이하 (상시 로딩 기준) |
| **단일 파일 하드캡** | 371줄 (Augment Code 관측치) |
| **Codex 합산 제한** | 32 KiB (기본), 64 KiB+ (설정 가능) |
| **컨텍스트 윈도우 안전 구간** | 전체의 ~40% 이하 |
| **2가지 주요 모델** | Directory 모델 (Sentry) vs Skills 모델 (Next.js) |

---

## Part 1: 두 가지 계층 모델 비교

### Model A: Directory 모델 (Sentry 방식)

**원리**: 코드 위치 기반 — "어디를 편집하느냐"에 따라 로딩

```
sentry/
├── AGENTS.md              ← 7.8KB  Hub + 라우팅 테이블
├── src/AGENTS.md          ← 22.9KB 백엔드 바이블
├── static/AGENTS.md       ← 19.3KB 프론트엔드 바이블
└── tests/AGENTS.md        ← 4.1KB  테스트 규칙
                              총 54.1KB
```

### Model B: Skills 모델 (Next.js 방식)

**원리**: 작업 유형 기반 — "무엇을 하느냐"에 따라 on-demand 로딩

```
next.js/
├── AGENTS.md              ← 21.4KB 항상 로딩 (= CLAUDE.md 심링크)
└── .agents/skills/
    ├── pr-status-triage/   ← 1.8KB  PR 디버깅 시에만 로딩
    ├── flags/              ← 3.0KB  피처 플래그 작업 시에만
    ├── v8-jit/             ← 14.5KB V8 최적화 시에만
    ├── react-vendoring/    ← 3.9KB  React 벤더링 시에만
    └── ... (11개 SKILL.md)
                              총 ~106KB (but 상시 로딩은 21.4KB만)
```

### 핵심 차이

| 측면 | Directory 모델 (Sentry) | Skills 모델 (Next.js) |
|------|------------------------|----------------------|
| **라우팅 기준** | 코드 위치 (src/, tests/) | 작업 유형 (PR 분류, 디버깅) |
| **로딩 방식** | 해당 디렉토리 진입 시 자동 | description 매칭으로 on-demand |
| **Root 크기** | 7.8KB (슬림 허브) | 21.4KB (종합 가이드) |
| **총 콘텐츠** | 54KB | ~106KB |
| **상시 로딩** | Root + 편집 위치 파일 | Root만 (Skills는 필요 시) |
| **적합한 프로젝트** | 백엔드/프론트엔드 명확히 분리된 모노레포 | 다양한 전문 작업이 있는 프로젝트 |

---

## Part 2: 레벨별 콘텐츠 배분 가이드

### 3-Layer 구조 (OpenAI Codex 공식 스펙)

```
Layer 1: Global (~/.codex/AGENTS.md)
    ↓
Layer 2: Repo Root (project/AGENTS.md)
    ↓
Layer 3: Subdirectory (project/packages/foo/AGENTS.md)
```

**발견 순서**: Global → Root → 현재 작업 디렉토리까지 경로의 모든 AGENTS.md
**병합 규칙**: Root→Leaf 순서로 연결, **나중에 나오는 파일(더 깊은)이 우선**

### 레벨별 콘텐츠 상세

#### Layer 1: Global (`~/.codex/AGENTS.md`)

| 항목 | 설명 | 예시 |
|------|------|------|
| 개인 선호 | 에디터/도구 설정 | "항상 pnpm 사용" |
| 확인 정책 | 자동/수동 실행 범위 | "파일 삭제 전 항상 확인" |
| 톤/스타일 | 응답 형식 | "간결하게, 한국어로" |

**크기**: < 1KB / ~20줄
**핵심**: 모든 프로젝트에 공통 적용되는 개인 규칙만

---

#### Layer 2: Repo Root (`AGENTS.md`)

| 항목 | 우선도 | 설명 | 예시 |
|------|--------|------|------|
| **빌드/테스트 명령** | 🔴 최고 | 정확한 플래그 포함 | `pnpm --filter=next build` |
| **프로젝트 구조** | 🔴 최고 | 디렉토리 맵 + 목적 | `src/ → 백엔드, static/ → 프론트엔드` |
| **라우팅 테이블** | 🟠 높음 | 하위 AGENTS.md 안내 | `Backend → src/AGENTS.md` |
| **공유 컨벤션** | 🟠 높음 | 전체 적용 규칙 | "TypeScript strict, named exports" |
| **PR/Git 워크플로** | 🟡 중간 | 커밋/PR 규칙 | "conventional commits, PR < 400줄" |
| **환경 설정** | 🟡 중간 | 가상환경, 필수 도구 | `.venv/bin/ prefix 필수` |
| **보안 규칙** | 🟡 중간 | 비자명한 것만 | "절대 .env 커밋 금지" |

**크기**: 100~200줄 / ~4KB
**핵심**: "모든 세션에서 항상 필요한 정보만"

**Sentry Root 실제 구성**:
```markdown
# Project Overview          (what Sentry is)
# Project Structure         (directory map)
# Command Execution Guide   (venv rules, setup commands)
# Linting                   (pre-commit commands)
# Context Map               (routing table to sub-files)
# Pre-completion Checklist   (before finishing task)
```

---

#### Layer 3: Subdirectory (`packages/*/AGENTS.md`)

| 항목 | 우선도 | 설명 | 예시 |
|------|--------|------|------|
| **패키지 기술 스택** | 🔴 최고 | 해당 영역 전용 | "Python 3.13, Django 5.2, Celery" |
| **패키지 빌드/테스트** | 🔴 최고 | 로컬 명령어 | `pytest tests/sentry/foo/` |
| **도메인 패턴** | 🟠 높음 | API 패턴, 컴포넌트 구조 | "DRF ViewSet 패턴, IDOR 방지" |
| **금지사항** | 🟠 높음 | 영역별 Don't | "class 컴포넌트 금지, CSS 파일 금지" |
| **테스트 규칙** | 🟡 중간 | 팩토리, 픽스처 | "반드시 factories 사용" |

**크기**: 50~100줄 / ~2KB (각각)
**핵심**: "이 디렉토리에서만 적용되는 규칙"

**Sentry 하위 파일 실제 구성**:

`src/AGENTS.md` (백엔드 22.9KB):
```markdown
> See /AGENTS.md for commands    ← Root 참조 (중복 방지)
# Tech Stack                     (Python, Django, ClickHouse, Kafka)
# Project Structure               (src/sentry/ 하위 구조)
# Security Guidelines             (IDOR, organization scoping)
# API Endpoint Patterns            (DRF conventions)
# Model/Migration Conventions
# Celery Task Patterns
# Integration Development
```

`static/AGENTS.md` (프론트엔드 19.3KB):
```markdown
> See /AGENTS.md for commands    ← Root 참조
# Frontend Stack                  (TypeScript, React 19, Rspack)
# File Conventions                 (components/, views/, stores/)
# Routing Patterns                 (React Router v6)
# API Call Patterns                (TanStack Query)
# General Rules                    (no Reflux, no class components)
# UI Patterns & Design System
# Testing                          (Jest, RTL)
```

`tests/AGENTS.md` (테스트 4.1KB):
```markdown
> See /AGENTS.md for commands    ← Root 참조
# Test File Location               (mirror convention)
# Add to Existing Files             (don't create new)
# pytest Patterns
# Factory Methods                   (MUST use factories)
# Date-Stable Rules                 (no hardcoded years)
```

---

## Part 3: Override 및 충돌 해결 규칙

### 우선순위 (높은 순)

```
1. 사용자 채팅 프롬프트          ← 항상 최우선
2. AGENTS.override.md (해당 디렉토리)  ← Codex 전용
3. 가장 가까운 AGENTS.md         ← nearest-file-wins
4. 상위 디렉토리 AGENTS.md       ← 병합됨
5. Global (~/) AGENTS.md         ← 기본값
```

### AGENTS.override.md (Codex 전용 기능)

- 같은 디렉토리의 `AGENTS.md`를 **완전히 대체** (무시)
- 용도: 팀별 임시 오버라이드, 개인 설정
- 주의: 상위 디렉토리에 실수로 남기면 하위 전체에 영향

### 병합 동작

```
Root AGENTS.md 내용
---
packages/ AGENTS.md 내용      ← 나중에 나옴 = 충돌 시 우선
---
packages/foo/ AGENTS.md 내용   ← 가장 나중 = 최고 우선
```

에이전트는 모든 레벨을 **연결(concatenate)** — 제거가 아닌 **추가(additive)**

---

## Part 4: 제3의 모델 — Datadog의 "Root as Router"

Datadog은 Sentry와 Next.js의 하이브리드 접근:

### Root AGENTS.md = 작업 기반 라우터

```markdown
# Tasks
To create an email, read @emails/AGENTS.md
To create a Go service, read @go/services/AGENTS.md
To add unit tests, read @.agents/unit-tests.md
```

### 4-Layer 구조

| 위치 | 역할 | 관리 주체 |
|------|------|-----------|
| **Root AGENTS.md** | 작업 기반 라우팅 테이블 | 중앙 팀 |
| **Folder AGENTS.md** | 폴더별 도메인 규칙 | 각 팀 |
| **`.agents/` 디렉토리** | 크로스 커팅 관심사 (테스트, CI) | 중앙 팀 |
| **`AGENTS.local.md`** | 개인 오버라이드 (.gitignored) | 개인 |

### Claude Code 호환 원라이너

```bash
echo "Read @AGENTS.md" > CLAUDE.md
```

---

## Part 5: 크기 예산 & 컨텍스트 윈도우 전략

### 하드 넘버

| 지표 | 수치 | 출처 |
|------|------|------|
| LLM 지시 수용 능력 | ~150~200개 지시 | HumanLayer |
| 시스템 프롬프트 오버헤드 | ~50개 (Claude Code 내부) | AI config 비교 가이드 |
| **실효 예산** | **~100~150개 지시** | 산출값 |
| Root 분할 임계 | 150~200줄 | Augment Code |
| 단일 파일 상한 | 371줄 | Augment Code (canonical/maas) |
| Codex 합산 제한 | 32 KiB (기본) | OpenAI Codex 스펙 |
| 성능 저하 시작 | 컨텍스트의 ~40% 초과 시 | Dex Horthy |

### 컨텍스트 윈도우 예산 계산

```
Claude Opus 4 총 컨텍스트:       ~200K tokens
안전 구간 (40%):                  ~80K tokens
  - 시스템 프롬프트:              ~15-20K tokens
  - AGENTS.md (전 레벨 합산):     ~2-5K tokens (목표)
  - MCP 도구 정의:                ~5-10K tokens
  - 실제 작업용 잔여:             ~45-58K tokens
```

### 핵심 인사이트

> **"AGENTS.md의 모든 토큰은 관련성과 무관하게 매 요청마다 로딩된다. 이것이 하드 예산 문제를 만든다."**

따라서:
1. AGENTS.md는 **최소화** — 항상 필요한 것만
2. 전문 지식은 **Skills/on-demand** — 필요할 때만 로딩
3. 특화 에이전트 > 범용 에이전트 — 컨텍스트 관리 전략

---

## Part 6: 콘텐츠 분류 — 포함 vs 제외

### AGENTS.md에 포함할 것 (높은 ROI)

| 카테고리 | 우선도 | 이유 |
|----------|--------|------|
| 빌드/테스트 명령 | 🔴 최고 | 코드에서 추론 불가, 가장 자주 필요 |
| 기술 스택 + 버전 | 🔴 높음 | 프레임워크 선택은 코드에서 불명확할 수 있음 |
| 프로젝트 구조 | 🔴 높음 | 모노레포에서 네비게이션 필수 |
| 핵심 컨벤션 | 🟠 중간 | "named exports 사용", "API는 {data, error} 반환" |
| PR/Git 워크플로 | 🟡 낮음 | 제목 형식, 필수 체크 |

### AGENTS.md에서 제외할 것 (낮은 ROI)

| 카테고리 | 이유 | 대안 |
|----------|------|------|
| 코드 스타일 규칙 | 린터가 더 정확 | ESLint, Prettier 설정 |
| 당연한 조언 | 토큰 낭비 ("깨끗한 코드를 작성하라") | 삭제 |
| 전체 API 문서 | 너무 크고 매번 로딩됨 | `docs/` 디렉토리, 링크 |
| 작업별 지시 | 일시적, 영속 불필요 | 프롬프트에 직접 입력 |
| 도메인 지식 | 너무 방대 | SKILL.md, `agent_docs/` |

---

## Part 7: 안티패턴 종합

| # | 안티패턴 | 왜 나쁜가 | 해결 |
|---|----------|-----------|------|
| 1 | **Root에 모든 것 덤프** | 컨텍스트 과부하 | 라우팅 + Skills 분리 |
| 2 | **레벨 간 내용 중복** | 토큰 낭비 + 충돌 위험 | `> See /AGENTS.md` 참조 |
| 3 | **인간용 산문체** | 에이전트에게 비효율 | 간결한 지시문으로 변환 |
| 4 | **LLM 자동 생성** | 성공률 -2%, 비용 +20% | 인간이 직접 작성 |
| 5 | **낡은 오버라이드 파일 방치** | 잘못된 지시 로딩 | 정기 리뷰 |
| 6 | **32 KiB 초과** | 조용히 잘림 | 분할 또는 Skills 이동 |
| 7 | **빈 AGENTS.md 파일** | 디버깅 시 혼란 | 삭제하거나 내용 추가 |
| 8 | **모든 하위 폴더에 파일 생성** | 관리 부담 | 필요한 경계에서만 |

---

## Part 8: Cursor MDC와의 비교 (참고)

Cursor는 AGENTS.md와 다른 접근:

| 측면 | AGENTS.md | Cursor .mdc |
|------|-----------|-------------|
| 스코핑 | 디렉토리 계층 | **Glob 패턴** (`**/*.tsx`) |
| 활성화 | 자동 (경로 기반) | 4단계 (Always/Auto/Model/Manual) |
| 포맷 | 표준 Markdown | MDC frontmatter |
| 세분화 | 디렉토리 단위 | **파일 타입 단위** |

```yaml
# Cursor MDC 예시
---
description: React component conventions
globs: ["**/*.tsx", "**/*.jsx"]
alwaysApply: false
---
# React Rules
- Use functional components...
```

→ Cursor가 더 세분화되지만, AGENTS.md와 상호운용 불가

---

## Part 9: 실전 적용 가이드 — StockView 프로젝트

### 현재 상태
- `CLAUDE.md` 단일 파일 (~4KB)
- 백엔드(API routes) + 프론트엔드(React) 혼합

### 권장 구조 (Directory 모델)

```
2026-stock/
├── AGENTS.md                ← ~100줄, 라우팅 + 공유 명령
│   ├── 프로젝트 개요
│   ├── 빌드/테스트 명령 (npm run dev, build, lint)
│   ├── DB 명령 (prisma generate, migrate, seed)
│   ├── 환경 변수 목록
│   └── 라우팅 테이블 → src/app/AGENTS.md, src/lib/AGENTS.md
│
├── CLAUDE.md → AGENTS.md    ← 심링크 또는 "@AGENTS.md" import
│
├── src/app/AGENTS.md        ← ~50줄, 라우트 구조
│   ├── App Router 컨벤션
│   ├── API Route 패턴 (cron, watchlist, auth)
│   └── 색상 컨벤션 (빨강=상승, 파랑=하락)
│
└── src/lib/AGENTS.md        ← ~50줄, 데이터 소스
    ├── data-sources 구조 (Naver, Yahoo, KRX)
    ├── withRetry + Promise.allSettled 패턴
    └── 배치 크기 제한 (100~500)
```

### 사이즈 예산

| 파일 | 목표 줄수 | 목표 크기 |
|------|-----------|-----------|
| Root AGENTS.md | ~100줄 | ~2KB |
| src/app/AGENTS.md | ~50줄 | ~1KB |
| src/lib/AGENTS.md | ~50줄 | ~1KB |
| **합계** | **~200줄** | **~4KB** |

---

## 핵심 결론 5가지

1. **Root = 허브 + 라우터** — 공유 명령어 + 하위 파일 안내, 100~200줄 이내
2. **하위 = 도메인 전용** — 해당 영역에서만 적용되는 규칙, 50~100줄 이내
3. **중복 금지** — 하위 파일은 `> See /AGENTS.md` 로 Root 참조
4. **전문 지식은 Skills로** — 상시 로딩 vs on-demand 로딩 구분이 핵심
5. **전체 합산 ~5KB 이하** — 컨텍스트 40% 규칙 준수

---

## 전체 소스 URL

- https://developers.openai.com/codex/guides/agents-md/ — Codex 공식 스펙
- https://dev.to/datadog-frontend-dev/steering-ai-agents-in-monorepos-with-agentsmd-13g0 — Datadog
- https://nx.dev/blog/nx-ai-agent-skills — Nx Skills
- https://github.com/getsentry/sentry/blob/master/AGENTS.md — Sentry Root
- https://github.com/vercel/next.js/blob/canary/AGENTS.md — Next.js Root
- https://www.augmentcode.com/guides/how-to-build-agents-md — Augment Code
- https://cursor.com/docs/rules — Cursor MDC

---

*3-Agent Team 계층 구조 딥다이브 완료: 2026-04-04*
