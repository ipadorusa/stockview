"use client"

import { useQuery } from "@tanstack/react-query"

interface DividendData {
  exDate: string
  payDate: string | null
  amount: number
  currency: string
}

interface DividendHistoryProps {
  ticker: string
}

export function DividendHistory({ ticker }: DividendHistoryProps) {
  const { data, isLoading } = useQuery<{ dividends: DividendData[] }>({
    queryKey: ["dividends", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/dividends`)
      return res.json()
    },
    staleTime: 24 * 60 * 60 * 1000,
  })

  if (isLoading) return <div className="text-sm text-muted-foreground py-4">로딩 중...</div>
  if (!data?.dividends?.length) {
    return <div className="text-center py-8 text-muted-foreground text-sm">배당 이력이 없습니다</div>
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm min-w-[400px]">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">배당락일</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">지급일</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">배당금</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.dividends.map((d) => (
            <tr key={d.exDate} className="hover:bg-accent/30">
              <td className="px-3 py-2 font-mono text-xs">{d.exDate}</td>
              <td className="px-3 py-2 font-mono text-xs">{d.payDate ?? "-"}</td>
              <td className="px-3 py-2 text-right font-mono text-xs">
                {d.currency === "KRW"
                  ? d.amount.toLocaleString("ko-KR") + "원"
                  : "$" + d.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
