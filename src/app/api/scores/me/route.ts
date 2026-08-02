import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { myScoresQuerySchema } from "@/lib/validation/schemas";
import { MyScoresResponse } from "@/types/api";

/** Signed-in players: best run per level/difficulty. Guests keep bests locally. */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw ApiError.unauthorized();

    const q = new URL(request.url).searchParams;
    const parsed = myScoresQuerySchema.safeParse({
      level: q.get("level") ?? undefined,
      difficulty: q.get("difficulty") ?? undefined,
    });
    if (!parsed.success) throw ApiError.badRequest("VALIDATION_FAILED", "Invalid query params");

    const level = parsed.data.level
      ? await prisma.level.findUnique({ where: { slug: parsed.data.level } })
      : undefined;

    const runs = await prisma.scoreRun.findMany({
      where: {
        userId: session.user.id,
        autoplay: false,
        ...(level ? { levelId: level.id } : {}),
        ...(parsed.data.difficulty ? { difficulty: parsed.data.difficulty } : {}),
      },
      orderBy: { score: "desc" },
      take: 20,
      select: {
        level: { select: { slug: true } },
        difficulty: true,
        score: true,
        maxCombo: true,
        accuracy: true,
        createdAt: true,
      },
    });

    const body: MyScoresResponse = {
      best: runs.map((r) => ({
        levelSlug: r.level.slug,
        difficulty: r.difficulty as MyScoresResponse["best"][number]["difficulty"],
        score: r.score,
        maxCombo: r.maxCombo,
        accuracy: r.accuracy,
        createdAt: r.createdAt.toISOString(),
      })),
    };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error" } },
      { status: 500 },
    );
  }
}
