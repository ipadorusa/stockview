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

const QUEUE_LIMIT = 1    // 승인된 요청 최대 처리 수 (Vercel 60s timeout 대응)
const AUTO_LIMIT = 1     // 자동 선정 종목 수
const THROTTLE_MS = 2000 // Groq rate limit: 30 RPM

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cronStart = Date.now()
  const url = new URL(req.url)
  const market = url.searchParams.get("market")
  const ticker = url.searchParams.get("ticker")

  console.log(`[cron-reports] Starting: market=${market ?? "ALL"}, ticker=${ticker ?? "auto+queue"}`)

  const stats = {
    generated: 0,
    skipped: 0,
    failed: 0,
    queued: 0,
    errors: [] as string[],
  }

  try {
    const provider = getLLMProvider()
    const kstDateStr = getKSTDateString(new Date())
    const reportDate = new Date(`${kstDateStr}T00:00:00.000+09:00`)

    // ── Phase 1: 승인된 요청 큐 처리 ──
    const approvedRequests = await prisma.reportRequest.findMany({
      where: { status: "APPROVED" },
      orderBy: { requestedAt: "asc" },
      take: QUEUE_LIMIT,
      include: {
        stock: { select: { id: true, ticker: true, name: true, market: true } },
      },
    })

    for (const request of approvedRequests) {
      try {
        // 상태를 GENERATING으로 변경
        await prisma.reportRequest.update({
          where: { id: request.id },
          data: { status: "GENERATING" },
        })

        const result = await generateReport({
          stockId: request.stock.id,
          ticker: request.stock.ticker,
          name: request.stock.name,
          signal: "user_request",
          provider,
          reportDate,
        })

        if (result === "skipped") {
          // 오늘 이미 리포트 존재 — COMPLETED 처리하고 기존 리포트 연결
          const existingReport = await prisma.aiReport.findFirst({
            where: { stockId: request.stockId, reportDate },
            select: { id: true },
          })
          await prisma.reportRequest.update({
            where: { id: request.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              aiReportId: existingReport?.id ?? null,
            },
          })
          stats.skipped++
        } else {
          // 리포트 생성 완료 — 요청에 연결
          await prisma.reportRequest.update({
            where: { id: request.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              aiReportId: result.reportId,
            },
          })
          stats.generated++
          stats.queued++
        }

        // Throttle
        await new Promise((r) => setTimeout(r, THROTTLE_MS))
      } catch (e) {
        const msg = `queue:${request.stock.ticker}: ${e instanceof Error ? e.message : String(e)}`
        console.error(`[cron-reports] Failed: ${msg}`)
        stats.errors.push(msg)
        stats.failed++
        // 실패 시 FAILED 상태로
        await prisma.reportRequest.update({
          where: { id: request.id },
          data: { status: "FAILED" },
        }).catch(() => {})
      }
    }

    // ── Phase 2: 자동 선정 종목 ──
    if (!ticker) {
      let targets = await selectReportTargets(prisma, AUTO_LIMIT * 2)
      if (market) {
        targets = targets.filter((t) => t.market === market)
      }
      targets = targets.slice(0, AUTO_LIMIT)

      for (const target of targets) {
        try {
          const result = await generateReport({
            stockId: target.stockId,
            ticker: target.ticker,
            name: target.name,
            signal: target.signal,
            provider,
            reportDate,
          })

          if (result === "skipped") {
            stats.skipped++
          } else {
            stats.generated++
          }

          if (targets.indexOf(target) < targets.length - 1) {
            await new Promise((r) => setTimeout(r, THROTTLE_MS))
          }
        } catch (e) {
          const msg = `auto:${target.ticker}: ${e instanceof Error ? e.message : String(e)}`
          console.error(`[cron-reports] Failed: ${msg}`)
          stats.errors.push(msg)
          stats.failed++
        }
      }
    } else {
      // 특정 티커 지정
      const specificTargets = await selectReportTargets(prisma, 1, ticker)
      for (const target of specificTargets) {
        try {
          const result = await generateReport({
            stockId: target.stockId,
            ticker: target.ticker,
            name: target.name,
            signal: target.signal,
            provider,
            reportDate,
          })
          if (result === "skipped") stats.skipped++
          else stats.generated++
        } catch (e) {
          const msg = `${target.ticker}: ${e instanceof Error ? e.message : String(e)}`
          stats.errors.push(msg)
          stats.failed++
        }
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

// ── 리포트 생성 헬퍼 ──

interface GenerateParams {
  stockId: string
  ticker: string
  name: string
  signal: string
  provider: string
  reportDate: Date
}

async function generateReport(
  params: GenerateParams
): Promise<"skipped" | { reportId: string }> {
  const { stockId, ticker, name, signal, provider, reportDate } = params
  const slug = generateSlug(ticker, new Date())

  // 오늘 이미 리포트 존재 확인
  const existing = await prisma.aiReport.findUnique({ where: { slug } })
  if (existing) {
    console.log(`[cron-reports] Skipping ${ticker}: already exists`)
    return "skipped"
  }

  const data = await collectStockData(prisma, stockId)
  const dataText = formatDataForPrompt(data, signal)
  const messages = buildPromptMessages(dataText)
  const response = await generateChat(messages)
  const parsed = parseReportResponse(response)

  const report = await prisma.aiReport.create({
    data: {
      slug,
      stockId,
      title: `${name} AI 분석 리포트`,
      signal,
      summary: parsed.summary,
      verdict: parsed.verdict,
      content: parsed.content,
      model: provider,
      reportDate,
      dataSnapshot: JSON.parse(JSON.stringify(data)),
    },
  })

  console.log(`[cron-reports] Generated: ${ticker} (${parsed.verdict})`)
  return { reportId: report.id }
}
