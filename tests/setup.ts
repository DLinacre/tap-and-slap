import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library's auto-cleanup relies on a global `afterEach`; with vitest
// globals disabled we register it explicitly so renders don't accumulate.
afterEach(() => {
  cleanup();
});

/**
 * jsdom has no canvas 2D implementation, and Phaser runs feature detection at
 * import time (CanvasFeatures.init). Stub `getContext` so Phaser (and any
 * canvas-touching code) can be imported in unit/component tests. The stub is
 * a permissive Proxy: unknown method calls no-op, unknown property reads
 * return a no-op function, property writes are ignored.
 */
function installCanvas2dStub(): void {
  const gradient = { addColorStop: () => undefined };
  const base: Record<string, unknown> = {
    canvas: { width: 300, height: 150 },
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
  };
  const stub = new Proxy(base as unknown as CanvasRenderingContext2D, {
    get(target, prop) {
      if (Reflect.has(target, prop)) return Reflect.get(target, prop);
      if (typeof prop === "string" && prop.startsWith("on")) return undefined;
      return () => undefined;
    },
    set() {
      return true;
    },
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => stub,
  });
}

installCanvas2dStub();

/**
 * Defensive localStorage polyfill — some JSDOM/Node versions don't provide
 * one; game code (guest id, settings, offline queue) requires it.
 */
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  const localStorageShim = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageShim,
    configurable: true,
  });
}
