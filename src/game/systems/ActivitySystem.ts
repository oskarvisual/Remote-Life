import type { Activity } from '../activities/Activity';
import { GameSystem } from '../core/GameSystem';
import type { ActivityId } from '../core/models';
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

  start(id: ActivityId): StartResult {
    const activity = this.activities.get(id);
    if (!activity) return 'unknown';
    if (!this.state.player.isIdle) return 'busy';
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
