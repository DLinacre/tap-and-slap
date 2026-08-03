"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { GameCanvas } from "./GameCanvas";
import { Hud } from "./Hud";
import { Menu } from "./Menu";
import { GameOverScreen } from "./GameOverScreen";
import { PauseScreen } from "./PauseScreen";
import { LoginModal } from "./LoginModal";
import { NeonButton } from "@/components/ui/NeonButton";
import { gameBridge } from "@/game/bridge";
import { audioEngine } from "@/game/audio/AudioEngine";
import { getLevels } from "@/game/levels/registry";
import { getDailyDef } from "@/game/levels/daily";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { fetchLeaderboard, fetchMe, flushPendingScores, getGuestId } from "@/lib/client/api";
import { logger } from "@/lib/client/logger-client";
import { pauseGame, resumeGame, startRun } from "@/lib/client/game-actions";

/**
 * GameShell — the single-page app shell.
 *
 * Owns the screen state machine (menu → playing → paused → gameover), wires
 * the Phaser bridge, loads identity/leaderboard data and hosts all overlays.
 */
export function GameShell() {
  const screen = useGameStore((s) => s.screen);
  const levelSlug = useGameStore((s) => s.levelSlug);
  const setLevels = useGameStore((s) => s.setLevels);
  const setPlayer = useGameStore((s) => s.setPlayer);
  const setGuestId = useGameStore((s) => s.setGuestId);
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const masterVolume = useSettingsStore((s) => s.masterVolume);

  const [showLogin, setShowLogin] = useState(false);
  const { status } = useSession();
  const autoStart = useRef<{ slug: string; options: { autoplay: boolean; qa: boolean } } | null>(null);

  // --- Boot: identity, levels, leaderboard, offline queue, URL flags --------
  useEffect(() => {
    setGuestId(getGuestId());
    setLevels([getDailyDef(), ...getLevels()]);

    const params = new URLSearchParams(window.location.search);
    const autoplay = params.get("autoplay") === "1";
    const qa = params.get("qa") === "1";
    if (autoplay) {
      const first = [getDailyDef(), ...getLevels()][0];
      if (first) autoStart.current = { slug: first.slug, options: { autoplay: true, qa } };
    }

    // Only probe the session endpoint when a session might exist — avoids a
    // guaranteed 401 console error for guests on every load.
    if (status !== "unauthenticated") {
      void fetchMe()
        .then((user) => setPlayer(user))
        .catch(() => setPlayer(null));
    }
    void flushPendingScores().then((n) => {
      if (n > 0) logger.info("flushed pending scores", { count: n });
    });

    const onOnline = () => void flushPendingScores();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [setGuestId, setLevels, setPlayer, status]);

  // --- Idle screens stop the engine loop (CPU/battery/heat win) --------------
  useEffect(() => {
    gameBridge.setIdle(screen !== "playing");
  }, [screen]);

  // --- Session → player sync ------------------------------------------------
  useEffect(() => {
    if (status === "authenticated") {
      void fetchMe()
        .then(setPlayer)
        .catch(() => setPlayer(null));
    } else if (status === "unauthenticated") {
      setPlayer(null);
    }
  }, [status, setPlayer]);

  // --- Auto-start (autoplay/QA mode used by E2E) ----------------------------
  const screenRef = useRef(screen);
  screenRef.current = screen;
  useEffect(() => {
    if (screen === "menu" && autoStart.current) {
      const { slug, options } = autoStart.current;
      autoStart.current = null;
      startRun(slug, options);
    }
  }, [screen]);

  // --- Pause on Esc/P and on tab blur ---------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        if (screenRef.current === "playing") pauseGame();
        else if (screenRef.current === "paused") resumeGame();
      }
    };
    const onBlur = () => {
      if (screenRef.current === "playing") pauseGame();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onBlur);
    };
  }, []);

  // --- Leaderboard refresh ---------------------------------------------------
  const refreshLeaderboard = useCallback(() => {
    void fetchLeaderboard({ limit: 10, level: levelSlug ?? undefined })
      .then((entries) => setLeaderboard(entries))
      .catch(() => setLeaderboard(null, "Leaderboard unavailable"));
  }, [levelSlug, setLeaderboard]);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  // --- Volume sync to audio engine -------------------------------------------
  useEffect(() => {
    audioEngine.ensureStarted();
    audioEngine.syncVolumes();
  }, [musicVolume, sfxVolume, masterVolume]);

  const headerRight = useMemo(
    () =>
      screen === "menu" ? (
        <NeonButton variant="ghost" onClick={() => setShowLogin(true)}>
          {status === "authenticated" ? "Account" : "Sign in"}
        </NeonButton>
      ) : null,
    [screen, status],
  );

  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="app-logo">🕺 TAP &amp; SLAP</span>
        {headerRight}
      </header>

      <div className="stage">
        <GameCanvas />
        {screen === "playing" && <Hud />}
        {screen === "menu" && <Menu onSignIn={() => setShowLogin(true)} />}
        {screen === "paused" && <PauseScreen />}
        {screen === "gameover" && <GameOverScreen onBack={refreshLeaderboard} />}
      </div>

      <footer className="app-footer">
        {screen === "playing" && <span>ESC pause · arrows/WASD to slap</span>}
        {screen !== "playing" && (
          <span>
            Tap the beat. Slap the enemy. Stay alive. ·{" "}
            <a href="/about">About</a> · <a href="/privacy">Privacy</a>
          </span>
        )}
      </footer>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSignedIn={() => setShowLogin(false)} />
      )}
    </main>
  );
}
