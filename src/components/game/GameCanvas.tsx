"use client";

import { useEffect, useRef } from "react";
import { createGame } from "@/game/createGame";
import { gameBridge } from "@/game/bridge";

/**
 * Hosts the Phaser canvas. Client-only — imported via `next/dynamic` with
 * `ssr: false` from the page. StrictMode double-mount is handled by the
 * cleanup destroying the previous game instance.
 */
export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const game = createGame(host);
    gameBridge.attach(game);
    return () => {
      gameBridge.detach();
      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="game-canvas"
      role="application"
      aria-label="Tap & Slap game — four lanes. Tap a pad, tap an enemy, or press the arrow keys / WASD on the beat."
    />
  );
}
