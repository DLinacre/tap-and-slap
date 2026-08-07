/**
 * Procedural synthwave audio engine (Web Audio API).
 *
 * No audio assets ship with the game: every track is synthesized at runtime
 * from the beat map (see tracks.ts for the fight-music registry). Sync model:
 * all scheduling uses the ABSOLUTE AudioContext clock (`ctxBase` = ctx time at
 * song start; event `when = ctxBase + songMs/1000`), so scheduled times are
 * always non-negative and visuals (BeatClock) can be aligned to the same song
 * position without drift.
 *
 * Mix chain (louder, club-ready):
 *   voice → musicBus/sfxBus → masterGain → compressor → limiter → destination
 *   Kicks duck the music bus for a sidechain "pump" feel.
 */

import { LevelDef } from "@/game/levels/types";
import { useSettingsStore } from "@/store/settings-store";
import {
  SongEvent,
  TrackId,
  buildSong,
  midiToFreq,
  previewMap,
  resolveTrackId,
} from "./tracks";

// ---------------------------------------------------------------------------
// Synth voices
// ---------------------------------------------------------------------------

interface VoiceCtx {
  ctx: AudioContext;
  out: GainNode;
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Louder kick: layered sine drop + click transient. */
function playKick(v: VoiceCtx, when: number, velocity: number): void {
  const osc = v.ctx.createOscillator();
  const gain = v.ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, when);
  osc.frequency.exponentialRampToValueAtTime(42, when + 0.12);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(velocity * 1.05, when + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.28);
  osc.connect(gain).connect(v.out);
  osc.start(when);
  osc.stop(when + 0.32);

  // Click transient for attack definition.
  const click = v.ctx.createBufferSource();
  click.buffer = noiseBuffer(v.ctx);
  const hp = v.ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1200;
  const cg = v.ctx.createGain();
  cg.gain.setValueAtTime(velocity * 0.35, when);
  cg.gain.exponentialRampToValueAtTime(0.001, when + 0.03);
  click.connect(hp).connect(cg).connect(v.out);
  click.start(when);
  click.stop(when + 0.05);
}

function playSnare(v: VoiceCtx, when: number, velocity: number): void {
  const noise = v.ctx.createBufferSource();
  noise.buffer = noiseBuffer(v.ctx);
  const bp = v.ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1900;
  bp.Q.value = 0.9;
  const gain = v.ctx.createGain();
  gain.gain.setValueAtTime(velocity * 0.8, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
  noise.connect(bp).connect(gain).connect(v.out);
  noise.start(when);
  noise.stop(when + 0.22);

  const osc = v.ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, when);
  osc.frequency.exponentialRampToValueAtTime(160, when + 0.1);
  const og = v.ctx.createGain();
  og.gain.setValueAtTime(velocity * 0.4, when);
  og.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
  osc.connect(og).connect(v.out);
  osc.start(when);
  osc.stop(when + 0.14);
}

/** Snappy crowd clap (two noise bursts). */
function playClap(v: VoiceCtx, when: number, velocity: number): void {
  for (const delay of [0, 0.012]) {
    const noise = v.ctx.createBufferSource();
    noise.buffer = noiseBuffer(v.ctx);
    const bp = v.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1400;
    bp.Q.value = 1.4;
    const gain = v.ctx.createGain();
    const t = when + delay;
    gain.gain.setValueAtTime(velocity * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    noise.connect(bp).connect(gain).connect(v.out);
    noise.start(t);
    noise.stop(t + 0.1);
  }
}

/** Epic floor tom. */
function playTom(v: VoiceCtx, when: number, velocity: number): void {
  const osc = v.ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(130, when);
  osc.frequency.exponentialRampToValueAtTime(55, when + 0.2);
  const gain = v.ctx.createGain();
  gain.gain.setValueAtTime(velocity * 0.9, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.3);
  osc.connect(gain).connect(v.out);
  osc.start(when);
  osc.stop(when + 0.35);
}

function playHat(v: VoiceCtx, when: number, velocity: number, open = false): void {
  const noise = v.ctx.createBufferSource();
  noise.buffer = noiseBuffer(v.ctx);
  const hp = v.ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7500;
  const gain = v.ctx.createGain();
  const dur = open ? 0.35 : 0.055;
  gain.gain.setValueAtTime(velocity * 0.4, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
  noise.connect(hp).connect(gain).connect(v.out);
  noise.start(when);
  noise.stop(when + dur + 0.02);
}

/** Bigger bass: detuned saw stack through a lowpass. */
function playBass(v: VoiceCtx, when: number, note: number, velocity: number, durationBeats?: number): void {
  const dur = (durationBeats ?? 0.5) * 0.9;
  const freq = midiToFreq(note);
  const lp = v.ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(1400, when);
  lp.frequency.exponentialRampToValueAtTime(320, when + Math.max(0.2, dur * 0.6));
  const gain = v.ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(velocity * 0.3, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
  for (const detune of [-7, 7]) {
    const osc = v.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(lp);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }
  lp.connect(gain).connect(v.out);
}

/** Lead: bright square with echo-ish double. */
function playLead(v: VoiceCtx, when: number, note: number, velocity: number, durationBeats?: number): void {
  const dur = Math.max(0.12, (durationBeats ?? 0.25) * 0.9);
  const osc = v.ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = midiToFreq(note);
  const lp = v.ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3400;
  const gain = v.ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(velocity * 0.09, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
  osc.connect(lp).connect(gain).connect(v.out);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

/** Brass-like stab for anthem moments (detuned saw chord). */
function playStab(v: VoiceCtx, when: number, note: number, velocity: number): void {
  for (const [i, off] of [0, 4, 7, 12].entries()) {
    const osc = v.ctx.createOscillator();
    osc.type = i === 0 ? "sawtooth" : "square";
    osc.frequency.value = midiToFreq(note + off);
    osc.detune.value = i % 2 === 0 ? -6 : 6;
    const bp = v.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800 + i * 220;
    bp.Q.value = 0.8;
    const gain = v.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.11, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.4);
    osc.connect(bp).connect(gain).connect(v.out);
    osc.start(when);
    osc.stop(when + 0.45);
  }
}

function playPad(v: VoiceCtx, when: number, note: number, until: number): void {
  const tones = [note, note + 4, note + 7];
  for (const [i, t] of tones.entries()) {
    const osc = v.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = midiToFreq(t);
    osc.detune.value = (i - 1) * 8;
    const lp = v.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 750 + i * 240;
    const gain = v.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(0.02, when + 0.45);
    gain.gain.setValueAtTime(0.02, until - 0.1);
    gain.gain.linearRampToValueAtTime(0.0001, until);
    osc.connect(lp).connect(gain).connect(v.out);
    osc.start(when);
    osc.stop(until + 0.02);
  }
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

const LOOKAHEAD_MS = 250;
const TICK_MS = 25;
/** Max device output latency we compensate for (ms). */
const MAX_LATENCY_MS = 200;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  private events: SongEvent[] = [];
  private nextEventIdx = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** AudioContext time corresponding to song time 0 (absolute ctx clock). */
  private ctxBase = 0;
  /** Device output latency in ms — subtracted from scheduling so the beat is
   *  HEARD exactly when the visual hit line is reached. */
  private latencyMs = 0;
  private musicPlaying = false;
  private barMs = 2000; // set per level on startMusic

  /** Anchors mapping the performance clock to the AudioContext clock (for
   *  scheduling one-shot sounds at a specific performance-clock time, e.g.
   *  the timing sync test). Set when the context is created. */
  private perfAnchorMs: number | null = null;
  private ctxAnchor = 0;

  /** Create/resume the AudioContext. Must be called from a user gesture. */
  ensureStarted(): boolean {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return false;
        this.ctx = new Ctor();
        this.perfAnchorMs = performance.now();
        this.ctxAnchor = this.ctx.currentTime;
        // Output latency (Bluetooth/WASAPI/etc.) is the gap between a
        // scheduled ctx time and when the sound actually reaches the ear.
        // We compensate for it in scheduleEvent so the heard beat aligns with
        // the visual hit line — otherwise every by-ear tap lands late.
        this.latencyMs = Math.min(
          MAX_LATENCY_MS,
          Math.max(0, ((this.ctx as AudioContext & { outputLatency?: number }).outputLatency ??
            (this.ctx as AudioContext & { baseLatency?: number }).baseLatency ??
            0) * 1000),
        );
        this.noise = noiseBuffer(this.ctx);

        // Master chain: gain → compressor → limiter → destination.
        const master = this.ctx.createGain();
        master.gain.value = useSettingsStore.getState().masterVolume;

        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 6;
        comp.ratio.value = 5;
        comp.attack.value = 0.004;
        comp.release.value = 0.16;

        const limiter = this.ctx.createDynamicsCompressor();
        limiter.threshold.value = -6;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.002;
        limiter.release.value = 0.1;

        master.connect(comp);
        comp.connect(limiter);
        limiter.connect(this.ctx.destination);

        this.masterGain = master;
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = useSettingsStore.getState().musicVolume;
        this.musicBus.connect(master);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = useSettingsStore.getState().sfxVolume;
        this.sfxBus.connect(master);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      // resume() is asynchronous — the state flips a moment after the call,
      // so returning `state === "running"` right here would race and report
      // "audio unavailable" on the very first gesture. Treat an initiated
      // resume as success; the graph plays once the state flips.
      return this.ctx.state === "running" || this.ctx.state === "suspended";
    } catch {
      return false;
    }
  }

  /** Push live volume settings into the graph (call on settings change). */
  syncVolumes(): void {
    const s = useSettingsStore.getState();
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(s.masterVolume, this.ctx?.currentTime ?? 0, 0.03);
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(s.musicVolume, this.ctx?.currentTime ?? 0, 0.03);
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(s.sfxVolume, this.ctx?.currentTime ?? 0, 0.03);
  }

  get isRunning(): boolean {
    return this.ctx?.state === "running";
  }

  /**
   * Schedule a short metronome click so it is HEARD at (approximately) the
   * given performance-clock time — the same latency-compensated model used
   * for gameplay scheduling. Used by the timing Sync Test.
   */
  syncClickAt(perfTimeMs: number): void {
    if (!this.ctx || !this.sfxBus || this.perfAnchorMs === null) return;
    const when =
      this.ctxAnchor + (perfTimeMs - this.perfAnchorMs) / 1000 - this.latencyMs / 1000;
    if (when < this.ctx.currentTime) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.22, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.09);
    osc.connect(gain).connect(this.sfxBus);
    osc.start(when);
    osc.stop(when + 0.1);
  }

  private voice(): VoiceCtx {
    return { ctx: this.ctx!, out: this.musicBus! };
  }

  // -------------------------------------------------------------------------
  // Music scheduling
  // -------------------------------------------------------------------------

  /** Start playing a track for a level. Call after ensureStarted(). */
  startMusic(level: LevelDef, trackId?: TrackId): void {
    this.stopMusic();
    if (!this.ctx) return;
    const track = resolveTrackId(trackId ?? level.defaultTrack);
    this.events = buildSong(level, track);
    this.nextEventIdx = 0;
    this.barMs = 4 * (60_000 / level.bpm);
    // Song time 0 maps to a moment just after "now" on the absolute
    // AudioContext clock. Scheduling uses ONLY ctx time — never the
    // performance.now() epoch — so scheduled times are always non-negative.
    this.ctxBase = this.ctx.currentTime + 0.05;
    this.musicPlaying = true;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  /** 4-bar menu preview of a track. */
  previewTrack(trackId: TrackId): void {
    if (!this.ctx) return;
    this.stopMusic();
    const previewLevel: LevelDef = {
      slug: "__preview__",
      title: "Preview",
      artist: "Tap & Slap Records",
      description: "",
      difficulty: "EASY",
      bpm: 116,
      seed: 7,
      palette: { bg: 0x0a0118, accent: 0xff2ec4, lanes: [0x2f6bff, 0xffd23f, 0xff4d6d, 0x2ee66d] },
      map: previewMap(116),
    };
    this.events = buildSong(previewLevel, trackId).filter((e) => e.timeMs < 16 * (60_000 / 116));
    this.nextEventIdx = 0;
    this.barMs = 4 * (60_000 / 116);
    this.ctxBase = this.ctx.currentTime + 0.05;
    this.musicPlaying = true;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  pauseMusic(): void {
    this.stopTimer();
    if (this.ctx && this.ctx.state === "running") void this.ctx.suspend();
    this.musicPlaying = false;
  }

  resumeMusic(): void {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    // NOTE: ctxBase is intentionally NOT re-based. A suspended AudioContext
    // freezes currentTime, so on resume it continues from the pause point and
    // the original (songTime → ctxTime) mapping stays valid.
    if (this.musicPlaying && this.timer === null) {
      this.timer = setInterval(() => this.tick(), TICK_MS);
    }
  }

  stopMusic(): void {
    this.stopTimer();
    this.events = [];
    this.nextEventIdx = 0;
    this.musicPlaying = false;
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    if (!this.ctx) return;
    // Song position from the ABSOLUTE ctx clock: never negative.
    const songMs = (this.ctx.currentTime - this.ctxBase) * 1000;
    const horizon = songMs + LOOKAHEAD_MS;
    while (this.nextEventIdx < this.events.length) {
      const ev = this.events[this.nextEventIdx]!;
      if (ev.timeMs > horizon) break;
      this.scheduleEvent(ev);
      this.nextEventIdx += 1;
    }
  }

  private scheduleEvent(ev: SongEvent): void {
    if (!this.ctx || !this.musicBus) return;
    // Absolute ctx time — always >= ctxBase > 0.
    //
    // Sync model: `ctxBase = ctx.currentTime + 0.05`, so song time X is
    // *scheduled* at ctxBase + X/1000 (50ms after song start on the wall
    // clock). To make it *heard* at exactly song start + X/1000, we subtract
    // both that 50ms headroom and the device output latency.
    const when = Math.max(
      this.ctx.currentTime,
      this.ctxBase + (ev.timeMs - 50 - this.latencyMs) / 1000,
    );
    const vel = ev.velocity ?? 0.8;
    switch (ev.kind) {
      case "kick":
        playKick(this.voice(), when, vel);
        this.pumpMusicBus(when); // sidechain pump on every kick
        break;
      case "snare":
        playSnare(this.voice(), when, vel);
        break;
      case "clap":
        playClap(this.voice(), when, vel);
        break;
      case "tom":
        playTom(this.voice(), when, vel);
        break;
      case "hat":
        playHat(this.voice(), when, vel);
        break;
      case "hatOpen":
        playHat(this.voice(), when, vel, true);
        break;
      case "bass":
        playBass(this.voice(), when, ev.note ?? 45, vel, ev.durationBeats);
        break;
      case "lead":
        playLead(this.voice(), when, ev.note ?? 69, vel, ev.durationBeats);
        break;
      case "stab":
        playStab(this.voice(), when, ev.note ?? 69, vel);
        break;
      case "padOn":
        playPad(this.voice(), when, ev.note ?? 45, Math.max(when + 0.6, when + this.barMs));
        break;
      case "padOff":
        break;
    }
  }

  /** Duck the music bus briefly after each kick (club sidechain feel). */
  private pumpMusicBus(when: number): void {
    if (!this.musicBus || !this.ctx) return;
    const base = useSettingsStore.getState().musicVolume;
    const g = this.musicBus.gain;
    g.cancelScheduledValues(when);
    g.setTargetAtTime(base * 0.5, when, 0.015);
    g.setTargetAtTime(base, when + 0.11, 0.16);
  }

  // -------------------------------------------------------------------------
  // SFX (one-shots)
  // -------------------------------------------------------------------------

  private sfx(fn: (v: VoiceCtx, when: number) => void): void {
    if (!this.ctx || !this.sfxBus) return;
    const when = this.ctx.currentTime;
    fn({ ctx: this.ctx, out: this.sfxBus }, when);
  }

  /** PUNCH — big body slap: noise burst + sub thump + pitch drop. */
  slap(heavy = false): void {
    this.sfx((v, when) => {
      const noise = v.ctx.createBufferSource();
      noise.buffer = this.noise ?? noiseBuffer(v.ctx);
      const bp = v.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(heavy ? 900 : 1500, when);
      bp.frequency.exponentialRampToValueAtTime(280, when + 0.1);
      bp.Q.value = 1.1;
      const gain = v.ctx.createGain();
      gain.gain.setValueAtTime(heavy ? 0.95 : 0.8, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.13);
      noise.connect(bp).connect(gain).connect(v.out);
      noise.start(when);
      noise.stop(when + 0.15);

      const osc = v.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(heavy ? 300 : 430, when);
      osc.frequency.exponentialRampToValueAtTime(65, when + 0.12);
      const og = v.ctx.createGain();
      og.gain.setValueAtTime(0.4, when);
      og.gain.exponentialRampToValueAtTime(0.001, when + 0.13);
      osc.connect(og).connect(v.out);
      osc.start(when);
      osc.stop(when + 0.15);

      // Sub thump for weight.
      const sub = v.ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(110, when);
      sub.frequency.exponentialRampToValueAtTime(50, when + 0.1);
      const sg = v.ctx.createGain();
      sg.gain.setValueAtTime(0.55, when);
      sg.gain.exponentialRampToValueAtTime(0.001, when + 0.14);
      sub.connect(sg).connect(v.out);
      sub.start(when);
      sub.stop(when + 0.16);
    });
  }

  miss(): void {
    this.sfx((v, when) => {
      const osc = v.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, when);
      osc.frequency.exponentialRampToValueAtTime(52, when + 0.38);
      const gain = v.ctx.createGain();
      gain.gain.setValueAtTime(0.45, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.42);
      const lp = v.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 800;
      osc.connect(lp).connect(gain).connect(v.out);
      osc.start(when);
      osc.stop(when + 0.48);
    });
  }

  ui(): void {
    this.sfx((v, when) => {
      const osc = v.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, when);
      osc.frequency.exponentialRampToValueAtTime(990, when + 0.08);
      const gain = v.ctx.createGain();
      gain.gain.setValueAtTime(0.25, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
      osc.connect(gain).connect(v.out);
      osc.start(when);
      osc.stop(when + 0.14);
    });
  }

  /**
   * Combo milestone chime — an ascending pentatonic ladder that rises with
   * the combo so every Perfect milestone feels like progress.
   */
  milestone(combo: number): void {
    // Ladder roots rise with combo tier: 10 → 25 → 50 → 75 → 100 → 150 → …
    const tier = Math.floor(Math.log2(Math.max(1, combo / 10)) + 1);
    const root = 523.25 * Math.pow(1.0595, Math.min(tier, 8) * 2); // C5-based, rising
    const notes = [1, 1.25, 1.5, 2]; // major arpeggio ratios
    this.sfx((v, when) => {
      for (const [i, ratio] of notes.entries()) {
        const osc = v.ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = root * ratio;
        const gain = v.ctx.createGain();
        const t = when + i * 0.06;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain).connect(v.out);
        osc.start(t);
        osc.stop(t + 0.24);
      }
    });
  }

  /** PERFECT-hit sparkle (short bright arpeggio, subtle). */
  perfectSpark(): void {
    this.sfx((v, when) => {
      for (const [i, f] of [1046.5, 1318.5, 1568].entries()) {
        const osc = v.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const gain = v.ctx.createGain();
        const t = when + i * 0.035;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain).connect(v.out);
        osc.start(t);
        osc.stop(t + 0.2);
      }
    });
  }

  /** Streak announcements (ON FIRE / UNSTOPPABLE) — quick brass hit. */
  streakCall(tier: number): void {
    this.sfx((v, when) => {
      const root = 392 * Math.pow(1.0595, Math.min(tier, 10) * 2);
      for (const off of [0, 4, 7, 12]) {
        const osc = v.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = root * Math.pow(2, off / 12);
        osc.detune.value = (off % 2 === 0 ? -5 : 5);
        const bp = v.ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1600;
        const gain = v.ctx.createGain();
        gain.gain.setValueAtTime(0.16, when);
        gain.gain.exponentialRampToValueAtTime(0.001, when + 0.5);
        osc.connect(bp).connect(gain).connect(v.out);
        osc.start(when);
        osc.stop(when + 0.55);
      }
    });
  }
}

/** Singleton — import anywhere on the client. */
export const audioEngine = new AudioEngine();
