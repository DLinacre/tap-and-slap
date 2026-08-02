/**
 * BeatClock — a monotonic musical timeline.
 *
 * The clock is the single source of truth for gameplay timing. It is anchored
 * to `performance.now()` so visuals and the Web Audio scheduler stay in
 * perfect lock-step (both derive absolute ms from the same epoch), and it is
 * pausable for the pause overlay.
 *
 * `now` is injectable for deterministic unit tests.
 */

export interface BeatClockOptions {
  bpm: number;
  offsetMs?: number;
  now?: () => number;
}

export class BeatClock {
  readonly bpm: number;
  readonly offsetMs: number;
  readonly beatMs: number;

  private readonly now: () => number;
  private baseMs = 0;
  private pausedTotalMs = 0;
  private pauseStartMs: number | null = null;
  private started = false;

  constructor(opts: BeatClockOptions) {
    this.bpm = opts.bpm;
    this.offsetMs = opts.offsetMs ?? 0;
    this.beatMs = 60_000 / this.bpm;
    this.now = opts.now ?? (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
  }

  get isStarted(): boolean {
    return this.started;
  }

  get isPaused(): boolean {
    return this.pauseStartMs !== null;
  }

  /** Anchor the timeline to "now". */
  start(): void {
    this.baseMs = this.now();
    this.pausedTotalMs = 0;
    this.pauseStartMs = null;
    this.started = true;
  }

  pause(): void {
    if (this.pauseStartMs === null) this.pauseStartMs = this.now();
  }

  resume(): void {
    if (this.pauseStartMs !== null) {
      this.pausedTotalMs += this.now() - this.pauseStartMs;
      this.pauseStartMs = null;
    }
  }

  /** Milliseconds elapsed on the musical timeline (pauses excluded). */
  elapsedMs(): number {
    if (!this.started) return 0;
    const effective = this.pauseStartMs ?? this.now();
    return effective - this.baseMs - this.pausedTotalMs;
  }

  /** Current song position in beats (0 = first beat). */
  currentBeat(): number {
    return (this.elapsedMs() - this.offsetMs) / this.beatMs;
  }

  /** Convert a beat number to timeline ms. */
  msForBeat(beat: number): number {
    return this.offsetMs + beat * this.beatMs;
  }

  /** Convert timeline ms to a beat number. */
  beatForMs(ms: number): number {
    return (ms - this.offsetMs) / this.beatMs;
  }
}
