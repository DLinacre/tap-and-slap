/**
 * Phaser game factory. Called once by the React shell (client-only).
 */

import * as Phaser from "phaser";
import { BG_COLOR, GAME_HEIGHT, GAME_WIDTH } from "./config";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: `#${BG_COLOR.toString(16).padStart(6, "0")}`,
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    // Custom Web Audio engine — don't let Phaser touch the AudioContext
    // (avoids autoplay-policy warnings and duplicate contexts).
    audio: { noAudio: true },
    scene: [BootScene, GameScene],
  });
}
