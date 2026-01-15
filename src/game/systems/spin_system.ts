import type { EntityId } from '../../engine/ecs/types';
import { ROTATION_COMPONENT, SPIN_COMPONENT } from '../components/basic';
import type { GameContext, System } from './types';

export class SpinSystem implements System {
  private readonly entities: EntityId[] = [];

  update(ctx: GameContext, dt: number): void {
    ctx.world.query([ROTATION_COMPONENT, SPIN_COMPONENT], this.entities);

    for (const entityId of this.entities) {
      const rotation = ctx.world.getComponent(entityId, ROTATION_COMPONENT);
      const spin = ctx.world.getComponent(entityId, SPIN_COMPONENT);

      if (!rotation || !spin) {
        continue;
      }

      rotation.x += spin.speedX * dt;
      rotation.y += spin.speedY * dt;
      rotation.z += spin.speedZ * dt;
    }
  }
}
