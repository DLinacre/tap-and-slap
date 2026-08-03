/**
 * Origin resolution for absolute URLs (sitemap, robots, OG, canonical).
 *
 * Priority: explicit env → request-derived (behind proxies/CDNs) → fallback.
 * Fixes the production bug where sitemap/robots pointed at localhost when
 * NEXT_PUBLIC_APP_URL was unset on the host (Vercel).
 */

import { headers } from "next/headers";
import type { NextRequest } from "next/server";

const PROD_FALLBACK = "https://tap-and-slap.vercel.app";

/** Origin from the current request's forwarded headers (Vercel/Netlify set them). */
export async function originFromHeaders(): Promise<string | null> {
  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "https";
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host) return null;
    return `${proto}://${host}`;
  } catch {
    return null;
  }
}

/** Origin from a NextRequest (middleware/route handlers). */
export function originFromRequest(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return host ? `${proto}://${host}` : PROD_FALLBACK;
}

/** Best-effort public origin for static generation contexts. */
export async function getOrigin(): Promise<string> {
  return process.env.NEXT_PUBLIC_APP_URL ?? (await originFromHeaders()) ?? PROD_FALLBACK;
}
