import { NextRequest, NextResponse } from "next/server"
import { getScreenerData, VALID_SIGNALS } from "@/lib/screener"
import type { SignalType } from "@/lib/screener"

export type { SignalType } from "@/lib/screener"

export const revalidate = 900

export async function GET(req: NextRequest) {
  const market = (req.nextUrl.searchParams.get("market") ?? "KR") as "KR" | "US"
  const signal = (req.nextUrl.searchParams.get("signal") ?? "golden_cross") as SignalType

  if (!VALID_SIGNALS.includes(signal)) {
    return NextResponse.json({ error: "Invalid signal type" }, { status: 400 })
  }

  try {
    const data = await getScreenerData(market, signal)

    const maxAge = data.total === 0 && data.message ? 60 : 900
    const swr = data.total === 0 && data.message ? 120 : 3600

    return NextResponse.json(data, {
      headers: { "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}` },
    })
  } catch (e) {
    console.error("Screener API error:", e)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
