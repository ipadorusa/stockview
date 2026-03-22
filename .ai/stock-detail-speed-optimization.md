# Stock Detail Page Speed Optimization Research

## Current Architecture Analysis

**page.tsx** (Server Component): Single Prisma query (stock + quote + fundamental) via `react.cache()`, ISR with `revalidate = 900`, `generateStaticParams` for top 200 stocks. Passes `initialData` as serialized prop to client.

**stock-detail-client.tsx** (Client Component): Monolithic ~400 line component. 6 `useQuery` calls fire on mount (stock, watchlist, news, indicators, peers, dividends, disclosures, earnings via tab components). 6 `dynamic()` imports with `{ ssr: false }`. Tab hover triggers `void import()` preload.

### Key Bottlenecks Identified
1. **Waterfall**: Server fetches stock only -> client hydrates -> fires 5+ parallel API calls -> each API call hits Prisma independently
2. **All-client architecture**: News, dividends, disclosures, earnings tabs are pure display but rendered client-side
3. **Technical indicators**: Heavy client-side computation on every mount (MACD, RSI, Bollinger, Stochastic, OBV, ATR, SAR, ADX, MFI, Heikin-Ashi, candle patterns)
4. **No React Query dehydration**: Server has the data but passes raw props instead of prefilling the query cache

---

## 1. React 19 Streaming + Suspense (Impact: HIGH)

Split the monolithic client component into independent async Server Components wrapped in Suspense boundaries.

```tsx
// app/stock/[ticker]/page.tsx
import { Suspense } from "react"

export default async function StockDetailPage({ params }) {
  const { ticker } = await params
  const stock = await getStock(ticker) // fast - cached

  return (
    <>
      <StockHeader stock={stock} />         {/* Immediate - from ISR cache */}
      <PriceDisplay stock={stock} />        {/* Immediate */}

      <Tabs defaultValue="chart">
        <TabsContent value="chart">
          {/* Chart MUST be client - canvas/lightweight-charts */}
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <StockChartWrapper ticker={ticker} />
          </Suspense>
        </TabsContent>

        <TabsContent value="news">
          <Suspense fallback={<NewsSkeleton />}>
            <NewsTab ticker={ticker} />  {/* async Server Component */}
          </Suspense>
        </TabsContent>

        <TabsContent value="dividend">
          <Suspense fallback={<DividendSkeleton />}>
            <DividendTab ticker={ticker} /> {/* async Server Component */}
          </Suspense>
        </TabsContent>
        {/* ... */}
      </Tabs>
    </>
  )
}

// Server Component - no JS shipped to client
async function NewsTab({ ticker }: { ticker: string }) {
  const news = await prisma.stockNews.findMany({
    where: { stock: { ticker } },
    orderBy: { publishedAt: "desc" },
    take: 20,
  })
  return <NewsList news={news} /> // thin client or pure server
}
```

**Why it matters**: Each `<Suspense>` boundary streams independently. The shell (header, price, tabs) renders instantly from the ISR cache. News, dividends, disclosures stream in as their DB queries complete. No client-side fetch waterfall.

**Caveat**: The `<Tabs>` component from shadcn/ui is client-side (uses state for active tab). You need either:
- (a) Use URL-based tabs (`/stock/AAPL?tab=news`) with server-side tab selection
- (b) Keep Tabs as client shell, but use React Server Components inside each TabsContent via composition

Option (b) pattern:
```tsx
// Client wrapper
"use client"
export function StockTabs({ chartSlot, newsSlot, dividendSlot, ... }) {
  return (
    <Tabs defaultValue="chart">
      <TabsContent value="chart">{chartSlot}</TabsContent>
      <TabsContent value="news">{newsSlot}</TabsContent>
      {/* ... */}
    </Tabs>
  )
}

// Server page passes RSC children as slots
<StockTabs
  chartSlot={<Suspense fallback={...}><ChartWrapper ticker={ticker} /></Suspense>}
  newsSlot={<Suspense fallback={...}><NewsTab ticker={ticker} /></Suspense>}
  dividendSlot={<Suspense fallback={...}><DividendTab ticker={ticker} /></Suspense>}
/>
```

---

## 2. Parallel Data Fetching in Server Component (Impact: HIGH)

Currently: Single `getStock()` query. All other data fetched client-side.

**Pattern**: Fetch all tab data in parallel on the server, eliminating client-side waterfall entirely.

```tsx
export default async function StockDetailPage({ params }) {
  const { ticker } = await params

  // All independent - React/Next.js runs these in parallel automatically
  // when they're in separate async Server Components under Suspense.
  // But if you want explicit parallel in one component:
  const [stock, news, dividends, earnings, disclosures] = await Promise.all([
    getStock(ticker),
    getNews(ticker),
    getDividends(ticker),
    getEarnings(ticker),
    getDisclosures(ticker),
  ])
  // ...
}
```

**Better pattern with streaming**: Don't `Promise.all` -- instead put each in its own async Server Component under Suspense. This way the fastest query renders first:

```tsx
// These all start fetching in parallel automatically in React 19
// because they're sibling async components
<Suspense><StockHeader ticker={ticker} /></Suspense>
<Suspense><NewsSection ticker={ticker} /></Suspense>
<Suspense><DividendSection ticker={ticker} /></Suspense>
```

React 19 automatically parallelizes sibling async Server Components under separate Suspense boundaries. No need for `Promise.all` -- it happens automatically.

---

## 3. Partial Prerendering / PPR (Impact: HIGH)

Next.js 16 supports PPR. For a stock detail page, this is ideal:

**Static shell** (generated at build / ISR): Layout, header skeleton, tab navigation, SEO metadata, ads
**Dynamic holes** (streamed at request time): Current price, news, technical indicators

```ts
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    ppr: true,  // Enable PPR
    // ...existing config
  },
}
```

```tsx
// app/stock/[ticker]/page.tsx
import { Suspense } from "react"
import { unstable_noStore } from "next/cache"

// The static parts render at build time
export default async function StockDetailPage({ params }) {
  const { ticker } = await params

  return (
    <>
      {/* STATIC: rendered at build, cached */}
      <Breadcrumb items={[...]} />
      <AdSlot slot="stock-detail-mid" />

      {/* DYNAMIC: streamed at request time */}
      <Suspense fallback={<PriceSkeleton />}>
        <StockPriceSection ticker={ticker} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <ChartSection ticker={ticker} />
      </Suspense>
    </>
  )
}

// This component opts into dynamic rendering
async function StockPriceSection({ ticker }) {
  unstable_noStore() // or use `connection()` in Next.js 16
  const stock = await getStock(ticker) // fresh data
  return <PriceDisplay stock={stock} />
}
```

**For your case**: Since stock data updates via cron (not real-time), the current `revalidate = 900` ISR approach already works well. PPR would allow the static shell (layout, tabs, ads, breadcrumbs) to be served from CDN cache while price data streams in. The improvement is marginal over ISR unless you reduce revalidate time significantly.

**Recommendation**: PPR is most valuable if you switch to `revalidate = 60` or on-demand revalidation after cron jobs complete (via `revalidatePath('/stock/[ticker]')`).

---

## 4. Server Components for Tabs (Impact: HIGH)

Tab-by-tab analysis:

| Tab | Current | Recommended | Reason |
|-----|---------|-------------|--------|
| **Chart** | Client (dynamic) | **Client** | Canvas-based lightweight-charts, must be client |
| **Info/Quote** | Client | **Server** | Pure data display, no interactivity beyond peer links |
| **News** | Client (useQuery) | **Server** | Pure list rendering, no client interaction |
| **Disclosure** | Client (useQuery) | **Server** | Table of links, zero interactivity |
| **Dividend** | Client (useQuery) | **Server** | Table display only |
| **Earnings** | Client (useQuery) | **Server** | Calendar display only |
| **Indicators** | Client (heavy computation) | **Server** | Move computation server-side |

**5 of 7 tab components can be pure Server Components**. This eliminates:
- 5 client-side `useQuery` fetch calls
- 5 dynamic imports (code-split chunks shipped to client)
- All associated JS bundle size for those tabs

**Technical indicator computation** is the biggest win. Currently ~20 technical indicators are calculated client-side from chart data on every page load. Move this to a server function or API endpoint with caching:

```tsx
// Server Component
async function IndicatorSection({ ticker }: { ticker: string }) {
  const chartData = await prisma.dailyPrice.findMany({
    where: { stock: { ticker }, date: { gte: threeMonthsAgo() } },
    orderBy: { date: "asc" },
    select: { open: true, high: true, low: true, close: true, volume: true },
  })

  // Compute on server - no JS shipped to client
  const indicators = computeAllIndicators(chartData)
  return <IndicatorDisplay data={indicators} />
}
```

---

## 5. Route-Level Code Splitting (Impact: MEDIUM)

Current approach (dynamic imports with `{ ssr: false }`) is already good. Additional improvements:

### a. `optimizePackageImports` for lightweight-charts
```ts
// next.config.ts
experimental: {
  optimizePackageImports: ["lucide-react", "sonner", "lightweight-charts"],
}
```
This enables tree-shaking for lightweight-charts so only used exports are bundled.

### b. React.lazy + Suspense (React 19 native)
Replace `next/dynamic` with React 19's native `React.lazy` for components that don't need SSR:
```tsx
import { lazy, Suspense } from "react"
const StockChart = lazy(() => import("@/components/stock/stock-chart"))

// In render:
<Suspense fallback={<Skeleton />}>
  <StockChart ticker={ticker} />
</Suspense>
```
In Next.js 16 + React 19, `React.lazy` works in both server and client contexts. For client-only components (canvas), `next/dynamic({ ssr: false })` is still needed, so this is a minor improvement.

### c. Prefetch on viewport intersection
Instead of hover-based preload, use Intersection Observer to prefetch tab components when tabs come into view:
```tsx
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      void import("@/components/stock/dividend-history")
      void import("@/components/stock/disclosure-list")
      // etc.
    }
  })
  if (tabsRef.current) observer.observe(tabsRef.current)
  return () => observer.disconnect()
}, [])
```

---

## 6. Edge Runtime / ISR (Impact: MEDIUM)

### Current ISR Setup (already good)
- `revalidate = 900` (15 min) -- appropriate for cron-updated data
- `generateStaticParams` for top 200 stocks -- pre-built at deploy
- `dynamicParams = true` -- remaining stocks built on-demand

### On-Demand Revalidation (recommended addition)
After cron jobs complete, call revalidation for updated stocks:
```ts
// In your cron API route, after updating quotes:
import { revalidatePath } from "next/cache"

// After batch quote update completes:
for (const ticker of updatedTickers) {
  revalidatePath(`/stock/${ticker}`)
}
```
This eliminates the up-to-15-minute staleness window.

### Edge Runtime
**Not recommended** for this page. Reasons:
- Prisma with `@prisma/adapter-pg` requires Node.js runtime (TCP connections)
- The page does Prisma queries -- these can't run on Edge
- Edge is better for pages that only call external APIs or use KV stores

### stale-while-revalidate on API routes (already partially done)
The chart API already has `s-maxage=86400, stale-while-revalidate=172800`. Apply similar headers to other API routes:
```ts
// api/stocks/[ticker]/news/route.ts, dividends, etc.
headers: {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
}
```

---

## 7. Database Query Optimization (Impact: MEDIUM)

### a. Use `select` instead of `include` for the server component query
Current query fetches ALL columns:
```ts
prisma.stock.findUnique({
  include: { quotes: { take: 1 }, fundamental: true }
})
```

Optimized:
```ts
prisma.stock.findUnique({
  where: { ticker },
  select: {
    id: true, ticker: true, name: true, nameEn: true,
    market: true, exchange: true, sector: true, stockType: true,
    quotes: {
      take: 1,
      orderBy: { updatedAt: "desc" },
      select: {
        price: true, previousClose: true, change: true, changePercent: true,
        open: true, high: true, low: true, volume: true, marketCap: true,
        high52w: true, low52w: true, per: true, pbr: true,
        preMarketPrice: true, postMarketPrice: true, updatedAt: true,
      },
    },
    fundamental: {
      select: {
        eps: true, forwardEps: true, dividendYield: true, roe: true,
        debtToEquity: true, beta: true, revenue: true, netIncome: true,
        description: true, employeeCount: true,
      },
    },
  },
})
```

### b. Prisma `$transaction` for parallel queries
When fetching multiple data in server component:
```ts
const [stock, news, dividends] = await prisma.$transaction([
  prisma.stock.findUnique({ where: { ticker }, select: {...} }),
  prisma.stockNews.findMany({ where: { stock: { ticker } }, take: 20 }),
  prisma.dividend.findMany({ where: { stock: { ticker } } }),
])
```
This uses a single database connection for all three queries, reducing connection overhead with Supabase pooler.

### c. Add composite indexes for common query patterns
```prisma
model DailyPrice {
  @@index([stockId, date])  // Already exists likely, verify
}

model StockNews {
  @@index([stockId, publishedAt(sort: Desc)])
}

model Dividend {
  @@index([stockId, exDate(sort: Desc)])
}
```

### d. Connection pooling
Current setup uses `@prisma/adapter-pg` with `DATABASE_URL` (Supabase pooler). This is already correct. Ensure:
- `DATABASE_URL` points to Supabase's connection pooler (port 6543, transaction mode)
- `DIRECT_URL` points to direct connection (port 5432, for migrations only)
- Pool size is appropriate for Vercel serverless (default is fine)

---

## 8. Image/Asset Optimization (Impact: LOW)

This page is data-heavy, not image-heavy. Relevant optimizations:

### a. Font optimization
Ensure fonts are loaded with `next/font` (check layout.tsx). This prevents FOIT/FOUT.

### b. lightweight-charts bundle
lightweight-charts v5 is ~160KB gzipped. Since it's dynamically imported with `{ ssr: false }`, it only loads when the chart tab is active. This is already optimal.

### c. Preconnect to external domains
If news cards or images load from external domains:
```tsx
// app/layout.tsx <head>
<link rel="preconnect" href="https://ssl.pstatic.net" />
```

### d. Avoid layout shift
Current Skeleton placeholders have fixed heights (`h-96`, `h-48`, `h-32`). This is good for CLS. Ensure chart container has explicit `aspect-ratio` or `min-height`.

---

## 9. React Query Prefetch with Dehydrate (Impact: HIGH)

Current pattern: Server fetches stock data, passes as `initialData` prop. This works but has limitations:
- Only covers the stock query, not news/dividends/etc.
- `initialData` doesn't populate the cache for background refetch

**Better pattern**: Server-side prefetch with `dehydrate`:

```tsx
// app/stock/[ticker]/page.tsx
import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query"

export default async function StockDetailPage({ params }) {
  const { ticker } = await params
  const queryClient = new QueryClient()

  // Prefetch all queries the client will need
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["stock", ticker],
      queryFn: () => fetchStockFromDB(ticker), // direct DB call, not API
    }),
    queryClient.prefetchQuery({
      queryKey: ["news", ticker],
      queryFn: () => fetchNewsFromDB(ticker),
    }),
    queryClient.prefetchQuery({
      queryKey: ["dividends", ticker],
      queryFn: () => fetchDividendsFromDB(ticker),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StockDetailClient ticker={ticker} />
    </HydrationBoundary>
  )
}
```

**Benefits**:
- All queries are pre-populated in the cache -- zero client-side fetch waterfall
- `staleTime` controls when background refetch happens
- Works with existing client component unchanged (just remove `initialData` prop)

**However**: If you adopt the Server Component approach from #1/#4, you won't need React Query for most tabs. Reserve dehydrate for the interactive parts (chart data, watchlist status).

---

## 10. useTransition for Tab Switching (Impact: MEDIUM)

React 19's `useTransition` makes tab switches non-blocking:

```tsx
"use client"
import { useTransition, useState } from "react"

export function StockTabs({ children }) {
  const [activeTab, setActiveTab] = useState("chart")
  const [isPending, startTransition] = useTransition()

  function handleTabChange(tab: string) {
    startTransition(() => {
      setActiveTab(tab)
    })
  }

  return (
    <div>
      <TabsList>
        <button
          onClick={() => handleTabChange("chart")}
          className={isPending ? "opacity-50" : ""}
        >
          Chart
        </button>
        {/* ... */}
      </TabsList>

      {/* Content renders without blocking the UI */}
      <div className={isPending ? "opacity-70 transition-opacity" : ""}>
        {activeTab === "chart" && <ChartTab />}
        {activeTab === "news" && <NewsTab />}
        {/* ... */}
      </div>
    </div>
  )
}
```

**Key benefit**: When switching to a data-heavy tab (e.g., chart with 20 indicator calculations), the previous tab remains visible and interactive while the new tab prepares. The UI never freezes.

**Combined with Suspense**: If tab content is an async Server Component, `useTransition` automatically shows the previous tab while the new one streams in.

---

## Priority Ranking (by impact and effort)

| # | Strategy | Impact | Effort | Description |
|---|----------|--------|--------|-------------|
| 1 | **Server Components for tabs** (#4) | HIGH | MEDIUM | Move 5 tabs from client to server. Eliminates most client JS and fetch waterfall |
| 2 | **Streaming with Suspense** (#1) | HIGH | MEDIUM | Wrap each tab in Suspense for progressive rendering |
| 3 | **Parallel server fetching** (#2) | HIGH | LOW | Already automatic with Suspense siblings |
| 4 | **React Query dehydrate** (#9) | HIGH | LOW | If keeping client tabs, prefetch on server |
| 5 | **Server-side indicators** (#4 sub) | HIGH | MEDIUM | Move heavy computation off client |
| 6 | **On-demand revalidation** (#6) | MEDIUM | LOW | Call revalidatePath after cron jobs |
| 7 | **Prisma select optimization** (#7) | MEDIUM | LOW | Reduce query payload size |
| 8 | **useTransition tab switching** (#10) | MEDIUM | LOW | Non-blocking UI transitions |
| 9 | **PPR** (#3) | MEDIUM | LOW | Static shell + dynamic holes (add config flag) |
| 10 | **API route caching** (#6 sub) | MEDIUM | LOW | Add Cache-Control headers |
| 11 | **Code splitting improvements** (#5) | LOW | LOW | optimizePackageImports, intersection observer |
| 12 | **Image/asset optimization** (#8) | LOW | LOW | Preconnect, CLS prevention |

## Recommended Implementation Order

**Phase 1** (Quick wins, 1-2 days):
- Add `select` to Prisma queries (#7a)
- Add on-demand revalidation after cron jobs (#6)
- Add Cache-Control to all API routes (#6)
- Add `optimizePackageImports: ["lightweight-charts"]` (#5a)

**Phase 2** (Architecture shift, 3-5 days):
- Convert News, Dividend, Disclosure, Earnings tabs to Server Components (#4)
- Wrap in Suspense boundaries (#1)
- Move technical indicator computation to server (#4)
- Implement slot-based tab pattern for mixing Server + Client components (#1)

**Phase 3** (Polish, 1-2 days):
- Add `useTransition` for tab switching (#10)
- Enable PPR in next.config.ts (#3)
- Add React Query dehydrate for remaining client queries (#9)
- Intersection Observer prefetch for tab components (#5c)
