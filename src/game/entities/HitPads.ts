/**
 * HitPads — the four touch zones at the bottom of the screen (mobile-first).
 *
 * Visual rings + transparent interactive zones per lane. Tapping a pad is
 * equivalent to pressing the lane's arrow key.
 */

import * as Phaser from "phaser";
import { GAME_WIDTH, LANE_COUNT, laneColor, laneX } from "../config";
import type { Lane } from "../levels/types";

const PAD_Y = 750;
const PAD_RADIUS = 44;

export class HitPads {
  private rings: Phaser.GameObjects.Arc[] = [];
  private glow = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onLane: (lane: Lane) => void,
  ) {
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const x = laneX(lane);
      const color = laneColor(lane);

      const ring = this.scene.add.circle(x, PAD_Y, PAD_RADIUS, color, 0.10);
      ring.setStrokeStyle(3, color, 0.85);
      ring.setDepth(4);
      this.rings.push(ring);

      // Label: keyboard hint on desktop (arrows), blank on touch.
      const key = this.scene.add.text(x, PAD_Y, ["◀", "▼", "▲", "▶"][lane]!, {
        fontFamily: '"Orbitron", monospace',
        fontSize: "20px",
        color: `#${color.toString(16).padStart(6, "0")}`,
      }).setOrigin(0.5).setDepth(4).setAlpha(0.9);
      void key;

      const zone = this.scene.add.zone(x, PAD_Y, PAD_RADIUS * 2.4, PAD_RADIUS * 2.4);
      zone.setInteractive({ useHandCursor: false });
      zone.on("pointerdown", () => this.onLane(lane as Lane));
    }
  }

  /** Visual feedback when a lane is pressed. */
  flash(lane: number): void {
    const ring = this.rings[lane];
    if (!ring) return;
    this.scene.tweens.add({
      targets: ring,
      fillAlpha: 0.34,
      scale: 1.15,
      duration: 70,
      yoyo: true,
      onComplete: () => {
        ring.setFillStyle(laneColor(lane), 0.1);
        ring.setScale(1);
      },
    });
  }

  /** Beat-pulse the rings (called on each beat boundary). */
  pulse(): void {
    this.glow = 1;
  }

  /** Per-frame decay for the pulse glow. */
  tick(): void {
    if (this.glow > 0) {
      this.glow = Math.max(0, this.glow - 0.05);
      for (const ring of this.rings) {
        ring.setStrokeStyle(3 + this.glow * 3, 0xffffff, 0.5 + this.glow * 0.4);
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
