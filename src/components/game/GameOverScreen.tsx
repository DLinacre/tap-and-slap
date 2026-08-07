"use client";

import { useMemo, useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { useGameStore } from "@/store/game-store";
import { quitToMenu, restartRun } from "@/lib/client/game-actions";

interface GameOverScreenProps {
  /** Called after returning to the menu so the leaderboard refreshes. */
  onBack: () => void;
}

/** Share a run: Web Share API when available, clipboard fallback. */
async function shareRun(result: NonNullable<ReturnType<typeof useGameStore.getState>["result"]>) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/?level=${encodeURIComponent(result.levelSlug)}`;
  const text = `I scored ${result.score.toLocaleString("en-US")} (${result.accuracy.toFixed(1)}% accuracy) on ${result.levelTitle} in Tap & Slap — think you can beat it on the beat?`;
  const data = { title: "Tap & Slap", text, url };
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(data);
      return;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
  } catch {
    // User cancelled the share sheet or clipboard denied — not an error.
  }
}

/**
 * Post-run results: stats grid, personal-best badge, server rank, retry/menu.
 */
export function GameOverScreen({ onBack }: GameOverScreenProps) {
  const result = useGameStore((s) => s.result);
  const player = useGameStore((s) => s.player);
  const [shared, setShared] = useState(false);

  // NOTE: all hooks must run before the early return (Rules of Hooks).
  const grade =
    result && result.accuracy >= 99
      ? { letter: "SSS", cls: "grade--gold" }
      : result && result.accuracy >= 96
        ? { letter: "SS", cls: "grade--gold" }
        : result && result.accuracy >= 92
          ? { letter: "S", cls: "grade--gold" }
          : result && result.accuracy >= 85
            ? { letter: "A", cls: "grade--cyan" }
            : result && result.accuracy >= 75
              ? { letter: "B", cls: "grade--cyan" }
              : result && result.accuracy >= 60
                ? { letter: "C", cls: "grade--pink" }
                : { letter: "D", cls: "grade--dim" };

  // Judgment breakdown percentages for the proportional bar.
  const total = (result?.perfects ?? 0) + (result?.greats ?? 0) + (result?.goods ?? 0) + (result?.misses ?? 0) || 1;
  const barPct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

  // Confetti for top-tier runs (respects prefers-reduced-motion via CSS).
  const showConfetti = grade.letter === "SSS" || grade.letter === "SS" || grade.letter === "S";
  const confetti = useMemo(
    () =>
      showConfetti
        ? Array.from({ length: 14 }, (_, i) => ({
            id: i,
            left: `${(i * 7.3 + 3) % 100}%`,
            delay: `${(i % 7) * 0.28}s`,
            duration: `${2.4 + (i % 5) * 0.35}s`,
            color: ["#ff2ec4", "#22d3ee", "#ffd54a", "#a3e635", "#ff4d6d"][i % 5],
          }))
        : [],
    [showConfetti],
  );

  if (!result) return null;

  const verdict =
    result.misses === 0
      ? "FLAWLESS!"
      : result.accuracy >= 90
        ? "ON FIRE!"
        : result.accuracy >= 70
          ? "SOLID RUN"
          : "KEEP PRACTICING";

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

        {confetti.map((c) => (
          <span
            key={c.id}
            className="confetti"
            style={{
              left: c.left,
              background: c.color,
              animationDelay: c.delay,
              animationDuration: c.duration,
            }}
            aria-hidden="true"
          />
        ))}
        {result.isNewBest && <div className="results__badge">★ NEW LOCAL BEST ★</div>}
        {result.rank !== null && result.rank <= 10 && (
          <div className="results__badge">TOP {result.rank} ON THE BOARD</div>
        )}

        <div className="judgment-bar" aria-hidden="true">
          <span className="judgment-bar__perfect" style={{ width: barPct(result.perfects) }} />
          <span className="judgment-bar__great" style={{ width: barPct(result.greats) }} />
          <span className="judgment-bar__good" style={{ width: barPct(result.goods) }} />
          <span className="judgment-bar__miss" style={{ width: barPct(result.misses) }} />
        </div>
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
          {!result.autoplay && (
            <NeonButton
              variant="ghost"
              onClick={() => {
                void shareRun(result);
                setShared(true);
              }}
            >
              {shared ? "✓ COPIED" : "⇪ SHARE"}
            </NeonButton>
          )}
        </div>
      </div>
    </div>
  );
}
