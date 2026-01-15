import { Vector3 } from 'three';
import type { EntityId } from '../../../engine/ecs/types';
import { AI_STATE_COMPONENT } from '../../components/ai_state';
import { BLACKBOARD_COMPONENT } from '../../components/blackboard';
import { STEERING_INTENT_COMPONENT } from '../../components/steering_intent';
import { ENEMY_TAG_COMPONENT, PLAYER_TAG_COMPONENT } from '../../components/tags';
import { TRANSFORM_COMPONENT } from '../../components/transform';
import type { EnemyArchetypeDef } from '../../data/schemas';
import type { GameContext, System } from '../types';
import type { AITickScheduler } from './tick_scheduler';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const nextRandomSign = (state: number): { sign: number; nextState: number } => {
  const next = (state * 1103515245 + 12345) >>> 0;
  const sign = next % 2 === 0 ? 1 : -1;
  return { sign, nextState: next };
};

export class SteeringSystem implements System {
  private readonly scheduler: AITickScheduler;
  private readonly enemyEntities: EntityId[] = [];
  private readonly playerEntities: EntityId[] = [];
  private readonly toPlayer = new Vector3();
  private readonly toPlayerDir = new Vector3();
  private readonly tangent = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  private readonly desired = new Vector3();
  private readonly archetypes = new Map<string, EnemyArchetypeDef>();
  private time = 0;

  constructor(scheduler: AITickScheduler) {
    this.scheduler = scheduler;
  }

  update(ctx: GameContext, dt: number): void {
    this.time += dt;
    const tuning = ctx.tuning.ai;
    const interval = 1 / tuning.aiSteeringHz;

    if (this.archetypes.size === 0) {
      for (const archetype of ctx.content.enemies) {
        this.archetypes.set(archetype.id, archetype);
      }
    }

    ctx.world.query([PLAYER_TAG_COMPONENT, TRANSFORM_COMPONENT], this.playerEntities);
    const playerId = this.playerEntities[0];
    if (!playerId) {
      return;
    }
    const playerTransform = ctx.world.getComponent(playerId, TRANSFORM_COMPONENT);
    if (!playerTransform) {
      return;
    }

    ctx.world.query(
      [
        ENEMY_TAG_COMPONENT,
        AI_STATE_COMPONENT,
        BLACKBOARD_COMPONENT,
        STEERING_INTENT_COMPONENT,
        TRANSFORM_COMPONENT,
      ],
      this.enemyEntities,
    );

    for (const entityId of this.enemyEntities) {
      if (!this.scheduler.shouldRun(entityId, 'steering', this.time, interval)) {
        continue;
      }

      const aiState = ctx.world.getComponent(entityId, AI_STATE_COMPONENT);
      const blackboard = ctx.world.getComponent(entityId, BLACKBOARD_COMPONENT);
      const intent = ctx.world.getComponent(entityId, STEERING_INTENT_COMPONENT);
      const transform = ctx.world.getComponent(entityId, TRANSFORM_COMPONENT);

      if (!aiState || !blackboard || !intent || !transform) {
        continue;
      }

      const archetype = this.archetypes.get(aiState.archetypeId);
      if (!archetype) {
        continue;
      }

      this.toPlayer.copy(playerTransform.position).sub(transform.position);
      const distance = this.toPlayer.length();
      const speed = archetype.stats.speed;

      if (distance > 0) {
        this.toPlayerDir.copy(this.toPlayer).multiplyScalar(1 / distance);
      } else {
        this.toPlayerDir.set(0, 0, -1);
      }

      this.desired.set(0, 0, 0);

      switch (aiState.currentAction) {
        case 'Approach': {
          const range = archetype.ai.preferredRange;
          const approachStrength = clamp((distance - range * 0.6) / range, 0, 1);
          this.desired.copy(this.toPlayerDir).multiplyScalar(approachStrength);
          break;
        }
        case 'Orbit': {
          const range = archetype.ai.preferredRange;
          const radialError = clamp((distance - range) / range, -1, 1);
          this.tangent.copy(this.up).cross(this.toPlayerDir).normalize();
          this.desired
            .copy(this.tangent)
            .multiplyScalar(archetype.ai.orbitStrength)
            .addScaledVector(this.toPlayerDir, radialError * tuning.aiOrbitRadialFactor);
          break;
        }
        case 'Evade': {
          const random = nextRandomSign(aiState.rngState);
          aiState.rngState = random.nextState;
          this.tangent.copy(this.up).cross(this.toPlayerDir).normalize();
          this.desired.copy(this.tangent).multiplyScalar(random.sign * 1.2);
          break;
        }
        default: {
          this.desired.copy(this.toPlayerDir);
        }
      }

      if (this.desired.lengthSq() > 1e-4) {
        this.desired.normalize();
      }

      intent.desiredVelocity.copy(this.desired).multiplyScalar(speed);
    }
  }
}
