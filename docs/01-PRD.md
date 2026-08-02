# Tap & Slap — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Tap & Slap |
| **Platform** | Web app (mobile-first, keyboard-friendly) |
| **Status** | MVP (single-page core) |
| **Version** | 0.1.0 |
| **Date** | 2026-08-02 |

---

## 1. Vision

**One sentence:** *Tap & Slap is a dance-mat rhythm brawler — enemies march down
four neon lanes to the beat, and you slap them dead by hitting the arrow/tap at
the exact musical moment.*

**Inspiration:** DDR/StepMania lane gameplay + the punch-kick-on-the-beat fantasy
of *Dead as Disco*, tuned for fast mobile sessions and keyboard play, wrapped in
a synthwave aesthetic with zero downloadable assets.

**Why it works as an MVP:** the entire core loop is one screen, one mechanic,
one score — yet it has depth (combo multipliers, judgment windows, enemy
variants, leaderboards) that supports retention loops from day one.

---

## 2. Goals & Non-Goals

### Goals (MVP)
1. Ship a **playable single-page core loop**: pick level → play → result → leaderboard.
2. Be **equally playable on touch (mobile) and keyboard (desktop)**.
3. Deliver a **credible on-beat experience** without licensed music (procedural synthwave soundtrack generated in the browser from each level's BPM).
4. Provide **persistent progression signals**: score, accuracy, combo, local bests, global leaderboard.
5. Establish a **production-grade monolith** (typed, tested, CI'd, linted, documented) that can grow.

### Non-Goals (explicitly out of MVP scope)
- User-generated levels / level editor
- Multiplayer / PvP / async battles
- Real licensed music or audio asset pipeline
- PWA/offline install, push notifications
- Replay recording & anti-cheat verification of input streams
- Monetization, ads, IAP
- Social graph (friends, follows)

---

## 3. Target Audience & Personas

Primary audience: **puzzle gamers and tactical stealth/strategy enthusiasts who
also enjoy rhythm games** (DDR, osu!, Thumper, Crypt of the NecroDancer).

### Persona A — "The Combo Chaser" (primary)
- **Name:** Maya, 24, rhythm-game veteran (played DDR in arcades, plays osu!).
- **Goals:** high accuracy, perfect combo runs, leaderboard dominance.
- **Pain points:** rhythm games that feel laggy or mushy; no feedback on timing.
- **Tap & Slap value:** precise ±45ms PERFECT windows, visible judgment feedback, combo multipliers, global leaderboard with rank on submit.

### Persona B — "The Commuter" (secondary)
- **Name:** Dev, 31, plays 5–10 minute mobile sessions on the train.
- **Goals:** pick up and play, short levels, offline-tolerant.
- **Pain points:** long intros, forced accounts, login walls.
- **Tap & Slap value:** guest play with zero sign-up, levels 1.5–3 minutes, offline score queue, tap-anywhere input (pads *or* directly on enemies).

### Persona C — "The Punisher" (secondary)
- **Name:** Riya, 27, stealth/strategy player; likes mastery and difficulty.
- **Goals:** hard modes, risk/reward, "clearing" content.
- **Tap & Slap value:** three shipped difficulties, heavy enemies worth ×1.5, health economy that punishes misses, accuracy as a second scoreboard dimension.

---

## 4. Core Journeys

### Journey 1 — First session (new guest)
1. Land on single-page app → menu with 3 levels, controls legend, leaderboard.
2. Tap **First Beat** → run starts instantly (audio unlocks on the tap).
3. Enemies descend 4 lanes; arrows/WASD/taps kill them on the beat.
4. HUD shows score, combo, accuracy, health; judgment flashes PERFECT/GREAT/GOOD/MISS.
5. Run ends → results screen (score, max combo, accuracy, judgments, "NEW LOCAL BEST" badge, server rank).
6. Optional: "Sign in" (email+password) to attach a name to future runs.

### Journey 2 — Returning player
1. Menu shows leaderboard for the selected level (top 10, guests labeled).
2. Player picks a harder level, chases a personal best (stored locally; server best when signed in).
3. Offline? Scores queue in localStorage and flush on next online load.

### Journey 3 — QA / CI verification (internal)
1. `?autoplay=1&qa=1` boots an autoplay run on a truncated 8-bar map.
2. Bot slaps every note; run completes; results screen appears — E2E asserts determinism.

---

## 5. Functional Requirements

### FR-1 Gameplay core
| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-1.1 | 4-lane dance-mat layout (Left/Down/Up/Right) | Lanes render with distinct colors; enemies spawn per lane |
| FR-1.2 | Enemies are the notes | Each beat-map note spawns an enemy that reaches the hit zone exactly at its beat |
| FR-1.3 | Judgment windows | PERFECT ≤ 45 ms, GREAT ≤ 90 ms, GOOD ≤ 135 ms, MISS beyond (configurable in `src/game/config.ts`) |
| FR-1.4 | Multiple input paths | Arrow keys, WASD, on-canvas touch pads, and direct taps on enemies all trigger the same lane hit |
| FR-1.5 | Combo & multiplier | +1 multiplier every 10 combo, capped at ×8; miss resets combo |
| FR-1.6 | Health economy | Start 100; miss −12; PERFECT +2; GREAT +1; death ends the run |
| FR-1.7 | Score model | base 100 (normal) / 150 (heavy) / 50 (mini) × weight (1/0.7/0.4) × multiplier |
| FR-1.8 | Enemy variants | normal, heavy (×1.5 points), mini (×0.5) |
| FR-1.9 | End conditions | All notes resolved + 2 s, or health = 0 |
| FR-1.10 | Pause | ESC/P or button pauses clock, music and scene; resume/restart/quit |

### FR-2 Levels & music
| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-2.1 | 3 built-in levels | `first-beat` (EASY, 92 BPM), `neon-rampage` (NORMAL, 112 BPM), `disco-inferno` (HARD, 132 BPM) |
| FR-2.2 | Deterministic maps | Same seed ⇒ same note list (unit-tested); server can recompute max score |
| FR-2.3 | Procedural music | 5 selectable original fight tracks (stadium anthem, stomp-stomp-clap chant, heavy riff, disco war, public-domain Ode to Joy) synthesized via Web Audio from level BPM & section structure; audio and visuals share one clock; master chain with compressor + limiter + kick sidechain pump; menu previews |
| FR-2.4 | QA mode | `?qa=1` truncates maps to 8 bars; `?autoplay=1` enables the bot |

### FR-3 Persistence & identity
| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-3.1 | Guest play | Guest UUID in localStorage; guest scores post to leaderboard labeled `Guest-xxxxxxxx` |
| FR-3.2 | Accounts | Register/sign-in (credentials, bcrypt, JWT session) |
| FR-3.3 | Score submission | POST /api/scores with integrity checks (note count, max score, accuracy consistency, duration sanity) |
| FR-3.4 | Leaderboard | Top N per level/difficulty; autoplay runs excluded |
| FR-3.5 | Offline resilience | Failed submissions queue locally and flush on `online` |
| FR-3.6 | Personal bests | Local bests stored per level; server best for signed-in players |

### FR-4 UI/UX
| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-4.1 | Single page | Menu, HUD, pause, results as overlays on one canvas-backed screen |
| FR-4.2 | Mobile first | Portrait 480×800 logical canvas, FIT-scaling; touch pads ≥ 88 px targets; `touch-action: none` |
| FR-4.3 | Feedback density | Judgment flash, combo pop, hit particles, screen shake, red flash on damage, beat-pulsing background |
| FR-4.4 | Settings | Music/SFX volume, timing calibration (±100 ms) persisted |
| FR-4.5 | Accessibility baseline | aria-labels on interactive elements, keyboard-only playable, contrast-conscious palette, reduced animation via CSS media query (Phase 3) |

---

## 6. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | 60 fps on mid-range mobile at 480×800; no per-frame allocations in hot loops; particle counts bounded |
| Availability | Static/SSR shell; gameplay works offline for a session; graceful degradation if API is down (local bests still tracked) |
| Security | See docs/05 (Zod validation everywhere, bcrypt, rate limits, secrets via env, security headers) |
| Quality | 100% type coverage (strict TS), lint clean, ≥ 68 unit/component tests, 4 E2E smoke tests, CI gate |
| Portability | Runs with `npm i && npm run db:setup && npm run dev`; SQLite dev DB, Postgres-ready schema |
| Observability | Structured JSON logs (server), redaction, /api/health probe |

---

## 7. MVP Success Metrics

- **Activation:** % of sessions that complete ≥ 1 level (target 60%)
- **Rhythm quality:** median accuracy on first run ≥ 70%
- **Retention signal:** % of players returning to beat their local best (target 25%)
- **Stability:** < 1% crash/error rate (window.onerror + console.error capture in Phase 3)

---

## 8. Roadmap (post-MVP)

1. **Insane difficulty + daily challenge** (seeded per-day map, one leaderboard).
2. **Level editor** (write maps as JSON, validate server-side, publish).
3. **Replay system** (input streams → server-side replay verification, true anti-cheat).
4. **PWA install + offline play**, haptics (vibrate on PERFECT).
5. **Social:** share cards, friend leaderboards.
6. **OST pipeline:** tooling to import licensed audio with beat maps.
