/**
 * PlayerAvatar — the slapper. A neon glove that punches toward the tapped
 * lane and recoils when the player takes a hit.
 */

import * as Phaser from "phaser";
import { GAME_WIDTH, HIT_Y, LANE_X } from "../config";
import type { Lane } from "../levels/types";

export class PlayerAvatar extends Phaser.GameObjects.Image {
  private readonly homeY = HIT_Y + 74;
  private punching = false;
  private hurtFlash = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, HIT_Y + 74, "glove");
    this.setTint(0xff2ec4);
    this.setScale(0.72);
    this.setDepth(6);
    this.setAlpha(0.96);
    scene.add.existing(this);
  }

  /** Punch toward a lane (tween out and back). */
  punch(lane: Lane): void {
    if (this.punching) return;
    this.punching = true;
    const targetX = LANE_X[lane];
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: HIT_Y + 34,
      angle: lane === 0 ? 24 : lane === 1 ? 10 : lane === 2 ? -8 : -24,
      scale: 0.85,
      duration: 70,
      ease: "Quad.easeOut",
      yoyo: true,
      onComplete: () => {
        this.x = GAME_WIDTH / 2;
        this.y = this.homeY;
        this.angle = 0;
        this.scale = 0.72;
        this.punching = false;
      },
    });
  }

  /** Hurt recoil + red flash. */
  hurt(): void {
    this.hurtFlash = 1;
    this.scene.tweens.add({
      targets: this,
      y: this.homeY + 14,
      duration: 80,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  /** Subtle idle breathing. Call every frame. */
  idle(nowMs: number): void {
    if (this.punching) return;
    this.y = this.homeY + Math.sin(nowMs / 500) * 3;
    if (this.hurtFlash > 0) {
      this.setTint(0xff4d6d);
      this.hurtFlash -= 0.08;
      if (this.hurtFlash <= 0) this.setTint(0xff2ec4);
    }
  }
}
