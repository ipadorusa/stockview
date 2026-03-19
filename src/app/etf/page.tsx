import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { StockRow } from "@/components/market/stock-row"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ETF - StockView",
  description: "한국/미국 ETF 목록과 시세를 확인하세요",
  openGraph: {
    title: "ETF - StockView",
    description: "한국/미국 ETF 목록과 시세를 확인하세요",
  },
}

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

interface ETFItem {
  ticker: string
  name: string
  market: string
  price: number
  change: number
  changePercent: number
  tradingValue?: number
}

async function getETFs(market: "KR" | "US") {
  try {
    const res = await fetch(`${BASE}/api/etf/popular?market=${market}&limit=30`, { next: { revalidate: 900 } })
    if (!res.ok) return { results: [], updatedAt: null }
    return res.json()
  } catch {
    return { results: [], updatedAt: null }
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default async function ETFPage() {
  const [krData, usData] = await Promise.all([getETFs("KR"), getETFs("US")])

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-6">ETF</h1>

      <Tabs defaultValue="kr">
        <TabsList className="mb-4">
          <TabsTrigger value="kr">한국 ETF</TabsTrigger>
          <TabsTrigger value="us">미국 ETF</TabsTrigger>
        </TabsList>

        <TabsContent value="kr">
          <p className="text-xs text-muted-foreground mb-2">
            거래대금 기준{krData.updatedAt ? ` · ${formatDate(krData.updatedAt)} 기준` : ""}
          </p>
          <div className="divide-y rounded-lg border overflow-hidden">
            {krData.results.length > 0 ? (
              krData.results.map((etf: ETFItem, i: number) => (
                <StockRow
                  key={etf.ticker}
                  ticker={etf.ticker}
                  name={etf.name}
                  price={etf.price}
                  change={etf.change}
                  changePercent={etf.changePercent}
                  market={etf.market as "KR" | "US"}
                  stockType="ETF"
                  rank={i + 1}
                  tradingValue={etf.tradingValue}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="us">
          <p className="text-xs text-muted-foreground mb-2">
            거래대금 기준{usData.updatedAt ? ` · ${formatDate(usData.updatedAt)} 기준` : ""}
          </p>
          <div className="divide-y rounded-lg border overflow-hidden">
            {usData.results.length > 0 ? (
              usData.results.map((etf: ETFItem, i: number) => (
                <StockRow
                  key={etf.ticker}
                  ticker={etf.ticker}
                  name={etf.name}
                  price={etf.price}
                  change={etf.change}
                  changePercent={etf.changePercent}
                  market={etf.market as "KR" | "US"}
                  stockType="ETF"
                  rank={i + 1}
                  tradingValue={etf.tradingValue}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
