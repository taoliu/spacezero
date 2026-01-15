import type { GameEvent } from '../events/events';
import type { GameContext, System } from './types';

export class DebugEventPulseSystem implements System {
  private timer = 0;
  private sequence = 0;
  private readonly interval = 1.2;

  update(ctx: GameContext, dt: number): void {
    this.timer += dt;

    if (this.timer < this.interval) {
      return;
    }

    this.timer -= this.interval;
    this.sequence += 1;

    const event: GameEvent = {
      type: 'StageStarted',
      stageId: `debug-${this.sequence}`,
    };

    ctx.eventBus.publish(event);
  }
}
