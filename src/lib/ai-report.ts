import type { PrismaClient } from "@prisma/client"
import type { SignalType } from "@/lib/screener"
import { findSignalStockIds } from "@/lib/screener"
import { computeLatestIndicators } from "@/lib/indicators"

import { SIGNAL_LABELS, getKSTDateString } from "@/lib/ai-report-utils"
export { SIGNAL_LABELS, VERDICT_STYLES, stripReportHeaders, getKSTDateString, generateSlug } from "@/lib/ai-report-utils"

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
  const kstDateStr = getKSTDateString(new Date())
  const today = new Date(`${kstDateStr}T00:00:00.000+09:00`)

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

      const matchedIds = await findSignalStockIds(market, signal as SignalType, 10)
      for (const m of matchedIds.map((id) => ({ stockId: id }))) {
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
  const [stock, quote, fundamental, prices, dividends, earnings, newsRelations] =
    await Promise.all([
      prisma.stock.findUniqueOrThrow({
        where: { id: stockId },
        select: { name: true, ticker: true, market: true, exchange: true, sector: true },
      }),
      prisma.stockQuote.findUnique({ where: { stockId } }),
      prisma.stockFundamental.findUnique({ where: { stockId } }),
      prisma.dailyPrice.findMany({
        where: { stockId },
        orderBy: { date: "asc" },
        take: 100,
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
    technical: computeLatestIndicators(
      prices.map((p) => ({
        date: p.date,
        close: toNum(p.close) ?? 0,
        high: toNum(p.high) ?? 0,
        low: toNum(p.low) ?? 0,
        volume: p.volume,
      })),
      3
    ).map((t) => ({
      date: t.date.toISOString().slice(0, 10),
      ma5: round(t.ma5),
      ma20: round(t.ma20),
      ma60: round(t.ma60),
      rsi14: round(t.rsi14, 1),
      macdLine: round(t.macdLine),
      macdSignal: round(t.macdSignal),
      macdHistogram: round(t.macdHistogram),
      bbUpper: round(t.bbUpper),
      bbMiddle: round(t.bbMiddle),
      bbLower: round(t.bbLower),
    })),
    prices: prices.slice(-10).reverse().map((p) => ({
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
      content: `주식 애널리스트. 제공 데이터만 사용, 추측 금지.
500~800자. 마크다운 서식(**등) 사용 금지.

PER 기준: KR→코스피 ~12배, US→S&P500 ~22배 대비 판단.
투자의견: 긍정/중립/부정 + 정량 근거 2가지 이상 + 리스크 1가지 이상.
용어: PER, PBR, 강세/약세, 매수우위/매도우위/관망, 지지선/저항선/돌파/이탈.`,
    },
    {
      role: "user",
      content: `${dataText}

---
아래 형식으로 작성하세요:

[한줄요약]
(30자 이내. 핵심 포인트 1가지)

[투자의견]
(긍정/중립/부정 중 하나 + 근거 1줄)

[분석]
(500~800자. 밸류에이션→기술적→뉴스→리스크 순서로 자연스러운 문단으로 연결하여 작성)
- 밸류에이션과 펀더멘탈 상태 (시장 평균 대비)
- 현재 시그널과 기술적 지표가 보여주는 추세
- 최근 뉴스/이벤트의 영향
- 주의해야 할 리스크 (최소 1가지)`,
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

// stripReportHeaders, getKSTDateString, generateSlug are re-exported from ai-report-utils.ts
