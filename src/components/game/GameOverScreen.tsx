"use client";

import { NeonButton } from "@/components/ui/NeonButton";
import { useGameStore } from "@/store/game-store";
import { quitToMenu, restartRun } from "@/lib/client/game-actions";

interface GameOverScreenProps {
  /** Called after returning to the menu so the leaderboard refreshes. */
  onBack: () => void;
}

/**
 * Post-run results: stats grid, personal-best badge, server rank, retry/menu.
 */
export function GameOverScreen({ onBack }: GameOverScreenProps) {
  const result = useGameStore((s) => s.result);
  const player = useGameStore((s) => s.player);

  if (!result) return null;

  const verdict =
    result.misses === 0
      ? "FLAWLESS!"
      : result.accuracy >= 90
        ? "ON FIRE!"
        : result.accuracy >= 70
          ? "SOLID RUN"
          : "KEEP PRACTICING";

  /** DDR-style grade from weighted accuracy. */
  const grade =
    result.accuracy >= 99
      ? { letter: "SSS", cls: "grade--gold" }
      : result.accuracy >= 96
        ? { letter: "SS", cls: "grade--gold" }
        : result.accuracy >= 92
          ? { letter: "S", cls: "grade--gold" }
          : result.accuracy >= 85
            ? { letter: "A", cls: "grade--cyan" }
            : result.accuracy >= 75
              ? { letter: "B", cls: "grade--cyan" }
              : result.accuracy >= 60
                ? { letter: "C", cls: "grade--pink" }
                : { letter: "D", cls: "grade--dim" };

  const stat = (label: string, value: string, testId?: string) => (
    <div className="results__stat" data-testid={testId}>
      <span className="results__stat-label">{label}</span>
      <span className="results__stat-value">{value}</span>
    </div>
  );

  return (
    <div className="overlay" data-testid="gameover">
      <div className="results">
        <div className="results__grade-row">
          <span className={`results__grade ${grade.cls}`} data-testid="result-grade">
            {grade.letter}
          </span>
          <h2 className="results__verdict">{verdict}</h2>
        </div>
        <p className="results__level">
          {result.levelTitle} · {result.difficulty}
        </p>

        {result.isNewBest && <div className="results__badge">★ NEW LOCAL BEST ★</div>}
        {result.rank !== null && result.rank <= 10 && (
          <div className="results__badge">TOP {result.rank} ON THE BOARD</div>
        )}

        <div className="results__grid">
          {stat("SCORE", result.score.toLocaleString("en-US"), "result-score")}
          {stat("MAX COMBO", `${result.maxCombo}×`)}
          {stat("ACCURACY", `${result.accuracy.toFixed(2)}%`)}
          {stat(
            "JUDGMENTS",
            `P ${result.perfects} · G ${result.greats} · O ${result.goods} · M ${result.misses}`,
          )}
        </div>

        <p className="results__submitted">
          {result.autoplay
            ? "QA autoplay run — not submitted."
            : result.submitted
              ? "Score submitted."
              : player
                ? "Score saved on this device."
                : "Signed out — score saved on this device."}
        </p>

        <div className="results__actions">
          <NeonButton onClick={() => restartRun()}>↻ RETRY</NeonButton>
          <NeonButton variant="ghost" onClick={() => { quitToMenu(); onBack(); }}>
            MENU
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
