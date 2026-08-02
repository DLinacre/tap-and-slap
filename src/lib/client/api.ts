/**
 * Client-side API helpers + offline score queue.
 *
 * The score queue gives players resilience: if a submission fails (offline,
 * 5xx), it is parked in localStorage and flushed on the next app load.
 */

import type { LevelMeta } from "@/game/levels/types";
import { SubmitScorePayload, SubmitScoreResponse, UserDto } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => null)) as
    | { error?: { code: string; message: string } }
    | T
    | null;
  if (!res.ok) {
    const err = body as { error?: { code: string; message: string } } | null;
    throw new ApiError(
      res.status,
      err?.error?.code ?? "UNKNOWN",
      err?.error?.message ?? `Request failed (${res.status})`,
    );
  }
  return body as T;
}

export async function fetchLevels(): Promise<LevelMeta[]> {
  return request<{ levels: LevelMeta[] }>("/api/levels").then((r) => r.levels);
}

export async function fetchLeaderboard(opts?: {
  level?: string;
  difficulty?: string;
  limit?: number;
}): Promise<import("@/types/api").LeaderboardEntry[]> {
  const q = new URLSearchParams();
  if (opts?.level) q.set("level", opts.level);
  if (opts?.difficulty) q.set("difficulty", opts.difficulty);
  q.set("limit", String(opts?.limit ?? 10));
  return request<{ entries: import("@/types/api").LeaderboardEntry[] }>(
    `/api/scores?${q.toString()}`,
  ).then((r) => r.entries);
}

export async function fetchMe(): Promise<UserDto | null> {
  try {
    const r = await request<{ user: UserDto }>("/api/me");
    return r.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Guest identity
// ---------------------------------------------------------------------------

const GUEST_KEY = "tas.guestId";
const BEST_KEY = "tas.localBests";
const QUEUE_KEY = "tas.pendingScores";

export function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export function loadLocalBests(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

/** Returns true when `score` is a new local best for `levelSlug`. */
export function maybeSaveLocalBest(levelSlug: string, score: number): boolean {
  if (typeof window === "undefined") return false;
  const bests = loadLocalBests();
  const isNew = (bests[levelSlug] ?? 0) < score;
  if (isNew) {
    bests[levelSlug] = score;
    localStorage.setItem(BEST_KEY, JSON.stringify(bests));
  }
  return isNew;
}

// ---------------------------------------------------------------------------
// Score submission with offline queue
// ---------------------------------------------------------------------------

export async function submitScore(payload: SubmitScorePayload): Promise<SubmitScoreResponse> {
  return request<SubmitScoreResponse>("/api/scores", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitScoreResilient(
  payload: SubmitScorePayload,
): Promise<SubmitScoreResponse | null> {
  try {
    return await submitScore(payload);
  } catch (err) {
    // Only queue on network-ish failures, never on 4xx (invalid runs).
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
      console.warn("Score rejected by server:", err.message);
      return null;
    }
    enqueueScore(payload);
    return null;
  }
}

function enqueueScore(payload: SubmitScorePayload): void {
  if (typeof window === "undefined") return;
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as SubmitScorePayload[];
    queue.push(payload);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-20)));
  } catch {
    /* non-fatal */
  }
}

/** Flush queued scores (call on app load when `navigator.onLine`). */
export async function flushPendingScores(): Promise<number> {
  if (typeof window === "undefined") return 0;
  let queue: SubmitScorePayload[] = [];
  try {
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as SubmitScorePayload[];
  } catch {
    return 0;
  }
  if (queue.length === 0) return 0;
  const remaining: SubmitScorePayload[] = [];
  let flushed = 0;
  for (const payload of queue) {
    try {
      await submitScore(payload);
      flushed += 1;
    } catch {
      remaining.push(payload); // still offline — keep
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return flushed;
}
