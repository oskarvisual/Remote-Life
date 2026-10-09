import { BALANCE } from '../config/balance';
import { TASK_TEMPLATES } from '../config/content';
import { GameSystem, type SystemContext } from '../core/GameSystem';
import type { Task, TaskSpec } from '../core/models';
import { isWithinWindow, minutes, parseClock } from '../core/time';

export type WorkResult = 'progress' | 'done' | 'exhausted' | 'missing';

/** Client tasks: creation, deadlines, work progress and random arrivals. */
export class TaskSystem extends GameSystem {
  private readonly config = BALANCE.tasks;
  private readonly spawnFrom = parseClock(this.config.randomSpawn.from);
  private readonly spawnTo = parseClock(this.config.randomSpawn.to);
  private nextSpawnCheck: number;

  constructor(ctx: SystemContext) {
    super(ctx);
    this.nextSpawnCheck = this.state.now + minutes(this.config.randomSpawn.everyMinutes);
  }

  /** Creates a client task from a random template. */
  spawn(urgent = false): Task | null {
    const template = this.ctx.random.pick(TASK_TEMPLATES);
    const c = this.config;
    return this.add({
      ...template,
      urgent,
      source: 'client',
      required: urgent ? c.urgentWorkUnits : c.workUnits,
      deadlineMinutes: urgent ? c.urgentDeadlineMinutes : c.deadlineMinutes,
      reward: urgent ? c.urgentReward : c.reward,
      penalty: urgent ? c.urgentPenalty : c.penalty,
    });
  }

  /** Adds a task from any source (clients, job board...). Returns null if the queue is full. */
  add(spec: TaskSpec): Task | null {
    if (this.state.tasks.length >= this.config.maxActive) {
      this.notify('Task queue is full — finish something first', 'warn');
      return null;
    }
    const deadline = minutes(spec.deadlineMinutes) * this.state.difficulty.deadlineMultiplier;
    const task: Task = {
      id: this.state.nextId('task'),
      title: spec.title,
      type: spec.type,
      progress: 0,
      required: spec.required,
      dueAt: this.state.now + deadline,
      reward: spec.reward,
      penalty: spec.penalty,
      urgent: spec.urgent,
      source: spec.source,
    };
    this.state.tasks.push(task);
    this.addEmail(task);
    this.events.emit('task:new', task);
    this.changed();
    return task;
  }

  /** One unit of work on a task (one click on "DO WORK"). */
  work(id: string): WorkResult {
    const task = this.state.tasks.find((t) => t.id === id);
    if (!task) return 'missing';
    const { player } = this.state;
    if (player.get('energy') < this.config.workEnergyCost) {
      this.events.emit('needs:exhausted');
      return 'exhausted';
    }
    task.progress += this.state.internetUnstable ? this.config.unstableProgress : 1;
    player.adjust('energy', -this.config.workEnergyCost);
    player.adjust('stress', -this.config.workStressRelief);

    let result: WorkResult = 'progress';
    if (task.progress >= task.required) {
      this.remove(task);
      player.earn(task.reward);
      player.adjust('reputation', this.config.completeReputation);
      this.events.emit('task:done', task);
      result = 'done';
    }
    this.changed();
    return result;
  }

  override update(): void {
    const now = this.state.now;
    for (const task of [...this.state.tasks]) {
      if (now >= task.dueAt) this.fail(task);
    }
    this.spawnRandomly(now);
  }

  private fail(task: Task): void {
    this.remove(task);
    this.state.player.adjust('reputation', -task.penalty);
    this.state.player.adjust('stress', this.config.failStress);
    this.events.emit('task:failed', task);
    this.changed();
  }

  private spawnRandomly(now: number): void {
    const { everyMinutes, chance } = this.config.randomSpawn;
    while (now >= this.nextSpawnCheck) {
      this.nextSpawnCheck += minutes(everyMinutes);
      const inWindow = isWithinWindow(this.state.secondsOfDay, this.spawnFrom, this.spawnTo);
      if (inWindow && this.ctx.random.chance(chance)) this.spawn();
    }
  }

  private remove(task: Task): void {
    this.state.tasks = this.state.tasks.filter((t) => t !== task);
  }

  private addEmail(task: Task): void {
    const email = {
      id: this.state.nextId('email'),
      subject: `New task: ${task.title}`,
      body:
        task.source === 'job'
          ? 'Thanks for accepting the gig!'
          : `Client needs this ${task.urgent ? 'urgently' : 'today'}.`,
      unread: true,
      receivedAt: this.state.now,
      link: 'work' as const,
    };
    this.state.emails.unshift(email);
    this.events.emit('email:new', email);
  }
}
