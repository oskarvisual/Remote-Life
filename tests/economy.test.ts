import { describe, expect, it } from 'vitest';
import type { GameOutcome } from '../src/game/core/models';
import { advanceMinutes, createSession } from './helpers';

const noSchedule = { schedule: [] };

/** Keeps the player alive so long simulations only test the economy. */
function keepAlive(session: ReturnType<typeof createSession>): void {
  session.events.on('clock:tick', () => {
    session.state.player.adjust('stress', -100);
    session.state.player.adjust('reputation', 100);
  });
}

describe('EconomySystem', () => {
  it('reports days until rent', () => {
    const session = createSession('medium', noSchedule);
    expect(session.economy.nextRentDay).toBe(8);
    expect(session.economy.daysUntilRent).toBe(7);
  });

  it('allows manual rent payment in the Bank app and wins the week on day 8', () => {
    const session = createSession('medium', noSchedule);
    keepAlive(session);
    session.state.player.money = 1000;
    let outcome: GameOutcome | null = null;
    session.events.on('game:over', (o) => (outcome = o));
    advanceMinutes(session, 7 * 24 * 60);
    expect(session.state.day).toBe(8);
    expect(session.state.rentDue).toBe(true);
    expect(session.state.evictionDaysLeft).toBe(5);
    expect(session.economy.payRent()).toBe('ok');
    expect(session.state.player.money).toBe(300);
    expect(outcome).toEqual({ victory: true, reason: 'week-survived' });
    expect(session.state.status).toBe('over');
  });

  it('starts a 5-day eviction countdown when rent is unpaid and evicts after 5 days', () => {
    const session = createSession('medium', noSchedule);
    keepAlive(session);
    session.state.player.money = 100;
    // Advance to Day 8 (rent due date: 5 days until eviction)
    advanceMinutes(session, 7 * 24 * 60);
    expect(session.state.rentDue).toBe(true);
    expect(session.state.evictionDaysLeft).toBe(5);
    expect(session.state.status).toBe('running');

    // Advance 4 more days (Days 9, 10, 11, 12 -> 1 day left)
    advanceMinutes(session, 4 * 24 * 60);
    expect(session.state.evictionDaysLeft).toBe(1);
    expect(session.state.status).toBe('running');

    // Advance 1 more day (Day 13 -> evicted!)
    advanceMinutes(session, 1 * 24 * 60);
    expect(session.state.outcome?.reason).toBe('evicted');
  });
});

describe('GameOverSystem', () => {
  it('ends with burnout at 100 stress and stops simulating', () => {
    const session = createSession('medium', noSchedule);
    session.state.player.adjust('stress', 100);
    session.update(250);
    expect(session.state.outcome?.reason).toBe('burnout');
    const time = session.state.now;
    session.update(250);
    expect(session.state.now).toBe(time);
  });

  it('ends when reputation reaches zero', () => {
    const session = createSession('medium', noSchedule);
    session.state.player.adjust('reputation', -100);
    session.update(250);
    expect(session.state.outcome).toEqual({ victory: false, reason: 'fired' });
  });

  it('emits game:over only once', () => {
    const session = createSession('medium', noSchedule);
    let count = 0;
    session.events.on('game:over', () => count++);
    session.gameOver.end('fired');
    session.gameOver.end('burnout');
    expect(count).toBe(1);
  });
});

describe('ScheduleSystem', () => {
  it('fires custom entries once per day', () => {
    const session = createSession('medium', {
      schedule: [{ id: 'ping', at: '10:00', action: 'ping' }],
    });
    let calls = 0;
    session.schedule.register('ping', () => calls++);
    keepAlive(session);
    advanceMinutes(session, 3 * 24 * 60);
    expect(calls).toBe(3);
  });

  it('throws for an unregistered action', () => {
    const session = createSession('medium', {
      schedule: [{ id: 'x', at: '09:01', action: 'missing' }],
    });
    expect(() => advanceMinutes(session, 5)).toThrow(/missing/);
  });
});
