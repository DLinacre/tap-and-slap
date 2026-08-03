import { describe, expect, it } from "vitest";
import { generateMap, mulberry32 } from "@/game/levels/generator";
import { getLevelDef, getLevelMetas } from "@/game/levels/registry";
import { baseScoreFor, expectedMaxScore } from "@/game/levels/types";
import { buildSong } from "@/game/audio/tracks";
import { TRACK_LIST } from "@/game/audio/tracks";

describe("map generator", () => {
  it("is deterministic for the same seed", () => {
    const a = generateMap({ seed: 4242, bpm: 112, density: 2 });
    const b = generateMap({ seed: 4242, bpm: 112, density: 2 });
    expect(a.notes).toEqual(b.notes);
    expect(a.sections).toEqual(b.sections);
  });

  it("differs across seeds", () => {
    const a = generateMap({ seed: 1, bpm: 112, density: 2 });
    const b = generateMap({ seed: 2, bpm: 112, density: 2 });
    expect(a.notes).not.toEqual(b.notes);
  });

  it("produces more notes at higher density", () => {
    const sparse = generateMap({ seed: 7, bpm: 100, density: 1 });
    const dense = generateMap({ seed: 7, bpm: 100, density: 3 });
    expect(dense.notes.length).toBeGreaterThan(sparse.notes.length * 2);
  });

  it("keeps notes inside the map bounds", () => {
    for (const density of [1, 2, 3] as const) {
      const map = generateMap({ seed: 99 + density, bpm: 120, density });
      const totalBeats = map.bars * 4;
      for (const note of map.notes) {
        expect(note.beat).toBeGreaterThanOrEqual(0);
        expect(note.beat).toBeLessThan(totalBeats);
        expect(note.lane).toBeGreaterThanOrEqual(0);
        expect(note.lane).toBeLessThan(4);
      }
    }
  });

  it("enforces minimum per-lane spacing", () => {
    const map = generateMap({ seed: 1234, bpm: 132, density: 3 });
    const byLane = [0, 1, 2, 3].map((lane) =>
      map.notes.filter((n) => n.lane === lane).map((n) => n.beat),
    );
    for (const beats of byLane) {
      for (let i = 1; i < beats.length; i++) {
        // minGap for density 3 is 0.75 beats
        expect(beats[i]! - beats[i - 1]!).toBeGreaterThanOrEqual(0.75 - 1e-9);
      }
    }
  });

  it("sorts notes canonically by beat then lane", () => {
    const map = generateMap({ seed: 5, bpm: 90, density: 1 });
    for (let i = 1; i < map.notes.length; i++) {
      const prev = map.notes[i - 1]!;
      const cur = map.notes[i]!;
      expect(cur.beat > prev.beat || (cur.beat === prev.beat && cur.lane > prev.lane)).toBe(true);
    }
  });

  it("truncation keeps only the requested bars", () => {
    const map = generateMap({ seed: 5, bpm: 90, density: 2, truncateBars: 8 });
    expect(map.bars).toBe(8);
    for (const note of map.notes) expect(note.beat).toBeLessThan(8 * 4);
    // Sections are clamped to the cut.
    expect(map.sections.every((s) => s.startBar < 8)).toBe(true);
  });
});

describe("mulberry32", () => {
  it("is deterministic and bounded", () => {
    const rng = mulberry32(42);
    const seq = Array.from({ length: 100 }, () => rng());
    expect(seq.every((v) => v >= 0 && v < 1)).toBe(true);
    const rng2 = mulberry32(42);
    expect(Array.from({ length: 100 }, () => rng2())).toEqual(seq);
  });
});

describe("built-in registry", () => {
  it("exposes the daily challenge plus three built-in levels", () => {
    const metas = getLevelMetas();
    expect(metas).toHaveLength(4);
    expect(metas[0]!.slug).toMatch(/^daily-\d{4}-\d{2}-\d{2}$/);
    expect(metas.slice(1).map((m) => m.slug)).toEqual([
      "first-beat",
      "neon-rampage",
      "disco-inferno",
    ]);
    for (const meta of metas) {
      expect(meta.noteCount).toBeGreaterThan(20);
      expect(meta.durationSec).toBeGreaterThan(30);
    }
  });

  it("level defs are consistent with their metas", () => {
    for (const meta of getLevelMetas()) {
      const def = getLevelDef(meta.slug)!;
      expect(def.map.notes.length).toBe(meta.noteCount);
      expect(expectedMaxScore(def)).toBeGreaterThan(0);
      expect(def.map.bars).toBe(meta.bars);
    }
  });

  it("heavy and mini notes carry distinct base scores", () => {
    expect(baseScoreFor("normal")).toBe(100);
    expect(baseScoreFor("heavy")).toBe(150);
    expect(baseScoreFor("mini")).toBe(50);
  });

  it("qa truncation produces short maps", () => {
    const def = getLevelDef("first-beat", { truncateBars: 8 })!;
    expect(def.map.bars).toBe(8);
  });
});

describe("song builder — fight soundtrack", () => {
  it("is deterministic and dense enough to dance to", () => {
    const def = getLevelDef("neon-rampage")!;
    const song = buildSong(def);
    const song2 = buildSong(def);
    expect(song).toEqual(song2);
    expect(song.length).toBeGreaterThan(500);

    const kinds = new Set(song.map((e) => e.kind));
    for (const expected of ["kick", "snare", "hat", "bass", "lead", "padOn"] as const) {
      expect(kinds.has(expected)).toBe(true);
    }

    // Events sorted & non-negative.
    for (let i = 1; i < song.length; i++) {
      expect(song[i]!.timeMs).toBeGreaterThanOrEqual(song[i - 1]!.timeMs);
    }
    expect(song[0]!.timeMs).toBeGreaterThanOrEqual(0);
  });

  it("every registered track produces a full, distinct arrangement", () => {
    const def = getLevelDef("disco-inferno")!;
    const signatures = new Map<string, string>();
    for (const track of TRACK_LIST) {
      const song = buildSong(def, track.id);
      expect(song.length).toBeGreaterThan(400);
      // Signature = ordered kinds — different tracks must differ.
      signatures.set(track.id, song.map((e) => e.kind).join(","));
      expect(song.length).toBe(song.length);
    }
    expect(new Set(signatures.values()).size).toBe(TRACK_LIST.length);
  });

  it("thunder track features the iconic stomp-stomp-clap", () => {
    const def = getLevelDef("first-beat")!;
    const song = buildSong(def, "thunder");
    const claps = song.filter((e) => e.kind === "clap");
    expect(claps.length).toBeGreaterThan(10);
    // Pattern check: within a bar, clap lands on beat 2 (halfway through the bar).
    const beatMs = 60_000 / def.map.bpm;
    const firstClap = claps[0]!;
    const barStart = Math.floor(firstClap.timeMs / (4 * beatMs));
    expect(firstClap.timeMs - barStart * 4 * beatMs).toBeCloseTo(2 * beatMs, 4);
  });

  it("ode track plays the public-domain Beethoven melody", () => {
    const def = getLevelDef("first-beat")!;
    const song = buildSong(def, "ode");
    const leads = song.filter((e) => e.kind === "lead");
    expect(leads.length).toBeGreaterThan(50);
    // First melody note: E5 (64 + 12 = 76).
    expect(leads[0]!.note).toBe(76);
    expect(leads[0]!.durationBeats).toBe(0.5);
  });

  it("is deterministic per track (same track, same events)", () => {
    const def = getLevelDef("neon-rampage")!;
    for (const track of TRACK_LIST) {
      expect(buildSong(def, track.id)).toEqual(buildSong(def, track.id));
    }
  });

  it("covers the whole map duration", () => {
    const def = getLevelDef("disco-inferno")!;
    const song = buildSong(def);
    const lastBeatMs = def.map.offsetMs + def.map.bars * 4 * (60_000 / def.map.bpm);
    const lastEvent = song[song.length - 1]!;
    expect(lastEvent.timeMs).toBeGreaterThan(lastBeatMs - 4 * (60_000 / def.map.bpm));
  });
});
