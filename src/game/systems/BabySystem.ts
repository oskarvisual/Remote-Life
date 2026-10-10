import { BALANCE } from '../config/balance';
import { GameSystem } from '../core/GameSystem';
import type { FrameTime } from '../core/GameSystem';
import { SECONDS_PER_HOUR } from '../core/time';

/** Baby needs drain over time; crying raises stress, critical crying raises it much faster. */
export class BabySystem extends GameSystem {
  private readonly config = BALANCE.baby;

  private readonly demands: readonly ('feed' | 'crawl' | 'sleep')[] = ['feed', 'crawl', 'sleep'];
  private demandIndex = 0;

  override update({ gameSeconds }: FrameTime): void {
    const baby = this.state.baby;
    const hours = gameSeconds / SECONDS_PER_HOUR;

    if (baby.location === 'carried') {
      // Holding the baby calms crying and slowly restores comfort
      baby.needs = Math.min(100, baby.needs + 18 * hours);
      baby.crying = false;
      baby.critical = false;
    } else {
      const drain = this.config.drainPerHour * this.state.difficulty.babyDrainMultiplier;
      baby.needs = Math.max(0, baby.needs - drain * hours);
      this.refreshStatus();
    }

    if (baby.crying) {
      const multiplier = baby.critical ? this.config.criticalStressMultiplier : 1;
      this.state.player.adjust('stress', this.config.cryingStressPerHour * multiplier * hours);
    }

    if (baby.kitchenFire) {
      this.state.player.adjust('stress', 15 * hours);
    }
  }

  /** Fully attends the baby (called when feeding/caring completes). */
  attend(): void {
    this.state.baby.needs = this.config.attendRestores;
    this.state.baby.demand = 'none';
    this.state.baby.carriedAsleep = false;
    if (this.state.baby.location !== 'bed') {
      this.state.baby.location = 'crib';
    }
    this.state.baby.cribSleeping = false;
    this.refreshStatus();
    this.events.emit('baby:attended');
    this.changed();
  }

  /** Raises needs by `amount` (e.g. a toy from the market). */
  soothe(amount: number): void {
    this.state.baby.needs = Math.min(100, this.state.baby.needs + amount);
    if (this.state.baby.needs >= this.config.cryThreshold) {
      this.state.baby.demand = 'none';
    }
    this.refreshStatus();
    this.changed();
  }

  /** Scripted event: the baby gets hungry/restless and starts crying with a specific need. */
  makeHungry(): void {
    this.state.baby.needs = Math.min(this.state.baby.needs, this.config.cryThreshold - 2);
    if (this.state.baby.demand === 'none') {
      this.state.baby.demand = this.demands[this.demandIndex % this.demands.length];
      this.demandIndex += 1;
    }
    this.refreshStatus();
  }

  private refreshStatus(): void {
    const baby = this.state.baby;
    if (baby.location === 'carried') {
      baby.crying = false;
      baby.critical = false;
      return;
    }
    const wasCrying = baby.crying;
    const wasCritical = baby.critical;
    baby.crying = baby.needs < this.config.cryThreshold;
    baby.critical = baby.crying && baby.needs < this.config.criticalThreshold;
    if (baby.crying) {
      baby.cribSleeping = false;
      if (baby.demand === 'none') {
        baby.demand = this.demands[this.demandIndex % this.demands.length];
        this.demandIndex += 1;
      }
    }
    if (baby.crying && !wasCrying) this.events.emit('baby:crying');
    if (baby.critical && !wasCritical) this.events.emit('baby:critical');
  }
}
