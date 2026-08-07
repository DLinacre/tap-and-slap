/**
 * Keyboard input controller.
 *
 * Maps arrow keys (DDR pads) and WASD to the four lanes and forwards presses
 * to the callback. Touch input lives in `HitPads` (Phaser zones) and enemy
 * taps are handled by GameScene's pointer listener — all three converge on
 * `scene.hitLane(lane, nowMs)`.
 */

import type Phaser from "phaser";
import { LANE_COUNT } from "../config";

const KEY_TO_LANE: Record<string, number> = {
  ArrowLeft: 0,
  ArrowDown: 1,
  ArrowUp: 2,
  ArrowRight: 3,
  KeyA: 0,
  KeyS: 1,
  KeyW: 2,
  KeyD: 3,
};

export class InputController {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onLane: (lane: number) => void,
  ) {}

  enable(): void {
    this.scene.input.keyboard?.on("keydown", this.handleKeyDown);
  }

  disable(): void {
    this.scene.input.keyboard?.off("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Ignore OS key auto-repeat — holding a key must not machine-gun notes
    // (one physical press = one judgement).
    if (event.repeat) return;
    // Prevent page scroll on arrow keys / space while playing.
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    const lane = KEY_TO_LANE[event.code];
    if (lane !== undefined && lane >= 0 && lane < LANE_COUNT) {
      this.onLane(lane);
    }
  };
}
