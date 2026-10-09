import type { EventBus, Listener } from './EventBus';
import type { GameEvents } from './events';
import type { GameState } from './GameState';
import type { NoticeKind } from './models';
import type { Random } from './Random';

/** Dependencies shared by every system of a session. */
export interface SystemContext {
  readonly state: GameState;
  readonly events: EventBus<GameEvents>;
  readonly random: Random;
}

/** Time elapsed during one simulation step. */
export interface FrameTime {
  /** Game seconds elapsed this frame. */
  readonly gameSeconds: number;
  /** Real milliseconds elapsed this frame (already clamped). */
  readonly realMs: number;
}

/**
 * Base class for all game rules. Extend it, override `update` and/or subscribe
 * to events with `listen` — subscriptions are cleaned up automatically on `dispose`.
 */
export abstract class GameSystem {
  private readonly subscriptions: Array<() => void> = [];

  constructor(protected readonly ctx: SystemContext) {}

  protected get state(): GameState {
    return this.ctx.state;
  }

  protected get events(): EventBus<GameEvents> {
    return this.ctx.events;
  }

  protected listen<K extends keyof GameEvents>(type: K, listener: Listener<GameEvents[K]>): void {
    this.subscriptions.push(this.events.on(type, listener));
  }

  protected notify(text: string, kind: NoticeKind = 'info'): void {
    this.events.emit('notify', { text, kind });
  }

  protected changed(): void {
    this.events.emit('state:changed');
  }

  /** Called once per frame while the session is running. */
  update(_frame: FrameTime): void {}

  dispose(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
  }
}
