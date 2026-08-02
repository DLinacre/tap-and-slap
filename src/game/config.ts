/**
 * Game constants & tuning knobs. Single source of truth for layout math,
 * judgment windows, health economy and palette.
 */

// --- Canvas (portrait, mobile-first; FIT-scaled on desktop) ---------------
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

// --- Dance-mat lanes (DDR order: left, down, up, right) -------------------
export const LANE_COUNT = 4;
export const LANE_X = [60, 180, 300, 420] as const;
export const LANE_KEYS = ["LEFT", "DOWN", "UP", "RIGHT"] as const;

/** Lane center x (indexed access with a runtime guard). */
export function laneX(lane: number): number {
  return LANE_X[lane] ?? 60;
}

/** Lane accent color. */
export function laneColor(lane: number): number {
  return LANE_COLORS[lane] ?? 0xff2ec4;
}

// --- Hit zone --------------------------------------------------------------
export const HIT_Y = 660; // y where enemies must be slapped
export const ENEMY_SPAWN_Y = -80;
export const ENEMY_SIZE = 96;

// --- Rhythm -----------------------------------------------------------------
export const DEFAULT_APPROACH_BEATS = 4; // beats of approach time per note

// --- Judgment windows (ms) --------------------------------------------------
export interface JudgmentWindows {
  perfectMs: number;
  greatMs: number;
  goodMs: number;
}
export const JUDGMENT_WINDOWS: JudgmentWindows = { perfectMs: 45, greatMs: 90, goodMs: 135 };

// --- Health economy ----------------------------------------------------------
export const MAX_HEALTH = 100;
export const MISS_HEALTH_COST = 12;
export const PERFECT_HEALTH_GAIN = 2;
export const GREAT_HEALTH_GAIN = 1;

// --- Combo multiplier ---------------------------------------------------------
export const COMBO_MULTIPLIER_STEP = 10; // +1 multiplier every N combo
export const COMBO_MULTIPLIER_CAP = 8;

// --- Palette ------------------------------------------------------------------
export const LANE_COLORS = [0x2f6bff, 0xffd23f, 0xff4d6d, 0x2ee66d] as const;
export const BG_COLOR = 0x0a0118;
export const ACCENT_COLOR = 0xff2ec4;
export const PERFECT_COLOR = 0xffd54a;
export const GREAT_COLOR = 0x22d3ee;
export const GOOD_COLOR = 0xa3e635;
export const MISS_COLOR = 0xff4d6d;

// --- Score submission ----------------------------------------------------------
export const QA_TRUNCATE_BARS = 8; // ?autoplay=1&qa=1 shortens maps for CI/E2E
