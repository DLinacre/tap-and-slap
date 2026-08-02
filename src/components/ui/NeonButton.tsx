"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  children: ReactNode;
}

/** Neon-styled button used across menus, overlays and modals. */
export function NeonButton({ variant = "primary", className = "", children, ...rest }: NeonButtonProps) {
  const cls = ["neon-btn", `neon-btn--${variant}`, className].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
