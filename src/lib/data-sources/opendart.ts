/**
 * OpenDART (전자공시시스템) API 클라이언트
 * https://opendart.fss.or.kr/
 *
 * Rate limit: 분당 1,000건 (초과 시 error code "020")
 * 모든 호출은 withRetry()로 감싸서 사용
 */

import { withRetry } from "@/lib/utils/retry"
import AdmZip from "adm-zip"
import { XMLParser } from "fast-xml-parser"

const BASE_URL = "https://opendart.fss.or.kr"
const THROTTLE_MS = 200

function getApiKey(): string {
  const key = process.env.OPENDART_API_KEY
  if (!key) throw new Error("[opendart] OPENDART_API_KEY is not set")
  return key
}

async function throttle(): Promise<void> {
  await new Promise((r) => setTimeout(r, THROTTLE_MS))
}

// ── Corp Code (기업 고유번호) ──────────────────────────────

export interface CorpCodeEntry {
  corpCode: string // 8자리 고유번호
  corpName: string
  stockCode: string // 6자리 종목코드 (상장사만)
  modifyDate: string
}

/**
 * corpCode.xml ZIP 다운로드 → 파싱
 * 상장사(stockCode 있는)만 필터링하여 반환
 */
export async function downloadCorpCodes(): Promise<CorpCodeEntry[]> {
  const url = `${BASE_URL}/api/corpCode.xml?crtfc_key=${getApiKey()}`

  const res = await withRetry(
    () => fetch(url, { signal: AbortSignal.timeout(30_000) }),
    { label: "downloadCorpCodes" }
  )
  if (!res.ok) throw new Error(`[opendart] corpCode HTTP ${res.status}`)

  const buf = await res.arrayBuffer()
  const zip = new AdmZip(Buffer.from(buf))
  const entry = zip.getEntries().find((e) => e.entryName.endsWith(".xml"))
  if (!entry) throw new Error("[opendart] No XML found in corpCode ZIP")

  const xmlStr = entry.getData().toString("utf-8")
  const parser = new XMLParser()
  const parsed = parser.parse(xmlStr)

  const items: unknown[] = Array.isArray(parsed?.result?.list)
    ? parsed.result.list
    : [parsed?.result?.list].filter(Boolean)

  const results: CorpCodeEntry[] = []
  for (const item of items) {
    const i = item as Record<string, unknown>
    const stockCode = String(i.stock_code ?? "").trim()
    if (!stockCode || stockCode === " ") continue // 비상장사 제외

    results.push({
      corpCode: String(i.corp_code ?? "").padStart(8, "0"),
      corpName: String(i.corp_name ?? ""),
      stockCode,
      modifyDate: String(i.modify_date ?? ""),
    })
  }

  return results
}

// ── 공시 검색 ──────────────────────────────────────────────

export interface DisclosureItem {
  corpCode: string
  corpName: string
  rceptNo: string // 접수번호 14자리
  reportName: string
  filerName: string
  rceptDate: string // YYYYMMDD
  remark: string
}

interface DisclosureListResponse {
  status: string
  message: string
  page_no: number
  page_count: number
  total_count: number
  total_page: number
  list?: DisclosureItem[]
}

/**
 * 공시 검색
 */
export async function fetchDisclosures(
  corpCode: string,
  opts: {
    beginDate?: string // YYYYMMDD
    endDate?: string // YYYYMMDD
    pageCount?: number
    pageNo?: number
  } = {}
): Promise<DisclosureItem[]> {
  const params = new URLSearchParams({
    crtfc_key: getApiKey(),
    corp_code: corpCode,
    bgn_de: opts.beginDate ?? "",
    end_de: opts.endDate ?? "",
    page_count: String(opts.pageCount ?? 50),
    page_no: String(opts.pageNo ?? 1),
  })

  // 빈 파라미터 제거
  for (const [key, val] of [...params.entries()]) {
    if (!val) params.delete(key)
  }

  const url = `${BASE_URL}/api/list.json?${params}`

  const res = await withRetry(
    () => fetch(url, { signal: AbortSignal.timeout(20_000) }),
    { label: `fetchDisclosures(${corpCode})` }
  )
  if (!res.ok) throw new Error(`[opendart] list HTTP ${res.status}`)

  const data: DisclosureListResponse = await res.json()

  // "013": 조회된 데이터가 없습니다 → 빈 배열
  if (data.status === "013") return []

  // "020": 요청 제한 초과
  if (data.status === "020") {
    console.warn("[opendart] Rate limit hit, waiting 60s...")
    await new Promise((r) => setTimeout(r, 60_000))
    return fetchDisclosures(corpCode, opts)
  }

  if (data.status !== "000") {
    throw new Error(`[opendart] list error: ${data.status} ${data.message}`)
  }

  await throttle()
  return data.list ?? []
}

// ── 배당 상세 ──────────────────────────────────────────────

export interface DividendDetail {
  stockKind: string // "보통주" | "우선주"
  dividendAmount: number // 주당 현금배당금
  dividendYield: number // 현금배당수익률(%)
  payoutRatio: number // 현금배당성향(%)
  faceValue: number // 주당액면가액
  fiscalYear: string // 사업연도 (ex: "2024")
}

interface AlotMatterResponse {
  status: string
  message: string
  list?: Array<Record<string, string>>
}

/**
 * 배당에 관한 사항 조회
 * @param reprtCode 보고서 코드 (11011: 사업보고서, 11012: 반기, 11013: 1분기, 11014: 3분기)
 */
export async function fetchDividendDetail(
  corpCode: string,
  bsnsYear: string,
  reprtCode: string = "11011"
): Promise<DividendDetail[]> {
  const params = new URLSearchParams({
    crtfc_key: getApiKey(),
    corp_code: corpCode,
    bsns_year: bsnsYear,
    reprt_code: reprtCode,
  })

  const url = `${BASE_URL}/api/alotMatter.json?${params}`

  const res = await withRetry(
    () => fetch(url, { signal: AbortSignal.timeout(20_000) }),
    { label: `fetchDividendDetail(${corpCode}, ${bsnsYear})` }
  )
  if (!res.ok) throw new Error(`[opendart] alotMatter HTTP ${res.status}`)

  const data: AlotMatterResponse = await res.json()

  if (data.status === "013") return []

  if (data.status === "020") {
    console.warn("[opendart] Rate limit hit, waiting 60s...")
    await new Promise((r) => setTimeout(r, 60_000))
    return fetchDividendDetail(corpCode, bsnsYear, reprtCode)
  }

  if (data.status !== "000") {
    throw new Error(`[opendart] alotMatter error: ${data.status} ${data.message}`)
  }

  await throttle()

  return (data.list ?? [])
    .filter((item) => item.se === "주당 현금배당금(원)")
    .map((item) => {
      const parseNum = (s: string) => parseFloat(s?.replace(/,/g, "").replace(/-/g, "0")) || 0

      return {
        stockKind: item.stock_knd ?? "보통주",
        dividendAmount: parseNum(item.thstrm ?? "0"),
        dividendYield: parseNum(
          (data.list ?? []).find(
            (r) => r.se === "현금배당수익률(%)" && r.stock_knd === item.stock_knd
          )?.thstrm ?? "0"
        ),
        payoutRatio: parseNum(
          (data.list ?? []).find(
            (r) => r.se === "현금배당성향(%)" && r.stock_knd === item.stock_knd
          )?.thstrm ?? "0"
        ),
        faceValue: parseNum(
          (data.list ?? []).find(
            (r) => r.se === "주당 액면가액(원)" && r.stock_knd === item.stock_knd
          )?.thstrm ?? "0"
        ),
        fiscalYear: bsnsYear,
      }
    })
}
