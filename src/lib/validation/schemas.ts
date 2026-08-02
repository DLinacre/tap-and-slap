/**
 * Zod validation schemas for every API surface.
 *
 * All route handlers parse/validate through these schemas — never trust raw
 * input (see docs/05-security-quality.md, "Input validation matrix").
 */

import { z } from "zod";
import { ApiError } from "@/lib/errors";
import { DIFFICULTIES } from "@/game/levels/types";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{3,20}$/, "3–20 chars, letters, digits, _ or -"),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
});

// ---------------------------------------------------------------------------
// Scores
// ---------------------------------------------------------------------------

export const difficultySchema = z.enum(DIFFICULTIES);

export const scoreSubmitSchema = z.object({
  levelSlug: z.string().min(1).max(64),
  difficulty: difficultySchema,
  score: z.number().int().min(0).max(10_000_000),
  maxCombo: z.number().int().min(0).max(10_000),
  perfects: z.number().int().min(0).max(20_000),
  greats: z.number().int().min(0).max(20_000),
  goods: z.number().int().min(0).max(20_000),
  misses: z.number().int().min(0).max(20_000),
  accuracy: z.number().min(0).max(100),
  durationMs: z.number().int().min(1_000).max(600_000),
  guestId: z.string().uuid().optional(),
  autoplay: z.boolean().default(false),
});

export type ScoreSubmitInput = z.infer<typeof scoreSubmitSchema>;

export const leaderboardQuerySchema = z.object({
  level: z.string().min(1).max(64).optional(),
  difficulty: difficultySchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const myScoresQuerySchema = z.object({
  level: z.string().min(1).max(64).optional(),
  difficulty: difficultySchema.optional(),
});

/** Parse a JSON body; throws ApiError(400) with a friendly message. */
export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw ApiError.badRequest("INVALID_JSON", "Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw ApiError.badRequest("VALIDATION_FAILED", "Request failed validation", result.error.flatten());
  }
  return result.data;
}
