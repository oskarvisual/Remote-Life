import { html, render } from 'lit-html';
import type { GameSession } from '../game/GameSession';
import { UIComponent } from './Component';

export class MobileControls extends UIComponent {
  private primaryLabel: string | null = null;
  private secondaryLabel: string | null = null;
  private canClean = false;
  private canDrink = false;

  constructor(
    container: HTMLElement,
    private readonly session: GameSession,
  ) {
    super(container, session.events);

    this.listen('ui:actions', (actions) => {
      this.primaryLabel = actions.primaryLabel;
      this.secondaryLabel = actions.secondaryLabel;
      this.canClean = actions.canClean;
      this.canDrink = actions.canDrink;
      this.render();
    });

    this.render();
  }

  private emitVirtualKey(
    key: 'left' | 'right' | 'interact' | 'baby' | 'clean' | 'drink',
    pressed: boolean,
  ): void {
    this.session.events.emit('input:virtual', { key, pressed });
  }

  private bindDpadButton(key: 'left' | 'right') {
    return {
      handleEvent: (event: Event) => {
        if (event.type === 'pointerdown' || event.type === 'touchstart') {
          event.preventDefault();
          this.emitVirtualKey(key, true);
        } else if (
          event.type === 'pointerup' ||
          event.type === 'pointercancel' ||
          event.type === 'pointerleave' ||
          event.type === 'touchend'
        ) {
          event.preventDefault();
          this.emitVirtualKey(key, false);
        }
      },
    };
  }

  private triggerAction(key: 'interact' | 'baby' | 'clean' | 'drink') {
    return (event: Event) => {
      event.preventDefault();
      this.emitVirtualKey(key, true);
      // Quickly release after short tick
      setTimeout(() => this.emitVirtualKey(key, false), 50);
    };
  }

  render(): void {
    const leftHandler = this.bindDpadButton('left');
    const rightHandler = this.bindDpadButton('right');

    const template = html`
      <div class="mobile-controls-dpad" aria-label="Movement Controls">
        <button
          type="button"
          class="mobile-btn dpad-btn"
          aria-label="Move Left"
          @pointerdown=${leftHandler}
          @pointerup=${leftHandler}
          @pointercancel=${leftHandler}
          @pointerleave=${leftHandler}
          @contextmenu=${(e: Event) => e.preventDefault()}
        >
          ◀
        </button>
        <button
          type="button"
          class="mobile-btn dpad-btn"
          aria-label="Move Right"
          @pointerdown=${rightHandler}
          @pointerup=${rightHandler}
          @pointercancel=${rightHandler}
          @pointerleave=${rightHandler}
          @contextmenu=${(e: Event) => e.preventDefault()}
        >
          ▶
        </button>
      </div>

      <div class="mobile-controls-center">
        <a
          class="mobile-github-link"
          href="https://github.com/oskarvisual/Remote-Life"
          target="_blank"
          rel="noreferrer"
          aria-label="View on GitHub"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
            <path
              d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.483 0-.237-.009-.866-.014-1.7-2.782.604-3.369-1.34-3.369-1.34-.455-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.004.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.092.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.57 9.57 0 0 1 12 6.805c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.027 1.591 1.027 2.683 0 3.842-2.338 4.687-4.566 4.935.359.31.678.92.678 1.852 0 1.337-.012 2.416-.012 2.744 0 .268.18.58.688.481A10.001 10.001 0 0 0 22 12c0-5.523-4.477-10-10-10Z"
            />
          </svg>
          <span>GITHUB</span>
        </a>
      </div>

      <div class="mobile-controls-actions" aria-label="Action Controls">
        ${
          this.canDrink
            ? html`
                <button
                  type="button"
                  class="mobile-btn quick-btn"
                  @pointerdown=${this.triggerAction('drink')}
                >
                  💧 DRINK
                </button>
              `
            : ''
        }
        ${
          this.canClean
            ? html`
                <button
                  type="button"
                  class="mobile-btn quick-btn"
                  @pointerdown=${this.triggerAction('clean')}
                >
                  🧹 CLEAN
                </button>
              `
            : ''
        }
        ${
          this.secondaryLabel
            ? html`
                <button
                  type="button"
                  class="mobile-btn secondary-btn"
                  @pointerdown=${this.triggerAction('baby')}
                >
                  ${this.secondaryLabel}
                </button>
              `
            : ''
        }
        <button
          type="button"
          class="mobile-btn primary-btn ${this.primaryLabel ? 'active' : 'disabled'}"
          ?disabled=${!this.primaryLabel}
          @pointerdown=${this.triggerAction('interact')}
        >
          ${this.primaryLabel ?? 'ACTION'}
        </button>
      </div>
    `;

    render(template, this.container);
  }
}
