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
  fundamental?: {
    eps: number | null
    dividendYield: number | null
    roe: number | null
    debtToEquity: number | null
    beta: number | null
    revenue: number | null
    netIncome: number | null
  } | null
  currency?: "KRW" | "USD"
  stockType?: string | null
}

const TERMS: Record<string, string> = {
  PER: "주가수익비율(PER)은 주가를 주당순이익으로 나눈 값이에요. 낮을수록 저평가로 볼 수 있어요.",
  PBR: "주가순자산비율(PBR)은 주가를 주당순자산가치로 나눈 값이에요. 1보다 낮으면 자산보다 싸게 거래되는 것을 의미해요.",
  EPS: "주당순이익(EPS)은 기업의 순이익을 발행주식수로 나눈 값이에요.",
  ROE: "자기자본이익률(ROE)은 자기자본 대비 순이익 비율이에요. 높을수록 효율적으로 이익을 내는 기업이에요.",
  배당수익률: "배당수익률은 주가 대비 배당금의 비율이에요.",
  부채비율: "부채비율은 총부채를 자기자본으로 나눈 값이에요. 낮을수록 재무 안정성이 높아요.",
  베타: "베타는 시장 대비 주가 변동성을 나타내요. 1보다 크면 시장보다 변동이 크고, 작으면 안정적이에요.",
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

export function StockInfoGrid({ data, fundamental, currency = "KRW", stockType }: StockInfoGridProps) {
  const isETF = stockType === "ETF"
  const items = [
    { label: "시가", value: fv(data.open, currency) },
    { label: "고가", value: fv(data.high, currency) },
    { label: "저가", value: fv(data.low, currency) },
    { label: "거래량", value: fVol(data.volume) },
    { label: "52주 최고", value: fv(data.high52w, currency) },
    { label: "52주 최저", value: fv(data.low52w, currency) },
    { label: "시가총액", value: fMCap(data.marketCap), wide: true },
    ...(!isETF ? [
      { label: "PER", value: data.per != null ? data.per.toFixed(2) : "-", tooltip: "PER" },
      { label: "PBR", value: data.pbr != null ? data.pbr.toFixed(2) : "-", tooltip: "PBR" },
    ] : []),
  ]

  if (fundamental) {
    items.push(
      { label: "EPS", value: fundamental.eps != null ? fundamental.eps.toFixed(2) : "-", tooltip: "EPS" },
      { label: "배당수익률", value: fPercent(fundamental.dividendYield), tooltip: "배당수익률" },
      { label: "ROE", value: fPercent(fundamental.roe), tooltip: "ROE" },
      { label: "부채비율", value: fundamental.debtToEquity != null ? fundamental.debtToEquity.toFixed(1) + "%" : "-", tooltip: "부채비율" },
      { label: "베타", value: fundamental.beta != null ? fundamental.beta.toFixed(2) : "-", tooltip: "베타" },
      { label: "매출", value: fBigMoney(fundamental.revenue), wide: false },
      { label: "순이익", value: fBigMoney(fundamental.netIncome), wide: false },
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className={cn("bg-muted/50 rounded-lg p-3", item.wide && "col-span-2")}>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            {item.tooltip && <TooltipHelper term={item.tooltip} description={TERMS[item.tooltip] ?? ""} />}
          </div>
          <p className="font-mono font-medium text-sm mt-0.5">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
