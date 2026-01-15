import { InputSystem } from './input_system';
import { SpinSystem } from './spin_system';
import type { GameContext, System } from './types';

export class SystemScheduler {
  private readonly systems: System[];

  constructor(systems: System[]) {
    this.systems = systems;
  }

  init(ctx: GameContext): void {
    for (const system of this.systems) {
      system.init?.(ctx);
    }
  }

  update(ctx: GameContext, dt: number): void {
    for (const system of this.systems) {
      system.update(ctx, dt);
    }
  }
}

export const createSystemScheduler = (options: { inputRoot: HTMLElement }): SystemScheduler => {
  // Explicit system ordering lives here.
  // Order: Input -> Spin (placeholder for future gameplay systems).
  const systems: System[] = [new InputSystem(options.inputRoot), new SpinSystem()];
  return new SystemScheduler(systems);
};

export type { GameContext, System };
