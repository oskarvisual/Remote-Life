/** Shared data shapes for the game simulation (no behaviour, no Phaser, no DOM). */

export type StatKey =
  'stress' | 'energy' | 'food' | 'hydration' | 'reputation' | 'bladder' | 'dirt';

export type PlayerMode =
  | 'idle'
  | 'computer'
  | 'napping'
  | 'caring'
  | 'eating'
  | 'drinking'
  | 'toilet'
  | 'washing-hands'
  | 'showering'
  | 'watching-tv'
  | 'cleaning';

export type ActivityId =
  'nap' | 'care' | 'eat' | 'drink' | 'toilet' | 'wash-hands' | 'shower' | 'watch-tv' | 'clean';

export type CleanZoneId = 'bedroom' | 'bathroom' | 'kitchen';
export type FilthLevel = 1 | 2 | 3 | 4 | 5;

export interface ApartmentFilthState {
  bedroom: number;
  bathroom: number;
  kitchen: number;
  targetZone: CleanZoneId;
}

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

export type BabyLocation = 'crib' | 'bed' | 'carried' | 'loose';
export type BabyDemand = 'none' | 'feed' | 'crawl' | 'sleep';

export type WifeActivity =
  | 'sleeping'
  | 'watching-tv'
  | 'out'
  | 'helping-baby'
  | 'eating'
  | 'drinking'
  | 'toilet'
  | 'washing-hands'
  | 'showering'
  | 'cleaning'
  | 'idle';

export type WifeArgueReason = 'none' | 'hungry' | 'baby-crying';

export interface WifeState {
  stress: number;
  energy: number;
  food: number;
  hydration: number;
  bladder: number;
  dirt: number;
  activity: WifeActivity;
  /** Game timestamp until which the current temporary action (e.g. helping baby, eating, showering) lasts. */
  busyUntil: number;
  arguing: boolean;
  argueReason: WifeArgueReason;
}

export interface BabyState {
  needs: number;
  food: number;
  hydration: number;
  energy: number;
  stress: number;
  dirt: number;
  crying: boolean;
  critical: boolean;
  location: BabyLocation;
  demand: BabyDemand;
  carriedAsleep: boolean;
  cribSleeping: boolean;
  kitchenFire: boolean;
  fireStage: 0 | 1 | 2 | 3;
  fireElapsedSeconds: number;
  modemUnplugged: boolean;
  pcUnplugged: boolean;
}

export interface JobOffer {
  id: string;
  title: string;
  type: string;
  reward: number;
  required: number;
  deadlineMinutes: number;
}

export type OutcomeReason = 'burnout' | 'fired' | 'evicted' | 'kitchen-fire' | 'week-survived';

export interface GameOutcome {
  victory: boolean;
  reason: OutcomeReason;
}

export type FridgeItemKey =
  'meals' | 'fastFood' | 'instantSoup' | 'healthySalad' | 'water' | 'energyDrink' | 'babyMilk';

export interface FridgeState {
  meals: number;
  fastFood: number;
  instantSoup: number;
  healthySalad: number;
  water: number;
  energyDrink: number;
  babyMilk: number;
}

export type EquipmentSlot =
  'bed' | 'crib' | 'desk' | 'chair' | 'tv' | 'sofa' | 'table' | 'stove' | 'fridge' | 'router';

export type TradeSlot = 'apartment' | 'desk' | 'chair';

export type ItemTier = 1 | 2 | 3;

export type MarketCategory = 'all' | 'food' | 'baby' | 'devices' | 'furniture';
