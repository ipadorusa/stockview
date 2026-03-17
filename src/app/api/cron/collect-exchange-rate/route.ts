import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchUsdKrwRate } from "@/lib/data-sources/yahoo"
import { logCronResult } from "@/lib/utils/cron-logger"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cronStart = Date.now()

  try {
    const rate = await fetchUsdKrwRate()
    if (!rate) {
      const result = { ok: false, error: "Failed to fetch rate" }
      await logCronResult("collect-exchange-rate", cronStart, result)
      return NextResponse.json(result, { status: 502 })
    }

    await prisma.exchangeRate.upsert({
      where: { pair: rate.pair },
      update: { rate: rate.rate, change: rate.change, changePercent: rate.changePercent },
      create: { pair: rate.pair, rate: rate.rate, change: rate.change, changePercent: rate.changePercent },
    })

    console.log(`[cron-exchange] USD/KRW=${rate.rate}`)
    const result = { ok: true, rate: rate.rate }
    await logCronResult("collect-exchange-rate", cronStart, result)
    return NextResponse.json(result)
  } catch (e) {
    console.error(`[cron-exchange] Error: ${String(e)}`)
    const result = { ok: false, error: String(e) }
    await logCronResult("collect-exchange-rate", cronStart, result)
    return NextResponse.json(result, { status: 500 })
  }
}
