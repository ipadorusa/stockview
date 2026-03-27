"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Comment {
  id: string
  content: string
  authorId: string
  author: string
  isAdmin: boolean
  createdAt: string
}

export function RequestComments({ requestId }: { requestId: string }) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [content, setContent] = useState("")

  const { data, isLoading } = useQuery<{ comments: Comment[] }>({
    queryKey: ["request-comments", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/report-requests/${requestId}/comments`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/report-requests/${requestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "댓글 작성에 실패했습니다.")
      return data
    },
    onSuccess: () => {
      setContent("")
      queryClient.invalidateQueries({ queryKey: ["request-comments", requestId] })
      queryClient.invalidateQueries({ queryKey: ["report-requests"] })
      toast.success("댓글이 작성되었습니다.")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const comments = data?.comments ?? []

  function formatDateTime(iso: string) {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    submitMutation.mutate(content.trim())
  }

  return (
    <div className="px-3 py-3 bg-muted/20 space-y-3">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">댓글이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-medium text-xs">{c.author}</span>
                {c.isAdmin && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">관리자</Badge>
                )}
                <span className="text-[11px] text-muted-foreground">{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {session && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={2}
            className="text-xs min-h-0 resize-none"
          />
          <Button
            type="submit"
            size="sm"
            className="shrink-0 self-end"
            disabled={!content.trim() || submitMutation.isPending}
          >
            {submitMutation.isPending ? "..." : "작성"}
          </Button>
        </form>
      )}
    </div>
  )
}
