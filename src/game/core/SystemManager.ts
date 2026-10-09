import type { FrameTime, GameSystem } from './GameSystem';

/** Keeps systems in registration order and updates them every frame. */
export class SystemManager {
  private readonly systems: GameSystem[] = [];

  add<T extends GameSystem>(system: T): T {
    this.systems.push(system);
    return system;
  }

  /** Looks up a system by class, e.g. `manager.get(TaskSystem)`. */
  get<T extends GameSystem>(type: abstract new (...args: never[]) => T): T {
    const found = this.systems.find((system): system is T => system instanceof type);
    if (!found) throw new Error(`System ${type.name} is not registered`);
    return found;
  }

  update(frame: FrameTime, isRunning: () => boolean): void {
    for (const system of this.systems) {
      // A system may end the game mid-frame (e.g. burnout); stop the rest.
      if (!isRunning()) return;
      system.update(frame);
    }
  }

  dispose(): void {
    for (const system of this.systems.splice(0).reverse()) system.dispose();
  }
}
