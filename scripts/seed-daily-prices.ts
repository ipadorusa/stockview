/**
 * 히스토리컬 일봉 시딩 (최근 3주 = 15영업일)
 *
 * 사용법:
 *   npx tsx scripts/seed-daily-prices.ts        # KR + US 모두
 *   npx tsx scripts/seed-daily-prices.ts kr     # 한국만
 *   npx tsx scripts/seed-daily-prices.ts us     # 미국만
 *
 * KR: KRX 비공식 API (날짜별 전체 종목 1회 호출) — 빠름
 * US: Yahoo Finance chart API (종목별 1회 호출) — 느림 (~5~10분)
 *
 * 예상 소요:
 *   KR: 약 30초 (15일 x 2 시장 x 1초)
 *   US: 약 5~10분 (500종목 x 개별 호출)
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { fetchKrxDailyOhlcv, getLastTradingDate } from "../src/lib/data-sources/krx"
import { fetchYfDailyOhlcv } from "../src/lib/data-sources/yahoo"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** 최근 N영업일 날짜 목록 반환 (YYYYMMDD, 최신 → 과거 순) */
function getLastNTradingDates(n: number): string[] {
  const dates: string[] = []
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)

  const cursor = new Date(kst)
  // 16:00 KST 이전이면 전일부터 시작
  if (kst.getUTCHours() < 16) {
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  while (dates.length < n) {
    const day = cursor.getUTCDay()
    if (day !== 0 && day !== 6) {
      const y = cursor.getUTCFullYear()
      const m = String(cursor.getUTCMonth() + 1).padStart(2, "0")
      const d = String(cursor.getUTCDate()).padStart(2, "0")
      dates.push(`${y}${m}${d}`)
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return dates
}

// ─── 한국 일봉 시딩 ─────────────────────────────────────────────────────────

async function seedKrDailyPrices(days = 15) {
  console.log(`\n🇰🇷 한국 일봉 시딩 (최근 ${days}영업일)`)

  const dates = getLastNTradingDates(days)
  console.log(`  기간: ${dates[dates.length - 1]} ~ ${dates[0]}`)

  // DB에서 KR 종목 ID 맵 로드
  const dbStocks = await prisma.stock.findMany({
    where: { market: "KR", isActive: true },
    select: { id: true, ticker: true },
  })
  const tickerToId = new Map(dbStocks.map((s) => [s.ticker, s.id]))
  console.log(`  DB 등록 KR 종목: ${dbStocks.length}개\n`)

  let totalInserted = 0
  let totalErrors = 0

  for (const dateStr of dates.slice().reverse()) {
    // KOSPI + KOSDAQ 병렬 수집
    let ohlcvList: Awaited<ReturnType<typeof fetchKrxDailyOhlcv>> = []
    try {
      const [kospi, kosdaq] = await Promise.all([
        fetchKrxDailyOhlcv(dateStr, "STK"),
        fetchKrxDailyOhlcv(dateStr, "KSQ"),
      ])
      ohlcvList = [...kospi, ...kosdaq]
    } catch (e) {
      console.error(`  [${dateStr}] KRX 수집 실패: ${e}`)
      continue
    }

    const dateObj = new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00.000Z`)
    let dateInserted = 0

    const BATCH = 100
    for (let i = 0; i < ohlcvList.length; i += BATCH) {
      const batch = ohlcvList.slice(i, i + BATCH)
      await Promise.allSettled(
        batch.map(async (row) => {
          const stockId = tickerToId.get(row.ticker)
          if (!stockId) return
          try {
            await prisma.dailyPrice.upsert({
              where: { stockId_date: { stockId, date: dateObj } },
              update: {
                open: row.open,
                high: row.high,
                low: row.low,
                close: row.close,
                volume: row.volume,
              },
              create: {
                stockId,
                date: dateObj,
                open: row.open,
                high: row.high,
                low: row.low,
                close: row.close,
                volume: row.volume,
              },
            })
            dateInserted++
          } catch {
            totalErrors++
          }
        })
      )
    }

    totalInserted += dateInserted
    console.log(`  [${dateStr}] ${ohlcvList.length}종목 수집 → ${dateInserted}건 저장`)

    await sleep(500) // KRX API rate limit
  }

  console.log(`\n  ✅ KR 완료: ${totalInserted}건 저장, 오류 ${totalErrors}건`)
}

// ─── 미국 일봉 시딩 ─────────────────────────────────────────────────────────

async function seedUsDailyPrices() {
  console.log(`\n🇺🇸 미국 일봉 시딩 (최근 3주 = ~21일)`)

  // DB에서 US 종목 로드
  const dbStocks = await prisma.stock.findMany({
    where: { market: "US", isActive: true },
    select: { id: true, ticker: true },
  })
  console.log(`  DB 등록 US 종목: ${dbStocks.length}개`)
  console.log(`  예상 소요: ~${Math.ceil(dbStocks.length / 5 * 0.6)}초 (5 concurrent)\n`)

  let totalInserted = 0
  let totalErrors = 0
  let processed = 0

  // 5종목씩 병렬 처리
  const CONCURRENT = 5
  for (let i = 0; i < dbStocks.length; i += CONCURRENT) {
    const batch = dbStocks.slice(i, i + CONCURRENT)

    await Promise.allSettled(
      batch.map(async ({ id: stockId, ticker }) => {
        try {
          const rows = await fetchYfDailyOhlcv(ticker, 30) // 30일치 → ~21영업일
          for (const row of rows) {
            const dateObj = new Date(`${row.time}T00:00:00.000Z`)
            try {
              await prisma.dailyPrice.upsert({
                where: { stockId_date: { stockId, date: dateObj } },
                update: {
                  open: row.open,
                  high: row.high,
                  low: row.low,
                  close: row.close,
                  adjClose: row.adjClose,
                  volume: row.volume,
                },
                create: {
                  stockId,
                  date: dateObj,
                  open: row.open,
                  high: row.high,
                  low: row.low,
                  close: row.close,
                  adjClose: row.adjClose,
                  volume: row.volume,
                },
              })
              totalInserted++
            } catch {
              totalErrors++
            }
          }
        } catch (e) {
          console.error(`  [${ticker}] 실패: ${e}`)
          totalErrors++
        }
        processed++
      })
    )

    if (processed % 50 === 0 || processed >= dbStocks.length) {
      console.log(`  ${processed}/${dbStocks.length} 종목 처리중... (저장: ${totalInserted}건)`)
    }

    await sleep(500) // Yahoo Finance rate limit
  }

  console.log(`\n  ✅ US 완료: ${totalInserted}건 저장, 오류 ${totalErrors}건`)
}

// ─── 진입점 ──────────────────────────────────────────────────────────────────

async function main() {
  const target = process.argv[2]?.toLowerCase()

  console.log("=".repeat(60))
  console.log("📊 일봉 히스토리 시딩")
  console.log("=".repeat(60))

  if (!target || target === "kr") {
    await seedKrDailyPrices(15)
  }

  if (!target || target === "us") {
    await seedUsDailyPrices()
  }

  console.log("\n🎉 시딩 완료!")
}

main()
  .catch((e) => {
    console.error("❌ 오류:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
