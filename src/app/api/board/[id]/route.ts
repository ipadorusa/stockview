import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canViewPost, canEditPost, canDeletePost } from "@/lib/board-permissions"
import { updatePostSchema } from "@/lib/validations/board"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  const post = await prisma.boardPost.findUnique({
    where: { id },
    include: { author: { select: { id: true, nickname: true } } },
  })

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 })
  }

  if (!canViewPost(session, post)) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 })
  }

  await prisma.boardPost.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })

  return NextResponse.json({
    post: {
      id: post.id,
      title: post.title,
      content: post.content,
      isPrivate: post.isPrivate,
      viewCount: post.viewCount + 1,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      authorId: post.authorId,
      author: post.author.nickname,
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const post = await prisma.boardPost.findUnique({ where: { id } })
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 })
  }

  if (!canEditPost(session, post)) {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = updatePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const updated = await prisma.boardPost.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ post: { id: updated.id } })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const post = await prisma.boardPost.findUnique({ where: { id } })
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 })
  }

  if (!canDeletePost(session, post)) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 })
  }

  await prisma.boardPost.delete({ where: { id } })

  return NextResponse.json({ message: "삭제되었습니다." })
}
