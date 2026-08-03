/**
 * Opt-in privacy-friendly analytics (Plausible-compatible beacon).
 *
 * COMPLETELY OFF unless `NEXT_PUBLIC_ANALYTICS_URL` is set at build time.
 * Cookieless, no personal data in props — the game never breaks on analytics.
 */

const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_URL;

export type FunnelEvent =
  | "play_started"
  | "level_completed"
  | "score_submitted"
  | "share_clicked"
  | "signup";

type FunnelProps = Record<string, string | number | boolean>;

let loaded = false;

function ensureLoaded(): void {
  if (loaded || !ENDPOINT || typeof document === "undefined") return;
  loaded = true;
  const script = document.createElement("script");
  script.defer = true;
  script.async = true;
  script.src = `${ENDPOINT}/script.js`;
  script.setAttribute("data-domain", window.location.hostname);
  document.head.appendChild(script);
}

export function track(event: FunnelEvent, props?: FunnelProps): void {
  if (!ENDPOINT) return;
  try {
    ensureLoaded();
    const w = window as unknown as { plausible?: (e: string, o?: object) => void };
    w.plausible?.(event, props ? { props } : undefined);
  } catch {
    /* analytics must never affect gameplay */
  }
}
