import { html, render } from 'lit-html';
import type { GameSession } from '../game/GameSession';
import { APARTMENT_CATALOG, EQUIPMENT_CATALOG, FRIDGE_ITEMS } from '../game/config/content';
import type {
  ComputerAppId,
  EquipmentSlot,
  ItemTier,
  MarketCategory,
  MeetingState,
} from '../game/core/models';
import { formatDuration } from '../game/core/time';
import { UIComponent } from './Component';

export class Computer extends UIComponent {
  private activeTab: ComputerAppId = 'work';
  private marketMode: 'buy' | 'trade' | 'sell' = 'buy';
  private marketCategory: MarketCategory = 'all';

  constructor(
    container: HTMLElement,
    private readonly session: GameSession,
  ) {
    super(container, session.events);

    this.listen('computer:open', () => this.open());
    this.listen('computer:close', () => this.close());
    this.listen('meeting:start', () => this.render());
    this.listen('meeting:question', () => this.render());
    this.listen('meeting:end', () => this.render());
    this.listen('state:changed', () => this.render());
    this.listen('clock:tick', () => {
      if (!this.container.hidden) {
        this.render();
      }
    });

    this.container.addEventListener('mousemove', () => {
      this.session.meeting.registerActivity(performance.now());
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
    if (this.session.activities.sitAtComputer()) {
      this.container.hidden = false;
      this.render();
    }
  }

  close(): void {
    this.session.activities.leaveComputer();
    this.container.hidden = true;
  }

  setTab(tab: ComputerAppId): void {
    this.activeTab = tab;
    this.render();
  }

  render(): void {
    if (this.container.hidden) return;

    const tabs: ComputerAppId[] = ['work', 'email', 'calendar', 'jobs', 'market', 'bank'];
    const unreadCount = this.session.state.unreadEmails;
    const rentAlert = this.session.state.rentDue;

    const template = html`
      <section class="desktop">
        <header>
          <div class="brand">REMOTE//OS <small>WORKSTATION_01</small></div>
          <button class="close" type="button" @click=${() => this.close()}>
            RETURN TO APARTMENT [ESC] ×
          </button>
        </header>

        <nav>
          ${tabs.map(
            (tab) => html`
              <button
                type="button"
                class="${this.activeTab === tab ? 'active' : ''}"
                @click=${() => this.setTab(tab)}
              >
                ${tab.toUpperCase()}
                ${tab === 'email' && unreadCount > 0 ? html`(${unreadCount})` : ''}
                ${tab === 'bank' && rentAlert ? html`🚨` : ''}
              </button>
            `,
          )}
        </nav>

        <main class="panel">${this.renderActiveTab()} ${this.renderMeetingWidget()}</main>
      </section>
    `;

    render(template, this.container);
  }

  private renderActiveTab() {
    switch (this.activeTab) {
      case 'work':
        return this.renderWorkTab();
      case 'email':
        return this.renderEmailTab();
      case 'calendar':
        return this.renderCalendarTab();
      case 'jobs':
        return this.renderJobsTab();
      case 'market':
        return this.renderMarketTab();
      case 'bank':
        return this.renderBankTab();
      default:
        return html`<p class="muted">App not found.</p>`;
    }
  }

  private renderWorkTab() {
    const tasks = this.session.state.tasks;
    const rep = Math.round(this.session.state.player.get('reputation'));
    const isUnstable = this.session.state.internetUnstable;

    return html`
      <h2>ACTIVE CLIENT WORK</h2>
      ${
        isUnstable
          ? html`<p class="warn-banner">
              ⚠️ Slow connection detected: tasks require double effort!
            </p>`
          : ''
      }
      ${
        tasks.length
          ? tasks.map((task) => {
              const timeLeft = Math.max(0, task.dueAt - this.session.state.now);
              const pct = Math.min(100, (task.progress / task.required) * 100);
              return html`
                <article class="task ${task.urgent ? 'urgent-task' : ''}">
                  <div>
                    <b>${task.title} ${task.urgent ? '🔥 [URGENT]' : ''}</b>
                    <small>
                      ${task.type} · ${formatDuration(timeLeft)} left · Reward: $${task.reward}
                    </small>
                    <div class="progress">
                      <span style="width: ${pct}%"></span>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click=${() => {
                      this.session.tasks.work(task.id);
                    }}
                  >
                    DO WORK +
                  </button>
                </article>
              `;
            })
          : html`<p class="muted">
              No active tasks right now. Check your emails or freelance jobs.
            </p>`
      }
      <p class="rep">CLIENT REPUTATION: ${rep} / 100</p>
    `;
  }

  private renderEmailTab() {
    const emails = this.session.state.emails;
    return html`
      <h2>INBOX</h2>
      ${
        emails.length
          ? emails.map((email) => {
              if (email.unread) {
                email.unread = false;
              }
              return html`
                <article class="mail">
                  <b>${email.subject}</b>
                  <p>${email.body}</p>
                  ${
                    email.link
                      ? html`
                          <button
                            type="button"
                            @click=${() => {
                              if (email.link) this.setTab(email.link);
                            }}
                          >
                            VIEW IN ${email.link.toUpperCase()}
                          </button>
                        `
                      : ''
                  }
                </article>
              `;
            })
          : html`<p class="muted">Inbox zero. Enjoy the silence.</p>`
      }
    `;
  }

  private renderCalendarTab() {
    const meeting = this.session.state.meeting;
    const isLive = this.session.meeting.isLive;

    if (!meeting) {
      return html`
        <h2>CALENDAR · DAY ${this.session.state.day}</h2>
        <p class="muted">No meetings scheduled for today.</p>
      `;
    }

    let statusText = 'Invitation pending...';
    let buttonAction = null;

    if (isLive) {
      statusText = 'MEETING IN PROGRESS NOW!';
      buttonAction = html`<span class="live-indicator">● LIVE BELOW</span>`;
    } else if (meeting.status === 'invited') {
      const waitMinutes = Math.max(0, Math.ceil((meeting.startsAt - this.session.state.now) / 60));
      statusText = `Scheduled at 10:30 (starts in ${waitMinutes}m). Be ready!`;
    } else if (meeting.status === 'done') {
      statusText = `Meeting finished (${meeting.result === 'success' ? 'Satisfactory' : 'Unattended/Failed'}).`;
    }

    return html`
      <h2>CALENDAR · DAY ${this.session.state.day}</h2>
      <article class="meeting-card">
        <div>
          <b>10:30 — ${meeting.template.title}</b>
          <p>${meeting.template.briefing} <strong>${meeting.template.keyFact}</strong>.</p>
          <small class="meeting-status">${statusText}</small>
        </div>
        ${buttonAction}
      </article>
    `;
  }

  private renderJobsTab() {
    const offers = this.session.state.jobOffers;
    return html`
      <h2>FREELANCE JOB BOARD</h2>
      <p class="muted">Take extra gigs to make rent before the deadline.</p>
      ${
        offers.length
          ? offers.map(
              (offer) => html`
                <article class="task job-offer">
                  <div>
                    <b>${offer.title}</b>
                    <small>
                      ${offer.type} · Effort: ${offer.required} steps · Deadline:
                      ${formatDuration(offer.deadlineMinutes * 60)}
                    </small>
                    <p class="job-reward">Pays: $${offer.reward}</p>
                  </div>
                  <button
                    type="button"
                    @click=${() => {
                      this.session.jobs.accept(offer.id);
                    }}
                  >
                    ACCEPT GIG
                  </button>
                </article>
              `,
            )
          : html`<p class="muted">No new job postings today. Check back tomorrow.</p>`
      }
    `;
  }

  private renderMarketTab() {
    const { player, fridge, equipment } = this.session.state;
    const categories: { id: MarketCategory; label: string }[] = [
      { id: 'all', label: 'ALL' },
      { id: 'food', label: '🍲 FOOD & DRINKS' },
      { id: 'baby', label: '👶 BABY' },
      { id: 'devices', label: '💻 DEVICES' },
      { id: 'furniture', label: '🪑 FURNITURE' },
    ];

    const filteredConsumables = this.session.market.items.filter(
      (item) => this.marketCategory === 'all' || item.category === this.marketCategory,
    );

    const isHardApartment = this.session.state.apartmentTier === 1;

    // Desk and Chair are exchanged in the TRADE tab (never owned in duplicate or sold to empty)
    const buyableEquipment = EQUIPMENT_CATALOG.filter(
      (item) =>
        item.slot !== 'desk' &&
        item.slot !== 'chair' &&
        (!isHardApartment || item.slot !== 'table') &&
        (this.marketCategory === 'all' || item.category === this.marketCategory),
    );

    const sellableSlots: EquipmentSlot[] = (
      ['tv', 'router', 'bed', 'crib', 'sofa', 'table', 'stove', 'fridge'] as EquipmentSlot[]
    ).filter((slot) => !isHardApartment || slot !== 'table');

    return html`
      <div class="market-header-row">
        <h2>ONLINE MARKET, TRADE & RESALE</h2>
        <div class="market-mode-tabs">
          <button
            type="button"
            class="${this.marketMode === 'buy' ? 'active' : ''}"
            @click=${() => {
              this.marketMode = 'buy';
              this.render();
            }}
          >
            🛒 BUY STORE
          </button>
          <button
            type="button"
            class="${this.marketMode === 'trade' ? 'active' : ''}"
            @click=${() => {
              this.marketMode = 'trade';
              this.render();
            }}
          >
            🔄 TRADE (APT & SETUP)
          </button>
          <button
            type="button"
            class="${this.marketMode === 'sell' ? 'active' : ''}"
            @click=${() => {
              this.marketMode = 'sell';
              this.render();
            }}
          >
            💰 SELL ITEMS
          </button>
        </div>
      </div>

      <div class="fridge-summary-strip">
        <strong>🧊 FRIDGE STOCK:</strong>
        ${FRIDGE_ITEMS.map(
          (spec) => html`
            <span class="fridge-pill ${fridge[spec.key] === 0 ? 'empty' : ''}">
              ${spec.icon} ${spec.label}: <b>${fridge[spec.key]}</b>
            </span>
          `,
        )}
      </div>

      ${
        this.marketMode === 'buy'
          ? html`
              <div class="market-subnav">
                ${categories.map(
                  (cat) => html`
                    <button
                      type="button"
                      class="${this.marketCategory === cat.id ? 'active' : ''}"
                      @click=${() => {
                        this.marketCategory = cat.id;
                        this.render();
                      }}
                    >
                      ${cat.label}
                    </button>
                  `,
                )}
              </div>

              ${
                filteredConsumables.length > 0
                  ? html`
                      <h3 class="market-section-title">SUPPLIES & CONSUMABLES</h3>
                      <div class="market-grid">
                        ${filteredConsumables.map((item) => {
                          const canAfford = player.canAfford(item.price);
                          return html`
                            <article class="mail market-card">
                              <div class="market-card-main">
                                ${this.renderMarketThumb(item.image, item.icon, item.label)}
                                <div class="market-card-info">
                                  <b>${item.label} — $${item.price}</b>
                                  <p>${item.description}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                ?disabled=${!canAfford}
                                @click=${() => {
                                  this.session.market.buy(item.id);
                                }}
                              >
                                ${canAfford ? `BUY ($${item.price})` : 'INSUFFICIENT FUNDS'}
                              </button>
                            </article>
                          `;
                        })}
                      </div>
                    `
                  : ''
              }
              ${
                buyableEquipment.length > 0
                  ? html`
                      <h3 class="market-section-title">
                        HOUSEHOLD EQUIPMENT (NO DUPLICATES — SELL CURRENT ITEM FIRST TO BUY ANOTHER)
                      </h3>
                      <div class="market-grid">
                        ${buyableEquipment.map((equip) => {
                          const ownedTier = equipment[equip.slot];
                          const alreadyHasSlot = ownedTier !== null;
                          const isThisExactTier = ownedTier === equip.tier;
                          const canAfford = player.canAfford(equip.buyPrice);

                          let btnLabel = `BUY ($${equip.buyPrice})`;
                          if (isThisExactTier) btnLabel = '✓ OWNED (SELL FIRST)';
                          else if (alreadyHasSlot) btnLabel = '🔒 SELL CURRENT FIRST';
                          else if (!canAfford) btnLabel = 'INSUFFICIENT FUNDS';

                          const cardStateClass = isThisExactTier
                            ? 'owned-card'
                            : alreadyHasSlot
                              ? 'locked-card'
                              : '';

                          return html`
                            <article class="mail market-card ${cardStateClass}">
                              <div class="market-card-main">
                                ${this.renderMarketThumb(equip.image, equip.icon, equip.label)}
                                <div class="market-card-info">
                                  <small class="slot-tag tier-tag tier-${equip.tier}"
                                    >${equip.slotLabel.toUpperCase()} ·
                                    ${this.tierLabel(equip.tier)}</small
                                  >
                                  <b>${equip.label} — $${equip.buyPrice}</b>
                                  <p>${equip.description}</p>
                                  ${
                                    isThisExactTier
                                      ? html`<small class="market-lock-note owned-note">
                                          ✓ Currently owned. Sell it first if you want to buy a
                                          different one.
                                        </small>`
                                      : alreadyHasSlot
                                        ? html`<small class="market-lock-note">
                                            🔒 You already have a ${equip.slotLabel}
                                            (${this.tierLabel(ownedTier)}). To buy this one, sell
                                            your current one first!
                                          </small>`
                                        : ''
                                  }
                                </div>
                              </div>
                              <button
                                type="button"
                                ?disabled=${alreadyHasSlot || !canAfford}
                                @click=${() => {
                                  this.session.market.buyEquipment(equip.id);
                                }}
                              >
                                ${btnLabel}
                              </button>
                            </article>
                          `;
                        })}
                      </div>
                    `
                  : ''
              }
            `
          : this.marketMode === 'trade'
            ? this.renderTradeSection()
            : html`
                <p class="muted">
                  Sell furniture, appliances, or your TV for instant cash. Once sold, the slot
                  becomes empty and you can buy a Hard, Medium, or Easy replacement in the BUY tab.
                  (To change your Apartment, PC Desk, or Desk Chair, use the 🔄 TRADE tab!)
                </p>
                <div class="market-grid">
                  ${sellableSlots.map((slot) => {
                    const ownedTier = equipment[slot];
                    const spec = EQUIPMENT_CATALOG.find(
                      (e) => e.slot === slot && e.tier === (ownedTier ?? 1),
                    );
                    const slotLabel = spec?.slotLabel ?? slot.toUpperCase();

                    if (ownedTier === null || !spec) {
                      return html`
                        <article class="mail market-card sold-card">
                          <div class="market-card-main">
                            ${this.renderMarketThumb(undefined, spec?.icon ?? '📦', slotLabel)}
                            <div class="market-card-info">
                              <small class="slot-tag">${slotLabel.toUpperCase()} · EMPTY</small>
                              <b>No ${slotLabel} Owned</b>
                              <p>
                                You sold this item. Visit the BUY tab to purchase a Hard, Medium, or
                                Easy model.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            @click=${() => {
                              this.marketMode = 'buy';
                              this.marketCategory = slot === 'tv' ? 'devices' : 'furniture';
                              this.render();
                            }}
                          >
                            GO TO BUY TAB →
                          </button>
                        </article>
                      `;
                    }

                    return html`
                      <article class="mail market-card">
                        <div class="market-card-main">
                          ${this.renderMarketThumb(spec.image, spec.icon, spec.label)}
                          <div class="market-card-info">
                            <small class="slot-tag tier-tag tier-${ownedTier}"
                              >${slotLabel.toUpperCase()} · OWNED
                              ${this.tierLabel(ownedTier)}</small
                            >
                            <b>${spec.label}</b>
                            <p>${spec.description}</p>
                            <p class="job-reward">Resale Value: +$${spec.sellPrice}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="sell-btn"
                          @click=${() => {
                            this.session.market.sellEquipment(slot);
                          }}
                        >
                          SELL FOR +$${spec.sellPrice}
                        </button>
                      </article>
                    `;
                  })}
                </div>
              `
      }
    `;
  }

  private tierLabel(tier: ItemTier): 'HARD' | 'MEDIUM' | 'EASY' {
    return tier === 1 ? 'HARD' : tier === 2 ? 'MEDIUM' : 'EASY';
  }

  private renderMarketThumb(image: string | undefined, icon: string, alt: string, wide = false) {
    if (image) {
      return html`
        <div class="market-thumb-box ${wide ? 'wide' : ''}">
          <img class="market-thumb-img" src="${image}" alt="${alt}" />
        </div>
      `;
    }
    return html`
      <div class="market-thumb-box placeholder">
        <span class="market-thumb-icon">${icon}</span>
      </div>
    `;
  }

  private renderTradeSection() {
    const { player, apartmentTier, equipment } = this.session.state;
    const market = this.session.market;
    const deskItems = EQUIPMENT_CATALOG.filter((e) => e.slot === 'desk');
    const chairItems = EQUIPMENT_CATALOG.filter((e) => e.slot === 'chair');
    const currentDeskTier = equipment.desk ?? 1;
    const currentChairTier = equipment.chair ?? 1;

    return html`
      <p class="muted">
        Exchange your <strong>Apartment</strong>, <strong>PC Desk Setup</strong>, or
        <strong>Desk Chair</strong> (separately) up or down between Hard, Medium, and Easy. You
        cannot own duplicates of these — upgrading charges the difference, while downgrading gives
        you <strong>instant cash back</strong> (and moving to a cheaper apartment lowers your weekly
        rent!).
      </p>

      <h3 class="market-section-title">
        🏢 APARTMENT & RENT (CURRENT: ${this.tierLabel(apartmentTier)} ·
        $${this.session.economy.rent}/WK RENT)
      </h3>
      <div class="market-grid">
        ${APARTMENT_CATALOG.map((apt) => {
          const isCurrent = apt.tier === apartmentTier;
          const diff = market.getApartmentTradeDiff(apt.tier);
          const isUpgrade = diff > 0;
          const canAfford = !isUpgrade || player.canAfford(diff);

          let btnLabel = '✓ CURRENT APARTMENT';
          if (isUpgrade) {
            btnLabel = canAfford ? `UPGRADE APT (-$${diff})` : `NEED $${diff} TO UPGRADE`;
          } else if (diff < 0) {
            btnLabel = `MOVE & SAVE (+$${Math.abs(diff)} CASH · $${apt.weeklyRent}/WK)`;
          }

          return html`
            <article class="mail market-card ${isCurrent ? 'owned-card' : ''}">
              <div class="market-card-main">
                <div class="market-card-info">
                  <small class="slot-tag tier-tag tier-${apt.tier}"
                    >APARTMENT · ${this.tierLabel(apt.tier)}</small
                  >
                  <b>${apt.label}</b>
                  <p>${apt.description}</p>
                  <p class="job-reward">Weekly Rent: $${apt.weeklyRent}/wk</p>
                </div>
              </div>
              <button
                type="button"
                class="${diff < 0 ? 'sell-btn' : ''}"
                ?disabled=${isCurrent || !canAfford}
                @click=${() => {
                  market.tradeApartment(apt.tier);
                }}
              >
                ${btnLabel}
              </button>
            </article>
          `;
        })}
      </div>

      <h3 class="market-section-title">
        🖥️ PC DESK / WORKSTATION (SEPARATE FROM CHAIR · CURRENT: ${this.tierLabel(currentDeskTier)})
      </h3>
      <div class="market-grid">
        ${deskItems.map((item) => {
          const isCurrent = item.tier === currentDeskTier;
          const diff = market.getSetupTradeDiff('desk', item.tier);
          const isUpgrade = diff > 0;
          const canAfford = !isUpgrade || player.canAfford(diff);

          let btnLabel = '✓ CURRENT DESK';
          if (isUpgrade) {
            btnLabel = canAfford ? `TRADE UP (-$${diff})` : `NEED $${diff} TO UPGRADE`;
          } else if (diff < 0) {
            btnLabel = `TRADE DOWN (+$${Math.abs(diff)} CASH)`;
          }

          return html`
            <article class="mail market-card ${isCurrent ? 'owned-card' : ''}">
              <div class="market-card-main">
                ${this.renderMarketThumb(item.image, item.icon, item.label)}
                <div class="market-card-info">
                  <small class="slot-tag tier-tag tier-${item.tier}"
                    >PC DESK · ${this.tierLabel(item.tier)}</small
                  >
                  <b>${item.label}</b>
                  <p>${item.description}</p>
                </div>
              </div>
              <button
                type="button"
                class="${diff < 0 ? 'sell-btn' : ''}"
                ?disabled=${isCurrent || !canAfford}
                @click=${() => {
                  market.tradeSetup('desk', item.tier);
                }}
              >
                ${btnLabel}
              </button>
            </article>
          `;
        })}
      </div>

      <h3 class="market-section-title">
        💺 DESK CHAIR (SEPARATE FROM DESK · CURRENT: ${this.tierLabel(currentChairTier)})
      </h3>
      <div class="market-grid">
        ${chairItems.map((item) => {
          const isCurrent = item.tier === currentChairTier;
          const diff = market.getSetupTradeDiff('chair', item.tier);
          const isUpgrade = diff > 0;
          const canAfford = !isUpgrade || player.canAfford(diff);

          let btnLabel = '✓ CURRENT CHAIR';
          if (isUpgrade) {
            btnLabel = canAfford ? `TRADE UP (-$${diff})` : `NEED $${diff} TO UPGRADE`;
          } else if (diff < 0) {
            btnLabel = `TRADE DOWN (+$${Math.abs(diff)} CASH)`;
          }

          return html`
            <article class="mail market-card ${isCurrent ? 'owned-card' : ''}">
              <div class="market-card-main">
                ${this.renderMarketThumb(item.image, item.icon, item.label)}
                <div class="market-card-info">
                  <small class="slot-tag tier-tag tier-${item.tier}"
                    >DESK CHAIR · ${this.tierLabel(item.tier)}</small
                  >
                  <b>${item.label}</b>
                  <p>${item.description}</p>
                </div>
              </div>
              <button
                type="button"
                class="${diff < 0 ? 'sell-btn' : ''}"
                ?disabled=${isCurrent || !canAfford}
                @click=${() => {
                  market.tradeSetup('chair', item.tier);
                }}
              >
                ${btnLabel}
              </button>
            </article>
          `;
        })}
      </div>
    `;
  }

  private renderBankTab() {
    const { player, day, rentDue, evictionDaysLeft } = this.session.state;
    const economy = this.session.economy;
    const isPaid = economy.isCurrentCyclePaid;
    const canAffordRent = player.canAfford(economy.rent);

    return html`
      <h2>NEO-BANK ACCOUNT & RENT</h2>
      <p class="balance">$${player.money}</p>

      <div class="bank-details">
        <p><strong>Monthly / Cycle Rent (Due on the 1st):</strong> $${economy.rent}</p>
        <p class="muted">Current Day: Day ${day}</p>

        ${
          rentDue
            ? html`
                <div class="eviction-alert-box">
                  <b>🚨 RENT IS OVERDUE — ${evictionDaysLeft} DAY(S) UNTIL EVICTION!</b>
                  <p>
                    You have ${evictionDaysLeft} day${evictionDaysLeft === 1 ? '' : 's'} left to pay
                    your $${economy.rent} rent before the landlord evicts you and you lose the game!
                  </p>
                </div>
              `
            : isPaid
              ? html`
                  <p class="success-text">
                    ✓ Rent for the current billing cycle is PAID! Next cycle starts after Day
                    ${economy.nextRentDay}.
                  </p>
                `
              : html`
                  <p>
                    <strong>Next Rent Due Date:</strong> Day ${economy.nextRentDay} (in
                    ${economy.daysUntilRent} day${economy.daysUntilRent === 1 ? '' : 's'})
                  </p>
                  ${
                    player.money < economy.rent
                      ? html`<p class="danger-text">
                          ⚠️ Warning: You need $${economy.rent - player.money} more to afford the
                          upcoming rent!
                        </p>`
                      : html`<p class="success-text">
                          ✓ You have enough money in the bank ($${player.money}) to pay rent
                          whenever you choose.
                        </p>`
                  }
                `
        }

        <div class="bank-actions">
          <button
            type="button"
            class="pay-rent-btn"
            ?disabled=${isPaid || !canAffordRent}
            @click=${() => {
              this.session.economy.payRent();
            }}
          >
            ${
              isPaid
                ? '✓ RENT ALREADY PAID'
                : canAffordRent
                  ? `💳 PAY RENT NOW ($${economy.rent})`
                  : `INSUFFICIENT FUNDS FOR RENT ($${economy.rent})`
            }
          </button>
        </div>
      </div>
    `;
  }

  private renderMeetingWidget() {
    const meeting = this.session.state.meeting;
    if (!meeting || !this.session.meeting.isLive) return '';

    return html`
      <section class="meeting">
        <div class="video">
          <div class="face">◕‿◕<small>LEAD</small></div>
          <div class="face">•ᴗ•<small>CLIENT</small></div>
          <div class="face you">^‿^<small>YOU</small></div>
        </div>
        <div class="meeting-top">
          <b>LIVE: ${meeting.template.title}</b>
          <span
            >Ends in
            ${Math.max(0, Math.ceil((meeting.endsAt - this.session.state.now) / 60))}m</span
          >
        </div>
        <div class="attention">
          ATTENTION <i><em style="width:${Math.max(0, meeting.attention)}%"></em></i>
          ${Math.ceil(meeting.attention)}%
        </div>
        <p class="dialogue">CLIENT: “${meeting.template.dialogue}”</p>
        ${this.renderMeetingQuestion(meeting)}
      </section>
    `;
  }

  private renderMeetingQuestion(meeting: MeetingState) {
    if (!meeting.questionShown || meeting.answered) return '';

    return html`
      <div class="question">
        <b>TEAM LEAD:</b> ${meeting.template.question}
        <div>
          ${meeting.template.options.map(
            (option, idx) => html`
              <button
                type="button"
                @click=${() => {
                  this.session.meeting.answer(idx);
                }}
              >
                ${option}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }
}
