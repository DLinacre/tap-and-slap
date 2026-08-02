import { NextResponse } from "next/server";
import { getLevelMetas } from "@/game/levels/registry";

/** List level metadata (title, difficulty, BPM, note count…). */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ levels: getLevelMetas() });
}
