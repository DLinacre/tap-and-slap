"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Root error boundary — a runtime crash shows a friendly branded screen
 * instead of a blank page, and offers a full reload escape hatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown): void {
    // Forward to whatever client logging is wired (console today; Sentry later).
    console.error("[error-boundary]", error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="notfound">
          <div className="notfound__stage" aria-hidden="true">💥</div>
          <h1 className="notfound__title">CRASHED ON THE BEAT</h1>
          <p className="notfound__body">
            Something went wrong mid-dance. Reload to get back in the fight.
          </p>
          <button
            className="neon-btn neon-btn--primary"
            onClick={() => window.location.reload()}
          >
            ↻ RELOAD
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
