import { memo } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface IndexCardProps {
  name: string
  label?: string
  value: number
  change: number
  changePercent: number
  updatedAt?: string
  variant?: "compact" | "expanded"
  sparkline?: React.ReactNode
}

export const IndexCard = memo(function IndexCard({ name, label, value, change, changePercent, updatedAt, variant = "compact", sparkline }: IndexCardProps) {
  const isUp = change >= 0
  const isDown = change < 0
  const colorClass = isUp ? "text-stock-up" : isDown ? "text-stock-down" : "text-stock-flat"
  const bgClass = isUp ? "bg-stock-up-bg" : isDown ? "bg-stock-down-bg" : ""
  const sign = isUp ? "▲" : "▼"

  return (
    <Card className="transition-all hover:shadow-md active:scale-[0.98]">
      <CardContent className={cn("p-4", variant === "expanded" && "p-6")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground font-medium">{label ?? name}</p>
            <p className={cn("font-mono font-bold mt-1", variant === "compact" ? "text-xl" : "text-3xl")}>
              {value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={cn("inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-xs font-medium", colorClass, bgClass)}>
              <span>{sign}</span>
              <span>{Math.abs(change).toFixed(2)}</span>
              <span>({Math.abs(changePercent).toFixed(2)}%)</span>
            </div>
          </div>
          {sparkline && <div className="mt-3">{sparkline}</div>}
        </div>
      </CardContent>
    </Card>
  )
})
