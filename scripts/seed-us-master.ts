/**
 * S&P 500 종목 마스터 시딩
 *
 * 사용법:
 *   npx tsx scripts/seed-us-master.ts
 *
 * 데이터 소스:
 *   https://github.com/datasets/s-and-p-500-companies (공개 CSV)
 *   Symbol, Name, Sector, Sub-Industry 컬럼 사용
 *
 * 예상 결과: ~503종목 등록
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/** ticker → exchange 맵핑 (NASDAQ vs NYSE)
 *  Yahoo Finance /v7/quote 응답의 exchange 필드를 참고하여 분류.
 *  알 수 없는 경우 기본값 NYSE 사용.
 */
const NASDAQ_STOCKS = new Set([
  "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "GOOG", "TSLA", "AVGO", "COST",
  "NFLX", "AMD", "ADBE", "QCOM", "INTC", "CSCO", "PEP", "TXN", "INTU", "CMCSA",
  "HON", "AMGN", "AMAT", "BKNG", "ISRG", "ADP", "LRCX", "PANW", "MELI", "ADI",
  "REGN", "VRTX", "KLAC", "MU", "SNPS", "CDNS", "CRWD", "FTNT", "MRVL", "ABNB",
  "CTAS", "PAYX", "FAST", "ODFL", "ROST", "IDXX", "BIIB", "DXCM", "ILMN", "ALGN",
  "GEHC", "TTWO", "WBD", "ZS", "TEAM", "OKTA", "DDOG", "VRSK", "EXC", "XEL",
  "PCAR", "CPRT", "FANG", "CEG", "ON", "NXPI", "SIRI", "DLTR", "SPLK", "SBUX",
])

interface SP500Row {
  Symbol: string
  Name: string
  Sector: string
  "GICS Sub-Industry": string
}

async function fetchSP500CSV(): Promise<SP500Row[]> {
  const url =
    "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"

  console.log("📡 S&P 500 구성종목 CSV 다운로드 중...")
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`CSV 다운로드 실패: HTTP ${res.status}`)

  const text = await res.text()
  const lines = text.trim().split("\n")
  const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

  return lines.slice(1).map((line) => {
    // CSV 파싱 (따옴표 안의 쉼표 처리)
    const values: string[] = []
    let inQuote = false
    let current = ""
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue }
      if (ch === "," && !inQuote) { values.push(current.trim()); current = ""; continue }
      current += ch
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    header.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row as unknown as SP500Row
  })
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const rows = await fetchSP500CSV()
  console.log(`  ${rows.length}개 종목 파싱 완료\n`)

  console.log(`📥 DB upsert 시작 (총 ${rows.length}종목)...`)

  let upserted = 0
  let errors = 0

  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(async (row) => {
        const ticker = row.Symbol.replace(".", "-") // BRK.B → BRK-B (Yahoo Finance 형식)
        const exchange = NASDAQ_STOCKS.has(ticker) ? "NASDAQ" : "NYSE"
        try {
          await prisma.stock.upsert({
            where: { ticker },
            update: {
              name: row.Name,
              market: "US",
              exchange,
              sector: row.Sector || null,
              isActive: true,
            },
            create: {
              ticker,
              name: row.Name,
              market: "US",
              exchange,
              sector: row.Sector || null,
              isActive: true,
            },
          })
          upserted++
        } catch {
          errors++
        }
      })
    )

    if ((i + BATCH) % 200 === 0 || i + BATCH >= rows.length) {
      console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length} 처리중...`)
    }

    await sleep(30)
  }

  console.log(`\n✅ 완료: ${upserted}종목 등록, 오류 ${errors}건`)
}

main()
  .catch((e) => {
    console.error("❌ 오류:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
