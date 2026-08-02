"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/** Client providers for the app tree (Auth.js session context). */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
