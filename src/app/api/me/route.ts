import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/errors";

/** Current session user (401 when signed out). */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) throw ApiError.unauthorized();
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error" } },
      { status: 500 },
    );
  }
}
