"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production only (dev HMR + SW is a
 * footgun). Gives repeat visits near-instant loads and offline play — the
 * score queue already persists runs to localStorage.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err: unknown) => {
          console.warn("[pwa] service worker registration failed:", err);
        });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
