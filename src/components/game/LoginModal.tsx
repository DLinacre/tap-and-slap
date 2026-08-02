"use client";

import { FormEvent, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Modal } from "@/components/ui/Modal";
import { NeonButton } from "@/components/ui/NeonButton";

interface LoginModalProps {
  onClose: () => void;
  onSignedIn: () => void;
}

/**
 * Sign-in / registration modal. Credentials are validated server-side with
 * Zod; passwords are bcrypt-hashed (server). See docs/05-security-quality.md.
 */
export function LoginModal({ onClose, onSignedIn }: LoginModalProps) {
  const { update } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, username, password }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: { message: string } };
          throw new Error(body.error?.message ?? "Registration failed");
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Invalid email or password");
      await update();
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"} onClose={onClose}>
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-form__field">
          <span>Email</span>
          <input
            type="email" required value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          />
        </label>
        {mode === "register" && (
          <label className="auth-form__field">
            <span>Username (3–20 chars)</span>
            <input
              type="text" required minLength={3} maxLength={20} value={username}
              autoComplete="username" pattern="[a-zA-Z0-9_-]{3,20}"
              onChange={(e) => setUsername(e.target.value)} placeholder="SlapKing"
            />
          </label>
        )}
        <label className="auth-form__field">
          <span>Password</span>
          <input
            type="password" required minLength={8} value={password}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
          />
        </label>

        {error && <p className="auth-form__error">{error}</p>}

        <NeonButton type="submit" disabled={busy} className="auth-form__submit">
          {busy ? "…" : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </NeonButton>

        <button
          type="button"
          className="auth-form__switch"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <p className="menu__muted">
          Accounts only save your name on the leaderboard — you can always play as a guest.
        </p>
      </form>
    </Modal>
  );
}
