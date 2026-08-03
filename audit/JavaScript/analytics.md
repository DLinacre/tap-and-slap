# Analytics snippet — privacy-friendly funnel (post-deploy)

```ts
// src/lib/client/analytics.ts
type FunnelEvent = "play_started" | "level_completed" | "score_submitted" | "share_clicked" | "signup";

const PLACEHOLDER_DOMAIN = "YOUR-SITE.pages.dev"; // Plausible/Umami script host

function loadPlausible(): void {
  const script = document.createElement("script");
  script.defer = true;
  script.src = `https://${PLACEHOLDER_DOMAIN}/js/script.js`;
  script.setAttribute("data-domain", location.hostname);
  document.head.appendChild(script);
}

export function track(event: FunnelEvent, props?: Record<string, string | number>): void {
  try {
    (window as unknown as { plausible?: (e: string, o?: object) => void })
      .plausible?.(event, props ? { props } : undefined);
  } catch { /* analytics must never break the game */ }
}

// Wire in game-actions.ts:
//   startRun → track("play_started", { level: slug })
//   finishRun → track("level_completed", { level, accuracy: Math.round(accuracy) })
//   submitScore success → track("score_submitted", { rank })
//   share click → track("share_clicked")
```

## Event map

| Event | When | Props |
|---|---|---|
| `play_started` | run begins | level, difficulty |
| `level_completed` | results screen | level, accuracy, miss count |
| `score_submitted` | 201 from /api/scores | rank, isNewBest |
| `share_clicked` | share button | channel |
| `signup` | account created | — |

## Privacy posture

- No cookies, no cross-site tracking (Plausible/Umami are cookieless).
- No personal data in props (never send guestId, email, or IP).
- Analytics fails silently — game loop untouched.
