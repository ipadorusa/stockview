import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canDeleteComment } from "@/lib/board-permissions"
import { updateCommentSchema } from "@/lib/validations/board"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const comment = await prisma.boardComment.findUnique({ where: { id: commentId } })
  if (!comment) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 })
  }

  if (comment.authorId !== session.user.id) {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = updateCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const updated = await prisma.boardComment.update({
      where: { id: commentId },
      data: { content: parsed.data.content },
      include: { author: { select: { id: true, nickname: true } } },
    })

    return NextResponse.json({
      comment: {
        id: updated.id,
        content: updated.content,
        authorId: updated.author.id,
        author: updated.author.nickname,
        postId: updated.postId,
        parentId: updated.parentId,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const comment = await prisma.boardComment.findUnique({ where: { id: commentId } })
  if (!comment) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 })
  }

  if (!canDeleteComment(session, comment)) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 })
  }

  await prisma.boardComment.delete({ where: { id: commentId } })

  return NextResponse.json({ message: "삭제되었습니다." })
}
