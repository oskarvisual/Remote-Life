import { BALANCE } from '../config/balance';
import { FRIDGE_ITEMS } from '../config/content';
import type { SystemContext } from '../core/GameSystem';
import type { ActivityId, FridgeItemKey, PlayerMode } from '../core/models';
import type { BabySystem } from '../systems/BabySystem';

/**
 * A timed player action (nap, care for baby, eat, toilet, shower...). While it runs
 * the player is busy and cannot start anything else. Extend this class to add new actions.
 */
export abstract class Activity {
  abstract readonly id: ActivityId;
  abstract readonly mode: PlayerMode;
  /** Duration in game minutes. */
  abstract readonly minutes: number;
  /** Short label shown in prompts, e.g. "REST". */
  abstract readonly label: string;

  /** Returns a human-readable reason when the activity cannot start, or null. */
  blockedReason(_ctx: SystemContext): string | null {
    return null;
  }

  /** Runs when the activity begins (e.g. consume a meal). */
  onStart(_ctx: SystemContext): void {}

  /** Applies the activity's effects once its time has elapsed. */
  abstract onComplete(ctx: SystemContext): void;
}

export class NapActivity extends Activity {
  readonly id = 'nap';
  readonly mode = 'napping';
  readonly label = 'REST';
  readonly minutes = BALANCE.activities.nap.minutes;

  override blockedReason({ state }: SystemContext): string | null {
    return state.equipment.bed !== null ? null : 'You sold your bed! Buy a Bed in MARKET first.';
  }

  onComplete({ state }: SystemContext): void {
    const bedTier = state.equipment.bed ?? 1;
    const tierOffset = bedTier - 2; // Lv.1 = -1, Lv.2 = 0, Lv.3 = +1
    state.player.adjust('energy', BALANCE.activities.nap.energy + tierOffset * 4);
    state.player.adjust('stress', BALANCE.activities.nap.stress - tierOffset * 4);
    if (state.baby.location === 'carried') {
      state.baby.location = 'bed';
      state.baby.carriedAsleep = false;
      state.baby.cribSleeping = true;
      state.baby.demand = 'none';
      state.baby.crying = false;
      state.baby.critical = false;
      state.baby.needs = BALANCE.baby.attendRestores;
    }
  }
}

export class CareActivity extends Activity {
  readonly id = 'care';
  readonly mode = 'caring';
  readonly label = 'FEED BABY';
  readonly minutes = BALANCE.activities.care.minutes;

  constructor(private readonly baby: BabySystem) {
    super();
  }

  override blockedReason({ state }: SystemContext): string | null {
    if (state.fridge.babyMilk <= 0) {
      return 'No Baby Milk left in the fridge — buy Baby Milk in MARKET!';
    }
    return null;
  }

  override onStart({ state }: SystemContext): void {
    state.fridge.babyMilk = Math.max(0, state.fridge.babyMilk - 1);
  }

  onComplete({ state }: SystemContext): void {
    this.baby.attend();
    state.player.adjust('energy', BALANCE.activities.care.energy);
    state.player.adjust('stress', BALANCE.activities.care.stress);
  }
}

export class EatActivity extends Activity {
  readonly id = 'eat';
  readonly mode = 'eating';
  readonly label = 'EAT';
  readonly minutes = BALANCE.activities.eat.minutes;
  selectedKey: FridgeItemKey = 'meals';

  override blockedReason({ state }: SystemContext): string | null {
    if (state.equipment.fridge === null) {
      return 'You sold your refrigerator! Buy a Fridge in MARKET first.';
    }
    const key = this.selectedKey;
    return state.fridge[key] > 0 ? null : 'Fridge is out of that food — buy groceries in MARKET';
  }

  override onStart({ state }: SystemContext): void {
    const key = this.selectedKey;
    state.fridge[key] = Math.max(0, state.fridge[key] - 1);
  }

  onComplete({ state }: SystemContext): void {
    const spec = FRIDGE_ITEMS.find((i) => i.key === this.selectedKey);
    const foodGain = spec?.food ?? BALANCE.activities.eat.food;
    const hydGain = spec?.hydration ?? 0;
    const energyGain = spec?.energy ?? 0;
    const stressGain = spec?.stress ?? BALANCE.activities.eat.stress;

    state.player.adjust('food', foodGain);
    if (hydGain) state.player.adjust('hydration', hydGain);
    if (energyGain) state.player.adjust('energy', energyGain);
    state.player.adjust('stress', stressGain);
    state.player.adjust('bladder', 10);
    state.filth.kitchen = Math.min(100, state.filth.kitchen + 5);
    this.selectedKey = 'meals';
  }
}

export class DrinkActivity extends Activity {
  readonly id = 'drink';
  readonly mode = 'drinking';
  readonly label = 'DRINK WATER';
  readonly minutes = BALANCE.activities.drink.minutes;
  selectedKey: FridgeItemKey = 'water';

  override blockedReason({ state }: SystemContext): string | null {
    if (state.equipment.fridge === null) {
      return 'You sold your refrigerator! Buy a Fridge in MARKET first.';
    }
    const key = this.selectedKey;
    return state.fridge[key] > 0
      ? null
      : 'Out of drinks in the fridge — buy Water or Cold Brew in MARKET!';
  }

  override onStart({ state }: SystemContext): void {
    const key = this.selectedKey;
    state.fridge[key] = Math.max(0, state.fridge[key] - 1);
  }

  onComplete({ state }: SystemContext): void {
    const spec = FRIDGE_ITEMS.find((i) => i.key === this.selectedKey);
    const hydGain = spec?.hydration ?? BALANCE.activities.drink.hydration;
    const energyGain = spec?.energy ?? BALANCE.activities.drink.energy;
    const stressGain = spec?.stress ?? BALANCE.activities.drink.stress;

    state.player.adjust('hydration', hydGain);
    state.player.adjust('energy', energyGain);
    state.player.adjust('stress', stressGain);
    state.player.adjust('bladder', 18);
    this.selectedKey = 'water';
  }
}

export class ToiletActivity extends Activity {
  readonly id = 'toilet';
  readonly mode = 'toilet';
  readonly label = 'USE TOILET';
  readonly minutes = BALANCE.activities.toilet.minutes;

  onComplete({ state, events }: SystemContext): void {
    state.player.adjust('bladder', -100);
    state.player.adjust('stress', BALANCE.activities.toilet.stress);
    state.player.unwashedHands = true;
    state.filth.bathroom = Math.min(100, state.filth.bathroom + 6);
    events.emit('notify', {
      text: '🚰 Wash your hands at the bathroom sink [E] or take a shower, or dirtiness will rise fast!',
      kind: 'warn',
    });
  }
}

export class ShowerActivity extends Activity {
  readonly id = 'shower';
  readonly mode = 'showering';
  readonly label = 'TAKE SHOWER';
  readonly minutes = BALANCE.activities.shower.minutes;

  onComplete({ state }: SystemContext): void {
    state.player.adjust('dirt', -100);
    state.player.adjust('energy', BALANCE.activities.shower.energy);
    state.player.adjust('stress', BALANCE.activities.shower.stress);
    state.player.unwashedHands = false;
  }
}

export class WashHandsActivity extends Activity {
  readonly id = 'wash-hands';
  readonly mode = 'washing-hands';
  readonly label = 'WASH HANDS';
  readonly minutes = BALANCE.activities.washHands.minutes;

  onComplete({ state, events }: SystemContext): void {
    state.player.unwashedHands = false;
    state.player.adjust('dirt', BALANCE.activities.washHands.dirt);
    state.player.adjust('stress', BALANCE.activities.washHands.stress);
    events.emit('notify', {
      text: '🧼 Hands washed! Hygiene restored.',
      kind: 'success',
    });
  }
}

export class CleanActivity extends Activity {
  readonly id = 'clean';
  readonly mode = 'cleaning';
  readonly label = 'CLEAN ROOM';
  readonly minutes = BALANCE.activities.clean.minutes;

  onComplete({ state, events }: SystemContext): void {
    const zone = state.filth.targetZone;
    state.filth[zone] = 0;
    state.player.adjust('stress', BALANCE.activities.clean.stress);
    state.player.adjust('dirt', BALANCE.activities.clean.dirtGain);
    const zoneName =
      zone === 'bathroom' ? 'Bathroom' : zone === 'kitchen' ? 'Kitchen' : 'Bedroom & Living Room';
    events.emit('notify', {
      text: `🧹 Cleaned the ${zoneName}! You got dirty cleaning — go take a shower!`,
      kind: 'success',
    });
  }
}

export class WatchTvActivity extends Activity {
  readonly id = 'watch-tv';
  readonly mode = 'watching-tv';
  readonly label = 'WATCH TV';
  readonly minutes = BALANCE.activities.watchTv.minutes;

  override blockedReason({ state }: SystemContext): string | null {
    if (state.equipment.tv === null && state.equipment.sofa === null) {
      return '📺 You sold your TV and Sofa! Buy both in the MARKET app to watch television.';
    }
    if (state.equipment.tv === null) {
      return '📺 You have no Television! Buy a TV in the MARKET app first.';
    }
    if (state.equipment.sofa === null) {
      return '🛋️ You have no Sofa to sit on! Buy a Sofa in the MARKET app first.';
    }
    return null;
  }

  onComplete({ state }: SystemContext): void {
    const tvTier = state.equipment.tv ?? 1;
    const sofaTier = state.equipment.sofa ?? 1;
    // Higher tier TV and Sofa relieve extra stress
    const tierBonus = (tvTier - 2) * 3 + (sofaTier - 2) * 2;
    state.player.adjust('stress', BALANCE.activities.watchTv.stress - tierBonus);
  }
}
