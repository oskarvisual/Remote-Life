import { html, render } from 'lit-html';
import type { GameSession } from '../game/GameSession';
import { FRIDGE_ITEMS } from '../game/config/content';
import type { FridgeItemKey } from '../game/core/models';
import { UIComponent } from './Component';

export class FridgeModal extends UIComponent {
  constructor(
    container: HTMLElement,
    private readonly session: GameSession,
  ) {
    super(container, session.events);

    this.listen('fridge:open', () => this.open());
    this.listen('fridge:close', () => this.close());
    this.listen('state:changed', () => {
      if (!this.container.hidden) this.render();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !this.container.hidden) {
        event.preventDefault();
        this.close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    this.subscriptions.push(() => window.removeEventListener('keydown', onKeyDown));
  }

  open(): void {
    if (this.session.state.equipment.fridge === null) {
      this.session.events.emit('notify', {
        text: '🧊 You sold your refrigerator! Buy a new Fridge in the MARKET app.',
        kind: 'warn',
      });
      return;
    }
    this.container.hidden = false;
    this.render();
  }

  close(): void {
    this.container.hidden = true;
  }

  private consume(key: FridgeItemKey): void {
    const res = this.session.activities.consumeFromFridge(key);
    if (res === 'started') {
      this.close();
    }
  }

  render(): void {
    if (this.container.hidden) return;
    const { fridge, equipment } = this.session.state;
    const tier = equipment.fridge ?? 1;
    const tierName = tier === 1 ? 'HARD' : tier === 2 ? 'MEDIUM' : 'EASY';

    const template = html`
      <section class="fridge-window">
        <header>
          <div>
            <strong>🧊 REFRIGERATOR INVENTORY (${tierName})</strong>
            <small>Select food or drinks to consume · Restock in the PC MARKET app</small>
          </div>
          <button type="button" class="close" @click=${() => this.close()}>CLOSE [ESC] ×</button>
        </header>

        <div class="fridge-grid">
          ${FRIDGE_ITEMS.map((item) => {
            const count = fridge[item.key];
            const isBaby = item.kind === 'baby';
            const actionLabel = isBaby
              ? 'USED AT CRIB / BABY'
              : item.kind === 'eat'
                ? '🍽️ EAT NOW'
                : '💧 DRINK NOW';

            return html`
              <article class="fridge-item-card ${count === 0 ? 'out-of-stock' : ''}">
                <div class="fridge-item-top">
                  <span class="fridge-icon">${item.icon}</span>
                  <div>
                    <b>${item.label}</b>
                    <small>${item.description}</small>
                  </div>
                  <span class="stock-count ${count === 0 ? 'zero' : ''}">x${count}</span>
                </div>
                <button
                  type="button"
                  ?disabled=${count <= 0 || isBaby}
                  @click=${() => this.consume(item.key)}
                >
                  ${count <= 0 ? 'OUT OF STOCK (BUY IN MARKET)' : actionLabel}
                </button>
              </article>
            `;
          })}
        </div>
      </section>
    `;

    render(template, this.container);
  }
}
