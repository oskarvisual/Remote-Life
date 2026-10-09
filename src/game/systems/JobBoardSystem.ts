import { BALANCE } from '../config/balance';
import { TASK_TEMPLATES } from '../config/content';
import { GameSystem, type SystemContext } from '../core/GameSystem';
import type { JobOffer, Task } from '../core/models';
import type { TaskSystem } from './TaskSystem';

/** Freelance gigs: a fresh set of optional offers every day. */
export class JobBoardSystem extends GameSystem {
  private readonly config = BALANCE.jobs;

  constructor(
    ctx: SystemContext,
    private readonly tasks: TaskSystem,
  ) {
    super(ctx);
    this.refresh();
    this.listen('day:changed', () => this.refresh());
  }

  accept(offerId: string): Task | null {
    const offer = this.state.jobOffers.find((o) => o.id === offerId);
    if (!offer) return null;
    const task = this.tasks.add({
      title: offer.title,
      type: offer.type,
      required: offer.required,
      deadlineMinutes: offer.deadlineMinutes,
      reward: offer.reward,
      penalty: BALANCE.tasks.penalty,
      urgent: false,
      source: 'job',
    });
    if (task) this.state.jobOffers = this.state.jobOffers.filter((o) => o !== offer);
    this.changed();
    return task;
  }

  private refresh(): void {
    const { random } = this.ctx;
    const [minReward, maxReward] = this.config.reward;
    const [minUnits, maxUnits] = this.config.workUnits;
    const [minDeadline, maxDeadline] = this.config.deadlineMinutes;
    this.state.jobOffers = Array.from({ length: this.config.offersPerDay }, (): JobOffer => {
      const template = random.pick(TASK_TEMPLATES);
      return {
        id: this.state.nextId('job'),
        title: template.title,
        type: template.type,
        reward: Math.round(random.int(minReward, maxReward) / 5) * 5,
        required: random.int(minUnits, maxUnits),
        deadlineMinutes: Math.round(random.int(minDeadline, maxDeadline) / 10) * 10,
      };
    });
    this.changed();
  }
}
