"use client"

import { useState } from "react"
import { PageContainer } from "@/components/layout/page-container"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { Button } from "@/components/ui/button"

const CATEGORY_LABEL: Record<string, string> = {
  "data-error": "데이터 오류",
  service: "서비스 문의",
  "ai-report": "AI 리포트",
  business: "광고·제휴",
  privacy: "개인정보",
  other: "기타",
}

interface Contact {
  id: string
  name: string
  email: string
  category: string
  message: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchContacts = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/contacts?page=${page}`, {
        headers: { Authorization: `Bearer ${prompt("CRON_SECRET 입력:")}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setContacts(data.contacts)
      setPagination(data.pagination)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <PageContainer>
      <GtmPageView pageData={{ page_name: "admin_contacts" }} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">문의 관리</h1>
        <Button onClick={() => fetchContacts()} disabled={loading}>
          {loading ? "조회 중..." : "문의 조회"}
        </Button>
      </div>

      {error && <div className="text-destructive mb-4">{error}</div>}

      {contacts.length > 0 && (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                      {CATEGORY_LABEL[c.category] ?? c.category}
                    </span>
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </div>
                  <p className={`text-sm text-muted-foreground ${expanded.has(c.id) ? "" : "line-clamp-2"}`}>
                    {c.message}
                  </p>
                  {c.message.length > 100 && (
                    <button
                      onClick={() => toggleExpand(c.id)}
                      className="text-xs text-primary mt-1"
                    >
                      {expanded.has(c.id) ? "접기" : "더보기"}
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchContacts(pagination.page - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages} ({pagination.total}건)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchContacts(pagination.page + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      )}

      {!loading && contacts.length === 0 && pagination === null && (
        <p className="text-muted-foreground text-sm">위 버튼을 눌러 문의 목록을 조회하세요.</p>
      )}
    </PageContainer>
  )
}
