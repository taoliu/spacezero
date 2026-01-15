import { Vector3 } from 'three';
import type { EntityId } from '../../../engine/ecs/types';
import { STEERING_INTENT_COMPONENT } from '../../components/steering_intent';
import { ENEMY_TAG_COMPONENT } from '../../components/tags';
import { TRANSFORM_COMPONENT } from '../../components/transform';
import { VELOCITY_COMPONENT } from '../../components/velocity';
import type { GameContext, System } from '../types';

const expDecay = (rate: number, dt: number): number => {
  return 1 - Math.exp(-rate * dt);
};

export class EnemyMovementSystem implements System {
  private readonly enemyEntities: EntityId[] = [];
  private readonly temp = new Vector3();

  update(ctx: GameContext, dt: number): void {
    const tuning = ctx.tuning.ai;
    const alpha = expDecay(tuning.aiMoveDamping, dt);

    ctx.world.query(
      [ENEMY_TAG_COMPONENT, TRANSFORM_COMPONENT, VELOCITY_COMPONENT, STEERING_INTENT_COMPONENT],
      this.enemyEntities,
    );

    for (const entityId of this.enemyEntities) {
      const transform = ctx.world.getComponent(entityId, TRANSFORM_COMPONENT);
      const velocity = ctx.world.getComponent(entityId, VELOCITY_COMPONENT);
      const intent = ctx.world.getComponent(entityId, STEERING_INTENT_COMPONENT);

      if (!transform || !velocity || !intent) {
        continue;
      }

      velocity.linear.lerp(intent.desiredVelocity, alpha);
      transform.position.addScaledVector(velocity.linear, dt);

      if (velocity.linear.lengthSq() > 0.01) {
        this.temp.copy(velocity.linear).normalize();
        const yaw = Math.atan2(-this.temp.x, -this.temp.z);
        const yawDelta = yaw - transform.rotation.y;
        transform.rotation.y += yawDelta * Math.min(1, tuning.aiTurnRate * dt);
      }
    }
  }
}
