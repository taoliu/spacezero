import type { World } from '../../engine/ecs/world';

export interface GameContext {
  world: World;
  eventBus?: unknown;
  tuning?: unknown;
}

export interface System {
  init?(ctx: GameContext): void;
  update(ctx: GameContext, dt: number): void;
}
