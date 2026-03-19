/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per key (typically IP address).
 */
const store = new Map<string, number[]>()

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter((t) => now - t < 3600_000)
    if (valid.length === 0) store.delete(key)
    else store.set(key, valid)
  }
}, 600_000)

export function rateLimit(key: string, maxRequests: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now()
  const timestamps = store.get(key) ?? []
  const valid = timestamps.filter((t) => now - t < windowMs)

  if (valid.length >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  valid.push(now)
  store.set(key, valid)
  return { success: true, remaining: maxRequests - valid.length }
}
