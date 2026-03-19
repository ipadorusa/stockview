import { NextRequest, NextResponse } from "next/server"
import { getLatestNews } from "@/lib/queries"

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 5)

  try {
    const news = await getLatestNews(limit)

    return NextResponse.json(
      { news },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    )
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
