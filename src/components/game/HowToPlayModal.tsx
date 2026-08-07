"use client";

import { Modal } from "@/components/ui/Modal";

interface HowToPlayModalProps {
  onClose: () => void;
}

/**
 * How-to-play onboarding modal. Shown automatically on the first visit
 * (dismissible) and always reachable from the menu "❓ HOW TO PLAY" button.
 */
export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <Modal title="HOW TO PLAY" onClose={onClose}>
      <div className="howto">
        <ol className="howto__steps">
          <li>
            <strong>Pick a level.</strong> First Beat (easy), Neon Rampage
            (normal), Disco Inferno (hard).
          </li>
          <li>
            <strong>Watch your lane.</strong> Four neon lanes — ◀ ▼ ▲ ▶.
            Enemies march toward the glowing line.
          </li>
          <li>
            <strong>Tap on the beat.</strong> Tap the pad or the enemy (touch),
            or press ◀ ▼ ▲ ▶ / WASD / Space (keyboard) when it crosses the line.
          </li>
          <li>
            <strong>Score big.</strong> PERFECT (±45ms) &gt; GREAT (±90ms) &gt;
            GOOD (a generous window, extra lenient on the late side for touch). Heavy enemies score ×1.5. Combos stack to ×8 —
            misses cost health.
          </li>
        </ol>
        <p className="howto__tip">
          💡 Tapping by ear feels off? Run the{" "}
          <strong>Sync Test</strong> in Settings — it measures your device&apos;s
          audio latency (Bluetooth headphones included) and sets the offset
          for you. There&apos;s also a <strong>Practice</strong> mode that never
          lets you die.
        </p>
        <p className="howto__note">
          Pause anytime with ESC / P — the game auto-pauses when you switch
          tabs. Perfect hits chain &quot;ON FIRE!&quot; streaks; grades run SSS → D.
        </p>
      </div>
    </Modal>
  );
}
