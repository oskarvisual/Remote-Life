import { BALANCE } from '../config/balance';
import { GameSystem, type FrameTime } from '../core/GameSystem';
import { SECONDS_PER_HOUR } from '../core/time';

/** Passive hunger and fatigue, plus the stress they cause when neglected. */
export class NeedsSystem extends GameSystem {
  private readonly config = BALANCE.needs;
  private starving = false;
  private exhausted = false;

  override update({ gameSeconds }: FrameTime): void {
    const { player } = this.state;
    const hours = gameSeconds / SECONDS_PER_HOUR;

    const food = player.adjust('food', -this.config.foodDrainPerHour * hours);
    if (player.mode !== 'napping') player.adjust('energy', -this.config.energyDrainPerHour * hours);
    const energy = player.get('energy');

    const starving = food < this.config.starvingThreshold;
    if (starving) player.adjust('stress', this.config.starvingStressPerHour * hours);
    if (starving && !this.starving) this.events.emit('needs:starving');
    this.starving = starving;

    const exhausted = energy <= 0;
    if (exhausted) player.adjust('stress', this.config.exhaustedStressPerHour * hours);
    if (exhausted && !this.exhausted) this.events.emit('needs:exhausted');
    this.exhausted = exhausted;
  }
}
