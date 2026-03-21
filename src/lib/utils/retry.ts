// ── Circuit Breaker ──────────────────────────────────────

interface CircuitState {
  failures: number
  lastFailure: number
}

const circuits = new Map<string, CircuitState>()

const CIRCUIT_THRESHOLD = 5
const CIRCUIT_RESET_MS = 60_000

function checkCircuit(label: string): void {
  const state = circuits.get(label)
  if (!state) return
  if (state.failures >= CIRCUIT_THRESHOLD) {
    if (Date.now() - state.lastFailure < CIRCUIT_RESET_MS) {
      throw new Error(`[circuit-breaker] ${label} is open (${state.failures} consecutive failures)`)
    }
    // Reset after cooldown
    circuits.delete(label)
  }
}

function recordFailure(label: string): void {
  const state = circuits.get(label) ?? { failures: 0, lastFailure: 0 }
  state.failures++
  state.lastFailure = Date.now()
  circuits.set(label, state)
}

function recordSuccess(label: string): void {
  circuits.delete(label)
}

// ── Retry with Circuit Breaker ──────────────────────────

/**
 * 지수 백오프 재시도 유틸리티 (circuit breaker 내장)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 1000, label = "unknown" } = options

  checkCircuit(label)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      recordSuccess(label)
      return result
    } catch (error) {
      // 400/404 등 클라이언트 에러는 재시도 불필요
      if (error instanceof Error && /HTTP (400|401|403|404|422)/.test(error.message)) {
        throw error
      }
      if (attempt === maxRetries) {
        recordFailure(label)
        throw error
      }
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
