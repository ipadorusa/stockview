"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CommentForm } from "./comment-form"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { toast } from "sonner"

interface Comment {
  id: string
  content: string
  authorId: string
  author: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}

interface CommentItemProps {
  comment: Comment
  replies?: Comment[]
  currentUserId?: string
  isAdmin?: boolean
  postId: string
  onRefresh: () => void
}

export function CommentItem({ comment, replies, currentUserId, isAdmin, postId, onRefresh }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [editLoading, setEditLoading] = useState(false)

  const isAuthor = currentUserId === comment.authorId
  const canReply = !comment.parentId
  const canEdit = isAuthor
  const canDelete = isAuthor || isAdmin

  const handleEdit = async () => {
    if (!editContent.trim()) return
    setEditLoading(true)
    try {
      const res = await fetch(`/api/board/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "수정에 실패했습니다.")
        return
      }
      setIsEditing(false)
      onRefresh()
      toast.success("댓글이 수정되었습니다.")
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return
    const res = await fetch(`/api/board/comments/${comment.id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? "삭제에 실패했습니다.")
      return
    }
    onRefresh()
    toast.success("댓글이 삭제되었습니다.")
  }

  return (
    <div>
      <div className="py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{comment.author}</span>
          <span className="text-muted-foreground text-xs">{formatRelativeTime(comment.createdAt)}</span>
        </div>

        {isEditing ? (
          <div className="mt-2 flex flex-col gap-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditContent(comment.content) }}>
                취소
              </Button>
              <Button size="sm" disabled={editLoading || !editContent.trim()} onClick={handleEdit}>
                {editLoading ? "수정 중..." : "수정"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
        )}

        {!isEditing && currentUserId && (
          <div className="flex gap-2 mt-1.5">
            {canReply && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsReplying(!isReplying)}
              >
                답글
              </button>
            )}
            {canEdit && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(true)}
              >
                수정
              </button>
            )}
            {canDelete && (
              <button
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                삭제
              </button>
            )}
          </div>
        )}

        {isReplying && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSuccess={() => { setIsReplying(false); onRefresh() }}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}
      </div>

      {replies && replies.length > 0 && (
        <div className="ml-8 border-l-2 pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              postId={postId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}
