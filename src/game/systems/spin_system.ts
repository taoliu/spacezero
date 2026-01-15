import type { EntityId } from '../../engine/ecs/types';
import { SPIN_COMPONENT } from '../components/basic';
import { TRANSFORM_COMPONENT } from '../components/transform';
import type { GameContext, System } from './types';

export class SpinSystem implements System {
  private readonly entities: EntityId[] = [];

  update(ctx: GameContext, dt: number): void {
    ctx.world.query([TRANSFORM_COMPONENT, SPIN_COMPONENT], this.entities);

    for (const entityId of this.entities) {
      const transform = ctx.world.getComponent(entityId, TRANSFORM_COMPONENT);
      const spin = ctx.world.getComponent(entityId, SPIN_COMPONENT);

      if (!transform || !spin) {
        continue;
      }

      transform.rotation.x += spin.speedX * dt;
      transform.rotation.y += spin.speedY * dt;
      transform.rotation.z += spin.speedZ * dt;
    }
  }
}
