/** Shared data shapes for the game simulation (no behaviour, no Phaser, no DOM). */

export type StatKey = 'stress' | 'energy' | 'food' | 'reputation';

export type PlayerMode = 'idle' | 'computer' | 'napping' | 'caring' | 'eating';

export type ActivityId = 'nap' | 'care' | 'eat';

export type SessionStatus = 'running' | 'paused' | 'over';

export type NoticeKind = 'info' | 'success' | 'warn' | 'danger';

export type ComputerAppId = 'work' | 'email' | 'calendar' | 'jobs' | 'market' | 'bank';

export interface Task {
  id: string;
  title: string;
  type: string;
  progress: number;
  required: number;
  /** Absolute game time (seconds since day 1, 00:00) when the deadline expires. */
  dueAt: number;
  reward: number;
  penalty: number;
  urgent: boolean;
  source: 'client' | 'job';
}

export interface TaskSpec {
  title: string;
  type: string;
  required: number;
  deadlineMinutes: number;
  reward: number;
  penalty: number;
  urgent: boolean;
  source: Task['source'];
}

export interface Email {
  id: string;
  subject: string;
  body: string;
  unread: boolean;
  receivedAt: number;
  /** Optional app the email links to (e.g. a meeting invitation opens the calendar). */
  link?: ComputerAppId;
}

export interface MeetingTemplate {
  title: string;
  /** Sentence shown in the calendar, followed by the highlighted key fact. */
  briefing: string;
  keyFact: string;
  dialogue: string;
  question: string;
  options: readonly string[];
  answerIndex: number;
}

export type MeetingStatus = 'scheduled' | 'invited' | 'live' | 'done';

export interface MeetingState {
  id: string;
  day: number;
  template: MeetingTemplate;
  inviteAt: number;
  startsAt: number;
  endsAt: number;
  status: MeetingStatus;
  attention: number;
  questionShown: boolean;
  answered: boolean;
  result: 'success' | 'failed' | null;
}

export interface BabyState {
  needs: number;
  crying: boolean;
  critical: boolean;
}

export interface JobOffer {
  id: string;
  title: string;
  type: string;
  reward: number;
  required: number;
  deadlineMinutes: number;
}

export type OutcomeReason = 'burnout' | 'fired' | 'evicted' | 'week-survived';

export interface GameOutcome {
  victory: boolean;
  reason: OutcomeReason;
}
