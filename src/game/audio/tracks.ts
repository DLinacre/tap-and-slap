/**
 * Fight soundtrack registry — five original, procedurally generated tracks.
 *
 * IMPORTANT (licensing): every track here is an ORIGINAL composition that
 * evokes the *energy* of classic fight-music grooves (stadium anthems, crowd
 * stomp-chants, heavy riffs) — no licensed material is sampled or reproduced.
 * The one exception is "Ode to Joy" (Beethoven, 1824), which is public domain.
 *
 * Each track is a deterministic function of the level's beat map: drums,
 * bass, pads and lead are synthesized live by AudioEngine from these event
 * lists, so the music always lands exactly on the gameplay grid.
 */

import { BeatMap, LevelDef, MapSection, SectionStyle } from "../levels/types";

// ---------------------------------------------------------------------------
// Track registry
// ---------------------------------------------------------------------------

export const TRACKS = {
  titan: {
    id: "titan",
    name: "Titan Rising",
    tagline: "Stadium anthem — triumphant brass stabs & half-time thunder",
    style: "epic",
  },
  thunder: {
    id: "thunder",
    name: "Thunder Chant",
    tagline: "Stomp-stomp-clap crowd anthem — the one you already know",
    style: "stomp",
  },
  iron: {
    id: "iron",
    name: "Iron Riff",
    tagline: "Heavy power-riff war march — palm-muted 8th-note drive",
    style: "riff",
  },
  inferno: {
    id: "inferno",
    name: "Neon Inferno",
    tagline: "Four-on-the-floor disco war — offbeat hats & funky 16ths",
    style: "disco",
  },
  ode: {
    id: "ode",
    name: "Ode to Joy",
    tagline: "Beethoven's public-domain anthem — classical, remixed",
    style: "ode",
  },
} as const;

export type TrackId = keyof typeof TRACKS;
export const TRACK_LIST: Array<(typeof TRACKS)[TrackId]> = Object.values(TRACKS);
export const DEFAULT_TRACK: TrackId = "titan";

export function isTrackId(value: string | undefined | null): value is TrackId {
  return !!value && value in TRACKS;
}

/** Resolve a stored/level track id with a safe fallback. */
export function resolveTrackId(value: string | undefined | null): TrackId {
  return isTrackId(value) ? value : DEFAULT_TRACK;
}

// ---------------------------------------------------------------------------
// Song events
// ---------------------------------------------------------------------------

export type SongEventKind =
  | "kick"
  | "snare"
  | "clap"
  | "tom"
  | "hat"
  | "hatOpen"
  | "bass"
  | "lead"
  | "stab"
  | "padOn"
  | "padOff";

export interface SongEvent {
  timeMs: number;
  kind: SongEventKind;
  /** MIDI note number (for pitched events). */
  note?: number;
  velocity?: number;
  durationBeats?: number;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Chord progressions (MIDI roots). Am — F — C — G by default.
const PROGRESSION_ROOTS = [45, 41, 48, 43] as const;
const CHORD_TONES: Record<number, number[]> = {
  45: [45, 48, 52, 57, 60], // A minor
  41: [41, 44, 48, 53, 56], // F major
  48: [48, 52, 55, 60, 64], // C major
  43: [43, 47, 50, 55, 58], // G major
};

// Ode to Joy — simplified lead line, key of C, C4 = 60. Public domain.
// Sequence of [midi, durationInBeats] pairs (4/4).
const ODE_MELODY: Array<[number, number]> = [
  [64, 0.5], [64, 0.5], [65, 0.5], [67, 0.5],
  [67, 0.5], [65, 0.5], [64, 0.5], [62, 0.5],
  [60, 0.5], [60, 0.5], [62, 0.5], [64, 0.5],
  [64, 1], [62, 0.5], [62, 1.5],
  [64, 0.5], [64, 0.5], [65, 0.5], [67, 0.5],
  [67, 0.5], [65, 0.5], [64, 0.5], [62, 0.5],
  [60, 0.5], [60, 0.5], [62, 0.5], [64, 0.5],
  [62, 1], [60, 0.5], [60, 1.5],
];
const ODE_CHORDS: Array<[number, number, number, number]> = [
  [60, 67, 64, 55], // C/G
  [60, 67, 64, 55],
  [57, 65, 62, 55], // F/A
  [55, 62, 59, 48], // G/E
  [60, 67, 64, 55],
  [57, 65, 62, 55],
  [55, 62, 59, 48],
  [53, 60, 57, 48], // C/G
];

interface Ctx {
  rng: () => number;
  events: SongEvent[];
  map: BeatMap;
  beatMs: number;
  t: (bar: number, beatInBar: number) => number;
  isChorus: (section: SectionStyle) => boolean;
}

function makeCtx(map: BeatMap, seed: number): Ctx {
  let s = seed >>> 0;
  const rng = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
  const beatMs = 60_000 / map.bpm;
  return {
    rng,
    events: [],
    map,
    beatMs,
    t: (bar: number, beatInBar: number) => map.offsetMs + (bar * 4 + beatInBar) * beatMs,
    isChorus: (style: SectionStyle) => style === "chorus",
  };
}

function ev(ctx: Ctx, kind: SongEventKind, bar: number, beatInBar: number, extra: Partial<SongEvent> = {}): void {
  ctx.events.push({ timeMs: ctx.t(bar, beatInBar), kind, ...extra });
}

// ---------------------------------------------------------------------------
// Per-track rhythm & arrangement
// ---------------------------------------------------------------------------

interface TrackWriter {
  drums(ctx: Ctx, bar: number, style: SectionStyle): void;
  bass(ctx: Ctx, bar: number, root: number, style: SectionStyle): void;
  lead(ctx: Ctx, bar: number, root: number, tones: number[], style: SectionStyle): void;
  pads(ctx: Ctx, bar: number, root: number, style: SectionStyle): void;
}

/** Titan Rising — half-time epic: big toms, snare on 3, triumphant stabs. */
const titan: TrackWriter = {
  drums(ctx, bar, style) {
    const chorus = ctx.isChorus(style);
    if (style === "intro") {
      ev(ctx, "kick", bar, 0, { velocity: 0.7 });
      ev(ctx, "kick", bar, 2.5, { velocity: 0.7 });
      return;
    }
    ev(ctx, "kick", bar, 0, { velocity: 1 });
    ev(ctx, "kick", bar, 2, { velocity: 0.95 });
    ev(ctx, "tom", bar, 3.5, { velocity: 0.85 });
    ev(ctx, "snare", bar, 1, { velocity: chorus ? 1 : 0.9 });
    ev(ctx, "snare", bar, 3, { velocity: chorus ? 1 : 0.9 });
    ev(ctx, "hat", bar, 0.5, { velocity: 0.35 });
    ev(ctx, "hat", bar, 1.5, { velocity: 0.35 });
    ev(ctx, "hat", bar, 2.5, { velocity: 0.35 });
    ev(ctx, "hat", bar, 3.5, { velocity: 0.3 });
    if (chorus) {
      ev(ctx, "hatOpen", bar, 3.75, { velocity: 0.4 });
      if (bar % 2 === 1) {
        ev(ctx, "tom", bar, 3, { velocity: 0.7 });
        ev(ctx, "tom", bar, 3.25, { velocity: 0.7 });
      }
    }
  },
  bass(ctx, bar, root, style) {
    if (style === "intro") return;
    const chorus = ctx.isChorus(style);
    ev(ctx, "bass", bar, 0, { note: root - 12, velocity: chorus ? 0.95 : 0.8 });
    ev(ctx, "bass", bar, 2, { note: root - 12, velocity: chorus ? 0.95 : 0.8 });
    ev(ctx, "bass", bar, 3, { note: root - 12 + 12, velocity: 0.5 });
  },
  lead(ctx, bar, root, tones, style) {
    if (style === "intro" || style === "outro") return;
    const chorus = ctx.isChorus(style);
    if (chorus) {
      for (const off of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) {
        if (ctx.rng() < 0.85) {
          const tone = tones[Math.floor(ctx.rng() * tones.length)]!;
          ev(ctx, "lead", bar, off, { note: root + 12 + tone, velocity: 0.55 + ctx.rng() * 0.3 });
        }
      }
      if (bar % 2 === 1) ev(ctx, "stab", bar, 2.5, { note: root + 24, velocity: 0.8 });
    } else if (bar % 2 === 0) {
      for (const off of [0, 0.75, 2, 2.75]) {
        const tone = tones[Math.floor(ctx.rng() * tones.length)]!;
        ev(ctx, "lead", bar, off, { note: root + 12 + tone, velocity: 0.4 });
      }
    }
  },
  pads(ctx, bar, root, style) {
    if (style !== "verse" && style !== "chorus") return;
    ev(ctx, "padOn", bar, 0, { note: root, velocity: 0.8 });
    ev(ctx, "padOff", bar, 4);
  },
};

/** Thunder Chant — the stomp-stomp-clap everyone knows. */
const thunder: TrackWriter = {
  drums(ctx, bar, style) {
    if (style === "intro") {
      ev(ctx, "kick", bar, 0, { velocity: 0.8 });
      ev(ctx, "kick", bar, 1, { velocity: 0.8 });
      ev(ctx, "clap", bar, 2, { velocity: 0.6 });
      return;
    }
    const chorus = ctx.isChorus(style);
    // stomp stomp clap, stomp stomp clap…
    ev(ctx, "kick", bar, 0, { velocity: 1 });
    ev(ctx, "kick", bar, 1, { velocity: 1 });
    ev(ctx, "clap", bar, 2, { velocity: 1 });
    ev(ctx, "kick", bar, 3, { velocity: chorus ? 0.9 : 0.55 });
    ev(ctx, "snare", bar, 3.5, { velocity: chorus ? 0.6 : 0.35 });
    if (chorus) {
      ev(ctx, "kick", bar, 2.5, { velocity: 0.5 }); // crowd surge
      ev(ctx, "clap", bar, 3.75, { velocity: 0.45 });
      ev(ctx, "hatOpen", bar, 3.5, { velocity: 0.35 });
    }
  },
  bass(ctx, bar, root, style) {
    if (style === "intro") return;
    const chorus = ctx.isChorus(style);
    for (const off of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) {
      ev(ctx, "bass", bar, off, {
        note: root - 12 + (off % 2 === 0 ? 0 : 12),
        velocity: chorus ? 0.9 : 0.65,
      });
    }
  },
  lead(ctx, bar, root, tones, style) {
    if (style === "intro" || style === "outro") return;
    const chorus = ctx.isChorus(style);
    // Chant-like unison motif: octave jumps on the root.
    const motif = [0, 12, 0, 7, 0, 12, 7, 12];
    if (chorus) {
      for (const [i, t] of motif.entries()) {
        ev(ctx, "lead", bar, i * 0.5, { note: root + t, velocity: 0.6 });
      }
      ev(ctx, "stab", bar, 2, { note: root + 12, velocity: 0.85 });
      ev(ctx, "stab", bar, 3, { note: root + 12, velocity: 0.85 });
    } else if (bar % 2 === 0) {
      ev(ctx, "lead", bar, 0, { note: root, velocity: 0.45 });
      ev(ctx, "lead", bar, 1, { note: root + 12, velocity: 0.45 });
      ev(ctx, "lead", bar, 2, { note: root + 7, velocity: 0.45 });
    }
  },
  pads(ctx, bar, root, style) {
    if (style !== "verse" && style !== "chorus") return;
    ev(ctx, "padOn", bar, 0, { note: root, velocity: 0.65 });
    ev(ctx, "padOff", bar, 4);
  },
};

/** Iron Riff — heavy palm-muted power riff, four-on-floor war march. */
const iron: TrackWriter = {
  drums(ctx, bar, style) {
    const chorus = ctx.isChorus(style);
    if (style === "intro") {
      ev(ctx, "kick", bar, 0, { velocity: 0.7 });
      ev(ctx, "kick", bar, 2, { velocity: 0.7 });
      return;
    }
    for (const b of [0, 1, 2, 3]) ev(ctx, "kick", bar, b, { velocity: 1 });
    ev(ctx, "snare", bar, 1, { velocity: 1 });
    ev(ctx, "snare", bar, 3, { velocity: 1 });
    for (const o of [0.5, 1.5, 2.5, 3.5]) ev(ctx, "hat", bar, o, { velocity: 0.45 });
    if (chorus) {
      ev(ctx, "hat", bar, 0.25, { velocity: 0.4 });
      ev(ctx, "hat", bar, 0.75, { velocity: 0.4 });
      ev(ctx, "hat", bar, 1.25, { velocity: 0.4 });
      ev(ctx, "hat", bar, 1.75, { velocity: 0.4 });
      ev(ctx, "hat", bar, 2.25, { velocity: 0.4 });
      ev(ctx, "hat", bar, 2.75, { velocity: 0.4 });
      ev(ctx, "hat", bar, 3.25, { velocity: 0.4 });
      ev(ctx, "hat", bar, 3.75, { velocity: 0.4 });
    }
  },
  bass(ctx, bar, root, style) {
    if (style === "intro") return;
    const chorus = ctx.isChorus(style);
    const vel = chorus ? 0.95 : 0.75;
    // Palm-muted power riff: root-fifth alternation on 8ths with a rest snap.
    const riff = [0, 0, 12, 0, 0, 12, 0, 0, 0, 12, 0, 12, 0, 0, 12, 0];
    if (chorus) {
      for (const [i, t] of riff.entries()) {
        ev(ctx, "bass", bar, i * 0.25, { note: root - 12 + t, velocity: vel * (i % 4 === 2 ? 1.1 : 1) });
      }
    } else {
      for (const [i, t] of riff.slice(0, 8).entries()) {
        ev(ctx, "bass", bar, i * 0.5, { note: root - 12 + t, velocity: vel });
      }
    }
  },
  lead(ctx, bar, root, tones, style) {
    if (style === "intro" || style === "outro") return;
    const chorus = ctx.isChorus(style);
    if (chorus) {
      for (const [i, t] of [0, 5, 7, 5, 0, 5, 7, 12].entries()) {
        ev(ctx, "lead", bar, i * 0.5, { note: root + 12 + t, velocity: 0.5 });
      }
      ev(ctx, "stab", bar, 0, { note: root + 24, velocity: 0.9 });
      ev(ctx, "stab", bar, 2, { note: root + 24, velocity: 0.9 });
    } else if (bar % 2 === 0) {
      ev(ctx, "lead", bar, 0, { note: root + 12, velocity: 0.4 });
      ev(ctx, "lead", bar, 2, { note: root + 19, velocity: 0.4 });
    }
  },
  pads(ctx, bar, root, style) {
    if (style !== "chorus") return;
    ev(ctx, "padOn", bar, 0, { note: root, velocity: 0.5 });
    ev(ctx, "padOff", bar, 4);
  },
};

/** Neon Inferno — four-on-the-floor disco war: offbeat hats, funky 16ths. */
const inferno: TrackWriter = {
  drums(ctx, bar, style) {
    const chorus = ctx.isChorus(style);
    if (style === "intro") {
      ev(ctx, "kick", bar, 0, { velocity: 0.8 });
      ev(ctx, "kick", bar, 2, { velocity: 0.8 });
      ev(ctx, "hat", bar, 2.5, { velocity: 0.3 });
      return;
    }
    for (const b of [0, 1, 2, 3]) ev(ctx, "kick", bar, b, { velocity: 1 });
    ev(ctx, "snare", bar, 1, { velocity: 0.9 });
    ev(ctx, "snare", bar, 3, { velocity: 0.9 });
    for (const o of [0.5, 1.5, 2.5, 3.5]) ev(ctx, "hat", bar, o, { velocity: 0.6 });
    if (chorus) {
      for (const o of [0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75]) {
        ev(ctx, "hat", bar, o, { velocity: 0.35 });
      }
      ev(ctx, "hatOpen", bar, 3.5, { velocity: 0.5 });
      ev(ctx, "clap", bar, 2.5, { velocity: 0.5 });
    }
  },
  bass(ctx, bar, root, style) {
    if (style === "intro") return;
    const chorus = ctx.isChorus(style);
    const pattern = [0, 0, 12, 0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 12, 12, 0];
    for (const [i, t] of pattern.entries()) {
      ev(ctx, "bass", bar, i * 0.25, {
        note: root - 12 + t,
        velocity: chorus ? 0.9 : 0.7,
      });
    }
  },
  lead(ctx, bar, root, tones, style) {
    if (style === "intro" || style === "outro") return;
    const chorus = ctx.isChorus(style);
    if (chorus) {
      for (const o of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) {
        if (ctx.rng() < 0.9) {
          const tone = tones[Math.floor(ctx.rng() * tones.length)]!;
          ev(ctx, "lead", bar, o, { note: root + 12 + tone, velocity: 0.5 + ctx.rng() * 0.3 });
        }
      }
      ev(ctx, "stab", bar, 1.5, { note: root + 24, velocity: 0.7 });
      ev(ctx, "stab", bar, 3.5, { note: root + 24, velocity: 0.7 });
    } else if (bar % 2 === 0) {
      for (const o of [0, 0.5, 1, 2, 2.5, 3]) {
        const tone = tones[Math.floor(ctx.rng() * tones.length)]!;
        ev(ctx, "lead", bar, o, { note: root + 12 + tone, velocity: 0.35 });
      }
    }
  },
  pads(ctx, bar, root, style) {
    if (style !== "verse" && style !== "chorus") return;
    ev(ctx, "padOn", bar, 0, { note: root, velocity: 0.7 });
    ev(ctx, "padOff", bar, 4);
  },
};

/** Ode to Joy — public-domain Beethoven melody over a modern groove. */
const ode: TrackWriter = {
  drums(ctx, bar, style) {
    if (style === "intro") {
      ev(ctx, "kick", bar, 0, { velocity: 0.7 });
      return;
    }
    for (const b of [0, 1, 2, 3]) ev(ctx, "kick", bar, b, { velocity: style === "outro" ? 0.6 : 0.9 });
    ev(ctx, "snare", bar, 1, { velocity: 0.8 });
    ev(ctx, "snare", bar, 3, { velocity: 0.8 });
    for (const o of [0.5, 1.5, 2.5, 3.5]) ev(ctx, "hat", bar, o, { velocity: 0.45 });
    if (ctx.isChorus(style)) ev(ctx, "hatOpen", bar, 3.5, { velocity: 0.45 });
  },
  bass(ctx, bar, root, style) {
    if (style === "intro") return;
    ev(ctx, "bass", bar, 0, { note: root - 12, velocity: 0.85 });
    ev(ctx, "bass", bar, 2, { note: root - 12, velocity: 0.7 });
    ev(ctx, "bass", bar, 3, { note: root - 12 + 12, velocity: 0.45 });
  },
  lead(ctx, bar, root, _tones, style) {
    if (style === "intro" || style === "outro") return;
    // One phrase per bar, cycling through the 8-bar melody.
    const phrase = bar % 8;
    const start = phrase * 4; // 4 beats of melody per bar
    let beat = 0;
    for (let i = start; i < Math.min(start + 4, ODE_MELODY.length); i++) {
      const [midi, dur] = ODE_MELODY[i]!;
      ev(ctx, "lead", bar, beat, {
        note: midi + 12, // up an octave, bright
        velocity: 0.55,
        durationBeats: dur,
      });
      beat += dur;
    }
  },
  pads(ctx, bar, root, style) {
    if (style === "intro" || style === "outro") return;
    const [c1, c2, c3, c4] = ODE_CHORDS[bar % ODE_CHORDS.length]!;
    for (const note of [c1, c2, c3, c4]) {
      ev(ctx, "padOn", bar, 0, { note: note - 12, velocity: 0.4 });
      ev(ctx, "padOff", bar, 4);
    }
    void root;
  },
};

const WRITERS: Record<TrackId, TrackWriter> = { titan, thunder, iron, inferno, ode };

// ---------------------------------------------------------------------------
// Song builder
// ---------------------------------------------------------------------------

/**
 * Build the complete song event list for a level + track.
 * Deterministic: same (level, track) ⇒ identical events (unit-tested).
 */
export function buildSong(level: LevelDef, trackId: TrackId = DEFAULT_TRACK): SongEvent[] {
  const map: BeatMap = level.map;
  const writer = WRITERS[trackId];
  const ctx = makeCtx(map, level.seed + trackId.length * 7919);

  for (const section of map.sections) {
    for (let bar = section.startBar; bar < section.endBar; bar++) {
      const root = PROGRESSION_ROOTS[bar % PROGRESSION_ROOTS.length]!;
      const tones = CHORD_TONES[root]!;
      writer.drums(ctx, bar, section.style);
      writer.bass(ctx, bar, root, section.style);
      writer.lead(ctx, bar, root, tones, section.style);
      writer.pads(ctx, bar, root, section.style);
    }
  }

  ctx.events.sort((a, b) => a.timeMs - b.timeMs);
  return ctx.events;
}

/** Minimal 4-bar map used for menu previews. */
export function previewMap(bpm: number): BeatMap {
  const section: MapSection = { name: "Preview", startBar: 0, endBar: 4, style: "verse" };
  return {
    bpm,
    offsetMs: 0,
    approachBeats: 1,
    bars: 4,
    sections: [section],
    notes: [],
  };
}
