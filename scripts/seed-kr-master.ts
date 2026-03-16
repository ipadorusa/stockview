/**
 * KR 전체 종목 마스터 시딩 (KOSPI + KOSDAQ)
 * 데이터 소스: Naver Finance 시장요약 페이지
 *
 * 사용법:
 *   npx tsx scripts/seed-kr-master.ts
 *
 * 예상 결과: ~4,300종목 등록, 예상 소요: ~60초
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { fetchNaverMarketData } from "../src/lib/data-sources/naver"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log("📡 Naver Finance 종목 마스터 수집 중...\n")

  // KOSPI + KOSDAQ 순차 수집 (병렬로 하면 rate limit 위험)
  console.log("  [1/2] KOSPI 수집 중...")
  const kospiStocks = await fetchNaverMarketData("KOSPI")
  console.log(`  → ${kospiStocks.length}종목`)

  await sleep(1000)

  console.log("  [2/2] KOSDAQ 수집 중...")
  const kosdaqStocks = await fetchNaverMarketData("KOSDAQ")
  console.log(`  → ${kosdaqStocks.length}종목`)

  const allStocks = [...kospiStocks, ...kosdaqStocks]
  console.log(`\n📥 DB upsert 시작 (총 ${allStocks.length}종목)...`)

  let upserted = 0
  let errors = 0

  const BATCH = 100
  for (let i = 0; i < allStocks.length; i += BATCH) {
    const batch = allStocks.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(async (s) => {
        try {
          await prisma.stock.upsert({
            where: { ticker: s.ticker },
            update: { name: s.name, market: "KR", exchange: s.exchange, isActive: true },
            create: { ticker: s.ticker, name: s.name, market: "KR", exchange: s.exchange, isActive: true },
          })
          upserted++
        } catch {
          errors++
        }
      })
    )

    if ((i + BATCH) % 500 === 0 || i + BATCH >= allStocks.length) {
      console.log(`  ${Math.min(i + BATCH, allStocks.length)}/${allStocks.length} 처리중...`)
    }

    await sleep(30)
  }

  console.log(`\n✅ 완료: ${upserted}종목 등록, 오류 ${errors}건`)
}

main()
  .catch((e) => { console.error("❌ 오류:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
