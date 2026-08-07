import type { Metadata } from "next";
import Link from "next/link";
import { BUILTIN_SLUGS, getLevelDef, getLevelMeta } from "@/game/levels/registry";
import { expectedMaxScore } from "@/game/levels/types";
import { getOrigin } from "@/lib/url";

export const metadata: Metadata = {
  title: "Levels — Tap & Slap",
  description:
    "All Tap & Slap levels: First Beat (easy), Neon Rampage (normal), Disco Inferno (hard). BPM, note counts, durations and max scores — free to play in your browser.",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "#a3e635",
  NORMAL: "#ffd54a",
  HARD: "#ff4d6d",
  INSANE: "#ff2ec4",
};

/** Crawlable hub for all levels (SEO + internal linking target). */
export default async function LevelsIndexPage() {
  const origin = await getOrigin();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tap & Slap levels",
    itemListElement: BUILTIN_SLUGS.map((slug, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "VideoGame",
        name: getLevelMeta(slug)?.title,
        url: `${origin}/levels/${slug}`,
      },
    })),
  };

  return (
    <main className="level-page">
      <div className="level-page__inner">
        <Link className="level-page__back" href="/">← Back to Tap & Slap</Link>

        <header className="level-page__card">
          <span className="level-page__diff" style={{ color: "#22d3ee", borderColor: "#22d3ee66", background: "#22d3ee14" }}>
            3 LEVELS + DAILY
          </span>
          <h1>All Levels</h1>
          <p className="level-page__desc">
            Three built-in difficulties plus a fresh Daily Challenge every day.
            Every level is deterministic — same seed, same notes, same leaderboard.
          </p>
        </header>

        <nav className="level-page__nav" aria-label="Levels">
          <ul>
            {BUILTIN_SLUGS.map((slug) => {
              const meta = getLevelMeta(slug);
              const def = getLevelDef(slug);
              if (!meta || !def) return null;
              const color = DIFFICULTY_COLOR[def.difficulty] ?? "#22d3ee";
              const minutes = Math.floor(meta.durationSec / 60);
              const seconds = Math.round(meta.durationSec % 60);
              return (
                <li key={slug}>
                  <Link href={`/levels/${slug}`}>
                    <span className="level-page__nav-card">
                      <span className="level-page__nav-diff" style={{ color, borderColor: `${color}66`, background: `${color}14` }}>
                        {def.difficulty}
                      </span>
                      <strong>{meta.title}</strong>
                      <span className="level-page__nav-meta">
                        {meta.bpm} BPM · {meta.noteCount.toLocaleString("en-US")} notes ·{" "}
                        {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`} ·{" "}
                        {expectedMaxScore(def).toLocaleString("en-US")} max
                      </span>
                    </span>
                    <span className="level-page__nav-play">▶ PLAY</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="level-page__hint">
          Free · no install · keyboard (arrows / WASD) or touch · original procedural soundtrack
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
