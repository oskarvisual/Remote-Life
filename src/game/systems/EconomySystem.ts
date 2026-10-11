import { BALANCE } from '../config/balance';
import { GameSystem, type SystemContext } from '../core/GameSystem';
import { parseClock } from '../core/time';

export type PayRentResult = 'ok' | 'already-paid' | 'insufficient-funds';

/**
 * Rent & Bank billing system:
 * - Rent is due on the 1st of each billing cycle (every 7 days: Day 8, 15, 22...).
 * - Starting 5 days before rent is due, at 08:00 AM each morning, alerts the player if bank funds are insufficient.
 * - Rent is paid manually in the BANK app. Even if the player has enough money, they can choose not to pay yet.
 * - If rent is not paid on the due date, a 5-day eviction grace period starts (5, 4, 3, 2, 1 days until eviction)
 *   with daily 08:00 AM alerts directing the player to the BANK app. If unpaid after 5 days, the player is evicted.
 */
export class EconomySystem extends GameSystem {
  private readonly config = BALANCE.economy;
  private readonly alertTimeSeconds = parseClock('08:00');
  private lastAlertedDay = 0;

  constructor(ctx: SystemContext) {
    super(ctx);
    this.listen('day:changed', ({ day }) => this.onDayChanged(day));
  }

  get rent(): number {
    return this.config.rentByApartmentTier[this.state.apartmentTier] ?? this.config.rent;
  }

  /** Target billing cycle index (1 for first rent on Day 8, 2 for Day 15, etc.). */
  get activeCycleTarget(): number {
    return Math.floor((this.state.day - 1) / this.config.rentEveryDays) + 1;
  }

  /** Whether the upcoming (or currently due) rent cycle has already been paid. */
  get isCurrentCyclePaid(): boolean {
    if (this.state.rentDue) return false;
    return this.state.lastPaidRentCycle >= this.activeCycleTarget;
  }

  /** First day (> current) on which rent is due. Rent is due on days 8, 15, 22... */
  get nextRentDay(): number {
    const every = this.config.rentEveryDays;
    return Math.floor((this.state.day - 1) / every + 1) * every + 1;
  }

  get daysUntilRent(): number {
    return this.nextRentDay - this.state.day;
  }

  /** Manually pays the rent from the BANK app. */
  payRent(): PayRentResult {
    if (!this.state.rentDue && this.isCurrentCyclePaid) {
      this.notify('🏦 Rent for this billing period is already paid!', 'info');
      return 'already-paid';
    }

    const currentRent = this.rent;
    if (!this.state.player.spend(currentRent)) {
      this.notify(
        `🏦 Insufficient funds! You need $${currentRent} in the BANK to pay rent.`,
        'warn',
      );
      return 'insufficient-funds';
    }

    const wasDue = this.state.rentDue;
    this.state.rentDue = false;
    this.state.evictionDaysLeft = 5;
    this.state.lastPaidRentCycle += 1;

    this.events.emit('rent:paid', { amount: currentRent, day: this.state.day });
    this.notify(
      wasDue
        ? `🏦 Overdue rent paid ($${currentRent})! Eviction cancelled.`
        : `🏦 Rent paid ($${currentRent}) via Neo-Bank!`,
      'success',
    );
    this.changed();
    return 'ok';
  }

  override update(): void {
    // Trigger daily 08:00 AM rent / eviction alerts once per day
    if (
      this.state.day !== this.lastAlertedDay &&
      this.state.secondsOfDay >= this.alertTimeSeconds
    ) {
      this.lastAlertedDay = this.state.day;
      this.emitMorningRentAlert();
    }
  }

  private emitMorningRentAlert(): void {
    const { player, rentDue, evictionDaysLeft } = this.state;

    if (rentDue) {
      this.notify(
        `🚨 ${evictionDaysLeft} DAY${evictionDaysLeft === 1 ? '' : 'S'} UNTIL EVICTION! Rent ($${this.rent}) is unpaid. Open the BANK app on your PC to pay!`,
        'danger',
      );
      return;
    }

    const daysLeft = this.daysUntilRent;
    if (daysLeft <= 5 && !this.isCurrentCyclePaid && player.money < this.rent) {
      const missing = this.rent - player.money;
      this.notify(
        `🏦 ${daysLeft} day${daysLeft === 1 ? '' : 's'} left to pay rent ($${this.rent}) and you still need $${missing} more! Check your BANK app.`,
        'warn',
      );
    }
  }

  private onDayChanged(day: number): void {
    const isRentDueDay = day > 1 && (day - 1) % this.config.rentEveryDays === 0;

    // 1. If rent is already overdue, tick down the 5-day eviction grace period
    if (this.state.rentDue) {
      this.state.evictionDaysLeft -= 1;
      if (this.state.evictionDaysLeft <= 0) {
        this.events.emit('rent:missed', { amount: this.rent, day });
        this.changed();
        return;
      }
      this.changed();
      return;
    }

    // 2. If today is the 1st of the new cycle (Day 8, 15, ...)
    if (isRentDueDay) {
      const cycleDue = Math.floor((day - 1) / this.config.rentEveryDays);
      if (this.state.lastPaidRentCycle >= cycleDue) {
        // Player already paid this cycle's rent in the Bank app!
        this.events.emit('rent:paid', { amount: this.rent, day });
      } else {
        // Rent was not paid yet: enter 5-day eviction countdown (player must pay in BANK app)
        this.state.rentDue = true;
        this.state.evictionDaysLeft = 5;
      }
      this.changed();
    }
  }
}
