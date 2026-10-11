import { BALANCE } from '../config/balance';
import { GameSystem } from '../core/GameSystem';
import type { FrameTime } from '../core/GameSystem';
import { SECONDS_PER_HOUR } from '../core/time';

const clamp = (val: number): number => Math.max(0, Math.min(100, val));

/** Baby needs drain over time; crying raises stress, critical crying raises it much faster. */
export class BabySystem extends GameSystem {
  private readonly config = BALANCE.baby;

  private readonly demands: readonly ('feed' | 'crawl' | 'sleep')[] = ['feed', 'crawl', 'sleep'];
  private demandIndex = 0;

  override update({ gameSeconds }: FrameTime): void {
    const baby = this.state.baby;
    const hours = gameSeconds / SECONDS_PER_HOUR;
    const drainMult = this.state.difficulty.babyDrainMultiplier;

    // 1. Individual baby needs (hunger, hydration, energy, hygiene, stress)
    baby.food = clamp(baby.food - this.config.foodDrainPerHour * drainMult * hours);
    baby.hydration = clamp(baby.hydration - this.config.hydrationDrainPerHour * drainMult * hours);
    baby.dirt = clamp(baby.dirt + this.config.dirtGainPerHour * hours);

    const isSleeping =
      (baby.location === 'crib' && baby.cribSleeping && !baby.crying) ||
      (baby.location === 'bed' && !baby.crying) ||
      (baby.location === 'carried' && baby.carriedAsleep);

    if (isSleeping) {
      baby.energy = clamp(baby.energy + this.config.sleepEnergyPerHour * hours);
      baby.stress = clamp(baby.stress - 10 * hours);
    } else {
      const energyMult = baby.location === 'loose' ? 1.5 : 1;
      baby.energy = clamp(
        baby.energy - this.config.energyDrainPerHour * drainMult * energyMult * hours,
      );
    }

    if (baby.location === 'carried') {
      // Holding the baby calms crying and slowly restores comfort
      baby.needs = clamp(baby.needs + 18 * hours);
      baby.stress = clamp(baby.stress - 15 * hours);
      baby.crying = false;
      baby.critical = false;
    } else {
      const drain = this.config.drainPerHour * drainMult;
      baby.needs = clamp(baby.needs - drain * hours);
      this.refreshStatus();
    }

    if (baby.crying) {
      const multiplier = baby.critical ? this.config.criticalStressMultiplier : 1;
      this.state.player.adjust('stress', this.config.cryingStressPerHour * multiplier * hours);
      baby.stress = clamp(baby.stress + 12 * multiplier * hours);
    } else if (!isSleeping) {
      baby.stress = clamp(baby.stress - 4 * hours);
    }

    if (baby.kitchenFire) {
      if (baby.fireStage === 0) {
        baby.fireStage = 1;
      }
      baby.fireElapsedSeconds += gameSeconds;
      const stageMult = baby.fireStage === 3 ? 2.2 : baby.fireStage === 2 ? 1.5 : 1;
      this.state.player.adjust('stress', 15 * stageMult * hours);
      baby.stress = clamp(baby.stress + 15 * stageMult * hours);

      if (baby.fireStage === 1 && baby.fireElapsedSeconds >= this.config.fireSmallMinutes * 60) {
        baby.fireStage = 2;
        this.notify(
          '🔥 THE FIRE IS GROWING! The stove flames turned into a BIG FIRE! Run to the stove and press [E] NOW!',
          'danger',
        );
        this.changed();
      } else if (
        baby.fireStage === 2 &&
        baby.fireElapsedSeconds >= this.config.fireBigMinutes * 60
      ) {
        baby.fireStage = 3;
        this.notify(
          '🔥🔥 THE ENTIRE KITCHEN IS ON FIRE! Put it out immediately before everything burns down!',
          'danger',
        );
        this.changed();
      }
    } else {
      baby.fireStage = 0;
      baby.fireElapsedSeconds = 0;
    }
  }

  /** Starts a small fire on the kitchen stove (Stage 1: fire_small). */
  startKitchenFire(): void {
    const baby = this.state.baby;
    baby.kitchenFire = true;
    baby.fireStage = 1;
    baby.fireElapsedSeconds = 0;
    this.notify(
      '🔥 A small fire started on the stove! Run to the stove and press [E] before it grows!',
      'danger',
    );
    this.changed();
  }

  /** Extinguishes any active kitchen fire. */
  extinguishKitchenFire(): void {
    const baby = this.state.baby;
    if (!baby.kitchenFire) return;
    baby.kitchenFire = false;
    baby.fireStage = 0;
    baby.fireElapsedSeconds = 0;
    this.notify('🧯 You extinguished the kitchen fire in time!', 'success');
    this.changed();
  }

  /** Fully attends the baby (called when feeding/caring completes). */
  attend(): void {
    this.state.baby.needs = this.config.attendRestores;
    this.state.baby.food = clamp(this.state.baby.food + 55);
    this.state.baby.hydration = clamp(this.state.baby.hydration + 55);
    this.state.baby.dirt = clamp(this.state.baby.dirt - 65);
    this.state.baby.stress = clamp(this.state.baby.stress - 45);
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

  /** Raises needs by `amount` (e.g. a toy from the market or being rocked to sleep). */
  soothe(amount: number): void {
    this.state.baby.needs = clamp(this.state.baby.needs + amount);
    this.state.baby.stress = clamp(this.state.baby.stress - amount * 0.7);
    this.state.baby.energy = clamp(this.state.baby.energy + amount * 0.4);
    if (this.state.baby.needs >= this.config.cryThreshold) {
      this.state.baby.demand = 'none';
    }
    this.refreshStatus();
    this.changed();
  }

  /** Scripted event: the baby gets hungry/restless and starts crying with a specific need. */
  makeHungry(): void {
    this.state.baby.needs = Math.min(this.state.baby.needs, this.config.cryThreshold - 2);
    this.state.baby.food = Math.min(this.state.baby.food, 42);
    this.state.baby.stress = clamp(this.state.baby.stress + 25);
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
