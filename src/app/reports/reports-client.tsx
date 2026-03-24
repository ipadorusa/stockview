"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SIGNAL_LABELS, VERDICT_STYLES, stripReportHeaders, getKSTDateString } from "@/lib/ai-report"

type MarketFilter = "all" | "KR" | "US"

interface Report {
  id: string
  slug: string
  title: string
  summary: string
  verdict: string
  signal: string
  reportDate: string
  createdAt: string
  stock: { ticker: string; name: string; market: string }
}

export function ReportsClient({
  initialReports,
  initialTotalPages,
}: {
  initialReports: Report[]
  initialTotalPages: number
}) {
  const [market, setMarket] = useState<MarketFilter>("all")
  const [reports, setReports] = useState(initialReports)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(initialTotalPages)

  const filtered = market === "all" ? reports : reports.filter((r) => r.stock.market === market)

  async function fetchReports(newPage: number, newMarket: MarketFilter) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(newPage), limit: "20" })
      if (newMarket !== "all") params.set("market", newMarket)
      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()
      setReports(data.reports)
      setTotalPages(data.pagination.totalPages)
      setPage(newPage)
    } finally {
      setLoading(false)
    }
  }

  function handleMarketChange(m: MarketFilter) {
    setMarket(m)
    fetchReports(1, m)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">AI 종목 분석 리포트</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI가 기술적 시그널을 감지한 종목을 분석합니다. 매일 업데이트됩니다.
          </p>
        </div>
        <div className="flex gap-1">
          {(["all", "KR", "US"] as const).map((m) => (
            <Button
              key={m}
              variant={market === m ? "default" : "outline"}
              size="sm"
              onClick={() => handleMarketChange(m)}
            >
              {m === "all" ? "전체" : m}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">날짜</th>
                <th className="px-3 py-2 text-left font-medium">종목</th>
                <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">시그널</th>
                <th className="px-3 py-2 text-left font-medium">의견</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">요약</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", loading && "opacity-50")}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                    리포트가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((report) => {
                  const kstDate = getKSTDateString(new Date(report.reportDate))
                  const month = parseInt(kstDate.slice(5, 7), 10)
                  const day = parseInt(kstDate.slice(8, 10), 10)
                  const dateStr = `${month}/${day}`
                  const verdictStyle = VERDICT_STYLES[report.verdict] ?? VERDICT_STYLES["중립"]

                  return (
                    <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/reports/${report.slug}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {report.stock.name}
                          <span className="text-muted-foreground ml-1 text-xs">
                            {report.stock.ticker}
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {SIGNAL_LABELS[report.signal] ?? report.signal}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          className={cn("text-xs", verdictStyle.className)}
                          aria-label={`투자의견: ${verdictStyle.label}`}
                        >
                          {verdictStyle.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground max-w-xs truncate">
                        <Link href={`/reports/${report.slug}`} className="hover:text-foreground transition-colors">
                          {stripReportHeaders(report.summary)}
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => fetchReports(page - 1, market)}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => fetchReports(page + 1, market)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
