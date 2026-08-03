/**
 * BootScene — procedural asset generation (art rework v2).
 *
 * All textures are drawn at runtime with Phaser Graphics (no binary assets to
 * license, version or CDN). Art direction: neon synthwave beat-'em-up with
 * DDR-style readability — every enemy carries a lane-direction arrow chip, and
 * each lane has a glowing target ring so the beat landing point is obvious.
 */

import * as Phaser from "phaser";
import { BG_COLOR, GAME_HEIGHT, GAME_WIDTH } from "../config";
import { mulberry32 } from "../levels/generator";

/** Lane direction suffix + rotation (deg) for the arrow chip: u/r/d/l. */
const DIR_SUFFIX = ["l", "d", "u", "r"] as const;
const ARROW_ANGLE: Record<(typeof DIR_SUFFIX)[number], number> = {
  u: 0,
  r: 90,
  d: 180,
  l: 270,
};

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

    // -----------------------------------------------------------------------
    // DDR-style arrow chip (baked into each enemy texture, rotated per lane)
    // -----------------------------------------------------------------------
    const drawArrowChip = (x: number, y: number, angle: number, size = 17): void => {
      g.save();
      g.translateCanvas(x, y);
      g.rotateCanvas(Phaser.Math.DegToRad(angle));
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(-size * 0.13, -size * 0.3, size * 0.26, size * 0.72, 2);
      g.fillTriangle(-size * 0.58, -size * 0.08, size * 0.58, -size * 0.08, 0, -size * 0.64);
      g.fillStyle(0x0a0118, 0.85);
      g.fillRoundedRect(-size * 0.07, -size * 0.24, size * 0.14, size * 0.58, 1);
      g.restore();
    };

    const drawShadow = (x: number, y: number, r: number): void => {
      g.fillStyle(0x000000, 0.38);
      g.fillCircle(x + 4, y + r * 0.9, r * 0.95);
    };

    const drawGlow = (x: number, y: number, r: number): void => {
      g.fillStyle(0xffffff, 0.22);
      g.fillCircle(x, y, r + 6);
    };

    // -----------------------------------------------------------------------
    // Goon (normal enemy): round body, angry brows, gritted teeth
    // -----------------------------------------------------------------------
    for (const dir of DIR_SUFFIX) {
      g.clear();
      drawShadow(48, 54, 32);
      drawGlow(48, 50, 30);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(48, 50, 30); // head
      g.fillCircle(30, 42, 19); // left cheek
      g.fillCircle(66, 42, 19); // right cheek
      // angry brows
      g.fillStyle(0x0a0118, 1);
      g.fillRoundedRect(22, 26, 18, 7, 3);
      g.fillRoundedRect(56, 26, 18, 7, 3);
      // eyes + red pupils
      g.fillCircle(35, 41, 8);
      g.fillCircle(61, 41, 8);
      g.fillStyle(0xff4d6d, 1);
      g.fillCircle(35, 39, 3);
      g.fillCircle(61, 39, 3);
      // gritted teeth
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(38, 62, 20, 8, 3);
      g.fillStyle(0x0a0118, 1);
      g.fillRect(43, 62, 3, 8);
      g.fillRect(50, 62, 3, 8);
      g.fillRect(57, 62, 3, 8);
      // direction arrow chip (top)
      drawArrowChip(48, 16, ARROW_ANGLE[dir]);
      g.generateTexture(`enemy-${dir}`, 96, 96);
    }

    // -----------------------------------------------------------------------
    // Brute (heavy enemy): horned, scarred, big
    // -----------------------------------------------------------------------
    for (const dir of DIR_SUFFIX) {
      g.clear();
      drawShadow(56, 68, 44);
      drawGlow(55, 60, 40);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(55, 58, 40); // head
      g.fillRoundedRect(16, 56, 78, 46, 12); // body
      // horns
      g.fillTriangle(26, 34, 44, 26, 40, 54);
      g.fillTriangle(84, 34, 66, 26, 70, 54);
      // brows + eyes
      g.fillStyle(0x0a0118, 1);
      g.fillRoundedRect(22, 42, 20, 7, 3);
      g.fillRoundedRect(68, 42, 20, 7, 3);
      g.fillCircle(38, 52, 10);
      g.fillCircle(72, 52, 10);
      g.fillStyle(0xff4d6d, 1);
      g.fillCircle(38, 50, 3.4);
      g.fillCircle(72, 50, 3.4);
      // frown + scar
      g.fillStyle(0x0a0118, 1);
      g.fillRoundedRect(42, 72, 26, 8, 4);
      g.fillRect(30, 66, 6, 3);
      g.fillRect(80, 66, 6, 3);
      drawArrowChip(55, 14, ARROW_ANGLE[dir], 19);
      g.generateTexture(`enemy-heavy-${dir}`, 110, 110);
    }

    // -----------------------------------------------------------------------
    // Imp (mini enemy): pointy ears, wide eyes
    // -----------------------------------------------------------------------
    for (const dir of DIR_SUFFIX) {
      g.clear();
      drawShadow(32, 40, 20);
      drawGlow(32, 36, 19);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(32, 38, 20);
      // ears
      g.fillTriangle(14, 22, 22, 8, 24, 24);
      g.fillTriangle(50, 22, 42, 8, 40, 24);
      // big eyes
      g.fillStyle(0x0a0118, 1);
      g.fillCircle(26, 36, 6);
      g.fillCircle(38, 36, 6);
      g.fillStyle(0xff4d6d, 1);
      g.fillCircle(26, 34, 2.2);
      g.fillCircle(38, 34, 2.2);
      // open mouth
      g.fillStyle(0x0a0118, 1);
      g.fillRoundedRect(28, 44, 8, 6, 3);
      drawArrowChip(32, 12, ARROW_ANGLE[dir], 13);
      g.generateTexture(`enemy-mini-${dir}`, 64, 64);
    }

    // -----------------------------------------------------------------------
    // Player glove — chunkier with knuckles + wrist band
    // -----------------------------------------------------------------------
    g.clear();
    drawShadow(62, 64, 36);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(60, 56, 33);
    g.fillCircle(42, 42, 14);
    g.fillCircle(60, 38, 15);
    g.fillCircle(79, 45, 13);
    g.fillRoundedRect(42, 82, 36, 30, 10);
    // knuckle creases
    g.lineStyle(2, 0x0a0118, 0.45);
    g.beginPath();
    g.moveTo(48, 50);
    g.lineTo(52, 58);
    g.moveTo(60, 46);
    g.lineTo(60, 56);
    g.moveTo(71, 50);
    g.lineTo(68, 58);
    g.strokePath();
    // wrist band
    g.fillStyle(0xff2ec4, 1);
    g.fillRoundedRect(42, 90, 36, 9, 4);
    g.fillStyle(0x0a0118, 0.35);
    g.fillRect(42, 95, 36, 2);
    g.generateTexture("glove", 120, 120);
    g.clear();

    // -----------------------------------------------------------------------
    // Particles & FX
    // -----------------------------------------------------------------------
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture("spark", 16, 16);
    g.clear();

    g.lineStyle(6, 0xffffff, 1);
    g.strokeCircle(32, 32, 28);
    g.generateTexture("ring", 64, 64);
    g.clear();

    g.fillStyle(0xffffff, 1);
    g.fillTriangle(6, 0, 9, 6, 3, 6);
    g.fillTriangle(12, 6, 9, 6, 6, 12);
    g.fillTriangle(6, 12, 9, 6, 3, 6);
    g.fillTriangle(0, 6, 3, 6, 6, 0);
    g.generateTexture("star", 12, 12);
    g.clear();

    // Soft radial glow (horizon light, punch trails)
    for (let r = 62; r >= 2; r -= 3) {
      g.fillStyle(0xffffff, Math.max(0, (1 - r / 64)) * 0.28);
      g.fillCircle(64, 64, r);
    }
    g.generateTexture("glow", 128, 128);
    g.clear();

    // Target ring (hit-zone indicator per lane)
    g.lineStyle(5, 0xffffff, 1);
    g.strokeCircle(45, 45, 36);
    g.lineStyle(4, 0xffffff, 0.9);
    g.lineBetween(45, 4, 45, 12); // N
    g.lineBetween(45, 78, 45, 86); // S
    g.lineBetween(4, 45, 12, 45); // W
    g.lineBetween(78, 45, 86, 45); // E
    g.generateTexture("target", 90, 90);
    g.clear();

    // -----------------------------------------------------------------------
    // Synthwave sun (sliced circle)
    // -----------------------------------------------------------------------
    const sunX = GAME_WIDTH / 2;
    const sunY = 118;
    const sunR = 104;
    const slice = 9;
    for (let y = -sunR; y <= sunR; y += slice) {
      const half = Math.sqrt(Math.max(0, sunR * sunR - y * y));
      g.fillStyle(0xffffff, 1);
      g.fillRect(sunX - half, sunY + y, half * 2, slice - 2);
    }
    g.generateTexture("sun", GAME_WIDTH, 260);
    g.clear();

    // -----------------------------------------------------------------------
    // City skyline silhouette with lit windows
    // -----------------------------------------------------------------------
    const rng = mulberry32(20260803);
    let x = 0;
    while (x < GAME_WIDTH) {
      const bw = 24 + Math.floor(rng() * 28);
      const bh = 55 + Math.floor(rng() * 75);
      g.fillStyle(0x180a38, 1);
      g.fillRect(x, 140 - bh, bw, bh);
      g.fillStyle(0xffd54a, 0.5);
      for (let wy = 140 - bh + 7; wy < 136; wy += 11) {
        for (let wx = x + 5; wx < x + bw - 5; wx += 9) {
          if (rng() < 0.2) g.fillRect(wx, wy, 4, 5);
        }
      }
      x += bw + 3;
    }
    g.generateTexture("city", GAME_WIDTH, 140);
    g.clear();

    // -----------------------------------------------------------------------
    // Vignette (soft dark edges)
    // -----------------------------------------------------------------------
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
