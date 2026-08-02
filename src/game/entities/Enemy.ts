/**
 * Enemy — the visual incarnation of a beat-map note.
 *
 * An enemy spawns at the top of its lane when its hit beat is
 * `approachMs` away and travels down to the hit zone. If the player fails to
 * slap it inside the judgment window it reaches the zone and attacks.
 */

import * as Phaser from "phaser";
import { ENEMY_SIZE, ENEMY_SPAWN_Y, HIT_Y } from "../config";
import type { Lane, NoteKind } from "../levels/types";

export class Enemy extends Phaser.GameObjects.Image {
  readonly lane: Lane;
  readonly kind: NoteKind;

  private baseY = 0;
  private bobSeed = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, x: number, lane: Lane, kind: NoteKind, tint: number) {
    super(scene, x, ENEMY_SPAWN_Y, kind === "heavy" ? "enemy-heavy" : "enemy");
    this.lane = lane;
    this.kind = kind;
    this.setTint(tint);
    this.setScale(kind === "heavy" ? 0.9 : kind === "mini" ? 0.62 : 0.78);
    this.setDepth(5);
    scene.add.existing(this);
  }

  /**
   * Update travel progress: 0 = spawn, 1 = arrived at the hit zone.
   * Call every frame from the scene update loop.
   */
  setProgress(progress: number, nowMs: number): void {
    const p = Phaser.Math.Clamp(progress, 0, 1);
    // Ease-in for a satisfying "rush" feel as the beat approaches.
    const eased = p * p * (3 - 2 * p);
    this.baseY = ENEMY_SPAWN_Y + (HIT_Y - ENEMY_SPAWN_Y) * eased;
    const bob = Math.sin(nowMs / 160 + this.bobSeed) * 4;
    this.y = this.baseY + bob;
    const scalePulse = 1 + Math.sin(nowMs / 220 + this.bobSeed) * 0.04;
    this.setScale((this.kind === "heavy" ? 0.9 : this.kind === "mini" ? 0.62 : 0.78) * scalePulse);
  }

  /** Kill animation — bursts out in a puff. Calls `onDone` when removed. */
  die(onDone?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      scale: this.scaleX * 1.6,
      alpha: 0,
      duration: 140,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.destroy();
        onDone?.();
      },
    });
  }

  /** The enemy reaches the player and slaps them. */
  attack(onDone?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      y: HIT_Y + 26,
      angle: this.lane === 2 || this.lane === 0 ? -12 : 12,
      duration: 90,
      yoyo: true,
      onComplete: () => {
        this.destroy();
        onDone?.();
      },
    });
  }

  /** Hit radius used for direct-tap hit-testing (pointer ↔ enemy). */
  get hitRadius(): number {
    return ENEMY_SIZE * 0.6 * (this.kind === "heavy" ? 0.9 : this.kind === "mini" ? 0.62 : 0.78);
  }
}
