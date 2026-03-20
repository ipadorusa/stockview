"use client"

import { useQuery } from "@tanstack/react-query"
import { ExternalLink } from "lucide-react"

interface DisclosureData {
  rceptNo: string
  reportName: string
  filerName: string | null
  rceptDate: string
  remark: string | null
  viewerUrl: string
}

interface DisclosureListProps {
  ticker: string
}

export function DisclosureList({ ticker }: DisclosureListProps) {
  const { data, isLoading } = useQuery<{ disclosures: DisclosureData[] }>({
    queryKey: ["disclosures", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/disclosures`)
      return res.json()
    },
    staleTime: 60 * 60 * 1000,
  })

  if (isLoading) return <div className="text-sm text-muted-foreground py-4">로딩 중...</div>
  if (!data?.disclosures?.length) {
    return <div className="text-center py-8 text-muted-foreground text-sm">공시 이력이 없습니다</div>
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
          {data.disclosures.map((d) => (
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
