# Tap & Slap — Step-by-Step Implementation Execution Plan

Three phases. Each phase ends **green CI** and a **playable/demoable** state.
Estimated sizes are for a single experienced engineer.

---

## Phase 1 — Core Foundation (days 1–3)

**Goal:** a bootable monolith with deterministic gameplay math, rendering and
the persistence skeleton — the *hardest parts first* (rhythm accuracy).

| # | Task | Deliverable | Done |
|---|---|---|---|
| 1.1 | Scaffold Next.js 15 + TS strict, ESLint flat config, Vitest, Playwright, CI workflow | `package.json`, configs, `.github/workflows/ci.yml` | ✔ |
| 1.2 | Define domain types & constants (lanes, windows, health, score model) | `game/levels/types.ts`, `game/config.ts` | ✔ |
| 1.3 | Seeded deterministic beat-map generator + 3 level definitions | `game/levels/generator.ts`, `registry.ts` | ✔ |
| 1.4 | Musical timeline + judgment + scoring (pure, unit-tested) | `core/BeatClock|Judgement|ScoreTracker` + tests | ✔ |
| 1.5 | Procedural synthwave AudioEngine (kick/snare/hats/bass/pads/lead) | `audio/AudioEngine.ts` + `buildSong` | ✔ |
| 1.6 | Phaser boot + GameScene: lanes, hit zone, spawn/travel/judge/miss, FX | `scenes/*`, `entities/*`, `createGame.ts` | ✔ |
| 1.7 | Prisma schema + migration + seed | `prisma/*` | ✔ |
| 1.8 | Auth.js v5 (credentials) + register/me routes + bcrypt + Zod | `lib/auth.ts`, `routes`, `validation` | ✔ |
| 1.9 | Score service with integrity checks + repo seam + unit tests | `services/score-service.ts` + tests | ✔ |

**Phase 1 exit criteria:** `npm run typecheck && npm test` green; autoplay bot
clears a full level with 0 misses in-browser; scores POST and appear on the
leaderboard.

## Phase 2 — Feature Implementation (days 3–6)

**Goal:** the full single-page experience — menus, HUD, overlays, identity,
leaderboard, resilience.

| # | Task | Deliverable | Done |
|---|---|---|---|
| 2.1 | Zustand stores + game-actions (bridge↔store coordination) | `store/*`, `lib/client/game-actions.ts` | ✔ |
| 2.2 | React shell: menu (levels, settings, leaderboard), HUD, pause, results, login modal | `components/game/*` | ✔ |
| 2.3 | Guest identity + local bests + offline score queue | `lib/client/api.ts` | ✔ |
| 2.4 | API routes: scores GET/POST, scores/me, levels, health | `app/api/*` | ✔ |
| 2.5 | Neon UI system (buttons, overlays, HUD styles, animations) | `globals.css`, `ui/*` | ✔ |
| 2.6 | Component + unit tests for stores/components/services | `tests/component/*`, `tests/unit/*` | ✔ |
| 2.7 | QA affordances: `?autoplay=1`, `?qa=1`, pause on blur | GameScene/GameShell | ✔ |

**Phase 2 exit criteria:** full loop on touch & keyboard; leaderboard live with
seeded data; score submit + rank + new-best; offline queue flushes.

## Phase 3 — Polish, Hardening & Deployment (days 6–10)

| # | Task | Deliverable | Status |
|---|---|---|---|
| 3.1 | E2E suite against production build (menu, autoplay run, pause, health) | `tests/e2e/*`, Playwright config | ✔ |
| 3.2 | Frame-gap-robust autoplay bot + production-server E2E | GameScene.botTick | ✔ |
| 3.3 | Screenshot pass & visual QA (menu, gameplay, pause) | `screenshots/*` | ✔ |
| 3.4 | Deployment: Vercel (app) + managed Postgres (Neon/Supabase/RDS) | `vercel.json`-style env docs, `prisma migrate deploy` | ◐ next |
| 3.5 | CSP with nonces; Sentry/error tracking; structured metrics | — | ◐ next |
| 3.6 | Replay recording + server-side replay verification (true anti-cheat) | — | planned |
| 3.7 | `prefers-reduced-motion`, haptics (vibrate), PWA manifest | — | planned |
| 3.8 | Insane difficulty, daily challenge, level editor | — | roadmap |

**Phase 3 exit criteria:** all CI gates green on main; deployed URL with
Postgres; documented runbook (env, migrations, rollback).

---

## Deployment runbook (target: Vercel)

```bash
# 1. Provision Postgres, set env:
#    DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL
# 2. Apply schema:
npx prisma migrate deploy
# 3. Seed content + demo data (idempotent):
npm run db:seed
# 4. Deploy (Vercel: framework preset Next.js, Node 22, build = npm run build)
# 5. Verify: GET /api/health → {"status":"ok","db":"up"}
```

**Rollback:** Vercel instant rollback to previous deployment; DB migrations are
forward-only at MVP scale (additive schema changes only until v1.0).

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Audio/visual drift ruins feel | Med | High | Single clock (BeatClock epoch == AudioEngine epoch); calibration setting |
| Headless CI can't run rhythm E2E | Med | Med | Autoplay bot tolerant of frame gaps; QA truncation; production-build E2E |
| Cheating poisons leaderboard | High | Med | Integrity checks now; replay verification next |
| Mobile perf (SwiftShader-class GPUs) | Med | Med | Small canvas, no physics, bounded particles; pooling later |
| Scope creep (editor, MP) | Med | High | Non-goals locked in PRD §2 |

---

## Definition of Done (per deliverable)

- Code compiles strict-TS, lint clean, tests pass, CI green.
- No placeholders; every function implemented and documented inline.
- Gameplay-feel items verified in-browser (judgment feedback, beat sync).
- Docs updated if behavior changed.
