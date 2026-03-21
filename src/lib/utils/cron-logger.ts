import { prisma } from "@/lib/prisma"

/**
 * Cron 실행 결과를 CronLog에 기록
 */
export async function logCronResult(
  jobName: string,
  startTime: number,
  result: { ok: boolean; errors?: string[]; itemsProcessed?: number; itemsFailed?: number },
) {
  const duration = Date.now() - startTime
  const hasErrors = (result.errors?.length ?? 0) > 0

  let status: string
  if (!result.ok) status = "error"
  else if (hasErrors) status = "partial"
  else status = "success"

  try {
    await prisma.cronLog.create({
      data: {
        jobName,
        status,
        duration,
        itemsProcessed: result.itemsProcessed ?? null,
        itemsFailed: result.itemsFailed ?? (result.errors?.length ?? null),
        details: hasErrors
          ? JSON.stringify(result.errors!.slice(0, 5))
          : JSON.stringify(result),
      },
    })
  } catch (e) {
    console.error(`[cron-logger] Failed to log ${jobName}:`, e)
  }
}
