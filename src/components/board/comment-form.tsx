"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface CommentFormProps {
  postId: string
  parentId?: string
  onSuccess: () => void
  onCancel?: () => void
}

export function CommentForm({ postId, parentId, onSuccess, onCancel }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/board/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), parentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "댓글 작성에 실패했습니다.")
        return
      }
      setContent("")
      onSuccess()
      toast.success("댓글이 작성되었습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        placeholder={parentId ? "답글을 입력해주세요" : "댓글을 입력해주세요"}
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" size="sm" disabled={loading || !content.trim()}>
          {loading ? "작성 중..." : parentId ? "답글 작성" : "댓글 작성"}
        </Button>
      </div>
    </form>
  )
}
