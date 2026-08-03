import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About & How to Play",
  description:
    "How to play Tap & Slap — controls, scoring, judgment windows, and the story behind the game.",
};

export default function AboutPage() {
  return (
    <main className="info-page">
      <h1>About &amp; How to Play</h1>

      <h2>The idea</h2>
      <p>
        Tap &amp; Slap is a dance-mat beat &apos;em up: enemies march down four
        neon lanes <em>on the beat</em>, and you slap them dead by hitting the
        right lane at the exact musical moment. Think dance mat meets punch-up.
      </p>

      <h2>Controls</h2>
      <ul>
        <li><strong>Keyboard:</strong> arrow keys or WASD for the four lanes · <code>ESC</code>/<code>P</code> pauses</li>
        <li><strong>Touch:</strong> tap the glowing pads at the bottom, or tap an enemy directly</li>
      </ul>

      <h2>Scoring</h2>
      <ul>
        <li>PERFECT ≤ 45 ms from the beat · GREAT ≤ 90 ms · GOOD ≤ 135 ms — beyond that it&apos;s a MISS</li>
        <li>Every hit builds combo; every 10 combo raises your multiplier, up to ×8</li>
        <li>Heavy enemies score ×1.5, minis ×0.5; misses cost health and reset combo</li>
        <li>Runs are graded SSS → D by weighted accuracy</li>
      </ul>

      <h2>Music</h2>
      <p>
        Every track is an original composition synthesized live in your browser
        from the level&apos;s beat map — no licensed audio, no downloads.
      </p>

      <h2>Open source</h2>
      <p>
        Built with Next.js 15, Phaser 3 and TypeScript. Source, docs and issue
        tracker:{" "}
        <a href="https://github.com/DLinacre/tap-and-slap" target="_blank" rel="noreferrer">
          github.com/DLinacre/tap-and-slap
        </a>
        .
      </p>

      <p className="info-page__back">
        <Link href="/">← Back to the game</Link>
      </p>
    </main>
  );
}
