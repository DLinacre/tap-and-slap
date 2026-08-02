/**
 * Vitest alias for the `server-only` package. In real Next.js builds,
 * `server-only` guards server modules from leaking into client bundles; in
 * unit tests we resolve it to an empty module.
 */
export {};
