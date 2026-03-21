import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const report = await prisma.aiReport.findUnique({
    where: { slug },
    include: {
      stock: {
        include: {
          quotes: { take: 1, orderBy: { updatedAt: "desc" } },
        },
      },
    },
  })

  if (!report) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 })
  }

  const quote = report.stock.quotes[0]

  return NextResponse.json(
    {
      id: report.id,
      slug: report.slug,
      title: report.title,
      signal: report.signal,
      content: report.content,
      summary: report.summary,
      verdict: report.verdict,
      reportDate: report.reportDate,
      dataSnapshot: report.dataSnapshot,
      model: report.model,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      stock: {
        ticker: report.stock.ticker,
        name: report.stock.name,
        market: report.stock.market,
        exchange: report.stock.exchange,
        sector: report.stock.sector,
      },
      quote: quote
        ? {
            price: Number(quote.price),
            change: Number(quote.change),
            changePercent: Number(quote.changePercent),
            volume: Number(quote.volume),
            marketCap: quote.marketCap ? Number(quote.marketCap) : null,
          }
        : null,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    }
  )
}
