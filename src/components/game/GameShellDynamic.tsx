"use client";

import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Client-only entry for the game shell. Phaser must never render on the
 * server, so the dynamic import (ssr: false) lives in a Client Component.
 */
const GameShell = dynamic(() => import("./GameShell").then((m) => m.GameShell), {
  ssr: false,
  loading: () => (
    <main className="boot-splash">
      <div className="boot-splash__logo" aria-hidden="true">🕺</div>
      <h1 className="boot-splash__title">TAP &amp; SLAP</h1>
      <p className="boot-splash__hint">warming up the dance floor…</p>
    </main>
  ),
});

export default function GameShellDynamic() {
  return (
    <ErrorBoundary>
      <GameShell />
    </ErrorBoundary>
  );
}
