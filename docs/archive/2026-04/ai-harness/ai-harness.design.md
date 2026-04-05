# Design: AI Harness Engineering — StockView 에이전트 개발 환경 고도화

> Plan 참조: `docs/01-plan/features/ai-harness.plan.md`

---

## 1. 구현 순서

```
Day 1: [D1] AGENTS.md 6대 영역 강화
       [D2] 도메인 Skills 4개 생성 (D1과 병렬)
Day 2: [D3] Hooks 품질 게이트 3개
       [D4] MCP PostgreSQL 서버 연동
Day 3: [D5] AGENTS.md 토큰 다이어트 + AgentLinter 검증
```

---

## 2. 상세 설계

### D1. AGENTS.md 6대 영역 강화

#### 변경 파일: `AGENTS.md`

**현재 구조** (89줄):
```
# AGENTS.md
## Commands          ← 유지
## Tech Stack        ← 유지
## Project Structure ← 유지
## Data Sources      ← Skills로 분리 예정 (D5에서 축소)
## Data Flow         ← Skills로 분리 예정 (D5에서 축소)
## Key Conventions   ← Code Style로 리네임
## Don'ts            ← Boundaries로 리네임 + 강화
## Common Mistakes   ← Boundaries에 통합
## Environment Variables ← 유지
```

**추가할 3개 섹션**:

#### 섹션 1: Testing (Commands 바로 아래)
```markdown
## Testing

No test framework is configured yet. Manual verification patterns:

- **API endpoints**: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/{endpoint}`
- **Build check**: `npm run build` — must pass before any PR
- **Lint check**: `npm run lint` — zero errors required
- **Prisma validation**: `npx prisma validate` — after schema changes
- **Data source smoke test**: Check API responses in browser devtools Network tab
```

#### 섹션 2: Git Workflow (Testing 아래)
```markdown
## Git Workflow

- Branch naming: `feat/{feature}`, `fix/{issue}`, `chore/{task}`
- Commit message: imperative mood, Korean or English, max 72 chars
  - `feat: 종목 상세 페이지 차트 기간 선택 추가`
  - `fix: KR quotes 크론 Naver fallback 미작동`
- PR: one feature per PR, describe what and why
- Squash merge to main
```

#### 섹션 3: Boundaries (Don'ts + Common Mistakes 통합)
```markdown
## Boundaries

### Never Modify
- `prisma/migrations/` — Existing migrations are immutable. Create new ones only.
- `.github/workflows/` — Cron workflows require careful review. Always ask before modifying.
- `.env`, `.env.local` — Never read, write, or commit environment files.

### Modify With Caution
- `src/proxy.ts` — Authentication middleware. Changes affect all protected routes.
- `scripts/` — Seeding scripts run against production-like data. Test locally first.
- `prisma/schema.prisma` — Always run `npx prisma validate` after changes.

### Code Rules
- Don't query the database directly — always use Prisma
- Don't put secrets in `NEXT_PUBLIC_*` env vars
- Don't use class components — functional components with hooks only
- Don't create CSS files — use Tailwind utility classes exclusively
- Don't hardcode exchange rates — always fetch live USD/KRW from Yahoo
- Don't skip `npx prisma generate` before `npm run build`

### Common Pitfalls
- Naver scraping returns **EUC-KR** encoded HTML — always decode properly, not UTF-8
- KR quote collection can mix in **NXT (night trading) prices** — filter by market type
- Exchange rate fetch timing matters — USD/KRW market hours differ from stock market hours
- `DIRECT_URL` (not `DATABASE_URL`) must be used for migrations — pooler doesn't support DDL
```

**변경 요약**: Don'ts + Common Mistakes 삭제 → Testing, Git Workflow, Boundaries 3개 섹션으로 대체. 순 변경 약 +20줄.

---

### D2. 도메인 Skills 4개 생성

#### 파일 구조

```
.claude/skills/
├── naver-scraping/SKILL.md        (신규)
├── yahoo-finance/SKILL.md         (신규)
├── cron-workflows/SKILL.md        (신규)
└── prisma-patterns/SKILL.md       (신규)
```

> 기존 `.claude/skills/` 에는 symlink로 연결된 3개 스킬(vercel-react-best-practices, web-design-guidelines, google-search-console)과 find-skills가 있음. 신규 4개는 직접 디렉토리로 생성.

#### Skill 1: `.claude/skills/naver-scraping/SKILL.md`

```markdown
---
name: naver-scraping
description: Naver Finance 스크래핑 패턴 — EUC-KR 디코딩, fchart OHLCV API, polling 인덱스 API, NXT 야간거래 필터링, 200ms 레이트리밋. src/lib/data-sources/naver.ts 수정 시 자동 로드.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Naver Finance 스크래핑 가이드

## 핵심 파일
- `src/lib/data-sources/naver.ts` — 모든 Naver 관련 로직

## EUC-KR 디코딩 (필수)

Naver Finance HTML은 EUC-KR 인코딩. 반드시 디코딩 필요:

```typescript
import iconv from 'iconv-lite';

const response = await fetch(url);
const buffer = Buffer.from(await response.arrayBuffer());
const html = iconv.decode(buffer, 'euc-kr');
```

**절대 하지 말 것**: `response.text()` 사용 금지 — UTF-8로 깨짐

## fchart OHLCV API

URL 패턴: `https://fchart.stock.naver.com/sise.nhn?symbol={ticker}&timeframe=day&count={count}&requestType=0`

- `symbol`: 종목코드 (6자리, 예: 005930)
- `timeframe`: day, week, month
- `count`: 가져올 캔들 수
- 응답: XML 형식, `<item>` 태그에 `data="날짜|시가|고가|저가|종가|거래량"` 형태

## NXT 야간거래 필터링

KR 시세 수집 시 NXT(야간거래) 가격이 섞일 수 있음:
- `marketType` 또는 거래시간으로 필터링 필수
- 정규 거래시간: 09:00 ~ 15:30 KST

## 레이트 리밋

- 페이지 요청 간 **200ms** 딜레이 필수
- `Promise.allSettled()` + 순차 처리로 배치

```typescript
for (const item of items) {
  await delay(200);
  results.push(await fetchItem(item));
}
```

## KOSPI/KOSDAQ 인덱스

폴링 API: `https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:KOSPI,KOSDAQ`
- 응답: JSON, `result.areas[].datas[]` 구조
- Fallback: HTML 스크래핑 방식 (`/sise/` 페이지)
```

#### Skill 2: `.claude/skills/yahoo-finance/SKILL.md`

```markdown
---
name: yahoo-finance
description: Yahoo Finance v8 chart API — 크럼 불필요, 5 concurrent 레이트리밋, USD/KRW 환율 시장시간 주의, withRetry 패턴. src/lib/data-sources/yahoo.ts 수정 시 자동 로드.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Yahoo Finance API 가이드

## 핵심 파일
- `src/lib/data-sources/yahoo.ts` — 모든 Yahoo 관련 로직

## v8 Chart API

URL: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`

파라미터:
- `interval`: 1d, 1wk, 1mo
- `range`: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max
- `period1`, `period2`: Unix timestamp (range 대신 사용 가능)

**크럼 불필요** — v8 API는 인증 없이 접근 가능

## 레이트 리밋

- 동시 요청 **최대 5개** (`Promise.all` with concurrency limit)
- 초과 시 429 에러 발생

```typescript
// pLimit 또는 수동 구현
const limit = pLimit(5);
const results = await Promise.allSettled(
  tickers.map(t => limit(() => fetchYahooQuote(t)))
);
```

## USD/KRW 환율

- 심볼: `KRW=X`
- **주의**: USD/KRW 외환시장 시간 ≠ 주식시장 시간
  - 주말/공휴일에는 마지막 거래일 종가 반환
  - 한국 시간 기준 새벽에 환율 업데이트 지연 가능
- 하드코딩 절대 금지 — 항상 API 호출

## withRetry 패턴

모든 외부 호출에 적용:

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === maxRetries - 1) throw e;
      await delay(Math.pow(2, i) * 1000); // exponential backoff
    }
  }
  throw new Error('unreachable');
}
```
```

#### Skill 3: `.claude/skills/cron-workflows/SKILL.md`

```markdown
---
name: cron-workflows
description: GitHub Actions 크론 → /api/cron/* 엔드포인트 — CRON_SECRET 인증, 17개 워크플로우 매핑, 배치 사이즈 제한, Vercel Function 타임아웃. .github/workflows/ 또는 src/app/api/cron/ 작업 시 자동 로드.
allowed-tools: Read, Grep, Glob, Bash
---

# 크론 워크플로우 가이드

## 아키텍처

```
GitHub Actions (cron schedule)
  → HTTP GET /api/cron/{endpoint}
    → Header: Authorization: Bearer $CRON_SECRET
      → Vercel Function 실행
        → Prisma DB 작업
```

## CRON_SECRET 인증

모든 크론 API는 bearer token 검증 필수:

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## 워크플로우 매핑

| 워크플로우 | 스케줄 | 엔드포인트 | 설명 |
|------------|--------|-----------|------|
| collect-kr-quotes | 평일 | /api/cron/kr-quotes | KR 시세 수집 (Naver) |
| collect-us-quotes | 평일 | /api/cron/us-quotes | US 시세 수집 (Yahoo) |
| sync-kr-master | 주간 | /api/cron/kr-master | KR 종목 마스터 동기화 |
| sync-us-master | 주간 | /api/cron/us-master | US 종목 마스터 동기화 |
| collect-news | 매일 | /api/cron/news | 뉴스 RSS 수집 |
| cleanup-old-data | 매일 | /api/cron/cleanup | 21일 초과 데이터 삭제 |

(전체 17개 — `ls .github/workflows/` 로 확인)

## 배치 처리 규칙

- 배치 사이즈: **100~500** (종목 수에 따라)
- 배치 간 딜레이: 200ms (Naver), 없음 (Yahoo, concurrency 5)
- `Promise.allSettled()` 사용 — 단일 실패가 전체 배치를 중단시키지 않음

## Vercel Function 타임아웃

- 기본: 60초 (Pro plan)
- 대응: `maxDuration` 설정, 배치 분할, 조기 종료 패턴
- 4,300+ KR 종목 전체 처리 시 여러 배치로 나누어 실행
```

#### Skill 4: `.claude/skills/prisma-patterns/SKILL.md`

```markdown
---
name: prisma-patterns
description: Prisma 7 + Supabase PostgreSQL — DATABASE_URL(풀러) vs DIRECT_URL(다이렉트), upsert 패턴, 배치 처리, prisma migrate dev 시 DIRECT_URL 필수. prisma/ 디렉토리 작업 시 자동 로드.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Prisma + Supabase 패턴 가이드

## 핵심 파일
- `prisma/schema.prisma` — 데이터베이스 스키마
- `src/lib/prisma.ts` — Prisma 클라이언트 인스턴스

## 연결 URL 구분 (필수)

| 환경변수 | 용도 | 프로토콜 |
|---------|------|---------|
| `DATABASE_URL` | 런타임 쿼리 (풀러) | `postgresql://...pooler.supabase.com:6543` |
| `DIRECT_URL` | 마이그레이션, `prisma db push` | `postgresql://...supabase.com:5432` |

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**절대 규칙**: `npx prisma migrate dev` 는 반드시 `DIRECT_URL`을 통해 실행됨. 풀러(6543 포트)는 DDL을 지원하지 않음.

## Upsert 패턴

멱등성 보장을 위해 항상 upsert 사용:

```typescript
// Stock 마스터 — ticker가 unique
await prisma.stock.upsert({
  where: { ticker },
  create: { ticker, name, market, ... },
  update: { name, market, ... },
});

// DailyPrice — [stockId, date] 복합 unique
await prisma.dailyPrice.upsert({
  where: { stockId_date: { stockId, date } },
  create: { stockId, date, open, high, low, close, volume },
  update: { open, high, low, close, volume },
});
```

## 배치 처리

```typescript
const results = await Promise.allSettled(
  items.map(item => prisma.stock.upsert({ ... }))
);

const succeeded = results.filter(r => r.status === 'fulfilled').length;
const failed = results.filter(r => r.status === 'rejected').length;
console.log(`Batch: ${succeeded} ok, ${failed} failed`);
```

## 필수 명령어 순서

1. 스키마 변경 후: `npx prisma validate`
2. 마이그레이션: `npx prisma migrate dev --name {name}`
3. 클라이언트 생성: `npx prisma generate`
4. 빌드: `npm run build`

**3번을 건너뛰면 빌드 실패** — `prisma generate`는 `npm run build`에 포함되어 있지만, 개발 중에는 수동 실행 필요.
```

---

### D3. Hooks 품질 게이트 3개

#### 파일 구조

```
.claude/
├── hooks/
│   └── block-protected-files.mjs   (신규)
└── settings.local.json             (수정)
```

#### Hook 스크립트: `.claude/hooks/block-protected-files.mjs`

```javascript
#!/usr/bin/env node

// PreToolUse hook — 보호 대상 파일 수정 차단
// Exit 0: 허용, Exit 2: 차단 (사유 메시지 출력)

import { readFileSync } from 'fs';

const PROTECTED_PATTERNS = [
  /^\.env/,                      // .env, .env.local, .env.production
  /^prisma\/migrations\//,       // 기존 마이그레이션 파일
  /^\.github\/workflows\//,      // 크론 워크플로우
];

const CAUTION_PATTERNS = [
  /^src\/proxy\.ts$/,            // 인증 미들웨어
  /^scripts\//,                  // 시딩 스크립트
];

try {
  const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path || '';

  // 절대경로에서 프로젝트 루트 기준 상대경로 추출
  const cwd = process.cwd();
  const relativePath = filePath.startsWith(cwd)
    ? filePath.slice(cwd.length + 1)
    : filePath;

  // 보호 대상 파일 차단
  for (const pattern of PROTECTED_PATTERNS) {
    if (pattern.test(relativePath)) {
      console.error(
        `BLOCKED: "${relativePath}" is a protected file.\n` +
        `Reason: This file should not be modified by agents.\n` +
        `Action: Ask the user for explicit permission first.`
      );
      process.exit(2);
    }
  }

  // 주의 대상 파일 경고 (차단하지 않음)
  for (const pattern of CAUTION_PATTERNS) {
    if (pattern.test(relativePath)) {
      console.error(
        `WARNING: "${relativePath}" requires careful modification.\n` +
        `Proceed with caution and verify changes thoroughly.`
      );
    }
  }

  process.exit(0);
} catch (e) {
  // 파싱 실패 시 허용 (안전 실패)
  process.exit(0);
}
```

#### 설정 파일: `.claude/settings.local.json` 수정

현재 `permissions.allow` 배열에 hooks 설정 추가:

```json
{
  "permissions": {
    "allow": [
      "mcp__plugin_context-mode_context-mode__ctx_batch_execute",
      "mcp__plugin_context-mode_context-mode__ctx_search",
      "mcp__plugin_context-mode_context-mode__ctx_execute",
      "mcp__plugin_context-mode_context-mode__ctx_execute_file",
      "Bash(gh workflow:*)",
      "Bash(brew uninstall:*)",
      "Bash(bun install:*)",
      "mcp__plugin_context-mode_context-mode__ctx_fetch_and_index",
      "Skill(telegram:configure)",
      "Bash(gh secret:*)",
      "Bash(claude:*)",
      "Bash(gh run:*)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/block-protected-files.mjs"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "if echo '${tool_input.file_path}' | grep -q 'src/lib/data-sources/'; then npx eslint --no-warn-ignored '${tool_input.file_path}' 2>&1 || true; fi"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "if echo '${tool_input.file_path}' | grep -q 'prisma/schema.prisma'; then npx prisma validate 2>&1; fi"
          }
        ]
      }
    ]
  }
}
```

**설계 결정**:
- PostToolUse의 ESLint hook은 `|| true`로 실패해도 차단하지 않음 (경고만)
- Prisma validate는 실패 시 에이전트에게 수정 기회 제공
- PreToolUse의 보호 파일 차단은 exit code 2로 즉시 차단

---

### D4. MCP PostgreSQL 서버 연동

#### 신규 파일: `.mcp.json` (프로젝트 루트)

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

**보안 설계**:
- `${DATABASE_URL}` 환경변수 참조 → 시크릿이 파일에 노출되지 않음
- `.mcp.json`은 git 추적 가능 (팀 공유)
- MCP 서버는 기본적으로 SELECT 쿼리만 실행 가능 (서버 구현에 따라)
- 프로덕션 DB 연결은 `DATABASE_URL` 환경변수 관리로 제어

**CLAUDE.md 업데이트**: MCP 서버 사용 가능 안내 추가
```markdown
## Claude Code Specific
- MCP servers: PostgreSQL (read-only, via DATABASE_URL) — use for data debugging
```

---

### D5. AGENTS.md 토큰 다이어트 + AgentLinter 검증

#### D1 완료 후 AGENTS.md에서 축소할 섹션

**Data Sources** — 현재 7줄 → 2줄로 축소:
```markdown
## Data Sources

- `src/lib/data-sources/` — Naver (KR), Yahoo (US), KRX (legacy), News RSS
- Details: See Skills → naver-scraping, yahoo-finance, cron-workflows
```

**Data Flow** — 현재 5줄 → 2줄로 축소:
```markdown
## Data Flow

Cron jobs (GitHub Actions → `/api/cron/*`, `CRON_SECRET` protected) update data on schedule. Not real-time.
See Skills → cron-workflows for details.
```

#### 예상 토큰 절감

| 섹션 | Before (줄) | After (줄) | 절감 |
|------|------------|-----------|------|
| Data Sources | 7 | 2 | -5 |
| Data Flow | 5 | 2 | -3 |
| Don'ts | 6 | 0 (Boundaries에 통합) | -6 |
| Common Mistakes | 4 | 0 (Boundaries에 통합) | -4 |
| Testing (신규) | 0 | 7 | +7 |
| Git Workflow (신규) | 0 | 6 | +6 |
| Boundaries (신규) | 0 | 20 | +20 |
| **순 변경** | | | **+15줄** |

> 줄 수는 미세하게 증가하지만, 상세 도메인 지식(코드 예시, API 패턴)이 Skills로 이동하여 **세션당 로드 토큰은 감소**. AGENTS.md는 참조 포인터만 남기고, 실제 상세 지식은 관련 파일 작업 시에만 로드.

#### AgentLinter 검증

```bash
npx agentlinter AGENTS.md
```

5개 차원 목표:
| 차원 | 목표 | 비고 |
|------|------|------|
| Structure | 70+ | 6대 영역 충족 |
| Clarity | 70+ | 구체적 명령어, 코드 예시 |
| Completeness | 70+ | Testing, Git Workflow 추가 |
| Security | 80+ | Boundaries 강화, `.env` 보호 |
| Consistency | 70+ | Skills 참조 일관성 |

---

## 3. 파일 변경 목록

| 파일 | 작업 | 우선순위 |
|------|------|---------|
| `AGENTS.md` | 수정 (6대 영역 + 토큰 다이어트) | P0 |
| `CLAUDE.md` | 수정 (MCP 안내 추가) | P1 |
| `.claude/skills/naver-scraping/SKILL.md` | 신규 | P0 |
| `.claude/skills/yahoo-finance/SKILL.md` | 신규 | P0 |
| `.claude/skills/cron-workflows/SKILL.md` | 신규 | P0 |
| `.claude/skills/prisma-patterns/SKILL.md` | 신규 | P0 |
| `.claude/hooks/block-protected-files.mjs` | 신규 | P1 |
| `.claude/settings.local.json` | 수정 (hooks 추가) | P1 |
| `.mcp.json` | 신규 | P1 |

**총 변경**: 신규 6개 + 수정 3개 = 9개 파일

---

## 4. 검증 계획

| 단계 | 검증 항목 | 방법 |
|------|----------|------|
| D1 완료 | AGENTS.md 6대 영역 존재 | 수동 확인 |
| D2 완료 | Skills 4개 로드 테스트 | 새 세션에서 `naver.ts` 수정 시도 → naver-scraping 스킬 로드 확인 |
| D3 완료 | Hook 차단 테스트 | `.env` 파일 Write 시도 → exit code 2 확인 |
| D3 완료 | Hook lint 테스트 | `src/lib/data-sources/naver.ts` 수정 → ESLint 자동 실행 확인 |
| D4 완료 | MCP PostgreSQL 연결 | 새 세션에서 `SELECT count(*) FROM "Stock"` 쿼리 실행 |
| D5 완료 | AgentLinter 점수 | `npx agentlinter` → 5개 차원 70+ 확인 |
