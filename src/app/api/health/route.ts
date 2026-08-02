import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db";
import { HealthResponse } from "@/types/api";

/** Liveness + dependency probe for orchestrators / uptime checks. */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const db = (await pingDatabase()) ? "up" : "down";
  return NextResponse.json(
    {
      status: "ok",
      version: process.env.npm_package_version ?? "0.1.0",
      time: new Date().toISOString(),
      db,
    },
    { status: db === "up" ? 200 : 503 },
  );
}
