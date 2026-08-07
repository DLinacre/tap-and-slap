/**
 * HitPads — the four pad visuals ON the hit line.
 *
 * v1.3.3: pads are now PURELY VISUAL. All touch/mouse judging happens in
 * GameScene's single pointer handler, which maps any tap in a lane column to
 * that lane — so one physical tap can never double-judge, and the whole
 * column (not just the pad circle) is the hit target.
 *
 * The pads themselves are big and bright so every lane reads as active:
 * filled rings at the hit line + a soft under-glow on the track.
 */

import * as Phaser from "phaser";
import {
  GAME_WIDTH,
  LANE_COUNT,
  HIT_Y,
  PAD_Y,
  laneColor,
  laneX,
} from "../config";
import type { Lane } from "../levels/types";

const PAD_RADIUS = 50;
const PAD_FILL_ALPHA = 0.5;
const PAD_STROKE_ALPHA = 1;

export class HitPads {
  private rings: Phaser.GameObjects.Arc[] = [];
  private glow = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    onLane: (lane: Lane) => void,
  ) {
    void onLane; // judging is handled by GameScene's pointer handler
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const x = laneX(lane);
      const color = laneColor(lane);

      // Soft under-glow on the track below the pad.
      this.scene.add
        .circle(x, HIT_Y + 70, 74, color, 0.16)
        .setDepth(3.6);

      const ring = this.scene.add.circle(x, PAD_Y, PAD_RADIUS, color, PAD_FILL_ALPHA);
      ring.setStrokeStyle(5, color, PAD_STROKE_ALPHA);
      ring.setDepth(4);
      this.rings.push(ring);

      // Label: keyboard hint on desktop (arrows), bright white for contrast.
      this.scene.add
        .text(x, PAD_Y, ["◀", "▼", "▲", "▶"][lane]!, {
          fontFamily: '"Orbitron", monospace',
          fontSize: "24px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(4)
        .setAlpha(1);
    }
  }

  /** Visual feedback when a lane is pressed. */
  flash(lane: number): void {
    const ring = this.rings[lane];
    if (!ring) return;
    this.scene.tweens.add({
      targets: ring,
      fillAlpha: 0.85,
      scale: 1.18,
      duration: 70,
      yoyo: true,
      onComplete: () => {
        ring.setFillStyle(laneColor(lane), PAD_FILL_ALPHA);
        ring.setScale(1);
      },
    });
  }

  /** Beat-pulse the rings (called on each beat boundary). */
  pulse(): void {
    this.glow = 1;
    // Fill pulse on every beat — all four lanes continuously read as "live".
    for (const ring of this.rings) {
      this.scene.tweens.add({
        targets: ring,
        fillAlpha: PAD_FILL_ALPHA + 0.2,
        scale: 1.08,
        duration: 90,
        yoyo: true,
        onComplete: () => ring.setScale(1),
      });
    }
  }

  /** Per-frame decay for the pulse glow. */
  tick(): void {
    if (this.glow > 0) {
      this.glow = Math.max(0, this.glow - 0.05);
      for (const ring of this.rings) {
        ring.setStrokeStyle(5 + this.glow * 3, 0xffffff, 0.6 + this.glow * 0.4);
      }
    }
  }

  get padY(): number {
    return PAD_Y;
  }
}

/** Screen-space rect of the pad row (used for pointer sanity checks). */
export const PAD_ROW_Y = PAD_Y - PAD_RADIUS * 1.4;
export const GAME_WIDTH_FOR_PADS = GAME_WIDTH;
