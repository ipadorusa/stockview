/**
 * KR + US ETF 마스터 시딩
 * 데이터 소스: KR → Naver Finance ETF 페이지, US → Yahoo Finance
 *
 * 사용법:
 *   npx tsx scripts/seed-etf-master.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { fetchNaverETFData } from "../src/lib/data-sources/naver"
import { US_ETF_LIST } from "../src/lib/data-sources/yahoo"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log("📡 ETF 마스터 시딩 시작...\n")

  // 1. KR ETF
  console.log("  [1/2] KR ETF 수집 중 (Naver Finance)...")
  let krCount = 0
  let krErrors = 0
  try {
    const krETFs = await fetchNaverETFData()
    console.log(`  → ${krETFs.length}개 ETF 발견`)

    const BATCH = 100
    for (let i = 0; i < krETFs.length; i += BATCH) {
      const batch = krETFs.slice(i, i + BATCH)
      await Promise.allSettled(
        batch.map(async (etf) => {
          try {
            await prisma.stock.upsert({
              where: { ticker: etf.ticker },
              update: { name: etf.name, market: "KR", exchange: "KOSPI", stockType: "ETF", isActive: true },
              create: { ticker: etf.ticker, name: etf.name, market: "KR", exchange: "KOSPI", stockType: "ETF", isActive: true },
            })
            krCount++
          } catch {
            krErrors++
          }
        })
      )
      await sleep(30)
    }
  } catch (e) {
    console.error("  KR ETF 수집 실패:", e)
  }

  console.log(`  → KR ETF: ${krCount}개 등록, ${krErrors}건 오류\n`)

  // 2. US ETF
  console.log("  [2/2] US ETF 등록 중...")
  let usCount = 0
  let usErrors = 0

  for (const ticker of US_ETF_LIST) {
    try {
      await prisma.stock.upsert({
        where: { ticker },
        update: { market: "US", exchange: "NYSE", stockType: "ETF", isActive: true },
        create: { ticker, name: ticker, market: "US", exchange: "NYSE", stockType: "ETF", isActive: true },
      })
      usCount++
    } catch {
      usErrors++
    }
  }

  console.log(`  → US ETF: ${usCount}개 등록, ${usErrors}건 오류\n`)
  console.log(`✅ 완료: KR ${krCount} + US ${usCount} = ${krCount + usCount}개 ETF 등록`)
}

main()
  .catch((e) => { console.error("❌ 오류:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
