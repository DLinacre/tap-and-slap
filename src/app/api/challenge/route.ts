import { NextResponse } from "next/server";
import { getDailyDef, dateKey } from "@/game/levels/daily";
import { metaFromDef } from "@/game/levels/types";

/**
 * GET /api/challenge — today's Daily Challenge (UTC).
 * Same map for every player; resets at midnight UTC.
 */
export async function GET(): Promise<NextResponse> {
  const def = getDailyDef();
  const expires = new Date();
  expires.setUTCHours(24, 0, 0, 0);

  return NextResponse.json({
    slug: def.slug,
    date: dateKey(new Date()),
    expiresAt: expires.toISOString(),
    level: metaFromDef(def),
    defaultTrack: def.defaultTrack ?? "inferno",
  });
}
