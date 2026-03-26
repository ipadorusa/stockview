import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  selectReportTargets,
  collectStockData,
  formatDataForPrompt,
  buildPromptMessages,
  parseReportResponse,
  getKSTDateString,
  generateSlug,
} from "@/lib/ai-report"
import { generateChat, getLLMProvider } from "@/lib/llm"
import { logCronResult } from "@/lib/utils/cron-logger"
import { revalidateTag } from "next/cache"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cronStart = Date.now()
  const url = new URL(req.url)
  const market = url.searchParams.get("market") // "KR" | "US" | null (both)
  const countParam = url.searchParams.get("count")
  const count = countParam ? Math.min(parseInt(countParam, 10), 10) : 5
  const ticker = url.searchParams.get("ticker") // optional: specific ticker

  console.log(`[cron-reports] Starting: market=${market ?? "ALL"}, count=${count}, ticker=${ticker ?? "auto"}`)

  const stats = {
    generated: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  }

  try {
    // Select target stocks
    let targets = ticker
      ? await selectReportTargets(prisma, 1, ticker)
      : await selectReportTargets(prisma, count * 2) // get more than needed for market filtering

    // Filter by market if specified
    if (market && !ticker) {
      targets = targets.filter((t) => t.market === market)
    }
    targets = targets.slice(0, count)

    if (targets.length === 0) {
      const result = { ok: true, message: "No targets found", ...stats }
      await logCronResult("generate-reports", cronStart, result)
      return NextResponse.json(result)
    }

    const provider = getLLMProvider()
    const kstDateStr = getKSTDateString(new Date())
    const reportDate = new Date(`${kstDateStr}T00:00:00.000+09:00`)

    // Generate reports sequentially to respect Groq rate limits
    for (const target of targets) {
      try {
        const slug = generateSlug(target.ticker, new Date())

        // Check if report already exists for today
        const existing = await prisma.aiReport.findUnique({ where: { slug } })
        if (existing) {
          console.log(`[cron-reports] Skipping ${target.ticker}: already exists`)
          stats.skipped++
          continue
        }

        // Collect data
        const data = await collectStockData(prisma, target.stockId)
        const dataText = formatDataForPrompt(data, target.signal)
        const messages = buildPromptMessages(dataText)

        // Generate report via LLM
        const response = await generateChat(messages)
        const parsed = parseReportResponse(response)

        // Save to database
        await prisma.aiReport.create({
          data: {
            slug,
            stockId: target.stockId,
            title: `${target.name} AI 분석 리포트`,
            signal: target.signal,
            summary: parsed.summary,
            verdict: parsed.verdict,
            content: parsed.content,
            model: provider,
            reportDate,
            dataSnapshot: JSON.parse(JSON.stringify(data)),
          },
        })

        console.log(`[cron-reports] Generated: ${target.ticker} (${parsed.verdict})`)
        stats.generated++

        // Throttle between requests (Groq rate limit: 30 req/min)
        if (targets.indexOf(target) < targets.length - 1) {
          await new Promise((r) => setTimeout(r, 2500))
        }
      } catch (e) {
        const msg = `${target.ticker}: ${e instanceof Error ? e.message : String(e)}`
        console.error(`[cron-reports] Failed: ${msg}`)
        stats.errors.push(msg)
        stats.failed++
      }
    }

    revalidateTag("reports", { expire: 0 })

    const result = { ok: true, ...stats }
    await logCronResult("generate-reports", cronStart, result)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[cron-reports] Fatal error: ${msg}`)
    const result = { ok: false, error: msg, ...stats }
    await logCronResult("generate-reports", cronStart, result)
    return NextResponse.json(result, { status: 500 })
  }
}
