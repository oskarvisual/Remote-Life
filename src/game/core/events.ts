import type {
  ActivityId,
  Email,
  EquipmentSlot,
  GameOutcome,
  ItemTier,
  MeetingState,
  NoticeKind,
  Task,
} from './models';

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
  'needs:thirsty': void;
  'needs:exhausted': void;
  'needs:bladder-urgent': void;
  'needs:bladder-critical': void;
  'needs:smelly': void;
  'needs:flies': void;

  'internet:problem': { until: number };
  'internet:restored': void;

  'activity:start': { id: ActivityId };
  'activity:end': { id: ActivityId };

  'rent:paid': { amount: number; day: number };
  'rent:missed': { amount: number; day: number };
  'market:purchase': { itemId: string };
  'equipment:changed': { slot: EquipmentSlot; level: ItemTier | null };
  'apartment:changed': { tier: ItemTier };

  'computer:open': void;
  'computer:close': void;
  'fridge:open': void;
  'fridge:close': void;

  'input:virtual': {
    key: 'left' | 'right' | 'interact' | 'baby' | 'clean' | 'drink';
    pressed: boolean;
  };
  'ui:actions': {
    primaryLabel: string | null;
    secondaryLabel: string | null;
    canClean: boolean;
    canDrink: boolean;
  };

  'game:over': GameOutcome;
}
