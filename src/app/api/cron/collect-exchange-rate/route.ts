import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchExchangeRates } from "@/lib/data-sources/yahoo"
import { logCronResult } from "@/lib/utils/cron-logger"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cronStart = Date.now()

  try {
    const rates = await fetchExchangeRates()
    if (rates.length === 0) {
      const result = { ok: false, error: "Failed to fetch any exchange rates" }
      await logCronResult("collect-exchange-rate", cronStart, result)
      return NextResponse.json(result, { status: 502 })
    }

    for (const rate of rates) {
      await prisma.exchangeRate.upsert({
        where: { pair: rate.pair },
        update: { rate: rate.rate, change: rate.change, changePercent: rate.changePercent },
        create: { pair: rate.pair, rate: rate.rate, change: rate.change, changePercent: rate.changePercent },
      })
    }

    const summary = rates.map((r) => `${r.pair}=${r.rate.toFixed(2)}`).join(", ")
    console.log(`[cron-exchange] ${summary}`)
    const result = { ok: true, count: rates.length, rates: rates.map((r) => ({ pair: r.pair, rate: r.rate })) }
    await logCronResult("collect-exchange-rate", cronStart, result)
    return NextResponse.json(result)
  } catch (e) {
    console.error(`[cron-exchange] Error: ${String(e)}`)
    const result = { ok: false, error: String(e) }
    await logCronResult("collect-exchange-rate", cronStart, result)
    return NextResponse.json(result, { status: 500 })
  }
}
