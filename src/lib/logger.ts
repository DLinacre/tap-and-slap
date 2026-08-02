/**
 * Structured logger.
 *
 * Emits JSON lines in production (parseable by any log shipper) and
 * human-readable lines in development. Secrets are redacted before output.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const REDACT_KEYS = new Set([
  "password",
  "passwordHash",
  "secret",
  "token",
  "authorization",
  "cookie",
]);

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[deep]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.has(k.toLowerCase()) ? "[REDACTED]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function nowIso(): string {
  return new Date().toISOString();
}

function write(level: Level, message: string, fields?: Record<string, unknown>): void {
  const threshold = LEVEL_ORDER[process.env.LOG_LEVEL as Level] ?? 20;
  if (LEVEL_ORDER[level] < threshold) return;

  const redacted = (fields ? (redact(fields) as Record<string, unknown>) : {});
  const entry = { time: nowIso(), level, msg: message, ...redacted };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => write("debug", message, fields),
  info: (message: string, fields?: Record<string, unknown>) => write("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => write("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) => write("error", message, fields),
};
