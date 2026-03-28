import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/board-permissions"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { BoardListClient } from "./board-list-client"

export const metadata: Metadata = {
  title: "요청 게시판",
  description: "기능 요청, 버그 제보, 데이터 요청 등을 남겨주세요.",
  alternates: { canonical: "/board" },
  openGraph: {
    title: "요청 게시판 - StockView",
    description: "기능 요청, 버그 제보, 데이터 요청 등을 남겨주세요.",
  },
}

export default async function BoardPage() {
  const session = await auth()
  const admin = isAdmin(session)
  const userId = session?.user?.id

  const where: Record<string, unknown> = {}
  if (admin) {
    // admin sees all
  } else if (userId) {
    where.OR = [{ isPrivate: false }, { authorId: userId }]
  } else {
    where.isPrivate = false
  }

  const [posts, total] = await Promise.all([
    prisma.boardPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        isPrivate: true,
        viewCount: true,
        createdAt: true,
        authorId: true,
        author: { select: { nickname: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.boardPost.count({ where }),
  ])

  const initialPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    isPrivate: p.isPrivate,
    viewCount: p.viewCount,
    createdAt: p.createdAt.toISOString(),
    author: p.author.nickname ?? "익명",
    commentCount: p._count.comments,
    canView: !p.isPrivate || p.authorId === userId || admin,
  }))

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "게시판", href: "/board" }]} />
      <BoardListClient
        initialPosts={initialPosts}
        initialTotal={total}
        isLoggedIn={!!session}
      />
    </PageContainer>
  )
}
