import { describe, expect, it } from 'vitest';
import { formatClock, formatDuration, isWithinWindow, parseClock } from '../src/game/core/time';
import { createSession } from './helpers';

describe('time helpers', () => {
  it('parses and formats HH:MM', () => {
    expect(parseClock('09:42')).toBe(9 * 3600 + 42 * 60);
    expect(formatClock(parseClock('23:59'))).toBe('23:59');
    expect(() => parseClock('25:00')).toThrow();
  });

  it('formats durations', () => {
    expect(formatDuration(45 * 60)).toBe('45m');
    expect(formatDuration(125 * 60)).toBe('2h 05m');
  });

  it('supports windows crossing midnight', () => {
    expect(isWithinWindow(parseClock('23:30'), parseClock('22:00'), parseClock('06:00'))).toBe(
      true,
    );
    expect(isWithinWindow(parseClock('12:00'), parseClock('22:00'), parseClock('06:00'))).toBe(
      false,
    );
  });
});

describe('ClockSystem', () => {
  it('starts at 09:00 on day 1 and runs 144x real time', () => {
    const session = createSession();
    expect(session.state.timeLabel()).toBe('DAY 1 · 09:00');
    session.clock.advance(1000);
    expect(session.state.timeLabel()).toBe('DAY 1 · 09:02');
  });

  it('rolls over several days in a single huge delta', () => {
    const session = createSession();
    const days: number[] = [];
    session.events.on('day:changed', ({ day }) => days.push(day));
    // 3 full days (3 × 600 real seconds) in one call.
    session.clock.advance(3 * 600 * 1000);
    expect(session.state.day).toBe(4);
    expect(days).toEqual([2, 3, 4]);
    expect(session.state.secondsOfDay).toBeGreaterThanOrEqual(0);
    expect(session.state.secondsOfDay).toBeLessThan(86400);
    expect(formatClock(session.state.secondsOfDay)).toBe('09:00');
  });

  it('clamps large frame deltas in GameSession.update', () => {
    const session = createSession();
    session.update(60_000); // a minute-long tab freeze
    expect(session.state.timeLabel()).toBe('DAY 1 · 09:00'); // 250 ms → 36 game seconds
    expect(session.state.realElapsed).toBeCloseTo(0.25);
  });

  it('does not advance while paused', () => {
    const session = createSession();
    session.pause();
    session.update(250);
    expect(session.state.realElapsed).toBe(0);
    session.resume();
    session.update(250);
    expect(session.state.realElapsed).toBeCloseTo(0.25);
  });
});
