/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for a single-instance monolith (the MVP shape). When the app is
 * scaled to multiple instances, swap this for a Redis-backed limiter — the
 * `RateLimiter` interface below is the seam (see docs/05-security-quality.md).
 */

import { ApiError } from "./errors";

export interface RateLimiter {
  /** Returns normally on success, throws ApiError(429) when exceeded. */
  consume(key: string): void;
}

interface Bucket {
  hits: number[];
  windowStart: number;
}

export interface RateLimiterOptions {
  /** Max requests per `windowMs` per key. */
  max: number;
  windowMs: number;
  /** Human-readable bucket label for logs/errors. */
  name: string;
  now?: () => number;
}

export function createRateLimiter(opts: RateLimiterOptions): RateLimiter {
  const now = opts.now ?? Date.now;
  const buckets = new Map<string, Bucket>();
  const MAX_BUCKETS = 10_000;

  const sweep = (key: string): Bucket => {
    const t = now();
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= MAX_BUCKETS) buckets.clear(); // crude guard, documented
      bucket = { hits: [], windowStart: t };
      buckets.set(key, bucket);
    }
    if (t - bucket.windowStart >= opts.windowMs) {
      bucket.hits = [];
      bucket.windowStart = t;
    }
    return bucket;
  };

  return {
    consume(key: string): void {
      const bucket = sweep(key);
      const t = now();
      const cutoff = t - opts.windowMs;
      bucket.hits = bucket.hits.filter((h) => h > cutoff);
      if (bucket.hits.length >= opts.max) {
        const oldest = bucket.hits[0] ?? t;
        const retryAfter = Math.max(1, Math.ceil((oldest + opts.windowMs - t) / 1000));
        throw ApiError.tooManyRequests(`${opts.name}: too many requests`, retryAfter);
      }
      bucket.hits.push(t);
    },
  };
}

/** Loose per-IP limiter for auth endpoints. */
export const authLimiter = createRateLimiter({ name: "auth", max: 10, windowMs: 60_000 });

/** Per-actor score submission limiter (users & guests). */
export const scoreLimiter = createRateLimiter({ name: "scores", max: 12, windowMs: 60_000 });

/** Client IP extraction — respects the proxy chain headers. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
