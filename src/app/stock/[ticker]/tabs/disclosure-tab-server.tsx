import { getStockDisclosures } from "@/lib/queries/stock-queries"
import { ExternalLink } from "lucide-react"

interface Props {
  ticker: string
}

export async function DisclosureTabServer({ ticker }: Props) {
  const disclosures = await getStockDisclosures(ticker)

  if (!disclosures.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">공시 이력이 없습니다</div>
    )
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">접수일</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">보고서명</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">제출인</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">비고</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {disclosures.map((d) => (
            <tr key={d.rceptNo} className="hover:bg-accent/30">
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{d.rceptDate}</td>
              <td className="px-3 py-2 text-xs">
                <a
                  href={d.viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {d.reportName}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{d.filerName ?? "-"}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{d.remark ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
