import {
  CareActivity,
  CleanActivity,
  DrinkActivity,
  EatActivity,
  NapActivity,
  ShowerActivity,
  ToiletActivity,
  WashHandsActivity,
  WatchTvActivity,
} from './activities/Activity';
import { BALANCE } from './config/balance';
import type { DifficultyId } from './config/difficulties';
import { EventBus } from './core/EventBus';
import type { GameEvents } from './core/events';
import { GameState } from './core/GameState';
import type { SystemContext } from './core/GameSystem';
import { Random } from './core/Random';
import { SystemManager } from './core/SystemManager';
import { ActivitySystem } from './systems/ActivitySystem';
import { BabySystem } from './systems/BabySystem';
import { ClockSystem } from './systems/ClockSystem';
import { EconomySystem } from './systems/EconomySystem';
import { GameOverSystem } from './systems/GameOverSystem';
import { InternetSystem } from './systems/InternetSystem';
import { JobBoardSystem } from './systems/JobBoardSystem';
import { MarketSystem } from './systems/MarketSystem';
import { MeetingSystem } from './systems/MeetingSystem';
import { NeedsSystem } from './systems/NeedsSystem';
import { ScheduleSystem, type ScheduledEvent } from './systems/ScheduleSystem';
import { TaskSystem } from './systems/TaskSystem';
import { WifeSystem } from './systems/WifeSystem';

export interface GameSessionOptions {
  seed?: number;
  schedule?: readonly ScheduledEvent[];
}

/**
 * Composition root of the simulation: owns the state, the event bus and every
 * system. Has no dependency on Phaser or the DOM, so it runs in unit tests.
 */
export class GameSession {
  readonly events = new EventBus<GameEvents>();
  readonly state: GameState;
  readonly random: Random;

  readonly clock: ClockSystem;
  readonly activities: ActivitySystem;
  readonly tasks: TaskSystem;
  readonly baby: BabySystem;
  readonly wife: WifeSystem;
  readonly needs: NeedsSystem;
  readonly meeting: MeetingSystem;
  readonly internet: InternetSystem;
  readonly economy: EconomySystem;
  readonly market: MarketSystem;
  readonly jobs: JobBoardSystem;
  readonly schedule: ScheduleSystem;
  readonly gameOver: GameOverSystem;

  private readonly systems = new SystemManager();

  constructor(difficulty: DifficultyId, options: GameSessionOptions = {}) {
    this.state = new GameState(difficulty);
    this.random = new Random(options.seed);
    const ctx: SystemContext = { state: this.state, events: this.events, random: this.random };
    const add = this.systems.add.bind(this.systems);

    // Registration order == update order.
    this.clock = add(new ClockSystem(ctx));
    this.schedule = add(new ScheduleSystem(ctx, options.schedule ?? BALANCE.schedule));
    this.activities = add(new ActivitySystem(ctx));
    this.tasks = add(new TaskSystem(ctx));
    this.baby = add(new BabySystem(ctx));
    this.wife = add(new WifeSystem(ctx, this.baby));
    this.needs = add(new NeedsSystem(ctx));
    this.internet = add(new InternetSystem(ctx));
    this.meeting = add(new MeetingSystem(ctx));
    this.economy = add(new EconomySystem(ctx));
    this.market = add(new MarketSystem(ctx, this.baby));
    this.jobs = add(new JobBoardSystem(ctx, this.tasks));
    this.gameOver = add(new GameOverSystem(ctx));

    this.activities
      .register(new NapActivity())
      .register(new CareActivity(this.baby))
      .register(new EatActivity())
      .register(new DrinkActivity())
      .register(new ToiletActivity())
      .register(new ShowerActivity())
      .register(new WashHandsActivity())
      .register(new CleanActivity())
      .register(new WatchTvActivity());

    this.schedule
      .register('task', () => this.tasks.spawn())
      .register('urgent-task', () => this.tasks.spawn(true))
      .register('baby-hungry', () => this.baby.makeHungry())
      .register('internet-outage', () => this.internet.startOutage());
  }

  /** Advances the simulation by one real frame. */
  update(realMs: number): void {
    if (!this.state.isRunning) return;
    const clampedMs = Math.min(Math.max(0, realMs), BALANCE.time.maxFrameMs);
    const gameSeconds = this.clock.advance(clampedMs);
    this.systems.update({ gameSeconds, realMs: clampedMs }, () => this.state.isRunning);
  }

  pause(): void {
    if (this.state.status === 'running') this.state.status = 'paused';
  }

  resume(): void {
    if (this.state.status === 'paused') this.state.status = 'running';
  }

  dispose(): void {
    this.systems.dispose();
    this.events.clear();
  }
}
