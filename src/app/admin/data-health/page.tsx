"use client"

import { useState } from "react"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"

interface HealthData {
  stocks: { total: number; active: number; kr: number; us: number }
  news: { total: number; last24h: number }
  indicators: { total: number; last24h: number; coverageLast7d: number; coveragePercent: number }
  dailyPrices: { total: number; last24h: number }
  quotes: { updatedLast24h: number }
  cronLogs: Array<{
    id: string
    jobName: string
    status: string
    duration: number
    details: string | null
    createdAt: string
  }>
  checkedAt: string
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "success"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : status === "error"
        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{status}</span>
}

export default function DataHealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/data-health", {
        headers: { Authorization: `Bearer ${prompt("CRON_SECRET 입력:")}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">데이터 품질 모니터링</h1>
        <Button onClick={fetchHealth} disabled={loading}>
          {loading ? "조회 중..." : "상태 조회"}
        </Button>
      </div>

      {error && <div className="text-destructive mb-4">{error}</div>}

      {data && (
        <div className="space-y-6">
          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card title="활성 종목" value={data.stocks.active} sub={`KR ${data.stocks.kr} / US ${data.stocks.us}`} />
            <Card title="뉴스 (24h)" value={data.news.last24h} sub={`전체 ${data.news.total}`} />
            <Card title="지표 커버리지" value={`${data.indicators.coveragePercent}%`} sub={`${data.indicators.coverageLast7d}/${data.stocks.active} 종목`} />
            <Card title="시세 갱신 (24h)" value={data.quotes.updatedLast24h} sub={`일봉 24h: ${data.dailyPrices.last24h}`} />
          </div>

          {/* Cron logs */}
          <div>
            <h2 className="text-lg font-semibold mb-3">최근 Cron 실행 로그</h2>
            {data.cronLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">로그가 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4">작업</th>
                      <th className="py-2 pr-4">상태</th>
                      <th className="py-2 pr-4">소요시간</th>
                      <th className="py-2 pr-4">실행 시각</th>
                      <th className="py-2">상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cronLogs.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="py-2 pr-4 font-mono text-xs">{log.jobName}</td>
                        <td className="py-2 pr-4"><StatusBadge status={log.status} /></td>
                        <td className="py-2 pr-4">{(log.duration / 1000).toFixed(1)}s</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("ko-KR")}
                        </td>
                        <td className="py-2 text-xs text-muted-foreground max-w-xs truncate">
                          {log.details || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            마지막 조회: {new Date(data.checkedAt).toLocaleString("ko-KR")}
          </p>
        </div>
      )}
    </PageContainer>
  )
}

function Card({ title, value, sub }: { title: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  )
}
