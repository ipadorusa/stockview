import { NextRequest, NextResponse } from "next/server"
import { getMarketMovers } from "@/lib/queries"

export async function GET(req: NextRequest) {
  const limit = Math.min(Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 5)), 20)

  try {
    const data = await getMarketMovers("KR", limit)

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
