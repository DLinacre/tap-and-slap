# Forensic V2 — New GitHub-Issue Tasks (from this cycle)

## ✅ Done in this cycle (commit `aaa34bb`)
1. **fix(security): dependency CVEs** — sharp/postcss overrides, prisma 6.19.3, bcryptjs 3, `npm audit` 0. (eng)
2. **fix(anti-cheat): idempotent score submission** — `runId` + unique index + dedupe; live-verified. (eng)
3. **fix(a11y): axe violations** — canvas `role="img"`, boot-splash landmarks; 0 violations. (eng)
4. **fix(edge): branded 404 + root ErrorBoundary.** (eng)
5. **chore(release): rewrite placeholder v1.0.0** with real notes. (growth)

## 📋 Next issues (owner action required — mostly manual)

### Task N1 — Deploy the app and set the homepage
- **Priority:** Critical · **Effort:** 1–2 h · **Owner:** eng
- **Acceptance:** `GET /api/health` → `{"status":"ok","db":"up"}` on the deployed origin; repo `homepage` set; README "▶ PLAY NOW" added.
- Note: migration `add_run_id` must be applied (`prisma migrate deploy`) before the first deploy.

### Task N2 — Upload social preview image
- **Priority:** Critical · **Effort:** 2 min · **Owner:** growth
- **Acceptance:** sharing the URL shows the synthwave banner (`social-preview.jpg` in repo root).

### Task N3 — Rotate exposed PATs
- **Priority:** Critical · **Effort:** 5 min · **Owner:** security
- **Acceptance:** `ghp_Io1m…` and `ghp_TVM1…` return 401.

### Task N4 — Strict nonce CSP
- **Priority:** High · **Effort:** 1 day · **Owner:** security/eng
- **Acceptance:** `script-src` has no `'unsafe-inline'`; E2E green.

### Task N5 — Analytics funnel (play_started / level_completed / score_submitted / share_clicked)
- **Priority:** High · **Effort:** 1 day · **Owner:** growth
- Snippet ready in `JavaScript/analytics.md`.

### Task N6 — CI `npm audit` gate
- **Priority:** Medium · **Effort:** 30 min · **Owner:** security
- **Acceptance:** PRs with high-severity unfixed vulns fail CI (this cycle proved it matters — 6 highs found).

### Task N7 — Gameplay GIF + FAQ in README
- **Priority:** Medium · **Effort:** 2 h · **Owner:** content

### Task N8 — Daily seeded challenge
- **Priority:** Medium · **Effort:** 2–3 days · **Owner:** eng
- High retention value; the deterministic generator makes this trivial.

## Testing lesson (from F2a — worth an issue)
- **Task T1 — Add "repo contract" assertions to service tests.**
- **Priority:** Low · **Effort:** 1 h · **Owner:** eng
- **Why:** the Prisma field-by-field mapper silently dropped `runId`; the fake repo stored raw params and masked it. Tests should assert what the repo layer actually persists, not just the service-level contract.
