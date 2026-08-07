"use client";

import { useRef } from "react";
import { useGameStore } from "@/store/game-store";
import { pauseGame } from "@/lib/client/game-actions";

const JUDGMENT_CLASS: Record<string, string> = {
  perfect: "judgment--perfect",
  great: "judgment--great",
  good: "judgment--good",
  miss: "judgment--miss",
};

/** Combo values worth announcing to screen readers (milestone ladder). */
const ANNOUNCE_COMBOS = new Set([10, 25, 50, 75, 100]);

/**
 * HUD — score, combo, health, accuracy and judgment feedback.
 * Reads exclusively from the Zustand store (written by GameScene).
 * Includes an aria-live region for screen readers: judgments and combo
 * milestones are announced, but rate-limited so it never spams per note.
 */
export function Hud() {
  const hud = useGameStore((s) => s.hud);
  const lastAnnounced = useRef({ judgmentId: -1, combo: 0 });

  // Live announcements — one string per significant event.
  let announcement = "";
  if (hud.judgment && hud.judgment.id !== lastAnnounced.current.judgmentId) {
    lastAnnounced.current.judgmentId = hud.judgment.id;
    const label =
      hud.judgment.type === "perfect"
        ? "PERFECT"
        : hud.judgment.type === "great"
          ? "GREAT"
          : hud.judgment.type === "good"
            ? "GOOD"
            : "MISS";
    announcement = label;
  }
  if (hud.combo >= 10 && ANNOUNCE_COMBOS.has(hud.combo) && hud.combo !== lastAnnounced.current.combo) {
    lastAnnounced.current.combo = hud.combo;
    announcement = `${announcement ? announcement + ". " : ""}Combo ${hud.combo}`;
  }

  const comboVisible = hud.combo >= 2;
  const healthPct = Math.max(0, Math.min(100, hud.health));
  const lowHealth = healthPct <= 25;

  return (
    <div className="hud" data-testid="hud">
      <div className="hud__top">
        <div className="hud__accuracy" data-testid="hud-accuracy">
          {hud.accuracy.toFixed(1)}%
        </div>
        <div className="hud__score-wrap">
          <span className="hud__score-label">SCORE</span>
          <div className="hud__score" data-testid="hud-score">
            {hud.score.toLocaleString("en-US")}
          </div>
        </div>
        <button
          className="hud__pause"
          aria-label="Pause"
          onClick={() => pauseGame()}
        >
          ❚❚
        </button>
      </div>

      <div className="hud__health-row">
        <div className={`hud__health ${lowHealth ? "hud__health--low" : ""}`}>
          <div className="hud__health-fill" style={{ width: `${healthPct}%` }} />
        </div>
      </div>

      {comboVisible && (
        <div className="hud__combo" key={hud.combo} data-testid="hud-combo">
          {hud.combo}×
        </div>
      )}

      {hud.perfectStreak >= 2 && (
        <div className="hud__streak" key={hud.perfectStreak} data-testid="hud-streak">
          PERFECT ×{hud.perfectStreak}
        </div>
      )}

      {hud.judgment && (
        <div
          key={hud.judgment.id}
          data-testid="hud-judgment"
          className={`hud__judgment ${JUDGMENT_CLASS[hud.judgment.type] ?? ""}`}
        >
          {hud.judgment.type.toUpperCase()}
        </div>
      )}

      <div className="hud__progress">
        <div className="hud__progress-fill" style={{ width: `${hud.progress * 100}%` }} />
      </div>

      {/* Screen-reader announcements (visually hidden, polite). */}
      <span
        className="sr-only"
        aria-label="Game announcements"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </span>
    </div>
  );
}
