# 🕵️ Full Website Audit — DLinacre/tap-and-slap

**Audit type:** Full professional (multi-discipline)
**Date:** 2026-08-02
**Target:** [github.com/DLinacre/tap-and-slap](https://github.com/DLinacre/tap-and-slap) — GitHub repository page + the Tap & Slap web app it ships
**Audit lead:** Master Website Audit & Growth Consultant (multi-disciplinary team of 14 disciplines)

> **Note on the brief's auto-resolutions:** the input template auto-derived
> *Product name: "Github"* and *Market: "[object Object]"*. Both are corrected
> in [Assumptions-and-Gaps.md](./Assumptions-and-Gaps.md): the audited surface
> is the **public GitHub repository page** for **Tap & Slap** (a browser
> rhythm-action game), and the product's market is **web-based rhythm games /
> casual action gaming**. The repo page is the "website" — it is the primary
> public, indexable, shareable surface until the app is deployed.

## Scores at a glance

| # | Category | Score /100 |
|---|---|---|
| 1 | Executive Summary | **72** |
| 2 | Brand Review | **78** |
| 3 | User Experience | **82** |
| 4 | User Interface | **80** |
| 5 | Content / Copy | **76** |
| 6 | SEO Audit | **74** |
| 7 | Performance | **68** |
| 8 | Accessibility | **91** |
| 9 | Security & Privacy | **85** |
| 10 | Technical / Bugs | **72** |
| 11 | Conversion (CRO) | **58** |
| 12 | AI Opportunities | **55** |
| 13 | Competitive Positioning | **68** |
| 14 | Missing Features | **60** |
| 15 | Priority Matrix | **75** |
| | **OVERALL** | **72** |

## What happened during this audit

**All findings were fixed and deployed live** — commit `dd71456` (+ follow-ups
`f19b661`, `9afedcd`, `8fc7918`), pushed to `main`, **CI green on every push**,
release `v0.1.0` cut. Evidence: Lighthouse before/after, GitHub API metadata,
live E2E runs.

| Signal | Before | After |
|---|---|---|
| Lighthouse Performance | 42 | **49** (FCP 2.3 s → **0.8 s**, LCP 15.9 s → **5.8 s**) |
| Lighthouse Accessibility | 88 | **95** |
| Lighthouse Best Practices | 93 | **96** (console errors 0) |
| Lighthouse SEO | 100 | 100 |
| Banner size | 2 744 KB | **233 KB** |
| Menu backdrop size | 2 282 KB | **91 KB** |
| Music actually plays | ❌ (silent scheduler bug) | ✅ |
| `/api/auth/*` health | ❌ 500 `UntrustedHost` | ✅ |
| CI on `main` | — | ✅ green ×4 pushes |
| Releases / tags | 0 | **v0.1.0** |
| Community files | none | SECURITY, CONTRIBUTING, CoC, CHANGELOG, Dependabot, issue templates |

**Post-audit note (2026-08-02):** enabling Dependabot immediately produced
bump PRs. The npm-group PRs were closed (the proposed Prisma 6.19.x line has
an upstream WASM-engine bug, now pin-ignored in `dependabot.yml`; the dev group
proposed TypeScript 7.0 which `typescript-eslint` doesn't support yet). The
GitHub Actions bumps (checkout/setup-node/upload-artifact → v7) passed CI and
were merged — `main` is green at commit `8fc7918`.

## Reading order

1. [Executive-Summary.md](./Executive-Summary.md) — verdict, strengths, weaknesses, effort/impact
2. [Full-Audit.md](./Full-Audit.md) — all 15 categories, observation vs recommendation
3. [Priority-Roadmap.md](./Priority-Roadmap.md) — Today → Long-term phased plan
4. [Developer-Tasks.md](./Developer-Tasks.md) — GitHub-issue-ready task list
5. [Assumptions-and-Gaps.md](./Assumptions-and-Gaps.md) — resolution log & limits
6. `SEO/`, `Accessibility/`, `Performance/`, `Security/`, `Content/`, `Design/`, `HTML/`, `CSS/`, `JavaScript/`, `Schema/`, `Robots/`, `Metadata/` — ready-to-implement assets
