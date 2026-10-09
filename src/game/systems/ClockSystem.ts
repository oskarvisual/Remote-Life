import { BALANCE } from '../config/balance';
import { GameSystem, type SystemContext } from '../core/GameSystem';
import { SECONDS_PER_DAY } from '../core/time';

/**
 * Converts real time into game time and handles day rollover.
 * Unlike other systems it is driven explicitly by `advance` (it produces the frame time).
 */
export class ClockSystem extends GameSystem {
  /** Game seconds per real second (144 with a 10-minute day). */
  readonly scale: number;

  constructor(ctx: SystemContext, realSecondsPerDay: number = BALANCE.time.realSecondsPerDay) {
    super(ctx);
    this.scale = SECONDS_PER_DAY / realSecondsPerDay;
  }

  /** Advances the clock by `realMs` and returns the elapsed game seconds. */
  advance(realMs: number): number {
    const realSeconds = Math.max(0, realMs) / 1000;
    const gameSeconds = realSeconds * this.scale;
    this.state.realElapsed += realSeconds;
    this.state.secondsOfDay += gameSeconds;

    // `while`, not `if`: a huge delta may cross several days at once.
    while (this.state.secondsOfDay >= SECONDS_PER_DAY) {
      this.state.secondsOfDay -= SECONDS_PER_DAY;
      this.state.day += 1;
      this.events.emit('day:changed', { day: this.state.day });
    }

    this.events.emit('clock:tick', { day: this.state.day, secondsOfDay: this.state.secondsOfDay });
    return gameSeconds;
  }
}
