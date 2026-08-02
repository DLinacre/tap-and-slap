/**
 * Auth.js (v5 beta) configuration — credentials provider + JWT sessions.
 *
 * Sessions are stateless JWTs signed with AUTH_SECRET. `auth()` is awaited in
 * route handlers to read the session server-side.
 *
 * @see docs/05-security-quality.md §Auth
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { credentialsSchema } from "@/lib/validation/schemas";
import { verifyCredentials } from "@/lib/services/user-service";

// Dev-only fallback so `npm run dev` works without an .env (never in prod).
const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  // Required for Auth.js v5: trusts the Host header (reverse proxies, preview
  // deployments, localhost). Without it /api/auth/* returns 500 UntrustedHost.
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: { signIn: "/" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await verifyCredentials(parsed.data.email, parsed.data.password);
        if (!user) return null;
        return { id: user.id, email: user.email, username: user.username };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.username = (token.username as string) ?? "";
      }
      return session;
    },
  },
});
