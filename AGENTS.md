# AGENTS.md

StockView — dual-market (Korea + US) stock information platform.

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

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Prisma 7** with PostgreSQL (Supabase, pooler via `DATABASE_URL`, direct via `DIRECT_URL`)
- **NextAuth 5 beta** — Credentials provider, JWT sessions (30-day expiry), bcryptjs (salt: 12)
- **TanStack React Query** for client-side data fetching
- **Tailwind CSS 4** + shadcn/ui (base-nova style) + lightweight-charts for stock charts
- Path alias: `@/*` → `./src/*`

## Project Structure

- `src/app/` — Routes (pages + API endpoints)
- `src/lib/` — Business logic, data sources, queries, utilities
- `src/components/` — UI components
- `src/hooks/`, `src/contexts/`, `src/types/` — React hooks, context providers, TypeScript types
- `scripts/` — Seeding scripts
- `prisma/` — Schema + migrations
- `.github/workflows/` — 17 cron workflow files

## Data Sources (`src/lib/data-sources/`)

- **Naver Finance** (`naver.ts`) — KR stocks: HTML scraping (EUC-KR encoded) for master data, fchart API for OHLCV, polling API for indices (KOSPI/KOSDAQ)
- **Yahoo Finance** (`yahoo.ts`) — US stocks: v8 chart API (no crumb needed) for quotes + OHLCV, also used for USD/KRW exchange rate
- **KRX** (`krx.ts`) — Legacy, only used for `getLastTradingDate()` calculation
- **News RSS** (`news-rss.ts`) — Google News RSS + Yahoo Finance RSS, auto-categorized by keywords, matched to stocks by title

All external calls use `withRetry()` (exponential backoff, 3 attempts). Batch operations use `Promise.allSettled()` to avoid single-item failures breaking the whole batch. Rate limiting: 200ms between page requests for Naver, 5 concurrent requests for Yahoo.

## Data Flow

Data is updated via **cron jobs** (GitHub Actions → `/api/cron/*` endpoints, protected by `CRON_SECRET` bearer token), not real-time:
- Master sync: weekly (Naver for KR, S&P 500 CSV for US)
- Quote updates: weekdays (Naver for KR, Yahoo for US)
- News: daily (RSS feeds)
- Cleanup: daily (delete data >21 days, deactivate stale stocks >90 days)

## Key Conventions

- **Stock colors follow Korean convention**: red (`--color-stock-up: #e53e3e`) = up, blue (`--color-stock-down: #3182ce`) = down
- **Upsert patterns** for idempotent data ingestion (unique on `ticker`, `[stockId, date]`)
- **Zod validation** on all API inputs (auth, watchlist, settings)
- Protected routes (`/watchlist/*`, `/settings/*`, `/api/watchlist/*`) enforced via middleware (`src/proxy.ts`)
- Batch processing with size limits (100-500 items) and throttle delays to respect Vercel timeout limits

## Don'ts

- Don't query the database directly — always use Prisma
- Don't put secrets in `NEXT_PUBLIC_*` env vars or commit `.env` files
- Don't use class components — functional components with hooks only
- Don't create CSS files — use Tailwind utility classes exclusively
- Don't hardcode exchange rates — always fetch live USD/KRW from Yahoo
- Don't skip `npx prisma generate` before `npm run build`

## Common Mistakes

- Naver scraping returns **EUC-KR** encoded HTML — always decode properly, not UTF-8
- KR quote collection can mix in **NXT (night trading) prices** — filter by market type
- Exchange rate fetch timing matters — USD/KRW market hours differ from stock market hours
- `DIRECT_URL` (not `DATABASE_URL`) must be used for migrations — pooler doesn't support DDL

## Environment Variables

`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`, `APP_URL`, `OPENDART_API_KEY`
