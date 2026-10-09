import { BALANCE } from '../config/balance';
import { MEETING_TEMPLATES } from '../config/content';
import { GameSystem, type FrameTime, type SystemContext } from '../core/GameSystem';
import type { MeetingState, MeetingTemplate } from '../core/models';
import { minutes, parseClock, SECONDS_PER_HOUR } from '../core/time';

/**
 * Daily meeting lifecycle: scheduled → invited → live → done.
 * The meeting goes live automatically at its scheduled time (it cannot be
 * started early). Being away from the computer drains attention faster.
 */
export class MeetingSystem extends GameSystem {
  private readonly config = BALANCE.meeting;
  private lastActivityMs = Number.NEGATIVE_INFINITY;

  constructor(
    ctx: SystemContext,
    private readonly templates: readonly MeetingTemplate[] = MEETING_TEMPLATES,
  ) {
    super(ctx);
  }

  get meeting(): MeetingState | null {
    return this.state.meeting;
  }

  get isLive(): boolean {
    return this.meeting?.status === 'live';
  }

  /** The player counts as present while sitting at the computer. */
  get isPresent(): boolean {
    return this.state.player.mode === 'computer';
  }

  override update({ gameSeconds }: FrameTime): void {
    if (this.meeting?.day !== this.state.day) this.planDay(this.state.day);
    const meeting = this.meeting;
    if (!meeting || meeting.status === 'done') return;
    const now = this.state.now;

    if (meeting.status === 'scheduled' && now >= meeting.inviteAt) this.invite(meeting);
    if (meeting.status === 'invited' && now >= meeting.startsAt) this.start(meeting);
    if (meeting.status === 'live') this.tickLive(meeting, gameSeconds, now);
  }

  /** Mouse activity while present keeps attention up (throttled, real time). */
  registerActivity(nowMs: number): void {
    if (!this.isLive || !this.isPresent || !this.meeting) return;
    if (nowMs - this.lastActivityMs < this.config.activityCooldownMs) return;
    this.lastActivityMs = nowMs;
    this.meeting.attention = Math.min(100, this.meeting.attention + this.config.activityBoost);
  }

  /** Answers the meeting question. Returns whether the answer was correct, or null if not allowed. */
  answer(optionIndex: number): boolean | null {
    const meeting = this.meeting;
    if (!meeting || meeting.status !== 'live' || !meeting.questionShown || meeting.answered)
      return null;
    const correct = optionIndex === meeting.template.answerIndex;
    meeting.answered = true;
    meeting.attention = Math.max(
      0,
      Math.min(
        100,
        meeting.attention + (correct ? this.config.correctBonus : -this.config.wrongPenalty),
      ),
    );
    this.events.emit('meeting:answer', { correct });
    this.changed();
    return correct;
  }

  private planDay(day: number): void {
    const template = this.templates[(day - 1) % this.templates.length];
    if (!template) return;
    const startsAt = this.state.dayStart(day) + parseClock(this.config.startTime);
    this.state.meeting = {
      id: this.state.nextId('meeting'),
      day,
      template,
      inviteAt: startsAt - minutes(this.config.inviteLeadMinutes),
      startsAt,
      endsAt: startsAt + minutes(this.config.durationMinutes),
      status: 'scheduled',
      attention: this.config.startAttention,
      questionShown: false,
      answered: false,
      result: null,
    };
    // If the session starts after the meeting already ended, skip it.
    if (this.state.now >= this.state.meeting.endsAt) this.state.meeting.status = 'done';
  }

  private invite(meeting: MeetingState): void {
    meeting.status = 'invited';
    const email = {
      id: this.state.nextId('email'),
      subject: `Meeting invite: ${meeting.template.title}`,
      body: `Today at ${this.config.startTime}. Please join from your computer.`,
      unread: true,
      receivedAt: this.state.now,
      link: 'calendar' as const,
    };
    this.state.emails.unshift(email);
    this.events.emit('email:new', email);
    this.events.emit('meeting:invite', meeting);
    this.changed();
  }

  private start(meeting: MeetingState): void {
    meeting.status = 'live';
    this.events.emit('meeting:start', meeting);
    this.changed();
  }

  private tickLive(meeting: MeetingState, gameSeconds: number, now: number): void {
    const c = this.config;
    const baseDrain = this.isPresent ? c.presentDrainPerHour : c.awayDrainPerHour;
    const multiplier = this.state.internetUnstable ? c.unstableDrainMultiplier : 1;
    meeting.attention = Math.max(
      0,
      meeting.attention - baseDrain * multiplier * (gameSeconds / SECONDS_PER_HOUR),
    );

    if (!meeting.questionShown && now - meeting.startsAt >= minutes(c.questionAfterMinutes)) {
      meeting.questionShown = true;
      this.events.emit('meeting:question', meeting);
      this.changed();
    }

    if (now >= meeting.endsAt || meeting.attention <= 0)
      this.finish(meeting, now >= meeting.endsAt);
  }

  private finish(meeting: MeetingState, reachedEnd: boolean): void {
    const c = this.config;
    const success = reachedEnd && meeting.attention > c.passAttention;
    meeting.status = 'done';
    meeting.result = success ? 'success' : 'failed';
    this.state.player.adjust('reputation', success ? c.successReputation : c.failReputation);
    this.state.player.adjust('stress', success ? c.successStress : c.failStress);
    this.events.emit('meeting:end', { success });
    this.changed();
  }
}
