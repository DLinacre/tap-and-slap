import { NextResponse } from "next/server";
import { getLevelDef } from "@/game/levels/registry";
import { ApiError } from "@/lib/errors";

/**
 * Full level definition including the beat map. The game currently ships
 * levels in the client bundle (offline-first); this endpoint serves the same
 * registry for tooling, QA and the future content pipeline.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  try {
    const { slug } = await params;
    const level = getLevelDef(slug);
    if (!level) throw ApiError.notFound(`Level '${slug}' not found`);
    return NextResponse.json({ level });
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
