import { BALANCE } from '../config/balance';
import { GameSystem, type SystemContext } from '../core/GameSystem';
import type { OutcomeReason } from '../core/models';

/** Watches lose/win conditions and ends the session exactly once. */
export class GameOverSystem extends GameSystem {
  constructor(ctx: SystemContext) {
    super(ctx);
    this.listen('rent:missed', () => this.end('evicted'));
    this.listen('rent:paid', ({ day }) => {
      if (day >= BALANCE.economy.victoryDay) this.end('week-survived');
    });
  }

  override update(): void {
    const { player, baby } = this.state;
    if (player.get('stress') >= 100) this.end('burnout');
    else if (player.get('reputation') <= 0) this.end('fired');
    else if (baby.kitchenFire && baby.fireElapsedSeconds >= BALANCE.baby.fireGameOverMinutes * 60) {
      this.end('kitchen-fire');
    }
  }

  end(reason: OutcomeReason): void {
    if (this.state.status === 'over') return;
    const outcome = { victory: reason === 'week-survived', reason };
    this.state.status = 'over';
    this.state.outcome = outcome;
    this.events.emit('game:over', outcome);
  }
}
