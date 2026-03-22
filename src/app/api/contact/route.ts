import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(50),
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  category: z.enum(["data-error", "service", "ai-report", "business", "privacy", "other"]),
  message: z.string().min(10, "메시지는 10자 이상 입력해주세요").max(2000),
  website: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  // Honeypot: bots fill the hidden "website" field
  if (parsed.data.website) {
    // Pretend success to not reveal the trap
    return NextResponse.json({ ok: true })
  }

  const { name, email, category, message } = parsed.data

  await prisma.contactMessage.create({
    data: { name, email, category, message },
  })

  return NextResponse.json({ ok: true })
}
