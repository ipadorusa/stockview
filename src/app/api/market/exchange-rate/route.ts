import { NextResponse } from "next/server"
import { getExchangeRate } from "@/lib/queries"

export async function GET() {
  try {
    const rate = await getExchangeRate()

    if (!rate) {
      return NextResponse.json({ error: "환율 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json(rate, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
