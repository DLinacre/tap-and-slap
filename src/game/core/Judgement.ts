/**
 * Judgment logic — pure functions over timing windows.
 *
 * Windows are absolute ms offsets around a note's hit time:
 *   |now - noteTime| <= perfectMs  → PERFECT
 *   <= greatMs                     → GREAT
 *   <= goodMs                      → GOOD
 *   otherwise                      → MISS
 */

import { JUDGMENT_WINDOWS, JudgmentWindows } from "../config";

export type JudgmentType = "perfect" | "great" | "good" | "miss";

export const JUDGMENT_ORDER: JudgmentType[] = ["perfect", "great", "good", "miss"];

export interface JudgmentResult {
  type: JudgmentType;
  /** Absolute ms deviation from the note time (0 = exactly on the beat). */
  deltaMs: number;
}

export function judgeNote(
  noteTimeMs: number,
  nowMs: number,
  windows: JudgmentWindows = JUDGMENT_WINDOWS,
): JudgmentResult {
  const deltaMs = Math.abs(nowMs - noteTimeMs);
  if (deltaMs <= windows.perfectMs) return { type: "perfect", deltaMs };
  if (deltaMs <= windows.greatMs) return { type: "great", deltaMs };
  if (deltaMs <= windows.goodMs) return { type: "good", deltaMs };
  return { type: "miss", deltaMs };
}

/** Is `nowMs` inside any hittable window for the note? */
export function isWithinWindow(
  noteTimeMs: number,
  nowMs: number,
  windows: JudgmentWindows = JUDGMENT_WINDOWS,
): boolean {
  return Math.abs(nowMs - noteTimeMs) <= windows.goodMs;
}

/** Weight used for accuracy (DDR-style). */
export function accuracyWeight(type: JudgmentType): number {
  switch (type) {
    case "perfect":
      return 1;
    case "great":
      return 0.7;
    case "good":
      return 0.4;
    case "miss":
      return 0;
  }
}

export function labelFor(type: JudgmentType): string {
  return type.toUpperCase();
}
