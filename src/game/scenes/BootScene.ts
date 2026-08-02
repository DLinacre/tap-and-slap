/**
 * BootScene — procedural asset generation.
 *
 * All textures are drawn at runtime with Phaser Graphics (no binary assets to
 * license, version or CDN). Also warms up the UI font for canvas text.
 */

import * as Phaser from "phaser";
import { BG_COLOR, GAME_HEIGHT, GAME_WIDTH } from "../config";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  async create(): Promise<void> {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.generateTextures();
    // Warm the display font (canvas text renders with fallback until loaded).
    try {
      if (typeof document !== "undefined" && document.fonts) {
        await Promise.race([
          document.fonts.load('700 24px "Orbitron"'),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      }
    } catch {
      /* font loading is non-critical */
    }
    this.scene.start("Game");
  }

  private generateTextures(): void {
    const g = this.add.graphics();

    // --- Enemy: angry blob with outline & shadow -----------------------------
    g.fillStyle(0x000000, 0.35);
    g.fillCircle(50, 58, 38);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(48, 52, 34);
    g.fillCircle(30, 42, 22);
    g.fillCircle(66, 42, 22);
    // angry eyebrows
    g.fillStyle(0x0a0118, 1);
    g.fillRoundedRect(22, 24, 20, 8, 3);
    g.fillRoundedRect(54, 24, 20, 8, 3);
    // eyes
    g.fillStyle(0x0a0118, 1);
    g.fillCircle(36, 42, 9);
    g.fillCircle(60, 42, 9);
    // pupils (menacing red)
    g.fillStyle(0xff4d6d, 1);
    g.fillCircle(36, 40, 3.4);
    g.fillCircle(60, 40, 3.4);
    // gritted teeth
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(38, 64, 20, 9, 3);
    g.fillStyle(0x0a0118, 1);
    g.fillRect(43, 64, 3, 9);
    g.fillRect(50, 64, 3, 9);
    g.generateTexture("enemy", 96, 96);
    g.clear();

    // --- Heavy enemy: horned brute with outline ------------------------------
    g.fillStyle(0x000000, 0.35);
    g.fillCircle(57, 70, 46);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(55, 62, 42);
    g.fillRoundedRect(18, 58, 74, 42, 12);
    // horns
    g.fillTriangle(28, 36, 44, 28, 40, 54);
    g.fillTriangle(82, 36, 68, 28, 72, 54);
    // eyes
    g.fillStyle(0x0a0118, 1);
    g.fillCircle(40, 52, 11);
    g.fillCircle(70, 52, 11);
    g.fillStyle(0xff4d6d, 1);
    g.fillCircle(40, 49, 3.6);
    g.fillCircle(70, 49, 3.6);
    // frown
    g.fillStyle(0x0a0118, 1);
    g.fillRoundedRect(43, 74, 24, 9, 4);
    // knuckle scars
    g.fillStyle(0xffffff, 1);
    g.fillRect(30, 66, 5, 3);
    g.fillRect(80, 66, 5, 3);
    g.generateTexture("enemy-heavy", 110, 110);
    g.clear();

    // --- Player glove --------------------------------------------------------
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(62, 62, 36);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(60, 56, 32);
    g.fillCircle(42, 42, 13);
    g.fillCircle(60, 38, 14);
    g.fillCircle(78, 44, 12);
    g.fillRoundedRect(42, 82, 36, 30, 10);
    // knuckle lines
    g.lineStyle(2, 0x0a0118, 0.5);
    g.beginPath();
    g.moveTo(48, 50);
    g.lineTo(52, 58);
    g.moveTo(60, 46);
    g.lineTo(60, 56);
    g.moveTo(70, 50);
    g.lineTo(67, 58);
    g.strokePath();
    // wrist band
    g.fillStyle(0xff2ec4, 1);
    g.fillRoundedRect(42, 88, 36, 8, 4);
    g.generateTexture("glove", 120, 120);
    g.clear();

    // --- Particle spark -------------------------------------------------------
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture("spark", 16, 16);
    g.clear();

    // --- Shockwave ring ---------------------------------------------------------
    g.lineStyle(6, 0xffffff, 1);
    g.strokeCircle(32, 32, 28);
    g.generateTexture("ring", 64, 64);
    g.clear();

    // --- Star (4-point sparkle) --------------------------------------------------
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(6, 0, 9, 6, 3, 6);
    g.fillTriangle(12, 6, 9, 6, 6, 12);
    g.fillTriangle(6, 12, 9, 6, 3, 6);
    g.fillTriangle(0, 6, 3, 6, 6, 0);
    g.generateTexture("star", 12, 12);
    g.clear();

    // --- Synthwave sun (sliced circle) --------------------------------------------
    const sunX = GAME_WIDTH / 2;
    const sunY = 120;
    const sunR = 108;
    const slice = 10;
    for (let y = -sunR; y <= sunR; y += slice) {
      const half = Math.sqrt(Math.max(0, sunR * sunR - y * y));
      g.fillStyle(0xffffff, 1);
      g.fillRect(sunX - half, sunY + y, half * 2, slice - 2);
    }
    g.generateTexture("sun", GAME_WIDTH, 260);
    g.clear();

    // --- Vignette (soft dark edges) --------------------------------------------------
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const layers = 26;
    for (let i = 0; i < layers; i++) {
      const inset = Math.floor((i / layers) * Math.min(W, H) * 0.55);
      g.fillStyle(0x000000, Math.pow(i / layers, 2.2) * 0.5);
      g.fillRect(inset / 2, inset / 2, W - inset, H - inset);
    }
    g.generateTexture("vignette", W, H);
    g.clear();

    g.destroy();
  }
}
