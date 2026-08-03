# Design assets

## Brand system (live)

| Token | Value |
|---|---|
| Primary | `#ff2ec4` (neon pink) |
| Secondary | `#22d3ee` (cyan) |
| Accent | `#ffd54a` (gold), `#a3e635` (lime), `#ff4d6d` (red) |
| Background | `#0a0118` (deep purple-black) |
| Panel | `rgba(21,5,51,.82)` + 8 px backdrop blur |
| Type | Orbitron (500/700/900), self-hosted |
| Radius | 14 px · glow shadows · CRT scanline overlay |

## UI consistency audit — applied

- ✅ Focus rings (3 px cyan, offset 2 px)
- ✅ Min 11 px text (was 8–10 px)
- ✅ Reduced-motion global override
- ✅ Native list semantics
- ✅ Heading hierarchy h1 → h2 → h3
- ✅ Icon buttons have `aria-label`
- ✅ Judgment feedback = color + text (never color-only)

## Recommendations (next)

1. **High-contrast theme toggle** — a `.theme--hc` class that raises
   `--text-dim` luminance and thickens lane lines for low-vision players.
2. **Gameplay GIF** uses the same palette so marketing == product.
3. **Consistent motion language** — all overlays use 180–250 ms ease-out;
   document in a mini motion spec:
   - Overlays: fade 200 ms
   - Combo pop: 250 ms overshoot
   - Judgment float: 550 ms ease-out
   - Milestone chime text: 520 ms
4. **Density pass** — the menu is content-heavy on small screens; consider
   collapsible "Soundtrack" panel (details/summary) after the first visit.

## Assets produced during this audit

| Asset | Size | Use |
|---|---|---|
| `banner.jpg` | 233 KB | README hero (was 2.7 MB PNG) |
| `public/images/menu-backdrop.jpg` | 91 KB | App menu background (was 2.3 MB) |
| `public/images/og-cover.jpg` | 212 KB | OG image 1280×640 |
| `social-preview.jpg` | 218 KB | GitHub social preview (upload in Settings) |
