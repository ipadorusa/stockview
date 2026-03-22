import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canViewPost } from "@/lib/board-permissions"
import { createCommentSchema } from "@/lib/validations/board"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const session = await auth()

  const post = await prisma.boardPost.findUnique({ where: { id: postId } })
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 })
  }

  if (!canViewPost(session, post)) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 })
  }

  const comments = await prisma.boardComment.findMany({
    where: { postId },
    include: { author: { select: { id: true, nickname: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      authorId: c.author.id,
      author: c.author.nickname,
      postId: c.postId,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const post = await prisma.boardPost.findUnique({ where: { id: postId } })
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 })
  }

  if (!canViewPost(session, post)) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 })
  }

  try {
    // Rate limit: 30 seconds between comments
    const recentComment = await prisma.boardComment.findFirst({
      where: { authorId: session.user.id, createdAt: { gte: new Date(Date.now() - 30_000) } },
      select: { id: true },
    })
    if (recentComment) {
      return NextResponse.json({ error: "너무 빠르게 작성하고 있습니다. 30초 후 다시 시도해주세요." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = createCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    let effectiveParentId: string | null = null
    if (parsed.data.parentId) {
      const parent = await prisma.boardComment.findUnique({
        where: { id: parsed.data.parentId },
      })
      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ error: "상위 댓글을 찾을 수 없습니다." }, { status: 404 })
      }
      // Flatten to 1-level depth
      effectiveParentId = parent.parentId ?? parent.id
    }

    const comment = await prisma.boardComment.create({
      data: {
        content: parsed.data.content,
        authorId: session.user.id,
        postId,
        parentId: effectiveParentId,
      },
      include: { author: { select: { id: true, nickname: true } } },
    })

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        authorId: comment.author.id,
        author: comment.author.nickname,
        postId: comment.postId,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
