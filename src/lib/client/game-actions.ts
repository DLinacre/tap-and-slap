/**
 * Game actions — the single place that coordinates the Phaser bridge with the
 * React screen state machine. Components never touch the bridge or the store
 * directly for lifecycle transitions; they call these.
 */

import { gameBridge } from "@/game/bridge";
import { audioEngine } from "@/game/audio/AudioEngine";
import { useGameStore, RunOptions } from "@/store/game-store";
import { track } from "./analytics";

export function startRun(slug: string, options: RunOptions = {}): void {
  audioEngine.ensureStarted(); // user gesture unlocks audio
  audioEngine.ui();
  useGameStore.setState({ screen: "playing" });
  gameBridge.start(slug, options);
  track("play_started", { level: slug });
}

export function pauseGame(): void {
  gameBridge.pause();
  useGameStore.setState({ screen: "paused" });
}

export function resumeGame(): void {
  gameBridge.resume();
  useGameStore.setState({ screen: "playing" });
}

export function restartRun(): void {
  audioEngine.ensureStarted();
  audioEngine.ui();
  useGameStore.setState({ screen: "playing" });
  gameBridge.restart();
}

export function quitToMenu(): void {
  audioEngine.ui();
  gameBridge.quit();
  useGameStore.setState({ screen: "menu" });
}

/** UI blip for menu interactions (safe to call without audio hardware). */
export function uiClick(): void {
  audioEngine.ui();
}
