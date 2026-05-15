/**
 * In-memory rate limiter (Vercel serverless compatible).
 * Each function instance has its own Map — this provides
 * "best effort" rate limiting without external stores.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

// Cleanup stale entries periodically
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt < now) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
  }

  if (existing.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

// Predefined rate limit configs
export const RATE_LIMITS = {
  analyze: { limit: 5, windowMs: 60_000 } as RateLimitConfig,
  compare: { limit: 3, windowMs: 60_000 } as RateLimitConfig,
  brand: { limit: 20, windowMs: 60_000 } as RateLimitConfig,
} as const;
