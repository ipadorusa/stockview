import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/board-permissions"
import { createPostSchema } from "@/lib/validations/board"

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))

  const where: Record<string, unknown> = {}
  if (isAdmin(session)) {
    // admin sees all
  } else if (session?.user?.id) {
    where.OR = [{ isPrivate: false }, { authorId: session.user.id }]
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
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.boardPost.count({ where }),
  ])

  const userId = session?.user?.id
  const admin = isAdmin(session)

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      isPrivate: p.isPrivate,
      viewCount: p.viewCount,
      createdAt: p.createdAt.toISOString(),
      author: p.author.nickname,
      commentCount: p._count.comments,
      canView: !p.isPrivate || p.authorId === userId || admin,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = createPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const post = await prisma.boardPost.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        isPrivate: parsed.data.isPrivate,
        authorId: session.user.id,
      },
    })

    return NextResponse.json({ post: { id: post.id } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
