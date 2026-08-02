import { describe, expect, it } from "vitest";
import { BeatClock } from "@/game/core/BeatClock";

describe("BeatClock", () => {
  const makeClock = (bpm = 120, offsetMs = 0) => {
    let t = 0;
    const clock = new BeatClock({ bpm, offsetMs, now: () => t });
    const advance = (ms: number) => {
      t += ms;
    };
    clock.start();
    return { clock, advance, set: (ms: number) => (t = ms) };
  };

  it("converts beats to ms at the given BPM", () => {
    const { clock } = makeClock(120); // 500ms per beat
    expect(clock.beatMs).toBe(500);
    expect(clock.msForBeat(4)).toBe(2000);
    expect(clock.msForBeat(0)).toBe(0);
  });

  it("respects the song offset", () => {
    const { clock } = makeClock(120, 250);
    expect(clock.msForBeat(0)).toBe(250);
    expect(clock.msForBeat(2)).toBe(1250);
  });

  it("tracks elapsed time and pauses correctly", () => {
    const { clock, advance } = makeClock(120);
    advance(1000);
    expect(clock.elapsedMs()).toBe(1000);
    expect(clock.currentBeat()).toBe(2);

    clock.pause();
    advance(5000); // wall time passes while paused
    expect(clock.elapsedMs()).toBe(1000);

    clock.resume();
    advance(500);
    expect(clock.elapsedMs()).toBe(1500);
    expect(clock.currentBeat()).toBe(3);
  });

  it("returns 0 before start", () => {
    const clock = new BeatClock({ bpm: 120, now: () => 999 });
    expect(clock.elapsedMs()).toBe(0);
    expect(clock.currentBeat()).toBe(0);
  });

  it("double-pause is idempotent", () => {
    const { clock, advance } = makeClock(120);
    advance(100);
    clock.pause();
    advance(100);
    clock.pause(); // no-op
    advance(100);
    expect(clock.elapsedMs()).toBe(100);
    clock.resume();
    clock.resume(); // no-op
    advance(100);
    expect(clock.elapsedMs()).toBe(200);
  });
});
