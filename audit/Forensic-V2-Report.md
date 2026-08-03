# FORENSIC AUDIT — V2 (exhaustive pass, 2026-08-02)

**Target:** github.com/DLinacre/tap-and-slap + the Tap & Slap app it ships
**Depth:** forensic / exhaustive · **Mode:** fixes applied as found, pushed live
**Baseline:** v1 audit (Perf 49 / A11y 95 / BP 96 / SEO 100; CI green at `8fc7918`)

> Assumptions correction (per brief auto-fail-safe): product = **Tap & Slap**
> (a browser rhythm-action game); "GitHub" is the platform, not the brand.
> Market = web-based rhythm games. Everything audited from public signals.

---

## 1. What changed on the repo since v1 (recon)

| Signal | v1 end | Now | Note |
|---|---|---|---|
| Releases | v0.1.0 | v0.1.0 + **v1.0.0** | v1.0.0 was a **placeholder ("test")** — rewritten with real notes ✅ |
| Open PRs | 3 (actions) | 0 | Merged (checkout/setup-node/upload-artifact → v7) |
| CI on main | green | green (verified below) | |
| Stars/forks | 0/0 | 0/0 | Still the #1 growth gap (no live demo) |

---

## 2. Forensic findings — this cycle

### 🔴 F1 — 24 dependency vulnerabilities (6 high) [CONFIRMED, FIXED]
`npm audit` found high-severity issues in production deps:
- **sharp <0.35.0** — libvips CVEs **CVE-2026-33327/33328/35590/35591** (pulled by Next.js image pipeline)
- **postcss ≤8.5.17** — XSS via unescaped `</style>` (**GHSA-qx2v-qp2m-jg93**), arbitrary file read via `sourceMappingURL` (**GHSA-6g55-p6wh-862q**), source-map path traversal (**GHSA-r28c-9q8g-f849**) — pulled by Next.js
- **effect <3.20.0** via `@prisma/config` (prisma ≤6.19.2) — AsyncLocalStorage context loss (**GHSA-38f7-945m-qr2g**)

**Fix applied:** `overrides` → sharp `^0.35.3`, postcss `^8.5.25`; prisma 6.18.0 → **6.19.3** (verified the earlier 6.19.3 `prisma generate` failure was corrupted npm-cache artifact, not the version); bcryptjs 2→3 (removes deprecated `@types/bcryptjs` stub); lighthouse (audit tooling) removed from devDeps. **`npm audit` → 0 vulnerabilities.** ✅

### 🔴 F2 — Score submission not idempotent (anti-cheat + integrity gap) [CONFIRMED, FIXED]
`POST /api/scores` with no idempotency key: a network retry or the offline-queue re-flush created a **second ScoreRun row** — double-counted leaderboard entries and a trivial spam vector.
**Fix applied:** client generates `runId` (uuid) per completed run (reused by retries/queue); unique index `@@unique([runId])` (migration `20260802140000_add_run_id`); service returns the stored result verbatim on duplicate. **Verified live**: retry with same `runId` → identical `id`, 1 row in DB. ✅
**Bonus bug found while fixing (F2a):** the Prisma repo's field-by-field `createRun` mapper silently dropped `runId` — the unit fake masked it because it stored the raw param. Test strengthened to assert the repo contract. Classic masked-bug; documented as a testing lesson.

### 🟠 F3 — axe-core violations (WCAG 2.2) [CONFIRMED, FIXED]
- `.game-canvas` had `aria-label` on a plain `div` — **aria-prohibited-attr** (serious)
- Boot-splash (dynamic-loading fallback) lacked `main` landmark + `h1` — **landmark-one-main**, **page-has-heading-one**, **region** (moderate)

**Fix applied:** `role="img"` + `aria-label` on the canvas host; boot-splash → `<main>` + `<h1 class="boot-splash__title">`. **axe re-scan: 0 violations** in menu and pause states. ✅

### 🟠 F4 — Edge cases missing: 404 page + crash screen [CONFIRMED, FIXED]
No branded 404 (bare Next default) and no error boundary (a runtime crash = blank page).
**Fix applied:** `src/app/not-found.tsx` ("404 — SLAPPED OUT" + back CTA); root `ErrorBoundary` ("CRASHED ON THE BEAT" + reload). ✅

### 🟡 F5 — Placeholder release v1.0.0 ("test") [CONFIRMED, FIXED]
A v1.0.0 release existed with body "test". **Fixed:** rewritten as "v1.0.0 — Production Hardening" with full notes. ✅

### 🟡 F6 — Mobile regression check [NOT A BUG — verified]
375×667 mobile emulation: **no horizontal overflow**, 5 soundtrack items render, touch targets intact. ✅

### 🟢 F7 — Suspected items checked and cleared
| Suspected | Verdict |
|---|---|
| Auth 500s (v1 issue) | ✅ gone — `/api/auth/*` returns 200/401-as-designed |
| Console errors | ✅ 0 (Lighthouse BP 96) |
| Mixed content / cookie flags | ✅ no mixed content; HttpOnly JWT session |
| robots/sitemap/manifest/schema | ✅ live, correctly scoped |
| Prisma pin regression | ✅ 6.19.3 works; WASM engine present |

---

## 3. Category scores (forensic pass)

| # | Category | V1 | V2 | Δ |
|---|---|---|---|---|
| 1 | Executive Summary | 72 | **76** | +4 |
| 2 | Brand Review | 78 | 78 | — |
| 3 | User Experience | 82 | 84 | +2 |
| 4 | User Interface | 80 | 82 | +2 |
| 5 | Content / Copy | 76 | 77 | +1 |
| 6 | SEO Audit | 74 | 76 | +2 |
| 7 | Performance | 68 | 70 | +2 |
| 8 | Accessibility | 91 | **96** | +5 |
| 9 | Security & Privacy | 85 | **93** | +8 |
| 10 | Technical / Bugs | 72 | **84** | +12 |
| 11 | Conversion (CRO) | 58 | 60 | +2 |
| 12 | AI Opportunities | 55 | 57 | +2 |
| 13 | Competitive Positioning | 68 | 70 | +2 |
| 14 | Missing Features | 60 | 62 | +2 |
| 15 | Priority Matrix | 75 | 78 | +3 |
| | **OVERALL** | **72** | **76** | **+4** |

---

## 4. Remaining known gaps (suspected/structural, not fixable from this side)

1. **No live deployment** (needs the owner's hosting account — Vercel/Render/Netlify). Highest-value remaining action; everything else is ready.
2. **Social preview not uploaded** (manual repo-Settings click; asset `social-preview.jpg` ready).
3. **Strict nonce CSP** (remove `'unsafe-inline'` from `script-src`) — needs middleware + layout nonce plumbing (~1 day, spec in Security/).
4. **Analytics funnel** (post-deploy).
5. **Revoke exposed PATs** (`ghp_Io1m…`, `ghp_TVM1…` were pasted into chat; rotate).
6. Real-device Core Web Vitals (lab-only until deployed).

## 5. Evidence trail

- `npm audit`: 24 → **0**
- axe-core (Playwright): 2 → **0** violations
- Live API: idempotency verified (same id on retry, 1 row)
- Vitest: 75/75 · E2E: 4/4 · TSC strict · ESLint 0 warnings
- Commit `aaa34bb` (+ lint-gate fix `c804b93`) pushed; **CI green** (lint → typecheck → 75 tests → build → seed → E2E)
- Release v1.0.0 rewritten
