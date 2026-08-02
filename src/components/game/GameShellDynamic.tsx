"use client";

import dynamic from "next/dynamic";

/**
 * Client-only entry for the game shell. Phaser must never render on the
 * server, so the dynamic import (ssr: false) lives in a Client Component.
 */
const GameShell = dynamic(() => import("./GameShell").then((m) => m.GameShell), {
  ssr: false,
  loading: () => (
    <div className="boot-splash">
      <div className="boot-splash__logo">🕺</div>
      <p>TAP &amp; SLAP</p>
      <span>warming up the dance floor…</span>
    </div>
  ),
});

export default function GameShellDynamic() {
  return <GameShell />;
}
