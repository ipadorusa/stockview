import { NextResponse } from "next/server"
import { getMarketIndices } from "@/lib/queries"

export async function GET() {
  try {
    const indices = await getMarketIndices()

    return NextResponse.json(
      { indices },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
    )
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
