import type { EventBus } from '../game/core/EventBus';
import type { GameEvents } from '../game/core/events';
import type { NoticeKind } from '../game/core/models';
import { UIComponent } from './Component';

export class Notifications extends UIComponent {
  constructor(container: HTMLElement, events: EventBus<GameEvents>) {
    super(container, events);

    this.listen('notify', ({ text, kind }) => this.add(text, kind ?? 'info'));
    this.listen('task:new', (task) => this.add(`NEW TASK: ${task.title}`, 'info'));
    this.listen('task:done', (task) => this.add(`TASK COMPLETE +$${task.reward}`, 'success'));
    this.listen('task:failed', (task) => this.add(`DEADLINE MISSED: ${task.title}`, 'danger'));
    this.listen('email:new', (email) => this.add(`NEW EMAIL: ${email.subject}`, 'info'));
    this.listen('meeting:invite', (m) => this.add(`MEETING INVITE: ${m.template.title}`, 'warn'));
    this.listen('meeting:start', (m) => this.add(`MEETING STARTED: ${m.template.title}`, 'danger'));
    this.listen('baby:crying', () => this.add('BABY IS CRYING — stress rising', 'danger'));
    this.listen('baby:critical', () => this.add('BABY IN CRITICAL NEED! Stress spike!', 'danger'));
    this.listen('needs:starving', () => this.add('YOU ARE STARVING! Eat something soon', 'warn'));
    this.listen('needs:exhausted', () => this.add('YOU ARE EXHAUSTED! Take a rest', 'warn'));
    this.listen('internet:problem', () => this.add('INTERNET UNSTABLE — work slowed', 'warn'));
    this.listen('internet:restored', () => this.add('INTERNET RESTORED', 'success'));
    this.listen('rent:paid', ({ amount }) => this.add(`RENT PAID: -$${amount}`, 'success'));
    this.listen('rent:missed', ({ amount }) =>
      this.add(`RENT MISSED: Couldn't pay $${amount}`, 'danger'),
    );
  }

  add(text: string, kind: NoticeKind = 'info'): void {
    const notice = document.createElement('div');
    notice.className = `notice ${kind}`;
    notice.textContent = text;
    this.container.appendChild(notice);

    setTimeout(() => {
      notice.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      notice.style.opacity = '0';
      notice.style.transform = 'translateX(100%)';
      setTimeout(() => notice.remove(), 400);
    }, 4500);
  }

  render(): void {
    // Notifications are added dynamically as events occur
  }
}
