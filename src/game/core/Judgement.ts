/**
 * Judgment logic — pure functions over timing windows.
 *
 * Windows are asymmetric ms offsets around a note's hit time:
 *   |now - noteTime| <= perfectMs  → PERFECT
 *   <= greatMs                     → GREAT
 *   early side <= goodEarlyMs      → GOOD (strict — no mashing ahead)
 *   late side  <= goodLateMs       → GOOD (lenient — touch/Bluetooth latency)
 *   otherwise                      → MISS
 */

import { JUDGMENT_WINDOWS, JudgmentWindows } from "../config";

export type JudgmentType = "perfect" | "great" | "good" | "miss";

export const JUDGMENT_ORDER: JudgmentType[] = ["perfect", "great", "good", "miss"];

export interface JudgmentResult {
  type: JudgmentType;
  /** Signed ms deviation (negative = early, positive = late). */
  deltaMs: number;
}

export function judgeNote(
  noteTimeMs: number,
  nowMs: number,
  windows: JudgmentWindows = JUDGMENT_WINDOWS,
): JudgmentResult {
  const deltaMs = nowMs - noteTimeMs; // negative = early, positive = late
  const abs = Math.abs(deltaMs);
  if (abs <= windows.perfectMs) return { type: "perfect", deltaMs };
  if (abs <= windows.greatMs) return { type: "great", deltaMs };
  const goodLimit = deltaMs < 0 ? windows.goodEarlyMs : windows.goodLateMs;
  if (abs <= goodLimit) return { type: "good", deltaMs };
  return { type: "miss", deltaMs };
}

/** Is `nowMs` inside any hittable window for the note? (asymmetric) */
export function isWithinWindow(
  noteTimeMs: number,
  nowMs: number,
  windows: JudgmentWindows = JUDGMENT_WINDOWS,
): boolean {
  const delta = nowMs - noteTimeMs;
  return delta >= 0 ? delta <= windows.goodLateMs : -delta <= windows.goodEarlyMs;
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
