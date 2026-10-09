import { BALANCE } from '../config/balance';
import { DIFFICULTIES, type DifficultyId, type DifficultySettings } from '../config/difficulties';
import type {
  BabyState,
  Email,
  GameOutcome,
  JobOffer,
  MeetingState,
  PlayerMode,
  SessionStatus,
  StatKey,
  Task,
} from './models';
import { formatClock, parseClock, SECONDS_PER_DAY } from './time';

const clampStat = (value: number): number => Math.max(0, Math.min(100, value));

export interface PlayerInit {
  money: number;
  stress: number;
  energy: number;
  food: number;
  reputation: number;
}

/** The player's wallet, stats (0–100) and current mode. */
export class PlayerState {
  money: number;
  mode: PlayerMode = 'idle';
  private readonly stats: Record<StatKey, number>;

  constructor(init: PlayerInit) {
    this.money = init.money;
    this.stats = {
      stress: clampStat(init.stress),
      energy: clampStat(init.energy),
      food: clampStat(init.food),
      reputation: clampStat(init.reputation),
    };
  }

  get(key: StatKey): number {
    return this.stats[key];
  }

  /** Adds `amount` to a stat, clamped to 0–100. Returns the new value. */
  adjust(key: StatKey, amount: number): number {
    this.stats[key] = clampStat(this.stats[key] + amount);
    return this.stats[key];
  }

  get isIdle(): boolean {
    return this.mode === 'idle';
  }

  canAfford(amount: number): boolean {
    return this.money >= amount;
  }

  /** Spends money if possible. Returns false (and spends nothing) otherwise. */
  spend(amount: number): boolean {
    if (!this.canAfford(amount)) return false;
    this.money -= amount;
    return true;
  }

  earn(amount: number): void {
    this.money += amount;
  }
}

/**
 * Plain, serialisable simulation state. Systems mutate it; UI and view only read it.
 * Absolute time (`now`) is measured in game seconds since day 1, 00:00.
 */
export class GameState {
  readonly difficulty: DifficultySettings;
  readonly player: PlayerState;

  day = 1;
  secondsOfDay: number;
  /** Real seconds the session has been running (excludes pauses). */
  realElapsed = 0;

  tasks: Task[] = [];
  emails: Email[] = [];
  jobOffers: JobOffer[] = [];
  meeting: MeetingState | null = null;
  readonly baby: BabyState;
  readonly fridge: { meals: number };
  internetUnstableUntil = 0;

  status: SessionStatus = 'running';
  outcome: GameOutcome | null = null;

  private idSequence = 0;

  constructor(difficulty: DifficultyId = 'medium') {
    this.difficulty = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
    this.secondsOfDay = parseClock(BALANCE.time.startTime);
    this.player = new PlayerState({
      money: this.difficulty.money,
      stress: this.difficulty.stress,
      energy: this.difficulty.energy,
      food: BALANCE.player.startFood,
      reputation: BALANCE.player.startReputation,
    });
    this.baby = { needs: BALANCE.baby.startNeeds, crying: false, critical: false };
    this.fridge = { meals: BALANCE.player.startMeals };
  }

  get now(): number {
    return (this.day - 1) * SECONDS_PER_DAY + this.secondsOfDay;
  }

  /** Absolute game time of 00:00 on the given day. */
  dayStart(day: number = this.day): number {
    return (day - 1) * SECONDS_PER_DAY;
  }

  get internetUnstable(): boolean {
    return this.now < this.internetUnstableUntil;
  }

  get isRunning(): boolean {
    return this.status === 'running';
  }

  get unreadEmails(): number {
    return this.emails.filter((email) => email.unread).length;
  }

  timeLabel(): string {
    return `DAY ${this.day} · ${formatClock(this.secondsOfDay)}`;
  }

  nextId(prefix: string): string {
    this.idSequence += 1;
    return `${prefix}-${this.idSequence}`;
  }
}
