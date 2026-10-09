import { BALANCE } from '../config/balance';
import type { SystemContext } from '../core/GameSystem';
import type { ActivityId, PlayerMode } from '../core/models';
import type { BabySystem } from '../systems/BabySystem';

/**
 * A timed player action (nap, care for baby, eat...). While it runs the player
 * is busy and cannot start anything else. Extend this class to add new actions.
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

  onComplete({ state }: SystemContext): void {
    state.player.adjust('energy', BALANCE.activities.nap.energy);
    state.player.adjust('stress', BALANCE.activities.nap.stress);
  }
}

export class CareActivity extends Activity {
  readonly id = 'care';
  readonly mode = 'caring';
  readonly label = 'CARE FOR BABY';
  readonly minutes = BALANCE.activities.care.minutes;

  constructor(private readonly baby: BabySystem) {
    super();
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

  override blockedReason({ state }: SystemContext): string | null {
    return state.fridge.meals > 0 ? null : 'Fridge is empty — buy groceries in MARKET';
  }

  override onStart({ state }: SystemContext): void {
    state.fridge.meals -= 1;
  }

  onComplete({ state }: SystemContext): void {
    state.player.adjust('food', BALANCE.activities.eat.food);
    state.player.adjust('stress', BALANCE.activities.eat.stress);
  }
}
