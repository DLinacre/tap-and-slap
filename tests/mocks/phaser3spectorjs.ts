/**
 * Vitest stub for `phaser3spectorjs` — an optional Phaser WebGL debug
 * integration that is `require`d unconditionally in Node (its guard relies on
 * a bundler `typeof WEBGL_DEBUG` define). Only used at runtime when a WebGL
 * renderer is created, which never happens in unit tests.
 */
const phaser3spectorjs = { Spector: class Spector {} };
export default phaser3spectorjs;
