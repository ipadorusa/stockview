/**
 * OpenDART 기업코드(corpCode) 동기화 스크립트
 * GitHub Actions에서 직접 실행 (Vercel 서버리스 타임아웃 회피)
 *
 * 사용법:
 *   npx tsx scripts/sync-corp-codes.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { downloadCorpCodes } from "../src/lib/data-sources/opendart"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const BATCH_SIZE = 100

async function main() {
  console.log("[sync-corp-codes] Starting corp code sync")
  const start = Date.now()

  const stats = { totalCorpCodes: 0, matched: 0, errors: [] as string[] }

  try {
    const corpCodes = await downloadCorpCodes()
    stats.totalCorpCodes = corpCodes.length
    console.log(`[sync-corp-codes] Downloaded ${corpCodes.length} corp codes`)

    // ticker → corpCode 맵 구성
    const tickerMap = new Map<string, string>()
    for (const cc of corpCodes) {
      tickerMap.set(cc.stockCode, cc.corpCode)
    }

    // KR STOCK만 대상
    const krStocks = await prisma.stock.findMany({
      where: { market: "KR", stockType: "STOCK", isActive: { not: false } },
      select: { id: true, ticker: true },
    })
    console.log(`[sync-corp-codes] Found ${krStocks.length} KR stocks`)

    // 배치 업데이트
    for (let i = 0; i < krStocks.length; i += BATCH_SIZE) {
      const batch = krStocks.slice(i, i + BATCH_SIZE)
      const settled = await Promise.allSettled(
        batch
          .filter((s) => tickerMap.has(s.ticker))
          .map((s) =>
            prisma.stock.update({
              where: { id: s.id },
              data: { corpCode: tickerMap.get(s.ticker)! },
            })
          )
      )
      for (const r of settled) {
        if (r.status === "fulfilled") stats.matched++
        else stats.errors.push(`Update: ${String(r.reason).slice(0, 100)}`)
      }
    }
  } catch (e) {
    stats.errors.push(`Download: ${String(e)}`)
  }

  const duration = Date.now() - start
  console.log(`[sync-corp-codes] Done in ${duration}ms: totalCorpCodes=${stats.totalCorpCodes}, matched=${stats.matched}`)
  if (stats.errors.length > 0) {
    console.error(`[sync-corp-codes] Errors (${stats.errors.length}):`, stats.errors)
  }

  // CronLog 기록
  try {
    await prisma.cronLog.create({
      data: {
        jobName: "sync-corp-codes",
        status: !stats.totalCorpCodes ? "error" : stats.errors.length > 0 ? "partial" : "success",
        duration,
        details: JSON.stringify(stats),
      },
    })
  } catch (e) {
    console.error("[sync-corp-codes] Failed to log:", e)
  }

  await prisma.$disconnect()

  if (stats.totalCorpCodes === 0) {
    process.exit(1)
  }
}

main()
