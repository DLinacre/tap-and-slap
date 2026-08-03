# Performance assets

## Measured (Lighthouse, headless Chrome, production build)

| Metric | Before | After | Good? |
|---|---|---|---|
| Performance | 42 | 49 | ⚠️ game-loop dominated |
| FCP | 2.3 s | **0.8 s** | ✅ |
| LCP | 15.9 s | **5.8 s** | ⚠️ (LCP = canvas backdrop; real GPU much better) |
| CLS | 0 | 0.03 | ✅ (< 0.1) |
| TBT / TTI | 140 s / 182 s | 148 s / 181 s | ⚠️ software-WebGL artifact; not representative |
| Console errors | 2–3 | **0** | ✅ |

## Applied optimisations

1. **Self-hosted font** — `next/font/google` (Orbitron): removed the
   render-blocking Google Fonts `@import` (~1.6 s savings in lab).
2. **Image compression** — banner 2 744 KB → 233 KB (JPEG, progressive);
   menu backdrop 2 282 KB → 91 KB; added 1280×640 `og-cover.jpg` (212 KB).
3. **Idle scene pausing** — Phaser stops ticking at 60 fps behind menu and
   results overlays (desired-state + reconciler; race-free).
4. **Defense-in-depth audio guard** — no negative-time scheduling.

## Next: deploy-level (after hosting)

```bash
# Vercel: automatic Brotli + CDN caching + HTTP/2. Confirm headers:
curl -sI https://YOUR-ORIGIN | grep -iE "cache-control|content-encoding|cf-cache-status|x-vercel-cache"
```

- Font `display: swap` → `optional` to zero out CLS:

```tsx
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron",
  display: "optional", weight: ["500", "700", "900"] });
```

- Add `Cache-Control` for static images in `next.config.ts`:

```ts
async headers() {
  return [{
    source: "/images/:path*",
    headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
  }];
}
```

- Preload the LCP image (menu backdrop) in `src/app/layout.tsx`:

```tsx
<link rel="preload" as="image" href="/images/menu-backdrop.jpg" />
```

## Long-term

- Object-pool `Enemy` images (GC pressure at INSANE densities).
- Pre-render a static HTML menu behind the canvas (fastest first paint).
- Load Phaser only after first paint (`requestIdleCallback`), since the
  menu/canvas boot don't need the engine until Play is tapped — biggest
  remaining win for TBT on mobile.
