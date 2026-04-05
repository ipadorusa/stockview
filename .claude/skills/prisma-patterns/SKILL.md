---
name: prisma-patterns
description: Prisma 7 + Supabase PostgreSQL — DATABASE_URL (pooler) vs DIRECT_URL (direct), upsert patterns, batch processing, prisma migrate dev requires DIRECT_URL. Auto-loads when working on prisma/ directory
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Prisma + Supabase Patterns Guide

## Key Files
- `prisma/schema.prisma` — Database schema
- `src/lib/prisma.ts` — Prisma client instance

## Connection URL Distinction (Critical)

| Env Var | Purpose | Port |
|---------|---------|------|
| `DATABASE_URL` | Runtime queries (pooler) | 6543 |
| `DIRECT_URL` | Migrations, `prisma db push` | 5432 |

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Rule**: `npx prisma migrate dev` uses `DIRECT_URL` internally. The pooler (port 6543) does NOT support DDL operations.

## Upsert Patterns

Always use upsert for idempotent data ingestion:

```typescript
// Stock master — ticker is unique
await prisma.stock.upsert({
  where: { ticker },
  create: { ticker, name, market, ... },
  update: { name, market, ... },
});

// DailyPrice — [stockId, date] compound unique
await prisma.dailyPrice.upsert({
  where: { stockId_date: { stockId, date } },
  create: { stockId, date, open, high, low, close, volume },
  update: { open, high, low, close, volume },
});
```

## Batch Processing

```typescript
const results = await Promise.allSettled(
  items.map(item => prisma.stock.upsert({ ... }))
);
const succeeded = results.filter(r => r.status === 'fulfilled').length;
const failed = results.filter(r => r.status === 'rejected').length;
```

## Required Command Sequence

After schema changes, always follow this order:

1. `npx prisma validate` — Check schema is valid
2. `npx prisma migrate dev --name {name}` — Create and apply migration
3. `npx prisma generate` — Regenerate Prisma client
4. `npm run build` — Verify build succeeds

**Skipping step 3 causes build failures** — `prisma generate` is included in `npm run build` script, but during development you need to run it manually after schema changes.
