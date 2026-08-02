import type { MetadataRoute } from "next";

/** Web app manifest (PWA-ready metadata). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tap & Slap — Dance-Mat Beat 'em Up",
    short_name: "Tap & Slap",
    description: "Tap to kill enemies exactly on the beat. Dance-mat rhythm brawler.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0118",
    theme_color: "#0a0118",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
