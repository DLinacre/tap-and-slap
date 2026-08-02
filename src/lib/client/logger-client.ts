/**
 * Client-side logger (tiny wrapper; no server imports).
 * Kept separate from the server logger so game code never touches Node APIs.
 */

type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, msg: string, fields?: Record<string, unknown>): void {
  const line = `[tas] ${new Date().toISOString()} ${level.toUpperCase()} ${msg}`;
  if (level === "error") console.error(line, fields ?? "");
  else if (level === "warn") console.warn(line, fields ?? "");
  else console.log(line, fields ?? "");
}

export const logger = {
  debug: (m: string, f?: Record<string, unknown>) => log("debug", m, f),
  info: (m: string, f?: Record<string, unknown>) => log("info", m, f),
  warn: (m: string, f?: Record<string, unknown>) => log("warn", m, f),
  error: (m: string, f?: Record<string, unknown>) => log("error", m, f),
};
