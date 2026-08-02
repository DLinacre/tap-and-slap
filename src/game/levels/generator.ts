/**
 * Deterministic, seeded beat-map generator.
 *
 * Every level ships as a seed + generation parameters; the map is produced by
 * this pure function. Same seed ⇒ same map (unit-tested), which keeps
 * leaderboard integrity verifiable server-side (`expectedMaxScore` can be
 * recomputed from the same generator).
 */

import {
  BeatMap,
  Lane,
  MapNote,
  MapSection,
  NoteKind,
  SectionStyle,
} from "./types";

/** Small fast seeded PRNG (mulberry32). Returns values in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const BEATS_PER_BAR = 4;

export interface GeneratorOptions {
  seed: number;
  bpm: number;
  /**
   * Density 1 (sparse) → 4 (insane). Maps to per-section pattern budgets and
   * step sizes (8th vs 16th notes).
   */
  density: 1 | 2 | 3 | 4;
  approachBeats?: number;
  offsetMs?: number;
  /** QA/debug: keep only the first N bars of the generated map. */
  truncateBars?: number;
}

const SECTION_PLAN: Array<{ name: string; bars: number; style: SectionStyle }> = [
  { name: "Intro", bars: 4, style: "intro" },
  { name: "Verse A", bars: 14, style: "verse" },
  { name: "Chorus A", bars: 14, style: "chorus" },
  { name: "Verse B", bars: 14, style: "verse" },
  { name: "Chorus B", bars: 14, style: "chorus" },
  { name: "Outro", bars: 4, style: "outro" },
];

interface LaneCursor {
  lane: number;
  /** Earliest beat this lane may host another note (enforces min spacing). */
  nextFreeBeat: number;
}

function laneCursor(lane: number): LaneCursor {
  return { lane, nextFreeBeat: 0 };
}

interface Ctx {
  rng: () => number;
  notes: MapNote[];
  cursors: LaneCursor[];
  minGapBeats: number;
}

function laneSpacing(density: number): number {
  switch (density) {
    case 1:
      return 2;
    case 2:
      return 1;
    case 3:
      return 0.75;
    default:
      return 0.5;
  }
}

function addNote(ctx: Ctx, beat: number, lane: number, kind: NoteKind = "normal"): void {
  const cursor = ctx.cursors[lane];
  if (!cursor) return;
  if (beat < cursor.nextFreeBeat) return; // would collide — skip
  cursor.nextFreeBeat = beat + ctx.minGapBeats;
  ctx.notes.push({ beat, lane: lane as Lane, kind });
}

/** A run of single notes stepping up/down lanes (DDR "stairs"). */
function emitStream(ctx: Ctx, startBeat: number, beats: number, step: number, kind: NoteKind): number {
  let beat = startBeat;
  let lane = Math.floor(ctx.rng() * 4);
  let dir = ctx.rng() < 0.5 ? 1 : -1;
  while (beat < startBeat + beats) {
    addNote(ctx, beat, lane, kind);
    if (ctx.rng() < 0.25) dir *= -1;
    lane = (lane + dir + 4) % 4;
    beat += step;
  }
  return beat;
}

/** Simultaneous two-lane notes ("chords"). */
function emitChord(ctx: Ctx, beat: number, kind: NoteKind = "normal"): void {
  const a = Math.floor(ctx.rng() * 4);
  const b = (a + 1 + Math.floor(ctx.rng() * 3)) % 4;
  addNote(ctx, beat, a, kind);
  addNote(ctx, beat, b, kind);
}

/** Same-lane rapid repeats ("jacks"). */
function emitJack(ctx: Ctx, startBeat: number, reps: number, step: number): void {
  const lane = Math.floor(ctx.rng() * 4);
  for (let i = 0; i < reps; i++) {
    addNote(ctx, startBeat + i * step, lane);
  }
}

function notesPerBar(style: SectionStyle, density: number, bar: number, rng: () => number): number {
  switch (style) {
    case "intro":
      return 1 + Math.floor(rng() * 2);
    case "verse":
      return density <= 2 ? 2 + Math.floor(rng() * 2) : 3 + Math.floor(rng() * 3);
    case "chorus":
      return density === 1 ? 4 : density === 2 ? 6 : density === 3 ? 9 : 12;
    case "outro":
      return bar % 2 === 0 ? 2 : 1;
    default:
      return 2;
  }
}

function pickPattern(
  ctx: Ctx,
  style: SectionStyle,
  barStartBeat: number,
  barIdx: number,
  density: number,
): void {
  const rng = ctx.rng;
  const roll = rng();
  const step8 = 0.5;
  const step16 = 0.25;

  if (style === "intro" || style === "outro") {
    emitStream(ctx, barStartBeat, 4, 1, "normal");
    if (rng() < 0.25) emitChord(ctx, barStartBeat + 2);
    return;
  }

  if (style === "chorus" && density >= 3) {
    if (roll < 0.4) emitStream(ctx, barStartBeat, 4, step16, "normal");
    else if (roll < 0.6) {
      emitChord(ctx, barStartBeat, "heavy");
      emitStream(ctx, barStartBeat + 0.5, 3, step16, "normal");
    } else if (roll < 0.75) emitJack(ctx, barStartBeat + 1, 3 + Math.floor(rng() * 3), step8);
    else if (roll < 0.9) emitStream(ctx, barStartBeat, 4, step16, "mini");
    else emitChord(ctx, barStartBeat + 1.5, "heavy");
    return;
  }

  if (style === "verse") {
    if (roll < 0.45) emitStream(ctx, barStartBeat, 4, step8, "normal");
    else if (roll < 0.6) emitChord(ctx, barStartBeat);
    else if (roll < 0.75) emitJack(ctx, barStartBeat, 2, 0.5);
    else emitStream(ctx, barStartBeat, 4, step8, rng() < 0.25 ? "mini" : "normal");
    return;
  }

  emitStream(ctx, barStartBeat, 4, 1, "normal");
}

/**
 * Generate a complete beat map for the given options.
 * Pure & deterministic: identical options ⇒ identical map.
 */
export function generateMap(options: GeneratorOptions): BeatMap {
  const rng = mulberry32(options.seed);
  const density = options.density;
  const approachBeats = options.approachBeats ?? 4;
  const offsetMs = options.offsetMs ?? 0;

  const sections: MapSection[] = [];
  let bar = 0;
  for (const plan of SECTION_PLAN) {
    sections.push({ name: plan.name, startBar: bar, endBar: bar + plan.bars, style: plan.style });
    bar += plan.bars;
  }
  const totalBars = bar;

  const ctx: Ctx = {
    rng,
    notes: [],
    cursors: [0, 1, 2, 3].map(laneCursor),
    minGapBeats: laneSpacing(density),
  };

  for (const section of sections) {
    const barBudget = notesPerBar(section.style, density, section.startBar, rng);
    void barBudget;
    for (let b = section.startBar; b < section.endBar; b++) {
      // Chorus sections occasionally get a heavier-than-normal bar.
      const budget = section.style === "chorus" && density >= 3 && rng() < 0.2
        ? notesPerBar(section.style, density, b, rng) + 4
        : notesPerBar(section.style, density, b, rng);
      const barStartBeat = b * BEATS_PER_BAR;
      let emitted = 0;
      let attempts = 0;
      while (emitted < budget && attempts < 8) {
        const before = ctx.notes.length;
        pickPattern(ctx, section.style, barStartBeat, b, density);
        attempts += 1;
        emitted += ctx.notes.length - before;
        if (ctx.notes.length - before === 0) break;
      }
    }
  }

  // Sort by beat then lane (stable, canonical ordering).
  ctx.notes.sort((a, b) => a.beat - b.beat || a.lane - b.lane);

  let map: BeatMap = {
    bpm: options.bpm,
    offsetMs,
    approachBeats,
    bars: totalBars,
    sections,
    notes: ctx.notes,
  };

  if (options.truncateBars !== undefined && options.truncateBars < totalBars) {
    const cut = options.truncateBars;
    map = {
      ...map,
      bars: cut,
      sections: map.sections.filter((s) => s.startBar < cut).map((s) => ({
        ...s,
        endBar: Math.min(s.endBar, cut),
      })),
      notes: map.notes.filter((n) => n.beat < cut * BEATS_PER_BAR),
    };
  }

  return map;
}

/** Build a full `BeatMap` with the standard song structure (60 bars + intro/outro). */
export function buildStandardMap(options: GeneratorOptions): BeatMap {
  return generateMap(options);
}

export type { MapNote };
