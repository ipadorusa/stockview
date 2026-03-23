import type { PrismaClient } from "@prisma/client"
import type { SignalType } from "@/lib/screener"

export const SIGNAL_LABELS: Record<string, string> = {
  golden_cross: "골든크로스",
  macd_cross: "MACD 크로스",
  rsi_oversold: "RSI 과매도 반등",
  bollinger_bounce: "볼린저 반등",
  volume_surge: "거래량 급증",
  market_cap_top: "시총 상위",
}

export const VERDICT_STYLES: Record<string, { label: string; className: string }> = {
  "긍정": { label: "긍정", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "중립": { label: "중립", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "부정": { label: "부정", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

const SIGNAL_PRIORITY: string[] = [
  "golden_cross",
  "macd_cross",
  "rsi_oversold",
  "bollinger_bounce",
  "volume_surge",
]

// ── 종목 선정 ──────────────────────────────────────────

interface ReportTarget {
  stockId: string
  ticker: string
  name: string
  market: string
  signal: string
}

export async function selectReportTargets(
  prisma: PrismaClient,
  count: number,
  specificTicker?: string
): Promise<ReportTarget[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (specificTicker) {
    const stock = await prisma.stock.findUnique({
      where: { ticker: specificTicker.toUpperCase() },
      select: { id: true, ticker: true, name: true, market: true, stockType: true },
    })
    if (!stock) throw new Error(`종목을 찾을 수 없습니다: ${specificTicker}`)
    if (stock.stockType === "ETF") throw new Error(`ETF 종목은 분석 대상이 아닙니다: ${specificTicker}`)
    return [{ stockId: stock.id, ticker: stock.ticker, name: stock.name, market: stock.market, signal: "market_cap_top" }]
  }

  // 시그널별 종목 탐색
  const targets: ReportTarget[] = []
  const usedStockIds = new Set<string>()

  // 오늘 이미 생성된 리포트 제외
  const existingReports = await prisma.aiReport.findMany({
    where: { reportDate: today },
    select: { stockId: true },
  })
  const existingIds = new Set(existingReports.map((r) => r.stockId))

  for (const signal of SIGNAL_PRIORITY) {
    if (targets.length >= count) break

    for (const market of ["KR", "US"] as const) {
      if (targets.length >= count) break

      const matches = await findSignalMatches(prisma, market, signal as SignalType)
      for (const m of matches) {
        if (targets.length >= count) break
        if (usedStockIds.has(m.stockId) || existingIds.has(m.stockId)) continue

        // ETF 제외
        const stock = await prisma.stock.findUnique({
          where: { id: m.stockId },
          select: { id: true, ticker: true, name: true, market: true, stockType: true },
        })
        if (!stock || stock.stockType === "ETF") continue

        // StockFundamental 있는 종목만
        const hasFundamental = await prisma.stockFundamental.findUnique({
          where: { stockId: stock.id },
          select: { id: true },
        })
        if (!hasFundamental) continue

        targets.push({
          stockId: stock.id,
          ticker: stock.ticker,
          name: stock.name,
          market: stock.market,
          signal,
        })
        usedStockIds.add(stock.id)
      }
    }
  }

  // 시그널 없으면 시총 상위 fallback
  if (targets.length < count) {
    const fallbacks = await prisma.stock.findMany({
      where: {
        isActive: true,
        stockType: "STOCK",
        id: { notIn: [...usedStockIds, ...existingIds] },
        fundamental: { isNot: null },
        quotes: { some: { marketCap: { not: null } } },
      },
      include: { quotes: { select: { marketCap: true }, take: 1 } },
      orderBy: { quotes: { _count: "desc" } },
      take: count - targets.length + 10,
    })

    // Sort by marketCap desc
    const sorted = fallbacks
      .filter((s) => s.quotes[0]?.marketCap)
      .sort((a, b) => Number(b.quotes[0].marketCap!) - Number(a.quotes[0].marketCap!))

    for (const stock of sorted) {
      if (targets.length >= count) break
      if (usedStockIds.has(stock.id)) continue
      targets.push({
        stockId: stock.id,
        ticker: stock.ticker,
        name: stock.name,
        market: stock.market,
        signal: "market_cap_top",
      })
      usedStockIds.add(stock.id)
    }
  }

  return targets
}

async function findSignalMatches(
  prisma: PrismaClient,
  market: string,
  signal: SignalType
): Promise<{ stockId: string }[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  switch (signal) {
    case "golden_cross":
      return prisma.$queryRaw`
        WITH ranked AS (
          SELECT ti."stockId", ti.ma5, ti.ma20,
                 LAG(ti.ma5) OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_ma5,
                 LAG(ti.ma20) OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_ma20,
                 ROW_NUMBER() OVER (PARTITION BY ti."stockId" ORDER BY ti.date DESC) as rn
          FROM "TechnicalIndicator" ti
          JOIN "Stock" s ON s.id = ti."stockId"
          WHERE s.market = ${market}::"Market" AND s."isActive" = true
            AND ti.ma5 IS NOT NULL AND ti.ma20 IS NOT NULL
            AND ti.date >= ${sevenDaysAgo}
        )
        SELECT "stockId" FROM ranked
        WHERE rn = 1 AND prev_ma5 IS NOT NULL AND prev_ma20 IS NOT NULL
          AND prev_ma5 <= prev_ma20 AND ma5 > ma20
        LIMIT 10
      `
    case "macd_cross":
      return prisma.$queryRaw`
        WITH ranked AS (
          SELECT ti."stockId", ti."macdLine", ti."macdSignal",
                 LAG(ti."macdLine") OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_macd_line,
                 LAG(ti."macdSignal") OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_macd_signal,
                 ROW_NUMBER() OVER (PARTITION BY ti."stockId" ORDER BY ti.date DESC) as rn
          FROM "TechnicalIndicator" ti
          JOIN "Stock" s ON s.id = ti."stockId"
          WHERE s.market = ${market}::"Market" AND s."isActive" = true
            AND ti."macdLine" IS NOT NULL AND ti."macdSignal" IS NOT NULL
            AND ti.date >= ${sevenDaysAgo}
        )
        SELECT "stockId" FROM ranked
        WHERE rn = 1 AND prev_macd_line IS NOT NULL AND prev_macd_signal IS NOT NULL
          AND prev_macd_line <= prev_macd_signal AND "macdLine" > "macdSignal"
        LIMIT 10
      `
    case "rsi_oversold":
      return prisma.$queryRaw`
        WITH ranked AS (
          SELECT ti."stockId", ti.rsi14,
                 LAG(ti.rsi14) OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_rsi14,
                 ROW_NUMBER() OVER (PARTITION BY ti."stockId" ORDER BY ti.date DESC) as rn
          FROM "TechnicalIndicator" ti
          JOIN "Stock" s ON s.id = ti."stockId"
          WHERE s.market = ${market}::"Market" AND s."isActive" = true
            AND ti.rsi14 IS NOT NULL
            AND ti.date >= ${sevenDaysAgo}
        )
        SELECT "stockId" FROM ranked
        WHERE rn = 1 AND prev_rsi14 IS NOT NULL AND prev_rsi14 < 35 AND rsi14 > prev_rsi14
        LIMIT 10
      `
    case "bollinger_bounce":
      return prisma.$queryRaw`
        WITH bb AS (
          SELECT ti."stockId", ti."bbLower", dp.close,
                 LAG(ti."bbLower") OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_bb_lower,
                 LAG(dp.close) OVER (PARTITION BY ti."stockId" ORDER BY ti.date) as prev_close,
                 ROW_NUMBER() OVER (PARTITION BY ti."stockId" ORDER BY ti.date DESC) as rn
          FROM "TechnicalIndicator" ti
          JOIN "Stock" s ON s.id = ti."stockId"
          JOIN "DailyPrice" dp ON dp."stockId" = ti."stockId" AND dp.date = ti.date
          WHERE s.market = ${market}::"Market" AND s."isActive" = true
            AND ti."bbLower" IS NOT NULL
            AND ti.date >= ${sevenDaysAgo}
        )
        SELECT "stockId" FROM bb
        WHERE rn = 1 AND prev_close IS NOT NULL AND prev_bb_lower IS NOT NULL
          AND prev_close <= prev_bb_lower * 1.01 AND close > prev_close
        LIMIT 10
      `
    case "volume_surge":
      return prisma.$queryRaw`
        SELECT ti."stockId"
        FROM "TechnicalIndicator" ti
        JOIN "Stock" s ON s.id = ti."stockId"
        JOIN "StockQuote" sq ON sq."stockId" = s.id
        WHERE s.market = ${market}::"Market" AND s."isActive" = true
          AND ti."avgVolume20" IS NOT NULL AND ti."avgVolume20" > 0
          AND ti.date = (
            SELECT MAX(t2.date) FROM "TechnicalIndicator" t2
            JOIN "Stock" s2 ON s2.id = t2."stockId"
            WHERE s2.market = ${market}::"Market" AND s2."isActive" = true
          )
          AND sq.volume > ti."avgVolume20" * 2
        LIMIT 10
      `
    default:
      return []
  }
}

// ── 데이터 수집 ──────────────────────────────────────────

export interface StockDataSnapshot {
  stock: {
    name: string
    ticker: string
    market: string
    exchange: string
    sector: string | null
  }
  quote: {
    price: number
    change: number
    changePercent: number
    volume: number
    marketCap: number | null
    high52w: number | null
    low52w: number | null
    per: number | null
    pbr: number | null
  } | null
  fundamental: {
    eps: number | null
    dividendYield: number | null
    roe: number | null
    debtToEquity: number | null
    beta: number | null
  } | null
  technical: Array<{
    date: string
    ma5: number | null
    ma20: number | null
    ma60: number | null
    rsi14: number | null
    macdLine: number | null
    macdSignal: number | null
    macdHistogram: number | null
    bbUpper: number | null
    bbMiddle: number | null
    bbLower: number | null
  }>
  prices: Array<{
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  dividends: Array<{
    exDate: string
    amount: number
    dividendYield: number | null
  }>
  earnings: Array<{
    quarter: string
    epsEstimate: number | null
    epsActual: number | null
  }>
  news: Array<{
    title: string
    sentiment: string | null
    url?: string
  }>
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === "bigint") return Number(v)
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return (v as { toNumber(): number }).toNumber()
  }
  const n = Number(v)
  return isNaN(n) ? null : n
}

function round(v: number | null, decimals = 2): number | null {
  if (v === null) return null
  return Math.round(v * 10 ** decimals) / 10 ** decimals
}

export async function collectStockData(
  prisma: PrismaClient,
  stockId: string
): Promise<StockDataSnapshot> {
  const [stock, quote, fundamental, technicals, prices, dividends, earnings, newsRelations] =
    await Promise.all([
      prisma.stock.findUniqueOrThrow({
        where: { id: stockId },
        select: { name: true, ticker: true, market: true, exchange: true, sector: true },
      }),
      prisma.stockQuote.findUnique({ where: { stockId } }),
      prisma.stockFundamental.findUnique({ where: { stockId } }),
      prisma.technicalIndicator.findMany({
        where: { stockId },
        orderBy: { date: "desc" },
        take: 3,
      }),
      prisma.dailyPrice.findMany({
        where: { stockId },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.dividend.findMany({
        where: { stockId },
        orderBy: { exDate: "desc" },
        take: 3,
      }),
      prisma.earningsEvent.findMany({
        where: { stockId },
        orderBy: { reportDate: "desc" },
        take: 2,
      }),
      prisma.stockNews.findMany({
        where: { stockId },
        include: { news: { select: { title: true, sentiment: true, url: true } } },
        orderBy: { news: { publishedAt: "desc" } },
        take: 5,
      }),
    ])

  return {
    stock: {
      name: stock.name,
      ticker: stock.ticker,
      market: stock.market,
      exchange: stock.exchange,
      sector: stock.sector,
    },
    quote: quote
      ? {
          price: round(toNum(quote.price), 2)!,
          change: round(toNum(quote.change), 2)!,
          changePercent: round(toNum(quote.changePercent), 2)!,
          volume: Number(quote.volume),
          marketCap: quote.marketCap ? Number(quote.marketCap) : null,
          high52w: round(toNum(quote.high52w)),
          low52w: round(toNum(quote.low52w)),
          per: round(toNum(quote.per)),
          pbr: round(toNum(quote.pbr)),
        }
      : null,
    fundamental: fundamental
      ? {
          eps: round(toNum(fundamental.eps)),
          dividendYield: round(toNum(fundamental.dividendYield), 4),
          roe: round(toNum(fundamental.roe), 4),
          debtToEquity: round(toNum(fundamental.debtToEquity)),
          beta: round(toNum(fundamental.beta)),
        }
      : null,
    technical: technicals.map((t) => ({
      date: t.date.toISOString().slice(0, 10),
      ma5: round(toNum(t.ma5)),
      ma20: round(toNum(t.ma20)),
      ma60: round(toNum(t.ma60)),
      rsi14: round(toNum(t.rsi14), 1),
      macdLine: round(toNum(t.macdLine)),
      macdSignal: round(toNum(t.macdSignal)),
      macdHistogram: round(toNum(t.macdHistogram)),
      bbUpper: round(toNum(t.bbUpper)),
      bbMiddle: round(toNum(t.bbMiddle)),
      bbLower: round(toNum(t.bbLower)),
    })),
    prices: prices.map((p) => ({
      date: p.date.toISOString().slice(0, 10),
      open: round(toNum(p.open), 2)!,
      high: round(toNum(p.high), 2)!,
      low: round(toNum(p.low), 2)!,
      close: round(toNum(p.close), 2)!,
      volume: Number(p.volume),
    })),
    dividends: dividends.map((d) => ({
      exDate: d.exDate.toISOString().slice(0, 10),
      amount: round(toNum(d.amount), 2)!,
      dividendYield: round(toNum(d.dividendYield), 4),
    })),
    earnings: earnings.map((e) => ({
      quarter: e.quarter,
      epsEstimate: round(toNum(e.epsEstimate)),
      epsActual: round(toNum(e.epsActual)),
    })),
    news: newsRelations.map((r) => ({
      title: r.news.title,
      sentiment: r.news.sentiment,
      url: r.news.url,
    })),
  }
}

// ── 프롬프트 빌드 ──────────────────────────────────────

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return String(v)
}

function formatMarketCap(v: number | null, market: string): string {
  if (v === null) return "-"
  if (market === "KR") {
    if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(0)}조원`
    if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(0)}억원`
    return `${v}원`
  }
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  return `$${v}`
}

export function formatDataForPrompt(data: StockDataSnapshot, signal: string): string {
  const currency = data.stock.market === "KR" ? "원" : "$"
  const signalLabel = SIGNAL_LABELS[signal] ?? signal
  const signalDesc = getSignalDescription(signal)

  const lines: string[] = []

  lines.push(`[종목 기본정보]`)
  lines.push(`종목명: ${data.stock.name} (${data.stock.ticker})`)
  lines.push(`시장: ${data.stock.market} (${data.stock.exchange})${data.stock.sector ? ` | 섹터: ${data.stock.sector}` : ""}`)
  lines.push(`감지 시그널: ${signalLabel} (${signalDesc})`)

  if (data.quote) {
    const q = data.quote
    const sign = q.change >= 0 ? "+" : ""
    lines.push("")
    lines.push(`[시세]`)
    lines.push(`현재가: ${q.price.toLocaleString()}${currency} | 전일대비: ${sign}${q.change.toLocaleString()} (${sign}${q.changePercent}%)`)
    lines.push(`시가총액: ${formatMarketCap(q.marketCap, data.stock.market)} | 거래량: ${formatVolume(q.volume)}주`)
    if (q.high52w !== null || q.low52w !== null) {
      lines.push(`52주 최고: ${q.high52w?.toLocaleString() ?? "-"}${currency} | 52주 최저: ${q.low52w?.toLocaleString() ?? "-"}${currency}`)
    }
  }

  if (data.quote || data.fundamental) {
    lines.push("")
    lines.push(`[밸류에이션]`)
    const parts: string[] = []
    if (data.quote?.per !== null) parts.push(`PER: ${data.quote?.per}배`)
    if (data.quote?.pbr !== null) parts.push(`PBR: ${data.quote?.pbr}배`)
    if (data.fundamental?.eps !== null) parts.push(`EPS: ${data.fundamental?.eps?.toLocaleString()}${currency}`)
    if (data.fundamental?.dividendYield !== null) parts.push(`배당수익률: ${((data.fundamental?.dividendYield ?? 0) * 100).toFixed(1)}%`)
    if (data.fundamental?.roe !== null) parts.push(`ROE: ${((data.fundamental?.roe ?? 0) * 100).toFixed(1)}%`)
    if (data.fundamental?.debtToEquity !== null) parts.push(`부채비율: ${data.fundamental?.debtToEquity}%`)
    if (data.fundamental?.beta !== null) parts.push(`베타: ${data.fundamental?.beta}`)
    if (parts.length > 0) lines.push(parts.join(" | "))
  }

  if (data.technical.length > 0) {
    lines.push("")
    lines.push(`[기술적 지표 - 최근 ${data.technical.length}일]`)
    for (const t of data.technical) {
      const parts: string[] = [t.date.slice(5)]
      if (t.ma5 !== null) parts.push(`MA5=${t.ma5}`)
      if (t.ma20 !== null) parts.push(`MA20=${t.ma20}`)
      if (t.ma60 !== null) parts.push(`MA60=${t.ma60}`)
      if (t.rsi14 !== null) parts.push(`RSI=${t.rsi14}`)
      if (t.macdLine !== null) parts.push(`MACD=${t.macdLine > 0 ? "+" : ""}${t.macdLine}`)
      if (t.macdSignal !== null) parts.push(`Signal=${t.macdSignal > 0 ? "+" : ""}${t.macdSignal}`)
      lines.push(parts.join(" "))
    }
  }

  if (data.prices.length > 0) {
    lines.push("")
    lines.push(`[주가 추이 - 최근 ${data.prices.length}거래일]`)
    for (const p of data.prices) {
      lines.push(`${p.date.slice(5)}: 시${p.open.toLocaleString()} 고${p.high.toLocaleString()} 저${p.low.toLocaleString()} 종${p.close.toLocaleString()} 량${formatVolume(p.volume)}`)
    }
  }

  if (data.dividends.length > 0) {
    lines.push("")
    lines.push(`[배당]`)
    for (const d of data.dividends) {
      lines.push(`${d.exDate}: 주당 ${d.amount.toLocaleString()}${currency}${d.dividendYield ? ` (수익률 ${(d.dividendYield * 100).toFixed(1)}%)` : ""}`)
    }
  }

  if (data.earnings.length > 0) {
    lines.push("")
    lines.push(`[실적]`)
    for (const e of data.earnings) {
      if (e.epsActual !== null && e.epsEstimate !== null && e.epsEstimate !== 0) {
        const surprise = (((e.epsActual - e.epsEstimate) / Math.abs(e.epsEstimate)) * 100).toFixed(1)
        lines.push(`${e.quarter}: EPS 실제 ${e.epsActual.toLocaleString()}${currency} (예상 ${e.epsEstimate.toLocaleString()}${currency}, ${Number(surprise) >= 0 ? "+" : ""}${surprise}% 서프라이즈)`)
      } else if (e.epsActual !== null) {
        lines.push(`${e.quarter}: EPS ${e.epsActual.toLocaleString()}${currency}`)
      }
    }
  }

  if (data.news.length > 0) {
    lines.push("")
    lines.push(`[관련 뉴스 - 최근]`)
    for (const n of data.news) {
      const sentimentLabel = n.sentiment === "positive" ? "(긍정)" : n.sentiment === "negative" ? "(부정)" : "(중립)"
      lines.push(`- ${n.title} ${sentimentLabel}`)
    }
  }

  return lines.join("\n")
}

function getSignalDescription(signal: string): string {
  switch (signal) {
    case "golden_cross": return "5일 이동평균이 20일 이동평균을 상향 돌파"
    case "macd_cross": return "MACD 라인이 시그널 라인을 상향 돌파"
    case "rsi_oversold": return "RSI가 과매도 구간에서 반등"
    case "bollinger_bounce": return "볼린저밴드 하단에서 반등"
    case "volume_surge": return "평균 거래량 대비 2배 이상 급증"
    case "market_cap_top": return "시가총액 상위 종목"
    default: return ""
  }
}

export function buildPromptMessages(dataText: string): Array<{ role: "system" | "user"; content: string }> {
  return [
    {
      role: "system",
      content: `당신은 개인 투자자를 위한 주식 애널리스트입니다.
아래 데이터를 기반으로 종목 분석을 작성하세요.

규칙:
1. 제공된 데이터만 사용하세요. 추측하거나 외부 정보를 포함하지 마세요.
2. 총 500자 내외로 작성하세요.
3. 아래 형식을 정확히 따르세요.
4. [한줄요약], [투자의견], [분석] 헤더에 ** 등 마크다운 서식을 붙이지 마세요.`,
    },
    {
      role: "user",
      content: `${dataText}

---
아래 형식으로 작성하세요:

[한줄요약]
(50자 이내. 핵심 포인트 한 문장)

[투자의견]
(긍정/중립/부정 중 하나만)

[분석]
(400~500자. 아래 내용을 자연스러운 문단으로 연결하여 작성)
- 현재 시그널이 의미하는 것
- 기술적 지표가 보여주는 추세
- 밸류에이션과 펀더멘탈 상태
- 최근 뉴스/이벤트의 영향
- 주의해야 할 리스크`,
    },
  ]
}

// ── 응답 파서 ──────────────────────────────────────────

export interface ParsedReport {
  summary: string
  verdict: string
  content: string
}

export function parseReportResponse(response: string): ParsedReport {
  // LLM이 **[헤더]** 형태로 응답하는 경우 대응
  const cleaned = response.replace(/\*\*\[/g, "[").replace(/\]\*\*/g, "]")

  const summaryMatch = cleaned.match(/\[한줄요약\]\s*\n([^\n\[]+)/)
  const verdictMatch = cleaned.match(/\[투자의견\]\s*\n([^\n\[]+)/)
  const contentMatch = cleaned.match(/\[분석\]\s*\n([\s\S]+)$/)

  if (summaryMatch && verdictMatch && contentMatch) {
    let verdict = verdictMatch[1].trim()
    if (!["긍정", "중립", "부정"].includes(verdict)) {
      verdict = "중립"
    }
    return {
      summary: summaryMatch[1].trim().replace(/\*\*/g, "").slice(0, 100),
      verdict,
      content: contentMatch[1].trim().replace(/\*\*/g, ""),
    }
  }

  // 파싱 실패 시 fallback
  const firstSentence = response.split(/[.!?。]\s/)[0] ?? response.slice(0, 50)
  return {
    summary: firstSentence.slice(0, 100),
    verdict: "중립",
    content: response.trim(),
  }
}

// ── 기존 데이터 헤더 strip ──────────────────────────────────

export function stripReportHeaders(text: string): string {
  return text
    .replace(/\*\*\[(?:한줄요약|투자의견|분석)\]\*\*/g, "")
    .replace(/\[(?:한줄요약|투자의견|분석)\]/g, "")
    .replace(/\*\*/g, "")
    .trim()
}

// ── 슬러그 생성 ──────────────────────────────────────────

export function generateSlug(ticker: string, date: Date): string {
  const d = date.toISOString().slice(0, 10)
  return `${ticker.toLowerCase()}-${d}`
}
