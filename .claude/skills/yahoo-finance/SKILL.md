---
name: yahoo-finance
description: Yahoo Finance v8 chart API — no crumb needed, 5 concurrent request limit, USD/KRW exchange rate timing caveat, withRetry pattern. Auto-loads when working on src/lib/data-sources/yahoo.ts
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Yahoo Finance API Guide

## Key File
- `src/lib/data-sources/yahoo.ts` — All Yahoo-related logic

## v8 Chart API

URL: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`

Parameters:
- `interval`: 1d, 1wk, 1mo
- `range`: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max
- `period1`, `period2`: Unix timestamp (alternative to range)

**No crumb required** — v8 API is accessible without authentication.

## Rate Limiting

- Max **5 concurrent requests** (use concurrency limiter)
- Exceeding returns 429 Too Many Requests

```typescript
const limit = pLimit(5);
const results = await Promise.allSettled(
  tickers.map(t => limit(() => fetchYahooQuote(t)))
);
```

## USD/KRW Exchange Rate

- Symbol: `KRW=X`
- **Caution**: Forex market hours differ from stock market hours
  - Weekends/holidays return last trading day's close
  - Early morning KST may show delayed rates
- **NEVER hardcode** exchange rates — always fetch from API

## withRetry Pattern

All external calls must use retry with exponential backoff:

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === maxRetries - 1) throw e;
      await delay(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('unreachable');
}
```

## Batch Processing

Use `Promise.allSettled()` to prevent single-item failures from breaking the batch:

```typescript
const results = await Promise.allSettled(
  tickers.map(t => limit(() => withRetry(() => fetchQuote(t))))
);
const succeeded = results.filter(r => r.status === 'fulfilled').length;
```
