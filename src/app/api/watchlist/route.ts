import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  try {
    const items = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      include: {
        stock: {
          include: { quotes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      watchlist: items.map((item) => {
        const quote = item.stock.quotes[0]
        return {
          ticker: item.stock.ticker,
          name: item.stock.name,
          market: item.stock.market,
          price: quote ? Number(quote.price) : 0,
          change: quote ? Number(quote.change) : 0,
          changePercent: quote ? Number(quote.changePercent) : 0,
          addedAt: item.createdAt.toISOString(),
        }
      }),
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

const addSchema = z.object({ ticker: z.string().min(1) })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = addSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "올바른 티커를 입력해주세요." }, { status: 400 })
    }

    const stock = await prisma.stock.findUnique({
      where: { ticker: parsed.data.ticker.toUpperCase() },
    })
    if (!stock) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })
    }

    await prisma.watchlist.create({
      data: { userId: session.user.id, stockId: stock.id },
    })

    return NextResponse.json({ message: "관심종목에 추가되었습니다." }, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "이미 관심종목에 등록된 종목입니다." }, { status: 409 })
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
