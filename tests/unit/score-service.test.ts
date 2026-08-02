import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import {
  validateScoreIntegrity,
  recordScore,
  ScoreRepo,
} from "@/lib/services/score-service";
import { getLevelDef } from "@/game/levels/registry";
import { ScoreSubmitInput } from "@/lib/validation/schemas";

const levelDef = getLevelDef("neon-rampage")!;
const NOTE_COUNT = levelDef.map.notes.length;
const MAX_POSSIBLE = levelDef.map.notes.reduce((acc, n) => acc + (n.kind === "heavy" ? 150 : n.kind === "mini" ? 50 : 100), 0) * 8;

function validRun(overrides: Partial<ScoreSubmitInput> = {}): ScoreSubmitInput {
  const perfects = Math.floor(NOTE_COUNT * 0.9);
  const greats = Math.floor(NOTE_COUNT * 0.06);
  const goods = Math.floor(NOTE_COUNT * 0.03);
  const misses = NOTE_COUNT - perfects - greats - goods;
  const accuracy = ((perfects + 0.7 * greats + 0.4 * goods) / NOTE_COUNT) * 100;
  return {
    levelSlug: "neon-rampage",
    difficulty: "NORMAL",
    score: Math.round((perfects + 0.7 * greats + 0.4 * goods) * 100 * 8),
    maxCombo: Math.floor(NOTE_COUNT * 0.8),
    perfects,
    greats,
    goods,
    misses,
    accuracy: Number(accuracy.toFixed(2)),
    durationMs: Math.round((levelDef.map.offsetMs + levelDef.map.bars * 4 * (60_000 / levelDef.map.bpm)) * 0.95),
    guestId: "2f4a1c80-0000-4000-8000-000000000001",
    autoplay: false,
    ...overrides,
  };
}

class FakeRepo implements ScoreRepo {
  runs: Array<Record<string, unknown>> = [];
  better = 0;
  best: number | null = null;
  existingByRunId: Record<string, Parameters<ScoreRepo["findRunByRunId"]> extends never ? never : any> = {};

  async createRun(data: Parameters<ScoreRepo["createRun"]>[0]): Promise<{ id: string }> {
    this.runs.push(data);
    const id = "run-" + (this.runs.length);
    if (data.runId) {
      this.existingByRunId[data.runId] = {
        id,
        userId: null,
        guestId: data.guestId ?? null,
        levelId: data.levelId,
        score: data.score,
        maxCombo: data.maxCombo,
        accuracy: data.accuracy,
        difficulty: data.difficulty,
        createdAt: new Date(),
        autoplay: data.autoplay,
      };
    }
    return { id };
  }
  async countBetter(): Promise<number> {
    return this.better;
  }
  async bestScoreFor(): Promise<number | null> {
    return this.best;
  }
  async leaderboard(): Promise<never[]> {
    return [];
  }
  async findRunByRunId(runId: string) {
    return this.existingByRunId[runId] ?? null;
  }
}

const deps = (repo: FakeRepo) => ({
  repo,
  findLevelId: async (slug: string) => (slug === "neon-rampage" ? "level-1" : null),
});

describe("validateScoreIntegrity", () => {
  it("accepts an internally consistent run", () => {
    const result = validateScoreIntegrity(validRun(), levelDef);
    expect(result.ok).toBe(true);
  });

  it("rejects judgment counts that don't sum to the note count", () => {
    const run = validRun({ misses: 0 }); // now total < NOTE_COUNT
    const result = validateScoreIntegrity(run, levelDef);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("judgment_count_mismatch");
  });

  it("rejects scores above the theoretical maximum", () => {
    const result = validateScoreIntegrity(validRun({ score: MAX_POSSIBLE + 1 }), levelDef);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("exceeds_max_possible");
  });

  it("rejects zero-score runs", () => {
    const run = validRun({ score: 0, perfects: 0, greats: 0, goods: 0, misses: NOTE_COUNT, accuracy: 0, maxCombo: 0 });
    expect(validateScoreIntegrity(run, levelDef).ok).toBe(false);
  });

  it("rejects accuracy inconsistent with the counts", () => {
    const run = validRun({ accuracy: 10 });
    const result = validateScoreIntegrity(run, levelDef);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("accuracy_inconsistent");
  });

  it("rejects impossibly fast completions", () => {
    const run = validRun({ durationMs: 1_000 });
    expect(validateScoreIntegrity(run, levelDef).ok).toBe(false);
  });

  it("rejects maxCombo beyond the note count", () => {
    const run = validRun({ maxCombo: NOTE_COUNT + 50 });
    expect(validateScoreIntegrity(run, levelDef).ok).toBe(false);
  });
});

describe("recordScore", () => {
  it("persists a valid run and computes rank + new-best", async () => {
    const repo = new FakeRepo();
    repo.better = 3;
    repo.best = 10_000;
    const response = await recordScore(validRun(), levelDef, { guestId: "guest-1" }, deps(repo));

    expect(response.rank).toBe(4);
    expect(response.isNewBest).toBe(true);
    expect(response.eligible).toBe(true);
    expect(repo.runs).toHaveLength(1);
    expect(repo.runs[0]).toMatchObject({ score: validRun().score, autoplay: false });
  });

  it("flags autoplay runs as ineligible and gives no rank", async () => {
    const repo = new FakeRepo();
    const response = await recordScore(
      validRun({ autoplay: true }),
      levelDef,
      { guestId: "guest-1" },
      deps(repo),
    );
    expect(response.eligible).toBe(false);
    expect(response.rank).toBeNull();
  });

  it("throws 400 for an invalid run", async () => {
    const repo = new FakeRepo();
    await expect(
      recordScore(validRun({ score: MAX_POSSIBLE + 1 }), levelDef, { guestId: "g" }, deps(repo)),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_RUN" });
  });

  it("throws 404 for an unknown level", async () => {
    const repo = new FakeRepo();
    await expect(
      recordScore(validRun({ levelSlug: "nope" }), levelDef, { guestId: "g" }, deps(repo)),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("is idempotent: same runId never creates a second row", async () => {
    const repo = new FakeRepo();
    const run = validRun({ runId: "2f4a1c80-0000-4000-8000-0000000000aa" });
    const first = await recordScore(run, levelDef, { guestId: "g1" }, deps(repo));
    expect(repo.runs).toHaveLength(1);
    // Contract: the idempotency key must reach the repo layer (catches
    // field-by-field data mappers silently dropping it).
    expect(repo.runs[0]).toMatchObject({ runId: run.runId });

    const second = await recordScore(run, levelDef, { guestId: "g1" }, deps(repo));
    expect(repo.runs).toHaveLength(1); // no second insert
    expect(second.id).toBe(first.id);
    expect(second.rank).toBe(first.rank);
  });

  it("reports not-new-best when previous best is higher", async () => {
    const repo = new FakeRepo();
    repo.best = 99_999_999;
    const response = await recordScore(validRun(), levelDef, { userId: "u1" }, deps(repo));
    expect(response.isNewBest).toBe(false);
  });
});
