/**
 * Middleware — nonce-based Content-Security-Policy (production only).
 *
 * A per-request nonce is generated here, exposed via the `x-nonce` response
 * header, and used for script-src so Next.js's inline scripts (RSC payload,
 * JSON-LD) are allowed without 'unsafe-inline'. The root layout reads the
 * same nonce for the inline schema script.
 *
 * style-src keeps 'unsafe-inline' deliberately: React style attributes and
 * next/font's injected <style> cannot use nonces.
 */

import { NextRequest, NextResponse } from "next/server";

/** Edge-safe UUID (Web Crypto is available on Edge + Node ≥ 19). */
function nonce(): string {
  return crypto.randomUUID();
}

const CSP = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

export function middleware(_request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const n = nonce();
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", CSP(n));
  response.headers.set("x-nonce", n);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
