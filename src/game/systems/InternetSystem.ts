import { BALANCE } from '../config/balance';
import { GameSystem } from '../core/GameSystem';
import { minutes } from '../core/time';

/** Temporary connection problems: slower task progress and faster meeting attention drain. */
export class InternetSystem extends GameSystem {
  private wasUnstable = false;

  startOutage(durationMinutes: number = BALANCE.internet.outageMinutes): void {
    const until = Math.max(
      this.state.internetUnstableUntil,
      this.state.now + minutes(durationMinutes),
    );
    this.state.internetUnstableUntil = until;
    this.wasUnstable = true;
    this.events.emit('internet:problem', { until });
    this.changed();
  }

  override update(): void {
    if (this.wasUnstable && !this.state.internetUnstable) {
      this.wasUnstable = false;
      this.events.emit('internet:restored');
      this.changed();
    }
  }
}
