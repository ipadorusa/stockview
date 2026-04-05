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

## Testing

No test framework is configured. Manual verification patterns:

- **API endpoints**: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/{endpoint}`
- **Build check**: `npm run build` — must pass before any PR
- **Lint check**: `npm run lint` — zero errors required
- **Prisma validation**: `npx prisma validate` — after schema changes
- **Data source smoke test**: Check API responses in browser devtools Network tab

## Git Workflow

- Branch naming: `feat/{feature}`, `fix/{issue}`, `chore/{task}`
- Commit message: imperative mood, Korean or English, max 72 chars
  - `feat: 종목 상세 페이지 차트 기간 선택 추가`
  - `fix: KR quotes 크론 Naver fallback 미작동`
- PR: one feature per PR, describe what and why
- Squash merge to main

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

- `naver.ts` (KR), `yahoo.ts` (US), `krx.ts` (legacy), `news-rss.ts` (RSS)
- Details: see Skills → naver-scraping, yahoo-finance, cron-workflows

## Data Flow

Cron jobs (GitHub Actions → `/api/cron/*`, `CRON_SECRET` protected) update data on schedule, not real-time. Details: see Skills → cron-workflows

## Code Style

- **Stock colors follow Korean convention**: red (`--color-stock-up: #e53e3e`) = up, blue (`--color-stock-down: #3182ce`) = down
- **Upsert patterns** for idempotent data ingestion (unique on `ticker`, `[stockId, date]`)
- **Zod validation** on all API inputs (auth, watchlist, settings)
- Protected routes (`/watchlist/*`, `/settings/*`, `/api/watchlist/*`) enforced via middleware (`src/proxy.ts`)
- Batch processing with size limits (100-500 items) and throttle delays to respect Vercel timeout limits

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

## Environment Variables

`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`, `APP_URL`, `OPENDART_API_KEY`
