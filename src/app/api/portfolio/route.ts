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
    const items = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      include: {
        stock: {
          include: { quotes: { take: 1, orderBy: { updatedAt: "desc" } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const portfolio = items.map((item) => {
      const quote = item.stock.quotes[0]
      const currentPrice = quote ? Number(quote.price) : 0
      const buyPrice = Number(item.buyPrice)
      const profitLoss = currentPrice - buyPrice
      const profitLossPercent = buyPrice > 0 ? (profitLoss / buyPrice) * 100 : 0
      const totalValue = currentPrice * item.quantity
      const totalCost = buyPrice * item.quantity
      const totalProfitLoss = totalValue - totalCost

      return {
        id: item.id,
        ticker: item.stock.ticker,
        name: item.stock.name,
        market: item.stock.market,
        stockType: item.stock.stockType,
        buyPrice,
        quantity: item.quantity,
        buyDate: item.buyDate?.toISOString().split("T")[0] ?? null,
        memo: item.memo,
        groupName: item.groupName,
        currentPrice,
        change: quote ? Number(quote.change) : 0,
        changePercent: quote ? Number(quote.changePercent) : 0,
        profitLoss: Math.round(profitLoss * 100) / 100,
        profitLossPercent: Math.round(profitLossPercent * 100) / 100,
        totalValue: Math.round(totalValue),
        totalCost: Math.round(totalCost),
        totalProfitLoss: Math.round(totalProfitLoss),
        addedAt: item.createdAt.toISOString(),
      }
    })

    const summary = {
      totalValue: portfolio.reduce((sum, p) => sum + p.totalValue, 0),
      totalCost: portfolio.reduce((sum, p) => sum + p.totalCost, 0),
      totalProfitLoss: portfolio.reduce((sum, p) => sum + p.totalProfitLoss, 0),
      count: portfolio.length,
    }

    return NextResponse.json({ portfolio, summary })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

const addSchema = z.object({
  ticker: z.string().min(1, "티커를 입력해주세요."),
  buyPrice: z.number().positive("매수가는 0보다 커야 합니다."),
  quantity: z.number().int().positive("수량은 1 이상이어야 합니다."),
  buyDate: z.string().optional(),
  memo: z.string().max(200).optional(),
  groupName: z.string().max(50).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = addSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다."
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const stock = await prisma.stock.findUnique({
      where: { ticker: parsed.data.ticker.toUpperCase() },
    })
    if (!stock) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })
    }

    await prisma.portfolio.create({
      data: {
        userId: session.user.id,
        stockId: stock.id,
        buyPrice: parsed.data.buyPrice,
        quantity: parsed.data.quantity,
        buyDate: parsed.data.buyDate ? new Date(parsed.data.buyDate) : null,
        memo: parsed.data.memo ?? null,
        groupName: parsed.data.groupName ?? null,
      },
    })

    return NextResponse.json({ message: "포트폴리오에 추가되었습니다." }, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "이미 포트폴리오에 등록된 종목입니다." }, { status: 409 })
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
