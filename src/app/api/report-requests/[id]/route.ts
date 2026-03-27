import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/board-permissions"
import { updateRequestStatusSchema } from "@/lib/validations/report-request"

// PATCH — 관리자 승인/거절
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = updateRequestStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const request = await prisma.reportRequest.findUnique({ where: { id } })
    if (!request) {
      return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 })
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "PENDING 상태의 요청만 처리할 수 있습니다." }, { status: 400 })
    }

    const updated = await prisma.reportRequest.update({
      where: { id },
      data: {
        status: parsed.data.status,
        approvedAt: parsed.data.status === "APPROVED" ? new Date() : undefined,
      },
    })

    return NextResponse.json({
      request: {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt?.toISOString() ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

// DELETE — 요청 취소 (PENDING 상태, 본인만)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  try {
    const request = await prisma.reportRequest.findUnique({ where: { id } })
    if (!request) {
      return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 })
    }

    if (request.userId !== session.user.id && !isAdmin(session)) {
      return NextResponse.json({ error: "본인의 요청만 취소할 수 있습니다." }, { status: 403 })
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "PENDING 상태의 요청만 취소할 수 있습니다." }, { status: 400 })
    }

    await prisma.reportRequest.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
