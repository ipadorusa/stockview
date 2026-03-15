import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // ─── 한국 주식 종목 마스터 ───
  const krStocks = [
    { ticker: "005930", name: "삼성전자", nameEn: "Samsung Electronics", market: "KR" as const, exchange: "KOSPI", sector: "반도체" },
    { ticker: "000660", name: "SK하이닉스", nameEn: "SK Hynix", market: "KR" as const, exchange: "KOSPI", sector: "반도체" },
    { ticker: "035420", name: "NAVER", nameEn: "NAVER Corporation", market: "KR" as const, exchange: "KOSPI", sector: "인터넷" },
    { ticker: "035720", name: "카카오", nameEn: "Kakao Corp", market: "KR" as const, exchange: "KOSPI", sector: "인터넷" },
    { ticker: "005380", name: "현대차", nameEn: "Hyundai Motor", market: "KR" as const, exchange: "KOSPI", sector: "자동차" },
    { ticker: "000270", name: "기아", nameEn: "Kia Corporation", market: "KR" as const, exchange: "KOSPI", sector: "자동차" },
    { ticker: "051910", name: "LG화학", nameEn: "LG Chem", market: "KR" as const, exchange: "KOSPI", sector: "화학" },
    { ticker: "006400", name: "삼성SDI", nameEn: "Samsung SDI", market: "KR" as const, exchange: "KOSPI", sector: "배터리" },
    { ticker: "068270", name: "셀트리온", nameEn: "Celltrion", market: "KR" as const, exchange: "KOSPI", sector: "바이오" },
    { ticker: "207940", name: "삼성바이오로직스", nameEn: "Samsung Biologics", market: "KR" as const, exchange: "KOSPI", sector: "바이오" },
    { ticker: "086790", name: "하나금융지주", nameEn: "Hana Financial", market: "KR" as const, exchange: "KOSPI", sector: "금융" },
    { ticker: "105560", name: "KB금융", nameEn: "KB Financial", market: "KR" as const, exchange: "KOSPI", sector: "금융" },
    { ticker: "028260", name: "삼성물산", nameEn: "Samsung C&T", market: "KR" as const, exchange: "KOSPI", sector: "건설" },
    { ticker: "066570", name: "LG전자", nameEn: "LG Electronics", market: "KR" as const, exchange: "KOSPI", sector: "전자" },
    { ticker: "032830", name: "삼성생명", nameEn: "Samsung Life", market: "KR" as const, exchange: "KOSPI", sector: "보험" },
    // KOSDAQ
    { ticker: "247540", name: "에코프로비엠", nameEn: "EcoPro BM", market: "KR" as const, exchange: "KOSDAQ", sector: "배터리" },
    { ticker: "086520", name: "에코프로", nameEn: "EcoPro", market: "KR" as const, exchange: "KOSDAQ", sector: "배터리" },
    { ticker: "041510", name: "SM엔터테인먼트", nameEn: "SM Entertainment", market: "KR" as const, exchange: "KOSDAQ", sector: "엔터테인먼트" },
    { ticker: "035900", name: "JYP Ent.", nameEn: "JYP Entertainment", market: "KR" as const, exchange: "KOSDAQ", sector: "엔터테인먼트" },
    { ticker: "352820", name: "하이브", nameEn: "HYBE", market: "KR" as const, exchange: "KOSPI", sector: "엔터테인먼트" },
  ]

  // ─── 미국 주식 종목 마스터 ───
  const usStocks = [
    { ticker: "AAPL", name: "Apple Inc.", market: "US" as const, exchange: "NASDAQ", sector: "Technology" },
    { ticker: "MSFT", name: "Microsoft Corp.", market: "US" as const, exchange: "NASDAQ", sector: "Technology" },
    { ticker: "GOOGL", name: "Alphabet Inc.", market: "US" as const, exchange: "NASDAQ", sector: "Technology" },
    { ticker: "AMZN", name: "Amazon.com Inc.", market: "US" as const, exchange: "NASDAQ", sector: "E-Commerce" },
    { ticker: "NVDA", name: "NVIDIA Corp.", market: "US" as const, exchange: "NASDAQ", sector: "Semiconductors" },
    { ticker: "META", name: "Meta Platforms Inc.", market: "US" as const, exchange: "NASDAQ", sector: "Social Media" },
    { ticker: "TSLA", name: "Tesla Inc.", market: "US" as const, exchange: "NASDAQ", sector: "Electric Vehicles" },
    { ticker: "BRK.B", name: "Berkshire Hathaway B", market: "US" as const, exchange: "NYSE", sector: "Financials" },
    { ticker: "JPM", name: "JPMorgan Chase & Co.", market: "US" as const, exchange: "NYSE", sector: "Banking" },
    { ticker: "V", name: "Visa Inc.", market: "US" as const, exchange: "NYSE", sector: "Payments" },
    { ticker: "JNJ", name: "Johnson & Johnson", market: "US" as const, exchange: "NYSE", sector: "Healthcare" },
    { ticker: "WMT", name: "Walmart Inc.", market: "US" as const, exchange: "NYSE", sector: "Retail" },
    { ticker: "XOM", name: "Exxon Mobil Corp.", market: "US" as const, exchange: "NYSE", sector: "Energy" },
    { ticker: "MA", name: "Mastercard Inc.", market: "US" as const, exchange: "NYSE", sector: "Payments" },
    { ticker: "AVGO", name: "Broadcom Inc.", market: "US" as const, exchange: "NASDAQ", sector: "Semiconductors" },
    { ticker: "PG", name: "Procter & Gamble Co.", market: "US" as const, exchange: "NYSE", sector: "Consumer Goods" },
    { ticker: "HD", name: "Home Depot Inc.", market: "US" as const, exchange: "NYSE", sector: "Retail" },
    { ticker: "COST", name: "Costco Wholesale Corp.", market: "US" as const, exchange: "NASDAQ", sector: "Retail" },
    { ticker: "NFLX", name: "Netflix Inc.", market: "US" as const, exchange: "NASDAQ", sector: "Streaming" },
    { ticker: "AMD", name: "Advanced Micro Devices", market: "US" as const, exchange: "NASDAQ", sector: "Semiconductors" },
  ]

  // Upsert stocks
  for (const stock of [...krStocks, ...usStocks]) {
    await prisma.stock.upsert({
      where: { ticker: stock.ticker },
      update: stock,
      create: stock,
    })
  }
  console.log(`✅ ${krStocks.length + usStocks.length}개 종목 시딩 완료`)

  // ─── 샘플 시세 데이터 ───
  const sampleQuotes = [
    { ticker: "005930", price: 72400, previousClose: 70800, change: 1600, changePercent: 2.26, open: 71200, high: 72800, low: 70900, volume: 12300000n, marketCap: 432000000000000n, high52w: 78200, low52w: 58400, per: 12.5, pbr: 1.3 },
    { ticker: "000660", price: 182500, previousClose: 178000, change: 4500, changePercent: 2.53, open: 179000, high: 183000, low: 178500, volume: 3200000n, high52w: 210000, low52w: 145000, per: 18.2, pbr: 1.8 },
    { ticker: "035420", price: 198500, previousClose: 195000, change: 3500, changePercent: 1.79, open: 196000, high: 199500, low: 195500, volume: 980000n, high52w: 245000, low52w: 168000, per: 28.4, pbr: 2.1 },
    { ticker: "035720", price: 42350, previousClose: 41800, change: 550, changePercent: 1.32, open: 42000, high: 42500, low: 41700, volume: 2100000n, high52w: 55000, low52w: 35000, per: 32.1, pbr: 1.5 },
    { ticker: "005380", price: 215000, previousClose: 212000, change: 3000, changePercent: 1.42, open: 213000, high: 216000, low: 212500, volume: 450000n, high52w: 260000, low52w: 185000, per: 8.9, pbr: 0.8 },
    { ticker: "AAPL", price: 189.84, previousClose: 188.32, change: 1.52, changePercent: 0.81, open: 188.5, high: 190.2, low: 188.1, volume: 52000000n, marketCap: 2920000000000n, high52w: 199.62, low52w: 164.08, per: 29.4, pbr: 46.2 },
    { ticker: "MSFT", price: 415.32, previousClose: 412.18, change: 3.14, changePercent: 0.76, open: 412.5, high: 416.8, low: 411.9, volume: 18000000n, high52w: 430.82, low52w: 309.45, per: 35.2, pbr: 12.8 },
    { ticker: "NVDA", price: 875.40, previousClose: 862.00, change: 13.40, changePercent: 1.55, open: 865.0, high: 879.5, low: 861.2, volume: 42000000n, high52w: 974.00, low52w: 455.29, per: 65.3, pbr: 35.1 },
    { ticker: "TSLA", price: 177.58, previousClose: 182.00, change: -4.42, changePercent: -2.43, open: 181.5, high: 182.3, low: 176.8, volume: 85000000n, high52w: 278.98, low52w: 138.80, per: 42.1, pbr: 8.9 },
    { ticker: "AMZN", price: 184.72, previousClose: 182.50, change: 2.22, changePercent: 1.22, open: 183.0, high: 185.3, low: 182.4, volume: 35000000n, high52w: 201.20, low52w: 151.61, per: 44.8, pbr: 8.2 },
  ]

  for (const q of sampleQuotes) {
    const stock = await prisma.stock.findUnique({ where: { ticker: q.ticker } })
    if (!stock) continue
    await prisma.stockQuote.upsert({
      where: { stockId: stock.id },
      update: {
        price: q.price, previousClose: q.previousClose, change: q.change,
        changePercent: q.changePercent, open: q.open, high: q.high, low: q.low,
        volume: q.volume, marketCap: q.marketCap ?? null,
        high52w: q.high52w ?? null, low52w: q.low52w ?? null,
        per: q.per ?? null, pbr: q.pbr ?? null,
      },
      create: {
        stockId: stock.id,
        price: q.price, previousClose: q.previousClose, change: q.change,
        changePercent: q.changePercent, open: q.open, high: q.high, low: q.low,
        volume: q.volume, marketCap: q.marketCap ?? null,
        high52w: q.high52w ?? null, low52w: q.low52w ?? null,
        per: q.per ?? null, pbr: q.pbr ?? null,
      },
    })
  }
  console.log(`✅ ${sampleQuotes.length}개 시세 시딩 완료`)

  // ─── 주요 지수 ───
  const indices = [
    { symbol: "KOSPI", name: "코스피", value: 2847.52, change: 33.81, changePercent: 1.20 },
    { symbol: "KOSDAQ", name: "코스닥", value: 892.15, change: 7.12, changePercent: 0.80 },
    { symbol: "SPX", name: "S&P 500", value: 5234.18, change: -15.72, changePercent: -0.30 },
    { symbol: "IXIC", name: "나스닥", value: 16742.39, change: 83.71, changePercent: 0.50 },
  ]

  for (const idx of indices) {
    await prisma.marketIndex.upsert({
      where: { symbol: idx.symbol },
      update: idx,
      create: idx,
    })
  }
  console.log(`✅ ${indices.length}개 지수 시딩 완료`)

  // ─── 환율 ───
  await prisma.exchangeRate.upsert({
    where: { pair: "USD/KRW" },
    update: { rate: 1342.50, change: 2.30, changePercent: 0.17 },
    create: { pair: "USD/KRW", rate: 1342.50, change: 2.30, changePercent: 0.17 },
  })
  console.log(`✅ 환율 시딩 완료`)

  // ─── 샘플 뉴스 ───
  const sampleNews = [
    {
      title: "삼성전자, 2분기 실적 개선 전망...반도체 업황 회복 기대",
      summary: "증권가는 삼성전자의 2분기 실적이 전분기 대비 크게 개선될 것으로 전망하고 있다. HBM 수요 증가와 메모리 가격 상승이 주요 요인으로 꼽힌다.",
      source: "한국경제",
      url: "https://example.com/news/1",
      category: "KR_MARKET" as const,
      publishedAt: new Date(Date.now() - 30 * 60 * 1000),
      relatedTickers: ["005930"],
    },
    {
      title: "NVIDIA, AI 수요 급증에 시가총액 3조 달러 돌파",
      summary: "NVIDIA의 주가가 AI 관련 수요 급증으로 사상 최고치를 경신하며 시가총액이 3조 달러를 넘어섰다.",
      source: "Reuters",
      url: "https://example.com/news/2",
      category: "US_MARKET" as const,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      relatedTickers: ["NVDA"],
    },
    {
      title: "코스피, 외국인 순매수에 2,847포인트 마감",
      summary: "코스피지수가 외국인 투자자의 순매수에 힘입어 전일 대비 1.2% 상승한 2,847포인트로 마감했다.",
      source: "매일경제",
      url: "https://example.com/news/3",
      category: "KR_MARKET" as const,
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      relatedTickers: [],
    },
    {
      title: "Fed, 금리 동결 결정...연내 인하 가능성 시사",
      summary: "미 연방준비제도가 이번 달 금리를 동결하기로 결정했다. 제롬 파월 의장은 인플레이션이 목표치로 수렴하면 연내 인하를 검토할 것이라고 밝혔다.",
      source: "Bloomberg",
      url: "https://example.com/news/4",
      category: "ECONOMY" as const,
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      relatedTickers: [],
    },
    {
      title: "배터리 업계, 전기차 수요 둔화로 실적 부진",
      summary: "LG에너지솔루션, 삼성SDI 등 국내 배터리 업체들이 전기차 수요 둔화로 올해 1분기 실적이 기대치를 밑돌았다.",
      source: "조선비즈",
      url: "https://example.com/news/5",
      category: "INDUSTRY" as const,
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      relatedTickers: ["006400"],
    },
  ]

  for (const newsItem of sampleNews) {
    const { relatedTickers, ...newsData } = newsItem
    const news = await prisma.news.upsert({
      where: { url: newsData.url },
      update: newsData,
      create: newsData,
    })

    for (const ticker of relatedTickers) {
      const stock = await prisma.stock.findUnique({ where: { ticker } })
      if (!stock) continue
      await prisma.stockNews.upsert({
        where: { stockId_newsId: { stockId: stock.id, newsId: news.id } },
        update: {},
        create: { stockId: stock.id, newsId: news.id },
      }).catch(() => {}) // ignore duplicates
    }
  }
  console.log(`✅ ${sampleNews.length}개 뉴스 시딩 완료`)

  console.log("🎉 시딩 완료!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
