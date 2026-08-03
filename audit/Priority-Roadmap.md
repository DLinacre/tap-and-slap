# Priority Roadmap — Today → Long Term

## Immediate (Today) — quick wins

| Task | Est. | Impact | Status |
|---|---|---|---|
| Set social preview (Settings → Social preview → upload `social-preview.jpg`) | 2 min | ★★★★★ | Asset ready; manual click |
| Deploy app (Vercel: import repo → build `npm run build`, Node 22; set `DATABASE_URL`, `AUTH_SECRET`; `prisma migrate deploy && npm run db:seed`) | 1–2 h | ★★★★★ | Manual (needs your account) |
| Set repo `homepage` to deployed URL | 1 min | ★★★★ | After deploy |
| Add "▶ PLAY NOW" CTA to README top | 5 min | ★★★★ | After deploy |
| Revoke the two pasted GitHub PATs | 1 min | ★★★★ | Security hygiene |

## Short term (1–2 weeks) — high value

| Task | Est. | Impact |
|---|---|---|
| Gameplay GIF (first 10 s) at README top | 1 h | ★★★★ |
| FAQ section (scoring, licensing, contributing) | 2 h | ★★★ |
| Strict nonce-based CSP (middleware + nonce in layout) | 1 day | ★★★★ |
| Analytics (Plausible/Umami) + funnel events: play_started, level_completed, score_submitted, share_clicked | 1 day | ★★★ |
| npm audit gate in CI (`npm audit --audit-level=high`) | 30 min | ★★★ |
| Accessibility statement in README + `aria-live` judgment region | 2 h | ★★ |

## Medium term (1–3 months)

| Task | Est. | Impact |
|---|---|---|
| PWA: manifest (done) + service worker + offline shell + install prompt | 2–3 days | ★★★ |
| Haptics (navigator.vibrate on PERFECT) | 1 day | ★★★ |
| Daily seeded challenge + daily leaderboard | 2–3 days | ★★★★ |
| Share-card generation (branded score image per run) | 2–3 days | ★★★ |
| Postgres migration for production DB (schema already portable) | 1 day | ★★★ |
| Object pooling for enemies + `display: optional` font | 1 day | ★★ |

## Long term — strategic

- Replay-based anti-cheat (recorded input stream re-simulation)
- Level editor + user-generated content pipeline (DB `Level` table ready)
- Social: friend leaderboards, async beat-your-score challenges
- Licensed OST pipeline (sync beat maps to licensed audio)
- Mobile app wrapper (capacitor) reusing the same monolith API

---

# Priority Matrix

| Priority | Task | Difficulty | Est. time | Impact |
|---|---|---|---|---|
| **Critical** | Deploy live demo + homepage + Play CTA | Easy | 1–2 h | ★★★★★ |
| **Critical** | Social preview upload | Trivial | 2 min | ★★★★ |
| **Critical** | Revoke exposed PATs | Trivial | 1 min | ★★★★ |
| High | Gameplay GIF | Easy | 1 h | ★★★★ |
| High | Strict CSP (nonces) | Medium | 1 day | ★★★★ |
| High | Analytics + funnel events | Medium | 1 day | ★★★ |
| High | Daily challenge | Medium | 2–3 days | ★★★★ |
| Medium | FAQ + a11y statement | Easy | 2 h | ★★★ |
| Medium | PWA + haptics | Medium | 3 days | ★★★ |
| Medium | npm audit CI gate | Trivial | 30 min | ★★★ |
| Medium | Share-card generator | Medium | 2–3 days | ★★★ |
| Low | Source maps for prod debugging | Easy | 1 h | ★★ |
| Low | Object pooling | Medium | 1 day | ★★ |
| Low | Social leaderboards | Hard | 1–2 weeks | ★★★ |
