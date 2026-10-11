import type { Activity, DrinkActivity, EatActivity } from '../activities/Activity';
import { FRIDGE_ITEMS } from '../config/content';
import { GameSystem } from '../core/GameSystem';
import type { ActivityId, FridgeItemKey } from '../core/models';
import { minutes } from '../core/time';

export type StartResult = 'started' | 'busy' | 'blocked' | 'unknown';

/**
 * Owns the player's mode. Only an idle player can start an activity or sit at
 * the computer, which prevents spamming interactions.
 */
export class ActivitySystem extends GameSystem {
  private readonly activities = new Map<ActivityId, Activity>();
  private current: { activity: Activity; endsAt: number } | null = null;

  register(activity: Activity): this {
    this.activities.set(activity.id, activity);
    return this;
  }

  get(id: ActivityId): Activity | undefined {
    return this.activities.get(id);
  }

  get currentActivity(): Activity | null {
    return this.current?.activity ?? null;
  }

  /** 0–1 progress of the running activity. */
  get progress(): number {
    if (!this.current) return 0;
    const total = minutes(this.current.activity.minutes);
    return Math.min(1, 1 - (this.current.endsAt - this.state.now) / total);
  }

  /** Consumes a specific food or drink item from the refrigerator inventory. */
  consumeFromFridge(key: FridgeItemKey): StartResult {
    const spec = FRIDGE_ITEMS.find((i) => i.key === key);
    if (!spec) return 'unknown';

    if (spec.kind === 'baby') {
      this.notify('🍼 Walk over to the baby and press [E] to feed a Baby Milk bottle!', 'info');
      return 'blocked';
    }

    if (spec.kind === 'eat') {
      const eatAct = this.activities.get('eat') as EatActivity | undefined;
      if (eatAct) eatAct.selectedKey = key;
      return this.start('eat');
    }

    const drinkAct = this.activities.get('drink') as DrinkActivity | undefined;
    if (drinkAct) drinkAct.selectedKey = key;
    return this.start('drink');
  }

  start(id: ActivityId): StartResult {
    const activity = this.activities.get(id);
    if (!activity) return 'unknown';
    if (!this.state.player.isIdle) return 'busy';
    if (this.state.baby.location === 'carried' && id !== 'nap') {
      this.notify(
        '👶 You are holding the baby! Put the baby in the crib or bed (or sleep together) before doing anything else.',
        'warn',
      );
      return 'blocked';
    }
    const reason = activity.blockedReason(this.ctx);
    if (reason) {
      this.notify(reason, 'warn');
      return 'blocked';
    }
    activity.onStart(this.ctx);
    this.state.player.mode = activity.mode;
    this.current = { activity, endsAt: this.state.now + minutes(activity.minutes) };
    this.events.emit('activity:start', { id });
    this.changed();
    return 'started';
  }

  sitAtComputer(): boolean {
    if (!this.state.player.isIdle) return false;
    if (this.state.equipment.desk === null) {
      this.notify('💻 You sold your PC Workstation! You cannot use the computer.', 'warn');
      return false;
    }
    if (this.state.baby.location === 'carried') {
      this.notify(
        '👶 You cannot use the PC while holding the baby! Place the baby in the crib or bed first.',
        'warn',
      );
      return false;
    }
    this.state.player.mode = 'computer';
    this.changed();
    return true;
  }

  leaveComputer(): void {
    if (this.state.player.mode !== 'computer') return;
    this.state.player.mode = 'idle';
    this.changed();
  }

  override update(): void {
    if (!this.current || this.state.now < this.current.endsAt) return;
    const { activity } = this.current;
    this.current = null;
    activity.onComplete(this.ctx);
    this.state.player.mode = 'idle';
    this.events.emit('activity:end', { id: activity.id });
    this.changed();
  }
}
