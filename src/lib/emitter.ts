/**
 * Tiny dependency-free typed event emitter.
 * Used for cross-cutting events (game bridge ↔ React shell) without pulling
 * Phaser's emitter into every module.
 */

type Listener<Args extends unknown[]> = (...args: Args) => void;
type AnyListener = (...args: unknown[]) => void;

export class TypedEmitter<Events extends Record<string, unknown[]>> {
  private listeners = new Map<keyof Events, Set<AnyListener>>();

  on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    const set = this.listeners.get(event) ?? new Set<AnyListener>();
    set.add(fn as unknown as AnyListener);
    this.listeners.set(event, set);
    return () => this.off(event, fn);
  }

  off<K extends keyof Events>(event: K, fn: Listener<Events[K]>): void {
    this.listeners.get(event)?.delete(fn as unknown as AnyListener);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // Copy so listeners can safely unsubscribe during dispatch.
    for (const fn of [...set]) {
      (fn as unknown as Listener<Events[K]>)(...args);
    }
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
