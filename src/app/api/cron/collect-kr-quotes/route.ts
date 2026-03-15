import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // TODO: 한국투자증권 API 연동
  // 1. KIS API에서 관심 종목 시세 조회
  // 2. DB upsert (StockQuote)
  // 3. 장마감 시 DailyPrice 저장

  return NextResponse.json({ ok: true, message: "KR quotes collection triggered" })
}
