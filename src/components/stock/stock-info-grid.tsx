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
  currency?: "KRW" | "USD"
}

const TERMS: Record<string, string> = {
  PER: "주가수익비율(PER)은 주가를 주당순이익으로 나눈 값이에요. 낮을수록 저평가로 볼 수 있어요.",
  PBR: "주가순자산비율(PBR)은 주가를 주당순자산가치로 나눈 값이에요. 1보다 낮으면 자산보다 싸게 거래되는 것을 의미해요.",
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

export function StockInfoGrid({ data, currency = "KRW" }: StockInfoGridProps) {
  const items = [
    { label: "시가", value: fv(data.open, currency) },
    { label: "고가", value: fv(data.high, currency) },
    { label: "저가", value: fv(data.low, currency) },
    { label: "거래량", value: fVol(data.volume) },
    { label: "52주 최고", value: fv(data.high52w, currency) },
    { label: "52주 최저", value: fv(data.low52w, currency) },
    { label: "시가총액", value: fMCap(data.marketCap), wide: true },
    { label: "PER", value: data.per != null ? data.per.toFixed(2) : "-", tooltip: "PER" },
    { label: "PBR", value: data.pbr != null ? data.pbr.toFixed(2) : "-", tooltip: "PBR" },
  ]

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
