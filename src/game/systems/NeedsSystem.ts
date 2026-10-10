import { BALANCE } from '../config/balance';
import { GameSystem, type FrameTime } from '../core/GameSystem';
import { SECONDS_PER_HOUR } from '../core/time';

/** Passive hunger, fatigue, bladder urgency and dirtiness, plus stress when neglected. */
export class NeedsSystem extends GameSystem {
  private readonly config = BALANCE.needs;
  private starving = false;
  private thirsty = false;
  private exhausted = false;
  private bladderUrgent = false;
  private bladderCritical = false;
  private smelly = false;
  private flies = false;

  override update({ gameSeconds }: FrameTime): void {
    const { player } = this.state;
    const hours = gameSeconds / SECONDS_PER_HOUR;

    // 1. Hunger, Hydration & Energy
    const food = player.adjust('food', -this.config.foodDrainPerHour * hours);
    const hydration = player.adjust('hydration', -this.config.hydrationDrainPerHour * hours);
    if (player.mode !== 'napping') player.adjust('energy', -this.config.energyDrainPerHour * hours);
    const energy = player.get('energy');

    const starving = food < this.config.starvingThreshold;
    if (starving) player.adjust('stress', this.config.starvingStressPerHour * hours);
    if (starving && !this.starving) this.events.emit('needs:starving');
    this.starving = starving;

    const thirsty = hydration < this.config.thirstyThreshold;
    if (thirsty) player.adjust('stress', this.config.thirstyStressPerHour * hours);
    if (thirsty && !this.thirsty) {
      this.events.emit('needs:thirsty');
      this.notify('💧 Getting thirsty! Go to the fridge and press [R] to drink water.', 'warn');
    }
    this.thirsty = thirsty;

    const exhausted = energy <= 0;
    if (exhausted) player.adjust('stress', this.config.exhaustedStressPerHour * hours);
    if (exhausted && !this.exhausted) this.events.emit('needs:exhausted');
    this.exhausted = exhausted;

    // 2. Bladder urgency
    if (player.mode !== 'toilet') {
      player.adjust('bladder', this.config.bladderGainPerHour * hours);
    }
    const bladder = player.get('bladder');
    const bladderUrgent = bladder >= this.config.bladderUrgentThreshold;
    const bladderCritical = bladder >= this.config.bladderCriticalThreshold;

    if (bladderUrgent && !this.bladderUrgent) {
      this.events.emit('needs:bladder-urgent');
      this.notify('You need to use the bathroom soon (TOILET).', 'warn');
    }
    if (bladderCritical) {
      player.adjust('stress', this.config.bladderCriticalStressPerHour * hours);
      if (!this.bladderCritical) {
        this.events.emit('needs:bladder-critical');
        this.notify('URGENT! You MUST use the toilet right now!', 'danger');
      }
    }
    this.bladderUrgent = bladderUrgent;
    this.bladderCritical = bladderCritical;

    // 3. Dirtiness / Hygiene (Level 1 clean, Level 2 odor, Level 3 flies)
    if (player.mode !== 'showering') {
      player.adjust('dirt', this.config.dirtGainPerHour * hours);
    }
    const dirt = player.get('dirt');
    const smelly = dirt >= this.config.dirtSmellThreshold;
    const flies = dirt >= this.config.dirtFliesThreshold;

    if (smelly && !this.smelly) {
      this.events.emit('needs:smelly');
      this.notify('Dirt Level 2: You are starting to smell bad. Take a shower.', 'warn');
    }
    if (flies) {
      player.adjust('stress', this.config.dirtFliesStressPerHour * hours);
      if (!this.flies) {
        this.events.emit('needs:flies');
        this.notify('Dirt Level 3! Flies are swarming around you. Take a shower!', 'danger');
      }
    }
    this.smelly = smelly;
    this.flies = flies;
  }
}
