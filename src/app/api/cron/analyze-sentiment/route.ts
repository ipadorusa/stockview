import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeSentimentBatch } from "@/lib/news-sentiment"
import { logCronResult } from "@/lib/utils/cron-logger"
import { sendTelegramAlert } from "@/lib/utils/telegram"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cronStart = Date.now()
  const stats = { processed: 0, errors: [] as string[] }

  try {
    // sentiment IS NULL인 뉴스 30건 (최신순)
    const pendingNews = await prisma.news.findMany({
      where: { sentiment: null },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: { id: true, title: true },
    })

    if (pendingNews.length === 0) {
      return NextResponse.json({ ok: true, message: "No pending news" })
    }

    console.log(`[cron-sentiment] Analyzing ${pendingNews.length} news items`)

    // 배치 분석 (내부 2초 딜레이)
    const results = await analyzeSentimentBatch(pendingNews)

    // DB 업데이트
    const settled = await Promise.allSettled(
      [...results.entries()].map(([id, sentiment]) =>
        prisma.news.update({
          where: { id },
          data: { sentiment },
        })
      )
    )

    for (const r of settled) {
      if (r.status === "fulfilled") stats.processed++
      else stats.errors.push(String(r.reason).slice(0, 100))
    }
  } catch (e) {
    stats.errors.push(`Fatal: ${String(e).slice(0, 200)}`)
  }

  console.log(
    `[cron-sentiment] Done: processed=${stats.processed}, errors=${stats.errors.length}`
  )

  if (stats.errors.length > 0) {
    await sendTelegramAlert(
      "감성분석 크론 에러",
      `에러 ${stats.errors.length}건:\n${stats.errors.slice(0, 5).join("\n")}`,
      "warning"
    ).catch(() => {})
  }

  const result = {
    ok: stats.errors.length === 0,
    itemsProcessed: stats.processed,
    itemsFailed: stats.errors.length,
    errors: stats.errors,
  }
  await logCronResult("analyze-sentiment", cronStart, result)
  return NextResponse.json({ ok: true, ...stats })
}
