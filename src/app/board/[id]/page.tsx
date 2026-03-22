import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canViewPost, isAdmin } from "@/lib/board-permissions"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { PostDetailClient } from "./post-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await prisma.boardPost.findUnique({
    where: { id },
    select: { title: true },
  })

  if (!post) return { title: "게시글을 찾을 수 없습니다" }

  return {
    title: `${post.title} | 요청 게시판 | StockView`,
  }
}

export default async function BoardPostPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const post = await prisma.boardPost.findUnique({
    where: { id },
    include: { author: { select: { id: true, nickname: true } } },
  })

  if (!post || !canViewPost(session, post)) {
    notFound()
  }

  const comments = await prisma.boardComment.findMany({
    where: { postId: id },
    include: { author: { select: { id: true, nickname: true } } },
    orderBy: { createdAt: "asc" },
  })

  const postData = {
    id: post.id,
    title: post.title,
    content: post.content,
    isPrivate: post.isPrivate,
    viewCount: post.viewCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    authorId: post.authorId,
    author: post.author.nickname,
  }

  const commentsData = comments.map((c) => ({
    id: c.id,
    content: c.content,
    authorId: c.author.id,
    author: c.author.nickname,
    postId: c.postId,
    parentId: c.parentId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "게시판", href: "/board" }, { label: post.title, href: `/board/${post.id}` }]} />
      <PostDetailClient
        post={postData}
        initialComments={commentsData}
        currentUserId={session?.user?.id}
        isAdmin={isAdmin(session)}
      />
    </PageContainer>
  )
}
