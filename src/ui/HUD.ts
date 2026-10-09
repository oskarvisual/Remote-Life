import { html, render } from 'lit-html';
import type { GameSession } from '../game/GameSession';
import { UIComponent } from './Component';

export class HUD extends UIComponent {
  constructor(
    container: HTMLElement,
    private readonly session: GameSession,
  ) {
    super(container, session.events);

    this.listen('clock:tick', () => this.render());
    this.listen('state:changed', () => this.render());
    this.render();
  }

  render(): void {
    const { player, fridge } = this.session.state;
    const daysUntilRent = this.session.economy.daysUntilRent;
    const internetBad = this.session.state.internetUnstable;

    const statBar = (label: string, value: number, alertThreshold = 25, isInverse = false) => {
      const isAlert = isInverse ? value > 100 - alertThreshold : value < alertThreshold;
      return html`
        <span class="stat-item ${isAlert ? 'alert' : ''}">
          <b>${label}</b>
          <i><em style="width:${Math.max(0, Math.min(100, value))}%"></em></i>
          ${Math.round(value)}
        </span>
      `;
    };

    const template = html`
      <div class="time">
        ${this.session.state.timeLabel()}
        ${internetBad ? html`<span class="wifi-bad">⚠️ NO WIFI</span>` : ''}
      </div>
      <div class="stats">
        <span class="money">$${player.money}</span>
        ${statBar('STR', player.get('stress'), 30, true)} ${statBar('ENG', player.get('energy'))}
        ${statBar('HUN', player.get('food'))} ${statBar('REP', player.get('reputation'))}
        <span class="fridge-meals" title="Meals in fridge">🍱 ${fridge.meals}</span>
        <span class="rent-badge" title="Rent due">🏠 ${daysUntilRent}d</span>
      </div>
      <div class="hint">← → / A D move · E interact (Desk, Bed, Fridge, Crib)</div>
    `;

    render(template, this.container);
  }
}
