import { html, render } from 'lit-html';
import type { GameSession } from '../game/GameSession';
import type { WifeActivity } from '../game/core/models';
import { UIComponent } from './Component';

export class HUD extends UIComponent {
  private detailsOpen = false;

  constructor(
    container: HTMLElement,
    private readonly session: GameSession,
  ) {
    super(container, session.events);

    this.listen('clock:tick', () => {
      this.render();
      this.syncStatsModalIfOpen();
    });
    this.listen('state:changed', () => {
      this.render();
      this.syncStatsModalIfOpen();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        this.toggleDetails();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    this.subscriptions.push(() => window.removeEventListener('keydown', onKeyDown));

    const statsDialog = document.querySelector<HTMLDialogElement>('#stats-modal');
    if (statsDialog) {
      const onDialogClick = (event: MouseEvent) => {
        if (event.target === statsDialog) {
          this.closeStatsModal();
        }
      };
      statsDialog.addEventListener('click', onDialogClick);
      this.subscriptions.push(() => statsDialog.removeEventListener('click', onDialogClick));
    }

    this.render();
  }

  override destroy(): void {
    this.closeStatsModal();
    super.destroy();
  }

  toggleDetails(): void {
    this.detailsOpen = !this.detailsOpen;
    this.render();
  }

  private openStatsModal(): void {
    const dialog = document.querySelector<HTMLDialogElement>('#stats-modal');
    if (dialog) {
      this.renderStatsModalContent(dialog);
      if (!dialog.open) {
        dialog.showModal();
      }
    }
  }

  private closeStatsModal(): void {
    const dialog = document.querySelector<HTMLDialogElement>('#stats-modal');
    if (dialog?.open) {
      dialog.close();
    }
  }

  private syncStatsModalIfOpen(): void {
    const dialog = document.querySelector<HTMLDialogElement>('#stats-modal');
    if (dialog?.open) {
      this.renderStatsModalContent(dialog);
    }
  }

  private getWifeActivityLabel(activity: WifeActivity): string {
    switch (activity) {
      case 'sleeping':
        return '😴 SLEEPING';
      case 'watching-tv':
        return '📺 WATCHING TV';
      case 'out':
        return '🚪 OUT OF HOME';
      case 'helping-baby':
        return '🍼 HELPING BABY';
      case 'eating':
        return '🍲 EATING';
      case 'drinking':
        return '💧 DRINKING';
      case 'toilet':
        return '🚽 IN TOILET';
      case 'washing-hands':
        return '🧼 WASHING HANDS';
      case 'cleaning':
        return '🧹 CLEANING';
      case 'showering':
        return '🚿 SHOWERING';
      default:
        return '🧍 IDLE';
    }
  }

  private renderStatsModalContent(dialog: HTMLDialogElement): void {
    const { player, wife, fridge, baby, difficulty } = this.session.state;
    const daysUntilRent = this.session.economy.daysUntilRent;

    const fullStatRow = (label: string, value: number, alertThreshold = 25, isInverse = false) => {
      const isAlert = isInverse ? value >= 100 - alertThreshold : value <= alertThreshold;
      return html`
        <div class="detail-stat-row ${isAlert ? 'alert' : ''}">
          <span class="detail-stat-label">${label}</span>
          <i class="detail-bar">
            <em style="width:${Math.max(0, Math.min(100, value))}%"></em>
          </i>
          <span class="detail-stat-val">${Math.round(value)}%</span>
        </div>
      `;
    };

    const wifeProfileMap = {
      hard: 'Sleeps Often · Goes Out · Rarely Helps',
      medium: 'Watches TV · Night Sleeper · Helps Often',
      easy: 'Watches TV · Daytime Naps · Helps Sometimes',
    } as const;

    const dirtBadge =
      player.dirtLevel === 3 ? '🪰 FILTHY' : player.dirtLevel === 2 ? '🤢 SMELLY' : '✨ CLEAN';

    const modalTemplate = html`
      <div class="stats-modal-card">
        <header class="stats-modal-header">
          <div class="stats-modal-title">
            <strong>FAMILY & WORK STATS</strong>
            <small>
              Day ${this.session.state.day} · ${this.session.state.timeLabel()} · $${player.money}
            </small>
          </div>
          <button
            type="button"
            class="close-modal-btn"
            aria-label="Close Stats"
            @click=${() => this.closeStatsModal()}
          >
            ✕ CLOSE
          </button>
        </header>

        <div class="stats-modal-family-grid">
          <div class="family-card">
            <header class="family-card-header">
              <strong>🧑 YOU (PLAYER)</strong>
              <span class="status-pill">${player.mode.toUpperCase()} · ${dirtBadge}</span>
            </header>
            <small class="family-sub"
              >Remote Worker · Rep ${Math.round(player.get('reputation'))}%</small
            >
            <div class="detail-stat-list">
              ${fullStatRow('STRESS', player.get('stress'), 30, true)}
              ${fullStatRow('ENERGY', player.get('energy'), 25, false)}
              ${fullStatRow('HUNGER', player.get('food'), 25, false)}
              ${fullStatRow('HYDRATION', player.get('hydration'), 25, false)}
              ${fullStatRow('BLADDER (WC)', player.get('bladder'), 35, true)}
              ${fullStatRow('DIRT / ODOR', player.get('dirt'), 40, true)}
              ${fullStatRow('REPUTATION', player.get('reputation'), 30, false)}
            </div>
            <div class="mobile-stats-extra">
              <span
                >🧊 Meals: ${this.session.state.totalFoodStock} · Water: ${fridge.water} · Milk:
                ${fridge.babyMilk}</span
              >
              <span
                >${
                  this.session.state.rentDue
                    ? '🚨 RENT OVERDUE'
                    : `🏠 Rent in ${daysUntilRent} days`
                }</span
              >
            </div>
          </div>

          <div class="family-card">
            <header class="family-card-header">
              <strong>👩 WIFE (PARTNER)</strong>
              <span class="status-pill">${this.getWifeActivityLabel(wife.activity)}</span>
            </header>
            <small class="family-sub">${wifeProfileMap[difficulty.id]}</small>
            <div class="detail-stat-list">
              ${fullStatRow('STRESS', wife.stress, 30, true)}
              ${fullStatRow('ENERGY', wife.energy, 25, false)}
              ${fullStatRow('HUNGER', wife.food, 25, false)}
              ${fullStatRow('HYDRATION', wife.hydration, 25, false)}
              ${fullStatRow('BLADDER (WC)', wife.bladder, 35, true)}
              ${fullStatRow('DIRT / ODOR', wife.dirt, 40, true)}
            </div>
          </div>

          <div class="family-card">
            <header class="family-card-header">
              <strong>👶 BABY</strong>
              <span class="status-pill">
                ${baby.location.toUpperCase()}
                ${baby.demand !== 'none' ? `· NEEDS ${baby.demand.toUpperCase()}` : '· CALM'}
              </span>
            </header>
            <small class="family-sub">
              ${
                baby.crying
                  ? '😭 Crying! Needs care right away'
                  : baby.location === 'loose'
                    ? '⚠️ Crawling loose in apartment'
                    : '😊 Resting safely'
              }
            </small>
            <div class="detail-stat-list">
              ${fullStatRow('COMFORT', baby.needs, 45, false)}
              ${fullStatRow('STRESS', baby.stress, 35, true)}
              ${fullStatRow('ENERGY', baby.energy, 25, false)}
              ${fullStatRow('HUNGER (MILK)', baby.food, 30, false)}
              ${fullStatRow('HYDRATION', baby.hydration, 30, false)}
              ${fullStatRow('DIAPER DIRT', baby.dirt, 40, true)}
            </div>
          </div>
        </div>

        <footer class="stats-modal-footer">
          <button
            type="button"
            class="close-modal-btn full-width"
            @click=${() => this.closeStatsModal()}
          >
            CLOSE STATS
          </button>
        </footer>
      </div>
    `;

    render(modalTemplate, dialog);
  }

  render(): void {
    const { player, wife, fridge, baby, difficulty } = this.session.state;
    const daysUntilRent = this.session.economy.daysUntilRent;
    const internetBad = this.session.state.internetUnstable;

    const statBar = (label: string, value: number, alertThreshold = 25, isInverse = false) => {
      const isAlert = isInverse ? value >= 100 - alertThreshold : value <= alertThreshold;
      return html`
        <span class="stat-item ${isAlert ? 'alert' : ''}">
          <b>${label}</b>
          <i><em style="width:${Math.max(0, Math.min(100, value))}%"></em></i>
          ${Math.round(value)}
        </span>
      `;
    };

    const fullStatRow = (label: string, value: number, alertThreshold = 25, isInverse = false) => {
      const isAlert = isInverse ? value >= 100 - alertThreshold : value <= alertThreshold;
      return html`
        <div class="detail-stat-row ${isAlert ? 'alert' : ''}">
          <span class="detail-stat-label">${label}</span>
          <i class="detail-bar">
            <em style="width:${Math.max(0, Math.min(100, value))}%"></em>
          </i>
          <span class="detail-stat-val">${Math.round(value)}%</span>
        </div>
      `;
    };

    const levelMap = {
      hard: 'HARD',
      medium: 'MEDIUM',
      easy: 'EASY',
    } as const;

    const wifeProfileMap = {
      hard: 'Sleeps Often · Goes Out · Rarely Helps',
      medium: 'Watches TV · Night Sleeper · Helps Often',
      easy: 'Watches TV · Daytime Naps · Helps Sometimes',
    } as const;

    // Critical condition checks for compact HUD
    const isHungryCrit = player.get('food') < 28;
    const isThirstyCrit = player.get('hydration') < 28;
    const isBladderCrit = player.get('bladder') >= 60;
    const isDirtCrit = player.get('dirt') >= 40;
    const isRepCrit = player.get('reputation') < 35;
    const maxFilthLevel = this.session.state.maxFilthLevel;

    const wifeCritical =
      wife.stress >= 70 ||
      wife.food < 25 ||
      wife.hydration < 25 ||
      wife.energy < 20 ||
      wife.dirt >= 65;

    const babyCriticalOrActive =
      baby.crying ||
      baby.critical ||
      baby.location === 'loose' ||
      baby.location === 'carried' ||
      baby.demand !== 'none';

    const babyAlertText =
      baby.location === 'carried'
        ? baby.carriedAsleep
          ? '👶💤 HELD ASLEEP'
          : '👶 HELD'
        : baby.location === 'loose'
          ? '👶⚠️ LOOSE!'
          : baby.demand === 'feed'
            ? '🍼 HUNGRY!'
            : baby.demand === 'crawl'
              ? '🏃 WANTS TO CRAWL!'
              : baby.demand === 'sleep'
                ? '😴 SLEEPY!'
                : '👶⚠️ CRYING!';

    const dirtBadge =
      player.dirtLevel === 3 ? '🪰 FILTHY' : player.dirtLevel === 2 ? '🤢 SMELLY' : '✨ CLEAN';

    const filthBadge =
      maxFilthLevel >= 5
        ? '🛍️ TRASH PILE'
        : maxFilthLevel === 4
          ? '💩 FILTHY'
          : maxFilthLevel === 3
            ? '🗑️ OVERFLOWING'
            : '🗑️ MESSY';

    const hour = this.session.state.secondsOfDay / 3600;
    const phaseBadge =
      hour >= 7 && hour < 16.5 ? '☀️ DAY' : hour >= 16.5 && hour < 20.5 ? '🌅 DUSK' : '🌙 NIGHT';

    const template = html`
      <!-- Mobile Top Row (~5% height): Left super summarized, Right money & stats button -->
      <div class="hud-mobile-row">
        <div class="time mobile-time">
          <span>${phaseBadge}</span>
          <span>${this.session.state.timeLabel()}</span>
          <span>·</span>
          <span>D${this.session.state.day}</span>
          ${internetBad ? html`<span class="wifi-bad">⚠️ WIFI</span>` : ''}
          ${baby.kitchenFire ? html`<span class="wifi-bad">🔥 FIRE</span>` : ''}
          ${baby.pcUnplugged ? html`<span class="wifi-bad">🔌 PC</span>` : ''}
        </div>
        <div class="stats mobile-stats">
          <span class="money">$${player.money}</span>
          <button
            type="button"
            class="stats-toggle-btn mobile-stats-btn"
            @click=${() => this.openStatsModal()}
          >
            📊 STATS
          </button>
        </div>
      </div>

      <!-- Desktop Top Row: unchanged for desktop users -->
      <div class="hud-top-row hud-desktop-row">
        <div class="time">
          <span>${levelMap[difficulty.id]}</span>
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
          ${statBar('STR', player.get('stress'), 30, true)}
          ${statBar('ENG', player.get('energy'), 25, false)}
          ${isHungryCrit ? statBar('HUN', player.get('food'), 28, false) : ''}
          ${isThirstyCrit ? statBar('HYD', player.get('hydration'), 28, false) : ''}
          ${isBladderCrit ? statBar('WC', player.get('bladder'), 40, true) : ''}
          ${
            player.unwashedHands
              ? html`<span class="fridge-meals alert-badge" title="Wash hands at sink or shower"
                  >🧼 WASH HANDS</span
                >`
              : ''
          }
          ${
            isDirtCrit
              ? html`<span class="fridge-meals alert-badge" title="Hygiene warning"
                  >${dirtBadge}</span
                >`
              : ''
          }
          ${
            maxFilthLevel >= 2
              ? html`<span
                  class="fridge-meals alert-badge"
                  title="Apartment filth warning (press C to clean)"
                >
                  ${filthBadge}
                </span>`
              : ''
          }
          ${isRepCrit ? statBar('REP', player.get('reputation'), 35, false) : ''}
          ${
            wifeCritical
              ? html`<span class="fridge-meals alert-badge" title="Wife has a critical need">
                  👩⚠️ WIFE
                </span>`
              : ''
          }
          ${
            babyCriticalOrActive
              ? html`<span class="fridge-meals alert-badge" title="Baby needs attention">
                  ${babyAlertText}
                </span>`
              : ''
          }
          <span class="fridge-meals" title="Fridge stock (Food / Water / Baby Milk)">
            🧊 ${this.session.state.totalFoodStock}🍽️ ${fridge.water}💧 ${fridge.babyMilk}🍼
          </span>
          ${
            this.session.state.rentDue
              ? html`<span class="rent-badge alert-badge" title="Eviction countdown">
                  🚨 EVICT ${this.session.state.evictionDaysLeft}d
                </span>`
              : html`<span class="rent-badge" title="Days until rent">🏠 ${daysUntilRent}d</span>`
          }
          <button
            type="button"
            class="stats-toggle-btn ${this.detailsOpen ? 'active' : ''}"
            @click=${() => this.toggleDetails()}
          >
            📊 STATS [TAB] ${this.detailsOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

      ${
        this.detailsOpen
          ? html`
              <section
                class="family-stats-panel hud-desktop-dropdown"
                aria-label="Family Statistics"
              >
                <div class="family-card">
                  <header class="family-card-header">
                    <strong>🧑 YOU (PLAYER)</strong>
                    <span class="status-pill">${player.mode.toUpperCase()} · ${dirtBadge}</span>
                  </header>
                  <small class="family-sub"
                    >Remote Worker · Rep ${Math.round(player.get('reputation'))}%</small
                  >
                  <div class="detail-stat-list">
                    ${fullStatRow('STRESS', player.get('stress'), 30, true)}
                    ${fullStatRow('ENERGY', player.get('energy'), 25, false)}
                    ${fullStatRow('HUNGER', player.get('food'), 25, false)}
                    ${fullStatRow('HYDRATION', player.get('hydration'), 25, false)}
                    ${fullStatRow('BLADDER (WC)', player.get('bladder'), 35, true)}
                    ${fullStatRow('DIRT / ODOR', player.get('dirt'), 40, true)}
                    ${fullStatRow('REPUTATION', player.get('reputation'), 30, false)}
                  </div>
                </div>

                <div class="family-card">
                  <header class="family-card-header">
                    <strong>👩 WIFE (PARTNER)</strong>
                    <span class="status-pill">${this.getWifeActivityLabel(wife.activity)}</span>
                  </header>
                  <small class="family-sub">${wifeProfileMap[difficulty.id]}</small>
                  <div class="detail-stat-list">
                    ${fullStatRow('STRESS', wife.stress, 30, true)}
                    ${fullStatRow('ENERGY', wife.energy, 25, false)}
                    ${fullStatRow('HUNGER', wife.food, 25, false)}
                    ${fullStatRow('HYDRATION', wife.hydration, 25, false)}
                    ${fullStatRow('BLADDER (WC)', wife.bladder, 35, true)}
                    ${fullStatRow('DIRT / ODOR', wife.dirt, 40, true)}
                  </div>
                </div>

                <div class="family-card">
                  <header class="family-card-header">
                    <strong>👶 BABY</strong>
                    <span class="status-pill">
                      ${baby.location.toUpperCase()}
                      ${baby.demand !== 'none' ? `· NEEDS ${baby.demand.toUpperCase()}` : '· CALM'}
                    </span>
                  </header>
                  <small class="family-sub">
                    ${
                      baby.crying
                        ? '😭 Crying! Needs care right away'
                        : baby.location === 'loose'
                          ? '⚠️ Crawling loose in apartment'
                          : '😊 Resting safely'
                    }
                  </small>
                  <div class="detail-stat-list">
                    ${fullStatRow('COMFORT', baby.needs, 45, false)}
                    ${fullStatRow('STRESS', baby.stress, 35, true)}
                    ${fullStatRow('ENERGY', baby.energy, 25, false)}
                    ${fullStatRow('HUNGER (MILK)', baby.food, 30, false)}
                    ${fullStatRow('HYDRATION', baby.hydration, 30, false)}
                    ${fullStatRow('DIAPER DIRT', baby.dirt, 40, true)}
                  </div>
                </div>
              </section>
            `
          : ''
      }

      <div class="hint">
        ← → / A D move · E interact · [C] Clean Room · [R] Drink Water · [F] Carry Baby · [TAB]
        Stats · [1/2/3] Difficulty · [V] Test Filth
      </div>
    `;

    render(template, this.container);
  }
}
