# Deployment — Tap & Slap (Vercel + Neon PostgreSQL)

Everything needed to take `main` live. The repo is production-ready: CI runs
lint → typecheck → 82 unit tests → build → Postgres migrate+seed → Playwright
E2E on every push, and the app is a standard Next.js 15 monolith.

## One-time setup (≈10 minutes)

### 1. Database — Neon (free, no card)
1. Go to **neon.tech** → sign in → **Create project** (free tier).
   - Region: pick something close to your users (e.g. `eu-west-2`).
2. Copy the connection string from the dashboard — it looks like:
   ```
   postgresql://user:password@ep-xxx.eu-west-2.aws.neon.tech/tap_and_slap?sslmode=require
   ```
   If you're asked for a database name, use `tap_and_slap`.
3. Keep it handy — you'll paste it into Vercel in step 2.

### 2. Vercel
1. Go to **vercel.com/new** → **Import** the `DLinacre/tap-and-slap` repo
   (or push the Vercel CLI flow with `vercel link`).
2. Framework preset: **Next.js** (auto-detected). Build command stays the
   default (`npm run build` — it runs `prisma generate` first).
3. **Environment variables** (Settings → Environment Variables, add for
   Production, Preview and Development):
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your Neon connection string |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `NEXT_PUBLIC_APP_URL` | **leave unset** — the app derives the origin from request headers and falls back to the production domain. A localhost value here would poison sitemap/robots/OG URLs. |
4. **Deploy.** The first build may take a few minutes.

### 3. Migrate + seed the production database
Run once after the first deploy succeeds (from a local checkout or a shell):
```bash
DATABASE_URL="<your-neon-url>" npx prisma migrate deploy
DATABASE_URL="<your-neon-url>" npm run db:seed   # optional demo rows
```
Or, if you gave me a Vercel token, I'll run this for you.

### 4. Verify
- `https://tap-and-slap.vercel.app/api/health` → `{"status":"ok",...,"db":"up"}`
- Register an account → 201 (no more 500s — that was SQLite-on-serverless).
- Leaderboard shows real entries; play a run on two devices and watch it sync.

## Aliases & domains
- The old `tap-and-slap.vercel.app` alias belonged to the previous project.
  If you deployed a **fresh** Vercel project, you'll get a new URL
  (`tap-and-slap-<hash>.vercel.app`). To keep the old URL, either:
  - deploy into the **same** Vercel project (fix billing there), or
  - add the alias in the new project if it's still claimable, or
  - move to a real domain (`tapandslap.com` / `tapandslap.game`) — recommended
    for the brand anyway; set the domain in Vercel and update
    `PROD_FALLBACK` in `src/lib/url.ts` + the canonical/OG metadata.

## Env var reference
| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ prod | PostgreSQL (Neon/Supabase/Railway). SQLite cannot persist on serverless. |
| `AUTH_SECRET` | ✅ prod | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ❌ | leave unset in prod |
| `RATE_LIMIT_SCORES_PER_MIN` | optional | default 10 |
| `LOG_LEVEL` | optional | `debug \| info \| warn \| error` |

## Rollbacks
Every push to `main` is CI-verified; Vercel keeps previous deployments under
**Deployments → ⋯ → Rollback** if anything ever misbehaves.

## Local dev
```bash
cp .env.example .env   # DATABASE_URL + AUTH_SECRET
npm install
npm run db:setup       # migrate + seed
npm run dev            # http://localhost:3000
```
