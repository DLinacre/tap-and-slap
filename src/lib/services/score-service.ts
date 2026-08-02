/**
 * Score service — leaderboard persistence + server-side run integrity checks.
 *
 * Integrity philosophy (MVP): the server recomputes what is mathematically
 * possible from the level's deterministic beat map and rejects anything
 * impossible. Full replay verification is documented as Phase 3 work in
 * docs/05-security-quality.md.
 */

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { expectedMaxScore } from "@/game/levels/types";
import type { LevelDef, Difficulty } from "@/game/levels/types";
import { ScoreSubmitInput } from "@/lib/validation/schemas";
import { LeaderboardEntry, SubmitScoreResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Repository seam (swap for in-memory fakes in tests)
// ---------------------------------------------------------------------------

export interface LeaderboardRow {
  id: string;
  userId: string | null;
  guestId: string | null;
  score: number;
  maxCombo: number;
  accuracy: number;
  difficulty: string;
  createdAt: Date;
}

export interface ScoreRepo {
  createRun(data: {
    userId?: string;
    guestId?: string;
    levelId: string;
    difficulty: string;
    score: number;
    maxCombo: number;
    perfects: number;
    greats: number;
    goods: number;
    misses: number;
    accuracy: number;
    autoplay: boolean;
    durationMs: number;
  }): Promise<{ id: string }>;

  countBetter(levelId: string, difficulty: string, score: number): Promise<number>;

  bestScoreFor(levelId: string, difficulty: string, actor: {
    userId?: string;
    guestId?: string;
  }): Promise<number | null>;

  leaderboard(opts: {
    levelId?: string;
    difficulty?: string;
    limit: number;
  }): Promise<LeaderboardRow[]>;
}

export const prismaScoreRepo: ScoreRepo = {
  async createRun(data) {
    const run = await prisma.scoreRun.create({
      data: {
        userId: data.userId ?? null,
        guestId: data.guestId ?? null,
        levelId: data.levelId,
        difficulty: data.difficulty,
        score: data.score,
        maxCombo: data.maxCombo,
        perfects: data.perfects,
        greats: data.greats,
        goods: data.goods,
        misses: data.misses,
        accuracy: data.accuracy,
        autoplay: data.autoplay,
        durationMs: data.durationMs,
      },
      select: { id: true },
    });
    return { id: run.id };
  },

  async countBetter(levelId, difficulty, score) {
    return prisma.scoreRun.count({
      where: { levelId, difficulty, autoplay: false, score: { gt: score } },
    });
  },

  async bestScoreFor(levelId, difficulty, actor) {
    const run = await prisma.scoreRun.findFirst({
      where: {
        levelId,
        difficulty,
        autoplay: false,
        ...(actor.userId ? { userId: actor.userId } : { guestId: actor.guestId }),
      },
      orderBy: { score: "desc" },
      select: { score: true },
    });
    return run?.score ?? null;
  },

  async leaderboard({ levelId, difficulty, limit }) {
    return prisma.scoreRun.findMany({
      where: { autoplay: false, ...(levelId ? { levelId } : {}), ...(difficulty ? { difficulty } : {}) },
      orderBy: [{ score: "desc" }, { createdAt: "asc" }],
      take: limit,
      select: {
        id: true,
        userId: true,
        guestId: true,
        score: true,
        maxCombo: true,
        accuracy: true,
        difficulty: true,
        createdAt: true,
      },
    });
  },
};

// ---------------------------------------------------------------------------
// Integrity checks
// ---------------------------------------------------------------------------

export type IntegrityResult = { ok: true; maxPossible: number } | { ok: false; reason: string };

export function validateScoreIntegrity(
  input: ScoreSubmitInput,
  levelDef: LevelDef,
): IntegrityResult {
  const maxPossible = expectedMaxScore(levelDef);
  const total = input.perfects + input.greats + input.goods + input.misses;
  const noteCount = levelDef.map.notes.length;

  if (noteCount === 0) return { ok: false, reason: "level_has_no_notes" };
  if (total !== noteCount) {
    return { ok: false, reason: `judgment_count_mismatch (${total} !== ${noteCount})` };
  }
  if (input.score > maxPossible) {
    return { ok: false, reason: `score_exceeds_max_possible (${input.score} > ${maxPossible})` };
  }
  if (input.score <= 0) return { ok: false, reason: "score_must_be_positive" };
  if (input.maxCombo < 1 || input.maxCombo > total) {
    return { ok: false, reason: "max_combo_out_of_range" };
  }

  // Accuracy must be consistent with the judgment counts (tolerance for rounding).
  const expectedAcc = ((input.perfects + 0.7 * input.greats + 0.4 * input.goods) / total) * 100;
  if (Math.abs(input.accuracy - expectedAcc) > 0.51) {
    return { ok: false, reason: `accuracy_inconsistent (${input.accuracy} vs ${expectedAcc.toFixed(2)})` };
  }

  // Duration sanity: can't finish faster than the map allows.
  const mapMinMs = Math.round((levelDef.map.offsetMs + levelDef.map.bars * 4 * (60_000 / levelDef.map.bpm)) * 0.7);
  if (input.durationMs < mapMinMs) {
    return { ok: false, reason: `duration_suspiciously_short (${input.durationMs} < ${mapMinMs})` };
  }

  return { ok: true, maxPossible };
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

export interface RecordScoreContext {
  userId?: string;
  guestId?: string;
}

function guestLabel(guestId: string): string {
  return `Guest-${guestId.slice(0, 8)}`;
}

/** Default level-row resolver (Prisma). */
async function prismaFindLevelId(slug: string): Promise<string | null> {
  const level = await prisma.level.findUnique({ where: { slug }, select: { id: true } });
  return level?.id ?? null;
}

export interface ScoreServiceDeps {
  repo: ScoreRepo;
  findLevelId: (slug: string) => Promise<string | null>;
}

export async function recordScore(
  input: ScoreSubmitInput,
  levelDef: LevelDef,
  ctx: RecordScoreContext,
  deps: ScoreServiceDeps = { repo: prismaScoreRepo, findLevelId: prismaFindLevelId },
): Promise<SubmitScoreResponse> {
  const integrity = validateScoreIntegrity(input, levelDef);
  if (!integrity.ok) {
    throw ApiError.badRequest("INVALID_RUN", `Run rejected: ${integrity.reason}`, {
      reason: integrity.reason,
    });
  }

  const levelId = await deps.findLevelId(input.levelSlug);
  if (!levelId) throw ApiError.notFound(`Level '${input.levelSlug}' not found`);

  const { id } = await deps.repo.createRun({
    userId: ctx.userId,
    guestId: ctx.guestId,
    levelId,
    difficulty: input.difficulty,
    score: input.score,
    maxCombo: input.maxCombo,
    perfects: input.perfects,
    greats: input.greats,
    goods: input.goods,
    misses: input.misses,
    accuracy: input.accuracy,
    autoplay: input.autoplay,
    durationMs: input.durationMs,
  });

  const [rank, prevBest] = await Promise.all([
    deps.repo.countBetter(levelId, input.difficulty, input.score),
    deps.repo.bestScoreFor(levelId, input.difficulty, { userId: ctx.userId, guestId: ctx.guestId }),
  ]);

  const isNewBest = prevBest === null || input.score > prevBest;
  logger.info("score.recorded", {
    runId: id,
    levelSlug: input.levelSlug,
    score: input.score,
    autoplay: input.autoplay,
    actor: ctx.userId ? `user:${ctx.userId}` : `guest:${ctx.guestId}`,
  });

  return {
    id,
    rank: input.autoplay ? null : rank + 1,
    isNewBest,
    eligible: !input.autoplay,
  };
}

export function guestLabelFor(guestId: string): string {
  return guestLabel(guestId);
}

/** Raw leaderboard rows (guests identified by `guestId`). */
export async function fetchLeaderboardRows(opts: {
  levelId?: string;
  difficulty?: string;
  limit: number;
}): Promise<LeaderboardRow[]> {
  return prismaScoreRepo.leaderboard(opts);
}

/** Map raw rows to public DTOs, resolving usernames for signed-in players. */
export async function toLeaderboardEntries(
  rows: LeaderboardRow[],
): Promise<LeaderboardEntry[]> {
  const userIds = rows.filter((r) => r.userId).map((r) => r.userId as string);
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true } })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.username]));
  return rows.map((r) => ({
    id: r.id,
    name: r.userId ? (nameById.get(r.userId) ?? "Player") : guestLabel(r.guestId ?? "?"),
    isGuest: !r.userId,
    score: r.score,
    maxCombo: r.maxCombo,
    accuracy: r.accuracy,
    difficulty: r.difficulty as Difficulty,
    createdAt: r.createdAt.toISOString(),
  }));
}
