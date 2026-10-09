import { describe, expect, it } from 'vitest';
import { advanceMinutes, advanceTo, createSession } from './helpers';

const noSchedule = { schedule: [] };

describe('TaskSystem', () => {
  it('scripted first task arrives at 09:15, not before', () => {
    const session = createSession();
    advanceTo(session, '09:14');
    expect(session.state.tasks).toHaveLength(0);
    advanceTo(session, '09:16');
    expect(session.state.tasks).toHaveLength(1);
  });

  it('fails a task at its deadline and applies the penalty', () => {
    const session = createSession('medium', noSchedule);
    advanceTo(session, '12:05'); // after the daily meeting, so it doesn't affect reputation
    const task = session.tasks.spawn()!;
    const reputation = session.state.player.get('reputation');
    advanceMinutes(session, 199);
    expect(session.state.tasks).toContain(task);
    advanceMinutes(session, 2);
    expect(session.state.tasks).not.toContain(task);
    expect(session.state.player.get('reputation')).toBe(reputation - task.penalty);
  });

  it('applies the difficulty deadline multiplier', () => {
    const easy = createSession('easy', noSchedule).tasks.spawn()!;
    const hard = createSession('hard', noSchedule).tasks.spawn()!;
    expect(easy.dueAt).toBeGreaterThan(hard.dueAt);
  });

  it('completes a task and pays the reward', () => {
    const session = createSession('medium', noSchedule);
    const task = session.tasks.spawn()!;
    const money = session.state.player.money;
    for (let i = 0; i < task.required - 1; i++)
      expect(session.tasks.work(task.id)).toBe('progress');
    expect(session.tasks.work(task.id)).toBe('done');
    expect(session.state.player.money).toBe(money + task.reward);
    expect(session.tasks.work(task.id)).toBe('missing');
  });

  it('blocks work when exhausted', () => {
    const session = createSession('medium', noSchedule);
    const task = session.tasks.spawn()!;
    session.state.player.adjust('energy', -100);
    expect(session.tasks.work(task.id)).toBe('exhausted');
    expect(task.progress).toBe(0);
  });

  it('halves progress while the internet is unstable', () => {
    const session = createSession('medium', noSchedule);
    const task = session.tasks.spawn()!;
    session.internet.startOutage(30);
    session.tasks.work(task.id);
    expect(task.progress).toBe(0.5);
    advanceMinutes(session, 31);
    expect(session.state.internetUnstable).toBe(false);
    session.tasks.work(task.id);
    expect(task.progress).toBe(1.5);
  });

  it('respects the max active task limit', () => {
    const session = createSession('medium', noSchedule);
    for (let i = 0; i < 5; i++) expect(session.tasks.spawn()).not.toBeNull();
    expect(session.tasks.spawn()).toBeNull();
  });

  it('accepting a job offer creates a task and removes the offer', () => {
    const session = createSession('medium', noSchedule);
    const offer = session.state.jobOffers[0]!;
    const task = session.jobs.accept(offer.id);
    expect(task?.source).toBe('job');
    expect(task?.reward).toBe(offer.reward);
    expect(session.state.jobOffers).not.toContain(offer);
  });
});
