# Contributing to Tap & Slap

Thanks for wanting to contribute! 🕺 This project is a small, focused monolith —
here's how to work with it well.

## Getting started

```bash
npm install
cp .env.example .env
npm run db:setup   # migrate + seed
npm run dev        # http://localhost:3000
```

## Development loop

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server with hot reload |
| `npm run lint` | ESLint (flat config) — must be clean |
| `npm run typecheck` | `tsc --noEmit` (strict) — must pass |
| `npm test` | Vitest unit + component tests |
| `npm run build && npm run test:e2e` | Production build + Playwright E2E |

Before pushing: **lint → typecheck → test → build** must all pass. CI runs the
same gates on every pull request.

## Architecture rules of thumb

- `src/game/levels/*` and `src/game/audio/tracks.ts` are **pure TS** (no Phaser,
  no React, no Node) — they're shared with the server for integrity checks.
  Keep them dependency-free.
- React never talks to Phaser directly — go through `src/game/bridge.ts` and
  `src/lib/client/game-actions.ts`. The engine reports state via the Zustand
  stores in `src/store/`.
- All API input goes through Zod schemas in `src/lib/validation/schemas.ts`.
- Adding a level = one entry in `src/game/levels/registry.ts` (+ re-seed).
- Never commit `.env` or the SQLite dev database.

## Pull request process

1. Fork the repo and create a branch: `feat/`, `fix/`, `docs/` prefix.
2. Make focused commits with clear messages.
3. Add/update tests for behaviour changes (unit for pure logic, component for
   UI, E2E for critical flows).
4. Open the PR with a short description of *what* and *why*.
5. CI must be green; screenshots welcome for UI changes.

## Code of conduct

Be kind and constructive. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
