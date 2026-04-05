---
name: cron-workflows
description: GitHub Actions cron → /api/cron/* endpoints — CRON_SECRET auth, 17 workflow mappings, batch size limits, Vercel Function timeout handling. Auto-loads when working on .github/workflows/ or src/app/api/cron/
allowed-tools: Read, Grep, Glob, Bash
---

# Cron Workflow Guide

## Architecture

```
GitHub Actions (cron schedule)
  → HTTP GET /api/cron/{endpoint}
    → Header: Authorization: Bearer $CRON_SECRET
      → Vercel Function execution
        → Prisma DB operations
```

## CRON_SECRET Authentication

All cron API endpoints must verify the bearer token:

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Key Workflow Mappings

| Workflow | Schedule | Endpoint | Description |
|----------|----------|----------|-------------|
| collect-kr-quotes | Weekdays | /api/cron/kr-quotes | KR quotes via Naver |
| collect-us-quotes | Weekdays | /api/cron/us-quotes | US quotes via Yahoo |
| sync-kr-master | Weekly | /api/cron/kr-master | KR stock master sync |
| sync-us-master | Weekly | /api/cron/us-master | US stock master sync |
| collect-news | Daily | /api/cron/news | News RSS collection |
| cleanup-old-data | Daily | /api/cron/cleanup | Delete >21 day old data |

Run `ls .github/workflows/` to see all 17 workflow files.

## Batch Processing Rules

- Batch size: **100~500** items (varies by endpoint)
- Inter-batch delay: 200ms (Naver), none (Yahoo with concurrency 5)
- Always use `Promise.allSettled()` — single failures must not break the batch

## Vercel Function Timeout

- Default: 60s (Pro plan)
- Mitigation strategies:
  - Set `maxDuration` in route config
  - Split large batches into smaller chunks
  - Early termination pattern for 4,300+ KR stocks
