"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CommentForm } from "./comment-form"
import { CommentItem } from "./comment-item"

interface Comment {
  id: string
  content: string
  authorId: string
  author: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}

interface CommentSectionProps {
  postId: string
  currentUserId?: string
  isAdmin?: boolean
  initialComments?: Comment[]
}

export function CommentSection({ postId, currentUserId, isAdmin, initialComments }: CommentSectionProps) {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["board-comments", postId],
    queryFn: async () => {
      const res = await fetch(`/api/board/${postId}/comments`)
      const json = await res.json()
      return json.comments as Comment[]
    },
    initialData: initialComments,
  })

  const comments = data ?? []
  const topLevel = comments.filter((c) => !c.parentId)
  const repliesMap = new Map<string, Comment[]>()
  for (const c of comments) {
    if (c.parentId) {
      const list = repliesMap.get(c.parentId) ?? []
      list.push(c)
      repliesMap.set(c.parentId, list)
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["board-comments", postId] })
  }

  return (
    <div className="mt-8">
      <h3 className="font-medium mb-4">댓글 {comments.length}개</h3>

      {currentUserId && (
        <div className="mb-6">
          <CommentForm postId={postId} onSuccess={handleRefresh} />
        </div>
      )}

      <div className="divide-y">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={repliesMap.get(comment.id)}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            postId={postId}
            onRefresh={handleRefresh}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          아직 댓글이 없습니다.
        </p>
      )}
    </div>
  )
}
