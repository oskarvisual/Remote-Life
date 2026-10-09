import { BALANCE } from '../config/balance';
import { GameSystem, type SystemContext } from '../core/GameSystem';

/** Rent collection on a fixed day cycle. */
export class EconomySystem extends GameSystem {
  private readonly config = BALANCE.economy;

  constructor(ctx: SystemContext) {
    super(ctx);
    this.listen('day:changed', ({ day }) => this.onDayChanged(day));
  }

  get rent(): number {
    return this.config.rent;
  }

  /** First day (> current) on which rent is due. Rent is due on days 8, 15, 22... */
  get nextRentDay(): number {
    const every = this.config.rentEveryDays;
    return Math.floor((this.state.day - 1) / every + 1) * every + 1;
  }

  get daysUntilRent(): number {
    return this.nextRentDay - this.state.day;
  }

  private onDayChanged(day: number): void {
    if (day <= 1 || (day - 1) % this.config.rentEveryDays !== 0) return;
    if (this.state.player.spend(this.config.rent)) {
      this.events.emit('rent:paid', { amount: this.config.rent, day });
    } else {
      this.events.emit('rent:missed', { amount: this.config.rent, day });
    }
    this.changed();
  }
}
