# AGENTS.md 계획 — Pass 2 리뷰 (실현가능성 & 기술적 정확성)

**리뷰어**: Claude Opus 4.6 | **날짜**: 2026-04-05

---

## 1. `@AGENTS.md` Import — 실제로 작동하는가?

**판정: 작동함 (확인됨)**

호환성 리서치(`claude-md-agents-md-compatibility.md`) 확인 결과:
- `@import` 구문이 Claude Code에서 공식 지원됨
- Anthropic 문서에서 CLAUDE.md에 `@AGENTS.md`를 명시적으로 권장
- 실제 사용 사례: Vercel/next.js, Grafana, Ruby/rdoc 모두 이 패턴 사용
- 상대 경로는 import하는 파일의 위치에서 해석
- 재귀 import 지원 (최대 깊이: 5단계)

여기에 기술적 위험은 없다.

---

## 2. 크기 추정: 100-120줄 / 4KB 미만

**판정: 빡빡하지만 가능**

계산 검증:
- 11개 섹션 + 헤더 = ~22줄 (헤더 + 빈 줄)
- 나머지 ~80-98줄이 콘텐츠 = 섹션당 평균 ~7-9줄
- 줄당 평균 ~40바이트 기준, 120줄 = ~4.8KB

**문제**: 120줄은 콘텐츠가 매우 간결하지 않으면 4KB를 초과할 가능성이 높다. Vercel 루트 AGENTS.md는 176줄 / ~4KB이지만 극도로 압축된 형식을 사용한다.

현재 CLAUDE.md는 88줄 / ~4.2KB (Vercel 보일러플레이트 섹션 포함).

**권고**: 120-150줄 / 5KB로 예산 조정. 4KB 목표는 인위적으로 빡빡하다. 리서치에 따르면 분할이 필요해지는 실효 상한은 150-200줄이다.

---

## 3. 마이그레이션 위험: CLAUDE.md를 10줄 래퍼로

**판정: 중간 위험 — Vercel 섹션은 이전 불가**

현재 CLAUDE.md 콘텐츠 분석:
| 섹션 | 줄 수 | AGENTS.md로 이전 가능? |
|---|---|---|
| 프로젝트 개요 (L1-7) | 7 | 예 |
| 명령어 (L9-27) | 19 | 예 |
| 아키텍처 - 기술 스택 (L30-38) | 9 | 예 |
| 아키텍처 - 데이터 소스 (L40-46) | 7 | 예 |
| 아키텍처 - 데이터 흐름 (L48-53) | 6 | 예 |
| 아키텍처 - 주요 규칙 (L55-60) | 6 | 예 |
| 환경 변수 (L62-63) | 2 | 예 |
| **Vercel 모범 사례 (L65-88)** | **24** | **아니오** |

Vercel 모범 사례 섹션(24줄, 파일의 ~29%)은:
- Vercel이 자동 주입(`<!-- VERCEL BEST PRACTICES START/END -->`)
- Vercel이 관리하는 콘텐츠로 자동 업데이트될 수 있음
- Claude Code 전용 배포 가이드

**Vercel 섹션을 제외하고 모든 것을 AGENTS.md로 이동하면**, CLAUDE.md 래퍼는:
```markdown
@AGENTS.md

## Claude Code 전용
<!-- VERCEL BEST PRACTICES START -->
... (Vercel 자동 관리 콘텐츠)
<!-- VERCEL BEST PRACTICES END -->
```

이것은 ~27줄이지, 10줄이 아니다. 계획의 "10줄 CLAUDE.md" 주장은 부정확하다.

---

## 4. 에이전트 역할 강제 실행

**판정: 설명대로는 강제 불가**

계획에서 5개 에이전트 역할(CTO Lead/opus, Plan/sonnet, Code/sonnet, Gap Detector/sonnet, Review/sonnet)을 제안한다. 현실 검증:

- Claude Code의 `settings.local.json` 권한은 **전역**이며, 에이전트별이 아니다. 에이전트 역할별 도구 접근을 제한하는 메커니즘이 없다.
- 현재 `agent-state.json`은 bkit이 이미 에이전트 역할("Plan", "general-purpose", "superpowers:code-reviewer")을 추적하지만, 이것은 bkit 오케스트레이션 개념이지 Claude Code 네이티브 기능이 아니다.
- Claude Code 서브에이전트(SendMessage/TaskCreate 통해)는 모두 동일한 권한 세트를 상속한다.
- **에이전트별 도구 제한은 현재 Claude Code 아키텍처에서 불가능하다.**

역할은 **관례**(프롬프트 기반)로만 존재할 수 있으며, 기술적으로 강제할 수 없다.

---

## 5. bkit 호환성

**판정: 충돌 없음**

bkit은 독립적으로 운영:
- `.bkit/state/` — agent-state.json, memory.json, session-history.json, pdca-status.json
- `.bkit/audit/` — 일별 JSONL 감사 로그
- `.bkit/runtime/` — 런타임 에이전트 상태

bkit은 CLAUDE.md나 AGENTS.md 콘텐츠를 읽지도, 의존하지도 않는다. 자체 오케스트레이션 상태를 추적한다. AGENTS.md 마이그레이션은 bkit에 전혀 영향을 미치지 않는다.

참고 사항: bkit의 `agent-state.json`은 이미 자체 역할 시스템을 구현하고 있다. 계획의 에이전트 역할은 bkit의 기존 역할 분류와 일치시켜 혼란을 방지해야 한다.

---

## 6. settings.local.json 권한 변경

**판정: 안전 (주의사항 있음)**

현재 권한은 이미 비교적 관대하다(context-mode MCP, gh workflow/secret/run, brew, bun, claude CLI). 계획에서 제안하는 것:
- 에이전트 역할에 대한 권한 개선

Claude Code 권한은 전역(역할별이 아님)이므로, 추가 사항은 모든 에이전트에 적용된다. 현재 세트는 합리적이다. `Bash()` 패턴 추가는 보수적으로 해야 한다.

현재 설정에서 보안 취약점은 식별되지 않았다.

---

## 7. 일상 워크플로우

**판정: 개발자에게 최소한의 변화**

마이그레이션 후 일반적인 작업 흐름:
1. 개발자가 Claude Code 세션을 연다
2. Claude Code가 CLAUDE.md를 읽고, AGENTS.md를 `@import`한다
3. 두 파일이 컨텍스트로 확장된다 (현재와 동일하지만 두 소스에서)
4. 개발자가 정상적으로 작업한다

유일한 행동 변화: 지시사항이 이제 CLAUDE.md에서 직접이 아니라 AGENTS.md에서(import를 통해) 온다. 사용자에게는 투명하다.

Cursor나 다른 도구를 동시에 사용하면 AGENTS.md를 네이티브로 읽는다 — 그것이 실제 이점이다.

---

## 8. 비용/토큰 영향

**판정: 무시할 수준의 증가**

`@import` 패턴은 세션 시작 시 AGENTS.md 콘텐츠를 CLAUDE.md에 로드한다. 토큰 사용:
- **이전**: ~4.2KB CLAUDE.md가 요청당 로드
- **이후**: ~5KB AGENTS.md + ~1KB CLAUDE.md 래퍼 = ~6KB 요청당 로드
- **증가**: 요청당 ~1.8KB (~450토큰)

Claude 가격 기준으로 이것은 무시할 수준(<$0.01/일, 일반적인 사용량 기준). 하지만 총 컨텍스트 예산이 ~6KB가 되며, 계획에서 명시한 ~5KB가 아니다.

CLAUDE.md에 남는 Vercel 섹션이 계획에서 고려하지 않은 오버헤드를 추가한다.

---

## 9. 롤백 계획

**판정: 간단 — git revert**

이것은 두 파일 변경(AGENTS.md 생성, CLAUDE.md 수정)이므로:
- `git revert <commit>`으로 원본 CLAUDE.md 복원
- AGENTS.md 삭제
- 총 롤백 시간: 1분 미만

데이터베이스 변경 없음, 설정 마이그레이션 없음, 의존성 변경 없음.

---

## 요약

### 기술적으로 건전한 부분
- `@AGENTS.md` import 패턴: 작동 확인, 공식 문서화됨
- bkit 호환성: 충돌 없음
- 롤백: 간단 (git revert)
- 일상 워크플로우: 개발자에게 투명
- 토큰 비용: 무시할 수준의 증가

### 실현가능성 우려 (중간 위험)
- **크기 추정이 너무 공격적**: 4KB 목표를 초과할 것. 총 5-6KB로 예산 조정 필요.
- **"10줄 CLAUDE.md"는 부정확**: Vercel 보일러플레이트로 인해 최소 ~27줄 필요. 계획에서 Vercel 자동 관리 섹션을 고려해야 한다.
- **토큰 예산이 과소평가됨**: 계획은 총 <5KB라 하지만, Vercel 섹션 때문에 실제로는 ~6KB.

### 차단 요소 / 부정확한 점 (높은 위험)
- **에이전트별 도구 제한은 불가능하다.** 계획의 에이전트 역할 강제 전략은 이상적이지 구현 불가능하다. 역할은 프롬프트 관례(신뢰할 수 없음)로만 강제 가능.
- **Vercel 모범 사례 섹션이 간과됨**: 이 자동 관리 섹션은 AGENTS.md로 이동할 수 없으며 "얇은 래퍼" 설계를 깨뜨릴 것이다.

### 구체적 제안
1. **Vercel 섹션 인정**: CLAUDE.md는 ~27줄(import + Vercel 섹션)이 될 것이며, 10줄이 아니다. 계획을 그에 맞게 업데이트.
2. **크기 목표 완화**: AGENTS.md 단독 <4KB 대신 총 5-6KB (AGENTS.md + CLAUDE.md).
3. **에이전트 역할을 관례로 재정의**: "강제"라는 주장 삭제 — bkit이 추적할 수 있지만 Claude Code가 강제할 수 없는 프롬프트 기반 가이드로 설명.
4. **bkit 역할 분류와 정렬**: 계획의 5개 역할을 bkit의 기존 역할 시스템(Plan, general-purpose, superpowers:code-reviewer)에 매핑하여 병렬 분류 방지.
5. **데이터 소스 상세 정보는 CLAUDE.md에 유지 검토**: Naver Finance EUC-KR 스크래핑 세부사항, Yahoo v8 API 명세, KRX 레거시 노트는 Claude Code 전용 디버깅 컨텍스트이다. 다른 도구에는 이 수준의 상세 정보가 필요하지 않다. AGENTS.md로 이동하면 비Claude 도구에 대한 컨텍스트 낭비.

---

## 종합 실현가능성 점수: 7/10

핵심 전략(AGENTS.md + CLAUDE.md 브리지)은 기술적으로 건전하고 충분히 조사되었다. 주요 위험:
- 지나치게 낙관적인 크기 추정 (외형적 수정)
- 에이전트 역할 강제 주장 (재정의 필요, 차단 요소는 아님)
- Vercel 섹션 간과 (쉽게 수용 가능)

이 중 차단 요소는 없다. 위의 조정 사항을 반영하면 계획은 실행 준비 완료.
