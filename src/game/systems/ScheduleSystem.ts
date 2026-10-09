import { GameSystem, type SystemContext } from '../core/GameSystem';
import { parseClock } from '../core/time';

export interface ScheduledEvent {
  id: string;
  /** "HH:MM" in game time. */
  at: string;
  /** Name of a handler registered with `ScheduleSystem.register`. */
  action: string;
  /** Restrict to specific days. Omit to repeat every day. */
  days?: readonly number[];
}

export type ScheduleHandler = (context: { day: number; event: ScheduledEvent }) => void;

/**
 * Data-driven daily script. Fires each entry once per day when the game clock
 * reaches its time. Add new beats by adding entries + registering a handler.
 */
export class ScheduleSystem extends GameSystem {
  private readonly entries: Array<ScheduledEvent & { atSeconds: number }>;
  private readonly handlers = new Map<string, ScheduleHandler>();
  private readonly fired = new Set<string>();

  constructor(ctx: SystemContext, entries: readonly ScheduledEvent[]) {
    super(ctx);
    this.entries = entries
      .map((entry) => ({ ...entry, atSeconds: parseClock(entry.at) }))
      .sort((a, b) => a.atSeconds - b.atSeconds);
    // Entries that are already in the past when the session starts are skipped for that day.
    for (const entry of this.entries) {
      if (entry.atSeconds < this.state.secondsOfDay)
        this.fired.add(this.key(this.state.day, entry.id));
    }
    this.listen('day:changed', ({ day }) => this.forgetBefore(day));
  }

  register(action: string, handler: ScheduleHandler): this {
    this.handlers.set(action, handler);
    return this;
  }

  override update(): void {
    const { day, secondsOfDay } = this.state;
    for (const entry of this.entries) {
      if (entry.atSeconds > secondsOfDay) break;
      if (entry.days && !entry.days.includes(day)) continue;
      const key = this.key(day, entry.id);
      if (this.fired.has(key)) continue;
      this.fired.add(key);
      const handler = this.handlers.get(entry.action);
      if (!handler) throw new Error(`No schedule handler registered for "${entry.action}"`);
      handler({ day, event: entry });
    }
  }

  private key(day: number, id: string): string {
    return `${day}:${id}`;
  }

  private forgetBefore(day: number): void {
    for (const key of this.fired) {
      if (Number(key.split(':')[0]) < day) this.fired.delete(key);
    }
  }
}
