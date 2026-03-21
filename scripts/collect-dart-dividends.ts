/**
 * OpenDART 배당 수집 스크립트
 * GitHub Actions에서 직접 실행 (Vercel 서버리스 타임아웃 회피)
 *
 * 사용법:
 *   npx tsx scripts/collect-dart-dividends.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { fetchDividendDetail } from "../src/lib/data-sources/opendart"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const BATCH_SIZE = 100

async function main() {
  console.log("[collect-dart-dividends] Starting DART dividend collection")
  const start = Date.now()

  const stats = {
    stocksProcessed: 0,
    skipped: 0,
    dividendsUpdated: 0,
    dividendsCreated: 0,
    errors: [] as string[],
  }

  // 최근 3개년 사업연도
  const now = new Date()
  const latestYear = now.getMonth() >= 3 ? now.getFullYear() - 1 : now.getFullYear() - 2
  const years = [String(latestYear), String(latestYear - 1), String(latestYear - 2)]

  // 이미 최신 연도 OpenDART 배당이 있는 종목은 건너뛰기
  const latestExDate = new Date(`${latestYear}-12-31`)
  const alreadyProcessed = await prisma.dividend.findMany({
    where: { source: "opendart", exDate: latestExDate },
    select: { stockId: true },
  })
  const processedIds = new Set(alreadyProcessed.map((d) => d.stockId))

  const allStocks = await prisma.stock.findMany({
    where: { market: "KR", stockType: "STOCK", isActive: { not: false }, corpCode: { not: null } },
    select: { id: true, ticker: true, corpCode: true },
  })
  const stocks = allStocks.filter((s) => !processedIds.has(s.id))
  stats.skipped = processedIds.size

  console.log(`[collect-dart-dividends] Total=${allStocks.length}, skipped=${stats.skipped}, toProcess=${stocks.length}`)

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE)

    for (const stock of batch) {
      for (const bsnsYear of years) {
        try {
          const details = await fetchDividendDetail(stock.corpCode!, bsnsYear)

          const common = details.find((d) => d.stockKind === "보통주")
          if (!common || common.dividendAmount <= 0) continue

          const exDate = new Date(`${bsnsYear}-12-31`)

          const existing = await prisma.dividend.findUnique({
            where: { stockId_exDate: { stockId: stock.id, exDate } },
          })

          if (existing) {
            await prisma.dividend.update({
              where: { id: existing.id },
              data: {
                amount: common.dividendAmount,
                dividendYield: common.dividendYield,
                payoutRatio: common.payoutRatio,
                faceValue: common.faceValue,
                source: "opendart",
              },
            })
            stats.dividendsUpdated++
          } else {
            await prisma.dividend.create({
              data: {
                stockId: stock.id,
                exDate,
                amount: common.dividendAmount,
                currency: "KRW",
                dividendYield: common.dividendYield,
                payoutRatio: common.payoutRatio,
                faceValue: common.faceValue,
                source: "opendart",
              },
            })
            stats.dividendsCreated++
          }
        } catch (e) {
          stats.errors.push(`${stock.ticker}/${bsnsYear}: ${String(e).slice(0, 100)}`)
        }
      }

      stats.stocksProcessed++
    }

    console.log(`[collect-dart-dividends] Progress: ${stats.stocksProcessed}/${stocks.length}`)
  }

  const duration = Date.now() - start
  console.log(`[collect-dart-dividends] Done in ${Math.round(duration / 1000)}s: processed=${stats.stocksProcessed}, created=${stats.dividendsCreated}, updated=${stats.dividendsUpdated}`)
  if (stats.errors.length > 0) {
    console.error(`[collect-dart-dividends] Errors (${stats.errors.length}):`, stats.errors.slice(0, 10))
  }

  // CronLog 기록
  try {
    await prisma.cronLog.create({
      data: {
        jobName: "collect-dart-dividends",
        status: stats.errors.length > 0 ? "partial" : "success",
        duration,
        details: JSON.stringify({ ...stats, errors: stats.errors.slice(0, 5) }),
      },
    })
  } catch (e) {
    console.error("[collect-dart-dividends] Failed to log:", e)
  }

  await prisma.$disconnect()
}

main()
