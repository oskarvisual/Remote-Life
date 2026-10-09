import { OUTCOMES } from '../game/config/outcomes';
import type { GameOutcome } from '../game/core/models';
import { clearProfile } from './StartMenu';

export class GameOverModal {
  constructor(
    private readonly dialog: HTMLDialogElement,
    private readonly onRestart: () => void,
  ) {}

  show(outcome: GameOutcome): void {
    const outcomeData = OUTCOMES[outcome.reason];
    const isWin = outcome.victory;

    this.dialog.innerHTML = `
      <div class="start-card game-over-card ${isWin ? 'victory-card' : 'defeat-card'}">
        <p class="eyebrow">${isWin ? 'CONGRATULATIONS' : 'TERMINATED'}</p>
        <h1 style="color: ${isWin ? '#70c182' : '#f35c5c'};">${outcomeData.title}</h1>
        <p>${outcomeData.message}</p>
        <div class="difficulty-list">
          <button type="button" id="restart-btn" style="text-align: center; font-size: 18px; font-weight: bold;">
            TRY AGAIN
          </button>
        </div>
      </div>
    `;

    this.dialog.querySelector('#restart-btn')?.addEventListener('click', () => {
      this.dialog.close();
      clearProfile();
      this.onRestart();
    });

    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  close(): void {
    if (this.dialog.open) {
      this.dialog.close();
    }
  }
}
