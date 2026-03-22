import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canEditPost } from "@/lib/board-permissions"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { EditFormClient } from "./edit-form-client"

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "글 수정 | 요청 게시판 | StockView",
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) notFound()

  const post = await prisma.boardPost.findUnique({ where: { id } })

  if (!post || !canEditPost(session, post)) {
    notFound()
  }

  return (
    <PageContainer>
      <Breadcrumb items={[
        { label: "게시판", href: "/board" },
        { label: post.title, href: `/board/${id}` },
        { label: "수정", href: `/board/${id}/edit` },
      ]} />
      <h1 className="text-xl font-bold mb-6">글 수정</h1>
      <div className="max-w-2xl">
        <EditFormClient post={{ id: post.id, title: post.title, content: post.content, isPrivate: post.isPrivate }} />
      </div>
    </PageContainer>
  )
}
