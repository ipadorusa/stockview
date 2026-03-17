import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const profileSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(20, "닉네임은 20자 이하여야 합니다"),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { nickname: parsed.data.nickname },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (String(e).includes("Unique constraint")) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
