import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createRequestCommentSchema } from "@/lib/validations/report-request"

// GET — 댓글 목록
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await params

  const request = await prisma.reportRequest.findUnique({ where: { id: requestId } })
  if (!request) {
    return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 })
  }

  const comments = await prisma.requestComment.findMany({
    where: { requestId },
    include: { user: { select: { id: true, nickname: true, role: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      authorId: c.user.id,
      author: c.user.nickname,
      isAdmin: c.user.role === "ADMIN",
      createdAt: c.createdAt.toISOString(),
    })),
  })
}

// POST — 댓글 작성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const request = await prisma.reportRequest.findUnique({ where: { id: requestId } })
  if (!request) {
    return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const parsed = createRequestCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const comment = await prisma.requestComment.create({
      data: {
        requestId,
        userId: session.user.id,
        content: parsed.data.content,
      },
      include: { user: { select: { id: true, nickname: true, role: true } } },
    })

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        authorId: comment.user.id,
        author: comment.user.nickname,
        isAdmin: comment.user.role === "ADMIN",
        createdAt: comment.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
