/**
 * US 종목 마스터 시딩 (S&P 500 + 추가 종목)
 *
 * 사용법:
 *   npx tsx scripts/seed-us-master.ts
 *
 * 데이터 소스:
 *   - S&P 500: https://github.com/datasets/s-and-p-500-companies (공개 CSV)
 *   - NASDAQ 100 추가: scripts/data/nasdaq100-extra.csv
 *   - 한국 인기 종목: scripts/data/popular-stocks.csv
 *   - MidCap 상위: scripts/data/midcap-top.csv
 *
 * 예상 결과: ~750종목 등록
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { readFileSync } from "fs"
import { join } from "path"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/** ticker → exchange 맵핑 (NASDAQ vs NYSE)
 *  Yahoo Finance /v7/quote 응답의 exchange 필드를 참고하여 분류.
 *  알 수 없는 경우 기본값 NYSE 사용.
 */
const NASDAQ_STOCKS = new Set([
  // S&P 500 내 NASDAQ 종목
  "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "GOOG", "TSLA", "AVGO", "COST",
  "NFLX", "AMD", "ADBE", "QCOM", "INTC", "CSCO", "PEP", "TXN", "INTU", "CMCSA",
  "HON", "AMGN", "AMAT", "BKNG", "ISRG", "ADP", "LRCX", "PANW", "MELI", "ADI",
  "REGN", "VRTX", "KLAC", "MU", "SNPS", "CDNS", "CRWD", "FTNT", "MRVL", "ABNB",
  "CTAS", "PAYX", "FAST", "ODFL", "ROST", "IDXX", "BIIB", "DXCM", "ILMN", "ALGN",
  "GEHC", "TTWO", "WBD", "ZS", "TEAM", "OKTA", "DDOG", "VRSK", "EXC", "XEL",
  "PCAR", "CPRT", "FANG", "CEG", "ON", "NXPI", "SIRI", "DLTR", "SPLK", "SBUX",
  // 추가 NASDAQ 종목 (popular-stocks, midcap-top 등)
  "PLTR", "SOFI", "RKLB", "ARM", "SMCI", "MARA", "COIN", "HOOD", "GRAB",
  "JD", "PDD", "LI", "ASML", "CRWD", "DUOL", "SOUN", "AFRM", "UPST", "ROKU",
  "MNDY", "ZI", "CFLT", "MDB", "CELH", "OPEN", "LYFT", "DASH", "GTLB", "CRSP",
  "DKNG", "MGNI", "FUTU", "TIGR", "WULF", "CLSK", "RIOT", "BITF", "MSTR",
  "IBIT", "TQQQ", "QQQ",
  "LSCC", "RMBS", "EXAS", "NTNX", "GLPI", "MEDP", "TTEK", "CWST", "CYBR",
  "NOVT", "OLED", "PNFP", "WDFC", "IPAR", "COKE", "SAIA", "SFM", "PLUS",
  "UFPI", "CALM", "LNTH", "PGNY", "TMDX", "FLNC", "WINA", "WING", "APP", "AXON",
  "IBKR", "TXRH", "CARG", "VNOM", "CHRD", "INTA", "TW", "HALO", "ROIV", "CORT",
  "SRPT", "RARE", "BHVN", "KRYS", "INSM", "NARI", "TVTX", "PCVX", "CPRX", "AMPH",
  "ACVA", "GDRX", "PLTK", "BRZE", "SMMT", "VRNA", "TGTX", "IRTC", "NTRA",
  "OMCL", "GERN", "FOLD", "RXRX", "APLS", "ALNY", "IONS", "ARWR", "NTLA",
  "BEAM", "EDIT", "VERV", "VCYT", "TXG", "FATE", "PRCT", "RVMD", "IMVT",
  "KRTX", "PTCT", "SWTX", "RCKT", "MDGL", "CRNX", "DAWN", "PCRX", "TARS",
  "ACLX", "JANX", "VKTX", "GPCR", "WFRD", "MCHP", "ENPH", "LCID", "RIVN",
  "LEGN", "VERA", "SILK",
])

interface StockRow {
  Symbol: string
  Name: string
  Sector: string
  Exchange?: string
}

interface SP500Row {
  Symbol: string
  Security: string
  "GICS Sector": string
  "GICS Sub-Industry": string
}

function parseSimpleCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n")
  const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  return lines.slice(1).map((line) => {
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
    return row
  })
}

async function fetchSP500CSV(): Promise<SP500Row[]> {
  const url =
    "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"

  console.log("📡 S&P 500 구성종목 CSV 다운로드 중...")
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`CSV 다운로드 실패: HTTP ${res.status}`)

  const text = await res.text()
  const rows = parseSimpleCSV(text)
  return rows as unknown as SP500Row[]
}

function loadLocalCSV(filename: string): StockRow[] {
  const filePath = join(__dirname, "data", filename)
  try {
    const text = readFileSync(filePath, "utf-8")
    const rows = parseSimpleCSV(text)
    return rows.map((r) => ({
      Symbol: r.Symbol || "",
      Name: r.Name || "",
      Sector: r.Sector || "",
      Exchange: r.Exchange || undefined,
    }))
  } catch {
    console.warn(`⚠️  ${filename} 로드 실패 (건너뜀)`)
    return []
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  // 1. S&P 500 로드
  const sp500Rows = await fetchSP500CSV()
  console.log(`  S&P 500: ${sp500Rows.length}종목 파싱 완료`)

  // 2. 추가 CSV 로드
  const nq100Extra = loadLocalCSV("nasdaq100-extra.csv")
  console.log(`  Extra NQ: ${nq100Extra.length}종목`)
  const popular = loadLocalCSV("popular-stocks.csv")
  console.log(`  Popular: ${popular.length}종목`)
  const midcap = loadLocalCSV("midcap-top.csv")
  console.log(`  MidCap: ${midcap.length}종목`)

  // 3. 병합 (S&P 500 우선, ticker 기준 중복 제거)
  const seen = new Set<string>()
  const merged: StockRow[] = []

  // S&P 500
  for (const row of sp500Rows) {
    const ticker = row.Symbol.replace(".", "-")
    if (!ticker || seen.has(ticker)) continue
    seen.add(ticker)
    merged.push({
      Symbol: ticker,
      Name: row.Security,
      Sector: row["GICS Sector"] || "",
    })
  }

  // 추가 CSV들 (순서: NQ100 Extra → Popular → MidCap)
  for (const rows of [nq100Extra, popular, midcap]) {
    for (const row of rows) {
      const ticker = row.Symbol.replace(".", "-").trim()
      if (!ticker || seen.has(ticker)) continue
      seen.add(ticker)
      merged.push(row)
    }
  }

  console.log(`\n📊 S&P 500: ${sp500Rows.length}, Extra NQ: ${nq100Extra.length}, Popular: ${popular.length}, MidCap: ${midcap.length}, 총: ${merged.length}종목\n`)

  // 4. DB upsert
  console.log(`📥 DB upsert 시작 (총 ${merged.length}종목)...`)

  let upserted = 0
  let errors = 0

  const BATCH = 50
  for (let i = 0; i < merged.length; i += BATCH) {
    const batch = merged.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(async (row) => {
        const ticker = row.Symbol
        const exchange = NASDAQ_STOCKS.has(ticker) ? "NASDAQ" : (row.Exchange || "NYSE")
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
        } catch (e) {
          errors++
          if (errors <= 3) console.error(`  [${ticker}] 오류:`, String(e).slice(0, 200))
        }
      })
    )

    if ((i + BATCH) % 200 === 0 || i + BATCH >= merged.length) {
      console.log(`  ${Math.min(i + BATCH, merged.length)}/${merged.length} 처리중...`)
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
