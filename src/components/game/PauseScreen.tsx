"use client";

import { NeonButton } from "@/components/ui/NeonButton";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { quitToMenu, restartRun, resumeGame } from "@/lib/client/game-actions";

/** Pause overlay — resume, restart, quit and quick volume access. */
export function PauseScreen() {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume);
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume);
  const levelTitle = useGameStore((s) => s.level?.title ?? "Paused");

  return (
    <div className="overlay" data-testid="pause">
      <div className="pause">
        <h2>PAUSED</h2>
        <p className="menu__muted">{levelTitle}</p>

        <label className="slider-row">
          <span>Master</span>
          <input
            type="range" min={0} max={1} step={0.05} value={masterVolume}
            aria-label="Master volume"
            onChange={(e) => setMasterVolume(Number(e.target.value))}
          />
        </label>
        <label className="slider-row">
          <span>Music</span>
          <input
            type="range" min={0} max={1} step={0.05} value={musicVolume}
            aria-label="Music volume"
            onChange={(e) => setMusicVolume(Number(e.target.value))}
          />
        </label>
        <label className="slider-row">
          <span>SFX</span>
          <input
            type="range" min={0} max={1} step={0.05} value={sfxVolume}
            aria-label="SFX volume"
            onChange={(e) => setSfxVolume(Number(e.target.value))}
          />
        </label>

        <div className="pause__actions">
          <NeonButton onClick={() => resumeGame()}>▶ RESUME</NeonButton>
          <NeonButton variant="ghost" onClick={() => restartRun()}>
            ↻ RESTART
          </NeonButton>
          <NeonButton variant="danger" onClick={() => quitToMenu()}>
            ✕ QUIT
          </NeonButton>
        </div>
        <p className="menu__muted">Press ESC or P to resume</p>
      </div>
    </div>
  );
}
