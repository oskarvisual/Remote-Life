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
    const { player, fridge, baby } = this.session.state;
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

    const levelMap = {
      hard: 'LVL 1 (HARD)',
      medium: 'LVL 2 (MED)',
      easy: 'LVL 3 (EASY)',
    } as const;

    const dirtBadge =
      player.dirtLevel === 3 ? '🪰 LV3' : player.dirtLevel === 2 ? '🤢 LV2' : '✨ LV1';

    const babyBadge =
      baby.location === 'carried'
        ? baby.carriedAsleep
          ? '👶💤 HELD ASLEEP'
          : '👶 HELD'
        : baby.location === 'loose'
          ? '👶 LOOSE!'
          : baby.location === 'bed'
            ? '👶 IN BED'
            : baby.demand === 'feed'
              ? '🍼 HUNGRY'
              : baby.demand === 'crawl'
                ? '🏃 RUN'
                : baby.demand === 'sleep'
                  ? '😴 SLEEPY'
                  : '👶 CRIB';

    const hour = this.session.state.secondsOfDay / 3600;
    const phaseBadge =
      hour >= 7 && hour < 16.5 ? '☀️ DAY' : hour >= 16.5 && hour < 20.5 ? '🌅 DUSK' : '🌙 NIGHT';

    const template = html`
      <div class="time">
        <span>${levelMap[this.session.state.difficulty.id]}</span>
        <span>·</span>
        ${this.session.state.timeLabel()}
        <span>·</span>
        <span>${phaseBadge}</span>
        ${internetBad ? html`<span class="wifi-bad">⚠️ NO WIFI</span>` : ''}
        ${baby.kitchenFire ? html`<span class="wifi-bad">🔥 FIRE</span>` : ''}
        ${baby.pcUnplugged ? html`<span class="wifi-bad">🔌 PC OFF</span>` : ''}
      </div>
      <div class="stats">
        <span class="money">$${player.money}</span>
        ${statBar('STR', player.get('stress'), 30, true)} ${statBar('ENG', player.get('energy'))}
        ${statBar('HUN', player.get('food'))} ${statBar('HYD', player.get('hydration'))}
        ${statBar('WC', player.get('bladder'), 40, true)}
        ${statBar('DIRT', player.get('dirt'), 60, true)}
        <span class="fridge-meals" title="Hygiene level">${dirtBadge}</span>
        <span class="fridge-meals" title="Baby status">${babyBadge}</span>
        ${statBar('REP', player.get('reputation'))}
        <span class="fridge-meals" title="Meals in fridge">🍱 ${fridge.meals}</span>
        <span class="rent-badge" title="Rent due">🏠 ${daysUntilRent}d</span>
      </div>
      <div class="hint">
        ← → / A D move · E interact · [R] Drink Water (at Fridge) · [F] Carry/Put Down Baby · [M]
        Baby Need (Test) · [1/2/3] Level · [B] +Bladder · [N] +Dirt · [T] +2h
      </div>
    `;

    render(template, this.container);
  }
}
