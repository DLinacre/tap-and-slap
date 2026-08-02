# Tap & Slap — Security, Auth & Quality Standards

---

## 1. Threat model (MVP)

| Threat | Vector | Mitigation |
|---|---|---|
| Fake scores / cheating | Hand-crafted POST /api/scores | Server-side integrity checks (note counts, max score, accuracy consistency, duration), rate limits; replay verification planned (Phase 3) |
| Account stuffing / spam | /api/auth/register, credentials sign-in | Zod validation, bcrypt (cost 12), per-IP rate limit 10/min, generic error messages |
| Session theft | Stolen JWT cookie | HttpOnly + Secure cookies (Auth.js defaults), 30-day maxAge, AUTH_SECRET rotation documented |
| Credential leaks | Logs | Structured logger redacts `password`, `token`, `authorization`, `cookie`, `secret` keys |
| Injection | DB queries | Prisma parameterized queries only; no raw SQL in app code |
| XSS | User-controlled strings (username, scores) | React escaping everywhere; usernames restricted to `[a-zA-Z0-9_-]{3,20}`; JSON-only API; `X-Content-Type-Options: nosniff` |
| CSRF | State-changing endpoints | Auth.js double-submit CSRF token for credentials; JSON content-type checks; same-origin monolith |
| DoS (cheap) | Spam submissions | 12/min score limit, 10/min auth limit, in-memory sliding window; Redis-backed at scale |
| Guest spoofing | Forged guestId | Acceptable MVP trade-off (a guest is pseudonymous by design); integrity checks bound the damage; documented |
| Supply chain | npm deps | Lockfile (`package-lock.json`), CI `npm ci`, engines pinned ≥ Node 20, automated Dependabot (Phase 3) |

---

## 2. Input validation matrix

Every API surface parses with Zod (`src/lib/validation/schemas.ts`):

| Field | Schema | Notes |
|---|---|---|
| email | `.email().max(254)`, trimmed+lowercased | normalize before store |
| username | `/^[a-zA-Z0-9_-]{3,20}$/` | kills control chars & HTML |
| password | 8–72 chars | bcrypt max input size respected |
| score | int 0..10,000,000 | plus service-level max-score check |
| counts | int ≥ 0, ≤ 20,000 each | plus sum == noteCount |
| accuracy | 0..100 float | plus consistency check |
| durationMs | 1,000..600,000 | plus map-duration floor |
| guestId | `.uuid()` | format-checked |
| difficulty | enum EASY/NORMAL/HARD/INSANE | |
| limit | coerced int 1..50 | |
| autoplay | boolean, defaults false | |

Unparseable JSON → 400 `INVALID_JSON`; failures include Zod `flatten()` details
(no raw input echoed back).

## 3. Auth design

- **Provider:** Auth.js v5 beta, Credentials only. Passwords bcrypt-hashed
  (cost 12) with `bcryptjs` (pure JS, no native toolchain).
- **Session:** stateless JWT, `strategy: "jwt"`, 30-day maxAge, HttpOnly cookie.
- **Server access:** route handlers call `await auth()`; `/api/me` and
  `/api/scores/me` require it; score POST works for guests (no account wall).
- **Type safety:** session user augmented (`src/types/next-auth.d.ts`) with
  `id` + `username`.
- **Client:** `SessionProvider` + `signIn("credentials", { redirect: false })`
  + `useSession().update()`.

## 4. Secrets & configuration

| Env var | Dev default | Prod requirement |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | managed Postgres DSN |
| `AUTH_SECRET` | dev fallback in code (clearly marked) | **required** — `npx auth secret`; rotate = regenerate + re-deploy |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | canonical https origin |
| `LOG_LEVEL` | info | debug in staging only |

- `.env` is gitignored; `.env.example` documents every variable.
- No secrets in client bundles (`NEXT_PUBLIC_` only for non-secrets).
- Server-only modules guarded with `server-only` import (bundler error on client leak).

## 5. Security headers (`next.config.ts`)

`X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY` ·
`Referrer-Policy: strict-origin-when-cross-origin` ·
`Permissions-Policy: camera=(), microphone=(), geolocation=()`.
A strict CSP is intentionally deferred (Phaser injects inline styles; needs
`nonce` plumbing) — documented Phase 3 hardening.

## 6. Testing strategy

### Pyramid
| Layer | Tool | Scope | Count |
|---|---|---|---|
| Unit | Vitest | BeatClock, Judgement, ScoreTracker, map generator determinism, song builder, Zod schemas, score-service (fake repo) | 68 tests |
| Component | Vitest + Testing Library | Hud (score/combo/judgment/pause), Menu (levels, start, leaderboard, sign-in) | 9 |
| E2E | Playwright (chromium, production build) | menu renders 3 levels · autoplay QA run reaches results · pause toggle · API health | 4 |
| CI | GitHub Actions | lint → typecheck → unit → build → seed → e2e (retries on flake) | — |

### Testability seams (deliberate)
- `BeatClock` accepts injectable `now()`.
- `ScoreTracker`, `Judgement`, `generateMap`, `buildSong`, Zod schemas are pure.
- `score-service` takes a `ScoreRepo` + `findLevelId` (in-memory fakes in tests).
- `TypedEmitter`/bridge let components run with no Phaser instance (canvas 2D
  stub in `tests/setup.ts`; `phaser3spectorjs` mocked).
- QA flags: `?autoplay=1` (bot), `?qa=1` (8-bar maps) make gameplay E2E deterministic.

### Quality gates (CI, `.github/workflows/ci.yml`)
1. `npm ci` (lockfile)
2. `npm run lint` — flat ESLint (next/core-web-vitals + typescript)
3. `npm run typecheck` — `tsc --noEmit` (strict + noUncheckedIndexedAccess)
4. `npm test` — Vitest, 8 files
5. `npm run build` — production build (type-checked routes)
6. `prisma db push && npm run db:seed`
7. `npm run test:e2e` — Playwright against `next start`
8. Playwright HTML report uploaded on failure

## 7. Observability

- **Logs:** JSON lines `{time, level, msg, fields…}` with key redaction;
  structured events: `user.created`, `score.recorded` (never raw passwords),
  `scores.submit_failed`, `auth.registered`.
- **Health:** `/api/health` probes DB (`SELECT 1`) for orchestrators.
- **Client:** lightweight `logger-client` (console) — swap for Sentry in Phase 3.

## 8. Accessibility & quality-of-life

- Keyboard-only play (arrows/WASD, ESC/P pause) — no mouse required.
- `aria-label`s on icon buttons; testids for tests.
- `prefers-reduced-motion` media query planned for overlay animations (Phase 3).
- Visual timing feedback doubles as accessibility (judgment text ≠ color-only).
