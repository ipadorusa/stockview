/**
 * AI 종목 분석 리포트 생성 스크립트
 *
 * 사용법:
 *   npx tsx scripts/generate-ai-reports.ts              # 자동선정 2건
 *   npx tsx scripts/generate-ai-reports.ts --count 10   # 자동선정 10건
 *   npx tsx scripts/generate-ai-reports.ts --ticker 005930  # 특정 종목
 *   npx tsx scripts/generate-ai-reports.ts --queue       # 승인된 요청 큐 처리
 *   npx tsx scripts/generate-ai-reports.ts --dry-run     # LLM 호출 없이 확인
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import {
  selectReportTargets,
  collectStockData,
  formatDataForPrompt,
  buildPromptMessages,
  parseReportResponse,
  generateSlug,
  SIGNAL_LABELS,
  getKSTDateString,
} from "../src/lib/ai-report"
import { generateChat, getLLMProvider } from "../src/lib/llm"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function parseArgs() {
  const args = process.argv.slice(2)
  let ticker: string | undefined
  let dryRun = false
  let count = 2
  let queue = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ticker" && args[i + 1]) {
      ticker = args[++i]
    } else if (args[i] === "--dry-run") {
      dryRun = true
    } else if (args[i] === "--count" && args[i + 1]) {
      count = parseInt(args[++i], 10)
    } else if (args[i] === "--queue") {
      queue = true
    }
  }

  return { ticker, dryRun, count, queue }
}

async function processQueue(dryRun: boolean) {
  const kstDateStr = getKSTDateString(new Date())
  const today = new Date(`${kstDateStr}T00:00:00.000+09:00`)

  const requests = await prisma.reportRequest.findMany({
    where: { status: "APPROVED" },
    orderBy: { requestedAt: "asc" },
    include: {
      stock: { select: { id: true, ticker: true, name: true, market: true } },
    },
  })

  if (requests.length === 0) {
    console.log("📭 승인 대기 중인 요청이 없습니다.")
    return
  }

  console.log(`\n📋 승인된 요청 (${requests.length}건):`)
  for (const r of requests) {
    console.log(`  - ${r.stock.name} (${r.stock.ticker}) [${r.stock.market}]`)
  }
  console.log("")

  let success = 0
  let failed = 0

  for (const request of requests) {
    try {
      console.log(`📊 ${request.stock.name} (${request.stock.ticker}) 분석 중...`)

      await prisma.reportRequest.update({
        where: { id: request.id },
        data: { status: "GENERATING" },
      })

      const data = await collectStockData(prisma, request.stock.id)
      const dataText = formatDataForPrompt(data, "user_request")
      const messages = buildPromptMessages(dataText)

      if (dryRun) {
        console.log("  ⚠️  DRY RUN — LLM 호출 생략")
        await prisma.reportRequest.update({
          where: { id: request.id },
          data: { status: "APPROVED" },
        })
        success++
        continue
      }

      console.log("  🧠 LLM 호출 중...")
      let response = await generateChat(messages)
      if (response.length < 100) {
        console.log("  ⚠️  응답이 짧아 재시도...")
        response = await generateChat(messages)
      }

      const parsed = parseReportResponse(response)
      const slug = generateSlug(request.stock.ticker, today)

      const report = await prisma.aiReport.upsert({
        where: { slug },
        update: {
          title: `${request.stock.name} AI 분석 리포트`,
          signal: "user_request",
          content: parsed.content,
          summary: parsed.summary,
          verdict: parsed.verdict,
          dataSnapshot: JSON.parse(JSON.stringify(data)),
          model: getLLMProvider(),
        },
        create: {
          slug,
          stockId: request.stock.id,
          title: `${request.stock.name} AI 분석 리포트`,
          signal: "user_request",
          content: parsed.content,
          summary: parsed.summary,
          verdict: parsed.verdict,
          reportDate: today,
          dataSnapshot: JSON.parse(JSON.stringify(data)),
          model: getLLMProvider(),
        },
      })

      await prisma.reportRequest.update({
        where: { id: request.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          aiReportId: report.id,
        },
      })

      console.log(`  ✍️  한줄요약: ${parsed.summary}`)
      console.log(`  📌 투자의견: ${parsed.verdict}`)
      console.log(`  ✅ 완료 (slug: ${slug})\n`)
      success++
    } catch (error) {
      console.error(`  ❌ 실패: ${error instanceof Error ? error.message : String(error)}\n`)
      await prisma.reportRequest.update({
        where: { id: request.id },
        data: { status: "FAILED" },
      }).catch(() => {})
      failed++
    }
  }

  console.log(`\n🏁 큐 처리 완료: 성공 ${success}건, 실패 ${failed}건`)
}

async function main() {
  const { ticker, dryRun, count, queue } = parseArgs()

  console.log("🤖 AI 종목 분석 리포트 생성 시작\n")
  console.log(`  모델: ${getLLMProvider()}`)
  if (queue) {
    console.log("  모드: 📭 승인된 요청 큐 처리")
    if (dryRun) console.log("  ⚠️  DRY RUN 모드 (LLM 호출 없음)\n")
    return processQueue(dryRun)
  }
  console.log(`  생성 수: ${count}`)
  if (ticker) console.log(`  지정 종목: ${ticker}`)
  if (dryRun) console.log(`  ⚠️  DRY RUN 모드 (LLM 호출 없음)\n`)

  const targets = await selectReportTargets(prisma, count, ticker)

  if (targets.length === 0) {
    console.log("⚠️  생성 대상 종목이 없습니다.")
    return
  }

  console.log(`\n📋 대상 종목 (${targets.length}개):`)
  for (const t of targets) {
    console.log(`  - ${t.name} (${t.ticker}) [${SIGNAL_LABELS[t.signal] ?? t.signal}]`)
  }
  console.log("")

  const kstDateStr = getKSTDateString(new Date())
  const today = new Date(`${kstDateStr}T00:00:00.000+09:00`)

  let success = 0
  let failed = 0

  for (const target of targets) {
    try {
      console.log(`📊 ${target.name} (${target.ticker}) 분석 중...`)

      // 데이터 수집
      const data = await collectStockData(prisma, target.stockId)
      const dataText = formatDataForPrompt(data, target.signal)
      const messages = buildPromptMessages(dataText)

      if (dryRun) {
        console.log("\n--- SYSTEM PROMPT ---")
        console.log(messages[0].content)
        console.log("\n--- USER PROMPT ---")
        console.log(messages[1].content)
        console.log("\n--- END ---\n")
        success++
        continue
      }

      // LLM 호출
      console.log("  🧠 LLM 호출 중...")
      let response = await generateChat(messages)

      // 응답 너무 짧으면 1회 재시도
      if (response.length < 100) {
        console.log("  ⚠️  응답이 짧아 재시도...")
        response = await generateChat(messages)
      }

      // 응답 파싱
      const parsed = parseReportResponse(response)
      const slug = generateSlug(target.ticker, today)

      console.log(`  ✍️  한줄요약: ${parsed.summary}`)
      console.log(`  📌 투자의견: ${parsed.verdict}`)
      console.log(`  📝 분석 길이: ${parsed.content.length}자`)

      // DB 저장 (upsert)
      await prisma.aiReport.upsert({
        where: { slug },
        update: {
          title: `${target.name} AI 분석 리포트`,
          signal: target.signal,
          content: parsed.content,
          summary: parsed.summary,
          verdict: parsed.verdict,
          dataSnapshot: JSON.parse(JSON.stringify(data)),
          model: getLLMProvider(),
        },
        create: {
          slug,
          stockId: target.stockId,
          title: `${target.name} AI 분석 리포트`,
          signal: target.signal,
          content: parsed.content,
          summary: parsed.summary,
          verdict: parsed.verdict,
          reportDate: today,
          dataSnapshot: JSON.parse(JSON.stringify(data)),
          model: getLLMProvider(),
        },
      })

      console.log(`  ✅ 저장 완료 (slug: ${slug})\n`)
      success++
    } catch (error) {
      console.error(`  ❌ 실패: ${error instanceof Error ? error.message : String(error)}\n`)
      failed++
    }
  }

  console.log(`\n🏁 완료: 성공 ${success}건, 실패 ${failed}건`)
}

main()
  .catch((e) => {
    console.error("❌ 오류:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
