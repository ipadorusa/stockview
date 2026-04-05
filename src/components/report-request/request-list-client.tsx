"use client"

import { useState, Fragment } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, MessageSquare, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReportStatusBadge } from "./report-status-badge"
import { RequestComments } from "./request-comments"

interface ReportRequest {
  id: string
  stockId: string
  ticker: string
  stockName: string
  market: string
  status: string
  requester: string
  isOwner: boolean
  commentCount: number
  requestedAt: string
  approvedAt: string | null
  completedAt: string | null
  aiReportId: string | null
}

interface RequestListResponse {
  requests: ReportRequest[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export function RequestListClient() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const isAdmin = session?.user?.role === "ADMIN"

  const { data, isLoading } = useQuery<RequestListResponse>({
    queryKey: ["report-requests", page],
    queryFn: async () => {
      const res = await fetch(`/api/report-requests?page=${page}&limit=20`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    refetchInterval: 30000,
  })

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) => {
      const res = await fetch(`/api/report-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "처리에 실패했습니다.")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-requests"] })
      toast.success("요청이 처리되었습니다.")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/report-requests/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "취소에 실패했습니다.")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-requests"] })
      toast.success("요청이 취소되었습니다.")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const requests = data?.requests ?? []
  const pagination = data?.pagination

  function formatDate(iso: string) {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">분석 요청 게시판</h2>
          <p className="text-sm text-muted-foreground">AI 종목 분석을 요청하고 진행 상황을 확인하세요.</p>
        </div>
        {session && (
          <Link href="/reports/request">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              요청하기
            </Button>
          </Link>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">종목</th>
                <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">요청자</th>
                <th className="px-3 py-2 text-left font-medium">상태</th>
                <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">요청일</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">완료일</th>
                {(isAdmin || requests.some(r => r.isOwner && r.status === "PENDING")) && (
                  <th className="px-3 py-2 text-right font-medium">관리</th>
                )}
              </tr>
            </thead>
            <tbody className={cn("divide-y", isLoading && "opacity-50")}>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    {isLoading ? "불러오는 중..." : "요청이 없습니다."}
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const showActions = isAdmin || requests.some(r => r.isOwner && r.status === "PENDING")
                  const colCount = showActions ? 6 : 5
                  const isExpanded = expandedId === req.id
                  return (
                    <Fragment key={req.id}>
                      <tr
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")} />
                            <span className="font-medium">{req.stockName}</span>
                            <span className="text-xs text-muted-foreground font-mono">{req.ticker}</span>
                            {req.commentCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground ml-1">
                                <MessageSquare className="h-3 w-3" />
                                {req.commentCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell text-muted-foreground">
                          {req.requester}
                        </td>
                        <td className="px-3 py-2.5">
                          {req.status === "COMPLETED" && req.aiReportId ? (
                            <Link href="/reports" className="hover:underline" onClick={(e) => e.stopPropagation()}>
                              <ReportStatusBadge status={req.status} />
                            </Link>
                          ) : (
                            <ReportStatusBadge status={req.status} />
                          )}
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell text-muted-foreground whitespace-nowrap">
                          {formatDate(req.requestedAt)}
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                          {req.completedAt ? formatDate(req.completedAt) : "-"}
                        </td>
                        {showActions && (
                          <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {isAdmin && req.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    disabled={approveMutation.isPending}
                                    onClick={() => approveMutation.mutate({ id: req.id, status: "APPROVED" })}
                                  >
                                    승인
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs text-destructive"
                                    disabled={approveMutation.isPending}
                                    onClick={() => approveMutation.mutate({ id: req.id, status: "REJECTED" })}
                                  >
                                    거절
                                  </Button>
                                </>
                              )}
                              {req.isOwner && req.status === "PENDING" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-destructive"
                                  disabled={deleteMutation.isPending}
                                  onClick={() => deleteMutation.mutate(req.id)}
                                >
                                  취소
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={colCount}>
                            <RequestComments requestId={req.id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
