import type { Metadata, Viewport } from "next";
import { Orbitron } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Self-hosted Orbitron (next/font) — eliminates the render-blocking Google
// Fonts <link> and the external request chain entirely.
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const DESCRIPTION =
  "Tap & Slap is a dance-mat beat 'em up: tap to kill enemies exactly on the beat. Four neon lanes, combo multipliers, procedural synthwave fight music — keyboard or touch, free to play in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Tap & Slap — Dance-Mat Beat 'em Up",
    template: "%s | Tap & Slap",
  },
  description: DESCRIPTION,
  applicationName: "Tap & Slap",
  keywords: [
    "rhythm game",
    "beat em up",
    "dance mat",
    "tap game",
    "phaser game",
    "browser game",
    "synthwave",
    "free online game",
    "rhythm action",
  ],
  authors: [{ name: "Tap & Slap" }],
  category: "game",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "Tap & Slap",
    title: "Tap & Slap — Dance-Mat Beat 'em Up",
    description: DESCRIPTION,
    locale: "en_GB",
    images: [
      {
        url: "/images/og-cover.jpg",
        width: 1280,
        height: 640,
        alt: "Tap & Slap — neon synthwave beat 'em up",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tap & Slap — Dance-Mat Beat 'em Up",
    description: DESCRIPTION,
    images: ["/images/og-cover.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0118",
  width: "device-width",
  initialScale: 1,
  // NOTE: userScalable/maximumScale intentionally omitted — WCAG 2.2 1.4.4
  // requires text resizing (pinch zoom) on mobile.
  viewportFit: "cover",
};

const VIDEOGAME_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "Tap & Slap",
  description: DESCRIPTION,
  genre: ["Rhythm", "Action", "Beat 'em up"],
  applicationCategory: "Game",
  operatingSystem: "Web browser",
  browserRequirements: "Requires JavaScript and an HTML5 browser",
  gamePlatform: "Web",
  numberOfPlayers: { "@type": "QuantitativeValue", value: 1 },
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP", availability: "https://schema.org/InStock" },
  publisher: { "@type": "Organization", name: "Tap & Slap" },
  keywords: "rhythm game, beat em up, tap game, dance mat, browser game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={orbitron.variable}>
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(VIDEOGAME_SCHEMA) }}
        />
      </body>
    </html>
  );
}
