import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchNaverSectorMap } from "@/lib/data-sources/naver"
import { logCronResult } from "@/lib/utils/cron-logger"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const exchange = searchParams.get("exchange") // "KOSPI" | "KOSDAQ" | null (전체)

  console.log(`[cron-kr-sectors] Starting KR sector sync (exchange=${exchange ?? "all"})`)
  const cronStart = Date.now()

  const stats = {
    sectorsFound: 0,
    sectorsUpserted: 0,
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

    // 고유 섹터명 추출 → Sector 테이블 upsert
    const uniqueSectors = [...new Set(sectorMap.values())]
    for (const sectorName of uniqueSectors) {
      try {
        await prisma.sector.upsert({
          where: { name_market: { name: sectorName, market: "KR" } },
          update: {},
          create: { name: sectorName, market: "KR" },
        })
        stats.sectorsUpserted++
      } catch (e) {
        stats.errors.push(`Sector upsert ${sectorName}: ${String(e).slice(0, 100)}`)
      }
    }

    // Sector 테이블에서 name→id 매핑
    const dbSectors = await prisma.sector.findMany({
      where: { market: "KR" },
      select: { id: true, name: true },
    })
    const sectorNameToId = new Map(dbSectors.map((s) => [s.name, s.id]))

    // DB에서 KR STOCK 종목 조회 (exchange 필터 적용)
    const dbStocks = await prisma.stock.findMany({
      where: {
        market: "KR",
        isActive: true,
        stockType: "STOCK",
        ...(exchange ? { exchange } : {}),
      },
      select: { id: true, ticker: true, sector: true, sectorId: true },
    })

    // sector 문자열 또는 sectorId가 변경된 종목만 업데이트
    const toUpdate = dbStocks.filter((s) => {
      const newSector = sectorMap.get(s.ticker)
      if (!newSector) return false
      const newSectorId = sectorNameToId.get(newSector)
      return newSector !== s.sector || newSectorId !== s.sectorId
    })

    const BATCH_SIZE = 100
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE)
      const settled = await Promise.allSettled(
        batch.map((s) => {
          const newSector = sectorMap.get(s.ticker)!
          const newSectorId = sectorNameToId.get(newSector)
          return prisma.stock.update({
            where: { id: s.id },
            data: {
              sector: newSector,
              sectorId: newSectorId ?? null,
            },
          })
        })
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
    `[cron-kr-sectors] Done: sectorsFound=${stats.sectorsFound}, sectorsUpserted=${stats.sectorsUpserted}, stocksUpdated=${stats.stocksUpdated}`
  )
  if (stats.errors.length > 0) {
    console.error(`[cron-kr-sectors] Errors (${stats.errors.length}):`, stats.errors)
  }

  const result = { ok: true, ...stats }
  await logCronResult("sync-kr-sectors", cronStart, result)
  return NextResponse.json(result)
}
