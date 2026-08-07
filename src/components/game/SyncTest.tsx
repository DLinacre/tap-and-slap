"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine } from "@/game/audio/AudioEngine";
import { useSettingsStore } from "@/store/settings-store";

const BEATS = 8;
const BEAT_MS = 500; // 120 BPM metronome
const COUNT_IN_MS = 600;
const WINDOW_MS = 350;

type Phase = "idle" | "running" | "done";

interface SyncData {
  expected: number[];
  deltas: number[];
  used: Set<number>;
  endAt: number;
}

/**
 * Timing Sync Test — plays 8 metronome beats and measures how late/early the
 * player taps along, then auto-sets the calibration offset. Makes PERFECT
 * achievable by ear on any device (Bluetooth headphones included).
 */
export function SyncTest() {
  const setCalibrationMs = useSettingsStore((s) => s.setCalibrationMs);
  const [phase, setPhase] = useState<Phase>("idle");
  const [detail, setDetail] = useState("");
  const data = useRef<SyncData>({ expected: [], deltas: [], used: new Set(), endAt: 0 });

  const finish = useCallback(() => {
    const { deltas } = data.current;
    if (deltas.length < 3) {
      setPhase("done");
      setDetail("Not enough taps registered — headphones on, then try again.");
      return;
    }
    const sorted = [...deltas].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)]!;
    const rounded = Math.max(-100, Math.min(100, Math.round(median / 5) * 5));
    setCalibrationMs(rounded);
    setPhase("done");
    setDetail(
      rounded === 0
        ? "Spot on — no offset needed."
        : `Saved ${rounded > 0 ? "+" : ""}${rounded}ms offset (your taps ran ${
            median > 0 ? "late" : "early"
          } by ${Math.abs(Math.round(median))}ms).`,
    );
  }, [setCalibrationMs]);
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const handleTap = useCallback(() => {
    const d = data.current;
    if (d.expected.length === 0) return;
    const now = performance.now();
    if (now > d.endAt) return;
    let best = -1;
    let bestDelta = Infinity;
    d.expected.forEach((t, i) => {
      if (d.used.has(i)) return;
      const diff = Math.abs(now - t);
      if (diff < bestDelta) {
        bestDelta = diff;
        best = i;
      }
    });
    if (best === -1 || bestDelta > WINDOW_MS) return;
    d.used.add(best);
    d.deltas.push(now - d.expected[best]!);
    if (d.deltas.length >= BEATS) finishRef.current();
  }, []);
  const handleTapRef = useRef(handleTap);
  handleTapRef.current = handleTap;

  const start = useCallback(() => {
    if (!audioEngine.ensureStarted()) {
      setPhase("done");
      setDetail("Audio isn't available on this device — try another browser.");
      return;
    }
    const now = performance.now();
    const expected: number[] = [];
    for (let i = 0; i < BEATS; i++) expected.push(now + COUNT_IN_MS + i * BEAT_MS);
    expected.forEach((t) => audioEngine.syncClickAt(t));
    data.current = {
      expected,
      deltas: [],
      used: new Set(),
      endAt: now + COUNT_IN_MS + BEATS * BEAT_MS + 700,
    };
    setPhase("running");
    setDetail("Tap along with the 8 beats — pad, click or any key…");
  }, []);

  const cancel = useCallback(() => {
    setPhase("idle");
    setDetail("");
    data.current = { expected: [], deltas: [], used: new Set(), endAt: 0 };
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const onKey = (e: KeyboardEvent) => {
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
        handleTapRef.current();
      }
    };
    const onPointer = () => handleTapRef.current();
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    const timer = window.setTimeout(() => finishRef.current(), data.current.endAt - performance.now());
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      clearTimeout(timer);
    };
  }, [phase]);

  return (
    <div className="sync-test">
      <div className="slider-row">
        <span>Timing sync</span>
        <button
          type="button"
          className="sync-test__btn"
          onClick={() => {
            if (phase === "running") cancel();
            else if (phase === "idle") start();
            else {
              setPhase("idle");
              setDetail("");
            }
          }}
          aria-label={phase === "running" ? "Cancel timing sync test" : "Run timing sync test"}
        >
          {phase === "running" ? "◉ TAP ALONG…" : phase === "done" ? "↻ RUN AGAIN" : "▶ RUN SYNC TEST"}
        </button>
      </div>
      {detail && <p className="sync-test__detail">{detail}</p>}
    </div>
  );
}
