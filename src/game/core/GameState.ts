import { BALANCE } from '../config/balance';
import { DIFFICULTIES, type DifficultyId, type DifficultySettings } from '../config/difficulties';
import type {
  ApartmentFilthState,
  BabyState,
  CleanZoneId,
  Email,
  EquipmentSlot,
  FilthLevel,
  FridgeState,
  GameOutcome,
  ItemTier,
  JobOffer,
  MeetingState,
  PlayerMode,
  SessionStatus,
  StatKey,
  Task,
  WifeState,
} from './models';
import { formatClock, parseClock, SECONDS_PER_DAY } from './time';

const clampStat = (value: number): number => Math.max(0, Math.min(100, value));

export interface PlayerInit {
  money: number;
  stress: number;
  energy: number;
  food: number;
  hydration?: number;
  reputation: number;
  bladder?: number;
  dirt?: number;
}

/** The player's wallet, stats (0–100) and current mode. */
export class PlayerState {
  money: number;
  mode: PlayerMode = 'idle';
  unwashedHands = false;
  private readonly stats: Record<StatKey, number>;

  constructor(init: PlayerInit) {
    this.money = init.money;
    this.stats = {
      stress: clampStat(init.stress),
      energy: clampStat(init.energy),
      food: clampStat(init.food),
      hydration: clampStat(init.hydration ?? BALANCE.player.startHydration),
      reputation: clampStat(init.reputation),
      bladder: clampStat(init.bladder ?? BALANCE.player.startBladder),
      dirt: clampStat(init.dirt ?? BALANCE.player.startDirt),
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

  /** Hygiene level: 1 = clean, 2 = smelly (>=40), 3 = flies swarming (>=75). */
  get dirtLevel(): 1 | 2 | 3 {
    const dirt = this.stats.dirt;
    if (dirt >= BALANCE.needs.dirtFliesThreshold) return 3;
    if (dirt >= BALANCE.needs.dirtSmellThreshold) return 2;
    return 1;
  }

  /** Bladder urgency level: 1 = normal, 2 = urgent (>=60), 3 = critical emergency (>=85). */
  get bladderLevel(): 1 | 2 | 3 {
    const bladder = this.stats.bladder;
    if (bladder >= BALANCE.needs.bladderCriticalThreshold) return 3;
    if (bladder >= BALANCE.needs.bladderUrgentThreshold) return 2;
    return 1;
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
  readonly wife: WifeState;
  readonly baby: BabyState;
  readonly fridge: FridgeState;
  readonly filth: ApartmentFilthState;
  apartmentTier: ItemTier;
  readonly equipment: Record<EquipmentSlot, ItemTier | null>;
  internetUnstableUntil = 0;

  /** Rent & Eviction state */
  rentDue = false;
  evictionDaysLeft = 5;
  lastPaidRentCycle = 0;

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
    this.wife = {
      stress: BALANCE.wife.startStress,
      energy: BALANCE.wife.startEnergy,
      food: BALANCE.wife.startFood,
      hydration: BALANCE.wife.startHydration,
      bladder: BALANCE.wife.startBladder,
      dirt: BALANCE.wife.startDirt,
      activity: this.difficulty.id === 'hard' ? 'sleeping' : 'watching-tv',
      busyUntil: 0,
      arguing: false,
      argueReason: 'none',
    };
    this.baby = {
      needs: BALANCE.baby.startNeeds,
      food: BALANCE.baby.startFood,
      hydration: BALANCE.baby.startHydration,
      energy: BALANCE.baby.startEnergy,
      stress: BALANCE.baby.startStress,
      dirt: BALANCE.baby.startDirt,
      crying: false,
      critical: false,
      location: 'crib',
      demand: 'none',
      carriedAsleep: false,
      cribSleeping: false,
      kitchenFire: false,
      fireStage: 0,
      fireElapsedSeconds: 0,
      modemUnplugged: false,
      pcUnplugged: false,
    };
    this.fridge = {
      meals: BALANCE.player.startMeals,
      fastFood: 1,
      instantSoup: 2,
      healthySalad: 1,
      water: 3,
      energyDrink: 1,
      babyMilk: 3,
    };
    this.filth = {
      bedroom: 0,
      bathroom: 0,
      kitchen: 0,
      targetZone: 'kitchen',
    };

    const startTier: ItemTier =
      this.difficulty.id === 'hard' ? 1 : this.difficulty.id === 'medium' ? 2 : 3;
    this.apartmentTier = startTier;
    this.equipment = {
      bed: startTier,
      crib: startTier,
      desk: startTier,
      chair: startTier,
      tv: startTier,
      sofa: startTier,
      table: startTier === 1 ? null : startTier,
      stove: startTier,
      fridge: startTier,
      router: startTier,
    };
  }

  /**
   * Maps a room's raw filth (0-100) to a 5-stage filth level:
   * - Level 1 (< 25): Clean (trash-level01)
   * - Level 2 (25-47): Dirty trash can (trash-level02)
   * - Level 3 (48-67): Overflowing trash can (trash-level03)
   * - Level 4 (68-83): Poop in bathroom + severe filth
   * - Level 5 (>= 84): Trash bags scattered across rooms
   */
  getZoneFilthLevel(zone: CleanZoneId): FilthLevel {
    const val = this.filth[zone];
    if (val >= 84) return 5;
    if (val >= 68) return 4;
    if (val >= 48) return 3;
    if (val >= 25) return 2;
    return 1;
  }

  get maxFilthLevel(): FilthLevel {
    return Math.max(
      this.getZoneFilthLevel('bedroom'),
      this.getZoneFilthLevel('bathroom'),
      this.getZoneFilthLevel('kitchen'),
    ) as FilthLevel;
  }

  get totalFoodStock(): number {
    const f = this.fridge;
    return f.meals + f.fastFood + f.instantSoup + f.healthySalad;
  }

  get totalDrinkStock(): number {
    const f = this.fridge;
    return f.water + f.energyDrink;
  }

  get now(): number {
    return (this.day - 1) * SECONDS_PER_DAY + this.secondsOfDay;
  }

  /** Absolute game time of 00:00 on the given day. */
  dayStart(day: number = this.day): number {
    return (day - 1) * SECONDS_PER_DAY;
  }

  get internetUnstable(): boolean {
    return this.baby.modemUnplugged || this.now < this.internetUnstableUntil;
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
