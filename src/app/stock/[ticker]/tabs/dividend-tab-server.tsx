import { getStockDividends } from "@/lib/queries/stock-queries"

interface Props {
  ticker: string
}

export async function DividendTabServer({ ticker }: Props) {
  const dividends = await getStockDividends(ticker)

  if (!dividends.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        배당 이력이 없습니다. 미배당 종목이거나 데이터 수집 중입니다.
      </div>
    )
  }

  const latestWithDart = dividends.find((d) => d.dividendYield != null || d.payoutRatio != null)
  const hasOpenDartData = dividends.some((d) => d.dividendYield != null || d.payoutRatio != null)

  return (
    <div className="space-y-4">
      {latestWithDart && (
        <div className="grid grid-cols-2 gap-3">
          {latestWithDart.dividendYield != null && (
            <div className="bg-muted/50 rounded-lg p-3">
              <span className="text-xs text-muted-foreground">배당수익률</span>
              <p className="font-mono font-medium text-sm mt-0.5">
                {latestWithDart.dividendYield.toFixed(2)}%
              </p>
            </div>
          )}
          {latestWithDart.payoutRatio != null && (
            <div className="bg-muted/50 rounded-lg p-3">
              <span className="text-xs text-muted-foreground">배당성향</span>
              <p className="font-mono font-medium text-sm mt-0.5">
                {latestWithDart.payoutRatio.toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">배당락일</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">지급일</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">배당금</th>
              {hasOpenDartData && (
                <>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">수익률</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">배당성향</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {dividends.map((d) => (
              <tr key={d.exDate} className="hover:bg-accent/30">
                <td className="px-3 py-2 font-mono text-xs">{d.exDate}</td>
                <td className="px-3 py-2 font-mono text-xs">{d.payDate ?? "-"}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {d.currency === "KRW"
                    ? d.amount.toLocaleString("ko-KR") + "원"
                    : "$" + d.amount.toFixed(2)}
                </td>
                {hasOpenDartData && (
                  <>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {d.dividendYield != null ? `${d.dividendYield.toFixed(2)}%` : "-"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {d.payoutRatio != null ? `${d.payoutRatio.toFixed(2)}%` : "-"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
