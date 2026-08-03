import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clientIp, scoreLimiter } from "@/lib/rate-limit";
import { ApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { leaderboardQuerySchema, parseJsonBody, scoreSubmitSchema } from "@/lib/validation/schemas";
import { getLevelDef, getLevelMeta } from "@/game/levels/registry";
import { resolveLevelId } from "@/lib/services/level-service";
import { recordScore, fetchLeaderboardRows, toLeaderboardEntries } from "@/lib/services/score-service";
import { prisma } from "@/lib/db";
import { LeaderboardEntry, SubmitScoreResponse } from "@/types/api";

/**
 * GET /api/scores?level=&difficulty=&limit=  → public leaderboard
 * POST /api/scores                           → submit a completed run
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const q = new URL(request.url).searchParams;
    const parsed = leaderboardQuerySchema.safeParse({
      level: q.get("level") ?? undefined,
      difficulty: q.get("difficulty") ?? undefined,
      limit: q.get("limit") ?? undefined,
    });
    if (!parsed.success) throw ApiError.badRequest("VALIDATION_FAILED", "Invalid query params");

    const meta = parsed.data.level ? getLevelMeta(parsed.data.level) : undefined;
    if (parsed.data.level && !meta) throw ApiError.notFound(`Level '${parsed.data.level}' not found`);

    const rows = await fetchLeaderboardRows({
      levelId: meta ? (await resolveLevelId(meta.slug)) ?? undefined : undefined,
      difficulty: parsed.data.difficulty,
      limit: parsed.data.limit,
    });
    const entries: LeaderboardEntry[] = await toLeaderboardEntries(rows);
    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logger.error("scores.list_failed", { error: String(err) });
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error" } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    const ip = clientIp(request.headers);
    const userId = session?.user?.id;

    if (!userId) {
      // Guests are rate-limited more strictly.
      scoreLimiter.consume(`guest:${ip}`);
    } else {
      scoreLimiter.consume(`user:${userId}`);
    }

    const input = await parseJsonBody(request, scoreSubmitSchema);

    // Guests must present a valid client-generated UUID.
    const guestId = !userId ? input.guestId : undefined;
    if (!userId && !guestId) {
      throw ApiError.badRequest("GUEST_ID_REQUIRED", "Guest runs require a guestId");
    }
    // Autoplay QA runs are accepted (flagged) but never leaderboard-eligible.

    const levelDef = getLevelDef(input.levelSlug);
    if (!levelDef) throw ApiError.notFound(`Level '${input.levelSlug}' not found`);

    const response: SubmitScoreResponse = await recordScore(
      { ...input, autoplay: input.autoplay ?? false, guestId },
      levelDef,
      { userId, guestId },
    );

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        { status: err.status, headers: err.retryAfterSec ? { "Retry-After": String(err.retryAfterSec) } : {} },
      );
    }
    logger.error("scores.submit_failed", { error: String(err) });
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error" } },
      { status: 500 },
    );
  }
}
