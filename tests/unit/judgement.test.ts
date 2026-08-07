import { describe, expect, it } from "vitest";
import { isWithinWindow, judgeNote, accuracyWeight } from "@/game/core/Judgement";
import { JUDGMENT_WINDOWS } from "@/game/config";

describe("judgeNote", () => {
  const noteTime = 10_000;
  const { perfectMs, greatMs, goodMs } = JUDGMENT_WINDOWS;

  it("perfect within ±45ms", () => {
    expect(judgeNote(noteTime, noteTime).type).toBe("perfect");
    expect(judgeNote(noteTime, noteTime + perfectMs).type).toBe("perfect");
    expect(judgeNote(noteTime, noteTime - perfectMs).type).toBe("perfect");
    expect(judgeNote(noteTime, noteTime + perfectMs).deltaMs).toBe(perfectMs);
  });

  it("great within ±90ms", () => {
    expect(judgeNote(noteTime, noteTime + perfectMs + 1).type).toBe("great");
    expect(judgeNote(noteTime, noteTime - greatMs).type).toBe("great");
  });

  it(`good within ±${goodMs}ms`, () => {
    expect(judgeNote(noteTime, noteTime + greatMs + 1).type).toBe("good");
    expect(judgeNote(noteTime, noteTime + goodMs).type).toBe("good");
  });

  it(`miss beyond ${goodMs}ms`, () => {
    expect(judgeNote(noteTime, noteTime + goodMs + 1).type).toBe("miss");
    expect(judgeNote(noteTime, noteTime - 200).type).toBe("miss");
  });

  it("custom windows are respected", () => {
    const windows = { perfectMs: 10, greatMs: 20, goodMs: 30 };
    expect(judgeNote(noteTime, noteTime + 15, windows).type).toBe("great");
    expect(judgeNote(noteTime, noteTime + 25, windows).type).toBe("good");
  });
});

describe("isWithinWindow", () => {
  it("true only inside the good window", () => {
    const { goodMs } = JUDGMENT_WINDOWS;
    expect(isWithinWindow(1000, 1000 + goodMs - 1)).toBe(true);
    expect(isWithinWindow(1000, 1000 + goodMs + 1)).toBe(false);
    expect(isWithinWindow(1000, 1000 - goodMs - 1)).toBe(false);
  });
});

describe("accuracyWeight", () => {
  it("weights judgments DDR-style", () => {
    expect(accuracyWeight("perfect")).toBe(1);
    expect(accuracyWeight("great")).toBe(0.7);
    expect(accuracyWeight("good")).toBe(0.4);
    expect(accuracyWeight("miss")).toBe(0);
  });
});
