import { NextResponse } from "next/server";
import { authLimiter, clientIp } from "@/lib/rate-limit";
import { ApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { parseJsonBody, registerSchema } from "@/lib/validation/schemas";
import { createUser } from "@/lib/services/user-service";
import { UserDto } from "@/types/api";

/** Create an account. The client then calls credentials sign-in. */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    authLimiter.consume(`register:${clientIp(request.headers)}`);
    const input = await parseJsonBody(request, registerSchema);
    const user = await createUser(input);
    logger.info("auth.registered", { userId: user.id });

    const dto: UserDto = { id: user.id, email: user.email, username: user.username };
    return NextResponse.json({ user: dto }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        { status: err.status, headers: err.retryAfterSec ? { "Retry-After": String(err.retryAfterSec) } : {} },
      );
    }
    logger.error("auth.register_failed", { error: String(err) });
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error" } },
      { status: 500 },
    );
  }
}
