export type Listener<T> = (payload: T) => void;
export type Unsubscribe = () => void;

/** Payload tuple: events typed as `void` are emitted without arguments. */
type EmitArgs<T> = [T] extends [void] ? [] : [payload: T];

/**
 * Strongly typed event bus. One instance per game session (no global state),
 * which keeps sessions isolated and tests independent.
 */
export class EventBus<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<K extends keyof Events>(type: K, listener: Listener<Events[K]>): Unsubscribe {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener as Listener<never>);
    return () => this.off(type, listener);
  }

  once<K extends keyof Events>(type: K, listener: Listener<Events[K]>): Unsubscribe {
    const unsubscribe = this.on(type, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  off<K extends keyof Events>(type: K, listener: Listener<Events[K]>): void {
    this.listeners.get(type)?.delete(listener as Listener<never>);
  }

  emit<K extends keyof Events>(type: K, ...args: EmitArgs<Events[K]>): void {
    const set = this.listeners.get(type);
    if (!set) return;
    // Copy so listeners can unsubscribe while the event is dispatched.
    for (const listener of [...set]) (listener as Listener<unknown>)(args[0]);
  }

  clear(): void {
    this.listeners.clear();
  }
}
