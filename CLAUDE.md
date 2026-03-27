# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StockView is a dual-market (Korea + US) stock information platform built with Next.js App Router. It provides real-time quotes, historical charts, watchlists, and news aggregation. Data is fetched via cron jobs from Naver Finance (KR) and Yahoo Finance (US), stored in PostgreSQL (Supabase) via Prisma.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # prisma generate && next build
npm run lint         # ESLint

# Database
npx prisma generate  # Generate Prisma client
npx prisma migrate dev  # Run migrations (uses DIRECT_URL)
npx prisma db seed   # Seed with sample data (20 KR + 20 US stocks)

# Full data seeding (production-like)
npm run seed:kr-master    # ~4,300 KR stocks from Naver (~60s)
npm run seed:us-master    # ~500 US stocks from S&P 500 CSV
npm run seed:daily-prices # OHLCV for all stocks (--kr or --us flag)
npm run seed:all          # All of the above sequentially
```

No test framework is configured.

## Architecture

### Tech Stack
- **Next.js 16** (App Router) + React 19 + TypeScript
- **Prisma 7** with PostgreSQL (Supabase, pooler via `DATABASE_URL`, direct via `DIRECT_URL`)
- **NextAuth 5 beta** — Credentials provider, JWT sessions (30-day expiry), bcryptjs (salt: 12)
- **TanStack React Query** for client-side data fetching
- **Tailwind CSS 4** + shadcn/ui (base-nova style) + lightweight-charts for stock charts
- Path alias: `@/*` → `./src/*`

### Data Sources (`src/lib/data-sources/`)
- **Naver Finance** (`naver.ts`) — KR stocks: HTML scraping (EUC-KR encoded) for master data, fchart API for OHLCV, polling API for indices (KOSPI/KOSDAQ)
- **Yahoo Finance** (`yahoo.ts`) — US stocks: v8 chart API (no crumb needed) for quotes + OHLCV, also used for USD/KRW exchange rate
- **KRX** (`krx.ts`) — Legacy, only used for `getLastTradingDate()` calculation
- **News RSS** (`news-rss.ts`) — Google News RSS + Yahoo Finance RSS, auto-categorized by keywords, matched to stocks by title

All external calls use `withRetry()` (exponential backoff, 3 attempts). Batch operations use `Promise.allSettled()` to avoid single-item failures breaking the whole batch. Rate limiting: 200ms between page requests for Naver, 5 concurrent requests for Yahoo.

### Data Flow
Data is updated via **cron jobs** (GitHub Actions → `/api/cron/*` endpoints, protected by `CRON_SECRET` bearer token), not real-time:
- Master sync: weekly (Naver for KR, S&P 500 CSV for US)
- Quote updates: weekdays (Naver for KR, Yahoo for US)
- News: daily (RSS feeds)
- Cleanup: daily (delete data >21 days, deactivate stale stocks >90 days)

### Key Conventions
- **Stock colors follow Korean convention**: red (`--color-stock-up: #e53e3e`) = up, blue (`--color-stock-down: #3182ce`) = down
- **Upsert patterns** for idempotent data ingestion (unique on `ticker`, `[stockId, date]`)
- **Zod validation** on all API inputs (auth, watchlist, settings)
- Protected routes (`/watchlist/*`, `/settings/*`, `/api/watchlist/*`) enforced via middleware (`src/proxy.ts`)
- Batch processing with size limits (100-500 items) and throttle delays to respect Vercel timeout limits

### Environment Variables
`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`, `APP_URL`, `OPENDART_API_KEY`

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
