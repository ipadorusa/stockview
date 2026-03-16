/**
 * KRX 전체 종목 마스터 시딩 (KOSPI + KOSDAQ)
 *
 * 사용법:
 *   npx tsx scripts/seed-kr-master.ts
 *
 * 동작:
 *   1. KRX 비공식 API에서 KOSPI/KOSDAQ 전체 종목 OHLCV 수집
 *   2. Stock 테이블에 upsert (ticker 기준)
 *   3. 기존 더미 데이터도 업데이트됨
 *
 * 예상 결과: ~2,600~2,700종목 등록
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { fetchKrxDailyOhlcv, getLastTradingDate } from "../src/lib/data-sources/krx"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const date = getLastTradingDate()
  console.log(`📅 기준일: ${date}`)
  console.log("📡 KRX 종목 마스터 수집 중...\n")

  // KOSPI + KOSDAQ 병렬 수집
  const [kospiData, kosdaqData] = await Promise.all([
    fetchKrxDailyOhlcv(date, "STK"),
    fetchKrxDailyOhlcv(date, "KSQ"),
  ])

  console.log(`  KOSPI: ${kospiData.length}종목`)
  console.log(`  KOSDAQ: ${kosdaqData.length}종목`)

  const allStocks = [
    ...kospiData.map((s) => ({ ...s, exchange: "KOSPI" })),
    ...kosdaqData.map((s) => ({ ...s, exchange: "KOSDAQ" })),
  ]

  console.log(`\n📥 DB upsert 시작 (총 ${allStocks.length}종목)...`)

  let upserted = 0
  let errors = 0

  // 100건씩 배치 처리
  const BATCH = 100
  for (let i = 0; i < allStocks.length; i += BATCH) {
    const batch = allStocks.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(async (s) => {
        try {
          await prisma.stock.upsert({
            where: { ticker: s.ticker },
            update: {
              name: s.name,
              market: "KR",
              exchange: s.exchange,
              isActive: true,
            },
            create: {
              ticker: s.ticker,
              name: s.name,
              market: "KR",
              exchange: s.exchange,
              isActive: true,
            },
          })
          upserted++
        } catch {
          errors++
        }
      })
    )

    // 진행률 표시
    if ((i + BATCH) % 500 === 0 || i + BATCH >= allStocks.length) {
      const progress = Math.min(i + BATCH, allStocks.length)
      console.log(`  ${progress}/${allStocks.length} 처리중...`)
    }

    await sleep(50) // DB 과부하 방지
  }

  console.log(`\n✅ 완료: ${upserted}종목 등록, 오류 ${errors}건`)
}

main()
  .catch((e) => {
    console.error("❌ 오류:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
