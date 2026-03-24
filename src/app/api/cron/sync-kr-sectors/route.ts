import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchNaverSectorMap } from "@/lib/data-sources/naver"
import { logCronResult } from "@/lib/utils/cron-logger"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron-kr-sectors] Starting KR sector sync")
  const cronStart = Date.now()

  const stats = {
    sectorsFound: 0,
    stocksUpdated: 0,
    errors: [] as string[],
  }

  try {
    const sectorMap = await fetchNaverSectorMap()
    stats.sectorsFound = sectorMap.size
    console.log(`[cron-kr-sectors] Sector map: ${sectorMap.size} stocks mapped`)

    if (sectorMap.size === 0) {
      stats.errors.push("Sector map is empty — Naver page may have changed")
      const result = { ok: true, ...stats }
      await logCronResult("sync-kr-sectors", cronStart, result)
      return NextResponse.json(result)
    }

    // DB에서 KR STOCK 종목 조회
    const dbStocks = await prisma.stock.findMany({
      where: { market: "KR", isActive: true, stockType: "STOCK" },
      select: { id: true, ticker: true, sector: true },
    })

    // sector가 없거나 변경된 종목만 업데이트
    const toUpdate = dbStocks.filter((s) => {
      const newSector = sectorMap.get(s.ticker)
      return newSector && newSector !== s.sector
    })

    const BATCH_SIZE = 100
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE)
      const settled = await Promise.allSettled(
        batch.map((s) =>
          prisma.stock.update({
            where: { id: s.id },
            data: { sector: sectorMap.get(s.ticker)! },
          })
        )
      )
      for (const r of settled) {
        if (r.status === "fulfilled") stats.stocksUpdated++
        else stats.errors.push(`Update: ${String(r.reason).slice(0, 100)}`)
      }
    }
  } catch (e) {
    stats.errors.push(`Sector fetch: ${String(e)}`)
  }

  console.log(
    `[cron-kr-sectors] Done: sectorsFound=${stats.sectorsFound}, stocksUpdated=${stats.stocksUpdated}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-kr-sectors] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("sync-kr-sectors", cronStart, result)
  return NextResponse.json(result)
}
