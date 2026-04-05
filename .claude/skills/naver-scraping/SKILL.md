---
name: naver-scraping
description: Naver Finance scraping patterns — EUC-KR decoding, fchart OHLCV API, polling index API, NXT night trading filtering, 200ms rate limit. Auto-loads when working on src/lib/data-sources/naver.ts
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Naver Finance Scraping Guide

## Key File
- `src/lib/data-sources/naver.ts` — All Naver-related logic

## EUC-KR Decoding (Critical)

Naver Finance HTML is EUC-KR encoded. Must decode properly:

```typescript
import iconv from 'iconv-lite';

const response = await fetch(url);
const buffer = Buffer.from(await response.arrayBuffer());
const html = iconv.decode(buffer, 'euc-kr');
```

**NEVER use `response.text()`** — it assumes UTF-8 and corrupts Korean characters.

## fchart OHLCV API

URL: `https://fchart.stock.naver.com/sise.nhn?symbol={ticker}&timeframe=day&count={count}&requestType=0`

- `symbol`: 6-digit stock code (e.g., 005930 for Samsung)
- `timeframe`: day, week, month
- `count`: number of candles to fetch
- Response: XML with `<item data="date|open|high|low|close|volume">` format

## NXT Night Trading Filter

KR quote collection can mix in NXT (night session) prices:
- Filter by `marketType` or trading hours
- Regular session: 09:00 ~ 15:30 KST
- NXT prices should be excluded from daily quotes

## Rate Limiting

- **200ms delay** between page requests (mandatory)
- Use sequential processing with delay for batches:

```typescript
for (const item of items) {
  await delay(200);
  results.push(await fetchItem(item));
}
```

## KOSPI/KOSDAQ Index

Polling API: `https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:KOSPI,KOSDAQ`
- Response: JSON, `result.areas[].datas[]` structure
- Fallback: HTML scraping from `/sise/` pages when polling fails
