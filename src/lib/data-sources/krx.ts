/**
 * KRX 비공식 HTTP 클라이언트
 * data.krx.co.kr 내부 엔드포인트 사용 (인증 불필요)
 * SLA 없음 — 모든 호출은 try/catch로 감싸서 사용할 것
 */

import { withRetry } from "@/lib/utils/retry"

const KRX_BASE_URL =
  "https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd"

const KRX_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  Referer: "https://data.krx.co.kr/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

function parseNum(val: unknown): number {
  if (val == null || val === "" || val === "-") return 0
  return parseFloat(String(val).replace(/,/g, "")) || 0
}

function parseBigNum(val: unknown): bigint {
  if (val == null || val === "" || val === "-") return 0n
  const n = parseFloat(String(val).replace(/,/g, ""))
  return isNaN(n) ? 0n : BigInt(Math.round(n))
}

async function krxPost(
  bld: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  return withRetry(async () => {
    const body = new URLSearchParams({ bld, ...params })
    const res = await fetch(KRX_BASE_URL, {
      method: "POST",
      headers: KRX_HEADERS,
      body: body.toString(),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`KRX HTTP ${res.status}`)
    return res.json()
  }, { label: `krxPost(${bld})` })
}

export interface KrxOhlcv {
  ticker: string
  name: string
  open: number
  high: number
  low: number
  close: number
  volume: bigint
  change: number
  changePercent: number
}

export interface KrxFundamentals {
  ticker: string
  marketCap: bigint | null
  per: number | null
  pbr: number | null
}

export interface KrxIndexData {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

/**
 * 일별 OHLCV 전체 종목 수집
 * @param date YYYYMMDD 형식
 * @param market STK=코스피, KSQ=코스닥
 */
export async function fetchKrxDailyOhlcv(
  date: string,
  market: "STK" | "KSQ"
): Promise<KrxOhlcv[]> {
  const data = await krxPost("dbms/MDC/STAT/standard/MDCSTAT01501", {
    trdDd: date,
    mktId: market,
    share: "1",
    money: "1",
    csvxls_isNo: "false",
  })
  if (!Array.isArray(data?.output)) return []

  return (data.output as Record<string, unknown>[])
    .map((row) => ({
      ticker: String(row.ISU_SRT_CD ?? ""),
      name: String(row.ISU_ABBRV ?? row.ISU_NM ?? ""),
      open: parseNum(row.TDD_OPNPRC),
      high: parseNum(row.TDD_HGPRC),
      low: parseNum(row.TDD_LWPRC),
      close: parseNum(row.TDD_CLSPRC),
      volume: parseBigNum(row.ACC_TRDVOL),
      change: parseNum(row.CMPPREVDD_PRC),
      changePercent: parseNum(row.FLUC_RT),
    }))
    .filter((o) => o.ticker.length > 0 && o.close > 0)
}

/**
 * 시가총액 + PER/PBR 수집
 * @param date YYYYMMDD 형식
 * @param market STK=코스피, KSQ=코스닥
 */
export async function fetchKrxFundamentals(
  date: string,
  market: "STK" | "KSQ"
): Promise<KrxFundamentals[]> {
  const data = await krxPost("dbms/MDC/STAT/standard/MDCSTAT03501", {
    trdDd: date,
    mktId: market,
    csvxls_isNo: "false",
  })
  if (!Array.isArray(data?.output)) return []

  return (data.output as Record<string, unknown>[])
    .map((row) => {
      const perRaw = String(row.PER ?? "").trim()
      const pbrRaw = String(row.PBR ?? "").trim()
      const isValid = (s: string) => s !== "" && s !== "-" && s !== "N/A"
      return {
        ticker: String(row.ISU_SRT_CD ?? ""),
        marketCap: parseBigNum(row.MKTCAP) || null,
        per: isValid(perRaw) ? parseNum(perRaw) : null,
        pbr: isValid(pbrRaw) ? parseNum(pbrRaw) : null,
      }
    })
    .filter((f) => f.ticker.length > 0)
}

/**
 * KOSPI / KOSDAQ 지수 수집
 * @param date YYYYMMDD 형식
 */
export async function fetchKrxIndex(date: string): Promise<KrxIndexData[]> {
  const data = await krxPost("dbms/MDC/STAT/standard/MDCSTAT00101", {
    trdDd: date,
    csvxls_isNo: "false",
  })
  if (!Array.isArray(data?.output)) return []

  const KNOWN: Record<string, string> = {
    코스피: "KOSPI",
    코스닥: "KOSDAQ",
  }

  return (data.output as Record<string, unknown>[])
    .map((row) => {
      const rawName = String(row.IDX_NM ?? "")
      const symbol = KNOWN[rawName]
      if (!symbol) return null
      return {
        symbol,
        name: rawName,
        value: parseNum(row.CLSPRC_IDX ?? row.OPNPRC_IDX),
        change: parseNum(row.CMPPREVDD_IDX),
        changePercent: parseNum(row.FLUC_RT),
      }
    })
    .filter((x): x is KrxIndexData => x !== null)
}

/**
 * 최근 영업일 계산 (YYYYMMDD 반환)
 * - 16:00 KST 이후면 당일 (당일 장마감 데이터 수집 가능)
 * - 16:00 KST 이전이면 전일
 * - 주말이면 직전 금요일로 롤백
 */
export function getLastTradingDate(): string {
  const now = new Date()
  // KST = UTC + 9h
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)

  const candidate = new Date(kst)
  // 16:00 KST 이전이면 전일로
  if (kst.getUTCHours() < 16) {
    candidate.setUTCDate(candidate.getUTCDate() - 1)
  }
  // 주말 건너뛰기 (일=0, 토=6)
  while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
    candidate.setUTCDate(candidate.getUTCDate() - 1)
  }

  const y = candidate.getUTCFullYear()
  const m = String(candidate.getUTCMonth() + 1).padStart(2, "0")
  const d = String(candidate.getUTCDate()).padStart(2, "0")
  return `${y}${m}${d}`
}
