/**
 * User service — account creation and credential verification.
 * bcryptjs (pure JS) is used so no native build step is required.
 */

import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const BCRYPT_ROUNDS = 12;

export interface PublicUser {
  id: string;
  email: string;
  username: string;
}

function toPublic(user: { id: string; email: string; username: string }): PublicUser {
  return { id: user.id, email: user.email, username: user.username };
}

/** Create a user. Throws ApiError(409) when the email/username is taken. */
export async function createUser(input: {
  email: string;
  username: string;
  password: string;
}): Promise<PublicUser> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    const field = existing.email === input.email ? "email" : "username";
    throw ApiError.badRequest("DUPLICATE", `That ${field} is already registered`, {
      field,
    });
  }

  const passwordHash = bcrypt.hashSync(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email: input.email, username: input.username, passwordHash },
  });
  logger.info("user.created", { userId: user.id });
  return toPublic(user);
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return null;
  return toPublic(user);
}
