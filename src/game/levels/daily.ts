/**
 * Daily Challenge — a fresh, deterministic map every day.
 *
 * The slug encodes the date (`daily-YYYY-MM-DD`, UTC) and the map is a pure
 * function of that date's seed, so every player on every server computes the
 * identical challenge — no database job required. Scoring works through the
 * normal integrity pipeline because the server derives the same map.
 */

import { generateMap } from "./generator";
import { LevelDef } from "./types";
import { DEFAULT_TRACK } from "../audio/tracks";

export const DAILY_SLUG_PREFIX = "daily-";
export const DAILY_BARS = 24; // ~60–75s per run
export const DAILY_BPM = 118;
export const DAILY_DENSITY = 2 as const;

/** UTC calendar key, e.g. "2026-08-03". */
export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isDailySlug(slug: string): boolean {
  const key = slug.slice(DAILY_SLUG_PREFIX.length);
  return (
    slug.startsWith(DAILY_SLUG_PREFIX) && /^\d{4}-\d{2}-\d{2}$/.test(key)
  );
}

export function dailySlug(date: Date): string {
  return `${DAILY_SLUG_PREFIX}${dateKey(date)}`;
}

/** FNV-1a 32-bit hash — turns a date key into a deterministic seed. */
export function dailySeed(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Build the challenge level for a specific UTC date. */
export function buildDailyDef(date: Date): LevelDef {
  const key = dateKey(date);
  const seed = dailySeed(key);
  return {
    slug: `${DAILY_SLUG_PREFIX}${key}`,
    title: "Daily Challenge",
    artist: "Tap & Slap Records",
    description:
      "A fresh map every day — the same for every player. Beat it before midnight UTC.",
    difficulty: "NORMAL",
    bpm: DAILY_BPM,
    seed,
    palette: {
      bg: 0x0a0118,
      accent: 0xff2ec4,
      lanes: [0x2f6bff, 0xffd23f, 0xff4d6d, 0x2ee66d],
    },
    map: generateMap({
      seed,
      bpm: DAILY_BPM,
      density: DAILY_DENSITY,
      truncateBars: DAILY_BARS,
    }),
    defaultTrack: DEFAULT_TRACK,
  };
}

/** Today's challenge (UTC). */
export function getDailyDef(date: Date = new Date()): LevelDef {
  return buildDailyDef(date);
}

/** Parse a daily slug back into its UTC date (or null). */
export function dailyDateFromSlug(slug: string): Date | null {
  if (!isDailySlug(slug)) return null;
  const key = slug.slice(DAILY_SLUG_PREFIX.length);
  const d = new Date(`${key}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
