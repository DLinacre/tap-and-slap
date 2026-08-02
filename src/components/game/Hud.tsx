"use client";

import { useGameStore } from "@/store/game-store";
import { pauseGame } from "@/lib/client/game-actions";

const JUDGMENT_CLASS: Record<string, string> = {
  perfect: "judgment--perfect",
  great: "judgment--great",
  good: "judgment--good",
  miss: "judgment--miss",
};

/**
 * HUD — score, combo, health, accuracy and judgment feedback.
 * Reads exclusively from the Zustand store (written by GameScene).
 */
export function Hud() {
  const hud = useGameStore((s) => s.hud);

  const comboVisible = hud.combo >= 2;
  const healthPct = Math.max(0, Math.min(100, hud.health));
  const lowHealth = healthPct <= 25;

  return (
    <div className="hud" data-testid="hud">
      <div className="hud__top">
        <div className="hud__accuracy" data-testid="hud-accuracy">
          {hud.accuracy.toFixed(1)}%
        </div>
        <div className="hud__score" data-testid="hud-score">
          {hud.score.toLocaleString("en-US")}
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
          className={`hud__judgment ${JUDGMENT_CLASS[hud.judgment.type] ?? ""}`}
        >
          {hud.judgment.type.toUpperCase()}
        </div>
      )}

      <div className="hud__progress">
        <div className="hud__progress-fill" style={{ width: `${hud.progress * 100}%` }} />
      </div>
    </div>
  );
}
