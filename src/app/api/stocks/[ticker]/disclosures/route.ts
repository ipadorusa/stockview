import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params

  try {
    const stock = await prisma.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
      select: { id: true, market: true },
    })

    if (!stock) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 })
    }

    // US 종목은 빈 배열 반환
    if (stock.market !== "KR") {
      return NextResponse.json({ disclosures: [] }, {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
      })
    }

    const disclosures = await prisma.disclosure.findMany({
      where: { stockId: stock.id },
      orderBy: { rceptDate: "desc" },
      take: 30,
    })

    return NextResponse.json({
      disclosures: disclosures.map((d) => ({
        rceptNo: d.rceptNo,
        reportName: d.reportName,
        filerName: d.filerName,
        rceptDate: d.rceptDate.toISOString().split("T")[0],
        remark: d.remark,
        viewerUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${d.rceptNo}`,
      })),
    }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
