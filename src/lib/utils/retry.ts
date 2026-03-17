/**
 * 지수 백오프 재시도 유틸리티
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 1000, label = "unknown" } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      // 400/404 등 클라이언트 에러는 재시도 불필요
      if (error instanceof Error && /HTTP (400|401|403|404|422)/.test(error.message)) {
        throw error
      }
      if (attempt === maxRetries) throw error
      const delay = baseDelayMs * Math.pow(2, attempt)
      console.warn(
        `[retry] ${label} attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms:`,
        error instanceof Error ? error.message : String(error)
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  // unreachable
  throw new Error(`[retry] ${label} exhausted retries`)
}
