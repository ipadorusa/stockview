import { NextRequest, NextResponse } from "next/server"
import { getPopularStocks } from "@/lib/queries"

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get("market") ?? "all"
  const take = Math.min(Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 10)), 50)

  try {
    let results, updatedAt

    if (market === "all") {
      const [kr, us] = await Promise.all([
        getPopularStocks("KR", take),
        getPopularStocks("US", take),
      ])
      results = [...kr.results, ...us.results]
      updatedAt = kr.updatedAt ?? us.updatedAt
    } else {
      const data = await getPopularStocks(market as "KR" | "US", take)
      results = data.results
      updatedAt = data.updatedAt
    }

    return NextResponse.json(
      { results, updatedAt },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
    )
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
