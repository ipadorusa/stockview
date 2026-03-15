import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // TODO: Yahoo Finance / Alpha Vantage API 연동
  // 1. 미국 종목 시세 조회
  // 2. DB upsert (StockQuote)
  // 3. 환율 조회 및 저장

  return NextResponse.json({ ok: true, message: "US quotes collection triggered" })
}
