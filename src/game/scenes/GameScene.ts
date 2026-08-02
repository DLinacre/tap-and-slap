/**
 * GameScene — the beat 'em up gameplay.
 *
 * Responsibilities:
 *  - owns the musical timeline (BeatClock) and scoring (ScoreTracker)
 *  - spawns enemies from the level's beat map, moves them down the lanes
 *  - judges taps/presses against note times and applies FX + SFX
 *  - drives the React HUD through the Zustand store
 *  - reports results and submits scores (non-autoplay runs)
 *
 * The React shell starts/pauses/resumes runs through `GameBridge`, which talks
 * to this scene — the scene itself knows nothing about React.
 */

import * as Phaser from "phaser";
import { useGameStore, RunOptions } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { getLevelDef } from "@/game/levels/registry";
import { mulberry32 } from "@/game/levels/generator";
import type { LevelDef, MapNote } from "@/game/levels/types";
import { audioEngine } from "@/game/audio/AudioEngine";
import { BeatClock } from "@/game/core/BeatClock";
import { ScoreTracker } from "@/game/core/ScoreTracker";
import { judgeNote, isWithinWindow, JudgmentType } from "@/game/core/Judgement";
import { InputController } from "@/game/core/InputController";
import { Enemy } from "@/game/entities/Enemy";
import { PlayerAvatar } from "@/game/entities/PlayerAvatar";
import { HitPads } from "@/game/entities/HitPads";
import {
  ACCENT_COLOR,
  BG_COLOR,
  GAME_HEIGHT,
  GAME_WIDTH,
  GOOD_COLOR,
  GREAT_COLOR,
  HIT_Y,
  JUDGMENT_WINDOWS,
  LANE_COUNT,
  MAX_HEALTH,
  MISS_COLOR,
  PERFECT_COLOR,
  laneColor,
  laneX,
} from "@/game/config";
import { baseScoreFor } from "@/game/levels/types";
import { submitScoreResilient, maybeSaveLocalBest } from "@/lib/client/api";
import type { Difficulty } from "@/game/levels/types";

interface ActiveNote {
  note: MapNote;
  timeMs: number;
  enemy: Enemy | null;
  judged: boolean;
}

/** Extra ms the autoplay bot may hit a note past the GOOD window (QA/CI). */
const BOT_GRACE_MS = 350;

const JUDGMENT_LABEL: Record<JudgmentType, string> = {
  perfect: "PERFECT!",
  great: "GREAT",
  good: "GOOD",
  miss: "MISS",
};

const JUDGMENT_COLOR: Record<JudgmentType, number> = {
  perfect: PERFECT_COLOR,
  great: GREAT_COLOR,
  good: GOOD_COLOR,
  miss: MISS_COLOR,
};

export class GameScene extends Phaser.Scene {
  private level: LevelDef | null = null;
  private options: RunOptions = {};
  private notes: ActiveNote[] = [];
  private clock = new BeatClock({ bpm: 120 });
  private tracker = new ScoreTracker({ maxHealth: MAX_HEALTH });
  private inputCtrl!: InputController;
  private pads!: HitPads;
  private player!: PlayerAvatar;

  private grid!: Phaser.GameObjects.Graphics;
  private laneLines!: Phaser.GameObjects.Graphics;
  private hitZone!: Phaser.GameObjects.Graphics;
  private hurtFlash!: Phaser.GameObjects.Rectangle;
  private beatGlow!: Phaser.GameObjects.Rectangle;

  private killEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  private running = false;
  private autoplay = false;
  private lastWholeBeat = -1;
  private lastProgressPush = 0;
  private judgmentId = 0;
  private gridOffset = 0;
  private perfectStreak = 0;
  private lastMilestoneCombo = 0;
  private sun: Phaser.GameObjects.Image | null = null;
  private stars: Phaser.GameObjects.Image[] = [];
  private vignette: Phaser.GameObjects.Image | null = null;

  constructor() {
    super("Game");
  }

  init(data?: { level?: LevelDef }): void {
    if (data?.level) {
      this.level = data.level;
      useGameStore.setState({ level: data.level, levelSlug: data.level.slug });
    }
  }

  // ---------------------------------------------------------------------------
  // Creation
  // ---------------------------------------------------------------------------

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.buildBackground();

    this.player = new PlayerAvatar(this);
    this.pads = new HitPads(this, (lane) => this.hitLane(lane));
    this.inputCtrl = new InputController(this, (lane) => this.hitLane(lane));
    this.inputCtrl.enable();

    // Pointer: tap an enemy directly (mobile "tap to kill").
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerTap(pointer);
    });

    this.killEmitter = this.add.particles(0, 0, "spark", {
      speed: { min: 120, max: 420 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 180, max: 420 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      emitting: false,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.killEmitter.setDepth(7);

    this.sparkEmitter = this.add.particles(0, 0, "spark", {
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 120, max: 260 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      quantity: 1,
      emitting: false,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.sparkEmitter.setDepth(7);

    // Level from a previous session (scene restart) or idle state.
    const store = useGameStore.getState();
    if (!this.level) {
      this.level = store.level;
    }
    if (this.level) {
      this.startRun(this.level.slug, store.runOptions);
    } else {
      useGameStore.setState({ screen: "menu" });
    }
  }

  private buildBackground(): void {
    // --- Synthwave sun ------------------------------------------------------
    this.sun = this.add.image(GAME_WIDTH / 2, 190, "sun").setDepth(0.5).setAlpha(0.95);

    // --- Twinkling stars -----------------------------------------------------
    this.stars = [];
    const rng = mulberry32(this.level?.seed ?? 1337);
    for (let i = 0; i < 70; i++) {
      const star = this.add
        .image(rng() * GAME_WIDTH, rng() * 320, "star")
        .setDepth(0.5)
        .setAlpha(0.2 + rng() * 0.6)
        .setScale(0.5 + rng() * 1.2);
      this.stars.push(star);
    }

    // --- Scrolling synthwave grid -------------------------------------------
    this.grid = this.add.graphics({ x: 0, y: 0 }).setDepth(1);
    this.grid.fillStyle(0x1a0b33, 0.55);
    const step = 48;
    for (let y = -step; y <= GAME_HEIGHT; y += step) {
      this.grid.fillRect(0, y, GAME_WIDTH, 2);
    }

    // Lane columns.
    this.laneLines = this.add.graphics().setDepth(2);
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      this.laneLines.lineStyle(2, laneColor(lane), 0.28);
      this.laneLines.lineBetween(laneX(lane), 0, laneX(lane), GAME_HEIGHT);
    }

    // Hit zone brackets.
    this.hitZone = this.add.graphics().setDepth(3);
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const x = laneX(lane);
      this.hitZone.lineStyle(3, laneColor(lane), 0.9);
      this.hitZone.lineBetween(x - 40, HIT_Y - 26, x - 40, HIT_Y);
      this.hitZone.lineBetween(x + 40, HIT_Y - 26, x + 40, HIT_Y);
      this.hitZone.lineBetween(x - 40, HIT_Y, x + 40, HIT_Y);
    }

    // Fullscreen flash layers.
    this.beatGlow = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0).setDepth(9);
    this.hurtFlash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, MISS_COLOR, 0).setDepth(9);

    // Soft vignette on top of everything (below UI).
    this.vignette = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "vignette").setDepth(9.5).setAlpha(0.9);
  }

  // ---------------------------------------------------------------------------
  // Run lifecycle
  // ---------------------------------------------------------------------------

  startRun(slug: string, options: RunOptions = {}): void {
    const level = getLevelDef(slug, options.qa ? { truncateBars: 8 } : undefined);
    if (!level) {
      console.error(`Unknown level: ${slug}`);
      return;
    }
    // Restarting from the pause overlay: the scene may still be paused.
    if (this.scene.isPaused()) this.scene.resume();
    this.teardownRun();
    this.level = level;
    this.options = options;
    this.autoplay = options.autoplay ?? useSettingsStore.getState().autoplay;

    this.notes = level.map.notes.map((note) => ({ note, timeMs: 0, enemy: null, judged: false }));
    // Precompute absolute hit times (includes calibration).
    this.clock = new BeatClock({ bpm: level.bpm, offsetMs: level.map.offsetMs });
    this.clock.start();
    const calibration = useSettingsStore.getState().calibrationMs;
    for (const ns of this.notes) {
      ns.timeMs = this.clock.msForBeat(ns.note.beat) + calibration;
    }

    this.tracker = new ScoreTracker({ maxHealth: MAX_HEALTH });
    this.judgmentId = 0;
    this.lastWholeBeat = -1;
    this.perfectStreak = 0;
    this.lastMilestoneCombo = 0;

    useGameStore.setState({
      screen: "playing",
      level,
      levelSlug: slug,
      runOptions: options,
      result: null,
    });
    useGameStore.getState().resetHud();

    this.running = true;
    this.cameras.main.shake(0, 0);
    audioEngine.ensureStarted();
    const trackId = useSettingsStore.getState().trackForLevel(slug, level.defaultTrack);
    audioEngine.startMusic(level, trackId);
  }

  /** Stop the current run and return to idle (menu). */
  teardownRun(): void {
    this.running = false;
    audioEngine.stopMusic();
    for (const ns of this.notes) ns.enemy?.destroy();
    this.notes = [];
  }

  /** Current run context (used by GameBridge.restart). */
  currentRun(): { levelSlug: string | null; runOptions: RunOptions } {
    return {
      levelSlug: this.level?.slug ?? null,
      runOptions: this.options,
    };
  }

  setRunPaused(paused: boolean): void {
    if (!this.running) return;
    if (paused) {
      this.clock.pause();
      audioEngine.pauseMusic();
      this.scene.pause();
    } else {
      this.clock.resume();
      audioEngine.resumeMusic();
      this.scene.resume();
    }
  }

  // ---------------------------------------------------------------------------
  // Update loop
  // ---------------------------------------------------------------------------

  update(_time: number, delta: number): void {
    if (!this.running) return;

    const now = this.clock.elapsedMs();
    const beatMs = this.clock.beatMs;

    // --- Background scroll + beat pulse -------------------------------------
    // Grid scrolls 60px per beat — speed tracks the music.
    this.gridOffset = (this.gridOffset + (delta / beatMs) * 60) % 48;
    this.grid.y = -this.gridOffset;
    const wholeBeat = Math.floor(this.clock.currentBeat());
    if (wholeBeat !== this.lastWholeBeat) {
      this.lastWholeBeat = wholeBeat;
      this.pulseBeat();
    }

    // --- Autoplay bot (QA / demo) ---------------------------------------------
    // Runs BEFORE the miss-check so the bot can never be beaten to a note by
    // a frame gap (it hits the moment a note enters its hittable window).
    if (this.autoplay) this.botTick(now);

    // --- Spawn + move + miss-check enemies -----------------------------------
    for (const ns of this.notes) {
      if (ns.judged) continue;
      const approachMs = this.level!.map.approachBeats * beatMs;

      if (!ns.enemy && now >= ns.timeMs - approachMs) {
        ns.enemy = new Enemy(
          this,
          laneX(ns.note.lane),
          ns.note.lane,
          ns.note.kind,
          laneColor(ns.note.lane),
        );
      }

      if (ns.enemy) {
        const progress = Phaser.Math.Clamp((now - (ns.timeMs - approachMs)) / approachMs, 0, 1);
        ns.enemy.setProgress(progress, now);

        // Miss deadline passed — the enemy reaches the player. The autoplay
        // bot gets a grace extension so headless/CI frame stalls can't
        // produce misses (it then hits with a clamped GOOD judgment).
        const missDeadline = ns.timeMs + (this.autoplay ? BOT_GRACE_MS : JUDGMENT_WINDOWS.goodMs);
        if (now >= missDeadline) {
          ns.judged = true;
          this.applyJudgment("miss", ns);
          ns.enemy = null;
        }
      }
    }

    this.player.idle(now);
    this.pads.tick();

    // Star twinkle (cheap: 70 sprites, sin alpha).
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      if (!star) continue;
      star.setAlpha(0.18 + 0.5 * Math.abs(Math.sin(now / 700 + i * 1.7)));
    }

    // --- Progress push (throttled) --------------------------------------------
    if (now - this.lastProgressPush > 200) {
      this.lastProgressPush = now;
      const total = this.level!.map.offsetMs + this.level!.map.bars * 4 * beatMs;
      useGameStore.setState({
        hud: { ...useGameStore.getState().hud, progress: Math.min(1, now / total) },
      });
    }

    // --- Run completion --------------------------------------------------------
    const lastNoteMs = this.notes.length ? this.notes[this.notes.length - 1]!.timeMs : 0;
    if (now > lastNoteMs + 2000 || this.tracker.isDead()) {
      this.finishRun();
    }
  }

  private pulseBeat(): void {
    this.pads.pulse();
    this.tweens.add({
      targets: this.beatGlow,
      fillAlpha: 0.05,
      duration: 90,
      yoyo: true,
      onComplete: () => this.beatGlow.setFillStyle(0xffffff, 0),
    });
  }

  // ---------------------------------------------------------------------------
  // Input handling
  // ---------------------------------------------------------------------------

  private handlePointerTap(pointer: Phaser.Input.Pointer): void {
    const now = this.clock.elapsedMs();
    // Direct enemy tap: hit-test against active enemies within the window.
    for (const ns of this.notes) {
      if (ns.judged || !ns.enemy) continue;
      if (!isWithinWindow(ns.timeMs, now)) continue;
      const dx = pointer.x - ns.enemy.x;
      const dy = pointer.y - ns.enemy.y;
      if (dx * dx + dy * dy <= ns.enemy.hitRadius * ns.enemy.hitRadius) {
        const result = judgeNote(ns.timeMs, now);
        ns.judged = true;
        this.applyJudgment(result.type, ns);
        ns.enemy.die();
        ns.enemy = null;
        return;
      }
    }
    // Fall back to lane pads (HitPads zones already handle pad taps).
  }

  /**
   * Press/tap a lane: judge the nearest unhit note in that lane.
   * `bot` = autoplay mode: judgments are clamped to GOOD at worst so
   * frame-rate hiccups can never cost the QA bot health or accuracy.
   */
  hitLane(lane: number, bot = false): void {
    this.pads.flash(lane);
    if (!this.running) return;
    const now = this.clock.elapsedMs();

    let best: ActiveNote | null = null;
    let bestDelta = Infinity;
    for (const ns of this.notes) {
      if (ns.judged || ns.note.lane !== lane) continue;
      if (!isWithinWindow(ns.timeMs, now)) continue;
      const delta = Math.abs(now - ns.timeMs);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = ns;
      }
    }
    if (!best) {
      // Empty press: tiny feedback on the pad only.
      return;
    }

    const raw = judgeNote(best.timeMs, now);
    const type = bot && raw.type === "miss" ? "good" : raw.type;
    best.judged = true;
    this.applyJudgment(type, best);
    if (best.enemy) {
      const enemy = best.enemy;
      best.enemy = null;
      enemy.die();
    }
  }

  // ---------------------------------------------------------------------------
  // Judgment pipeline
  // ---------------------------------------------------------------------------

  private applyJudgment(type: JudgmentType, ns: ActiveNote): void {
    const base = baseScoreFor(ns.note.kind);
    const gained = this.tracker.apply(type, base);
    const summary = this.tracker.summary();

    const x = laneX(ns.note.lane);
    const heavy = ns.note.kind === "heavy";

    if (type === "miss") {
      audioEngine.miss();
      this.popup(JUDGMENT_LABEL.miss, x, HIT_Y - 70, MISS_COLOR);
      this.player.hurt();
      this.cameras.main.shake(140, 0.006);
      this.tweens.add({
        targets: this.hurtFlash,
        fillAlpha: 0.28,
        duration: 90,
        yoyo: true,
        onComplete: () => this.hurtFlash.setFillStyle(MISS_COLOR, 0),
      });
    } else {
      if (type === "perfect") audioEngine.slap(heavy);
      else audioEngine.slap(false);

      this.popup(JUDGMENT_LABEL[type], x, HIT_Y - 70, JUDGMENT_COLOR[type]);
      this.killEmitter.explode(heavy ? 20 : 12, x, HIT_Y - 20);

      // PERFECT juice: sparkle chime + expanding shockwave ring.
      if (type === "perfect") {
        audioEngine.perfectSpark();
        this.shockwave(x, HIT_Y - 24, JUDGMENT_COLOR.perfect);
        this.perfectStreak += 1;
        if (this.perfectStreak === 5) {
          audioEngine.streakCall(0);
          this.popup("ON FIRE!", GAME_WIDTH / 2, HIT_Y - 170, 0xff8a3d, 34);
        } else if (this.perfectStreak === 10 || this.perfectStreak % 10 === 0) {
          audioEngine.streakCall(Math.floor(this.perfectStreak / 10));
          this.popup("UNSTOPPABLE!", GAME_WIDTH / 2, HIT_Y - 170, 0xff4d6d, 36);
        }
      } else {
        this.perfectStreak = 0;
      }

      // Combo milestone ladder: chime rises with the combo tier.
      const isMilestone =
        summary.combo === 10 ||
        summary.combo === 25 ||
        summary.combo === 50 ||
        summary.combo === 75 ||
        summary.combo === 100 ||
        (summary.combo > 100 && summary.combo % 50 === 0);
      if (isMilestone && summary.combo !== this.lastMilestoneCombo) {
        this.lastMilestoneCombo = summary.combo;
        audioEngine.milestone(summary.combo);
        this.popup(
          `COMBO ×${summary.combo}`,
          GAME_WIDTH / 2,
          HIT_Y - 160,
          summary.combo >= 50 ? 0xffd54a : ACCENT_COLOR,
          summary.combo >= 50 ? 36 : 30,
        );
      }

      this.player.punch(ns.note.lane);
    }

    void gained;
    this.judgmentId += 1;
    useGameStore.setState({
      hud: {
        score: summary.score,
        combo: summary.combo,
        maxCombo: summary.maxCombo,
        accuracy: summary.accuracy,
        health: summary.health,
        judgment: { type, id: this.judgmentId },
        progress: useGameStore.getState().hud.progress,
        perfectStreak: this.perfectStreak,
      },
    });
  }

  /** Expanding ring shockwave for PERFECT kills. */
  private shockwave(x: number, y: number, color: number): void {
    const ring = this.add
      .image(x, y, "ring")
      .setDepth(7)
      .setTint(color)
      .setScale(0.3)
      .setAlpha(0.95);
    this.tweens.add({
      targets: ring,
      scale: 2.4,
      alpha: 0,
      duration: 340,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  /**
   * Frame-rate-independent autoplay: a note is slapped the moment it enters
   * its hittable window (`timeMs - goodMs`), so even big frame gaps in
   * headless/CI environments can't cause misses. At 60fps hits land as
   * PERFECT/GREAT; under heavy jank the judgment degrades gracefully.
   */
  private botTick(now: number): void {
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      let target: ActiveNote | null = null;
      let earliest = Infinity;
      for (const ns of this.notes) {
        if (ns.judged || ns.note.lane !== lane) continue;
        // Hittable now (with the bot grace extension for late catch-up).
        if (now < ns.timeMs - JUDGMENT_WINDOWS.goodMs) continue;
        if (now > ns.timeMs + JUDGMENT_WINDOWS.goodMs + BOT_GRACE_MS) continue;
        if (ns.timeMs < earliest) {
          earliest = ns.timeMs;
          target = ns;
        }
      }
      if (target) this.hitLane(lane, true);
    }
  }

  // ---------------------------------------------------------------------------
  // Run end
  // ---------------------------------------------------------------------------

  private finishRun(): void {
    if (!this.running) return;
    this.running = false;
    audioEngine.stopMusic();

    const summary = this.tracker.summary();
    const level = this.level!;
    const autoplay = this.autoplay;
    const durationMs = this.clock.elapsedMs();

    const isNewBest = !autoplay && maybeSaveLocalBest(level.slug, summary.score);

    const result = {
      levelSlug: level.slug,
      levelTitle: level.title,
      difficulty: level.difficulty as Difficulty,
      score: summary.score,
      maxCombo: summary.maxCombo,
      accuracy: summary.accuracy,
      perfects: summary.perfects,
      greats: summary.greats,
      goods: summary.goods,
      misses: summary.misses,
      durationMs,
      isNewBest,
      rank: null,
      eligible: !autoplay,
      submitted: false,
      autoplay,
    };

    useGameStore.setState({ screen: "gameover", result });

    if (!autoplay && summary.misses < level.map.notes.length) {
      void this.submitResult(result);
    }
  }

  private async submitResult(result: NonNullable<ReturnType<typeof useGameStore.getState>["result"]>): Promise<void> {
    const store = useGameStore.getState();
    const response = await submitScoreResilient({
      levelSlug: result.levelSlug,
      difficulty: result.difficulty,
      score: result.score,
      maxCombo: result.maxCombo,
      perfects: result.perfects,
      greats: result.greats,
      goods: result.goods,
      misses: result.misses,
      accuracy: Number(result.accuracy.toFixed(2)),
      durationMs: result.durationMs,
      guestId: store.guestId || undefined,
      autoplay: false,
    });

    if (response) {
      useGameStore.setState({
        result: { ...useGameStore.getState().result!, rank: response.rank, submitted: true },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // FX helpers
  // ---------------------------------------------------------------------------

  private popup(text: string, x: number, y: number, color: number, size = 26): void {
    const t = this.add
      .text(x, y, text, {
        fontFamily: '"Orbitron", monospace',
        fontSize: `${size}px`,
        color: `#${color.toString(16).padStart(6, "0")}`,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.tweens.add({
      targets: t,
      y: y - 46,
      alpha: 0,
      scale: { from: 0.85, to: 1.15 },
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy(),
    });
  }
}
