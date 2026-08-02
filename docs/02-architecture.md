# Tap & Slap — System Architecture & Folder Tree

| | |
|---|---|
| **Style** | Monolith (single Next.js app: game client + API + DB) |
| **Stack** | Next.js 15.5 (App Router) · React 19 · Phaser 3.90 · TypeScript 5.8 (strict) · Zustand 5 · Prisma 6 · Auth.js v5 (beta) · Zod 3 · Vitest 3 · Playwright |
| **Date** | 2026-08-02 |

---

## 1. Architecture at a glance

```
                    ┌─────────────────────────────────────────────┐
                    │              Next.js monolith              │
                    │                                             │
  Browser           │  ┌─────────────┐      ┌──────────────────┐  │
┌──────────┐  HTTP  │  │  React shell│◄────►│  Zustand store   │  │
│  Canvas  │◄──────►│  │ (menus/HUD/ │      │ (screen, hud,    │  │
│  (Phaser)│ events │  │  overlays)  │      │  result, player) │  │
└──────────┘        │  └──────┬──────┘      └────────▲────────┘  │
   ▲ 60fps          │         │ GameBridge         │ writes     │
   │                │  ┌──────▼──────┐              │            │
   │                │  │  Phaser 3   │──────────────┘            │
   │                │  │ GameScene   │  events→store             │
   │                │  │ BeatClock   │                           │
   │                │  │ ScoreTracker│  AudioEngine (WebAudio)   │
   │                │  └─────────────┘      procedural synth     │
   │                │                                             │
   │                │  Route handlers (/api/*) ──► services       │
   │                │       │                    │                │
   │                │       │ Zod validation     │ Prisma         │
   │                │       ▼                    ▼                │
   └────────────────┴─────────────────────────────────────────────┘
                                    │
                              SQLite (dev) / PostgreSQL (prod)
```

### Why a monolith?
- The "client" (game) and "server" (scores/auth) ship in **one deployable** —
  the MVP has no independent consumers that justify service boundaries.
- Levels are *content as code*: the deterministic map generator runs in the
  browser for gameplay **and** on the server for integrity checks, sharing the
  exact same module (`src/game/levels/*` — deliberately Phaser-free).
- Scaling path is documented: extract `score-service` behind an HTTP boundary
  when a second client (mobile app) appears.

### The two clocks problem (solved)
Rhythm games die on audio/video drift. Tap & Slap uses **one monotonic
timeline**: `BeatClock` anchors to `performance.now()`; `AudioEngine` schedules
Web Audio events from the same epoch (`perfBase` ↔ `ctxBase` mapping). Visuals
and music are therefore derived from identical timestamps and cannot drift.

### Soundtrack architecture
`audio/tracks.ts` (pure TS, shared & testable) defines five **original**
fight-music arrangements — `titan` (stadium anthem), `thunder` (stomp-stomp-clap),
`iron` (heavy riff), `inferno` (disco war) and `ode` (public-domain Beethoven) —
each a deterministic function of the level's beat map. `AudioEngine` renders
them with a loud master chain (gain → compressor → limiter) plus a kick
sidechain pump, and players pick a track per level (persisted in settings).

---

## 2. Canonical folder tree

```
tap-and-slap/
├── .github/workflows/ci.yml        # lint → typecheck → unit → build → seed → e2e
├── docs/                           # this documentation set (01–06 + README)
├── prisma/
│   ├── schema.prisma               # User, Level, ScoreRun
│   ├── migrations/                 # SQL migrations (prisma migrate)
│   └── seed.ts                     # levels mirror + demo user + sample runs
├── public/                         # (unused in MVP — all assets are procedural)
├── screenshots/                    # captured menu / gameplay / pause
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              #   metadata, providers, fonts
│   │   ├── page.tsx                #   SSR shell → client-only GameShellDynamic
│   │   ├── globals.css             #   neon theme, HUD, overlays, animations
│   │   ├── icon.svg
│   │   └── api/
│   │       ├── health/route.ts             # GET  liveness + db probe
│   │       ├── auth/[...nextauth]/route.ts # Auth.js handlers
│   │       ├── auth/register/route.ts      # POST create account
│   │       ├── me/route.ts                 # GET  session user
│   │       ├── levels/route.ts             # GET  level metadata
│   │       ├── levels/[slug]/route.ts      # GET  full level (incl. map)
│   │       ├── scores/route.ts             # GET  leaderboard / POST submit
│   │       └── scores/me/route.ts          # GET  signed-in bests
│   ├── components/
│   │   ├── providers.tsx           # SessionProvider
│   │   ├── ui/                     # NeonButton, Modal
│   │   └── game/                   # GameShell, GameShellDynamic, GameCanvas,
│   │                               # Hud, Menu, PauseScreen, GameOverScreen,
│   │                               # LoginModal
│   ├── game/                       # ★ Phaser engine (client-only except levels/)
│   │   ├── config.ts               #   tuning constants (windows, health…)
│   │   ├── createGame.ts           #   Phaser.Game factory (FIT scale)
│   │   ├── bridge.ts               #   imperative React↔Phaser seam
│   │   ├── events.ts               #   (typed emitter lives in lib/emitter.ts)
│   │   ├── core/                   #   framework-free logic (unit-tested)
│   │   │   ├── BeatClock.ts        #     pausable musical timeline
│   │   │   ├── Judgement.ts        #     window math
│   │   │   ├── ScoreTracker.ts     #     score/combo/accuracy/health
│   │   │   └── InputController.ts  #     keyboard → lane
│   │   ├── audio/
│   │   │   ├── tracks.ts           #   5-track fight-music registry + song builder (pure TS)
│   │   │   └── AudioEngine.ts      #   procedural synth + scheduler + SFX + master chain
│   │   ├── entities/               #   Enemy, PlayerAvatar, HitPads
│   │   ├── levels/                 #   ★ pure TS — shared client & server
│   │   │   ├── types.ts            #     domain types + score math
│   │   │   ├── generator.ts        #     seeded deterministic map generator
│   │   │   └── registry.ts         #     3 built-in levels
│   │   └── scenes/                 #   BootScene (procedural textures), GameScene
│   ├── lib/
│   │   ├── db.ts                   #   Prisma singleton (server-only)
│   │   ├── auth.ts                 #   Auth.js v5 config (credentials + JWT)
│   │   ├── errors.ts               #   ApiError envelope
│   │   ├── logger.ts               #   structured JSON logger + redaction
│   │   ├── rate-limit.ts           #   in-memory sliding window (Redis-ready seam)
│   │   ├── emitter.ts              #   tiny typed event emitter
│   │   ├── validation/schemas.ts   #   Zod schemas (all API surfaces)
│   │   ├── services/               #   user-service, score-service (repo seam)
│   │   └── client/                 #   api.ts (fetch + offline queue),
│   │                               #   game-actions.ts (bridge↔store), logger
│   ├── store/
│   │   ├── game-store.ts           #   screen/hud/result/identity (ephemeral)
│   │   └── settings-store.ts       #   volumes/calibration (persisted)
│   └── types/                      #   api.ts DTOs, next-auth.d.ts
├── tests/
│   ├── setup.ts                    #   jest-dom + canvas 2D stub
│   ├── mocks/                      #   server-only, phaser3spectorjs
│   ├── unit/                       #   clock, judgement, tracker, levels, song,
│   │                               #   validation, score-service (fake repo)
│   ├── component/                  #   Hud, Menu
│   └── e2e/                        #   smoke: menu, autoplay run, pause, health
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs               # flat config
├── next.config.ts                  # security headers, strict mode
├── tsconfig.json                   # strict + noUncheckedIndexedAccess
└── package.json
```

---

## 3. Dependency manifest

| Package | Version | Purpose |
|---|---|---|
| `next` | ^15.3 | App Router, route handlers, SSR shell |
| `react` / `react-dom` | ^19.1 | UI shell |
| `phaser` | ^3.90 | Canvas/WebGL game engine |
| `zustand` | ^5.0 | Global state (vanilla core + React hook) |
| `@prisma/client` / `prisma` | ^6.5 | ORM, migrations, seeding |
| `next-auth` | ^5.0.0-beta.29 | Credentials auth, JWT sessions |
| `bcryptjs` | ^2.4 | Password hashing (pure JS — no native build) |
| `zod` | ^3.25 | Request/response validation |
| `vitest` + `@testing-library/react` + `jsdom` | ^3.1 / ^16 / ^26 | Unit & component tests |
| `playwright` | ^1.52 | E2E |
| `tsx` | ^4.19 | Seed script runner |
| `eslint` + `eslint-config-next` | ^9 / ^15 | Linting (flat config) |

### Module boundaries & rules
| Boundary | May import | Must not import |
|---|---|---|
| `game/levels/*` | stdlib only | Phaser, React, Node, Prisma — **pure & shared** |
| `game/core/*` | `game/config.ts` | Phaser (types only via `import type`) |
| `game/entities|scenes|audio` | Phaser, `game/core`, `game/levels`, store | React |
| `lib/services/*` | Prisma, Zod, `game/levels` | Phaser, React |
| `lib/client/*` | store, types | Prisma, `server-only` modules |
| `components/*` | store, `lib/client`, `game/bridge` | Phaser directly (via bridge only) |
| `app/api/*` | services, validation, auth | Phaser, React |

Enforcement: `server-only` import guard on `lib/db.ts`; Phaser importable only
client-side (dynamic `ssr:false` entry); `game/levels` kept dependency-free so
the server and seed script reuse it.

---

## 4. Data flow: one gameplay second

1. `GameScene.update` reads `BeatClock.elapsedMs()` (performance-now anchored).
2. Notes whose `timeMs − approachMs` passed → `Enemy` spawned at lane top.
3. Enemy `setProgress((now − (time − approach)) / approach)` → eased toward hit zone.
4. Input (key / pad / enemy tap) → `hitLane(lane)` → `judgeNote(time, now)`.
5. `ScoreTracker.apply(type, base)` → score/combo/health; store updated →
   React HUD re-renders; Phaser spawns particles/popups; `AudioEngine.slap()`.
6. Miss deadline (`now ≥ time + goodMs`) → enemy attacks, health −12, combo reset.
7. Run end → `finishRun` → `POST /api/scores` (resilient, queued offline).

---

## 5. Level content pipeline

```
registry.ts (seed, bpm, density)
        │ generateMap() — pure, deterministic
        ▼
   BeatMap { bpm, offsetMs, approachBeats, bars, sections, notes }
        │
        ├──► browser: GameScene spawns enemies      (same module)
        ├──► server:  /api/levels (tooling/QA)      (same module)
        └──► server:  integrity checks (expectedMaxScore) + prisma seed
```
Adding a level = adding one entry in `registry.ts` (+ optional DB row via seed).

---

## 6. Scaling & evolution notes

- **State:** Zustand keeps the store small and serializable; when the game
  grows (inventory, unlocks), split slices per feature.
- **Physics:** deliberately none — enemies are timeline-interpolated, which is
  deterministic and testable. Object pooling for enemies is the first perf
  upgrade if note density grows beyond ~500 concurrent.
- **Content:** DB `Level` table exists for a future editor/API; today the code
  registry is the source of truth (offline-first, versioned with the app).
- **Multi-instance:** swap in-memory rate limiter for Redis; SQLite → Postgres
  (schema is portable; see docs/03).
