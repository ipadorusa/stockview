import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "영문과 숫자를 포함해야 합니다"),
  nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다").max(20, "닉네임은 20자 이하여야 합니다"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, nickname } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { nickname }] },
    })

    if (existing) {
      if (existing.email === email) {
        return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 })
      }
      return NextResponse.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, nickname },
      select: { id: true, email: true, nickname: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
