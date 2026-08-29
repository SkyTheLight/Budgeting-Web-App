// Simple in-memory rate limiter, keyed by (namespace, ip) so a burst on one
// endpoint never collateral-blocks another. NOTE: this is per-process storage —
// on serverless platforms it is scoped to a single warm instance.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 5 // 5 attempts per window

export function rateLimit(
  namespace: string,
  ip: string
): { success: boolean; remaining: number; resetTime: number } {
  if (!ip || ip === 'unknown') {
    ip = 'anonymous'
  }

  const key = `${namespace}:${ip}`
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS })
    // Opportunistic cleanup so the map can't grow unbounded
    if (rateLimitMap.size > 10_000) {
      for (const [key, value] of rateLimitMap) {
        if (now > value.resetTime) rateLimitMap.delete(key)
      }
    }
    return { success: true, remaining: MAX_REQUESTS - 1, resetTime: now + WINDOW_MS }
  }

  if (record.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { success: true, remaining: MAX_REQUESTS - record.count, resetTime: record.resetTime }
}

export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  // Prefer the rightmost `x-forwarded-for` entry when present — the first value is
  // user-spoofable, while the final hop is added by the trusted proxy.
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean)
    return parts[parts.length - 1] ?? 'unknown'
  }

  return 'unknown'
}

// Hard limit for encrypted backup payloads (decoded bytes). Prevents a single
// oversized request from forcing a large allocation + costly PBKDF2/AES work.
export const MAX_BACKUP_FILE_MB = 5
export const MAX_BACKUP_PASSWORD_LENGTH = 128
export const MIN_BACKUP_PASSWORD_LENGTH = 6