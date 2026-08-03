# Assumptions & Gaps

## Auto-resolution corrections (from the brief)

| Brief field | Auto-resolved as | Corrected |
|---|---|---|
| Product / brand | "Github" | **Tap & Slap** — the product the repo ships; "GitHub" is the hosting platform, not the brand |
| Market / niche | "[object Object]" | **Web-based rhythm-action games** (casual players, rhythm-game enthusiasts, keyboard & mobile) |
| Target | github.com/DLinacre/tap-and-slap | Audited as a **repository landing page + the web app it contains** — the repo is the public, indexable, shareable surface today |

## What was audited vs what was not

**Audited with live evidence:**
- Repo metadata via GitHub API (description, topics, releases, pages, CI).
- Public rendered README (page fetch).
- App performance/a11y/best-practices/SEO via Lighthouse against the
  production build (headless Chrome, software WebGL).
- Live API behaviour (health, auth, scores, levels).
- Full CI pipeline on GitHub Actions (green).

**Not audited (documented gaps):**
- Real-device Core Web Vitals (no deployment yet) — lab numbers only.
- Search-engine ranking positions (repo is new; indexation takes time).
- Real-user analytics (no analytics installed yet — Task 6).
- Mobile real-device testing (emulated only).
- The deployed origin's TLS/CDN behaviour (deployment is a manual step the
  account owner must perform — Tasks 1–2).

## Evidence files

- Lighthouse before: captured at audit start (Perf 42 / A11y 88 / BP 93 / SEO 100).
- Lighthouse after: Perf 49 / A11y 95 / BP 96 / SEO 100 (FCP 0.8 s, LCP 5.8 s).
- E2E: 4/4 passing, run twice for stability.
- CI: green on commit `dd71456`.
- Release: `v0.1.0` published.

## Constraints respected

- Observations vs recommendations are separated in every category.
- Recommendations follow WCAG 2.2, Core Web Vitals, modern SEO, responsive
  design and secure-defaults standards.
- No invented competitor claims; "patterns worth adopting" are described
  generically.
