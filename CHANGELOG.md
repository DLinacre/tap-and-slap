# Changelog

All notable changes to Tap & Slap are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [1.2.0] — 2026-08-07

### Gameplay: the hitbox finally tells the truth
- **Pads now sit ON the hit line** (y=660, was y=750 — 90px below where
  enemies die), so tapping where the enemy lands always registers. Interactive
  zones are taller (300px column per lane) and tapping an enemy now judges
  only that enemy's lane.
- **One physical tap = one judgement.** Pad zones mark the pointer as
  consumed; the fallback enemy-tap handler no longer double-judges or
  cross-lane hits.
- **Never a silent miss:** empty presses now show TOO EARLY / TOO LATE with
  a pad flash, so the game always explains why a tap didn't count.
- **Audio/visual sync fix:** the music scheduler now compensates for device
  output latency and its own lookahead — the beat you HEAR lands exactly on
  the line you SEE. PERFECT is now achievable by ear.
- **Keyboard auto-repeat guard:** holding a key can no longer machine-gun notes.
- GOOD window widened 135ms → 150ms (more forgiving, Guitar-Hero-adjacent).

### Comic-action style ("PERFECT!" not "POW", "BANGING!" not "BANG")
- Every kill pops a rotated comic starburst with onomatopoeia
  (BANGING! / SLAP! / WHAM! / KRAK! / BOOM! / THWACK!) beside the judgement
  label; judgements stay PERFECT!/GREAT/GOOD/MISS.
- Procedural starburst texture (no new assets), comic-panel menu cards with
  hard offset shadows, halftone overlay, grade slam-in animation.

### Readability & accessibility (WCAG 2.2)
- **Lane palette brightened** (blue 0x3f7bff, red 0xff5f7a, mint 0x3ee67c) —
  all four lanes now pass ≥3:1 contrast; lane lines and hit-line are
  significantly brighter; lanes glow while a note is inbound.
- **Live region:** screen readers hear judgements + combo milestones
  (rate-limited, never per-note spam); canvas exposed as role="application".
- **Modal a11y:** sign-in dialog is role="dialog" + aria-modal with a focus
  trap and focus restore.
- **Reduced motion:** in-canvas shake/flash/popups respect
  prefers-reduced-motion (CSS already did; Phaser now does too).
- Touch targets ≥44px (pause button, neon buttons).

### Tempo pass ("catchy with a good tempo")
- First Beat 92 → **100 BPM**, Neon Rampage 112 → **118 BPM**, Disco Inferno
  132 → **138 BPM** — danceable warm-up, pop-dance pocket, biting 16ths.

### SEO / metadata
- Canonical link added; OG/Twitter URLs are absolute and request-derived
  (never localhost); sitemap/robots origin resolution hardened (headers →
  env → production fallback, ignoring localhost env values).

### Sharing & deep links
- Results screen gains a **SHARE** button (Web Share API with clipboard
  fallback) that posts your score and a `?level=` challenge link.
- `?level=<slug>` deep links start a real run straight from the URL.

## [1.1.0] — 2026-08-03

### Art rework & clarity pass
- **In-game art v2:** DDR-style direction arrows baked into every enemy
  (goon / brute / imp silhouettes), glowing target rings where the beat
  lands, synthwave city skyline, horizon glow, perspective floor, sky
  gradient, lane columns that brighten toward the hit zone, spawn fade-ins,
  "GET READY" flash at run start.
- **UI rework:** difficulty pills (EASY/NORMAL/HARD), Daily Challenge
  spotlight card with countdown, "pick → slap → top" steps strip, gradient
  PLAY button, equalizer bars on the active track, SCORE label in the HUD,
  judgment breakdown bar + confetti on the results screen.
- **New menu artwork** (cleaner composition, 41 KB vs 91 KB).

## [0.1.0] — 2026-08-02

Initial MVP release.

### Added
- Core gameplay: 4-lane dance-mat rhythm brawler (arrows, WASD, touch pads,
  direct enemy taps) with PERFECT/GREAT/GOOD/MISS judgment windows.
- Combo multipliers (×8 cap), health economy, heavy/mini enemy variants.
- 3 built-in levels: First Beat (EASY), Neon Rampage (NORMAL), Disco Inferno (HARD).
- Fight soundtrack: 5 original procedural tracks (Titan Rising, Thunder Chant,
  Iron Riff, Neon Inferno, Ode to Joy) with per-level selection and previews.
- Master audio chain (compressor + limiter + kick sidechain pump).
- Guest play with offline score queue; optional accounts (bcrypt + Auth.js JWT).
- Leaderboards with server-side run integrity checks (anti-cheat v1).
- Procedural synthwave visuals (sliced sun, stars, grid, scanlines, vignette).
- QA affordances: `?autoplay=1`, `?qa=1`.
- Testing: 74 unit/component tests, 4 Playwright E2E tests, CI pipeline.
- Documentation: PRD, architecture, database, API, security, execution plan.

### Fixed
- Auth.js `UntrustedHost` error (500 on `/api/auth/*`) — `trustHost` enabled.
- Render-blocking Google Fonts request — Orbitron now self-hosted via `next/font`.
- 2.8 MB banner / 2.3 MB backdrop images — replaced with optimized JPEGs
  (233 KB / 91 KB).
- Phaser engine kept running at 60 fps behind menu/results overlays — the
  scene now pauses when idle (CPU/battery win).
- 401 console noise on guest loads — session probe now gated on session state.
- WCAG: heading order, prohibited ARIA roles on level list, tiny (<12 px)
  fonts, `user-scalable=no` viewport removed, visible focus styles,
  `prefers-reduced-motion` support.
- Security: production Content-Security-Policy added; `SECURITY.md`,
  `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, Dependabot and issue templates added.
