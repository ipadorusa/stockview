# AGENTS.md & 하네스 전략 — Pass 1 리뷰 (완전성 & 갭 분석)

**리뷰어**: Claude Opus 4.6 | **날짜**: 2026-04-05

---

## 강점

1. **@import 브리지가 정확하고 충분히 조사됨.** Claude Code가 AGENTS.md를 네이티브로 읽지 않는다는 점을 정확히 파악했고, CLAUDE.md에서 `@AGENTS.md`를 import하는 것이 Anthropic이 문서화한 우회 방법이라는 점을 올바르게 식별했다. `.ai/research/claude-md-agents-md-compatibility.md`의 호환성 리서치가 철저하며 — next.js, grafana, sentry 패턴을 다루고 있다.

2. **크기 예산이 현실적이다.** ~100-120줄 / 4KB 미만 목표는 Researcher C의 콘텐츠 배분 연구 결과(루트 최대 100-200줄, 합계 5KB 미만)에 부합한다. Vercel 벤치마크는 8KB로 100%를 달성했으므로 — 더 작은 프로젝트에 4KB는 적절한 비율이다.

3. **"자동 생성 금지" 입장이 올바르다.** ETH Zurich 연구 결과(자동 생성 콘텐츠의 성공률 3% 하락, 비용 20% 증가)를 명시적으로 언급한 것은 계획 작성자가 리서치를 읽었음을 보여준다.

4. **단계 순서가 대체로 합리적이다.** 스킬/하위 디렉토리 확장 전에 AGENTS.md를 먼저 생성하는 것은 GitHub 블로그 2,500개 저장소 분석의 "작게 시작하고, 나중에 분리" 원칙을 따른다.

5. **기존 훅이 충분하다고 판단한 것은 실용적이다.** 단일 앱 저장소에서 훅 레이어를 과도하게 설계하지 않은 것이 현실적이다.

---

## 발견된 갭

### G1: Vercel 모범 사례 섹션 — 중복 위험 (높음)

현재 CLAUDE.md에는 20줄의 `<!-- VERCEL BEST PRACTICES -->` 블록(65-88줄)이 자동 주입되어 있다. 계획에서 AGENTS.md에 11개 섹션을 제안하지만, 이 Vercel 블록을 AGENTS.md로 이동할지, CLAUDE.md에 남길지, 완전히 삭제할지를 명시적으로 다루지 않는다. 이 블록은 범용적이며(StockView 전용이 아님) ~800토큰의 비프로젝트 컨텍스트를 추가한다. **권고**: AGENTS.md에서 제외. StockView에 실제로 관련 있는 Vercel 규칙 2-3개만 유지. 나머지는 노이즈.

### G2: 기존 `.agents/skills/` 디렉토리 미다룸 (높음)

프로젝트에는 이미 `.agents/skills/vercel-react-best-practices/`가 있으며, 자체 `AGENTS.md`, `SKILL.md`, 60개 이상의 규칙 파일을 포함하고 있다. 계획의 Phase 3에서 `data-pipeline`과 `prisma-migration` 스킬 추가를 제안하지만, 기존 스킬 디렉토리나 루트 AGENTS.md와 `.agents/skills/*/AGENTS.md`의 관계를 전혀 언급하지 않는다. **권고**: 루트 `AGENTS.md`는 Claude Code 컨텍스트용(@import 통해), `.agents/skills/`는 온디맨드 스킬 로딩용이라는 점을 명시 — 서로 다른 목적이므로 콘텐츠가 중복되면 안 된다.

### G3: 롤백 또는 검증 기준 없음 (중간)

계획에 5단계가 정의되어 있지만 성공 기준이나 롤백 트리거가 없다. AGENTS.md가 작동하는지 어떻게 아는가? Vercel 벤치마크에는 테스트 스위트가 있었지만 — StockView에는 테스트 프레임워크가 없다. **권고**: 관찰 가능한 신호 2-3개 정의: (a) 에이전트가 프롬프트 없이 `withRetry()` 패턴을 올바르게 사용하는가, (b) 에이전트가 알림 없이 한국 주식 색상 규칙(빨강=상승, 파랑=하락)을 준수하는가, (c) 에이전트가 명시적 지시 없이 `npm run build` 전에 `npx prisma generate`를 실행하는가.

### G4: bkit 통합이 모호함 (중간)

계획에서 "AGENTS.md에 bkit PDCA용 라우팅 힌트"를 언급하지만, 이 힌트가 어떤 모습인지 명시하지 않는다. `pdca-status.json`은 37K+ 토큰으로 — 분명히 활발한 워크플로우다. **권고**: 구체적인 라우팅 힌트 1-2개 정의. 예: "기능 완료 후 `bkit checkpoint`를 실행하여 진행 상황 기록" 또는 "새 단계 작업 시작 전 `bkit pdca status` 확인".

### G5: 5개 에이전트 역할 vs. 1인 개발자 현실 (중간)

계획에 5개 에이전트 역할(CTO Lead/opus, Plan/sonnet, Code/sonnet, Gap Detector/sonnet, Review/sonnet)을 정의한다. 이것은 단일 Next.js 앱의 1인 개발자 프로젝트다. 5개 전문 에이전트를 운영하면 실제 효과 대비 오케스트레이션 복잡성이 과도해질 수 있다. **권고**: 2개 역할로 시작: (a) Plan+Review (opus), (b) Code (sonnet). Gap Detector는 bkit 감사 이력이 충분히 쌓인 후에 추가. 개발자 본인이 CTO이므로 CTO Lead 역할은 불필요.

### G6: 권한 모델 누락 (중간)

현재 `settings.local.json`은 특정 명령어(`gh workflow`, `gh run`, `gh secret`, `bun install`, `brew uninstall`, `claude`)를 허용한다. 계획에서 "권한 모델 개선"을 언급하지만 구체적인 변경 사항이 없다. 특히 누락: `npx prisma` 명령어가 허용 목록에 없어 — 에이전트가 마이그레이션 실행 시마다 프롬프트가 뜬다. **권고**: `Bash(npx prisma:*)` 및 `Bash(npm run seed:*)`를 허용 목록에 추가 — 개발 DB에 대한 안전한 읽기/쓰기 작업이므로.

### G7: CLAUDE.md 오버라이드 동작 미언급 (낮음)

계획에서 CLAUDE.md가 "얇은 래퍼"가 된다고 하지만, 두 파일 모두에 동일한 지시가 존재할 때의 동작을 다루지 않는다. Claude Code의 병합 동작: 모든 CLAUDE.md 파일이 병합됨(전역 > 프로젝트 루트 > 하위 디렉토리), 나중의/가까운 파일이 우선. AGENTS.md가 "모든 DB 접근에 Prisma 사용"이라 하고 CLAUDE.md에 충돌하는 지시가 있으면 CLAUDE.md 지시가 우선한다. **권고**: 충돌 해결에 대한 간단한 메모 추가 — AGENTS.md가 원본이고, CLAUDE.md는 추가만 해야 하며 모순하면 안 된다.

### G8: "자주 하는 실수" 섹션 누락 (낮음)

Vercel 벤치마크 AGENTS.md와 GitHub 블로그 모범 사례 모두 "자주 하는 실수 / 주의사항" 섹션이 매우 효과적이라고 강조한다. 계획의 11개 섹션에 "금지사항"은 있지만 "자주 하는 실수"는 없다. 이 둘은 다르다 — 금지사항은 규칙이고, 자주 하는 실수는 "X 에러가 보이면 해결 방법은 Y"이다. StockView 예: Naver 스크래핑의 EUC-KR 인코딩 문제, KR 시세의 NXT 가격 혼입(커밋 d15cd6f), 환율 조회 타이밍.

---

## 구체적 권고사항

| 우선순위 | 조치 | 소요 시간 |
|----------|------|----------|
| P0 | G1 대응: AGENTS.md 작성 전 Vercel 블록 처리 방안 결정 | 5분 |
| P0 | G2 대응: `.agents/skills/` vs 루트 `AGENTS.md` 범위 구분 문서화 | 10분 |
| P1 | G3 대응: 관찰 가능한 검증 신호 3개 정의 | 15분 |
| P1 | G5 대응: 초기에 2개 에이전트 역할로 축소 | 5분 |
| P1 | G6 대응: Prisma/seed 명령어를 권한 허용 목록에 추가 | 2분 |
| P2 | G4 대응: 구체적인 bkit 라우팅 힌트 2개 작성 | 10분 |
| P2 | G8 대응: "자주 하는 실수"를 12번째 섹션으로 추가 | 15분 |
| P3 | G7 대응: 구현 가이드에 충돌 해결 메모 추가 | 5분 |

---

## 종합 평가: 7.5 / 10

**근거**: 계획이 충분히 조사되었다(`.ai/research/` 코퍼스가 호환성, 콘텐츠 배분, 생태계 패턴을 철저히 다룬다). 핵심 전략 — AGENTS.md를 단일 진실 원천으로 사용하고 CLAUDE.md를 얇은 래퍼로 — 은 next.js, grafana가 사용하고 Anthropic 자체 문서에서 권장하는 업계 표준 패턴이다. 5단계 롤아웃이 합리적이다.

2.5점 감점 이유: (a) 5개 에이전트 역할 모델이 1인 프로젝트에 과도(-1), (b) AGENTS.md가 실제로 에이전트 행동을 개선하는지 알 수 있는 검증 기준 없음(-0.5), (c) 기존 `.agents/skills/` 디렉토리와 Vercel 모범 사례 블록이 구현 시 혼란을 야기할 미다룬 부분(-0.5), (d) bkit 통합이 여전히 모호(-0.5).

G1, G2, G5를 해결하면 계획은 구현 준비 완료. 나머지 갭은 Phase 5(반복)에서 처리 가능한 개선사항이다.
