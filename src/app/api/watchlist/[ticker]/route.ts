import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { ticker } = await params

  try {
    const stock = await prisma.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
    })
    if (!stock) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })
    }

    await prisma.watchlist.delete({
      where: {
        userId_stockId: { userId: session.user.id, stockId: stock.id },
      },
    })

    return NextResponse.json({ message: "관심종목에서 삭제되었습니다." })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
