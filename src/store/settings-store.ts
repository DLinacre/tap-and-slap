/**
 * Player settings store — persisted to localStorage via zustand/persist.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TrackId, DEFAULT_TRACK, isTrackId } from "@/game/audio/tracks";

export interface SettingsState {
  masterVolume: number; // 0–1
  musicVolume: number; // 0–1
  sfxVolume: number; // 0–1
  /** ms calibration offset added to note times (positive = hits late). */
  calibrationMs: number;
  /** Hidden QA flag — enables the autoplay bot (also via ?autoplay=1). */
  autoplay: boolean;
  /** Per-level fight-track choice. */
  tracks: Record<string, TrackId>;

  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setCalibrationMs: (v: number) => void;
  setAutoplay: (v: boolean) => void;
  trackForLevel: (levelSlug: string, fallback?: string) => TrackId;
  setTrackForLevel: (levelSlug: string, track: TrackId) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      masterVolume: 0.9,
      musicVolume: 0.75,
      sfxVolume: 0.9,
      calibrationMs: 0,
      autoplay: false,
      tracks: {},

      setMasterVolume: (masterVolume) => set({ masterVolume }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
      setSfxVolume: (sfxVolume) => set({ sfxVolume }),
      setCalibrationMs: (calibrationMs) => set({ calibrationMs }),
      setAutoplay: (autoplay) => set({ autoplay }),

      trackForLevel: (levelSlug, fallback) => {
        const chosen = get().tracks[levelSlug];
        if (isTrackId(chosen)) return chosen;
        return isTrackId(fallback) ? fallback : DEFAULT_TRACK;
      },
      setTrackForLevel: (levelSlug, track) =>
        set((s) => ({ tracks: { ...s.tracks, [levelSlug]: track } })),
    }),
    { name: "tas.settings", version: 2 },
  ),
);
