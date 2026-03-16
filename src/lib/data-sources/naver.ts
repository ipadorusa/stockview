/**
 * Naver Finance 비공식 클라이언트
 * KRX data.krx.co.kr이 JS 세션 인증을 요구하여 Naver Finance로 대체
 * SLA 없음 — 모든 호출은 try/catch로 감싸서 사용할 것
 */

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

async function fetchEucKr(url: string, timeoutMs = 20_000): Promise<string> {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`Naver HTTP ${res.status}: ${url}`)
  const buf = await res.arrayBuffer()
  return new TextDecoder("euc-kr").decode(buf)
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
    const changePercent = parseKrNum(changePctRaw) * (changePctRaw.startsWith("-") ? -1 : 1)

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
 * 개별 종목 일별 OHLCV (Naver fchart API)
 * @param ticker 6자리 종목 코드
 * @param count 최근 N일
 */
export async function fetchNaverStockOhlcv(
  ticker: string,
  count = 30
): Promise<NaverOhlcv[]> {
  const url = `https://fchart.stock.naver.com/sise.nhn?symbol=${ticker}&timeframe=day&count=${count}&requestType=0`
  const res = await fetch(url, {
    headers: {
      Referer: "https://finance.naver.com/",
      "User-Agent": HEADERS["User-Agent"],
    },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`fchart HTTP ${res.status}`)

  const buf = await res.arrayBuffer()
  const xml = new TextDecoder("euc-kr").decode(buf)

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
 */
export async function fetchNaverIndices(): Promise<NaverIndexData[]> {
  const url =
    "https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:KOSPI,SERVICE_INDEX:KOSDAQ"
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Naver index HTTP ${res.status}`)

  const buf = await res.arrayBuffer()
  const json = JSON.parse(new TextDecoder("euc-kr").decode(buf))

  const datas: Record<string, unknown>[] =
    (json?.result?.areas ?? []).flatMap(
      (a: { datas?: unknown[] }) => a.datas ?? []
    )

  return datas
    .map((d) => {
      const cd = String(d.cd ?? "")
      if (cd !== "KOSPI" && cd !== "KOSDAQ") return null
      return {
        symbol: cd,
        name: cd === "KOSPI" ? "코스피" : "코스닥",
        value: Number(d.nv ?? 0),
        change: Number(d.cv ?? 0),
        changePercent: Number(d.cr ?? 0),
      }
    })
    .filter((x): x is NaverIndexData => x !== null)
}
