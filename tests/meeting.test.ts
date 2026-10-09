import { describe, expect, it } from 'vitest';
import { advanceMinutes, advanceTo, createSession } from './helpers';

const noSchedule = { schedule: [] };

describe('MeetingSystem', () => {
  it('sends the invite at 09:40 and goes live exactly at 10:30 on the game clock', () => {
    const session = createSession();
    advanceTo(session, '09:39');
    expect(session.state.meeting?.status).toBe('scheduled');

    advanceTo(session, '09:41');
    expect(session.state.meeting?.status).toBe('invited');
    expect(session.state.emails.some((e) => e.subject.includes('Meeting invite'))).toBe(true);

    advanceTo(session, '10:29');
    expect(session.meeting.isLive).toBe(false);

    advanceTo(session, '10:31');
    expect(session.meeting.isLive).toBe(true);
  });

  it('cannot be answered before the question or before it is live', () => {
    const session = createSession('medium', noSchedule);
    advanceTo(session, '09:45');
    expect(session.meeting.answer(1)).toBeNull();
    advanceTo(session, '10:35');
    expect(session.meeting.answer(1)).toBeNull(); // question appears after 30 minutes
  });

  it('succeeds when the player attends and answers correctly', () => {
    const session = createSession('medium', noSchedule);
    advanceTo(session, '10:25');
    session.activities.sitAtComputer();
    advanceTo(session, '11:05');
    expect(session.state.meeting?.questionShown).toBe(true);
    const answerIndex = session.state.meeting!.template.answerIndex;
    expect(session.meeting.answer(answerIndex)).toBe(true);
    expect(session.meeting.answer(answerIndex)).toBeNull(); // only once

    const reputationBefore = session.state.player.get('reputation');
    advanceTo(session, '12:01');
    expect(session.state.meeting?.result).toBe('success');
    expect(session.state.player.get('reputation')).toBe(reputationBefore + 5);
  });

  it('fails when the player stays away from the computer', () => {
    const session = createSession('medium', noSchedule);
    let result: boolean | null = null;
    session.events.on('meeting:end', ({ success }) => (result = success));
    advanceTo(session, '12:01');
    expect(result).toBe(false);
    expect(session.state.meeting?.result).toBe('failed');
  });

  it('plans a new meeting each day with a different template', () => {
    const session = createSession('medium', noSchedule);
    advanceTo(session, '09:10');
    const firstTitle = session.state.meeting?.template.title;
    advanceMinutes(session, 24 * 60);
    expect(session.state.day).toBe(2);
    expect(session.state.meeting?.day).toBe(2);
    expect(session.state.meeting?.template.title).not.toBe(firstTitle);
  });
});
