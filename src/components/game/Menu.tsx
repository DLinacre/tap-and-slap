"use client";

import { useEffect, useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { SyncTest } from "@/components/game/SyncTest";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { startRun, uiClick } from "@/lib/client/game-actions";
import { audioEngine } from "@/game/audio/AudioEngine";
import { TRACK_LIST, TrackId } from "@/game/audio/tracks";
import { baseScoreFor, expectedMaxScore, LevelDef, LevelMeta, metaFromDef } from "@/game/levels/types";
import { isDailySlug } from "@/game/levels/daily";

interface MenuProps {
  onSignIn: () => void;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "EASY",
  NORMAL: "NORMAL",
  HARD: "HARD",
  INSANE: "INSANE",
};

/**
 * Main menu — level select, settings, leaderboard and controls legend.
 */
export function Menu({ onSignIn }: MenuProps) {
  const levels = useGameStore((s) => s.levels);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const leaderboardError = useGameStore((s) => s.leaderboardError);
  const player = useGameStore((s) => s.player);
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume);
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume);
  const setCalibrationMs = useSettingsStore((s) => s.setCalibrationMs);
  const calibrationMs = useSettingsStore((s) => s.calibrationMs);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(levels[0]?.slug ?? null);
  const [now, setNow] = useState(() => Date.now());
  const [showHowTo, setShowHowTo] = useState(false);
  const selected = levels.find((l) => l.slug === selectedSlug) ?? levels[0] ?? null;

  // First visit: open the How-to-Play modal once (dismissible, never blocking).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem("tas.seenHowTo")) {
      window.localStorage.setItem("tas.seenHowTo", "1");
      setShowHowTo(true);
    }
  }, []);

  // Countdown to midnight UTC for the daily challenge card.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const toMidnightUtc = (): string => {
    const d = new Date(now);
    const mid = new Date(d);
    mid.setUTCHours(24, 0, 0, 0);
    const ms = Math.max(0, mid.getTime() - d.getTime());
    return `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
  };

  const activeTrack = useSettingsStore((s) => s.trackForLevel(selected?.slug ?? "", selected?.defaultTrack));
  const setTrackForLevel = useSettingsStore((s) => s.setTrackForLevel);

  const start = (level: LevelDef) => startRun(level.slug, {});

  const pickTrack = (track: TrackId) => {
    if (!selected) return;
    uiClick();
    setTrackForLevel(selected.slug, track);
    audioEngine.ensureStarted(); // user gesture unlocks audio
    audioEngine.previewTrack(track);
  };

  return (
    <div className="menu" data-testid="menu">
      <h1 className="menu__title">
        TAP <span className="menu__amp">&amp;</span> SLAP
      </h1>
      <p className="menu__tagline">
        Dance-mat beat <em>’em up</em> — tap to kill on the beat.
      </p>
      <div className="menu__steps" aria-hidden="true">
        <span>1 · <b>PICK</b> a level</span>
        <span>2 · <b>SLAP</b> on the beat</span>
        <span>3 · <b>TOP</b> the board</span>
      </div>

      <div className="menu__levels-wrap">
        <ul className="menu__levels" aria-label="Levels">
          {levels.map((level) => {
            const meta: LevelMeta = metaFromDef(level);
            const maxScore = expectedMaxScore(level);
            const isSelected = selected?.slug === level.slug;
            const isDaily = isDailySlug(level.slug);
            return (
              <li key={level.slug}>
                <button
                  className={`level-card ${isSelected ? "level-card--selected" : ""} ${isDaily ? "level-card--daily" : ""}`}
                  onClick={() => {
                    uiClick();
                    setSelectedSlug(level.slug);
                  }}
                >
                  <span className="level-card__left">
                    <span className="level-card__title">
                      <span className={`diff-pill diff--${level.difficulty}`}>
                        {DIFFICULTY_LABEL[level.difficulty]}
                      </span>
                      <span className="level-card__name">{level.title}</span>
                      {isDaily && <span className="level-card__daily">DAILY</span>}
                    </span>
                    <span className="level-card__meta">
                      {level.bpm} BPM · {meta.noteCount} notes
                      {isDaily && <> · resets in {toMidnightUtc()}</>}
                    </span>
                  </span>
                  <span className="level-card__right">
                    <span className="level-card__duration">
                      {isSelected ? "▶ " : ""}
                      {meta.durationSec}s
                    </span>
                    <span className="level-card__max">{maxScore.toLocaleString("en-US")} max</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selected && (
        <div className="menu__start-row">
          <p className="menu__desc">{selected.description}</p>
          <NeonButton
            className="menu__start neon-btn--play"
            onClick={() => start(selected)}
            data-testid="start-level"
          >
            ▶ START
          </NeonButton>
          <NeonButton
            variant="ghost"
            className="menu__start menu__practice"
            onClick={() => startRun("first-beat", { practice: true })}
            data-testid="practice-level"
          >
            🧘 PRACTICE — NO-FAIL (FIRST BEAT)
          </NeonButton>
        </div>
      )}

      <section className="menu__panel" aria-label="Soundtrack">
        <h2>🎵 SOUNDTRACK — FIGHT MUSIC</h2>
        <div className="track-list">
          {TRACK_LIST.map((track) => {
            const isActive = activeTrack === track.id;
            return (
              <button
                key={track.id}
                className={`track-item ${isActive ? "track-item--active" : ""}`}
                onClick={() => pickTrack(track.id)}
                aria-pressed={isActive}
                data-testid={`track-${track.id}`}
              >
                <span className="track-item__play">
                  {isActive ? (
                    <span className="eq" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    "▶"
                  )}
                </span>
                <span className="track-item__body">
                  <span className="track-item__name">{track.name}</span>
                  <span className="track-item__tagline">{track.tagline}</span>
                </span>
                {isActive && <span className="track-item__badge">SELECTED</span>}
              </button>
            );
          })}
        </div>
        <p className="menu__muted">All tracks are original procedural compositions — tap one to preview.</p>
      </section>

      <div className="menu__columns">
        <section className="menu__panel" aria-label="Controls">
          <div className="menu__panel-head">
            <h2>CONTROLS</h2>
            <button
              type="button"
              className="menu__howto"
              onClick={() => setShowHowTo(true)}
              data-testid="howto-button"
            >
              ❓ HOW TO PLAY
            </button>
          </div>
          <div className="controls-grid">
            <span className="keycap">◀</span><span className="keycap">▼</span>
            <span className="keycap">▲</span><span className="keycap">▶</span>
            <span className="controls-hint">or WASD / tap the pads or enemies</span>
          </div>
          <h2>SETTINGS</h2>
          <label className="slider-row">
            <span>Master</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={masterVolume} aria-label="Master volume"
              onChange={(e) => setMasterVolume(Number(e.target.value))}
            />
          </label>
          <label className="slider-row">
            <span>Music</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={musicVolume} aria-label="Music volume"
              onChange={(e) => setMusicVolume(Number(e.target.value))}
            />
          </label>
          <label className="slider-row">
            <span>SFX</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={sfxVolume} aria-label="SFX volume"
              onChange={(e) => setSfxVolume(Number(e.target.value))}
            />
          </label>
          <label className="slider-row">
            <span>Offset</span>
            <input
              type="range" min={-100} max={100} step={5}
              value={calibrationMs} aria-label="Timing calibration (ms)"
              onChange={(e) => setCalibrationMs(Number(e.target.value))}
            />
            <span className="slider-value">{calibrationMs > 0 ? `+${calibrationMs}` : calibrationMs}ms</span>
          </label>
          <SyncTest />
        </section>

        <section className="menu__panel" aria-label="Leaderboard">
          <h2>TOP SLAPS{selected ? ` — ${selected.title.toUpperCase()}` : ""}</h2>
          {leaderboardError ? (
            <p className="menu__muted">{leaderboardError}</p>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <p className="menu__muted">No runs yet — be the first!</p>
          ) : (
            <ol className="leaderboard">
              {leaderboard.map((entry, i) => (
                <li key={entry.id} className="leaderboard__row">
                  <span className="leaderboard__rank">#{i + 1}</span>
                  <span className="leaderboard__name">
                    {entry.name}
                    {entry.isGuest && <span className="leaderboard__guest">guest</span>}
                  </span>
                  <span className="leaderboard__score">{entry.score.toLocaleString("en-US")}</span>
                </li>
              ))}
            </ol>
          )}
          {!player && (
            <button className="menu__signin-link" onClick={onSignIn}>
              Sign in to save your name on the leaderboard →
            </button>
          )}
        </section>
      </div>

      <p className="menu__tip">
        Tip: tap when the enemy hits the line — the pad flashes even on TOO EARLY / TOO LATE.
        PERFECT = dead centre, heavies score ×1.5, and an 8× combo is where the big numbers live.
      </p>
      <span className="menu__muted">{baseScoreFor("normal")} pts per note</span>

      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
    </div>
  );
}
