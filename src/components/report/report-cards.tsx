import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function MetricCard({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className={cn("text-sm font-semibold", valueClassName)}>{value}</div>
      </CardContent>
    </Card>
  )
}

export function TechnicalCard({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: string
}) {
  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{status}</div>
      </CardContent>
    </Card>
  )
}

export function ValuationRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 text-muted-foreground">{label}</td>
      <td className="py-1.5 text-right font-medium">{value}</td>
    </tr>
  )
}
