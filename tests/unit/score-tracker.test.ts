import { describe, expect, it } from "vitest";
import { ScoreTracker } from "@/game/core/ScoreTracker";

describe("ScoreTracker", () => {
  it("starts at zero with full health", () => {
    const t = new ScoreTracker();
    const s = t.summary();
    expect(s.score).toBe(0);
    expect(s.combo).toBe(0);
    expect(s.health).toBe(100);
    expect(s.accuracy).toBe(0);
  });

  it("scores perfect hits with the combo multiplier", () => {
    const t = new ScoreTracker();
    t.apply("perfect", 100); // mult 1 (combo 0 → 1)
    expect(t.score).toBe(100);
    expect(t.combo).toBe(1);
    expect(t.multiplier()).toBe(1);

    // The multiplier uses the combo *before* the hit lands:
    // hits 1–10 all score at ×1 (combo before hit = 0..9), then ×2 kicks in.
    for (let i = 0; i < 9; i++) t.apply("perfect", 100);
    expect(t.combo).toBe(10);
    expect(t.multiplier()).toBe(2);
    expect(t.score).toBe(10 * 100);

    // 11th hit lands at ×2.
    t.apply("perfect", 100);
    expect(t.score).toBe(10 * 100 + 200);
  });

  it("caps the multiplier", () => {
    const t = new ScoreTracker({ multiplierCap: 8, comboStep: 10 });
    for (let i = 0; i < 200; i++) t.apply("perfect", 100);
    expect(t.multiplier()).toBe(8);
  });

  it("weights great and good hits", () => {
    const t = new ScoreTracker();
    const great = t.apply("great", 100); // 100 * 0.7 * 1
    expect(great).toBe(70);
    const good = t.apply("good", 100); // 100 * 0.4 * 1
    expect(good).toBe(40);
  });

  it("miss resets combo, costs health and scores nothing", () => {
    const t = new ScoreTracker();
    t.apply("perfect", 100);
    t.apply("perfect", 100);
    const gained = t.apply("miss", 100);
    expect(gained).toBe(0);
    expect(t.combo).toBe(0);
    // Perfects heal +2 each but health is capped at 100, so the miss costs 12.
    expect(t.health).toBe(100 - 12);
  });

  it("health clamps to 0 (death)", () => {
    const t = new ScoreTracker({ missHealthCost: 12 });
    for (let i = 0; i < 10; i++) t.apply("miss", 100);
    expect(t.health).toBe(0);
    expect(t.isDead()).toBe(true);
  });

  it("health caps at max", () => {
    const t = new ScoreTracker({ maxHealth: 100 });
    for (let i = 0; i < 60; i++) t.apply("perfect", 100);
    expect(t.health).toBe(100);
  });

  it("computes weighted accuracy", () => {
    const t = new ScoreTracker();
    t.apply("perfect", 100);
    t.apply("perfect", 100);
    t.apply("great", 100);
    t.apply("good", 100);
    t.apply("miss", 100);
    // (2 + 0.7 + 0.4) / 5 = 0.62
    expect(t.accuracy()).toBeCloseTo(62, 5);
  });

  it("tracks max combo", () => {
    const t = new ScoreTracker();
    for (let i = 0; i < 5; i++) t.apply("perfect", 100);
    t.apply("miss", 100);
    for (let i = 0; i < 3; i++) t.apply("great", 100);
    expect(t.maxCombo).toBe(5);
    expect(t.combo).toBe(3);
  });
});
