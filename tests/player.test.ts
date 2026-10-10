import { describe, expect, it } from 'vitest';
import { advanceMinutes, advanceTo, createSession } from './helpers';

const noSchedule = { schedule: [] };

describe('ActivitySystem', () => {
  it('prevents spamming: a busy player cannot start another activity', () => {
    const session = createSession('medium', noSchedule);
    session.state.player.adjust('energy', -50);
    expect(session.activities.start('nap')).toBe('started');
    expect(session.activities.start('nap')).toBe('busy');
    expect(session.activities.sitAtComputer()).toBe(false);
    const energy = session.state.player.get('energy');
    advanceMinutes(session, 11);
    expect(session.state.player.mode).toBe('idle');
    expect(session.state.player.get('energy')).toBeGreaterThan(energy + 10);
  });

  it('eating consumes a meal and is blocked with an empty fridge', () => {
    const session = createSession('medium', noSchedule);
    session.state.fridge.meals = 1;
    expect(session.activities.start('eat')).toBe('started');
    expect(session.state.fridge.meals).toBe(0);
    advanceMinutes(session, 6);
    expect(session.activities.start('eat')).toBe('blocked');
  });

  it('caring for the baby stops the crying', () => {
    const session = createSession('medium', noSchedule);
    session.baby.makeHungry();
    expect(session.state.baby.crying).toBe(true);
    session.activities.start('care');
    advanceMinutes(session, 6);
    expect(session.state.baby.crying).toBe(false);
  });
});

describe('BabySystem', () => {
  it('starts crying at 11:30 by script and raises stress while crying', () => {
    const session = createSession();
    advanceTo(session, '11:29');
    expect(session.state.baby.crying).toBe(false);
    advanceTo(session, '11:31');
    expect(session.state.baby.crying).toBe(true);
  });

  it('critical crying triples stress gain', () => {
    const normal = createSession('medium', noSchedule);
    const critical = createSession('medium', noSchedule);
    normal.state.baby.needs = 50;
    critical.state.baby.needs = 10;
    const s1 = normal.state.player.get('stress');
    const s2 = critical.state.player.get('stress');
    advanceMinutes(normal, 60);
    advanceMinutes(critical, 60);
    const gainNormal = normal.state.player.get('stress') - s1;
    const gainCritical = critical.state.player.get('stress') - s2;
    expect(critical.state.baby.critical).toBe(true);
    expect(gainCritical).toBeGreaterThan(gainNormal * 2);
  });
});

describe('NeedsSystem', () => {
  it('food drains over time and starving adds stress', () => {
    const session = createSession('medium', noSchedule);
    const food = session.state.player.get('food');
    advanceMinutes(session, 60);
    expect(session.state.player.get('food')).toBeCloseTo(food - 5, 0);
  });

  it('increases bladder urgency over time and resets when using the toilet', () => {
    const session = createSession('medium', noSchedule);
    session.state.player.adjust('bladder', 75);
    expect(session.state.player.bladderLevel).toBe(3);
    expect(session.activities.start('toilet')).toBe('started');
    expect(session.state.player.mode).toBe('toilet');
    advanceMinutes(session, 5);
    expect(session.state.player.mode).toBe('idle');
    expect(session.state.player.get('bladder')).toBeLessThan(5);
    expect(session.state.player.bladderLevel).toBe(1);
  });

  it('progresses dirt through level 2 (odor) and level 3 (flies) and resets on shower', () => {
    const session = createSession('medium', noSchedule);
    expect(session.state.player.dirtLevel).toBe(1);
    session.state.player.adjust('dirt', 40);
    expect(session.state.player.dirtLevel).toBe(2);
    session.state.player.adjust('dirt', 35);
    expect(session.state.player.dirtLevel).toBe(3);

    expect(session.activities.start('shower')).toBe('started');
    expect(session.state.player.mode).toBe('showering');
    advanceMinutes(session, 7);
    expect(session.state.player.mode).toBe('idle');
    expect(session.state.player.dirtLevel).toBe(1);
  });
});

describe('MarketSystem', () => {
  it('buys groceries and refuses when broke', () => {
    const session = createSession('medium', noSchedule);
    const meals = session.state.fridge.meals;
    expect(session.market.buy('groceries')).toBe('ok');
    expect(session.state.fridge.meals).toBe(meals + 3);
    session.state.player.money = 0;
    expect(session.market.buy('groceries')).toBe('insufficient-funds');
    expect(session.market.buy('nope')).toBe('unknown');
  });
});
