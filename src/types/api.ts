/**
 * Shared API DTO types (client + server).
 */

import type { Difficulty } from "@/game/levels/types";

export interface UserDto {
  id: string;
  email: string;
  username: string;
}

export interface LeaderboardEntry {
  id: string;
  /** Display label: username for signed-in users, `Guest-xxxx` otherwise. */
  name: string;
  isGuest: boolean;
  score: number;
  maxCombo: number;
  accuracy: number;
  difficulty: Difficulty;
  createdAt: string;
}

export interface SubmitScorePayload {
  levelSlug: string;
  difficulty: Difficulty;
  score: number;
  maxCombo: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  accuracy: number;
  durationMs: number;
  guestId?: string;
  autoplay?: boolean;
}

export interface SubmitScoreResponse {
  id: string;
  rank: number | null;
  isNewBest: boolean;
  /** Whether the run counts on the public leaderboard. */
  eligible: boolean;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: "ok";
  version: string;
  time: string;
  db: "up" | "down";
}

export interface MyScoresResponse {
  best: Array<{
    levelSlug: string;
    difficulty: Difficulty;
    score: number;
    maxCombo: number;
    accuracy: number;
    createdAt: string;
  }>;
}
