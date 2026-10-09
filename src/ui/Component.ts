import type { EventBus } from '../game/core/EventBus';
import type { GameEvents } from '../game/core/events';

export abstract class UIComponent {
  protected readonly subscriptions: Array<() => void> = [];

  constructor(
    protected readonly container: HTMLElement,
    protected readonly events: EventBus<GameEvents>,
  ) {}

  protected listen<K extends keyof GameEvents>(
    type: K,
    listener: (payload: GameEvents[K]) => void,
  ): void {
    this.subscriptions.push(this.events.on(type, listener));
  }

  abstract render(): void;

  destroy(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) {
      unsubscribe();
    }
  }
}
