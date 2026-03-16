import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchUsdKrwRate } from "@/lib/data-sources/yahoo"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rate = await fetchUsdKrwRate()
    if (!rate) {
      return NextResponse.json({ ok: false, error: "Failed to fetch rate" }, { status: 502 })
    }

    await prisma.exchangeRate.upsert({
      where: { pair: rate.pair },
      update: { rate: rate.rate, change: rate.change, changePercent: rate.changePercent },
      create: { pair: rate.pair, rate: rate.rate, change: rate.change, changePercent: rate.changePercent },
    })

    console.log(`[cron-exchange] USD/KRW=${rate.rate}`)
    return NextResponse.json({ ok: true, rate: rate.rate })
  } catch (e) {
    console.error(`[cron-exchange] Error: ${String(e)}`)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
