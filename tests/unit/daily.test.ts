import { describe, expect, it } from "vitest";
import {
  buildDailyDef,
  dailyDateFromSlug,
  dailySeed,
  dailySlug,
  dateKey,
  getDailyDef,
  isDailySlug,
  DAILY_BARS,
} from "@/game/levels/daily";
import { getLevelDef } from "@/game/levels/registry";

describe("daily challenge", () => {
  const d = new Date("2026-08-03T12:00:00.000Z");

  it("formats the UTC date key and slug", () => {
    expect(dateKey(d)).toBe("2026-08-03");
    expect(dailySlug(d)).toBe("daily-2026-08-03");
    expect(isDailySlug("daily-2026-08-03")).toBe(true);
    expect(isDailySlug("daily-nope")).toBe(false);
    expect(isDailySlug("first-beat")).toBe(false);
  });

  it("parses slugs back into dates", () => {
    const parsed = dailyDateFromSlug("daily-2026-08-03");
    expect(parsed?.toISOString().slice(0, 10)).toBe("2026-08-03");
    expect(dailyDateFromSlug("first-beat")).toBeNull();
    expect(dailyDateFromSlug("daily-9999-99-99")).toBeNull();
  });

  it("is deterministic: same date → identical map", () => {
    const a = buildDailyDef(new Date("2026-08-03T00:00:00Z"));
    const b = buildDailyDef(new Date("2026-08-03T23:59:59Z"));
    expect(a.map.notes).toEqual(b.map.notes);
  });

  it("differs across dates", () => {
    const a = buildDailyDef(new Date("2026-08-03T00:00:00Z"));
    const b = buildDailyDef(new Date("2026-08-04T00:00:00Z"));
    expect(a.map.notes).not.toEqual(b.map.notes);
    expect(dailySeed("2026-08-03")).not.toBe(dailySeed("2026-08-04"));
  });

  it("is a short, playable map", () => {
    const def = getDailyDef(d);
    expect(def.map.bars).toBe(DAILY_BARS);
    expect(def.map.notes.length).toBeGreaterThan(20);
    expect(def.difficulty).toBe("NORMAL");
  });

  it("resolves through the registry (integrity path works server-side)", () => {
    const viaRegistry = getLevelDef("daily-2026-08-03");
    expect(viaRegistry?.map.notes).toEqual(buildDailyDef(new Date("2026-08-03T00:00:00Z")).map.notes);
    // Unknown slugs stay unknown.
    expect(getLevelDef("nope")).toBeUndefined();
  });
});
