/**
 * Naver Finance 비공식 클라이언트
 * KRX data.krx.co.kr이 JS 세션 인증을 요구하여 Naver Finance로 대체
 * SLA 없음 — 모든 호출은 try/catch로 감싸서 사용할 것
 */

import { withRetry } from "@/lib/utils/retry"

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Referer: "https://finance.naver.com/",
  "Accept-Language": "ko-KR,ko;q=0.9",
}

function parseKrNum(s: string): number {
  return parseFloat(s.replace(/,/g, "").replace(/[^\d.+-]/g, "")) || 0
}

function parseBigKrNum(s: string): bigint {
  const n = parseFloat(s.replace(/,/g, "").replace(/[^\d]/g, ""))
  return isNaN(n) ? 0n : BigInt(Math.round(n))
}

async function fetchEucKrRaw(url: string, timeoutMs = 20_000): Promise<string> {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`Naver HTTP ${res.status}: ${url}`)
  const buf = await res.arrayBuffer()
  return new TextDecoder("euc-kr").decode(buf)
}

async function fetchEucKr(url: string, timeoutMs = 20_000): Promise<string> {
  return withRetry(() => fetchEucKrRaw(url, timeoutMs), { label: `fetchEucKr(${url.split("?")[0]})` })
}

export interface NaverStockData {
  ticker: string
  name: string
  exchange: "KOSPI" | "KOSDAQ"
  price: number
  previousClose: number
  change: number
  changePercent: number
  volume: bigint
  marketCap: bigint | null
  per: number | null
}

export interface NaverOhlcv {
  date: string // YYYYMMDD
  open: number
  high: number
  low: number
  close: number
  volume: bigint
}

export interface NaverIndexData {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

/**
 * 시장 요약 HTML 1페이지 파싱
 * 컬럼 순서: 현재가, 전일비, 등락률, 액면가, 시가총액, 상장주식수, 외국인비율, 거래량, PER, ROE
 */
function parseMarketPage(html: string, exchange: "KOSPI" | "KOSDAQ"): NaverStockData[] {
  const results: NaverStockData[] = []
  const regex = /href="\/item\/main\.naver\?code=(\d{6})" class="tltle">([^<]+)</g
  let m: RegExpExecArray | null

  while ((m = regex.exec(html)) !== null) {
    const ticker = m[1]
    const name = m[2].trim()
    const pos = m.index

    // 이름 셀의 </td> 이후부터 </tr>까지가 데이터 셀들
    const closeTd = html.indexOf("</td>", pos)
    if (closeTd === -1) continue
    const rowEnd = html.indexOf("</tr>", closeTd)
    if (rowEnd === -1) continue
    const dataPart = html.slice(closeTd + 5, rowEnd)

    const tds = [...dataPart.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((tm) =>
      tm[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )

    if (tds.length < 9) continue

    const price = parseKrNum(tds[0])
    if (price <= 0) continue

    // 전일비: "상승 5,200" / "하락 1,200" / "보합 0"
    const changeRaw = tds[1]
    const isDown = changeRaw.includes("하락") || changeRaw.includes("하한")
    const change = parseKrNum(changeRaw) * (isDown ? -1 : 1)

    // 등락률: "+2.83%" / "-1.23%"
    const changePctRaw = tds[2].replace("%", "").trim()
    const changePercent = Math.abs(parseKrNum(changePctRaw)) * (isDown ? -1 : 1)

    // 시가총액 (억원 → 원)
    const marketCapUk = parseBigKrNum(tds[4])
    const marketCap = marketCapUk > 0n ? marketCapUk * 100_000_000n : null

    // 거래량
    const volume = parseBigKrNum(tds[7])

    // PER
    const perRaw = tds[8]
    const per =
      perRaw && perRaw !== "N/A" && perRaw !== "-" ? parseKrNum(perRaw) || null : null

    results.push({
      ticker,
      name,
      exchange,
      price,
      previousClose: price - change,
      change,
      changePercent,
      volume,
      marketCap,
      per,
    })
  }

  return results
}

/**
 * 시장 요약 전체 수집 (모든 페이지 순회)
 * KOSPI: ~49페이지 (~2,450종목), KOSDAQ: ~37페이지 (~1,850종목)
 * 예상 소요: KOSPI ~30초, KOSDAQ ~22초 (200ms/page)
 */
export async function fetchNaverMarketData(
  market: "KOSPI" | "KOSDAQ"
): Promise<NaverStockData[]> {
  const sosok = market === "KOSPI" ? "0" : "1"
  const results: NaverStockData[] = []
  let page = 1

  while (true) {
    const html = await fetchEucKr(
      `https://finance.naver.com/sise/sise_market_sum.naver?sosok=${sosok}&page=${page}`
    )

    const pageData = parseMarketPage(html, market)
    if (pageData.length === 0) break

    results.push(...pageData)

    // 페이지네이션에서 최대 페이지 추출
    const pageNums = [...html.matchAll(/page=(\d+)/g)].map((m) => parseInt(m[1]))
    const maxPage = pageNums.length > 0 ? Math.max(...pageNums) : page
    if (page >= maxPage) break

    page++
    await new Promise((r) => setTimeout(r, 200))
  }

  return results
}

/**
 * NXT(시간외 거래) 가격 필터링
 * - 거래량 0인 종목은 시간외 데이터일 가능성 높음 → 제외
 * - KRX 정규장 시간(09:00-15:30 KST) 외 수집 시 안전장치
 */
function filterNxtPrices(data: NaverStockData[]): NaverStockData[] {
  return data.filter((item) => item.volume > 0n)
}

/**
 * 시장 요약 전체 수집 (NXT 필터링 포함)
 * Naver 시장 요약 페이지는 정규장 데이터 위주이나,
 * 장외 시간에 NXT 가격이 혼입될 수 있어 거래량 기반 필터 적용
 */
export async function fetchNaverMarketDataFiltered(
  market: "KOSPI" | "KOSDAQ"
): Promise<NaverStockData[]> {
  const raw = await fetchNaverMarketData(market)
  return filterNxtPrices(raw)
}

/**
 * 개별 종목 일별 OHLCV (Naver fchart API)
 * @param ticker 6자리 종목 코드
 * @param count 최근 N일
 */
export async function fetchNaverStockOhlcv(
  ticker: string,
  count = 30
): Promise<NaverOhlcv[]> {
  const url = `https://fchart.stock.naver.com/sise.nhn?symbol=${ticker}&timeframe=day&count=${count}&requestType=0`
  const xml = await withRetry(async () => {
    const res = await fetch(url, {
      headers: {
        Referer: "https://finance.naver.com/",
        "User-Agent": HEADERS["User-Agent"],
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`fchart HTTP ${res.status}`)
    const buf = await res.arrayBuffer()
    return new TextDecoder("euc-kr").decode(buf)
  }, { label: `fetchNaverStockOhlcv(${ticker})` })

  const results: NaverOhlcv[] = []
  // <item data="20260313|183500|186200|179900|183500|19566331" />
  const itemRe = /<item data="(\d{8})\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|(\d+)"/g
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null) {
    results.push({
      date: m[1],
      open: parseInt(m[2]),
      high: parseInt(m[3]),
      low: parseInt(m[4]),
      close: parseInt(m[5]),
      volume: BigInt(m[6]),
    })
  }
  return results
}

/**
 * KOSPI / KOSDAQ 지수 수집
 * 개별 요청으로 분리 — 합산 조회 시 장외 시간에 KOSDAQ 누락 이슈 방지
 */
export async function fetchNaverIndices(): Promise<NaverIndexData[]> {
  const indices = ["KOSPI", "KOSDAQ"] as const
  const nameMap = { KOSPI: "코스피", KOSDAQ: "코스닥" } as const

  const settled = await Promise.allSettled(
    indices.map(async (symbol) => {
      const url = `https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:${symbol}`
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10_000) })
      if (!res.ok) throw new Error(`Naver index ${symbol} HTTP ${res.status}`)

      const buf = await res.arrayBuffer()
      const json = JSON.parse(new TextDecoder("euc-kr").decode(buf))

      const datas: Record<string, unknown>[] =
        (json?.result?.areas ?? []).flatMap(
          (a: { datas?: unknown[] }) => a.datas ?? []
        )

      const d = datas.find((item) => String(item.cd) === symbol)
      if (!d) return null

      // Naver polling API returns nv/cv as ×100 integers (e.g. 540575 = 5405.75)
      const rawValue = Number(d.nv ?? 0)
      const rawChange = Number(d.cv ?? 0)
      if (!rawValue) return null

      return {
        symbol,
        name: nameMap[symbol],
        value: rawValue / 100,
        change: rawChange / 100,
        changePercent: Number(d.cr ?? 0),
      }
    })
  )

  const results: NaverIndexData[] = []
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) results.push(r.value)
  }
  return results
}

export interface NaverETFData {
  ticker: string
  name: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  volume: bigint
  nav: number | null
}

/**
 * Naver Finance ETF 목록 스크래핑
 * URL: https://finance.naver.com/sise/etf.naver
 */
export async function fetchNaverETFData(): Promise<NaverETFData[]> {
  const html = await fetchEucKr("https://finance.naver.com/sise/etf.naver")
  const results: NaverETFData[] = []

  // ETF 테이블 행 파싱: <a href="/item/main.naver?code=XXXXXX">ETF이름</a>
  const regex = /href="\/item\/main\.naver\?code=(\d{6})"[^>]*>([^<]+)</g
  let m: RegExpExecArray | null

  while ((m = regex.exec(html)) !== null) {
    const ticker = m[1]
    const name = m[2].trim()
    const pos = m.index

    // 이름 셀의 </td> 이후 데이터 셀들 추출
    const closeTd = html.indexOf("</td>", pos)
    if (closeTd === -1) continue
    const rowEnd = html.indexOf("</tr>", closeTd)
    if (rowEnd === -1) continue
    const dataPart = html.slice(closeTd + 5, rowEnd)

    const tds = [...dataPart.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((tm) =>
      tm[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )

    if (tds.length < 5) continue

    const price = parseKrNum(tds[0])
    if (price <= 0) continue

    // NAV (순자산가치)
    const nav = tds.length >= 2 ? parseKrNum(tds[1]) || null : null

    // 전일비
    const changeRaw = tds.length >= 3 ? tds[2] : "0"
    const isDown = changeRaw.includes("하락") || changeRaw.includes("하한") || changeRaw.includes("-")
    const change = parseKrNum(changeRaw) * (isDown ? -1 : 1)

    // 등락률
    const changePctRaw = tds.length >= 4 ? tds[3].replace("%", "").trim() : "0"
    const changePercent = Math.abs(parseKrNum(changePctRaw)) * (isDown ? -1 : 1)

    // 거래량
    const volume = tds.length >= 5 ? parseBigKrNum(tds[4]) : 0n

    results.push({
      ticker,
      name,
      price,
      previousClose: price - change,
      change,
      changePercent,
      volume,
      nav,
    })
  }

  return results
}

/**
 * 개별 종목 시세 페이지에서 52주 최고/최저 추출
 */
export async function fetchNaverStock52w(ticker: string): Promise<{ high52w: number; low52w: number } | null> {
  try {
    const html = await fetchEucKr(`https://finance.naver.com/item/sise.naver?code=${ticker}`)
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
    const m = text.match(/52주\s*최고\s*([\d,]+).*?52주\s*최저\s*([\d,]+)/)
    if (!m) return null
    return { high52w: parseKrNum(m[1]), low52w: parseKrNum(m[2]) }
  } catch (e) {
    console.error(`[naver] Error fetching 52w for ${ticker}:`, e)
    return null
  }
}

export interface NaverSector {
  code: string
  name: string
}

export interface NaverSectorStock {
  ticker: string
  sectorName: string
}

/**
 * Naver Finance 업종별 시세 페이지에서 업종 목록 수집
 */
export async function fetchNaverSectors(): Promise<NaverSector[]> {
  const html = await fetchEucKr("https://finance.naver.com/sise/sise_group.naver?type=upjong")
  const results: NaverSector[] = []
  const regex = /href="\/sise\/sise_group_detail\.naver\?type=upjong&no=(\d+)">([^<]+)/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) {
    results.push({ code: m[1], name: m[2].trim() })
  }
  return results
}

/**
 * 업종별 소속 종목 수집
 * @param sector 업종 코드와 이름
 */
async function fetchNaverSectorStocks(sector: NaverSector): Promise<NaverSectorStock[]> {
  const html = await fetchEucKr(
    `https://finance.naver.com/sise/sise_group_detail.naver?type=upjong&no=${sector.code}`
  )
  const results: NaverSectorStock[] = []
  const seen = new Set<string>()
  const regex = /code=(\d{6})[^>]*>([^<]+)/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) {
    const ticker = m[1]
    if (seen.has(ticker)) continue
    seen.add(ticker)
    results.push({ ticker, sectorName: sector.name })
  }
  return results
}

/**
 * 전체 업종별 종목 매핑 수집 (ticker → sectorName)
 * 5개 섹터씩 병렬 요청, 배치 간 200ms 딜레이
 * 예상 소요: ~20초 (79 업종 / 5 = 16 배치)
 */
export async function fetchNaverSectorMap(): Promise<Map<string, string>> {
  const sectors = await fetchNaverSectors()
  const map = new Map<string, string>()

  const CONCURRENT = 5
  for (let i = 0; i < sectors.length; i += CONCURRENT) {
    const batch = sectors.slice(i, i + CONCURRENT)
    const results = await Promise.allSettled(
      batch.map((sector) => fetchNaverSectorStocks(sector))
    )
    for (const r of results) {
      if (r.status === "fulfilled") {
        for (const s of r.value) {
          if (!map.has(s.ticker)) {
            map.set(s.ticker, s.sectorName)
          }
        }
      }
    }
    if (i + CONCURRENT < sectors.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return map
}

export interface NaverInstitutionalData {
  ticker: string
  date: string // YYYYMMDD
  foreignBuy: bigint
  foreignSell: bigint
  foreignNet: bigint
  institutionBuy: bigint
  institutionSell: bigint
  institutionNet: bigint
}

/**
 * 개별 종목 투자자별 매매동향 (외국인/기관)
 * URL: https://finance.naver.com/item/frgn.naver?code=XXXXXX
 * 테이블에서 최근 1일치 수급 데이터 추출
 */
export async function fetchNaverInstitutional(ticker: string): Promise<NaverInstitutionalData | null> {
  try {
    const html = await fetchEucKr(
      `https://finance.naver.com/item/frgn.naver?code=${ticker}&page=1`
    )

    // 테이블 행 파싱: 날짜 | 종가 | 전일비 | 등락률 | 거래량 | 기관순매매 | 외국인순매매 | ...
    // type04 테이블의 tbody 내 tr들
    const tableMatch = html.match(/class="type2"[\s\S]*?<\/table>/)
    if (!tableMatch) return null

    const tableHtml = tableMatch[0]
    const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]

    for (const row of rows) {
      const tds = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) =>
        m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      )

      // 날짜가 있는 행만 (YYYY.MM.DD 형식)
      if (tds.length < 7 || !/^\d{4}\.\d{2}\.\d{2}$/.test(tds[0])) continue

      const date = tds[0].replace(/\./g, "")

      // 기관 순매매량 (index 5), 외국인 순매매량 (index 6)
      const institutionNet = parseBigKrNum(tds[5])
      const foreignNet = parseBigKrNum(tds[6])

      // 부호 판별: 텍스트에 '-' 가 있으면 음수
      const instSign = tds[5].includes("-") ? -1n : 1n
      const foreignSign = tds[6].includes("-") ? -1n : 1n

      return {
        ticker,
        date,
        foreignBuy: 0n,
        foreignSell: 0n,
        foreignNet: foreignNet * foreignSign,
        institutionBuy: 0n,
        institutionSell: 0n,
        institutionNet: institutionNet * instSign,
      }
    }

    return null
  } catch (e) {
    console.error(`[naver] Error fetching institutional for ${ticker}:`, e)
    return null
  }
}

export interface NaverNewsItem {
  title: string
  url: string
  source: string
  publishedAt: string | null
}

/**
 * Naver Finance 주요뉴스 스크래핑
 */
export async function fetchNaverFinanceNews(maxItems = 30): Promise<NaverNewsItem[]> {
  const html = await fetchEucKr("https://finance.naver.com/news/mainnews.naver")
  const results: NaverNewsItem[] = []

  // 뉴스 리스트 아이템 파싱
  const regex = /<a\s+href="(\/news\/news_read\.naver\?[^"]+)"[^>]*>([\s\S]*?)<\/a>/g
  let m: RegExpExecArray | null
  const seenUrls = new Set<string>()

  while ((m = regex.exec(html)) !== null) {
    const relUrl = m[1]
    const title = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    if (!title || title.length < 5) continue

    const fullUrl = `https://finance.naver.com${relUrl}`
    if (seenUrls.has(fullUrl)) continue
    seenUrls.add(fullUrl)

    // 출처 추출: 같은 블록 내 .press 클래스
    const sourceMatch = html.slice(m.index, m.index + 500).match(/class="press"[^>]*>([^<]+)</)
    const source = sourceMatch ? sourceMatch[1].trim() : "네이버 금융"

    // 날짜 추출
    const dateMatch = html.slice(m.index, m.index + 500).match(/(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})/)
    const publishedAt = dateMatch ? dateMatch[1] : null

    results.push({ title, url: fullUrl, source, publishedAt })
    if (results.length >= maxItems) break
  }

  return results
}
