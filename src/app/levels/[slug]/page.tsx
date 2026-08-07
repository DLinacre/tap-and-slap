import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BUILTIN_SLUGS, getLevelDef, getLevelMeta } from "@/game/levels/registry";
import { expectedMaxScore } from "@/game/levels/types";
import { getOrigin } from "@/lib/url";

interface LevelPageProps {
  params: Promise<{ slug: string }>;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "#a3e635",
  NORMAL: "#ffd54a",
  HARD: "#ff4d6d",
  INSANE: "#ff2ec4",
};

export function generateStaticParams() {
  return BUILTIN_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: LevelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = getLevelMeta(slug);
  if (!meta) return {};
  const origin = await getOrigin();
  return {
    title: `${meta.title} (${meta.difficulty} · ${meta.bpm} BPM) — Tap & Slap Level`,
    description: `${meta.title} is the ${meta.difficulty.toLowerCase()} level of Tap & Slap: ${meta.noteCount} notes, ~${Math.round(meta.durationSec)}s, max ${expectedMaxScore(getLevelDef(slug)!).toLocaleString("en-US")} points. Tap on the beat, kill on the downbeat — free in your browser.`,
    alternates: { canonical: `${origin}/levels/${slug}` },
    openGraph: {
      type: "website",
      url: `${origin}/levels/${slug}`,
      siteName: "Tap & Slap",
      title: `${meta.title} (${meta.difficulty} · ${meta.bpm} BPM) — Tap & Slap`,
      description: meta.description,
      images: [{ url: `${origin}/images/og-cover.jpg`, width: 1280, height: 640, alt: "Tap & Slap — neon synthwave beat 'em up" }],
    },
  };
}

/** Crawlable per-level pages: SEO surface + deep-link entry into the game. */
export default async function LevelPage({ params }: LevelPageProps) {
  const { slug } = await params;
  const def = getLevelDef(slug);
  const meta = getLevelMeta(slug);
  if (!def || !meta) notFound();

  const origin = await getOrigin();
  const maxScore = expectedMaxScore(def);
  const color = DIFFICULTY_COLOR[def.difficulty] ?? "#22d3ee";
  const minutes = Math.floor(meta.durationSec / 60);
  const seconds = Math.round(meta.durationSec % 60);

  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: `${meta.title} — Tap & Slap (${meta.difficulty})`,
    url: `${origin}/levels/${slug}`,
    image: `${origin}/images/og-cover.jpg`,
    description: `${meta.title}: ${meta.description} ${meta.noteCount} notes, ${meta.bpm} BPM, max ${maxScore.toLocaleString("en-US")} points.`,
    genre: ["Rhythm", "Action"],
    gamePlatform: "Web",
    numberOfPlayers: { "@type": "QuantitativeValue", value: 1 },
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP", availability: "https://schema.org/InStock" },
  };

  return (
    <main className="level-page">
      <div className="level-page__inner">
        <Link className="level-page__back" href="/">← Back to Tap & Slap</Link>

        <div className="level-page__card">
          <span
            className="level-page__diff"
            style={{ color, borderColor: `${color}66`, background: `${color}14` }}
          >
            {def.difficulty}
          </span>
          <h1>{meta.title}</h1>
          <p className="level-page__artist">by {meta.artist}</p>
          <p className="level-page__desc">{meta.description}</p>

          <dl className="level-page__stats">
            <div><dt>BPM</dt><dd>{meta.bpm}</dd></div>
            <div><dt>Notes</dt><dd>{meta.noteCount.toLocaleString("en-US")}</dd></div>
            <div><dt>Duration</dt><dd>{minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}</dd></div>
            <div><dt>Max score</dt><dd>{maxScore.toLocaleString("en-US")}</dd></div>
          </dl>

          <a
            className="level-page__play"
            href={`/?level=${encodeURIComponent(slug)}`}
          >
            ▶ PLAY {meta.title.toUpperCase()}
          </a>
          <p className="level-page__hint">
            Free · no install · keyboard (arrows / WASD) or touch · original procedural soundtrack
          </p>
        </div>

        <nav className="level-page__nav" aria-label="All levels">
          <h2>All levels</h2>
          <ul>
            {BUILTIN_SLUGS.map((s) => {
              const m = getLevelMeta(s);
              if (!m) return null;
              return (
                <li key={s}>
                  <Link href={`/levels/${s}`} aria-current={s === slug ? "page" : undefined}>
                    <strong>{m.title}</strong>
                    <span>{m.difficulty} · {m.bpm} BPM · {m.noteCount.toLocaleString("en-US")} notes</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </main>
  );
}
