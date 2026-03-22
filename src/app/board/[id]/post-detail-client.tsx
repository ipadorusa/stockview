"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommentSection } from "@/components/board/comment-section"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { toast } from "sonner"

interface Post {
  id: string
  title: string
  content: string
  isPrivate: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  authorId: string
  author: string
}

interface Comment {
  id: string
  content: string
  authorId: string
  author: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}

interface PostDetailClientProps {
  post: Post
  initialComments: Comment[]
  currentUserId?: string
  isAdmin?: boolean
}

export function PostDetailClient({ post, initialComments, currentUserId, isAdmin }: PostDetailClientProps) {
  const router = useRouter()
  const isAuthor = currentUserId === post.authorId
  const canEdit = isAuthor
  const canDelete = isAuthor || isAdmin

  const handleDelete = async () => {
    if (!confirm("게시글을 삭제하시겠습니까? 댓글도 함께 삭제됩니다.")) return
    const res = await fetch(`/api/board/${post.id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? "삭제에 실패했습니다.")
      return
    }
    toast.success("게시글이 삭제되었습니다.")
    router.push("/board")
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          {post.isPrivate && <Lock className="h-4 w-4 text-muted-foreground" />}
          {post.title}
        </h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span>{post.author}</span>
          <span>{formatRelativeTime(post.createdAt)}</span>
          <span>조회 {post.viewCount}</span>
        </div>
      </div>

      <div className="border-t border-b py-6 min-h-[120px]">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
      </div>

      <div className="flex items-center justify-between mt-4">
        <Link href="/board">
          <Button variant="outline" size="sm">목록</Button>
        </Link>
        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/board/${post.id}/edit`}>
              <Button variant="outline" size="sm">수정</Button>
            </Link>
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>삭제</Button>
          )}
        </div>
      </div>

      <CommentSection
        postId={post.id}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        initialComments={initialComments}
      />
    </div>
  )
}
