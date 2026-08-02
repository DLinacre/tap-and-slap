/**
 * GameBridge — the imperative seam between the React shell and Phaser.
 *
 * React never touches Phaser objects directly; it calls these methods, and the
 * engine reports state through the Zustand store. This keeps the engine
 * swappable and the shell testable.
 */

import type Phaser from "phaser";
import type { RunOptions } from "@/store/game-store";
import { GameScene } from "./scenes/GameScene";

class GameBridge {
  private game: Phaser.Game | null = null;

  attach(game: Phaser.Game): void {
    this.game = game;
  }

  detach(): void {
    this.game = null;
  }

  get isAttached(): boolean {
    return this.game !== null;
  }

  private scene(): GameScene | null {
    if (!this.game) return null;
    const scene = this.game.scene.getScene("Game");
    return scene instanceof GameScene ? scene : null;
  }

  /** Start a run on a level slug. Safe to call repeatedly (restarts). */
  start(slug: string, options: RunOptions = {}): void {
    this.scene()?.startRun(slug, options);
  }

  pause(): void {
    this.scene()?.setRunPaused(true);
  }

  resume(): void {
    this.scene()?.setRunPaused(false);
  }

  /** Restart the current level with the same options. */
  restart(): void {
    const scene = this.scene();
    if (!scene) return;
    const { levelSlug, runOptions } = scene.currentRun();
    if (levelSlug) scene.startRun(levelSlug, runOptions);
  }

  /** Abandon the run and return to the menu. */
  quit(): void {
    this.scene()?.teardownRun();
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }
}

export const gameBridge = new GameBridge();
