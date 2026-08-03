# Developer / Product Task List (GitHub-Issue Format)

Each task: **Title · Description · Acceptance criteria · Priority · Effort · Discipline**.

## 🔴 Task 1 — Deploy the app and wire the repo to it
**Description:** Deploy `DLinacre/tap-and-slap` (Next.js 15, Node 22) to a
hosting platform (Vercel recommended; Render/Netlify fine). Set env:
`DATABASE_URL` (managed Postgres or Vercel Postgres), `AUTH_SECRET`
(`npx auth secret`), `NEXT_PUBLIC_APP_URL` (https URL). Run
`prisma migrate deploy` + `npm run db:seed` against prod DB. Set the repo
`homepage` field to the deployed URL; add "▶ PLAY NOW" button at the top of
the README.
**Acceptance criteria:** `GET /<origin>/api/health` → `{"status":"ok","db":"up"}`;
repo header links to the live game; a fresh visitor can play a full level
without signing up.
**Priority:** Critical · **Effort:** 1–2 h · **Owner:** eng

## 🔴 Task 2 — Set GitHub social preview
**Description:** Repository → Settings → Social preview → Upload image →
`social-preview.jpg` (1280×640, already in repo root).
**Acceptance criteria:** Sharing the repo URL on X/Slack/WhatsApp shows the
synthwave banner, not the GitHub logo.
**Priority:** Critical · **Effort:** 2 min · **Owner:** growth

## 🔴 Task 3 — Rotate exposed access tokens
**Description:** Two classic PATs were pasted into a chat session
(`ghp_Io1m…`, `ghp_TVM1…`). Revoke both in GitHub Settings → Developer
settings → Personal access tokens; create a fine-grained token scoped to this
repo only, stored in a password manager.
**Acceptance criteria:** Old tokens return 401; no credentials in repo
history (verified: `.env` never committed; `git log` clean).
**Priority:** Critical · **Effort:** 5 min · **Owner:** security

## 🟠 Task 4 — Gameplay GIF for the README
**Description:** Record a 6–10 s clip of `first-beat` (EASY) with the QA
autoplay mode (`?autoplay=1`) or a real run; loop, keep < 2 MB; place between
the banner and the features section.
**Acceptance criteria:** GIF loads on the repo page, shows judgment
feedback + combo, alt text present.
**Priority:** High · **Effort:** 1 h · **Owner:** design

## 🟠 Task 5 — Strict nonce-based CSP
**Description:** Replace `script-src 'self' 'unsafe-inline'` with a nonce
flow: generate a nonce per request in middleware, attach to inline scripts via
`<script nonce>` in layout, and pass the nonce header.
**Acceptance criteria:** `unsafe-inline` absent from `script-src`; E2E suite
green; WebGL game unaffected.
**Priority:** High · **Effort:** 1 day · **Owner:** security/eng

## 🟠 Task 6 — Privacy-friendly analytics + funnel events
**Description:** Add Plausible or Umami; instrument events: `play_started`,
`level_completed`, `score_submitted`, `share_clicked`, `signup`.
**Acceptance criteria:** Events visible in dashboard; no personal data
collected; consent-light approach documented in README/privacy note.
**Priority:** High · **Effort:** 1 day · **Owner:** growth

## 🟡 Task 7 — FAQ & accessibility statement in README
**Description:** Add FAQ (how scoring works, music licensing — all original
except public-domain Ode to Joy, how to contribute) and a short accessibility
section (keyboard support, reduced motion, zoom, feedback channel).
**Acceptance criteria:** README renders the sections; links to SECURITY.md
and CONTRIBUTING.md.
**Priority:** Medium · **Effort:** 2 h · **Owner:** content

## 🟡 Task 8 — Daily seeded challenge
**Description:** Seed a map per calendar day (`seed = f(date, level)`), expose
via `/api/challenge`, one leaderboard per day; menu shows "Today's Challenge".
**Acceptance criteria:** Same map for all players on a day; scores appear on
the daily board; unit tests for seed determinism.
**Priority:** Medium · **Effort:** 2–3 days · **Owner:** eng

## 🟡 Task 9 — PWA + haptics
**Description:** Add service worker (workbox/next-pwa or manual), offline
shell for the menu, `navigator.vibrate(10)` on PERFECT (Android), install
prompt hook.
**Acceptance criteria:** Lighthouse PWA category ≥ 90; installable from
mobile Chrome; haptics gated on user gesture + settings toggle.
**Priority:** Medium · **Effort:** 2–3 days · **Owner:** eng

## 🟢 Task 10 — CI: npm audit gate
**Description:** Add `npm audit --audit-level=high` step to
`.github/workflows/ci.yml` (allow-list for unfixable transitive issues).
**Acceptance criteria:** PRs with high-severity unfixed vulns fail CI.
**Priority:** Medium · **Effort:** 30 min · **Owner:** security

## 🟢 Task 11 — Share-card generator
**Description:** After a run, render a branded score card (canvas → PNG,
1280×640) with grade + combo; "Share" button downloads/copies it.
**Acceptance criteria:** Card matches brand palette; share click fires the
`share_clicked` event.
**Priority:** Medium · **Effort:** 2–3 days · **Owner:** design/eng

## 🟢 Task 12 — Enemies object pooling
**Description:** Pool `Enemy` images instead of create/destroy at high
density; profile with 500+ concurrent notes.
**Acceptance criteria:** No GC hiccups at INSANE density on a mid-range phone;
frame time stable.
**Priority:** Low · **Effort:** 1 day · **Owner:** eng
