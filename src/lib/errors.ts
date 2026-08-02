/**
 * API error model. Route handlers catch `ApiError` and render a standard
 * JSON envelope: `{ error: { code, message, details? } }`.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(code: string, message: string, details?: unknown): ApiError {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You are not allowed to do that"): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static tooManyRequests(message = "Slow down — too many requests", retryAfterSec = 30): ApiError {
    const err = new ApiError(429, "RATE_LIMITED", message);
    err.retryAfterSec = retryAfterSec;
    return err;
  }

  retryAfterSec?: number;
}
