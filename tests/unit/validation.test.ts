import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  registerSchema,
  scoreSubmitSchema,
  leaderboardQuerySchema,
} from "@/lib/validation/schemas";

describe("registerSchema", () => {
  const valid = { email: "Player@Example.com", username: "SlapKing_1", password: "hunter2hunter" };

  it("accepts valid input (normalizes email)", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("player@example.com");
  });

  it("rejects bad emails", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects short passwords", () => {
    expect(registerSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });

  it("rejects invalid usernames", () => {
    expect(registerSchema.safeParse({ ...valid, username: "has space" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, username: "x!" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, username: "ab" }).success).toBe(false);
  });
});

describe("credentialsSchema", () => {
  it("requires an email and a password", () => {
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(credentialsSchema.safeParse({ email: "a@b.co" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ password: "x" }).success).toBe(false);
  });
});

describe("scoreSubmitSchema", () => {
  const valid = {
    levelSlug: "neon-rampage",
    difficulty: "NORMAL",
    score: 42_000,
    maxCombo: 64,
    perfects: 100,
    greats: 10,
    goods: 5,
    misses: 2,
    accuracy: 92.3,
    durationMs: 120_000,
    guestId: "2f4a1c80-0000-4000-8000-000000000001",
  };

  it("accepts a valid run", () => {
    expect(scoreSubmitSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects out-of-range difficulty", () => {
    expect(scoreSubmitSchema.safeParse({ ...valid, difficulty: "BRUTAL" }).success).toBe(false);
  });

  it("rejects negative counts and non-integer scores", () => {
    expect(scoreSubmitSchema.safeParse({ ...valid, perfects: -1 }).success).toBe(false);
    expect(scoreSubmitSchema.safeParse({ ...valid, score: 1.5 }).success).toBe(false);
  });

  it("rejects malformed guest ids", () => {
    expect(scoreSubmitSchema.safeParse({ ...valid, guestId: "nope" }).success).toBe(false);
  });

  it("autoplay defaults to false", () => {
    const result = scoreSubmitSchema.safeParse(valid);
    expect(result.success && result.data.autoplay).toBe(false);
  });
});

describe("leaderboardQuerySchema", () => {
  it("coerces limit strings and applies defaults", () => {
    const result = leaderboardQuerySchema.safeParse({ limit: "25" });
    expect(result.success && result.data.limit).toBe(25);
    const empty = leaderboardQuerySchema.safeParse({});
    expect(empty.success && empty.data.limit).toBe(10);
  });

  it("rejects limits above 50", () => {
    const result = leaderboardQuerySchema.safeParse({ limit: "999" });
    expect(result.success).toBe(false);
  });
});
