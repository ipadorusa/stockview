# Research: News Collection & Technical Indicators

## Topic 1: Stock News Collection Methods

### Current State in StockView
- **RSS feeds**: Google News RSS (KR/US), Yahoo Finance RSS, Hankyung RSS, MK Economy RSS
- **Naver Finance**: scrapes main news page titles only (no body/summary)
- **DB stores**: title, summary (from RSS description), source, url, imageUrl, sentiment — but no full article content

### Korean Stock News Sources

#### 1. Naver Finance Per-Stock News
- **URL pattern**: `https://finance.naver.com/item/news_news.naver?code={ticker}&page={n}`
- HTML scraping (EUC-KR), each article links to `news_read.naver?article_id=...`
- **Article body**: accessible via `https://finance.naver.com/news/news_read.naver?article_id={id}&office_id={oid}`
- Body text is in `<div id="news_read">` or `<div class="scr01">`
- **Rate limit**: should throttle 200-500ms between requests
- **Legal**: Naver's robots.txt generally allows news page access; redistributing full text is risky
- **Recommendation**: Scrape first 200 chars as summary, link to original

#### 2. Hankyung (한국경제)
- RSS: `https://www.hankyung.com/feed/stock` — already implemented
- RSS `<description>` contains 1-2 sentence summary
- Full article scraping possible but behind consent walls occasionally
- **Better approach**: Use RSS description as-is (already provides summary)

#### 3. MK Economy (매일경제)
- RSS: `https://www.mk.co.kr/rss/30000001/` — already implemented
- Additional feeds: `/rss/30100041/` (stock market), `/rss/30200030/` (economy)
- Description field provides article lead paragraph

#### 4. Additional KR RSS Sources
- **연합뉴스 경제**: `https://www.yna.co.kr/rss/economy.xml` — free, reliable
- **서울경제**: `https://www.sedaily.com/RSS/Economy` — financial focus
- **이데일리**: `https://rss.edaily.co.kr/edaily_economy.xml`
- **뉴스1 경제**: `https://www.news1.kr/rss/economy`

#### 5. Naver News Search API (공식)
- Naver Open API: `https://openapi.naver.com/v1/search/news.json?query={keyword}`
- Requires API key registration (free tier: 25,000/day)
- Returns title, description (summary), link, pubDate
- **Best option for per-stock news with summaries**

### US Stock News Sources

#### 1. Yahoo Finance Per-Ticker News
- **URL**: `https://finance.yahoo.com/quote/{TICKER}/news/`
- Web scraping is fragile (React SPA, frequent DOM changes)
- **Alternative**: Yahoo Finance RSS per ticker was deprecated
- `https://feeds.finance.yahoo.com/rss/2.0/headline?s={TICKER}` — may still work intermittently
- **Recommendation**: Try RSS first, fall back to Google News RSS with ticker

#### 2. Google News RSS with Ticker
- `https://news.google.com/rss/search?q={TICKER}+stock&hl=en&gl=US`
- Free, no auth, reliable
- Provides title + short description
- **Rate limit**: Google may block after ~100 requests/minute
- **Best free option for per-stock US news**

#### 3. Finviz News
- `https://finviz.com/quote.ashx?t={TICKER}` — news table in HTML
- Scraping is against ToS but widely done
- Returns headline + source + time, no summary
- **Not recommended** due to ToS issues

#### 4. Free APIs with Article Content
- **NewsAPI.org**: 100 req/day free, returns title + description + content (200 chars)
  - `https://newsapi.org/v2/everything?q={ticker}&apiKey={key}`
  - No per-stock endpoint, but keyword search works well
- **Alpha Vantage News Sentiment**: Free tier 25 req/day
  - `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={TICKER}`
  - Returns title, summary, sentiment score, relevance per ticker
  - **Excellent for sentiment analysis** but very limited free tier
- **Marketaux**: 100 req/day free, ticker-specific news with summaries
  - `https://api.marketaux.com/v1/news/all?symbols={TICKER}&api_token={key}`
- **Polygon.io**: Free tier includes ticker news with article preview

#### 5. Extracting Article Content
- For any news URL, tools like `mozilla/readability` (JS library) can extract article body
- npm package: `@mozilla/readability` + `jsdom`
- Extract first 300 chars as summary from any article URL
- **Legal consideration**: Fair use for short excerpts/summaries, not full reproduction

### Key Considerations
- **Legal**: Scraping article bodies and storing full text has copyright risks. Store only summaries (first 200-300 chars) or use official APIs
- **Rate limits**: Google News RSS ~100/min, Naver ~5/sec, Yahoo ~2000/hour
- **Freshness**: RSS feeds update every 15-60 min; per-stock scraping should run hourly max
- **Recommendation**: For StockView, the best approach is:
  1. Keep existing RSS feeds for general market news
  2. Add Naver Open API for Korean per-stock news (free, 25K/day)
  3. Use Google News RSS with ticker for US per-stock news
  4. Use `@mozilla/readability` to extract summaries from article URLs on-demand

---

## Topic 2: Technical Indicators for Stock Charts

### Current Implementation in StockView
Already implemented: SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic, OBV, ATR, Fibonacci Retracement, Candlestick Patterns (Doji, Hammer, Hanging Man, Engulfing, Shooting Star), MA signal interpretation, RSI interpretation.

### NOT Yet Implemented — Worth Adding

#### Trend Indicators

| Indicator | What it Measures | Beginner Value | Data Needed | Complexity |
|-----------|-----------------|----------------|-------------|------------|
| **WMA (Weighted MA)** | Trend with recent-price emphasis | Medium — similar to EMA but linear weighting | Same as SMA | Low |
| **Parabolic SAR** | Trend direction + reversal points | High — clear visual dots above/below price | 1 param (AF), ~50 bars | Medium |
| **ADX (Average Directional Index)** | Trend strength (not direction) | High — answers "is it trending?" | 14+ bars of H/L/C | Medium-High |
| **Ichimoku Cloud** | All-in-one: trend, support, resistance, momentum | Medium — comprehensive but complex for beginners | 52 bars | High |

#### Momentum Indicators

| Indicator | What it Measures | Beginner Value | Data Needed | Complexity |
|-----------|-----------------|----------------|-------------|------------|
| **CCI (Commodity Channel Index)** | Price deviation from mean | Medium — identifies overbought/oversold | 20 bars typical | Low |
| **Williams %R** | Overbought/oversold (like inverse Stochastic) | Medium — redundant with Stochastic | 14 bars | Low |
| **ROC (Rate of Change)** | Price momentum as percentage | High — intuitive "how fast is price moving" | 12 bars typical | Very Low |
| **MFI (Money Flow Index)** | Volume-weighted RSI | High — adds volume context to RSI | 14 bars of OHLCV | Medium |

#### Volume Indicators

| Indicator | What it Measures | Beginner Value | Data Needed | Complexity |
|-----------|-----------------|----------------|-------------|------------|
| **VWAP** | Volume-weighted average price | Very High — institutional benchmark | Intraday data (H/L/C/V per bar) | Low |
| **A/D Line (Accumulation/Distribution)** | Buying vs selling pressure | High — confirms trend with volume | Close/High/Low/Volume | Low |
| **Volume Profile** | Volume distribution at price levels | Medium — shows support/resistance | Many bars with volume | High |
| **CMF (Chaikin Money Flow)** | Money flow over period | Medium — simplified A/D | 21 bars typical | Medium |

#### Volatility Indicators

| Indicator | What it Measures | Beginner Value | Data Needed | Complexity |
|-----------|-----------------|----------------|-------------|------------|
| **Keltner Channel** | Volatility channel (ATR-based) | Medium — alternative to Bollinger | 20 bars + ATR(10) | Medium |
| **Standard Deviation** | Raw price variability | Low for beginners — abstract concept | 20+ bars | Very Low |
| **Historical Volatility** | Annualized std dev of returns | Medium — useful for options context | 20+ bars | Low |

#### Support/Resistance

| Indicator | What it Measures | Beginner Value | Data Needed | Complexity |
|-----------|-----------------|----------------|-------------|------------|
| **Pivot Points** | Daily S/R levels from prior day OHLC | High — concrete price levels | Previous day's OHLC | Very Low |
| **Donchian Channel** | N-day high/low channel | High — clear breakout levels | 20 bars | Very Low |

#### Additional Candlestick Patterns (not yet implemented)

| Pattern | Signal | Description | Complexity |
|---------|--------|-------------|------------|
| **Morning Star / Evening Star** | Reversal | 3-candle pattern, strong reversal signal | Medium |
| **Three White Soldiers / Three Black Crows** | Continuation → Reversal | 3 consecutive strong candles | Low |
| **Piercing Line / Dark Cloud Cover** | Reversal | 2-candle pattern, moderate signal | Low |
| **Harami (Inside Bar)** | Reversal | Small candle inside previous candle's body | Low |
| **Spinning Top** | Indecision | Small body, equal shadows | Very Low |
| **Marubozu** | Strong trend | No shadows, full-body candle | Very Low |

### Priority Recommendations for StockView

**High Priority (most useful for beginners, low implementation effort):**
1. **ROC** — intuitive momentum, very easy to calculate
2. **Pivot Points** — concrete daily levels, trivial calculation
3. **MFI** — "volume-weighted RSI" easy to explain, uses existing data
4. **A/D Line** — simple accumulation/distribution, complements OBV
5. **Parabolic SAR** — visually intuitive dots, clear buy/sell signals
6. **Morning Star / Evening Star / Harami** — expand candlestick detection

**Medium Priority (valuable but more complex):**
7. **ADX** — trend strength is a common beginner question
8. **Keltner Channel** — pairs well with existing Bollinger Bands
9. **VWAP** — industry standard, but needs intraday data (may not have)
10. **Ichimoku Cloud** — powerful but overwhelming for beginners

**Low Priority (redundant or niche):**
11. WMA — very similar to existing EMA
12. Williams %R — inverse of existing Stochastic
13. CCI — similar to RSI in practice
14. Standard Deviation — too abstract for retail users

### Calculation Details for Top Picks

#### ROC (Rate of Change)
```
ROC = ((close - close[n]) / close[n]) * 100
```
- Period: 12 days typical
- Data: just close prices, 12+ bars
- Interpretation: >0 bullish momentum, <0 bearish

#### Pivot Points (Standard)
```
Pivot = (High_prev + Low_prev + Close_prev) / 3
R1 = 2 * Pivot - Low_prev
S1 = 2 * Pivot - High_prev
R2 = Pivot + (High_prev - Low_prev)
S2 = Pivot - (High_prev - Low_prev)
```
- Data: previous day's single OHLC candle
- Very easy to calculate and display

#### MFI (Money Flow Index)
```
Typical Price = (H + L + C) / 3
Raw Money Flow = TP * Volume
Positive MF = sum of RMF on up days (14-day)
Negative MF = sum of RMF on down days (14-day)
MFI = 100 - 100 / (1 + Positive MF / Negative MF)
```
- Period: 14 days
- Data: OHLCV, same as existing
- Interpretation: >80 overbought, <20 oversold

#### Parabolic SAR
```
SAR = SAR_prev + AF * (EP - SAR_prev)
AF starts at 0.02, increments by 0.02 each new extreme, max 0.20
EP = highest high (uptrend) or lowest low (downtrend)
```
- Data: High/Low prices, ~50 bars for stable values
- Visual: dots above (bearish) or below (bullish) price

#### A/D Line (Accumulation/Distribution)
```
CLV = ((Close - Low) - (High - Close)) / (High - Low)
A/D = A/D_prev + CLV * Volume
```
- Data: OHLCV
- Cumulative indicator, starts from 0
