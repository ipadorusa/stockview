"use client"

import { useState } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { toast } from "sonner"

interface Post {
  id: string
  title: string
  isPrivate: boolean
  viewCount: number
  createdAt: string
  author: string
  commentCount: number
  canView: boolean
}

interface BoardListClientProps {
  initialPosts: Post[]
  initialTotal: number
  isLoggedIn: boolean
}

export function BoardListClient({ initialPosts, initialTotal, isLoggedIn }: BoardListClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / 20) || 1)
  const [loading, setLoading] = useState(false)

  async function fetchPage(newPage: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/board?page=${newPage}&limit=20`)
      const data = await res.json()
      setPosts(data.posts)
      setTotalPages(data.pagination.totalPages)
      setPage(newPage)
    } finally {
      setLoading(false)
    }
  }

  const handlePostClick = (post: Post, e: React.MouseEvent) => {
    if (!post.canView) {
      e.preventDefault()
      toast.error("비밀글은 작성자만 볼 수 있습니다.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">요청 게시판</h1>
          <p className="text-sm text-muted-foreground mt-1">
            기능 요청, 버그 제보, 데이터 요청 등을 남겨주세요.
          </p>
        </div>
        {isLoggedIn && (
          <Link href="/board/new">
            <Button size="sm">글쓰기</Button>
          </Link>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium w-[50%]">제목</th>
                <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">작성자</th>
                <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">작성일</th>
                <th className="px-3 py-2 text-right font-medium">조회</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", loading && "opacity-50")}>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    게시글이 없습니다.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/board/${post.id}`}
                        onClick={(e) => handlePostClick(post, e)}
                        className={cn(
                          "font-medium transition-colors",
                          post.canView ? "hover:text-primary" : "text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        {post.isPrivate && <Lock className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />}
                        {post.title}
                        {post.commentCount > 0 && (
                          <span className="text-primary ml-1 text-xs">[{post.commentCount}]</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">
                      {post.author}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {formatRelativeTime(post.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-right">
                      {post.viewCount}
                    </td>
                  </tr>
                ))
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
            onClick={() => fetchPage(page - 1)}
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
            onClick={() => fetchPage(page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
