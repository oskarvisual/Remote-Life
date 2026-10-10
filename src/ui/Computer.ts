import { html, render } from 'lit-html';
import type { GameSession } from '../game/GameSession';
import type { ComputerAppId, MeetingState } from '../game/core/models';
import { formatDuration } from '../game/core/time';
import { UIComponent } from './Component';

export class Computer extends UIComponent {
  private activeTab: ComputerAppId = 'work';

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
      // Re-render if open to update time countdowns smoothly
      if (!this.container.hidden) {
        this.render();
      }
    });

    // Wire mouse interaction to keep meeting attention active
    this.container.addEventListener('mousemove', () => {
      this.session.meeting.registerActivity(performance.now());
    });

    // Allow closing the computer with Escape key
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
    const items = this.session.market.items;
    const player = this.session.state.player;

    return html`
      <h2>ONLINE GROCERY & MARKET</h2>
      <p class="muted">Delivery items straight to your home.</p>
      <div class="market-grid">
        ${items.map((item) => {
          const canAfford = player.canAfford(item.price);
          return html`
            <article class="mail market-card">
              <b>${item.label} — $${item.price}</b>
              <p>${item.description}</p>
              <button
                type="button"
                ?disabled=${!canAfford}
                @click=${() => {
                  this.session.market.buy(item.id);
                }}
              >
                ${canAfford ? 'PURCHASE' : 'INSUFFICIENT FUNDS'}
              </button>
            </article>
          `;
        })}
      </div>
    `;
  }

  private renderBankTab() {
    const { player, day } = this.session.state;
    const economy = this.session.economy;

    return html`
      <h2>NEO-BANK ACCOUNT</h2>
      <p class="balance">$${player.money}</p>
      <div class="bank-details">
        <p><strong>Next Rent Due:</strong> $${economy.rent}</p>
        <p>
          <strong>Due Date:</strong> Day ${economy.nextRentDay} (in ${economy.daysUntilRent} days)
        </p>
        <p class="muted">Current Day: Day ${day}</p>
        ${
          player.money < economy.rent
            ? html`<p class="danger-text">
                ⚠️ Warning: You need $${economy.rent - player.money} more to afford rent!
              </p>`
            : html`<p class="success-text">✓ You currently have enough funds for rent.</p>`
        }
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
