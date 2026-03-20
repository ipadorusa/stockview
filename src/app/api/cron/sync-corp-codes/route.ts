import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { downloadCorpCodes } from "@/lib/data-sources/opendart"
import { logCronResult } from "@/lib/utils/cron-logger"

export const maxDuration = 60

const BATCH_SIZE = 100

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-corp-codes] Starting corp code sync")
  const cronStart = Date.now()

  const stats = {
    totalCorpCodes: 0,
    matched: 0,
    errors: [] as string[],
  }

  try {
    const corpCodes = await downloadCorpCodes()
    stats.totalCorpCodes = corpCodes.length

    // ticker → corpCode 맵 구성
    const tickerMap = new Map<string, string>()
    for (const cc of corpCodes) {
      tickerMap.set(cc.stockCode, cc.corpCode)
    }

    // KR STOCK만 대상
    const krStocks = await prisma.stock.findMany({
      where: { market: "KR", stockType: "STOCK", isActive: true },
      select: { id: true, ticker: true },
    })

    // 배치 업데이트
    for (let i = 0; i < krStocks.length; i += BATCH_SIZE) {
      const batch = krStocks.slice(i, i + BATCH_SIZE)
      const settled = await Promise.allSettled(
        batch
          .filter((s) => tickerMap.has(s.ticker))
          .map((s) =>
            prisma.stock.update({
              where: { id: s.id },
              data: { corpCode: tickerMap.get(s.ticker)! },
            })
          )
      )
      for (const r of settled) {
        if (r.status === "fulfilled") stats.matched++
        else stats.errors.push(`Update: ${String(r.reason).slice(0, 100)}`)
      }
    }
  } catch (e) {
    stats.errors.push(`Download: ${String(e)}`)
  }

  console.log(
    `[cron-corp-codes] Done: totalCorpCodes=${stats.totalCorpCodes}, matched=${stats.matched}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-corp-codes] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("sync-corp-codes", cronStart, result)
  return NextResponse.json(result)
}
