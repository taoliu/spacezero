import type { World } from '../../engine/ecs/world';
import type { EventBus } from '../events/bus';
import type { GameEvent } from '../events/events';
import type { tuning } from '../tuning';

export interface GameContext {
  world: World;
  eventBus: EventBus;
  events: ReadonlyArray<GameEvent>;
  tuning: typeof tuning;
}

export interface System {
  init?(ctx: GameContext): void;
  update(ctx: GameContext, dt: number): void;
}
