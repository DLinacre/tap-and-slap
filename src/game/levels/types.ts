/**
 * Level / beat-map domain types.
 *
 * IMPORTANT: This module (and everything under `src/game/levels/`) is
 * framework-agnostic pure TypeScript — no Phaser, no React, no Node APIs.
 * It is imported by the browser game, the Next.js API server, the Prisma
 * seed script and the unit tests.
 */

/** The four dance-mat lanes, DDR order: Left, Down, Up, Right. */
export const LANES = [0, 1, 2, 3] as const;
export type Lane = (typeof LANES)[number];

export const DIFFICULTIES = ["EASY", "NORMAL", "HARD", "INSANE"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Enemy/note variants. Heavy = more points, mini = fewer. */
export type NoteKind = "normal" | "heavy" | "mini";

export interface MapNote {
  /** Hit time in beats (float, 0-based, relative to song start). */
  beat: number;
  lane: Lane;
  kind: NoteKind;
}

export type SectionStyle = "intro" | "verse" | "chorus" | "outro";

export interface MapSection {
  name: string;
  /** Inclusive bar range (bar 0 = first bar, 4 beats per bar). */
  startBar: number;
  endBar: number;
  style: SectionStyle;
}

export interface BeatMap {
  bpm: number;
  /** ms from song start to beat 0 (lets the audio intro breathe). */
  offsetMs: number;
  /** Beats of approach: how early an enemy becomes visible before its hit beat. */
  approachBeats: number;
  /** Total bars (4 beats each). */
  bars: number;
  sections: MapSection[];
  notes: MapNote[];
}

export interface LevelPalette {
  /** Background color (hex). */
  bg: number;
  /** Per-lane accent colors, index = lane. */
  lanes: [number, number, number, number];
  accent: number;
}

export interface LevelDef {
  slug: string;
  title: string;
  artist: string;
  description: string;
  difficulty: Difficulty;
  bpm: number;
  /** Deterministic map-generation seed. */
  seed: number;
  palette: LevelPalette;
  map: BeatMap;
  /** Default fight track id (see audio/tracks.ts). Optional — falls back to DEFAULT_TRACK. */
  defaultTrack?: string;
}

export interface LevelMeta {
  slug: string;
  title: string;
  artist: string;
  description: string;
  difficulty: Difficulty;
  bpm: number;
  noteCount: number;
  durationSec: number;
  bars: number;
}

/** Base score awarded for a perfect hit on a note kind. */
export function baseScoreFor(kind: NoteKind): number {
  switch (kind) {
    case "heavy":
      return 150;
    case "mini":
      return 50;
    default:
      return 100;
  }
}

/** Theoretical max score: every note hit perfectly with the ×8 multiplier cap. */
export function expectedMaxScore(def: Pick<LevelDef, "map">): number {
  const totalBase = def.map.notes.reduce((acc, n) => acc + baseScoreFor(n.kind), 0);
  return totalBase * 8;
}

export function metaFromDef(def: LevelDef): LevelMeta {
  const durMs = def.map.offsetMs + def.map.bars * 4 * (60_000 / def.map.bpm);
  return {
    slug: def.slug,
    title: def.title,
    artist: def.artist,
    description: def.description,
    difficulty: def.difficulty,
    bpm: def.bpm,
    noteCount: def.map.notes.length,
    durationSec: Math.round(durMs / 1000),
    bars: def.map.bars,
  };
}
