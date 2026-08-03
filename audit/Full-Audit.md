# Full Audit — 15 Categories

Format per category: **Observations** (what exists) → **Recommendations**
(what to do) → **Score /100**. "Applied" marks fixes shipped live in commit
`dd71456`.

---

## 1. Executive Summary — 72

**Observations:** Overall a high-quality open-source product surface. Strong
engineering, strong docs, real product concept; missing live demo, social
proof, and (pre-fix) three functional bugs.
**Recommendations:** deploy the app; set homepage + social preview; keep the
release cadence (v0.1.0 cut during this audit).
**Score: 72**

## 2. Brand Review — 78

**Observations:**
- Identity: "TAP & SLAP" wordmark with dance emoji; AI-generated synthwave
  banner (neon sun, grid, punching fist) — distinctive, genre-correct.
- Typography: Orbitron (futuristic/arcade) self-hosted via `next/font` (applied).
- Colour: consistent neon system (pink `#ff2ec4`, cyan `#22d3ee`, gold
  `#ffd54a`, purple `#0a0118` bg) across app, README badges and banner.
- Tagline "Dance-mat beat 'em up" is clear and memorable.
**Recommendations:**
- Set the social preview (Settings → Social preview → `social-preview.jpg`) —
  the brand currently shares as a generic GitHub card. **(one click, applied
  asset prepared)**
- Add a logo mark file (`public/icon.svg` exists; consider a favicon set).
- Keep one brand voice: README, docs, and app copy already share the "slap /
  beat" voice — maintain it in future content.
**Score: 78**

## 3. User Experience — 82

**Observations (app):** single-screen flow (menu → play → results) with zero
friction; guest play without sign-up; pause on ESC/blur; offline score queue;
settings (volumes, calibration). UX of the game loop is strong.
**Observations (repo page):** README-first landing works; tabs (Code/Issues/
Actions/Releases) are GitHub-standard; navigation is clear.
**Recommendations:**
- Add a "Play now" anchor at the top of the README once deployed.
- Add keyboard shortcuts summary near controls (done in README).
- Ensure the menu explains the *rhythm* concept to first-timers (small "how to
  read the beat" hint) — content task.
**Score: 82**

## 4. User Interface — 80

**Observations:** consistent neon design system; animated HUD (combo pop,
judgment floats, shockwaves); CRT scanlines + vignette; responsive FIT canvas;
track picker with previews; grades with DDR letters (SSS–D).
**Recommendations (applied where marked):**
- ✅ Focus-visible rings for keyboard users (applied).
- ✅ `prefers-reduced-motion` support (applied).
- ✅ Legible minimum font sizes (9.5–10 px → 11 px minimum; applied).
- Bump `hud__accuracy`/progress labels on small screens; consider a
  high-contrast theme option (Medium).
**Score: 80**

## 5. Content / Copy — 76

**Observations:** README is above-average: what/why, soundtrack table,
features, screenshots, quick start, controls, quality gates, project map,
docs, roadmap, license. Docs set (PRD, architecture, DB, API, security,
execution plan) is unusually complete. App copy is consistent and on-voice.
**Recommendations:**
- Add FAQ section (how scoring works, is music licensed, can I contribute).
- Add a gameplay GIF (first 10 s of a run) — highest-impact content asset.
- CHANGELOG added (applied); keep release notes per version.
- Suggested rewritten hero copy in `Content/` folder.
**Score: 76**

## 6. SEO Audit — 74

**Observations:**
- Repo title/description contain strong keywords ("dance-mat beat 'em up",
  "Next.js 15 + Phaser 3 + TypeScript"); 10 topics set; README rich text.
- App (not yet deployed): Lighthouse SEO 100; metadata + OG + Twitter cards
  present; robots/sitemap/manifest/JSON-LD **added during audit**.
- Missing: live URL to crawl, social preview, FAQ content, backlinks.
**Recommendations:**
- Deploy → set `homepage` → submit sitemap to Google Search Console.
- Upload social preview (one click).
- Add long-tail FAQ section targeting "rhythm browser game", "tap game online".
- Keep image filenames descriptive; alt text already present.
**Score: 74**

## 7. Performance — 68

**Observations (lab, headless Chrome):** before → after:
| Metric | Before | After |
|---|---|---|
| Performance score | 42 | 49 |
| FCP | 2.3 s | **0.8 s** |
| LCP | 15.9 s | **5.8 s** |
| CLS | 0 | 0.03 |
| TBT | 140 s* | 148 s* |
| Console errors | 2–3 | 0 |

\* TBT/TTI are dominated by Phaser's rAF loop under software WebGL in headless;
real-device numbers will be far better. Still, we cut real waste: render-
blocking Google Fonts request removed (self-hosted `next/font`), 2.7 MB →
233 KB banner, 2.3 MB → 91 KB backdrop, scene now pauses when idle (CPU/battery).
**Recommendations:**
- Deploy behind a CDN (Vercel auto) for caching/compression.
- Consider `display: optional` for the font to zero out CLS.
- Long-term: pre-render an HTML menu (static shell) instead of canvas for the
  first screen; object-pool enemies at high densities.
**Score: 68**

## 8. Accessibility — 91 (WCAG 2.2 oriented)

**Observations:** Lighthouse accessibility 88 → **95** after fixes.
Applied: native `ul/li` for the level list (removed prohibited `role="listitem"`
on buttons), heading order (h1 → h2 panels), visible `:focus-visible` outlines,
`prefers-reduced-motion`, 11 px minimum text, zoomable viewport
(`user-scalable=no` removed), aria-labels on icon buttons, alt text on all
images, color+text judgment feedback (not color-only), keyboard-only playable.
Remaining:
- Canvas is a single interactive region; provide a text description + keyboard
  fallback instructions (partially present in footer).
- Judgment announcements could use an `aria-live` region (polite) — low effort.
- Contrast of `--text-dim` on panels is 7+:1 (passes); verify small badges.
**Score: 91**

## 9. Security & Privacy — 85

**Observations (applied):**
- Production CSP: `default-src 'self'` + locked script/style/img/font/connect,
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`, `form-action`.
- Existing headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options:
  DENY`, `Referrer-Policy`, `Permissions-Policy`.
- Auth: bcrypt(12), JWT HttpOnly session, rate limits, Zod validation,
  server-side run integrity checks. `trustHost` bug fixed (auth 500s).
- `SECURITY.md` + Dependabot added.
Recommendations:
- Upgrade CSP to nonce-based script allowlist (remove `'unsafe-inline'`) —
  requires middleware nonce plumbing (~1 day).
- Add `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` carefully
  (test WebGL), `Strict-Transport-Security` once on https domain.
- Cookie flags: verify `Secure` + `SameSite=Lax` on the auth cookie in prod.
- Revoke the pasted PATs (two tokens were shared in chat — treat as exposed).
**Score: 85**

## 10. Technical / Bugs — 72

**Observations & fixes (all applied):**
| Bug | Severity | Fix |
|---|---|---|
| Audio scheduler negative times → music silent | 🔴 Critical | Absolute AudioContext-time scheduling + negative-time guard |
| Auth.js `UntrustedHost` → `/api/auth/*` 500 | 🔴 Critical | `trustHost: true` |
| Scene-pause race → run stuck paused | 🟠 High | Desired-state idle + reconciler interval |
| 401 console noise on guest boot | 🟡 Low | Session-gated probe |
| 2.3–2.7 MB images | 🟡 Low | JPEG re-encode (~95% smaller) |
| Render-blocking font | 🟡 Low | `next/font` self-hosting |

Quality signals: strict TS clean, ESLint 0 warnings, 74/74 unit+component
tests, 4/4 E2E (x2 runs), CI green on GitHub.
Remaining: source maps for first-party JS in dev only (fine); add `npm audit`
gate to CI (Low).
**Score: 72**

## 11. Conversion (CRO) — 58

**Observations:** The repo "converts" visitors to (a) stars, (b) forks/PRs,
(c) playing the game. Current blockers: no live demo, no social preview, 0
stars, no gameplay GIF, no "Play now" CTA, no share automation.
**Recommendations (prioritised):**
1. Deploy + homepage link + "▶ PLAY NOW" README CTA (highest impact).
2. Gameplay GIF at the top.
3. Social preview upload (share links become brand assets).
4. Star/fork badges already in README; add "Share on X" link.
5. Post release notes on release — done (v0.1.0).
**Score: 58**

## 12. AI Opportunities — 55

**Observations:** The product already uses deterministic procedural generation
(maps, music) — an "AI-adjacent" content pipeline; no LLM/AI features yet.
**Recommendations (value-ranked):**
1. **Daily seeded challenge** — procedural per-day map with one leaderboard
   (drives daily retention; trivial with the existing generator). Value: ★★★★
2. **Difficulty auto-balancing** — cluster player accuracy per level and
   nudge density; data-driven (needs analytics). Value: ★★★
3. **Support/FAQ copilot** — README/docs are structured; wire a small
   retrieval-augmented FAQ bot on the docs. Value: ★★
4. **Automated share-card generation** — after each run, generate a branded
   score card image (OG-ready) for social sharing. Value: ★★★
**Score: 55**

## 13. Competitive Positioning — 68

**Observations:** vs typical rhythm-game repos on GitHub: above average on
docs/tests/CI/design; average on community (0 stars — new), below average on
"try it now" (no deployment).
**Recommendations:** adopt the "one-click play" pattern (deployed demo, README
gif), release notes, and a CONTRIBUTING that invites content contributions
(levels/tracks are pure data — ideal first PRs).
**Score: 68**

## 14. Missing Features — 60

High-value gaps (prioritised):
1. Live deployment + homepage URL (P0).
2. Social preview image (P0, one click — asset ready).
3. Gameplay GIF/video (P1).
4. FAQ + accessibility statement in README (P1).
5. Analytics (P1) — privacy-friendly (Plausible/Umami) with funnel events.
6. PWA install + haptics (P2).
7. Daily challenge (P2).
**Score: 60**

## 15. Priority Matrix — 75

See [Priority-Roadmap.md](./Priority-Roadmap.md) for the full matrix
(Critical/High/Medium/Low × effort × impact). The audit package itself is
scored 75 for completeness/actionability.
**Score: 75**
