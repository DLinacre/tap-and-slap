import { describe, expect, it } from "vitest";
import { isWithinWindow, judgeNote, accuracyWeight } from "@/game/core/Judgement";

describe("judgeNote", () => {
  const noteTime = 10_000;

  it("perfect within ±45ms", () => {
    expect(judgeNote(noteTime, noteTime).type).toBe("perfect");
    expect(judgeNote(noteTime, noteTime + 45).type).toBe("perfect");
    expect(judgeNote(noteTime, noteTime - 45).type).toBe("perfect");
    expect(judgeNote(noteTime, noteTime + 45).deltaMs).toBe(45);
  });

  it("great within ±90ms", () => {
    expect(judgeNote(noteTime, noteTime + 46).type).toBe("great");
    expect(judgeNote(noteTime, noteTime - 90).type).toBe("great");
  });

  it("good within ±135ms", () => {
    expect(judgeNote(noteTime, noteTime + 91).type).toBe("good");
    expect(judgeNote(noteTime, noteTime + 135).type).toBe("good");
  });

  it("miss beyond 135ms", () => {
    expect(judgeNote(noteTime, noteTime + 136).type).toBe("miss");
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
    expect(isWithinWindow(1000, 1100)).toBe(true); // +100 ≤ 135
    expect(isWithinWindow(1000, 1140)).toBe(false); // +140 > 135
    expect(isWithinWindow(1000, 860)).toBe(false);
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
