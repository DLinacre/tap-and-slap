# Accessibility assets

## Applied fixes (commit dd71456)

| Fix | Where |
|---|---|
| Native `ul/li` level list (removed `role="listitem"` on buttons) | `src/components/game/Menu.tsx` |
| Heading order h1 → h2 panels | `Menu.tsx` |
| `:focus-visible` outline | `src/app/globals.css` |
| `prefers-reduced-motion` | `globals.css` |
| 11 px minimum text sizes | `globals.css` |
| Zoomable viewport (removed `user-scalable=no`, `maximum-scale`) | `src/app/layout.tsx` |
| Alt text on all images | README + layout |
| Session probe gated (no 401 noise) | `GameShell.tsx` |

## Next: aria-live judgment region (WCAG 4.1.3 status messages)

In `src/components/game/Hud.tsx`, the judgment flash should be announced to
screen readers without stealing focus:

```tsx
<div
  aria-live="polite"
  role="status"
  className="sr-only"
  data-testid="judgment-live"
>
  {hud.judgment ? `${hud.judgment.type} — combo ${hud.combo}` : ""}
</div>
```

With the utility class:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

## Next: canvas fallback description

```html
<div class="game-canvas" aria-label="Tap & Slap game area" role="img"
     aria-describedby="game-desc">
  <span id="game-desc" class="sr-only">
    Rhythm brawler: four lanes, enemies descend to the beat, press the matching
    arrow key or tap the lane when the enemy reaches the hit zone. Keyboard
    shortcuts: arrow keys or WASD; ESC pauses.
  </span>
</div>
```

## Keyboard audit summary

| Check | Status |
|---|---|
| All interactive elements reachable | ✅ (buttons + sliders) |
| Visible focus indicator | ✅ (3 px cyan ring) |
| ESC closes modal / pauses | ✅ |
| No keyboard traps | ✅ |
| Zoom ≥ 200 % without loss | ✅ (viewport zoomable; FIT canvas) |
| Reduced motion respected | ✅ |
