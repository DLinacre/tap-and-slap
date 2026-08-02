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

const LEVELS: LevelDef[] = [
  build(
    "first-beat",
    "First Beat",
    "Tap & Slap Records",
    "A gentle warm-up. Learn the lanes and feel the beat — every enemy dies on the downbeat.",
    "EASY",
    { seed: 1337, bpm: 92, density: 1 },
    { ...PALETTE_BASE, lanes: [0x2f6bff, 0xffd23f, 0xff4d6d, 0x2ee66d] },
    "thunder",
  ),
  build(
    "neon-rampage",
    "Neon Rampage",
    "Tap & Slap Records",
    "The city heats up. Streams, chords and jack patterns keep your thumbs honest.",
    "NORMAL",
    { seed: 4242, bpm: 112, density: 2 },
    { ...PALETTE_BASE, lanes: [0x2f6bff, 0xffd23f, 0xff4d6d, 0x2ee66d] },
    "inferno",
  ),
  build(
    "disco-inferno",
    "Disco Inferno",
    "Tap & Slap Records",
    "Maximum density. Sixteenth-note streams, heavy brutes and a final boss bar.",
    "HARD",
    { seed: 9001, bpm: 132, density: 3 },
    { ...PALETTE_BASE, lanes: [0x2f6bff, 0xffd23f, 0xff4d6d, 0x2ee66d] },
    "iron",
  ),
];

/** Clone a level def, optionally truncating the map (QA mode). */
export function getLevelDef(slug: string, opts?: BuildLevelOptions): LevelDef | undefined {
  const def = LEVELS.find((l) => l.slug === slug);
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
  return LEVELS.map(metaFromDef);
}

export function getLevelMeta(slug: string): LevelMeta | undefined {
  const def = getLevelDef(slug);
  return def ? metaFromDef(def) : undefined;
}

export function getBeatMap(slug: string): BeatMap | undefined {
  return getLevelDef(slug)?.map;
}

export const BUILTIN_SLUGS: string[] = LEVELS.map((l) => l.slug);
