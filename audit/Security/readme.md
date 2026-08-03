# Security assets

## Live now (commit dd71456)

**Response headers (production build):**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-DNS-Prefetch-Control: on
```

**Also:** Auth.js `trustHost: true` (fixed 500s), bcrypt(12), JWT HttpOnly
session, rate limits (auth 10/min, scores 12/min), Zod validation on every
route, server-side run integrity checks, `SECURITY.md`, Dependabot (npm
weekly + actions monthly), issue templates with private security path.

## Next: strict nonce CSP (remove 'unsafe-inline' for scripts)

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
  return response;
}
export const config = { matcher: ["/"] };
```

Then read the nonce in `src/app/layout.tsx` (`headers()` from
`next/headers`) and add `nonce={nonce}` to inline scripts.

## Production cookie hardening checklist

- [ ] `authjs.session-token`: `HttpOnly` (default), `Secure` (on https),
      `SameSite=Lax` (default)
- [ ] Add `Strict-Transport-Security: max-age=63072000; includeSubDomains`
      once served over https
- [ ] Test `Cross-Origin-Opener-Policy: same-origin` (may affect popups)

## Hygiene (do today)

- [ ] Revoke `ghp_Io1m…` and `ghp_TVM1…` (pasted into chat)
- [ ] Use a fine-grained PAT with `repo` scope only, stored in a vault
- [ ] `npm audit --audit-level=high` in CI (task in Developer-Tasks.md)
