import { DebugEventLogSystem } from './debug_event_log_system';
import { DebugEventPulseSystem } from './debug_event_pulse_system';
import { FlightSystem } from './flight_system';
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
    // Systems read ctx.events (eventBus.peek) and may publish via ctx.eventBus.
    ctx.events = ctx.eventBus.peek();

    for (const system of this.systems) {
      system.update(ctx, dt);
    }

    ctx.eventBus.clear();
  }
}

export const createSystemScheduler = (options: { inputRoot: HTMLElement }): SystemScheduler => {
  // Explicit system ordering lives here.
  // Order: Input -> Flight -> Debug Events -> Spin (placeholder for future gameplay systems).
  const systems: System[] = [
    new InputSystem(options.inputRoot),
    new FlightSystem(),
    new DebugEventPulseSystem(),
    new DebugEventLogSystem(options.inputRoot),
    new SpinSystem(),
  ];
  return new SystemScheduler(systems);
};

export type { GameContext, System };
