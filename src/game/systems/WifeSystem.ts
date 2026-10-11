import { BALANCE } from '../config/balance';
import { GameSystem, type FrameTime } from '../core/GameSystem';
import type { WifeActivity } from '../core/models';
import type { SystemContext } from '../core/GameSystem';
import { SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from '../core/time';
import type { BabySystem } from './BabySystem';

const clamp = (val: number): number => Math.max(0, Math.min(100, val));

/**
 * Simulates the Wife's needs (stress, energy, food, hydration, bladder, dirt)
 * and her difficulty-based daily routine:
 * - Hard (Level 1, wife-low): Lazy, sleeps a lot, goes out of the apartment, rarely helps.
 * - Medium (Level 2, wife-mid-high): Supportive, watches TV by day, only sleeps at night, helps often.
 * - Easy (Level 3, wife-mid-high): Watches TV, sleeps at night + afternoon nap, helps sometimes.
 */
export class WifeSystem extends GameSystem {
  private readonly config = BALANCE.wife;
  private babyCryingSeconds = 0;
  private helpCooldownUntil = 0;

  constructor(
    ctx: SystemContext,
    private readonly babySystem: BabySystem,
  ) {
    super(ctx);
  }

  override update({ gameSeconds }: FrameTime): void {
    const { wife, baby, difficulty } = this.state;
    const hours = gameSeconds / SECONDS_PER_HOUR;
    const hourOfDay = this.state.secondsOfDay / SECONDS_PER_HOUR;

    // 1. Passive needs progression
    const isSleeping = wife.activity === 'sleeping';
    const isWatchingTv = wife.activity === 'watching-tv';

    wife.food = clamp(wife.food - this.config.foodDrainPerHour * hours);
    wife.hydration = clamp(wife.hydration - this.config.hydrationDrainPerHour * hours);

    if (isSleeping) {
      wife.energy = clamp(wife.energy + this.config.sleepEnergyPerHour * hours);
      wife.stress = clamp(wife.stress - this.config.sleepStressReliefPerHour * hours);
    } else {
      wife.energy = clamp(wife.energy - this.config.energyDrainPerHour * hours);
    }

    if (isWatchingTv) {
      wife.stress = clamp(wife.stress - this.config.tvStressReliefPerHour * hours);
    }

    if (wife.activity !== 'toilet') {
      wife.bladder = clamp(wife.bladder + this.config.bladderGainPerHour * hours);
    }
    if (wife.activity !== 'showering') {
      wife.dirt = clamp(wife.dirt + this.config.dirtGainPerHour * hours);
    }

    // Stress from neglected personal needs or baby crying
    if (wife.food < 20) wife.stress = clamp(wife.stress + 4 * hours);
    if (wife.hydration < 25) wife.stress = clamp(wife.stress + 3 * hours);
    if (wife.energy < 15 && !isSleeping) wife.stress = clamp(wife.stress + 4 * hours);
    if (baby.crying && wife.activity !== 'out') {
      wife.stress = clamp(wife.stress + this.config.cryingStressPerHour * hours);
    }
    if (baby.kitchenFire && wife.activity !== 'out') {
      wife.stress = clamp(wife.stress + 10 * hours);
    }

    // Arguing / shouting when wife is in the apartment and either hungry or the baby is crying a lot
    const inApartment = wife.activity !== 'out' && (!isSleeping || baby.critical);
    const wifeHungry = wife.food < 38 || (wife.food < 50 && this.state.totalFoodStock === 0);
    const babyCryingALot =
      baby.crying &&
      (baby.critical || baby.needs < 48 || this.babyCryingSeconds >= 20 * SECONDS_PER_MINUTE);

    const wasArguing = wife.arguing;
    if (inApartment && (wifeHungry || babyCryingALot)) {
      wife.arguing = true;
      wife.argueReason = wifeHungry ? 'hungry' : 'baby-crying';
      this.state.player.adjust('stress', this.config.arguingStressPerHour * hours);
      wife.stress = clamp(wife.stress + this.config.wifeArguingStressPerHour * hours);

      if (!wasArguing) {
        this.notify(
          wife.argueReason === 'hungry'
            ? '💢 Your wife is hungry and yelling at you! We are arguing (+Stress)!'
            : '💢 The baby is crying and you and your wife are yelling at each other (+Stress)!',
          'danger',
        );
      }
    } else {
      wife.arguing = false;
      wife.argueReason = 'none';
    }

    // 2. Complete any active timed action (helping baby, eating, drinking, toilet, shower)
    if (wife.busyUntil > 0 && this.state.now >= wife.busyUntil) {
      const finished = wife.activity;
      wife.busyUntil = 0;
      const { fridge } = this.state;

      if (finished === 'helping-baby') {
        if (fridge.babyMilk > 0) {
          fridge.babyMilk -= 1;
          this.babySystem.attend();
          wife.stress = clamp(wife.stress - 6);
          this.notify('👩🍼 Your wife fed the baby (-1 Baby Milk from fridge)!', 'success');
        } else {
          this.babySystem.soothe(25);
          this.notify(
            '👩⚠️ Your wife calmed the baby, but there is no Baby Milk left in the fridge!',
            'warn',
          );
        }
      } else if (finished === 'eating') {
        if (fridge.fastFood > 0) {
          fridge.fastFood -= 1;
          wife.food = clamp(wife.food + 48);
          wife.stress = clamp(wife.stress - 5);
        } else if (fridge.instantSoup > 0) {
          fridge.instantSoup -= 1;
          wife.food = clamp(wife.food + 42);
          wife.stress = clamp(wife.stress - 4);
        } else if (fridge.healthySalad > 0) {
          fridge.healthySalad -= 1;
          wife.food = clamp(wife.food + 45);
          wife.stress = clamp(wife.stress - 6);
        } else if (fridge.meals > 0) {
          fridge.meals -= 1;
          wife.food = clamp(wife.food + 48);
          wife.stress = clamp(wife.stress - 5);
        } else {
          wife.stress = clamp(wife.stress + 6);
          this.notify(
            '👩🍽️ Your wife tried to eat, but the fridge is empty! Buy food in MARKET.',
            'warn',
          );
        }
      } else if (finished === 'drinking') {
        if (fridge.water > 0) {
          fridge.water -= 1;
          wife.hydration = clamp(wife.hydration + 52);
          wife.stress = clamp(wife.stress - 3);
        } else if (fridge.energyDrink > 0) {
          fridge.energyDrink -= 1;
          wife.hydration = clamp(wife.hydration + 40);
          wife.energy = clamp(wife.energy + 15);
        } else {
          wife.stress = clamp(wife.stress + 5);
          this.notify(
            '👩💧 Your wife is thirsty, but there is no water in the fridge! Restock in MARKET.',
            'warn',
          );
        }
      } else if (finished === 'toilet') {
        wife.bladder = 0;
        wife.stress = clamp(wife.stress - 4);
        this.state.filth.bathroom = Math.min(100, this.state.filth.bathroom + 4);
        // Wash hands at the bathroom sink right after using the toilet
        wife.activity = 'washing-hands';
        wife.busyUntil = this.state.now + 2 * SECONDS_PER_MINUTE;
        this.changed();
        return;
      } else if (finished === 'washing-hands') {
        wife.dirt = clamp(wife.dirt - 8);
      } else if (finished === 'cleaning') {
        const { filth } = this.state;
        const zone =
          filth.bathroom >= filth.kitchen && filth.bathroom >= filth.bedroom
            ? 'bathroom'
            : filth.kitchen >= filth.bedroom
              ? 'kitchen'
              : 'bedroom';
        filth[zone] = 0;
        wife.stress = clamp(wife.stress - 6);
        wife.dirt = clamp(wife.dirt + 68);
        const zoneLabel =
          zone === 'bathroom' ? 'Bathroom' : zone === 'kitchen' ? 'Kitchen' : 'Bedroom';
        this.notify(`👩🧹 Your wife cleaned the ${zoneLabel}!`, 'success');
      } else if (finished === 'showering') {
        wife.dirt = 0;
        wife.stress = clamp(wife.stress - 8);
      }

      wife.activity = this.getScheduledRoutine(difficulty.id, hourOfDay);
      this.changed();
      return;
    }

    // Wait while performing a timed action
    if (wife.busyUntil > this.state.now) {
      return;
    }

    // 3. Determine base routine for current time of day
    const baseRoutine = this.getScheduledRoutine(difficulty.id, hourOfDay);

    // 4. Check if the baby needs help and whether the wife is available to help
    const babyNeedsHelp = baby.crying || baby.location === 'loose';
    if (babyNeedsHelp) {
      this.babyCryingSeconds += gameSeconds;
    } else {
      this.babyCryingSeconds = 0;
    }

    const canHelpNow =
      baseRoutine !== 'sleeping' &&
      baseRoutine !== 'out' &&
      this.state.now >= this.helpCooldownUntil &&
      this.babyCryingSeconds >= 65 * SECONDS_PER_MINUTE;

    if (babyNeedsHelp && canHelpNow) {
      this.helpCooldownUntil =
        this.state.now + this.config.helpCooldownMinutes * SECONDS_PER_MINUTE;
      const chance = this.config.helpChance[difficulty.id];
      if (this.ctx.random.chance(chance)) {
        wife.activity = 'helping-baby';
        wife.busyUntil = this.state.now + this.config.helpDurationMinutes * SECONDS_PER_MINUTE;
        this.babyCryingSeconds = 0;
        this.changed();
        return;
      }
    }

    // 5. Self-care and occasional cleaning when awake and at home
    if (baseRoutine !== 'sleeping' && baseRoutine !== 'out') {
      if (wife.bladder >= 72) {
        wife.activity = 'toilet';
        wife.busyUntil = this.state.now + 4 * SECONDS_PER_MINUTE;
        return;
      }
      if (wife.dirt >= 65) {
        wife.activity = 'showering';
        wife.busyUntil = this.state.now + 6 * SECONDS_PER_MINUTE;
        return;
      }
      if (wife.hydration < 34) {
        wife.activity = 'drinking';
        wife.busyUntil = this.state.now + 3 * SECONDS_PER_MINUTE;
        return;
      }
      if (wife.food < 34) {
        wife.activity = 'eating';
        wife.busyUntil = this.state.now + 5 * SECONDS_PER_MINUTE;
        return;
      }
      const maxFilth = Math.max(
        this.state.filth.bedroom,
        this.state.filth.bathroom,
        this.state.filth.kitchen,
      );
      if (maxFilth >= 55 && this.state.now >= this.helpCooldownUntil) {
        this.helpCooldownUntil =
          this.state.now + this.config.helpCooldownMinutes * 2 * SECONDS_PER_MINUTE;
        const cleanChance = this.config.helpChance[difficulty.id] * 0.45;
        if (this.ctx.random.chance(cleanChance)) {
          wife.activity = 'cleaning';
          wife.busyUntil = this.state.now + 7 * SECONDS_PER_MINUTE;
          this.changed();
          return;
        }
      }
    }

    wife.activity = baseRoutine;
  }

  private getScheduledRoutine(
    difficultyId: 'hard' | 'medium' | 'easy',
    hourOfDay: number,
  ): WifeActivity {
    const canWatchTv = this.state.equipment.tv !== null && this.state.equipment.sofa !== null;
    const canSleepInBed = this.state.equipment.bed !== null;
    const defaultHomeActivity: WifeActivity = canWatchTv ? 'watching-tv' : 'idle';

    if (difficultyId === 'hard') {
      // Level 1 (Hard): Sleeps late, naps in afternoon, goes out often
      if (hourOfDay < 11.2 || (hourOfDay >= 14.5 && hourOfDay < 17.5) || hourOfDay >= 21.5) {
        return canSleepInBed ? 'sleeping' : defaultHomeActivity;
      }
      if ((hourOfDay >= 11.8 && hourOfDay < 14.2) || (hourOfDay >= 18.0 && hourOfDay < 20.5)) {
        return 'out';
      }
      return defaultHomeActivity;
    }

    if (difficultyId === 'medium') {
      // Level 2 (Medium): Only sleeps at night; watches TV and helps during the day
      if (hourOfDay >= 22.5 || hourOfDay < 7.0) {
        return canSleepInBed ? 'sleeping' : defaultHomeActivity;
      }
      return defaultHomeActivity;
    }

    // Level 3 (Easy / High): Sleeps at night + afternoon nap; otherwise watches TV
    if (hourOfDay >= 22.0 || hourOfDay < 8.5 || (hourOfDay >= 15.0 && hourOfDay < 17.5)) {
      return canSleepInBed ? 'sleeping' : defaultHomeActivity;
    }
    return defaultHomeActivity;
  }
}
