import { timingSafeEqual } from "crypto";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const MAX_RATE_LIMIT_ENTRIES = 5000;
const rateLimitStore = new Map<string, RateLimitRecord>();
let lastCleanupTime = Date.now();

function cleanupExpiredRecords(now: number): void {
  if (now - lastCleanupTime < 60000 && rateLimitStore.size < MAX_RATE_LIMIT_ENTRIES) {
    return;
  }
  lastCleanupTime = now;
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
  if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
    const keysToDelete = Array.from(rateLimitStore.keys()).slice(0, 1000);
    for (const key of keysToDelete) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupExpiredRecords(now);

  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.limit - 1,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, options.limit - existing.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed: true,
    remaining,
    retryAfterSeconds,
  };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "127.0.0.1";
}

export function safeCompareSecret(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
