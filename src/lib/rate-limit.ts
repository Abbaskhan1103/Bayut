/**
 * Simple in-memory rate limiter.
 * Resets per window per key. Works for single-instance deployments (Vercel serverless with warm instances).
 * For multi-region or high-scale, replace with Upstash Redis.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/**
 * Returns true if the request is allowed, false if rate limited.
 * @param key      Unique key (e.g. "rsvp:1.2.3.4")
 * @param max      Max requests per window
 * @param windowMs Window size in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) {
    return false;
  }

  entry.count++;
  return true;
}

/** Extract best-effort client IP from Next.js request headers */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
