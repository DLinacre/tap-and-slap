# Changelog

All notable changes to Tap & Slap are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

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
