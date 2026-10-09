import type { ActivityId, Email, GameOutcome, MeetingState, NoticeKind, Task } from './models';

/** Every event that can travel through a session's EventBus, with its payload type. */
export interface GameEvents {
  'clock:tick': { day: number; secondsOfDay: number };
  'day:changed': { day: number };
  'state:changed': void;
  notify: { text: string; kind?: NoticeKind };

  'task:new': Task;
  'task:done': Task;
  'task:failed': Task;
  'email:new': Email;

  'meeting:invite': MeetingState;
  'meeting:start': MeetingState;
  'meeting:question': MeetingState;
  'meeting:answer': { correct: boolean };
  'meeting:end': { success: boolean };

  'baby:crying': void;
  'baby:critical': void;
  'baby:attended': void;

  'needs:starving': void;
  'needs:exhausted': void;

  'internet:problem': { until: number };
  'internet:restored': void;

  'activity:start': { id: ActivityId };
  'activity:end': { id: ActivityId };

  'rent:paid': { amount: number; day: number };
  'rent:missed': { amount: number; day: number };
  'market:purchase': { itemId: string };

  'computer:open': void;
  'computer:close': void;

  'game:over': GameOutcome;
}
