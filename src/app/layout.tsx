import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tap & Slap — beat 'em up",
  description:
    "A dance-mat style beat 'em up: tap to kill enemies exactly on the beat. Keyboard or touch, neon synthwave vibes.",
  applicationName: "Tap & Slap",
  keywords: ["rhythm game", "beat 'em up", "dance mat", "phaser", "tap game"],
};

export const viewport: Viewport = {
  themeColor: "#0a0118",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
