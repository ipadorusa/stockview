import { NextRequest, NextResponse } from "next/server"
import type { RequestStatus } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createReportRequestSchema } from "@/lib/validations/report-request"
import { sendReportRequestNotification } from "@/lib/utils/telegram"

// POST — 리포트 요청 생성
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = createReportRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { stockId } = parsed.data

    // 종목 존재 확인
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      select: { id: true, name: true, ticker: true },
    })
    if (!stock) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })
    }

    // 중복 요청 방지: 같은 종목에 PENDING/APPROVED/GENERATING 상태가 있으면 거부
    const existingRequest = await prisma.reportRequest.findFirst({
      where: {
        stockId,
        status: { in: ["PENDING", "APPROVED", "GENERATING"] },
      },
    })
    if (existingRequest) {
      return NextResponse.json({ error: "이미 해당 종목에 대한 요청이 진행 중입니다." }, { status: 409 })
    }

    // 일일 요청 제한: 사용자당 3건
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const dailyCount = await prisma.reportRequest.count({
      where: {
        userId: session.user.id,
        requestedAt: { gte: todayStart },
      },
    })
    if (dailyCount >= 3) {
      return NextResponse.json({ error: "일일 요청 한도(3건)를 초과했습니다." }, { status: 429 })
    }

    const request = await prisma.reportRequest.create({
      data: {
        userId: session.user.id,
        stockId,
        ticker: stock.ticker,
      },
      include: {
        stock: { select: { name: true } },
        user: { select: { nickname: true } },
      },
    })

    // Telegram 알림 (비동기, 실패해도 무시)
    sendReportRequestNotification(
      request.stock.name,
      request.ticker,
      request.user.nickname ?? "익명",
    ).catch(() => {})

    return NextResponse.json({
      request: {
        id: request.id,
        stockId: request.stockId,
        ticker: request.ticker,
        status: request.status,
        requestedAt: request.requestedAt.toISOString(),
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

// GET — 리포트 요청 목록
export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))
  const status = searchParams.get("status")
  const VALID_STATUSES = ["PENDING", "APPROVED", "GENERATING", "COMPLETED", "FAILED", "REJECTED"] as const

  const where: { status?: RequestStatus } = {}
  if (status) {
    if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return NextResponse.json({ error: "유효하지 않은 상태입니다." }, { status: 400 })
    }
    where.status = status as RequestStatus
  }

  const [requests, total] = await Promise.all([
    prisma.reportRequest.findMany({
      where,
      include: {
        stock: { select: { name: true, market: true } },
        user: { select: { nickname: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reportRequest.count({ where }),
  ])

  const userId = session?.user?.id

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      stockId: r.stockId,
      ticker: r.ticker,
      stockName: r.stock.name,
      market: r.stock.market,
      status: r.status,
      requester: r.user.nickname ?? "익명",
      isOwner: r.userId === userId,
      commentCount: r._count.comments,
      requestedAt: r.requestedAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
      aiReportId: r.aiReportId,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
