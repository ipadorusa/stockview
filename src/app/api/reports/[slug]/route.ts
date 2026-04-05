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

  const snapshot = report.dataSnapshot
  const snapshotObj = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot as Record<string, unknown> : null
  const rawQuote = snapshotObj?.quote
  const quoteObj = rawQuote && typeof rawQuote === "object" && !Array.isArray(rawQuote) ? rawQuote as Record<string, unknown> : null

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
      quote: quoteObj
        ? {
            price: typeof quoteObj.price === "number" ? quoteObj.price : 0,
            change: typeof quoteObj.change === "number" ? quoteObj.change : 0,
            changePercent: typeof quoteObj.changePercent === "number" ? quoteObj.changePercent : 0,
            volume: typeof quoteObj.volume === "number" ? quoteObj.volume : 0,
            marketCap: typeof quoteObj.marketCap === "number" ? quoteObj.marketCap : null,
          }
        : null,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    }
  )
}
