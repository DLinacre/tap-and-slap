/**
 * Global game store (Zustand).
 *
 * This is the contract between the Phaser engine and the React shell:
 *   - Phaser scenes write results via `useGameStore.setState(...)`
 *   - React components read slices via `useGameStore(selector)`
 *
 * Keep it small and serializable — never store Phaser objects here.
 */

import { create } from "zustand";
import type { JudgmentType } from "@/game/core/Judgement";
import type { Difficulty, LevelDef } from "@/game/levels/types";
import type { LeaderboardEntry, UserDto } from "@/types/api";

export type Screen = "boot" | "menu" | "playing" | "paused" | "gameover";

export interface HudState {
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number; // 0–100
  health: number; // 0–100
  /** Latest judgment for the flash animation (id bumps per event). */
  judgment: { type: JudgmentType; id: number } | null;
  /** Song progress 0–1. */
  progress: number;
  /** Consecutive PERFECT hits (shown in the HUD when ≥ 2). */
  perfectStreak: number;
}

export const INITIAL_HUD: HudState = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 0,
  health: 100,
  judgment: null,
  progress: 0,
  perfectStreak: 0,
};

export interface GameResult {
  levelSlug: string;
  levelTitle: string;
  difficulty: Difficulty;
  score: number;
  maxCombo: number;
  accuracy: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  durationMs: number;
  /** Timing coach: taps outside the window (early = negative delta). */
  attemptsEarly: number;
  attemptsLate: number;
  /** Mean delta of out-of-window taps (ms; negative = tapped early). */
  avgTimingDeltaMs: number;
  isNewBest: boolean;
  rank: number | null;
  eligible: boolean;
  submitted: boolean;
  autoplay: boolean;
  /** Practice (no-fail) run — results shown but not submitted. */
  practice?: boolean;
  /** Client-generated idempotency key for score submission. */
  runId: string;
}

export interface RunOptions {
  autoplay?: boolean;
  qa?: boolean;
  /** No-fail practice run: misses become GOOD, scores are never submitted. */
  practice?: boolean;
}

export interface GameState {
  screen: Screen;
  levelSlug: string | null;
  level: LevelDef | null;
  runOptions: RunOptions;
  hud: HudState;
  result: GameResult | null;

  // Menu data
  levels: LevelDef[];
  leaderboard: LeaderboardEntry[] | null;
  leaderboardError: string | null;

  // Identity
  player: UserDto | null;
  guestId: string;

  // Actions
  setScreen: (screen: Screen) => void;
  setLevel: (level: LevelDef | null, options?: RunOptions) => void;
  setHud: (patch: Partial<HudState>) => void;
  resetHud: () => void;
  setResult: (result: GameResult | null) => void;
  setLevels: (levels: LevelDef[]) => void;
  setLeaderboard: (entries: LeaderboardEntry[] | null, error?: string | null) => void;
  setPlayer: (player: UserDto | null) => void;
  setGuestId: (guestId: string) => void;
}

export const useGameStore = create<GameState>()((set) => ({
  screen: "boot",
  levelSlug: null,
  level: null,
  runOptions: {},
  hud: INITIAL_HUD,
  result: null,
  levels: [],
  leaderboard: null,
  leaderboardError: null,
  player: null,
  guestId: "",

  setScreen: (screen) => set({ screen }),
  setLevel: (level, options = {}) =>
    set({ level, levelSlug: level?.slug ?? null, runOptions: options }),
  setHud: (patch) => set((s) => ({ hud: { ...s.hud, ...patch } })),
  resetHud: () => set({ hud: INITIAL_HUD }),
  setResult: (result) => set({ result }),
  setLevels: (levels) => set({ levels }),
  setLeaderboard: (entries, error = null) =>
    set({ leaderboard: entries, leaderboardError: error }),
  setPlayer: (player) => set({ player }),
  setGuestId: (guestId) => set({ guestId }),
}));
