/**
 * ScoreTracker — score, combo, multiplier, accuracy and health economy.
 *
 * Pure class (no Phaser/React deps) so the full scoring model is unit-testable
 * and identical on server & client (the server re-derives integrity checks
 * from the same math).
 */

import {
  COMBO_MULTIPLIER_CAP,
  COMBO_MULTIPLIER_STEP,
  GREAT_HEALTH_GAIN,
  MAX_HEALTH,
  MISS_HEALTH_COST,
  PERFECT_HEALTH_GAIN,
} from "../config";
import { accuracyWeight, JudgmentType } from "./Judgement";

export interface JudgmentCounts {
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
}

export interface ScoreTrackerOptions {
  maxHealth?: number;
  missHealthCost?: number;
  perfectHealthGain?: number;
  greatHealthGain?: number;
  comboStep?: number;
  multiplierCap?: number;
}

export interface ScoreSummary extends JudgmentCounts {
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number; // 0–100
  health: number;
  multiplier: number;
}

export class ScoreTracker {
  readonly maxHealth: number;
  private readonly missHealthCost: number;
  private readonly perfectHealthGain: number;
  private readonly greatHealthGain: number;
  private readonly comboStep: number;
  private readonly multiplierCap: number;

  private _counts: JudgmentCounts = { perfects: 0, greats: 0, goods: 0, misses: 0 };
  private _score = 0;
  private _combo = 0;
  private _maxCombo = 0;
  private _health: number;

  constructor(opts: ScoreTrackerOptions = {}) {
    this.maxHealth = opts.maxHealth ?? MAX_HEALTH;
    this.missHealthCost = opts.missHealthCost ?? MISS_HEALTH_COST;
    this.perfectHealthGain = opts.perfectHealthGain ?? PERFECT_HEALTH_GAIN;
    this.greatHealthGain = opts.greatHealthGain ?? GREAT_HEALTH_GAIN;
    this.comboStep = opts.comboStep ?? COMBO_MULTIPLIER_STEP;
    this.multiplierCap = opts.multiplierCap ?? COMBO_MULTIPLIER_CAP;
    this._health = this.maxHealth;
  }

  get counts(): JudgmentCounts {
    return { ...this._counts };
  }
  get score(): number {
    return this._score;
  }
  get combo(): number {
    return this._combo;
  }
  get maxCombo(): number {
    return this._maxCombo;
  }
  get health(): number {
    return this._health;
  }

  /** Combo-driven multiplier: +1 every `comboStep`, capped. */
  multiplier(): number {
    return Math.min(this.multiplierCap, 1 + Math.floor(this._combo / this.comboStep));
  }

  /** Raw score gained for a judgment on a note with `baseScore` value. */
  judgmentScore(type: JudgmentType, baseScore: number): number {
    if (type === "miss") return 0;
    const weight = type === "perfect" ? 1 : type === "great" ? 0.7 : 0.4;
    return Math.round(baseScore * weight * this.multiplier());
  }

  /** Map judgment → count key. */
  private countKey(type: JudgmentType): keyof JudgmentCounts {
    switch (type) {
      case "perfect":
        return "perfects";
      case "great":
        return "greats";
      case "good":
        return "goods";
      case "miss":
        return "misses";
    }
  }

  /** Apply a judgment. Returns the score gained (0 for miss). */
  apply(type: JudgmentType, baseScore: number): number {
    this._counts[this.countKey(type)] += 1;

    if (type === "miss") {
      this._combo = 0;
      this._health = Math.max(0, this._health - this.missHealthCost);
      return 0;
    }

    const gained = this.judgmentScore(type, baseScore);
    this._score += gained;
    this._combo += 1;
    this._maxCombo = Math.max(this._maxCombo, this._combo);

    const heal = type === "perfect" ? this.perfectHealthGain : type === "great" ? this.greatHealthGain : 0;
    this._health = Math.min(this.maxHealth, this._health + heal);
    return gained;
  }

  /** Weighted accuracy 0–100 across all judged notes. */
  accuracy(): number {
    const total = this._counts.perfects + this._counts.greats + this._counts.goods + this._counts.misses;
    if (total === 0) return 0;
    const weighted =
      this._counts.perfects * accuracyWeight("perfect") +
      this._counts.greats * accuracyWeight("great") +
      this._counts.goods * accuracyWeight("good");
    return (weighted / total) * 100;
  }

  isDead(): boolean {
    return this._health <= 0;
  }

  summary(): ScoreSummary {
    return {
      ...this._counts,
      score: this._score,
      combo: this._combo,
      maxCombo: this._maxCombo,
      accuracy: this.accuracy(),
      health: this._health,
      multiplier: this.multiplier(),
    };
  }
}
