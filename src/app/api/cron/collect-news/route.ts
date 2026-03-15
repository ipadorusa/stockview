import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // TODO: 뉴스 수집
  // 1. Naver Finance RSS 스크래핑 (한국)
  // 2. Google News RSS (미국)
  // 3. News DB upsert

  return NextResponse.json({ ok: true, message: "News collection triggered" })
}
