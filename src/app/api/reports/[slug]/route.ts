import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const report = await prisma.aiReport.findUnique({
    where: { slug },
    include: { stock: true },
  })

  if (!report) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 })
  }

  const snapshot = report.dataSnapshot as Record<string, unknown> | null
  const snapshotQuote = (snapshot?.quote as Record<string, unknown> | null) ?? null

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
      quote: snapshotQuote
        ? {
            price: snapshotQuote.price as number,
            change: snapshotQuote.change as number,
            changePercent: snapshotQuote.changePercent as number,
            volume: snapshotQuote.volume as number,
            marketCap: (snapshotQuote.marketCap as number | null) ?? null,
          }
        : null,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    }
  )
}
