/**
 * Built-in level registry (content as code).
 *
 * Levels are deterministic products of `generator.generateMap(seed, params)`.
 * The registry is the MVP source of truth; the API exposes it read-only
 * (`/api/levels`, `/api/levels/:slug`) and the DB `Level` table mirrors it
 * for score integrity (see docs/03-database.md).
 */

import { BeatMap, LevelDef, LevelMeta, metaFromDef } from "./types";
import { generateMap, GeneratorOptions } from "./generator";
import { buildDailyDef, dailyDateFromSlug, isDailySlug } from "./daily";

export interface BuildLevelOptions {
  /** QA mode: truncate the map to the first N bars. */
  truncateBars?: number;
}

function build(
  slug: string,
  title: string,
  artist: string,
  description: string,
  difficulty: LevelDef["difficulty"],
  opts: GeneratorOptions,
  palette: LevelDef["palette"],
  defaultTrack?: string,
): LevelDef {
  const def: LevelDef = {
    slug,
    title,
    artist,
    description,
    difficulty,
    bpm: opts.bpm,
    seed: opts.seed,
    palette,
    map: generateMap(opts),
    ...(defaultTrack ? { defaultTrack } : {}),
  };
  return def;
}

const PALETTE_BASE = { bg: 0x0a0118, accent: 0xff2ec4 } as const;
// v1.2: brightened lane palette (WCAG 1.4.11 ≥3:1 against the bg) — matches
// the config LANE_COLORS so menu art and gameplay agree.
const PALETTE_LANES: [number, number, number, number] = [0x3f7bff, 0xffd23f, 0xff5f7a, 0x3ee67c];

// v1.2 tempo pass ("catchy with a good tempo"): 92→100 BPM (danceable
// warm-up), 112→118 (pop-dance pocket), 132→138 (16th streams that bite).
const LEVELS: LevelDef[] = [
  build(
    "first-beat",
    "First Beat",
    "Tap & Slap Records",
    "A gentle warm-up. Learn the lanes and feel the beat — every enemy dies on the downbeat.",
    "EASY",
    { seed: 1337, bpm: 100, density: 1 },
    { ...PALETTE_BASE, lanes: PALETTE_LANES },
    "thunder",
  ),
  build(
    "neon-rampage",
    "Neon Rampage",
    "Tap & Slap Records",
    "The city heats up. Streams, chords and jack patterns keep your thumbs honest.",
    "NORMAL",
    { seed: 4242, bpm: 118, density: 2 },
    { ...PALETTE_BASE, lanes: PALETTE_LANES },
    "inferno",
  ),
  build(
    "disco-inferno",
    "Disco Inferno",
    "Tap & Slap Records",
    "Maximum density. Sixteenth-note streams, heavy brutes and a final boss bar.",
    "HARD",
    { seed: 9001, bpm: 138, density: 3 },
    { ...PALETTE_BASE, lanes: PALETTE_LANES },
    "iron",
  ),
];

/**
 * Resolve a level def: built-ins first, then dynamic daily-challenge slugs.
 * Daily maps are derived deterministically from the slug's date, so the
 * server and every client agree on the exact same map (integrity-safe).
 */
export function getLevelDef(slug: string, opts?: BuildLevelOptions): LevelDef | undefined {
  const def =
    LEVELS.find((l) => l.slug === slug) ??
    (isDailySlug(slug) ? defFromDailySlug(slug) : undefined);
  if (!def) return undefined;
  if (!opts?.truncateBars) return def;
  return {
    ...def,
    map: generateMap({
      seed: def.seed,
      bpm: def.bpm,
      density: densityForDifficulty(def.difficulty),
      truncateBars: opts.truncateBars,
    }),
  };
}

function defFromDailySlug(slug: string): LevelDef | undefined {
  const date = dailyDateFromSlug(slug);
  if (!date) return undefined;
  // Future challenges don't exist yet.
  if (date.getTime() > new Date().getTime()) return undefined;
  return buildDailyDef(date);
}

function densityForDifficulty(d: LevelDef["difficulty"]): 1 | 2 | 3 | 4 {
  switch (d) {
    case "EASY":
      return 1;
    case "NORMAL":
      return 2;
    case "HARD":
      return 3;
    case "INSANE":
      return 4;
  }
}

export function getLevels(): LevelDef[] {
  return LEVELS;
}

export function getLevelMetas(): LevelMeta[] {
  // The daily challenge leads the listing (server-side /api/levels).
  return [metaFromDef(buildDailyDef(new Date())), ...LEVELS.map(metaFromDef)];
}

export function getLevelMeta(slug: string): LevelMeta | undefined {
  const def = getLevelDef(slug);
  return def ? metaFromDef(def) : undefined;
}

export function getBeatMap(slug: string): BeatMap | undefined {
  return getLevelDef(slug)?.map;
}

export const BUILTIN_SLUGS: string[] = LEVELS.map((l) => l.slug);
