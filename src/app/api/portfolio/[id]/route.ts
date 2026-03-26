import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  buyPrice: z.number().positive("매수가는 0보다 커야 합니다.").optional(),
  quantity: z.number().int().positive("수량은 1 이상이어야 합니다.").optional(),
  buyDate: z.string().nullable().optional(),
  memo: z.string().max(200).nullable().optional(),
  groupName: z.string().max(50).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다."
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const existing = await prisma.portfolio.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "포트폴리오 항목을 찾을 수 없습니다." }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.buyPrice !== undefined) data.buyPrice = parsed.data.buyPrice
    if (parsed.data.quantity !== undefined) data.quantity = parsed.data.quantity
    if (parsed.data.buyDate !== undefined) {
      data.buyDate = parsed.data.buyDate ? new Date(parsed.data.buyDate) : null
    }
    if (parsed.data.memo !== undefined) data.memo = parsed.data.memo
    if (parsed.data.groupName !== undefined) data.groupName = parsed.data.groupName

    await prisma.portfolio.update({ where: { id }, data })

    return NextResponse.json({ message: "포트폴리오가 수정되었습니다." })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.portfolio.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "포트폴리오 항목을 찾을 수 없습니다." }, { status: 404 })
    }

    await prisma.portfolio.delete({ where: { id } })

    return NextResponse.json({ message: "포트폴리오에서 삭제되었습니다." })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
