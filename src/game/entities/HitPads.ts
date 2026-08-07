/**
 * HitPads — the four touch zones ON the hit line (mobile-first).
 *
 * v1.2 fix: pads previously lived at y=750 while enemies died at y=660, so
 * taps aimed at the visible target missed the interactive zone. Pads now sit
 * exactly on the hit line and their interactive zones reach 300px above it,
 * so tapping the enemy OR the pad works — and the visual fill is bright
 * enough that every lane clearly reads as active.
 *
 * Tapping a pad is equivalent to pressing the lane's arrow key. Each pad
 * records the pointer id that pressed it so the scene's fallback
 * `pointerdown` handler can never double-judge the same tap.
 */

import * as Phaser from "phaser";
import {
  GAME_WIDTH,
  LANE_COUNT,
  PAD_Y,
  PAD_ZONE_WIDTH,
  PAD_ZONE_HEIGHT,
  laneColor,
  laneX,
} from "../config";
import type { Lane } from "../levels/types";

const PAD_RADIUS = 46;
const PAD_FILL_ALPHA = 0.32; // v1.1 shipped 0.10 — looked disabled
const PAD_STROKE_ALPHA = 0.95;

export class HitPads {
  private rings: Phaser.GameObjects.Arc[] = [];
  private glow = 0;
  /** Pointer id of the most recent pad press (guards against double-judging). */
  lastConsumedPointerId = -1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onLane: (lane: Lane) => void,
  ) {
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const x = laneX(lane);
      const color = laneColor(lane);

      const ring = this.scene.add.circle(x, PAD_Y, PAD_RADIUS, color, PAD_FILL_ALPHA);
      ring.setStrokeStyle(4, color, PAD_STROKE_ALPHA);
      ring.setDepth(4);
      this.rings.push(ring);

      // Label: keyboard hint on desktop (arrows), blank on touch.
      this.scene.add
        .text(x, PAD_Y, ["◀", "▼", "▲", "▶"][lane]!, {
          fontFamily: '"Orbitron", monospace',
          fontSize: "22px",
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(4)
        .setAlpha(0.95);

      // Interactive zone: a generous column on/above the hit line. Tapping
      // the enemy OR the pad area registers — no more dead zones.
      const zone = this.scene.add.zone(x, PAD_Y, PAD_ZONE_WIDTH, PAD_ZONE_HEIGHT);
      zone.setInteractive({ useHandCursor: false });
      zone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        this.lastConsumedPointerId = pointer.id;
        this.onLane(lane as Lane);
      });
    }
  }

  /** Visual feedback when a lane is pressed. */
  flash(lane: number): void {
    const ring = this.rings[lane];
    if (!ring) return;
    this.scene.tweens.add({
      targets: ring,
      fillAlpha: 0.6,
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
        fillAlpha: PAD_FILL_ALPHA + 0.14,
        scale: 1.07,
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
        ring.setStrokeStyle(4 + this.glow * 3, 0xffffff, 0.55 + this.glow * 0.4);
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
