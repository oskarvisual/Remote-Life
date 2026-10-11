import { BALANCE } from '../config/balance';
import { GameSystem, type FrameTime } from '../core/GameSystem';
import type { FilthLevel } from '../core/models';
import { SECONDS_PER_HOUR } from '../core/time';

const clamp100 = (val: number): number => Math.max(0, Math.min(100, val));

/** Passive hunger, fatigue, bladder urgency, dirtiness, and apartment filth/trash progression. */
export class NeedsSystem extends GameSystem {
  private readonly config = BALANCE.needs;
  private starving = false;
  private thirsty = false;
  private exhausted = false;
  private bladderUrgent = false;
  private bladderCritical = false;
  private smelly = false;
  private flies = false;
  private lastAnnouncedFilthLevel: FilthLevel = 1;

  override update({ gameSeconds }: FrameTime): void {
    const { player, filth } = this.state;
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

    // 3. Dirtiness / Hygiene (Level 1 clean, Level 2 odor, Level 3 flies + rapid gain if hands unwashed after toilet)
    if (player.mode !== 'showering' && player.mode !== 'washing-hands') {
      const dirtRate =
        this.config.dirtGainPerHour +
        (player.unwashedHands ? this.config.unwashedHandsDirtPerHour : 0);
      player.adjust('dirt', dirtRate * hours);
    }
    const dirt = player.get('dirt');
    const smelly = dirt >= this.config.dirtSmellThreshold;
    const flies = dirt >= this.config.dirtFliesThreshold;

    if (smelly && !this.smelly) {
      this.events.emit('needs:smelly');
      this.notify('🤢 You are starting to smell bad. Take a shower.', 'warn');
    }
    if (flies) {
      player.adjust('stress', this.config.dirtFliesStressPerHour * hours);
      if (!this.flies) {
        this.events.emit('needs:flies');
        this.notify('🪰 Flies are swarming around you! Take a shower!', 'danger');
      }
    }
    this.smelly = smelly;
    this.flies = flies;

    // 4. Apartment Filth & Trash Progression (Levels 1 to 5 across Bedroom/Living, Bathroom, and Kitchen)
    if (player.mode !== 'cleaning') {
      filth.bedroom = clamp100(filth.bedroom + this.config.filthGainPerHour * 0.9 * hours);
      filth.bathroom = clamp100(filth.bathroom + this.config.filthGainPerHour * 1.1 * hours);
      filth.kitchen = clamp100(filth.kitchen + this.config.filthGainPerHour * 1.05 * hours);
    }

    const maxFilth = this.state.maxFilthLevel;
    const filthStressPerHour = this.config.filthStressPerHourByLevel[maxFilth] ?? 0;
    if (filthStressPerHour > 0) {
      player.adjust('stress', filthStressPerHour * hours);
      this.state.wife.stress = clamp100(this.state.wife.stress + filthStressPerHour * 0.8 * hours);
    }

    if (maxFilth > this.lastAnnouncedFilthLevel) {
      if (maxFilth === 2) {
        this.notify(
          '🗑️ Trash bins are filling up! Clean the kitchen, bathroom & rooms [C] or [E].',
          'warn',
        );
      } else if (maxFilth === 3) {
        this.notify('🗑️⚠️ Trash bins are overflowing! Clean the apartment soon (+Stress)!', 'warn');
      } else if (maxFilth === 4) {
        this.notify(
          '💩 Gross! The bathroom is so dirty that poop appeared on the floor! Clean it now!',
          'danger',
        );
      } else if (maxFilth === 5) {
        this.notify(
          '🛍️🚨 Trash bags are piling up across the rooms! Stress is rising fast!',
          'danger',
        );
      }
    }
    this.lastAnnouncedFilthLevel = maxFilth;

    // 5. Environment & Setup Comfort Stress (ugly Lv.1 apartment, desk, chair, or bed increases stress faster)
    const comfort = this.config.comfortStressPerHour;
    const aptStress = comfort.apartment[this.state.apartmentTier] ?? 0;
    const deskTier = this.state.equipment.desk ?? 1;
    const chairTier = this.state.equipment.chair ?? 1;
    const bedTier = this.state.equipment.bed ?? 0;

    const pcMult = player.mode === 'computer' ? comfort.atComputerMultiplier : 1;
    const deskStress = (comfort.desk[deskTier] ?? 0) * pcMult;
    const chairStress = (comfort.chair[chairTier] ?? 0) * pcMult;
    const bedStress = comfort.bed[bedTier] ?? 0;

    const totalEnvStressPerHour = aptStress + deskStress + chairStress + bedStress;
    if (totalEnvStressPerHour !== 0) {
      player.adjust('stress', totalEnvStressPerHour * hours);
    }
  }
}
