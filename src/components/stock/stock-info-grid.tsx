import { TooltipHelper } from "@/components/common/tooltip-helper"
import { cn } from "@/lib/utils"

interface StockInfoGridProps {
  data: {
    open: number
    high: number
    low: number
    volume: number
    high52w?: number | null
    low52w?: number | null
    marketCap?: number | null
    per?: number | null
    pbr?: number | null
  }
  currentPrice?: number | null
  fundamental?: {
    eps: number | null
    dividendYield: number | null
    roe: number | null
    debtToEquity: number | null
    beta: number | null
    revenue: number | null
    netIncome: number | null
    employeeCount?: number | null
  } | null
  sectorAvg?: {
    per?: number | null
    pbr?: number | null
    roe?: number | null
    dividendYield?: number | null
  } | null
  currency?: "KRW" | "USD"
  stockType?: string | null
}

function fv(val: number | null | undefined, currency?: "KRW" | "USD") {
  if (val == null) return "-"
  if (currency === "KRW") return val.toLocaleString("ko-KR") + "원"
  if (currency === "USD") return "$" + val.toFixed(2)
  return val.toLocaleString()
}

function fVol(v: number) {
  if (v >= 100000000) return (v / 100000000).toFixed(1) + "억주"
  if (v >= 10000) return (v / 10000).toFixed(1) + "만주"
  return v.toLocaleString() + "주"
}

function fMCap(v: number | null | undefined) {
  if (!v) return "-"
  if (v >= 1000000000000) return (v / 1000000000000).toFixed(1) + "조원"
  if (v >= 100000000) return (v / 100000000).toFixed(0) + "억원"
  return v.toLocaleString() + "원"
}

function fBigMoney(v: number | null | undefined) {
  if (!v) return "-"
  if (Math.abs(v) >= 1_000_000_000_000) return (v / 1_000_000_000_000).toFixed(1) + "조"
  if (Math.abs(v) >= 100_000_000) return (v / 100_000_000).toFixed(0) + "억"
  if (Math.abs(v) >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B"
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(0) + "M"
  return v.toLocaleString()
}

function fPercent(v: number | null | undefined) {
  if (v == null) return "-"
  return (v * 100).toFixed(2) + "%"
}

function Range52w({ low, high, current, currency }: {
  low: number; high: number; current: number; currency: "KRW" | "USD"
}) {
  const range = high - low
  const position = range > 0 ? ((current - low) / range) * 100 : 50

  return (
    <div className="col-span-2 bg-muted/50 rounded-lg p-3">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-muted-foreground">52주 범위</span>
        <TooltipHelper
          term="52주범위"
          description="최근 52주(1년) 동안의 최저가와 최고가 범위에서 현재 가격의 위치를 보여줘요."
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span className="font-mono">{fv(low, currency)}</span>
        <span className="font-mono">{fv(high, currency)}</span>
      </div>
      <div className="relative h-1.5 bg-muted rounded-full">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-stock-down to-stock-up"
          style={{ width: "100%" }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full border-2 border-background shadow-sm"
          style={{ left: `calc(${Math.min(Math.max(position, 2), 98)}% - 6px)` }}
        />
      </div>
      <p className="text-center text-xs font-mono font-medium mt-1">
        현재 {fv(current, currency)}
      </p>
    </div>
  )
}

interface GridItem {
  label: string
  value: string
  wide?: boolean
  tooltip?: string
  rawValue?: number | null
  sectorAvgValue?: number | null
}

export function StockInfoGrid({ data, currentPrice, fundamental, sectorAvg, currency = "KRW", stockType }: StockInfoGridProps) {
  const isETF = stockType === "ETF"
  const has52w = data.high52w != null && data.low52w != null && currentPrice != null

  const items: GridItem[] = [
    { label: "시가", value: fv(data.open, currency) },
    { label: "고가", value: fv(data.high, currency) },
    { label: "저가", value: fv(data.low, currency) },
    { label: "거래량", value: fVol(data.volume) },
    { label: "시가총액", value: fMCap(data.marketCap), wide: true },
    ...(!isETF ? [
      {
        label: "PER", value: data.per != null ? data.per.toFixed(2) : "-",
        tooltip: "PER", rawValue: data.per, sectorAvgValue: sectorAvg?.per,
      },
      {
        label: "PBR", value: data.pbr != null ? data.pbr.toFixed(2) : "-",
        tooltip: "PBR", rawValue: data.pbr, sectorAvgValue: sectorAvg?.pbr,
      },
    ] : []),
  ]

  if (fundamental) {
    items.push(
      { label: "EPS", value: fundamental.eps != null ? fundamental.eps.toFixed(2) : "-", tooltip: "EPS" },
      {
        label: "배당수익률", value: fPercent(fundamental.dividendYield),
        tooltip: "배당수익률", rawValue: fundamental.dividendYield != null ? fundamental.dividendYield * 100 : null,
        sectorAvgValue: sectorAvg?.dividendYield != null ? sectorAvg.dividendYield * 100 : null,
      },
      {
        label: "ROE", value: fPercent(fundamental.roe),
        tooltip: "ROE", rawValue: fundamental.roe != null ? fundamental.roe * 100 : null,
        sectorAvgValue: sectorAvg?.roe != null ? sectorAvg.roe * 100 : null,
      },
      {
        label: "부채비율",
        value: fundamental.debtToEquity != null ? fundamental.debtToEquity.toFixed(1) + "%" : "-",
        tooltip: "부채비율", rawValue: fundamental.debtToEquity,
      },
      { label: "베타", value: fundamental.beta != null ? fundamental.beta.toFixed(2) : "-", tooltip: "베타" },
      { label: "매출", value: fBigMoney(fundamental.revenue) },
      { label: "순이익", value: fBigMoney(fundamental.netIncome) },
    )
    if (fundamental.employeeCount) {
      items.push({ label: "직원수", value: fundamental.employeeCount.toLocaleString() + "명" })
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {has52w && (
        <Range52w
          low={data.low52w!}
          high={data.high52w!}
          current={currentPrice!}
          currency={currency}
        />
      )}
      {items.map((item) => (
        <div key={item.label} className={cn("bg-muted/50 rounded-lg p-3", item.wide && "col-span-2")}>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            {item.tooltip && (
              <TooltipHelper
                term={item.tooltip}
                value={item.rawValue}
                sectorAvg={item.sectorAvgValue}
              />
            )}
          </div>
          <p className="font-mono font-medium text-sm mt-0.5">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
