# AGENTS.MD 종합 리서치 보고서

> 발표일: 2026-04-07 (월) | 리서치일: 2026-04-03 | 작성: 3-Agent Team (Researcher A + B + Lead)

---

## 목차

1. [AGENTS.MD란?](#1-agentsmd란)
2. [타임라인](#2-타임라인)
3. [도구별 지원 현황](#3-도구별-지원-현황)
4. [비교: AGENTS.md vs CLAUDE.md vs .cursorrules](#4-비교-agentsmd-vs-claudemd-vs-cursorrules)
5. [Vercel 벤치마크 (2026.01)](#5-vercel-벤치마크-202601)
6. [주의사항 — /init 자동 생성 금지](#6-주의사항--init-자동-생성-금지)
7. [Best Practices](#7-best-practices)
8. [한국어 커버리지](#8-한국어-커버리지)
9. [우리 프로젝트 적용 제안](#9-우리-프로젝트-적용-제안)
10. [미래 전망](#10-미래-전망)

---

## 1. AGENTS.MD란?

Git 저장소에 체크인하는 **표준 마크다운 파일** — "AI 에이전트를 위한 README".

- `README.md`가 인간 개발자를 위한 것이라면, `AGENTS.md`는 AI 에이전트에게 **빌드 명령, 테스트 방법, 코딩 컨벤션, 금지사항** 등을 알려주는 파일
- 벤더 중립적 (Linux Foundation AAIF 거버넌스)
- 표준 Markdown 포맷 — 특수 문법 불필요
- 2026년 4월 현재 **60,000+ 저장소**에서 채택

### 핵심 아이디어

> "코드베이스에서 AI가 스스로 발견할 수 없는 정보만 기록하라"

AI 에이전트가 코드를 읽으면 파악 가능한 정보(파일 구조, 함수 시그니처 등)는 제외하고, **빌드 명령, 환경 설정, 코딩 철학, 금지사항** 등 코드만으로는 알 수 없는 맥락을 기록한다.

---

## 2. 타임라인

| 시점 | 이벤트 |
|------|--------|
| 2025.08 | OpenAI가 Codex CLI용으로 스펙 최초 공개 |
| 2025.08.28 | GitHub Copilot 네이티브 지원 발표 |
| 2025.11 | GitHub Blog — 2,500+ 저장소 분석 결과 발표 |
| 2025.12.09 | **Linux Foundation AAIF 설립** (AGENTS.md + MCP + goose 3대 창립 프로젝트) |
| 2026.01 | **Vercel 평가: AGENTS.md 100% 통과율** (baseline 53%) |
| 2026.03 | Addy Osmani — "/init 자동생성 하지 마라" 경고 |
| 2026.04 현재 | **60,000+ 저장소** 채택 |

### 주요 마일스톤 해설

- **AAIF 설립 (2025.12)**: AWS, Anthropic, Google, Microsoft, OpenAI 등 주요 AI 기업이 모두 참여하는 Linux Foundation 산하 재단. AGENTS.md를 공식 표준으로 추진
- **Vercel 벤치마크 (2026.01)**: 8KB 파일 하나로 에이전트 성공률이 53% → 100%로 향상되어 업계 최대 화제
- **60K+ 채택 (2026.04)**: GitHub 저장소 기준. 2025년 8월 공개 후 약 8개월만에 달성

---

## 3. 도구별 지원 현황

| 도구 | AGENTS.md 지원 | 자체 포맷 | 비고 |
|------|---------------|-----------|------|
| **OpenAI Codex** | ✅ 네이티브 (창시자) | — | 최초 스펙 작성자 |
| **GitHub Copilot** | ✅ 네이티브 | `.github/copilot-instructions.md` | 2025.08 발표 |
| **Cursor** | ✅ 네이티브 | `.cursor/rules/` (MDC) | MDC frontmatter 포맷 |
| **Google Jules/Gemini CLI** | ✅ 네이티브 | `GEMINI.md` | Google 자체 포맷 병행 |
| **Windsurf** | ✅ 네이티브 | `.windsurfrules` | Codeium 계열 |
| **Claude Code** | ❌ **미지원** | `CLAUDE.md` | 3,200+ 투표 요청 중 |
| **Devin** | ✅ 네이티브 | — | Cognition Labs |
| **Amp** | ✅ 네이티브 | — | Sourcegraph |
| **Aider** | ✅ 네이티브 | — | 오픈소스 |
| **Zed** | ✅ 네이티브 | — | Zed Industries |
| **Warp** | ✅ 네이티브 | — | 터미널 AI |
| **JetBrains Junie** | ✅ 네이티브 | — | JetBrains AI |
| **RooCode** | ✅ 네이티브 | — | VS Code 확장 |

### Claude Code 지원 전망

- GitHub Issue에서 **3,200+ upvote** — Claude Code 기능 요청 중 최상위
- Anthropic이 AAIF 멤버로 참여 중 → 지원은 시간 문제
- 현재 해결책: `CLAUDE.md`에서 `@AGENTS.md`로 import하여 사용 가능

---

## 4. 비교: AGENTS.md vs CLAUDE.md vs .cursor/rules

| 항목 | AGENTS.md | CLAUDE.md | .cursor/rules |
|------|-----------|-----------|---------------|
| **벤더** | Open (AAIF/Linux Foundation) | Anthropic | Anysphere |
| **범위** | **범용 (크로스 툴)** | Claude 전용 | Cursor 전용 |
| **포맷** | 표준 Markdown | Markdown (`@import` 지원) | MDC frontmatter |
| **채택** | 60,000+ repos | Claude 사용자 | Cursor 사용자 |
| **거버넌스** | Linux Foundation | Anthropic | Anysphere |
| **파일 위치** | 프로젝트 루트 | 프로젝트 루트 | `.cursor/rules/` |
| **상속** | 디렉토리 계층 | 디렉토리 계층 + `@import` | glob 패턴 매칭 |
| **커뮤니티** | GitHub + AAIF | Anthropic 포럼 | Cursor 포럼 |

### 핵심 인사이트

> **"90%+ 내용은 어떤 포맷이든 동일 — 프로젝트 구조, 빌드 명령, 코딩 컨벤션은 AI가 바뀌어도 같다"**

실질적으로 차이가 나는 10%:
- **AGENTS.md**: 도구 중립적 지시만 포함
- **CLAUDE.md**: Claude 특화 기능 활용 가능 (예: `@import`, 토큰 최적화 힌트)
- **.cursor/rules**: Cursor의 컨텍스트 시스템과 통합 (glob 기반 자동 로딩)

---

## 5. Vercel 벤치마크 (2026.01) — 핵심 데이터

### 결과 요약

| 설정 | 통과율 | 개선 |
|------|--------|------|
| Baseline (문서 없음) | 53% | — |
| Skill (기본) | 53% | +0% |
| Skill + 명시적 지시 | 79% | +26% |
| **AGENTS.md (8KB)** | **100%** | **+47%** |

### 해석

1. **Skills만으로는 부족**: 기본 skill 설정은 baseline 대비 개선 없음
2. **명시적 지시가 핵심**: skill에 구체적 지시를 추가하면 +26% 향상
3. **AGENTS.md가 압도적**: 8KB 파일 하나로 100% 달성 — 가장 비용 효율적인 접근
4. **왜?**: AGENTS.md는 에이전트가 "알아야 하지만 코드에서 발견할 수 없는" 정보를 집중 제공

### Vercel이 AGENTS.md에 포함한 내용 (8KB)

- 프로젝트 아키텍처 개요
- 빌드/테스트 명령어
- 코딩 컨벤션 및 패턴
- 금지사항 (하지 말아야 할 것들)
- 일반적인 실수와 해결법

---

## 6. 주의사항 — `/init` 자동 생성 금지

### ETH Zurich 연구 결과

- 자동 생성된 AGENTS.md → **성공률 3% 감소, 비용 20%+ 증가**
- LLM이 생성한 AGENTS.md는 코드에서 이미 발견 가능한 정보를 중복 기재
- 이로 인해 에이전트의 컨텍스트 윈도우 낭비 + 혼란 유발

### Addy Osmani (Google Chrome 팀 엔지니어링 매니저) 경고

> "에이전트가 이미 발견할 수 있는 정보를 중복 기재하면 오히려 해롭다"

### 핵심 원칙

```
✅ 기록해야 할 것:
- 빌드/테스트 명령어 (코드에서 추론 불가)
- 환경 변수 설명 (이름만으로 목적 불명확)
- 코딩 철학과 금지사항 ("왜" 이렇게 하는지)
- 도메인 특화 컨텍스트 (비즈니스 로직 배경)

❌ 기록하지 말아야 할 것:
- 파일 트리 구조 (ls로 확인 가능)
- 함수 시그니처 (코드 읽기로 확인 가능)
- 의존성 목록 (package.json에 있음)
- 자동 생성된 보일러플레이트 설명
```

---

## 7. Best Practices (GitHub Blog — 2,500+ 저장소 분석)

### 7가지 핵심 원칙

#### 1. 구체적 페르소나 부여
```markdown
## Role
You are a senior backend engineer specializing in Go microservices.
Focus on performance and type safety.
```

#### 2. 빌드/테스트 명령어를 파일 상단에 배치
```markdown
## Quick Start
- Build: `make build`
- Test: `make test`
- Lint: `golangci-lint run`
```

#### 3. 실제 코드 예시 포함
> 설명 3문단보다 코드 1개가 효과적

```markdown
## Error Handling Pattern
// ✅ Do this
if err != nil {
    return fmt.Errorf("failed to process %s: %w", id, err)
}

// ❌ Not this
if err != nil {
    log.Fatal(err)
}
```

#### 4. 금지사항 명확히
> "하지 말 것"이 "할 것"만큼 중요

```markdown
## Don'ts
- Never use `any` type — always define proper interfaces
- Never commit directly to main — always use feature branches
- Never use `log.Fatal` in library code
```

#### 5. 실패 기반 반복
- 사전에 완벽한 AGENTS.md를 작성하려 하지 말 것
- AI가 실수할 때마다 해당 내용을 AGENTS.md에 추가
- **"실패 일지"가 최고의 AGENTS.md**

#### 6. 작게 시작
- 8KB 이하 권장 (Vercel 벤치마크 기준)
- 핵심 정보만 먼저, 필요 시 점진적 추가

#### 7. 정기적 리뷰
- 코드가 변하면 AGENTS.md도 업데이트
- 오래된 정보는 해로움 (잘못된 지시 > 지시 없음)

---

## 8. 한국어 커버리지

| 소스 | 유형 | URL |
|------|------|-----|
| **GeekNews** | 커뮤니티 (3+ 스레드) | https://news.hada.io/topic?id=22635 |
| **daleseo.com** | 블로그 가이드 | https://daleseo.com/agents-md/ |
| **wikidocs.net** | 바이브 코딩 가이드 | https://wikidocs.net/327101 |
| **AI타임스** | 뉴스 기사 | 자동 생성 경고 기사 |
| **PyTorch KR** | 커뮤니티 토론 | https://discuss.pytorch.kr/t/agents-md-openai-ai/7578 |

### 한국 채택 동향

- 아직 초기 단계이나, GeekNews에서 활발한 토론
- 대부분의 한국 개발자는 Cursor(`.cursorrules`) 또는 Claude Code(`CLAUDE.md`) 사용
- AGENTS.md 인지도는 높아지는 추세

---

## 9. 우리 프로젝트 적용 제안

### 현재 상태
- `CLAUDE.md` 사용 중 (프로젝트 루트)
- Claude Code 중심 워크플로우

### 권장 전환 전략

#### Phase 1: 현재 (유지)
```
CLAUDE.md  ← 현재 그대로 사용
```

#### Phase 2: AGENTS.md 추가 (권장)
```
AGENTS.md  ← 범용 정보 (빌드, 테스트, 컨벤션)
CLAUDE.md  ← @AGENTS.md import + Claude 특화 설정
```

#### Phase 3: Claude Code 네이티브 지원 시
```
AGENTS.md  ← 단일 소스 of truth
CLAUDE.md  → AGENTS.md 심링크 또는 삭제
```

### 구체적 실행

```bash
# Phase 2 실행 시
# 1. AGENTS.md 생성 (CLAUDE.md에서 범용 내용 추출)
# 2. CLAUDE.md에서 @AGENTS.md import
# 3. CLAUDE.md에는 Claude 특화 설정만 유지
```

### StockView 프로젝트에서 AGENTS.md에 넣을 내용

1. **빌드/테스트 명령어** — `npm run dev`, `npm run build`, `npx prisma generate`
2. **데이터 소스 설명** — Naver Finance, Yahoo Finance, KRX 관계
3. **색상 컨벤션** — 한국식 (빨강=상승, 파랑=하락)
4. **크론 잡 구조** — GitHub Actions → API 엔드포인트 패턴
5. **금지사항** — 직접 DB 쿼리 금지 (Prisma 사용), `NEXT_PUBLIC_` 비밀 금지

---

## 10. 미래 전망

### 단기 (2026 Q2~Q3)

- **Claude Code AGENTS.md 지원 임박** — 3,200+ upvote, Anthropic의 AAIF 참여
- **AAIF 거버넌스 강화** — 공식 스펙 v1.0 릴리스 예상
- **VS Code 네이티브 통합** — GitHub Copilot이 이미 지원하므로 에디터 레벨 지원 확대

### 중기 (2026 Q4~2027)

- **"AGENTS.md Engineering" 신규 분야** — 전문 컨설팅, 도구 등장
- **Agent Experience (AX)** — Developer Experience (DX) 옆의 새로운 설계 고려사항
- **포맷 통합 압력** — 벤더별 포맷이 AGENTS.md로 수렴하는 추세

### 장기 (2027~)

- **AI 코딩 에이전트 표준 인프라** — CI/CD 파이프라인처럼 당연한 존재
- **자동 검증** — AGENTS.md의 정확성을 자동으로 테스트하는 도구
- **다중 에이전트 협업** — 여러 AI 에이전트가 하나의 AGENTS.md를 공유하며 협업

---

## 발표 슬라이드 구성 제안

### 슬라이드 1: 타이틀
> "AGENTS.MD — AI 에이전트를 위한 README"

### 슬라이드 2: 문제 제기
> "AI 코딩 에이전트는 코드를 읽을 수 있지만, 맥락은 모른다"

### 슬라이드 3: AGENTS.MD 소개
> 정의, 역사, 현재 채택 (60,000+ repos)

### 슬라이드 4: Vercel 벤치마크 ⭐
> 53% → 100% 차트 (가장 임팩트 있는 슬라이드)

### 슬라이드 5: 도구별 지원 현황
> 표 형태 — Claude Code만 미지원 강조

### 슬라이드 6: 비교 (AGENTS.md vs CLAUDE.md vs .cursorrules)
> "90%는 같다" 강조

### 슬라이드 7: 주의사항
> /init 자동 생성 금지 — ETH Zurich 연구

### 슬라이드 8: Best Practices
> GitHub 2,500 저장소 분석 핵심 3가지

### 슬라이드 9: 우리 프로젝트 적용
> CLAUDE.md → AGENTS.md 전환 전략

### 슬라이드 10: 미래 전망 & Q&A
> AX(Agent Experience), AAIF 거버넌스, Claude Code 지원 예측

---

## 주요 소스 URL

### 공식
- https://agents.md/ — 공식 사이트
- https://github.com/agentsmd/agents.md — GitHub 저장소
- https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation — AAIF 설립

### 벤치마크 & 연구
- https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals — Vercel 100% 통과율
- https://addyosmani.com/blog/agents-md/ — Addy Osmani /init 경고
- https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/ — 2,500 저장소 분석

### 비교 & 가이드
- https://thepromptshelf.dev/blog/cursorrules-vs-claude-md/ — 3대 포맷 비교
- https://www.builder.io/blog/agents-md — Builder.io 가이드
- https://www.aihero.dev/a-complete-guide-to-agents-md — 완전 가이드

### 한국어
- https://news.hada.io/topic?id=22635 — GeekNews
- https://daleseo.com/agents-md/ — Dale Seo
- https://wikidocs.net/327101 — WikiDocs
- https://discuss.pytorch.kr/t/agents-md-openai-ai/7578 — PyTorch KR

### YouTube
- https://proflead.dev/videos/agents-md-tutorial-video-1/ — 튜토리얼
- https://agentsmd.net/videos/ — 영상 모음

### HackerNews
- https://news.ycombinator.com/item?id=44957443 — 최초 공개
- https://news.ycombinator.com/item?id=46809708 — Vercel 평가 결과

---

*리서치 완료: 2026-04-03 | 발표일: 2026-04-07 (월)*
